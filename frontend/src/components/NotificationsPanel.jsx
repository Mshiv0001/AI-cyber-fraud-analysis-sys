import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, CheckCircle, Info, Bell, Zap, Check } from 'lucide-react';

const SEV_ICON = {
  High:    AlertTriangle,
  Medium:  AlertTriangle,
  Success: CheckCircle,
  Info:    Info,
};
const SEV_COLOR = {
  High:    '#F04444',
  Medium:  '#D48B0A',
  Success: '#18A96B',
  Info:    '#1769FF',
};

// Static fallback notifications (when no live alerts)
const STATIC_NOTIFICATIONS = [
  {
    id: 1,
    icon: AlertTriangle,
    color: '#F04444',
    title: 'High-risk transaction detected',
    body: 'TX-9842 scored 0.96 — Wire transfer flagged for review.',
    time: 'Yesterday, 10:24 AM',
    unread: true,
  },
  {
    id: 2,
    icon: CheckCircle,
    color: '#18A96B',
    title: 'Batch scan complete',
    body: "sept_tx_batch_04.csv processed — 1,240 records, 142 flagged.",
    time: 'Yesterday, 09:41 AM',
    unread: true,
  },
  {
    id: 3,
    icon: Info,
    color: '#1769FF',
    title: 'Model accuracy updated',
    body: 'LightGBM model validation score on record.',
    time: 'Yesterday, 11:20 PM',
    unread: false,
  },
];

function alertToNotif(a) {
  const Sev = a.severity || 'High';
  const cleanTitle = (a.title || 'High-risk alert')
    .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
    .trim();
  const cleanBody = (a.body || '')
    .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
    .trim();
  return {
    id: a.id,
    icon: SEV_ICON[Sev] || AlertTriangle,
    color: SEV_COLOR[Sev] || '#F04444',
    title: cleanTitle,
    body: cleanBody,
    time: a.created_at
      ? new Date(a.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      : 'Just now',
    unread: !a.read,
    case_id: a.case_id,
    isLive: true,
  };
}

export default function NotificationsPanel({ isOpen, onClose, liveAlerts = null, onMarkAllRead, onMarkAlertRead }) {
  const [staticList, setStaticList] = React.useState(STATIC_NOTIFICATIONS);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const notifications = liveAlerts && liveAlerts.length > 0
    ? liveAlerts.map(alertToNotif)
    : staticList;

  const unreadCount = notifications.filter(n => n.unread).length;

  const handleMarkAll = () => {
    if (liveAlerts && liveAlerts.length > 0) {
      onMarkAllRead?.();
    } else {
      setStaticList(prev => prev.map(n => ({ ...n, unread: false })));
    }
  };

  const handleItemClick = (n) => {
    if (n.isLive && n.unread) {
      onMarkAlertRead?.(n.id);
    } else if (!n.isLive) {
      setStaticList(prev => prev.map(item => item.id === n.id ? { ...item, unread: false } : item));
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-[#0B1B3A]/20 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className="fixed right-0 top-0 h-full z-50 w-full max-w-[380px] flex flex-col"
        style={{
          background: 'linear-gradient(160deg, rgba(230,242,255,0.97) 0%, rgba(215,234,255,0.97) 100%)',
          backdropFilter: 'blur(40px) saturate(200%)',
          WebkitBackdropFilter: 'blur(40px) saturate(200%)',
          borderLeft: '1px solid rgba(255,255,255,0.7)',
          boxShadow: '-24px 0 80px rgba(11,27,58,0.14)',
          animation: 'drawerSlideIn 0.32s cubic-bezier(0.16,1,0.3,1) both',
        }}
        role="dialog"
        aria-label="Notifications"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/60">
          <div className="flex items-center gap-2.5">
            <Bell className="w-5 h-5 text-[#1769FF]" strokeWidth={2} />
            <h2 className="text-[18px] font-bold text-[#0B1B3A] font-[family-name:var(--font-display)]">
              Notifications
            </h2>
            {unreadCount > 0 && (
              <span className="bg-[#F04444] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums">
                {unreadCount}
              </span>
            )}
            {liveAlerts && liveAlerts.length > 0 && (
              <span
                className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(24,169,107,0.12)', color: '#18A96B', border: '1px solid rgba(24,169,107,0.3)' }}
              >
                <Zap className="w-2.5 h-2.5" />
                LIVE
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/60 border border-white/70 flex items-center justify-center hover:bg-white/90 transition-all cursor-pointer"
            aria-label="Close notifications"
          >
            <X className="w-4 h-4 text-[#475569]" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {notifications.map((n) => {
            const Icon = n.icon;
            return (
              <div
                key={n.id}
                onClick={() => handleItemClick(n)}
                className={`flex items-start gap-3.5 p-4 rounded-2xl border transition-all cursor-pointer group ${
                  n.unread
                    ? 'bg-white/70 dark:bg-white/10 border-white/80 dark:border-white/20 shadow-sm'
                    : 'bg-white/40 dark:bg-white/5 border-white/50 dark:border-white/10 opacity-75 hover:opacity-100'
                }`}
              >
                <div
                  className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center mt-0.5"
                  style={{ background: n.color + '18', border: `1px solid ${n.color}33` }}
                >
                  <Icon className="w-4.5 h-4.5" style={{ color: n.color }} strokeWidth={2.2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[13px] font-semibold text-[#0B1B3A] dark:text-[#F8FAFC] leading-tight">
                      {n.title}
                      {n.unread && (
                        <span className="ml-2 inline-block w-2 h-2 rounded-full bg-[#1875FF] align-middle shadow-[0_0_6px_rgba(24,117,255,0.6)]" title="Unread" />
                      )}
                    </p>
                    <span className="text-[11px] text-[#7C8DA8] dark:text-[#94A3B8] shrink-0 mt-0.5">{n.time}</span>
                  </div>
                  <p className="text-[12px] text-[#52698F] dark:text-[#94A3B8] mt-1 leading-relaxed">{n.body}</p>
                  {n.case_id && (
                    <p className="text-[11px] text-[#1875FF] mt-1 font-semibold">Case: {n.case_id}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/60">
          <button
            onClick={handleMarkAll}
            disabled={unreadCount === 0}
            className={`w-full h-[40px] rounded-[14px] text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
              unreadCount === 0
                ? 'text-[#7C8DA8] dark:text-[#94A3B8] bg-white/30 dark:bg-white/5 border border-white/40 cursor-default opacity-80'
                : 'text-[#1875FF] dark:text-[#38BDF8] border border-white/70 dark:border-white/20 bg-white/60 dark:bg-white/10 hover:bg-white/90 shadow-sm cursor-pointer'
            }`}
          >
            {unreadCount === 0 ? (
              <>
                <CheckCircle className="w-4 h-4 text-[#18A96B]" />
                <span>All caught up</span>
              </>
            ) : (
              <span>Mark all as read</span>
            )}
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
