import React from 'react';
import {
  Smartphone,
  Tv,
  Square,
  Sparkles,
  Zap,
  Sliders,
  Palette,
  Layers,
  Clock,
  Scissors
} from 'lucide-react';

const ASPECT_RATIOS = [
  { id: '9:16', label: '9:16 Vertical', desc: 'Shorts, Reels, TikTok', icon: Smartphone },
  { id: '16:9', label: '16:9 Landscape', desc: 'Standard YouTube', icon: Tv },
  { id: '1:1', label: '1:1 Square', desc: 'Instagram & Feed', icon: Square },
];

const DURATIONS = [
  { value: 15, label: '15s', tag: 'Fast Hook' },
  { value: 30, label: '30s', tag: 'Optimal TikTok' },
  { value: 60, label: '60s', tag: 'Full Short' },
  { value: 90, label: '90s', tag: 'Storyline' },
];

const HIGHLIGHT_COLORS = [
  { id: 'yellow', label: 'Neon Yellow', bg: 'bg-[#FFDF00]', text: 'text-black' },
  { id: 'green', label: 'Electric Green', bg: 'bg-[#00FF66]', text: 'text-black' },
  { id: 'cyan', label: 'Vibrant Cyan', bg: 'bg-[#00F0FF]', text: 'text-black' },
  { id: 'pink', label: 'Hot Pink', bg: 'bg-[#FF007F]', text: 'text-white' },
  { id: 'orange', label: 'Sunset Orange', bg: 'bg-[#FF7700]', text: 'text-white' },
];

const PROMPT_SUGGESTIONS = [
  "🔥 Most engaging viral hooks",
  "💡 Key actionable takeaways",
  "😂 Funniest & high energy moments",
  "⚡ Strong debate & controversial points"
];

export default function ConfigPanel({ config, onChange, onSubmit, isProcessing }) {
  const handleChange = (key, value) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="w-full glass-panel rounded-2xl p-5 sm:p-7 border border-white/10 shadow-2xl space-y-7 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Clip Generation Studio
            </h3>
            <p className="text-xs text-slate-400">
              Configure aspect ratio, duration, and TikTok-style subtitles
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
          No Watermarks
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-7">
        {/* Left Column: Ratio, Framing & Subtitles */}
        <div className="space-y-6">
          {/* 1. Aspect Ratio */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2.5">
              1. Aspect Ratio
            </label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {ASPECT_RATIOS.map((item) => {
                const Icon = item.icon;
                const isSelected = config.aspectRatio === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleChange('aspectRatio', item.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-brand-500/15 border-brand-500 text-white shadow-glow-purple scale-[1.02]'
                        : 'bg-surface-card hover:bg-surface-hover border-white/5 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-brand-400' : 'text-slate-400'}`} />
                    <span className="text-xs font-bold leading-tight">{item.label}</span>
                    <span className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{item.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Framing Style (For 9:16) */}
          {config.aspectRatio === '9:16' && (
            <div className="p-3.5 rounded-xl bg-surface-card/60 border border-white/5 space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Framing & Background
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleChange('framing', 'blur')}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border text-left transition-all ${
                    config.framing === 'blur'
                      ? 'bg-brand-500/20 border-brand-400 text-white'
                      : 'bg-white/5 border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="font-bold block">Blurred Background</span>
                  <span className="text-[10px] text-slate-400">Podcasts, no cutoff</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleChange('framing', 'crop')}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border text-left transition-all ${
                    config.framing === 'crop'
                      ? 'bg-brand-500/20 border-brand-400 text-white'
                      : 'bg-white/5 border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="font-bold block">Smart Center Crop</span>
                  <span className="text-[10px] text-slate-400">Fills full screen</span>
                </button>
              </div>
            </div>
          )}

          {/* 3. Subtitle Word-by-Word Highlight Color */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-brand-400" />
                Hormozi Caption Highlight Color
              </label>
              <span className="text-[11px] text-slate-400 font-mono">Dynamic Karaoke</span>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {HIGHLIGHT_COLORS.map((col) => {
                const isSelected = config.highlightColor === col.id;
                return (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => handleChange('highlightColor', col.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-white/10 border-white/40 text-white ring-2 ring-brand-500 shadow-md'
                        : 'bg-surface-card hover:bg-surface-hover border-white/5 text-slate-400'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full ${col.bg} ring-1 ring-black/40`} />
                    <span>{col.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Number of clips, Duration & Prompt */}
        <div className="space-y-6">
          {/* 4. Number of Clips */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Number of Clips
              </label>
              <span className="text-xs font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full border border-brand-500/20">
                {config.numClips} {config.numClips === 1 ? 'Clip' : 'Clips'}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((num) => {
                const isSelected = config.numClips === num;
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleChange('numClips', num)}
                    className={`py-2 rounded-xl text-xs font-black transition-all border ${
                      isSelected
                        ? 'bg-brand-600 border-brand-400 text-white shadow-glow-purple scale-105'
                        : 'bg-surface-card hover:bg-surface-hover border-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Target Duration */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Target Clip Duration
              </label>
              <span className="text-xs text-slate-400 font-mono">
                ~{config.clipDuration}s per clip
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DURATIONS.map((dur) => {
                const isSelected = config.clipDuration === dur.value;
                return (
                  <button
                    key={dur.value}
                    type="button"
                    onClick={() => handleChange('clipDuration', dur.value)}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'bg-brand-500/20 border-brand-400 text-white shadow-sm'
                        : 'bg-surface-card hover:bg-surface-hover border-white/5 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="block text-sm font-bold">{dur.label}</span>
                    <span className="block text-[10px] text-slate-500 mt-0.5">{dur.tag}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6. AI Focus Prompt (Optional) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Custom AI Topic / Focus (Optional)
            </label>
            <input
              type="text"
              value={config.prompt || ''}
              onChange={(e) => handleChange('prompt', e.target.value)}
              placeholder="e.g., Focus on coding tips, funny reactions, or motivational moments..."
              className="w-full bg-surface-card border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
            />
            {/* Quick chips */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PROMPT_SUGGESTIONS.map((sug, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleChange('prompt', sug.replace(/^[^a-zA-Z]+/, ''))}
                  className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 text-[10px] transition-colors"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Submit Button */}
      <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-400 flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-brand-400 shrink-0" />
          <span>Outputs high quality H.264 MP4 videos directly ready to download.</span>
        </div>

        <button
          type="button"
          onClick={onSubmit}
          disabled={isProcessing}
          className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all shadow-xl flex items-center justify-center gap-2.5 ${
            isProcessing
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
              : 'bg-gradient-to-r from-brand-600 via-purple-600 to-indigo-600 hover:from-brand-500 hover:via-purple-500 hover:to-indigo-500 text-white shadow-brand-500/30 hover:shadow-brand-500/50 hover:scale-[1.02] active:scale-95 cursor-pointer'
          }`}
        >
          <Scissors className="w-4 h-4" />
          <span>Generate {config.numClips} Viral Clips</span>
          <Sparkles className="w-4 h-4 text-cyan-300" />
        </button>
      </div>
    </div>
  );
}
