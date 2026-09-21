import React from 'react';

export default function QuoteCard() {
  return (
    <div className="glass-card quote-card relative overflow-hidden px-6 py-6 min-h-[120px] flex items-center justify-center text-center">
      {/* Liquid glass background blobs */}
      <div className="quote-blob-1 absolute -right-4 -top-4 w-32 h-32 rounded-full bg-gradient-to-br from-white/65 via-[#38BDF8]/25 to-[#31D6D0]/15 blur-lg animate-float pointer-events-none" />
      <div className="quote-blob-2 absolute -left-4 -bottom-4 w-24 h-24 rounded-full bg-gradient-to-tr from-white/50 to-[#1769FF]/10 blur-md pointer-events-none" />

      {/* Centered Quote with Complete Quotation Marks */}
      <p className="quote-text relative z-10 text-[25px] sm:text-[27px] font-extrabold text-[#0F172A] leading-snug tracking-tight font-[family-name:var(--font-display)]">
        <span className="quote-mark text-[#1769FF] font-serif text-[32px] sm:text-[34px] mr-1.5 align-baseline">“</span>
        Data finds what people miss.
        <span className="quote-mark text-[#1769FF] font-serif text-[32px] sm:text-[34px] ml-1.5 align-baseline">”</span>
      </p>
    </div>
  );
}
