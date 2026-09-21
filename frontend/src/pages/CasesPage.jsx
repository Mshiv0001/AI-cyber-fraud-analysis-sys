import React, { useState } from 'react';
import { Briefcase, Plus, Search, ChevronRight, ChevronLeft, Clock, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

const STATUS_CFG = {
  Open: { color: '#1769FF', bg: 'rgba(23,105,255,0.1)', border: 'rgba(23,105,255,0.25)', Icon: Clock },
  'Under Review': { color: '#D48B0A', bg: 'rgba(245,166,35,0.1)', border: 'rgba(245,166,35,0.25)', Icon: AlertTriangle },
  Closed: { color: '#18A96B', bg: 'rgba(24,169,107,0.1)', border: 'rgba(24,169,107,0.25)', Icon: CheckCircle },
};

const RISK_BADGE = {
  high: 'bg-rose-500/10 text-rose-600 border border-rose-200',
  medium: 'bg-amber-500/10 text-amber-600 border border-amber-200',
  low: 'bg-emerald-500/10 text-emerald-600 border border-emerald-200',
};

export const INITIAL_CASES = [
  { id: 'CASE-2041', date: 'Yesterday, 10:24 AM', analyst: 'Mohit S.', status: 'Open', risk: 'high', txCount: 3, summary: 'Multiple high-value wire transfers to new accounts' },
  { id: 'CASE-2040', date: 'Yesterday, 09:00 AM', analyst: 'Mohit S.', status: 'Under Review', risk: 'medium', txCount: 7, summary: 'Off-hours ACH activity with unusual merchant codes' },
  { id: 'CASE-2038', date: 'Yesterday, 04:15 PM', analyst: 'Mohit S.', status: 'Open', risk: 'high', txCount: 2, summary: 'Extreme amount outlier flagged by ML (>6σ from mean)' },
  { id: 'CASE-2035', date: 'Yesterday, 11:20 AM', analyst: 'Mohit S.', status: 'Closed', risk: 'low', txCount: 12, summary: 'Recurring payroll batch — all cleared after review' },
  { id: 'CASE-2033', date: 'Sep 18, 08:30 AM', analyst: 'Mohit S.', status: 'Closed', risk: 'medium', txCount: 5, summary: 'Card payment velocity burst — resolved' },
];

export default function CasesPage({ onOpenNewCase, onToast, liveCases = [], searchQueryProp = '' }) {
  // Convert live simulation cases to the display format
  const simCases = liveCases.map(c => {
    const isFraud = c.prediction === 'FRAUD' || (c.fraud_probability !== undefined && c.fraud_probability >= 0.7);
    const rawRisk = String(c.risk_level || (isFraud ? 'high' : 'low')).toLowerCase();
    const normalizedRisk = !isFraud && rawRisk === 'high' ? (c.fraud_probability >= 0.35 ? 'medium' : 'low') : rawRisk;
    return {
      id: c.id,
      date: c.created_at
        ? new Date(c.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        : 'Just now',
      analyst: c.analyst || 'Mohit S.',
      status: c.status === 'Under Investigation' ? 'Under Review' : (c.status || 'Open'),
      risk: normalizedRisk,
      txCount: 1,
      summary: c.summary || `[SIM] ${c.prediction || 'Unknown'} — ${c.amount || ''} via ${c.payment_method || ''}`,
      isSimulation: true,
    };
  });

  const [cases, setCases] = useState([...simCases, ...INITIAL_CASES]);

  const [search, setSearch] = useState(searchQueryProp);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  React.useEffect(() => {
    if (searchQueryProp !== undefined) setSearch(searchQueryProp);
  }, [searchQueryProp]);

  const filtered = cases.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (search && !c.id.toLowerCase().includes(search.toLowerCase()) && !c.summary.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const updateStatus = (id, newStatus) => {
    setCases(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
    setSelected(null);
    onToast?.(`${id} marked as ${newStatus}`);
  };

  const pageSize = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  React.useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, search]);

  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedCases = filtered.slice(startIndex, startIndex + pageSize);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(128,103,255,0.12)', border: '1px solid rgba(128,103,255,0.25)' }}>
            <Briefcase className="w-5 h-5" style={{ color: '#8067FF' }} strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="text-[24px] font-bold text-[#0B1B3A] dark:text-[#F8FAFC] font-[family-name:var(--font-display)] leading-tight">Cases</h2>
            <p className="text-[13px] text-[#58709A] dark:text-[#94A3B8]">Manage fraud investigation cases</p>
          </div>
        </div>
        <button onClick={onOpenNewCase} className="btn-primary flex items-center gap-2 h-[44px] px-5 text-[13px] shrink-0">
          <Plus className="w-4 h-4" strokeWidth={2.2} />
          <span>New Case</span>
        </button>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Open', count: cases.filter(c => c.status === 'Open').length, color: '#1769FF' },
          { label: 'Under Review', count: cases.filter(c => c.status === 'Under Review').length, color: '#D48B0A' },
          { label: 'Closed', count: cases.filter(c => c.status === 'Closed').length, color: '#18A96B' },
        ].map(s => (
          <div key={s.label} className="glass-card flex flex-col items-center justify-center py-4 gap-1">
            <span className="text-[26px] font-bold tabular-nums font-[family-name:var(--font-display)]" style={{ color: s.color }}>{s.count}</span>
            <span className="text-[12px] text-[#58709A] dark:text-[#94A3B8] font-medium">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-card" style={{ padding: '14px 16px' }}>
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11.5px] font-semibold text-[#52698F] dark:text-[#94A3B8] uppercase tracking-wider mr-1">Status:</span>
            {['all', 'Open', 'Under Review', 'Closed'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`text-[12px] font-semibold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${statusFilter === s ? 'bg-[#1875FF] text-white' : 'bg-white/50 dark:bg-white/10 text-[#475569] dark:text-[#94A3B8] hover:bg-white/80'}`}>
                {s === 'all' ? `All (${cases.length})` : s}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#7C8DA8]" />
            <input
              type="text" placeholder="Search cases…" value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-[12px] rounded-lg bg-white/60 dark:bg-white/10 border border-white/70 dark:border-white/10 text-[#0F172A] dark:text-[#F8FAFC] placeholder:text-[#7C8DA8] outline-none focus:border-[#1875FF] w-[200px]"
            />
          </div>
        </div>
      </div>

      {/* Cases List */}
      <div className="glass-card-strong overflow-hidden" style={{ padding: 0 }}>
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-[#7C8DA8]">
            <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-[14px] font-semibold text-[#0B1B3A] dark:text-[#F8FAFC]">No cases match your filter</p>
          </div>
        ) : (
          <div className="divide-y divide-white/30 dark:divide-white/8">
            {paginatedCases.map(c => {
              const cfg = STATUS_CFG[c.status] || STATUS_CFG.Open;
              const StatusIcon = cfg.Icon;
              return (
                <div key={c.id}
                  onClick={() => setSelected(c.id === selected ? null : c.id)}
                  className="flex items-start gap-4 px-5 py-4 hover:bg-white/30 dark:hover:bg-white/8 transition-all cursor-pointer group">
                  <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center mt-0.5"
                    style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                    <StatusIcon className="w-4.5 h-4.5" style={{ color: cfg.color }} strokeWidth={2.2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[14px] font-bold text-[#0B1B3A] dark:text-[#F8FAFC]">{c.id}</span>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${RISK_BADGE[c.risk]}`}>
                        {c.risk.charAt(0).toUpperCase() + c.risk.slice(1)} Risk
                      </span>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-md" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                        {c.status}
                      </span>
                    </div>
                    <p className="text-[12.5px] text-[#52698F] dark:text-[#94A3B8] mt-1 truncate">{c.summary}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[11.5px] text-[#7C8DA8] dark:text-[#64748B]">
                      <span>{c.date}</span>
                      <span>·</span>
                      <span>{c.txCount} transactions</span>
                      <span>·</span>
                      <span>{c.analyst}</span>
                    </div>

                    {/* Expanded actions */}
                    {selected === c.id && (
                      <div className="flex gap-2 mt-3">
                        {c.status !== 'Under Review' && (
                          <button onClick={e => { e.stopPropagation(); updateStatus(c.id, 'Under Review'); }}
                            className="text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-600 border border-amber-200 hover:bg-amber-500/20 transition-all cursor-pointer">
                            Move to Review
                          </button>
                        )}
                        {c.status !== 'Closed' && (
                          <button onClick={e => { e.stopPropagation(); updateStatus(c.id, 'Closed'); }}
                            className="text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-200 hover:bg-emerald-500/20 transition-all cursor-pointer">
                            Close Case
                          </button>
                        )}
                        {c.status !== 'Open' && (
                          <button onClick={e => { e.stopPropagation(); updateStatus(c.id, 'Open'); }}
                            className="text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 border border-blue-200 hover:bg-blue-500/20 transition-all cursor-pointer">
                            Reopen
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <ChevronRight className={`w-4 h-4 text-[#7C8DA8] shrink-0 mt-1 transition-transform ${selected === c.id ? 'rotate-90' : ''}`} />
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination & Count Bar */}
        {filtered.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-5 py-3 border-t border-white/40 dark:border-white/10 text-[12px] text-[#64748B] dark:text-[#94A3B8]">
            <div className="flex items-center gap-2">
              <span>
                Showing <strong className="text-[#0B1B3A] dark:text-[#F8FAFC]">{startIndex + 1}</strong>–<strong className="text-[#0B1B3A] dark:text-[#F8FAFC]">{Math.min(startIndex + pageSize, filtered.length)}</strong> of <strong className="text-[#0B1B3A] dark:text-[#F8FAFC]">{filtered.length}</strong> cases
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
      </div>
    </div>
  );
}
