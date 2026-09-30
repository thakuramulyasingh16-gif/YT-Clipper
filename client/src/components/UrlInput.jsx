import React, { useState } from 'react';
import { Youtube, Clipboard, X, ArrowRight, Loader2, CheckCircle2, Sparkles } from 'lucide-react';

const QUICK_EXAMPLES = [
  {
    label: "Steve Jobs Speech",
    url: "https://www.youtube.com/watch?v=UF8uR6Z6KLc",
    desc: "Stanford Commencement"
  },
  {
    label: "Jensen Huang AI",
    url: "https://www.youtube.com/watch?v=kYI8-i5nEFE",
    desc: "NVIDIA Keynote"
  },
  {
    label: "Veritasium Paradox",
    url: "https://www.youtube.com/watch?v=UBVV8pch1Rs",
    desc: "Viral Science"
  }
];

export default function UrlInput({ url, setUrl, onFetch, isLoading, isValid, error }) {
  const [copiedNotification, setCopiedNotification] = useState(false);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
        setCopiedNotification(true);
        setTimeout(() => setCopiedNotification(false), 2000);
      }
    } catch (err) {
      console.warn("Clipboard access denied:", err);
    }
  };

  const handleClear = () => {
    setUrl('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && isValid && !isLoading) {
      onFetch();
    }
  };

  return (
    <div className="w-full">
      {/* Search & URL Input Box */}
      <div className="relative group">
        <div className={`absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-brand-500 via-indigo-500 to-cyan-500 blur-sm opacity-50 group-hover:opacity-80 transition duration-300 ${isLoading ? 'animate-pulse opacity-100' : ''}`} />
        
        <div className="relative flex items-center bg-surface-card border border-white/10 rounded-2xl p-2 sm:p-2.5 shadow-2xl backdrop-blur-xl">
          {/* YouTube Icon */}
          <div className="pl-3 pr-2 text-rose-500 flex items-center justify-center">
            <Youtube className="w-6 h-6" />
          </div>

          {/* Input */}
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paste any YouTube video or Shorts link (e.g., https://youtube.com/watch?v=...)"
            className="w-full bg-transparent border-none outline-none text-white placeholder-slate-500 text-sm sm:text-base font-normal px-2 focus:ring-0"
            disabled={isLoading}
          />

          {/* Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 pr-1">
            {url && (
              <button
                type="button"
                onClick={handleClear}
                disabled={isLoading}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                title="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {!url && (
              <button
                type="button"
                onClick={handlePaste}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-medium border border-white/10 transition-all active:scale-95"
              >
                <Clipboard className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Paste</span>
              </button>
            )}

            <button
              type="button"
              onClick={onFetch}
              disabled={!isValid || isLoading}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-medium text-xs sm:text-sm tracking-wide transition-all shadow-lg ${
                isValid && !isLoading
                  ? 'bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-brand-500/25 active:scale-95 cursor-pointer'
                  : 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span className="hidden sm:inline">Fetching...</span>
                </>
              ) : (
                <>
                  <span>Fetch Info</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Helper feedback or error message */}
      {error && (
        <div className="mt-2.5 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
          <X className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Quick curated example test links */}
      <div className="mt-3.5 flex flex-wrap items-center gap-2 text-xs text-slate-400">
        <span className="flex items-center gap-1 font-medium text-slate-500">
          <Sparkles className="w-3 h-3 text-brand-400" />
          Try instant example:
        </span>
        {QUICK_EXAMPLES.map((ex, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setUrl(ex.url)}
            className="px-2.5 py-1 rounded-lg bg-surface-panel hover:bg-surface-hover border border-white/5 hover:border-brand-500/40 text-slate-300 hover:text-white transition-all text-[11px]"
          >
            {ex.label}
          </button>
        ))}
      </div>
    </div>
  );
}
