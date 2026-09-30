import React from 'react';
import { Film, Sparkles, Download, CheckCircle2 } from 'lucide-react';
import ClipCard from './ClipCard';

export default function ClipsGrid({ clips, onNotify }) {
  if (!clips || clips.length === 0) return null;

  return (
    <section className="w-full space-y-6 animate-fadeIn">
      {/* Grid Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white font-display flex items-center gap-2">
              Generated Viral Clips
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                {clips.length} {clips.length === 1 ? 'Video' : 'Videos'} Ready
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Ready for TikTok, YouTube Shorts & Instagram Reels with dynamic subtitles.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            100% Watermark Free
          </span>
        </div>
      </div>

      {/* Grid of Clip Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {clips.map((clip, index) => (
          <ClipCard
            key={clip.id || index}
            clip={clip}
            index={index}
            onNotify={onNotify}
          />
        ))}
      </div>
    </section>
  );
}
