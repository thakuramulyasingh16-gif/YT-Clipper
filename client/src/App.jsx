import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import Header from './components/Header';
import UrlInput from './components/UrlInput';
import VideoPreview from './components/VideoPreview';
import ConfigPanel from './components/ConfigPanel';
import ProgressTracker from './components/ProgressTracker';
import ClipsGrid from './components/ClipsGrid';
import Toast from './components/Toast';
import { fetchMetadata, createClipJob, getJobStatus, getStreamUrl } from './services/api';
import { Sparkles, Scissors, Zap, ShieldCheck, Heart } from 'lucide-react';

const YOUTUBE_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|shorts\/)|youtu\.be\/)[a-zA-Z0-9_-]{11}/;

export default function App() {
  const [url, setUrl] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [metadata, setMetadata] = useState(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [metadataError, setMetadataError] = useState(null);

  const [config, setConfig] = useState({
    numClips: 3,
    clipDuration: 30,
    prompt: '',
    aspectRatio: '9:16',
    framing: 'blur',
    highlightColor: 'yellow',
    fontSize: 70,
  });

  const [activeJob, setActiveJob] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const eventSourceRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  // Validate URL on change
  useEffect(() => {
    const valid = YOUTUBE_REGEX.test(url.trim());
    setIsValidUrl(valid);
    if (!url.trim()) {
      setMetadataError(null);
    }
  }, [url]);

  // Trigger metadata fetch on valid URL paste
  const handleFetchMetadata = async () => {
    if (!isValidUrl || isLoadingMetadata) return;

    setIsLoadingMetadata(true);
    setMetadataError(null);

    try {
      const data = await fetchMetadata(url.trim());
      if (data && data.metadata) {
        setMetadata(data.metadata);
      } else {
        setMetadataError("Could not retrieve video information. Please verify the URL.");
      }
    } catch (err) {
      console.error(err);
      setMetadataError(err.response?.data?.error || "Failed to fetch video details. Ensure video is public.");
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  // Launch Clip Generation Job
  const handleStartGenerate = async () => {
    if (!metadata || isProcessing) return;

    setIsProcessing(true);
    setMetadataError(null);

    try {
      const payload = {
        url: metadata.url || url.trim(),
        ...config,
      };

      const result = await createClipJob(payload);
      if (result && result.jobId) {
        setActiveJob(result.job);
        setupProgressTracking(result.jobId);
        showToast("Processing started! Analyzing highlights and burning subtitles...");
      }
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
      setMetadataError(err.response?.data?.error || "Failed to start generation job.");
    }
  };

  // SSE and Polling tracking setup
  const setupProgressTracking = (jobId) => {
    // 1. Clean up any prior listeners
    cleanupTracking();

    // 2. Try Server-Sent Events (SSE)
    try {
      const streamUrl = getStreamUrl(jobId);
      const es = new EventSource(streamUrl);
      eventSourceRef.current = es;

      es.onmessage = (event) => {
        try {
          const updatedJob = JSON.parse(event.data);
          setActiveJob(updatedJob);

          if (updatedJob.status === 'completed') {
            setIsProcessing(false);
            cleanupTracking();
            triggerCelebration();
            showToast("All clips successfully generated! Enjoy your watermark-free shorts.");
          } else if (updatedJob.status === 'failed') {
            setIsProcessing(false);
            cleanupTracking();
          }
        } catch (e) {
          console.error("SSE parse error", e);
        }
      };

      es.onerror = () => {
        console.warn("SSE connection interrupted. Falling back to HTTP polling.");
        es.close();
        startPolling(jobId);
      };
    } catch (err) {
      startPolling(jobId);
    }
  };

  const startPolling = (jobId) => {
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const data = await getJobStatus(jobId);
        if (data && data.job) {
          setActiveJob(data.job);
          if (data.job.status === 'completed') {
            setIsProcessing(false);
            cleanupTracking();
            triggerCelebration();
            showToast("Clips ready! Download your videos below.");
          } else if (data.job.status === 'failed') {
            setIsProcessing(false);
            cleanupTracking();
          }
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    }, 2500);
  };

  const cleanupTracking = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => cleanupTracking();
  }, []);

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // Ignored
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Navigation Header */}
      <Header />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
        {/* Hero Section */}
        <section className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs font-semibold shadow-inner">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Short-Form Video Automation</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-display tracking-tight text-white leading-tight">
            Turn Any YouTube Video into <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-purple-300 to-cyan-400">Viral Shorts</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Automatically extract high-energy moments, crop into 9:16 vertical shorts, and burn dynamic word-by-word subtitles. Completely watermark-free.
          </p>
        </section>

        {/* Input & Metadata Section */}
        <section className="max-w-4xl mx-auto space-y-6">
          <UrlInput
            url={url}
            setUrl={setUrl}
            onFetch={handleFetchMetadata}
            isLoading={isLoadingMetadata}
            isValid={isValidUrl}
            error={metadataError}
          />

          {metadata && (
            <VideoPreview metadata={metadata} />
          )}
        </section>

        {/* Configuration Studio (Visible once metadata fetched or user enters URL) */}
        {metadata && (
          <section className="max-w-4xl mx-auto">
            <ConfigPanel
              config={config}
              onChange={setConfig}
              onSubmit={handleStartGenerate}
              isProcessing={isProcessing}
            />
          </section>
        )}

        {/* Live Progress Tracker */}
        {activeJob && (
          <section className="max-w-4xl mx-auto">
            <ProgressTracker job={activeJob} />
          </section>
        )}

        {/* Generated Clips Output Grid */}
        {activeJob && activeJob.clips && activeJob.clips.length > 0 && (
          <section className="max-w-6xl mx-auto pt-4">
            <ClipsGrid clips={activeJob.clips} onNotify={showToast} />
          </section>
        )}

        {/* Features & Value Props */}
        <section className="max-w-5xl mx-auto pt-12 pb-6 border-t border-white/5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center sm:text-left">
            <div className="glass-card p-5 rounded-2xl border border-white/5 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20 flex items-center justify-center mb-3">
                <Scissors className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white">Smart Highlight Detection</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Heuristic & NLP engine identifies emotional hooks, punchlines, and question-answer peaks without dead air.
              </p>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-white/5 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center mb-3">
                <Zap className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white">Dynamic Animated Captions</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Alex Hormozi / TikTok word-by-word karaoke highlighting with high-contrast outlines and bold typography.
              </p>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-white/5 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white">100% Watermark Free</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Direct MP4 file downloads encoded with optimal H.264 settings for instant posting to Shorts, Reels & TikTok.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Floating Toast Notification */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />

      {/* Footer */}
      <footer className="w-full border-t border-white/10 bg-surface-darkest/90 py-6 mt-16 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-white">YT-Clipper</span>
            <span>— AI Video Short Form Generator</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Engineered with FFmpeg, Python & React</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
