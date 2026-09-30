import React from 'react';
import { Film, Scissors, Sparkles, Github, Zap } from 'lucide-react';

export default function Header() {
  return (
    <header className="w-full border-b border-white/10 bg-surface-darkest/80 backdrop-blur-xl sticky top-0 z-50 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3.5">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-brand-600 via-indigo-500 to-cyan-400 rounded-xl blur-sm opacity-75 group-hover:opacity-100 transition duration-500 group-hover:duration-200"></div>
            <div className="relative w-11 h-11 bg-surface-card border border-white/10 rounded-xl flex items-center justify-center text-white shadow-xl">
              <Scissors className="w-5 h-5 text-brand-400 group-hover:rotate-12 transition-transform duration-300" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight font-display text-white">
                YT<span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-purple-300 to-cyan-400">-Clipper</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-brand-500/10 text-brand-300 border border-brand-500/30">
                <Sparkles className="w-2.5 h-2.5" /> AI Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Turn YouTube videos into viral 9:16 Shorts with dynamic word captions
            </p>
          </div>
        </div>

        {/* Action Badges & GitHub Link */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              No Watermark
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Zap className="w-3 h-3" />
              Hormozi Captions
            </span>
          </div>

          <a
            href="https://github.com/thakuramulyasingh16-gif/YT-Clipper"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-surface-panel hover:bg-surface-hover border border-white/10 hover:border-brand-500/50 text-slate-300 hover:text-white text-xs font-medium transition-all shadow-sm"
          >
            <Github className="w-4 h-4" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </div>
    </header>
  );
}
