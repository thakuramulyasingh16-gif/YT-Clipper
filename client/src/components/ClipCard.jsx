import React, { useRef, useState } from 'react';
import {
  Download,
  Play,
  Pause,
  Copy,
  Check,
  ExternalLink,
  Flame,
  Clock,
  Sparkles,
  Share2
} from 'lucide-react';
import { getDownloadUrl } from '../services/api';

function formatSecs(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export default function ClipCard({ clip, index, onNotify }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleCopyLink = () => {
    const fullUrl = `${window.location.origin}${clip.url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    if (onNotify) onNotify("Clip link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const isVertical = clip.aspectRatio === '9:16';
  const isSquare = clip.aspectRatio === '1:1';

  return (
    <div className="glass-card rounded-2xl overflow-hidden border border-white/10 shadow-xl flex flex-col justify-between group transition-all duration-300">
      {/* Video Container */}
      <div
        className={`relative bg-black w-full overflow-hidden flex items-center justify-center ${
          isVertical ? 'aspect-[9/16] max-h-[520px]' : isSquare ? 'aspect-square' : 'aspect-video'
        }`}
      >
        <video
          ref={videoRef}
          src={clip.url}
          playsInline
          loop
          className="w-full h-full object-contain cursor-pointer"
          onClick={togglePlay}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        {/* Play/Pause Button Overlay on Hover or Pause */}
        <div
          onClick={togglePlay}
          className={`absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity cursor-pointer ${
            isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
          }`}
        >
          <div className="w-14 h-14 rounded-full bg-brand-500/80 hover:bg-brand-500 text-white flex items-center justify-center shadow-glow-purple backdrop-blur-md transition-transform duration-200 hover:scale-110">
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current translate-x-0.5" />
            )}
          </div>
        </div>

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-black/70 backdrop-blur-md text-white border border-white/20 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            Score: {clip.score || '9.2'}
          </span>

          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/80 backdrop-blur-md text-white border border-emerald-400/40">
            No Watermark
          </span>
        </div>

        {/* Bottom Time Stamp Pill */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-black/80 backdrop-blur-md text-slate-200 border border-white/10 flex items-center gap-1">
            <Clock className="w-3 h-3 text-cyan-400" />
            {formatSecs(clip.start)} - {formatSecs(clip.end)} ({clip.duration}s)
          </span>
        </div>
      </div>

      {/* Card Details & Action Buttons */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center gap-1.5 text-brand-400 text-xs font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Clip #{index + 1}</span>
          </div>
          <h4 className="text-base font-bold text-white line-clamp-2 leading-snug group-hover:text-brand-300 transition-colors">
            {clip.title}
          </h4>
          <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
            {clip.reason}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t border-white/5 space-y-2">
          {/* Main 1-Click Download Button */}
          <a
            href={getDownloadUrl(clip.filename)}
            download={clip.filename}
            className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Download MP4</span>
          </a>

          {/* Secondary Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex-1 py-1.5 px-3 rounded-lg bg-surface-card hover:bg-surface-hover border border-white/10 hover:border-white/20 text-slate-300 hover:text-white text-xs font-medium transition-all flex items-center justify-center gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>

            <a
              href={clip.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-surface-card hover:bg-surface-hover border border-white/10 hover:border-white/20 text-slate-400 hover:text-white transition-all"
              title="Open video in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
