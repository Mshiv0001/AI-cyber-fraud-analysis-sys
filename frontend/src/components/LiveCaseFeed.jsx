import React, { useEffect, useRef, useState } from 'react';
import { Radio, AlertTriangle, CheckCircle, Clock, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

const RISK_COLOR = {
  high:   { color: '#F04444', bg: 'rgba(240,68,68,0.1)',    border: 'rgba(240,68,68,0.25)', label: 'HIGH' },
  medium: { color: '#D48B0A', bg: 'rgba(245,166,35,0.1)',   border: 'rgba(245,166,35,0.25)', label: 'MED' },
  low:    { color: '#18A96B', bg: 'rgba(24,169,107,0.1)',   border: 'rgba(24,169,107,0.25)', label: 'LOW' },
};

const PRED_BADGE = {
  FRAUD:      { color: '#F04444', bg: 'rgba(240,68,68,0.1)',  label: 'FRAUD' },
  LEGITIMATE: { color: '#18A96B', bg: 'rgba(24,169,107,0.1)', label: 'LEGIT' },
  LEGIT:      { color: '#18A96B', bg: 'rgba(24,169,107,0.1)', label: 'LEGIT' },
  REVIEW:     { color: '#D48B0A', bg: 'rgba(245,166,35,0.1)', label: 'REVIEW' },
};

function formatMethod(method) {
  if (!method) return 'Wire Transfer';
  const m = String(method).trim();
  if (['IMPS', 'NEFT', 'RTGS', 'NetBanking', 'TRANSFER'].includes(m)) return 'Wire Transfer';
  if (['UPI', 'PAYMENT'].includes(m)) return 'Merchant Payment';
  if (['CASH_OUT'].includes(m)) return 'Cash Out';
  if (['CASH_IN'].includes(m)) return 'Account Deposit';
  if (['DEBIT'].includes(m)) return 'Debit Purchase';
  return m;
}

function cleanSummary(summary, isFraud) {
  if (!summary) {
    return isFraud ? 'High risk anomaly flagged by ML pipeline' : 'Standard legitimate transaction pattern';
  }
  return summary
    .replace(/\bIMPS\b|\bNEFT\b|\bRTGS\b|\bNetBanking\b/g, 'Wire Transfer')
    .replace(/\bUPI\b/g, 'Merchant Payment');
}

function CaseRow({ c, isNew }) {
  // Normalize prediction & risk level to prevent contradictions (e.g. LEGIT with red HIGH badge)
  const isFraud = c.prediction === 'FRAUD' || (c.fraud_probability !== undefined && c.fraud_probability >= 0.7);
  const rawRisk = String(c.risk_level || (isFraud ? 'high' : 'low')).toLowerCase();
  
  // If prediction is LEGITIMATE, risk level cannot be 'high'
  const normalizedRisk = !isFraud && rawRisk === 'high' ? (c.fraud_probability >= 0.35 ? 'medium' : 'low') : rawRisk;
  const risk = RISK_COLOR[normalizedRisk] || RISK_COLOR.low;
  
  const predKey = isFraud ? 'FRAUD' : (c.prediction || 'LEGITIMATE');
  const pred = PRED_BADGE[predKey] || PRED_BADGE.LEGITIMATE;
  const PredIcon = isFraud ? AlertTriangle : CheckCircle;
  
  const timeStr = c.timestamp
    ? new Date(c.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : '';

  const displayMethod = formatMethod(c.payment_method || c.type);

  return (
    <div
      className="flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all group hover:bg-white/40 dark:hover:bg-white/10"
      style={{
        animation: isNew ? 'caseSlideIn 0.35s cubic-bezier(0.16,1,0.3,1) both' : 'none',
        border: isNew ? `1px solid ${risk.color}30` : '1px solid transparent',
        background: isNew ? risk.bg : 'transparent',
      }}
    >
      {/* Risk dot */}
      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: risk.color }} />

      {/* Case ID */}
      <span className="text-[13px] font-bold text-[#0B1B3A] dark:text-[#F8FAFC] font-mono shrink-0 min-w-[110px]">
        {c.id}
      </span>

      {/* Amount */}
      <span className="text-[13px] font-bold text-[#0B1B3A] dark:text-[#F8FAFC] tabular-nums shrink-0 min-w-[90px]">
        {c.amount ? (c.amount.startsWith('$') ? c.amount : `$${c.amount.replace(/^,/, '')}`) : '$0.00'}
      </span>

      {/* Transaction Type */}
      <span className="text-[12px] font-medium text-[#52698F] dark:text-[#94A3B8] shrink-0 hidden sm:inline-block min-w-[95px] truncate">
        {displayMethod}
      </span>

      {/* Summary / Notes */}
      <span className="text-[12px] text-[#52698F] dark:text-[#94A3B8] flex-1 truncate">
        {cleanSummary(c.summary, isFraud)}
      </span>

      {/* Risk badge */}
      <span
        className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0 text-center min-w-[55px]"
        style={{ color: risk.color, background: risk.bg, border: `1px solid ${risk.border}` }}
      >
        {risk.label}
      </span>

      {/* Prediction badge */}
      <span
        className="inline-flex items-center justify-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0 min-w-[65px]"
        style={{ color: pred.color, background: pred.bg }}
      >
        <PredIcon className="w-2.5 h-2.5" strokeWidth={2.5} />
        {pred.label}
      </span>

      {/* Time */}
      {timeStr && (
        <span className="text-[10.5px] sm:text-[11px] text-[#7C8DA8] dark:text-[#94A3B8] shrink-0 font-mono text-right min-w-[60px] sm:min-w-[65px] tabular-nums">
          {timeStr}
        </span>
      )}
    </div>
  );
}

export default function LiveCaseFeed({ cases = [], onViewAll }) {
  const pageSize = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const prevIdsRef = useRef(new Set());
  const newIds = new Set();
  const prevIds = prevIdsRef.current;

  const totalPages = Math.max(1, Math.ceil(cases.length / pageSize));

  // Keep currentPage bounded if cases array shrinks
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * pageSize;
  const displayed = cases.slice(startIndex, startIndex + pageSize);

  // Detect newly added cases on current view
  displayed.forEach(c => {
    if (!prevIds.has(c.id)) newIds.add(c.id);
  });

  useEffect(() => {
    const next = new Set(displayed.map(c => c.id));
    prevIdsRef.current = next;
  }, [displayed]);

  return (
    <div id="tour-case-feed" className="glass-card-strong flex flex-col justify-between flex-1 h-full p-4 sm:p-5">
      <div className="flex flex-col flex-1">
        {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500 shrink-0">
            <Radio className="w-4 h-4" strokeWidth={2.2} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[16px] font-bold text-[#0B1B3A] dark:text-[#F8FAFC] font-[family-name:var(--font-display)]">
                Live Case Feed
              </h3>
              {cases.length > 0 && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#F04444]/10 text-[#F04444] border border-[#F04444]/25">
                  {cases.length} active
                </span>
              )}
            </div>
            <p className="text-[12px] text-[#52698F] dark:text-[#94A3B8]">
              Real-time incoming cases evaluated by the temporal ML pipeline
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 uppercase tracking-wider">
            LIVE STREAM
          </span>
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="text-[12px] font-semibold text-[#1769FF] dark:text-[#38BDF8] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View all in Cases</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Table content wrapper */}
      <div className="overflow-x-auto min-w-0 -mx-1 px-1">
        <div className="min-w-[500px] sm:min-w-0">
          {/* Column headers */}
          <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-lg bg-white/30 dark:bg-white/5 mb-1.5 text-[10.5px] font-semibold text-[#7C8DA8] dark:text-[#94A3B8] uppercase tracking-wider">
            <div className="w-2.5 h-2.5 shrink-0" />
            <span className="min-w-[110px]">Case ID</span>
            <span className="min-w-[90px]">Amount</span>
            <span className="hidden sm:inline-block min-w-[95px]">Type</span>
            <span className="flex-1">Signal & Notes</span>
            <span className="min-w-[55px] text-center">Risk</span>
            <span className="min-w-[65px] text-center">Prediction</span>
            <span className="min-w-[60px] sm:min-w-[65px] text-right">Time</span>
          </div>

          {/* Case rows */}
          {displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
              <Clock className="w-8 h-8 text-[#7C8DA8] opacity-30" />
              <p className="text-[14px] font-semibold text-[#0B1B3A] dark:text-[#F8FAFC]">No live cases yet</p>
              <p className="text-[12px] text-[#64748B] dark:text-[#94A3B8]">Start the simulation to stream cases in real-time.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              {displayed.map(c => (
                <CaseRow key={c.id} c={c} isNew={newIds.has(c.id)} />
              ))}
            </div>
          )}
        </div>
      </div>
      </div>

      {/* Pagination Footer */}
      {cases.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 mt-auto border-t border-white/40 dark:border-white/10 text-[12px] text-[#64748B] dark:text-[#94A3B8]">
          <div className="flex items-center gap-2">
            <span>
              Showing <strong className="text-[#0B1B3A] dark:text-[#F8FAFC]">{startIndex + 1}</strong>–<strong className="text-[#0B1B3A] dark:text-[#F8FAFC]">{Math.min(startIndex + pageSize, cases.length)}</strong> of <strong className="text-[#0B1B3A] dark:text-[#F8FAFC]">{cases.length}</strong> active cases
            </span>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                aria-label="Previous page"
                className="px-2.5 py-1 rounded-lg border border-white/60 dark:border-white/10 bg-white/40 dark:bg-white/5 text-[#29466F] dark:text-[#E2E8F0] hover:bg-white/80 dark:hover:bg-white/15 disabled:opacity-35 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1 font-semibold text-[11.5px]"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                  .map((page, idx, arr) => {
                    const prev = arr[idx - 1];
                    return (
                      <React.Fragment key={page}>
                        {prev && page - prev > 1 && (
                          <span className="px-1 text-slate-400">…</span>
                        )}
                        <button
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          className={`w-7 h-7 rounded-lg text-[11.5px] font-semibold transition-all cursor-pointer flex items-center justify-center ${
                            currentPage === page
                              ? 'bg-[#1875FF] text-white shadow-sm'
                              : 'bg-white/40 dark:bg-white/5 text-[#29466F] dark:text-[#CBD5E1] hover:bg-white/80 dark:hover:bg-white/15'
                          }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                aria-label="Next page"
                className="px-2.5 py-1 rounded-lg border border-white/60 dark:border-white/10 bg-white/40 dark:bg-white/5 text-[#29466F] dark:text-[#E2E8F0] hover:bg-white/80 dark:hover:bg-white/15 disabled:opacity-35 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1 font-semibold text-[11.5px]"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes caseSlideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
