import React from 'react';
import { CheckCircle2, X } from 'lucide-react';

export default function Toast({ message, onClose }) {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-surface-card/95 border border-brand-500/40 text-white shadow-2xl backdrop-blur-xl animate-bounce">
      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
      <span className="text-xs sm:text-sm font-medium">{message}</span>
      <button
        onClick={onClose}
        className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
