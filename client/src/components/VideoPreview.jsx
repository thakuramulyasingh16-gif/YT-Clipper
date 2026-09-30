import React from 'react';
import { Play, Clock, User, ExternalLink, CheckCircle2, Film } from 'lucide-react';

export default function VideoPreview({ metadata }) {
  if (!metadata) return null;

  return (
    <div className="w-full glass-panel rounded-2xl p-4 sm:p-5 border border-white/10 shadow-xl transition-all animate-fadeIn">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        {/* Thumbnail with overlay duration */}
        <div className="relative w-full sm:w-56 aspect-video sm:aspect-[16/10] rounded-xl overflow-hidden bg-slate-900 border border-white/10 shrink-0 group">
          <img
            src={metadata.thumbnail}
            alt={metadata.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              // Fallback if maxresdefault doesn't exist
              e.target.src = `https://img.youtube.com/vi/${metadata.videoId}/hqdefault.jpg`;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          
          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[11px] font-semibold text-white border border-white/20">
              <Clock className="w-3 h-3 text-brand-400" />
              {metadata.durationFormatted}
            </span>

            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 backdrop-blur-md text-[11px] font-semibold text-emerald-300 border border-emerald-500/30">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Ready
            </span>
          </div>
        </div>

        {/* Video Details */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Film className="w-2.5 h-2.5" />
                Source Video
              </span>
              {metadata.author && (
                <span className="text-xs text-slate-400 flex items-center gap-1 truncate">
                  <User className="w-3 h-3" />
                  {metadata.author}
                </span>
              )}
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white line-clamp-2 leading-snug group-hover:text-brand-300 transition-colors">
              {metadata.title}
            </h3>
          </div>

          <div className="mt-3.5 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            {/* Audio Waveform Effect */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5 h-3">
                <span className="w-1 bg-brand-400 rounded-full h-2 animate-pulse"></span>
                <span className="w-1 bg-cyan-400 rounded-full h-3 animate-pulse delay-75"></span>
                <span className="w-1 bg-purple-400 rounded-full h-1.5 animate-pulse delay-150"></span>
                <span className="w-1 bg-emerald-400 rounded-full h-2.5 animate-pulse delay-100"></span>
              </div>
              <span className="text-slate-300 font-medium text-[11px]">Captions & audio stream verified</span>
            </div>

            <a
              href={metadata.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors text-xs font-medium"
            >
              <span>Watch on YouTube</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
