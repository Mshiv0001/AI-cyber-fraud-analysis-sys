import React, { useState } from 'react';
import { Bell, AlertTriangle, CheckCircle, Info, Search, Check } from 'lucide-react';

const ALL_ALERTS = [
  { id: 'A001', icon: AlertTriangle, color: '#F04444', severity: 'High', title: 'Suspicious transaction TX-9842 detected', body: 'Wire transfer of $14,850 scored 0.96 — extreme amount outlier (>6σ from mean).', time: 'Yesterday, 10:24 AM', read: false },
  { id: 'A002', icon: AlertTriangle, color: '#F04444', severity: 'High', title: 'TX-9831 flagged — velocity burst', body: 'Card payment velocity burst detected. Score 0.88 — flagged for immediate review.', time: 'Yesterday, 09:52 AM', read: false },
  { id: 'A003', icon: AlertTriangle, color: '#D48B0A', severity: 'Medium', title: 'ACH transfer anomaly — TX-9810', body: 'Off-hours ACH spike scored 0.74. Analyst review recommended within 4h.', time: 'Yesterday, 08:30 AM', read: false },
  { id: 'A004', icon: CheckCircle, color: '#18A96B', severity: 'Success', title: "Batch 'sept_tx_batch_04.csv' processed", body: '1,240 transactions scanned. 142 high-risk, 95 medium-risk, 1,003 cleared.', time: 'Yesterday, 09:41 AM', read: true },
  { id: 'A005', icon: Info, color: '#1769FF', severity: 'Info', title: 'Audit log for Batch #2026-09 updated', body: 'Compliance log generated and stored for regulatory review.', time: 'Yesterday, 11:20 PM', read: true },
  { id: 'A006', icon: AlertTriangle, color: '#D48B0A', severity: 'Medium', title: 'Amount anomaly flagged in TX-8841', body: 'Merchant category code mismatch detected — requires secondary review.', time: 'Yesterday, 06:14 PM', read: true },
  { id: 'A007', icon: CheckCircle, color: '#18A96B', severity: 'Success', title: 'Batch fraud summary report generated', body: 'Monthly report for September 2026 compiled and ready for download.', time: 'Yesterday, 01:03 PM', read: true },
];

const SEV_FILTER = ['All', 'High', 'Medium', 'Info', 'Success'];
const SEV_COLOR = { High: '#F04444', Medium: '#D48B0A', Info: '#1769FF', Success: '#18A96B' };

export default function AlertsPage({ onToast, liveAlerts = [], onMarkAllRead, onMarkAlertRead, searchQueryProp = '' }) {
  // Convert live alerts (from simulation SSE) to the display format
  const liveFormatted = React.useMemo(() => liveAlerts.map(a => ({
    id: a.id,
    icon: a.severity === 'High' ? AlertTriangle : a.severity === 'Success' ? CheckCircle : Info,
    color: a.severity === 'High' ? '#F04444' : a.severity === 'Medium' ? '#D48B0A' : '#18A96B',
    severity: a.severity || 'High',
    title: (a.title || 'High-risk alert').replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim(),
    body: (a.body || '').replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim(),
    time: a.created_at
      ? new Date(a.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      : 'Just now',
    read: Boolean(a.read),
    isLive: true,
  })), [liveAlerts]);

  const [staticAlerts, setStaticAlerts] = useState(ALL_ALERTS);
  const alerts = liveAlerts.length > 0 ? liveFormatted : staticAlerts;

  const [sevFilter, setSevFilter] = useState('All');
  const [search, setSearch] = useState(searchQueryProp);

  React.useEffect(() => {
    if (searchQueryProp !== undefined) setSearch(searchQueryProp);
  }, [searchQueryProp]);

  const filtered = alerts.filter(a => {
    if (sevFilter !== 'All' && a.severity !== sevFilter) return false;
    if (search && !a.title.toLowerCase().includes(search.toLowerCase()) && !a.body.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const markRead = (id) => {
    if (liveAlerts.length > 0) {
      onMarkAlertRead?.(id);
    } else {
      setStaticAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
    }
  };

  const markAllRead = () => {
    if (liveAlerts.length > 0) {
      onMarkAllRead?.();
      // App.jsx's handleMarkAllRead already announces the toast — no duplicate
    } else {
      setStaticAlerts(prev => prev.map(a => ({ ...a, read: true })));
      onToast?.('All alerts marked as read');
    }
  };

  const unreadCount = alerts.filter(a => !a.read).length;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(240,68,68,0.1)', border: '1px solid rgba(240,68,68,0.25)' }}>
            <Bell className="w-5 h-5 text-[#F04444]" strokeWidth={2.2} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[24px] font-bold text-[#0B1B3A] dark:text-[#F8FAFC] font-[family-name:var(--font-display)] leading-tight">Alerts</h2>
              {unreadCount > 0 && (
                <span className="bg-[#F04444] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>
              )}
            </div>
            <p className="text-[13px] text-[#58709A] dark:text-[#94A3B8]">Security events and system notifications</p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-2 h-[40px] px-4 rounded-2xl bg-white/60 border border-white/70 text-[13px] font-semibold text-[#1769FF] hover:bg-white/80 transition-all cursor-pointer">
            <Check className="w-4 h-4" strokeWidth={2.5} />
            Mark all read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="glass-card" style={{ padding: '14px 16px' }}>
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11.5px] font-semibold text-[#52698F] dark:text-[#94A3B8] uppercase tracking-wider mr-1">Severity:</span>
            {SEV_FILTER.map(s => (
              <button key={s} onClick={() => setSevFilter(s)}
                className={`text-[12px] font-semibold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${sevFilter === s ? 'bg-[#1875FF] text-white' : 'bg-white/50 dark:bg-white/10 text-[#475569] dark:text-[#94A3B8] hover:bg-white/80'}`}>
                {s}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#7C8DA8]" />
            <input type="text" placeholder="Search alerts…" value={search} onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-[12px] rounded-lg bg-white/60 dark:bg-white/10 border border-white/70 dark:border-white/10 text-[#0F172A] dark:text-[#F8FAFC] placeholder:text-[#7C8DA8] outline-none focus:border-[#1875FF] w-[200px]" />
          </div>
        </div>
      </div>

      {/* Alerts list */}
      <div className="glass-card-strong overflow-hidden" style={{ padding: 0 }}>
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Bell className="w-10 h-10 mx-auto mb-3 text-[#7C8DA8] opacity-30" />
            <p className="text-[14px] font-semibold text-[#0B1B3A] dark:text-[#F8FAFC]">No alerts match your filter</p>
          </div>
        ) : (
          <div className="divide-y divide-white/30 dark:divide-white/8">
            {filtered.map(a => {
              const Icon = a.icon;
              return (
                <div key={a.id}
                  onClick={() => markRead(a.id)}
                  className={`flex items-start gap-4 px-5 py-4 transition-all cursor-pointer ${a.read ? 'opacity-70' : 'bg-white/20 dark:bg-white/5'} hover:bg-white/35 dark:hover:bg-white/10`}>
                  <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center mt-0.5"
                    style={{ background: a.color + '18', border: `1px solid ${a.color}33` }}>
                    <Icon className="w-4.5 h-4.5" style={{ color: a.color }} strokeWidth={2.2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-[13.5px] font-semibold text-[#0B1B3A] dark:text-[#F8FAFC] leading-tight ${!a.read ? '' : ''}`}>
                        {a.title}
                        {!a.read && <span className="ml-2 inline-block w-1.5 h-1.5 rounded-full bg-[#1769FF] align-middle" />}
                      </p>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md" style={{ color: SEV_COLOR[a.severity] || '#52698F', background: (SEV_COLOR[a.severity] || '#52698F') + '18', border: `1px solid ${(SEV_COLOR[a.severity] || '#52698F')}33` }}>
                          {a.severity}
                        </span>
                        <span className="text-[11px] text-[#7C8DA8] whitespace-nowrap">{a.time}</span>
                      </div>
                    </div>
                    <p className="text-[12.5px] text-[#52698F] dark:text-[#94A3B8] mt-1 leading-relaxed">{a.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
