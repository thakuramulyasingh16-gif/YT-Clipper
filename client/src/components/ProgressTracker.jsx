import React, { useState } from 'react';
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Terminal,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Scissors,
  FileText,
  Video
} from 'lucide-react';

const STAGES = [
  { key: 'metadata', label: 'Video Info', icon: Video, minProgress: 10 },
  { key: 'transcript', label: 'Transcript', icon: FileText, minProgress: 25 },
  { key: 'highlights', label: 'AI Highlights', icon: Sparkles, minProgress: 40 },
  { key: 'rendering', label: 'Cropping & Captions', icon: Scissors, minProgress: 50 },
  { key: 'complete', label: 'Ready', icon: CheckCircle2, minProgress: 100 },
];

export default function ProgressTracker({ job }) {
  const [showLogs, setShowLogs] = useState(false);

  if (!job) return null;

  const progress = Math.min(Math.max(job.progress || 0, 0), 100);
  const isFailed = job.status === 'failed';
  const isCompleted = job.status === 'completed';

  return (
    <div className="w-full glass-panel rounded-2xl p-5 sm:p-6 border border-white/10 shadow-2xl space-y-5 animate-fadeIn">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400">
            {isFailed ? (
              <AlertCircle className="w-5 h-5 text-rose-400" />
            ) : isCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <Loader2 className="w-5 h-5 text-brand-400 animate-spin" />
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              {job.step || 'Processing Video...'}
              {isCompleted && (
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Completed
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {job.message || 'Please wait while the processing pipeline runs...'}
            </p>
          </div>
        </div>

        {/* Progress Percentage Pill */}
        <div className="text-right">
          <span className="text-2xl font-black font-display text-white">
            {progress}%
          </span>
        </div>
      </div>

      {/* Animated Gradient Progress Bar */}
      <div className="w-full bg-slate-900 rounded-full h-3 p-0.5 overflow-hidden border border-white/10 relative">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden ${
            isFailed
              ? 'bg-rose-500'
              : 'bg-gradient-to-r from-brand-500 via-indigo-400 to-cyan-400 shadow-glow-purple'
          }`}
          style={{ width: `${progress}%` }}
        >
          {/* Shimmer effect */}
          {!isCompleted && !isFailed && (
            <div className="absolute inset-0 bg-white/20 animate-shimmer" />
          )}
        </div>
      </div>

      {/* Stage Stepper Icons */}
      <div className="grid grid-cols-5 gap-1 pt-1">
        {STAGES.map((stg) => {
          const Icon = stg.icon;
          const isPassed = progress >= stg.minProgress;
          const isCurrent = progress < stg.minProgress && progress >= (stg.minProgress - 25);

          return (
            <div key={stg.key} className="flex flex-col items-center text-center">
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border transition-all ${
                  isPassed
                    ? 'bg-brand-500/20 border-brand-500 text-brand-300'
                    : isCurrent
                    ? 'bg-white/10 border-white/40 text-white animate-pulse'
                    : 'bg-slate-900 border-white/5 text-slate-600'
                }`}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <span
                className={`text-[10px] sm:text-[11px] font-medium mt-1.5 line-clamp-1 ${
                  isPassed ? 'text-slate-200' : 'text-slate-600'
                }`}
              >
                {stg.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Failure Message */}
      {isFailed && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          <p className="font-bold">Error during processing:</p>
          <p className="mt-1 font-mono text-[11px] break-words">{job.error}</p>
        </div>
      )}

      {/* Expandable Live Logs / Terminal Drawer */}
      <div className="border-t border-white/5 pt-3">
        <button
          type="button"
          onClick={() => setShowLogs(!showLogs)}
          className="flex items-center justify-between w-full text-xs text-slate-400 hover:text-slate-200 transition-colors py-1"
        >
          <div className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-brand-400" />
            <span>Live Processing Terminal Logs ({job.logs?.length || 0} events)</span>
          </div>
          {showLogs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showLogs && (
          <div className="mt-2.5 p-3 rounded-xl bg-black/80 border border-white/10 max-h-48 overflow-y-auto font-mono text-[11px] text-slate-300 space-y-1">
            {job.logs && job.logs.length > 0 ? (
              job.logs.map((log, i) => (
                <div key={i} className="leading-relaxed hover:bg-white/5 px-1 rounded">
                  <span className="text-slate-500 select-none mr-2">›</span>
                  {log}
                </div>
              ))
            ) : (
              <div className="text-slate-500 italic">No logs generated yet.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
