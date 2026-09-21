import React from 'react';
import {
  Plus,
  Upload,
  BarChart3,
  Bell,
  ArrowLeftRight,
  Settings,
  ChevronRight,
  Zap,
  Sparkles,
} from 'lucide-react';

const ACTIONS = [
  {
    icon: Plus,
    color: '#1769FF',
    darkColor: '#38BDF8',
    title: 'New Case',
    subtitle: 'Single transaction analysis',
  },
  {
    icon: Upload,
    color: '#18A96B',
    darkColor: '#34D399',
    title: 'Upload Data',
    subtitle: 'Bulk CSV batch scan',
  },
  {
    icon: BarChart3,
    color: '#8067FF',
    darkColor: '#A78BFA',
    title: 'View Analytics',
    subtitle: 'ML model & risk trends',
  },
  {
    icon: Bell,
    color: '#F04444',
    darkColor: '#F87171',
    title: 'Security Alerts',
    subtitle: 'Active threat stream',
  },
  {
    icon: ArrowLeftRight,
    color: '#0284C7',
    darkColor: '#38BDF8',
    title: 'Transactions',
    subtitle: 'Search & filter logs',
  },
  {
    icon: Settings,
    color: '#52698F',
    darkColor: '#CBD5E1',
    title: 'Settings',
    subtitle: 'Preferences & thresholds',
  },
];

export default function QuickActions({ onAction }) {
  return (
    <div
      id="tour-quick-actions"
      className="glass-card flex flex-col relative overflow-hidden"
      style={{ padding: '18px 16px' }}
    >
      {/* Subtle liquid glow blob */}
      <div className="quick-actions-blob absolute -right-6 -bottom-6 w-36 h-36 rounded-full pointer-events-none blur-2xl opacity-35" />

      {/* Header */}
      <div className="flex items-center justify-between px-0 relative z-10 mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.25)' }}
          >
            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#F5A623]" strokeWidth={2.2} />
          </div>
          <div>
            <h3 className="text-[15px] sm:text-[16px] font-bold text-[#0B1B3A] dark:text-[#F8FAFC] font-[family-name:var(--font-display)] leading-tight">
              Quick Actions
            </h3>
            <p className="text-[11px] sm:text-[11.5px] text-[#58709A] dark:text-[#94A3B8]">
              Instant navigation & forensic tools
            </p>
          </div>
        </div>

        <span className="text-[10px] sm:text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase tracking-wider">
          6 Tools
        </span>
      </div>

      {/* Responsive Grid: 1 col on mobile, 2 col on tablet/desktop full width, 1 col on xl (narrow sidebar 1280-1535px), 2 col on 2xl */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2 gap-2 relative z-10 mb-3">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.title}
              onClick={() => onAction?.(action.title)}
              className="quick-action-btn flex items-center gap-2.5 rounded-[14px] cursor-pointer text-left group p-2.5 sm:p-3"
              style={{ minHeight: '56px' }}
              aria-label={action.title}
            >
              {/* Icon pod */}
              <div
                className="quick-action-icon-box w-[34px] h-[34px] sm:w-[36px] sm:h-[36px] shrink-0 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
                style={{
                  '--icon-color': action.color,
                  '--icon-dark-color': action.darkColor,
                }}
              >
                <Icon className="quick-action-icon w-[16px] h-[16px] sm:w-[18px] sm:h-[18px]" strokeWidth={2.2} />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <p className="quick-action-title text-[12.5px] sm:text-[13px] font-bold text-[#0B1B3A] dark:text-[#F8FAFC] leading-tight group-hover:text-[#1769FF] dark:group-hover:text-[#38BDF8] transition-colors truncate">
                  {action.title}
                </p>
                <p className="quick-action-subtitle text-[10.5px] sm:text-[11px] text-[#7C8DA8] dark:text-[#94A3B8] leading-tight mt-0.5 truncate">
                  {action.subtitle}
                </p>
              </div>

              {/* Arrow */}
              <ChevronRight className="quick-action-chevron w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 shrink-0 opacity-40 group-hover:opacity-100" />
            </button>
          );
        })}
      </div>

      {/* Pro-Tip / AI Engine Footer */}
      <div className="relative z-10 pt-2 border-t border-white/40 dark:border-white/10 flex items-center justify-between text-[11px] sm:text-[11.5px] text-[#58709A] dark:text-[#94A3B8]">
        <div className="flex items-center gap-1.5 truncate">
          <Sparkles className="w-3.5 h-3.5 text-[#1769FF] dark:text-[#38BDF8] shrink-0" />
          <span className="truncate">LightGBM ML Active</span>
        </div>
        <div className="flex items-center gap-1 opacity-80 shrink-0">
          <kbd className="px-1.5 py-0.5 rounded bg-white/60 dark:bg-white/10 border border-white/70 dark:border-white/15 text-[9.5px] sm:text-[10px] font-mono">
            Ctrl K
          </kbd>
          <span className="hidden xs:inline">Search</span>
        </div>
      </div>
    </div>
  );
}
