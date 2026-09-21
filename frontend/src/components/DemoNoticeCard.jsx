import React from 'react';
import { Sparkles, Globe2, Cpu } from 'lucide-react';

export default function DemoNoticeCard() {
  return (
    <div className="glass-card relative overflow-hidden flex flex-col gap-3.5 group mt-auto" style={{ padding: '20px 18px' }}>
      {/* Decorative gradient blur blobs */}
      <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-gradient-to-br from-[#1875FF]/15 via-[#38BDF8]/10 to-transparent blur-xl pointer-events-none" />
      <div className="absolute -left-6 -bottom-6 w-28 h-28 rounded-full bg-gradient-to-tr from-[#8067FF]/15 to-transparent blur-xl pointer-events-none" />

      {/* Header Pill */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-[#1769FF] dark:text-[#38BDF8] shrink-0">
            <Sparkles className="w-4 h-4" strokeWidth={2.2} />
          </div>
          <h3 className="text-[15px] sm:text-[16px] font-bold text-[#0B1B3A] dark:text-[#F8FAFC] tracking-tight font-[family-name:var(--font-display)] leading-tight">
            Demo & Architecture Note
          </h3>
        </div>
        <span className="text-[10px] sm:text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 uppercase tracking-wider">
          Interactive Demo
        </span>
      </div>

      {/* Main Message */}
      <div className="relative z-10 text-[12.5px] leading-relaxed text-[#52698F] dark:text-[#CBD5E1] space-y-2">
        <p>
          This is a demonstration project built with realistic synthetic data and real-world temporal simulation evaluated against a trained <strong className="text-[#0B1B3A] dark:text-[#F8FAFC]">LightGBM Machine Learning model</strong>.
        </p>
        <p>
          The pipeline and model are configured in <strong className="text-[#0B1B3A] dark:text-[#F8FAFC]">US Dollar ($)</strong> currency, but the architecture is fully currency-agnostic and can be deployed for <strong className="text-[#0B1B3A] dark:text-[#F8FAFC]">Indian Rupees (₹)</strong>, <strong className="text-[#0B1B3A] dark:text-[#F8FAFC]">Euros (€)</strong>, or any global currency.
        </p>
      </div>

      {/* Footer Feature Badges */}
      <div className="relative z-10 flex items-center gap-1.5 flex-wrap pt-1 border-t border-white/40 dark:border-white/10">
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white/50 dark:bg-white/10 text-[#29466F] dark:text-[#94A3B8] border border-white/60 dark:border-white/10">
          <Cpu className="w-3 h-3 text-[#1769FF] dark:text-[#38BDF8]" />
          Real-World Simulation
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white/50 dark:bg-white/10 text-[#29466F] dark:text-[#94A3B8] border border-white/60 dark:border-white/10">
          <Globe2 className="w-3 h-3 text-[#18A96B]" />
          Multi-Currency Ready
        </span>
      </div>
    </div>
  );
}
