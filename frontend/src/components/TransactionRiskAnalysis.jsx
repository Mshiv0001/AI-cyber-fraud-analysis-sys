import React, { useState } from 'react';
import {
  BarChart3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Filter,
  Download,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  ArrowUpDown,
  Search,
} from 'lucide-react';
import { formatTransactionTime, useTimeTicker } from '../utils/formatTime';


/* ============================================================
   SUPPLIED BATCH TRANSACTION DATA (ML Scored)
   No entity graphs, no live stream, pure transaction scoring.
   ============================================================ */

export const BATCH_DATA = [
  {
    id: 'TX-9842',
    timestamp: 'Yesterday, 10:24 AM',
    amount: '$14,850.00',
    type: 'Wire Transfer',
    score: 0.96,
    risk: 'high',
    signal: 'Extreme amount outlier (>6σ from mean)',
    status: 'Flagged',
  },
  {
    id: 'TX-9831',
    timestamp: 'Yesterday, 09:52 AM',
    amount: '$6,200.00',
    type: 'Card Payment',
    score: 0.88,
    risk: 'high',
    signal: 'Rapid transaction velocity burst',
    status: 'Flagged',
  },
  {
    id: 'TX-9810',
    timestamp: 'Yesterday, 08:30 AM',
    amount: '$9,400.00',
    type: 'ACH Transfer',
    score: 0.81,
    risk: 'high',
    signal: 'Off-hours international routing',
    status: 'Flagged',
  },
  {
    id: 'TX-9799',
    timestamp: 'Yesterday, 07:14 AM',
    amount: '$1,250.00',
    type: 'Card Payment',
    score: 0.54,
    risk: 'medium',
    signal: 'New merchant terminal location',
    status: 'Flagged',
  },
  {
    id: 'TX-9788',
    timestamp: 'Yesterday, 06:45 AM',
    amount: '$890.00',
    type: 'P2P Transfer',
    score: 0.42,
    risk: 'medium',
    signal: 'Dormant account first activity in 180d',
    status: 'Cleared',
  },
  {
    id: 'TX-9777',
    timestamp: 'Yesterday, 06:12 AM',
    amount: '$340.00',
    type: 'Card Payment',
    score: 0.12,
    risk: 'low',
    signal: 'Standard domestic POS clearance',
    status: 'Cleared',
  },
  {
    id: 'TX-9765',
    timestamp: 'Yesterday, 05:55 AM',
    amount: '$4,100.00',
    type: 'Wire Transfer',
    score: 0.72,
    risk: 'medium',
    signal: 'High-value threshold check',
    status: 'Flagged',
  },
  {
    id: 'TX-9754',
    timestamp: 'Yesterday, 05:30 AM',
    amount: '$75.00',
    type: 'Card Payment',
    score: 0.04,
    risk: 'low',
    signal: 'Recurring subscription verify',
    status: 'Cleared',
  },
  {
    id: 'TX-9743',
    timestamp: 'Yesterday, 04:48 AM',
    amount: '$18,500.00',
    type: 'Wire Transfer',
    score: 0.94,
    risk: 'high',
    signal: 'Cross-border wire to flagged jurisdiction',
    status: 'Flagged',
  },
  {
    id: 'TX-9732',
    timestamp: 'Yesterday, 04:15 AM',
    amount: '$210.00',
    type: 'Card Payment',
    score: 0.08,
    risk: 'low',
    signal: 'Standard contactless payment',
    status: 'Cleared',
  },
  {
    id: 'TX-9721',
    timestamp: 'Yesterday, 03:40 AM',
    amount: '$5,800.00',
    type: 'Card Payment',
    score: 0.79,
    risk: 'high',
    signal: 'Card not present multi-retry surge',
    status: 'Flagged',
  },
  {
    id: 'TX-9710',
    timestamp: 'Yesterday, 03:05 AM',
    amount: '$95.00',
    type: 'ACH Transfer',
    score: 0.06,
    risk: 'low',
    signal: 'Scheduled utility bill payment',
    status: 'Cleared',
  },
];

const SUMMARY = [
  { color: '#1875FF', metric: '1,240', label: 'Batch Records' },
  { color: '#F04444', metric: '142', label: 'High Risk Flags' },
  { color: '#18A96B', metric: '99.2%', label: 'Model Confidence' },
  { color: '#8067FF', metric: '$184.2K', label: 'Flagged Volume' },
];

function exportCSV(data, currentTime = new Date()) {
  const headers = ['ID', 'Timestamp', 'Amount', 'Type', 'ML Score', 'Risk', 'Detection Signal', 'Status'];
  const rows = data.map(tx => [
    tx.id, formatTransactionTime(tx, currentTime), tx.amount, tx.type,
    tx.score.toFixed(4), tx.risk, `"${tx.signal}"`, tx.status,
  ]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const date = currentTime.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
  a.download = `FraudGuard-Risk-Report-${date}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function TransactionRiskAnalysis({
  transactions,
  onAction,
  searchQueryProp = '',
  onClearSearch,
  onRowClick,
  onOpenUpload,
  compact = false,
  pageSize,
  onViewAll,
  showPagination,
}) {
  const [filter, setFilter] = useState('all');
  const [localSearch, setLocalSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const now = useTimeTicker(15000);

  const activeData = transactions && transactions.length > 0 ? transactions : BATCH_DATA;
  const activeSearch = (searchQueryProp || localSearch).trim().toLowerCase();

  const filteredData = activeData.filter((tx) => {
    if (filter !== 'all' && tx.risk !== filter) return false;
    if (activeSearch) {
      const id = String(tx.id || '').toLowerCase();
      const type = String(tx.type || tx.payment_method || '').toLowerCase();
      const signal = String(tx.signal || '').toLowerCase();
      const status = String(tx.status || '').toLowerCase();
      const risk = String(tx.risk || '').toLowerCase();
      const customerId = String(tx.customer_id || '').toLowerCase();
      const caseId = String(tx.case_id || '').toLowerCase();
      const location = String(tx.location || '').toLowerCase();
      const timeDisplay = formatTransactionTime(tx, now).toLowerCase();

      const strAmount = String(tx.amount || '');
      const cleanTxNum = strAmount.replace(/[^0-9.]/g, '');
      const cleanSearchNum = activeSearch.replace(/[^0-9.]/g, '');

      return (
        id.includes(activeSearch) ||
        type.includes(activeSearch) ||
        signal.includes(activeSearch) ||
        status.includes(activeSearch) ||
        risk.includes(activeSearch) ||
        customerId.includes(activeSearch) ||
        caseId.includes(activeSearch) ||
        location.includes(activeSearch) ||
        timeDisplay.includes(activeSearch) ||
        (cleanSearchNum.length > 0 && cleanTxNum.includes(cleanSearchNum))
      );
    }
    return true;
  });

  const effectivePageSize = pageSize || (compact ? 6 : 10);
  const totalPages = Math.max(1, Math.ceil(filteredData.length / effectivePageSize));

  // Reset page when filter or search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filter, activeSearch]);

  const pagedData = filteredData.slice(
    (currentPage - 1) * effectivePageSize,
    currentPage * effectivePageSize
  );

  return (
    <div id="tour-risk-table" className="glass-card-strong flex flex-col overflow-hidden">
      {/* ---- Header ---- */}
      <div className="flex flex-col gap-3 px-4 pt-4 pb-3 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{
              backgroundColor: 'rgba(23, 105, 255, 0.12)',
              border: '1px solid rgba(23, 105, 255, 0.25)',
            }}
          >
            <BarChart3 className="w-[18px] h-[18px]" style={{ color: '#1769FF' }} strokeWidth={2.2} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[18px] font-bold text-[#0B1B3A] dark:text-[#F8FAFC] font-[family-name:var(--font-display)]">
                {compact ? 'Recent Transactions & Risk' : 'Transaction Risk Analysis'}
              </h3>
              {compact && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#1769FF]/10 text-[#1769FF] dark:text-[#38BDF8] border border-[#1769FF]/20">
                  Live
                </span>
              )}
            </div>
            <p className="text-[12.5px] text-[#58709A] dark:text-[#94A3B8]">
              {compact ? 'Live ML anomaly scoring stream' : 'ML model anomaly scoring across supplied batch data'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto flex-wrap">
          {compact ? (
            <>
              {onViewAll && (
                <button
                  onClick={onViewAll}
                  className="flex items-center gap-1.5 h-[36px] px-3.5 rounded-full bg-[#1769FF]/10 hover:bg-[#1769FF]/20 text-[#1769FF] dark:text-[#38BDF8] border border-[#1769FF]/25 text-[12.5px] font-semibold transition-all cursor-pointer"
                >
                  <span>View All ({activeData.length})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => { exportCSV(filteredData, now); onAction?.('Batch report exported'); }}
                className="flex items-center gap-1.5 h-[36px] px-3 rounded-full bg-white/50 dark:bg-white/10 border border-white/70 dark:border-white/10 text-[12.5px] font-medium text-[#29466F] dark:text-[#E2E8F0] hover:bg-white/70 dark:hover:bg-white/20 transition-all cursor-pointer"
                title="Export CSV Analysis"
              >
                <Download className="w-3.5 h-3.5 text-[#52698F] dark:text-[#94A3B8]" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </>
          ) : (
            <>
              {/* Batch Selector — opens upload modal */}
              <button
                onClick={() => onOpenUpload ? onOpenUpload() : onAction?.('Upload Data')}
                title="Upload a new batch CSV"
                className="flex items-center gap-2 h-[40px] px-3.5 rounded-full bg-white/50 dark:bg-white/10 border border-white/70 dark:border-white/10 text-[13px] font-medium text-[#29466F] dark:text-[#E2E8F0] hover:bg-white/70 dark:hover:bg-white/20 transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#1875FF]" />
                <span>sept_tx_batch_04.csv</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#7C8DA8]" />
              </button>

              {/* Export Report */}
              <button
                onClick={() => { exportCSV(filteredData, now); onAction?.('Batch report exported'); }}
                className="flex items-center gap-1.5 h-[40px] px-3 rounded-full bg-white/50 dark:bg-white/10 border border-white/70 dark:border-white/10 text-[13px] font-medium text-[#29466F] dark:text-[#E2E8F0] hover:bg-white/70 dark:hover:bg-white/20 transition-all cursor-pointer"
                title="Export CSV Analysis"
              >
                <Download className="w-4 h-4 text-[#52698F] dark:text-[#94A3B8]" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ---- Filter & Risk Distribution Strip ---- */}
      <div className="mx-3 sm:mx-6 mb-3 p-3.5 rounded-2xl bg-white/35 dark:bg-white/5 border border-white/50 dark:border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
          {/* Risk Filter Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11.5px] font-semibold text-[#52698F] dark:text-[#94A3B8] mr-1 uppercase tracking-wider">
              Filter:
            </span>
            {[
              { id: 'all', label: `All (${activeData.length})` },
              { id: 'high', label: 'High Risk (>0.70)' },
              { id: 'medium', label: 'Medium (0.4-0.7)' },
              { id: 'low', label: 'Low (<0.4)' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`text-[12px] font-semibold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  filter === tab.id
                    ? 'bg-[#1875FF] text-white shadow-sm'
                    : 'bg-white/50 dark:bg-white/10 text-[#475569] dark:text-[#94A3B8] hover:bg-white/80 dark:hover:bg-white/20'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Quick Search */}
          <div className="relative flex items-center min-w-[180px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 text-[#7C8DA8]" />
            <input
              type="text"
              placeholder="Search TX ID, amount, type..."
              value={searchQueryProp || localSearch}
              onChange={(e) => {
                setLocalSearch(e.target.value);
                if (searchQueryProp && onClearSearch) onClearSearch();
              }}
              className="w-full pl-8 pr-2.5 py-1 text-[12px] rounded-lg bg-white/60 dark:bg-white/10 border border-white/70 dark:border-white/10 text-[#0F172A] dark:text-[#F8FAFC] placeholder:text-[#7C8DA8] outline-none focus:border-[#1875FF]"
            />
          </div>
        </div>

        {/* Model Risk Distribution Visual Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11.5px] text-[#64748B] dark:text-[#94A3B8]">
            <span>Batch Risk Spectrum: <strong>88.5% Low</strong> • <strong>7.7% Medium</strong> • <strong>3.8% High/Critical</strong></span>
            <span className="font-semibold text-[#1875FF]">ML Model v2.4</span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-200 dark:bg-slate-800">
            <div style={{ width: '88.5%' }} className="h-full bg-[#18A96B]" title="Low Risk: 88.5%" />
            <div style={{ width: '7.7%' }} className="h-full bg-[#F5A623]" title="Medium Risk: 7.7%" />
            <div style={{ width: '3.8%' }} className="h-full bg-[#F04444]" title="High Risk: 3.8%" />
          </div>
        </div>
      </div>

      {/* ---- Scored Transactions Table ---- */}
      <div className="mx-3 sm:mx-6 overflow-x-auto rounded-2xl border border-white/50 dark:border-white/10 bg-white/25 dark:bg-white/5">
        <table className="w-full text-left border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-white/40 dark:border-white/10 text-[11.5px] font-semibold text-[#52698F] dark:text-[#94A3B8] uppercase tracking-wider bg-white/20 dark:bg-white/5">
              <th className="py-2.5 px-3.5">Transaction ID</th>
              <th className="py-2.5 px-3">Timestamp</th>
              <th className="py-2.5 px-3">Amount</th>
              <th className="py-2.5 px-3">Type</th>
              <th className="py-2.5 px-3">ML Risk Score</th>
              <th className="py-2.5 px-3 hidden lg:table-cell">Detection Signal</th>
              <th className="py-2.5 px-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/30 dark:divide-white/5">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[#7C8DA8] dark:text-[#94A3B8]">
                  <p className="text-[14px] font-semibold text-[#0B1B3A] dark:text-[#F8FAFC]">
                    No transactions match your search filter.
                  </p>
                  <p className="text-[12px] mt-1 text-[#64748B] dark:text-[#94A3B8]">
                    Try searching by TX ID, amount, type (Wire, Card, ACH), or clear your filter.
                  </p>
                  <button
                    onClick={() => {
                      setLocalSearch('');
                      setFilter('all');
                      onClearSearch?.();
                    }}
                    className="mt-3 px-3 py-1.5 rounded-lg bg-[#1875FF] text-white text-[12px] font-semibold hover:bg-[#1565D8] transition-colors cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                </td>
              </tr>
            ) : (
              pagedData.map((tx) => (
                <tr
                  key={tx.id}
                  className="hover:bg-white/40 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  onClick={() => onRowClick ? onRowClick(tx) : onAction?.(`Transaction ${tx.id} opened`)}
                >
                  {/* ID */}
                  <td className="py-3 px-3.5 font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                    {tx.id}
                  </td>

                  {/* Timestamp */}
                  <td className="py-3 px-3 text-[#64748B] dark:text-[#94A3B8] whitespace-nowrap">
                    {formatTransactionTime(tx, now)}
                  </td>

                  {/* Amount */}
                  <td className="py-3 px-3 font-semibold text-[#0F172A] dark:text-[#F8FAFC] tabular-nums">
                    {tx.amount}
                  </td>

                  {/* Type */}
                  <td className="py-3 px-3 text-[#475569] dark:text-[#94A3B8]">
                    {tx.type}
                  </td>

                  {/* ML Score */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11.5px] font-bold tabular-nums ${
                          tx.risk === 'high'
                            ? 'bg-[#F04444]/15 text-[#F04444] border border-[#F04444]/30'
                            : tx.risk === 'medium'
                            ? 'bg-[#F5A623]/15 text-[#D48B0A] dark:text-[#FBBF24] border border-[#F5A623]/30'
                            : 'bg-[#18A96B]/15 text-[#18A96B] border border-[#18A96B]/30'
                        }`}
                      >
                        {tx.score.toFixed(2)}
                      </span>
                    </div>
                  </td>

                  {/* Detection Signal */}
                  <td className="py-3 px-3 text-[12px] text-[#52698F] dark:text-[#94A3B8] hidden lg:table-cell max-w-[240px] truncate">
                    {tx.signal}
                  </td>

                  {/* Status */}
                  <td className="py-3 px-3 text-right">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${
                        tx.status === 'Flagged'
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          : tx.status === 'Reviewing'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ---- Pagination & Count Bar ---- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-4 py-3 mx-3 sm:mx-6 border-t border-white/40 dark:border-white/10 text-[12px] text-[#64748B] dark:text-[#94A3B8]">
        <div className="flex items-center gap-2">
          <span>
            Showing <strong className="text-[#0B1B3A] dark:text-[#F8FAFC]">{filteredData.length === 0 ? 0 : (currentPage - 1) * effectivePageSize + 1}</strong>–<strong className="text-[#0B1B3A] dark:text-[#F8FAFC]">{Math.min(currentPage * effectivePageSize, filteredData.length)}</strong> of <strong className="text-[#0B1B3A] dark:text-[#F8FAFC]">{filteredData.length}</strong>
          </span>
          {compact && onViewAll && (
            <button
              onClick={onViewAll}
              className="text-[#1875FF] dark:text-[#38BDF8] hover:underline font-medium text-[11.5px] cursor-pointer ml-1"
            >
              • View full log
            </button>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded-lg border border-white/60 dark:border-white/10 bg-white/40 dark:bg-white/5 text-[#29466F] dark:text-[#E2E8F0] hover:bg-white/80 dark:hover:bg-white/15 disabled:opacity-35 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1 font-semibold text-[11.5px]"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>
            <span className="px-2 font-medium text-[11.5px] tabular-nums">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded-lg border border-white/60 dark:border-white/10 bg-white/40 dark:bg-white/5 text-[#29466F] dark:text-[#E2E8F0] hover:bg-white/80 dark:hover:bg-white/15 disabled:opacity-35 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1 font-semibold text-[11.5px]"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* ---- Bottom Summary Strip (Only on full Transactions page) ---- */}
      {!compact && (
        <div className="mx-3 mt-3 mb-4 glass-inset grid grid-cols-2 sm:mx-6 sm:grid-cols-4 sm:h-[76px] rounded-xl">
          {SUMMARY.map((item, i) => (
            <div
              key={item.label}
              className={`flex flex-col items-center justify-center py-2 sm:py-0 ${
                i < 3 ? 'border-r border-white/40 dark:border-white/10' : ''
              }`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-[20px] font-bold text-[#0B1B3A] dark:text-[#F8FAFC] font-[family-name:var(--font-display)] tabular-nums">
                  {item.metric}
                </span>
              </div>
              <span className="text-[11.5px] text-[#7C8DA8] dark:text-[#94A3B8]">{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
