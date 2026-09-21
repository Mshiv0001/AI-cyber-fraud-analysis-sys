import React, { useEffect } from 'react';
import { X, AlertTriangle, CheckCircle2, AlertCircle, ExternalLink, Shield } from 'lucide-react';
import { formatTransactionTime } from '../utils/formatTime';

const RISK_CONFIG = {
  high: { label: 'High Risk', color: '#F04444', bg: 'rgba(240,68,68,0.1)', border: 'rgba(240,68,68,0.25)', Icon: AlertTriangle },
  medium: { label: 'Medium Risk', color: '#D48B0A', bg: 'rgba(245,166,35,0.1)', border: 'rgba(245,166,35,0.25)', Icon: AlertCircle },
  low: { label: 'Low Risk', color: '#18A96B', bg: 'rgba(24,169,107,0.1)', border: 'rgba(24,169,107,0.25)', Icon: CheckCircle2 },
};

const STATUS_STYLES = {
  Flagged: 'bg-rose-500/10 text-rose-600 border border-rose-500/20',
  Reviewing: 'bg-amber-500/10 text-amber-600 border border-amber-500/20',
  Cleared: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20',
};

export default function TransactionDetailDrawer({ tx, onClose, onStatusChange }) {
  useEffect(() => {
    if (!tx) return;
    const handler = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [tx, onClose]);

  if (!tx) return null;

  const risk = RISK_CONFIG[tx.risk] || RISK_CONFIG.low;
  const RiskIcon = risk.Icon;
  const scorePct = Math.round(tx.score * 100);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-[#0B1B3A]/25 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <aside
        className="fixed right-0 top-0 h-full z-50 w-full max-w-[420px] flex flex-col"
        style={{
          background: 'linear-gradient(160deg, rgba(230,242,255,0.97) 0%, rgba(215,234,255,0.97) 100%)',
          backdropFilter: 'blur(40px) saturate(200%)',
          WebkitBackdropFilter: 'blur(40px) saturate(200%)',
          borderLeft: '1px solid rgba(255,255,255,0.7)',
          boxShadow: '-24px 0 80px rgba(11,27,58,0.14)',
          animation: 'drawerSlideIn 0.32s cubic-bezier(0.16,1,0.3,1) both',
        }}
        role="dialog"
        aria-label="Transaction detail"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/60">
          <div>
            <h2 className="text-[18px] font-bold text-[#0B1B3A] font-[family-name:var(--font-display)]">
              {tx.id}
            </h2>
            <p className="text-[12px] text-[#58709A] mt-0.5">{formatTransactionTime(tx)}</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/60 border border-white/70 flex items-center justify-center hover:bg-white/90 transition-all cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-[#475569]" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">

          {/* Risk Level + Score */}
          <div
            className="rounded-2xl p-4 flex items-center gap-4"
            style={{ background: risk.bg, border: `1px solid ${risk.border}` }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: risk.color + '20', border: `1px solid ${risk.color}40` }}
            >
              <RiskIcon className="w-5 h-5" style={{ color: risk.color }} strokeWidth={2.2} />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-bold" style={{ color: risk.color }}>{risk.label}</p>
              <p className="text-[12px] text-[#52698F] mt-0.5">{tx.signal}</p>
            </div>
            <div
              className="text-[22px] font-bold tabular-nums font-[family-name:var(--font-display)]"
              style={{ color: risk.color }}
            >
              {tx.score.toFixed(2)}
            </div>
          </div>

          {/* Score bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] font-semibold text-[#52698F]">ML Risk Score</span>
              <span className="text-[12px] font-bold text-[#0B1B3A]">{scorePct}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-white/60 border border-white/70 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${scorePct}%`,
                  background: `linear-gradient(90deg, #18A96B, ${scorePct > 70 ? '#F04444' : scorePct > 40 ? '#F5A623' : '#18A96B'})`,
                }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-[#7C8DA8]">Low</span>
              <span className="text-[10px] text-[#7C8DA8]">High</span>
            </div>
          </div>

          {/* Details grid */}
          <div className="glass-card" style={{ padding: '16px 18px' }}>
            <h3 className="text-[12.5px] font-bold text-[#52698F] uppercase tracking-wider mb-3">
              Transaction Details
            </h3>
            <div className="flex flex-col gap-3">
              {[
                { label: 'Amount', value: tx.amount, bold: true },
                { label: 'Type', value: tx.type },
                { label: 'Timestamp', value: formatTransactionTime(tx) },
                { label: 'Status', value: tx.status, isStatus: true },
              ].map(({ label, value, bold, isStatus }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-[13px] text-[#58709A]">{label}</span>
                  {isStatus ? (
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md ${STATUS_STYLES[value] || ''}`}>
                      {value}
                    </span>
                  ) : (
                    <span className={`text-[13px] text-[#0B1B3A] ${bold ? 'font-bold' : 'font-medium'}`}>
                      {value}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Detection signal */}
          <div className="glass-inset rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <Shield className="w-4 h-4 text-[#1769FF]" strokeWidth={2.2} />
              <span className="text-[12.5px] font-bold text-[#0B1B3A]">Detection Signal</span>
            </div>
            <p className="text-[13px] text-[#52698F] leading-relaxed">{tx.signal}</p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-white/60 flex gap-3">
          {tx.status !== 'Flagged' && (
            <button
              onClick={() => { onStatusChange?.(tx.id, 'Flagged'); onClose?.(); }}
              className="flex-1 h-[42px] rounded-[14px] text-[13px] font-semibold text-[#F04444] border border-[#F04444]/30 bg-[#F04444]/8 hover:bg-[#F04444]/15 transition-all cursor-pointer"
            >
              Flag for Review
            </button>
          )}
          {tx.status !== 'Cleared' && (
            <button
              onClick={() => { onStatusChange?.(tx.id, 'Cleared'); onClose?.(); }}
              className="flex-1 h-[42px] rounded-[14px] text-[13px] font-semibold text-[#18A96B] border border-[#18A96B]/30 bg-[#18A96B]/8 hover:bg-[#18A96B]/15 transition-all cursor-pointer"
            >
              Mark Cleared
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 h-[42px] rounded-[14px] text-[13px] font-semibold text-[#52698F] border border-white/70 bg-white/50 hover:bg-white/80 transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </aside>

      <style>{`
        @keyframes drawerSlideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
        html[data-theme='dark'] aside[role='dialog'] {
          background: linear-gradient(160deg, rgba(12,28,62,0.97) 0%, rgba(10,24,55,0.97) 100%) !important;
          border-left-color: rgba(185,215,255,0.18) !important;
        }
      `}</style>
    </>
  );
}
