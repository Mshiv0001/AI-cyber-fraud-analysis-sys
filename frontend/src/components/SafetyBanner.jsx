import React from 'react';
import { Shield, ChevronRight } from 'lucide-react';

export default function SafetyBanner({ onAction, onStartTour }) {
  return (
    <div className="glass-card relative overflow-hidden p-5 min-h-[120px] flex items-center gap-4">
      {/* Decorative blue liquid shape */}
      <div className="absolute -left-8 -bottom-8 w-36 h-36 rounded-full bg-gradient-to-tr from-[#1875FF]/15 via-[#31D6D0]/10 to-transparent blur-2xl" />
      <div className="absolute right-8 -top-8 w-24 h-24 rounded-full bg-gradient-to-br from-[#B9D8FF]/20 to-transparent blur-xl" />

      {/* Shield Icon in frosted squircle */}
      <div className="relative w-12 h-12 shrink-0 rounded-2xl bg-white/70 dark:bg-white/10 border border-white/80 dark:border-white/20 shadow-sm flex items-center justify-center">
        <Shield className="w-6 h-6 text-[#1875FF]" strokeWidth={2.2} />
      </div>

      {/* Text */}
      <div className="relative flex-1 min-w-0">
        <p className="text-[15px] font-bold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
          A safer digital world starts with you.
        </p>
        <p className="text-[12px] text-[#64748B] dark:text-[#94A3B8] mt-0.5 font-medium">
          Click → to take the guided tour
        </p>
      </div>

      {/* Chevron Button — triggers guided tour */}
      <button
        aria-label="Start guided tour"
        onClick={onStartTour || onAction}
        title="Take the guided tour"
        className="relative w-9 h-9 shrink-0 rounded-full bg-white/60 dark:bg-white/10 border border-white/80 dark:border-white/20 flex items-center justify-center hover:bg-[#1769FF] hover:border-[#1769FF] hover:scale-110 transition-all shadow-sm cursor-pointer tour-trigger-pulse group"
      >
        <ChevronRight className="w-4.5 h-4.5 text-[#475569] dark:text-[#CBD5E1] group-hover:text-white transition-colors" strokeWidth={2.2} />
      </button>
    </div>
  );
}
