import React from 'react';
import {
  Activity,
  AlertTriangle,
  Users,
  FileText,
  Link as LinkIcon,
  CheckCircle,
} from 'lucide-react';

const ACTIVITIES = [
  {
    icon: AlertTriangle,
    color: '#F04444',
    text: 'Suspicious transaction TX-9842 detected',
    time: 'Yesterday, 10:24 AM',
    badge: 'High',
    badgeClass: 'badge-high',
  },
  {
    icon: CheckCircle,
    color: '#18A96B',
    text: "Batch 'sept_tx_batch_04.csv' scanned",
    time: 'Yesterday, 09:41 AM',
    badge: 'Success',
    badgeClass: 'badge-success',
  },
  {
    icon: FileText,
    color: '#1875FF',
    text: 'Audit log for Batch #2026-09 updated',
    time: 'Yesterday, 11:20 PM',
    badge: 'Info',
    badgeClass: 'badge-info',
  },
  {
    icon: LinkIcon,
    color: '#D97706',
    text: 'Amount anomaly flagged in TX-8841',
    time: 'Yesterday, 06:14 PM',
    badge: 'Medium',
    badgeClass: 'badge-medium',
  },
  {
    icon: CheckCircle,
    color: '#059669',
    text: 'Batch fraud summary report generated',
    time: 'Yesterday, 01:03 PM',
    badge: 'Success',
    badgeClass: 'badge-success',
  },
];

export default function RecentActivity({ onViewAll }) {
  return (
    <div id="tour-recent-activity" className="glass-card flex flex-col" style={{ padding: '20px 20px 20px 20px' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-0" style={{ marginBottom: '16px' }}>
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#0F172A] dark:text-[#F8FAFC]" strokeWidth={2.2} />
          <h3 className="text-[17px] font-bold text-[#0F172A] dark:text-[#F8FAFC] font-[family-name:var(--font-display)]">
            Recent Activity
          </h3>
        </div>
        <button
          onClick={onViewAll}
          className="text-[12.5px] font-semibold text-[#1875FF] hover:underline transition-all cursor-pointer"
        >
          View all →
        </button>
      </div>

      {/* Activity List */}
      <div className="flex flex-col gap-2">
        {ACTIVITIES.map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={i}
              className="flex items-center gap-3.5 px-2.5 py-2 -mx-2.5 rounded-xl hover:bg-white/35 dark:hover:bg-white/10 transition-all cursor-pointer group"
            >
              {/* Icon Container with KPI card aesthetics */}
              <div
                className="w-[36px] h-[36px] shrink-0 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
                style={{
                  backgroundColor: item.color + '18',
                  border: `1px solid ${item.color}33`,
                }}
              >
                <Icon className="w-[18px] h-[18px]" style={{ color: item.color }} strokeWidth={2.2} />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="activity-title text-[13.5px] font-semibold text-[#0B1B3A] dark:text-[#F8FAFC] truncate">
                  {item.text}
                </p>
                <p className="activity-time text-[11.5px] text-[#7C8DA8] dark:text-[#94A3B8] mt-0.5">
                  {item.time}
                </p>
              </div>

              {/* Badge Button on right */}
              <span className={`badge ${item.badgeClass} shrink-0`}>{item.badge}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
