import React from 'react';
import {
  Home,
  ArrowLeftRight,
  Briefcase,
  BarChart3,
  Bell,
  Settings,
  Shield,
  Sun,
  Moon,
  ArrowRight,
  X,
  LogOut,
  Sparkles,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
  { id: 'cases', label: 'Cases', icon: Briefcase },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'alerts', label: 'Alerts', icon: Bell },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({
  activeNav = 'home',
  onNavChange,
  theme,
  onThemeChange,
  onAction,
  onStartTour,
  onLogout,
  isMobileOpen = false,
  onMobileClose,
}) {
  return (
    <>
      {/* ── Desktop sidebar (always visible ≥ lg) ── */}
      <aside
        className="app-sidebar fixed w-[256px] z-30 hidden glass-sidebar flex-col overflow-hidden lg:flex"
        style={{
          paddingTop: '12px',
          paddingBottom: '12px',
          paddingLeft: '20px',
          paddingRight: '20px',
        }}
      >
        <SidebarContent
          activeNav={activeNav}
          onNavChange={onNavChange}
          theme={theme}
          onThemeChange={onThemeChange}
          onAction={onAction}
          onStartTour={onStartTour}
          onLogout={onLogout}
        />
      </aside>

      {/* ── Mobile drawer (slides in from left on small screens) ── */}
      <aside
        className={`fixed top-0 left-0 h-full w-[270px] z-30 flex flex-col overflow-hidden lg:hidden glass-sidebar transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          paddingTop: '12px',
          paddingBottom: '12px',
          paddingLeft: '20px',
          paddingRight: '20px',
        }}
        aria-label="Mobile navigation"
      >
        {/* Close button */}
        <button
          onClick={onMobileClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/60 border border-white/70 flex items-center justify-center hover:bg-white/90 transition-all cursor-pointer"
          aria-label="Close navigation"
        >
          <X className="w-4 h-4 text-[#475569]" strokeWidth={2} />
        </button>

        <SidebarContent
          activeNav={activeNav}
          onNavChange={(id) => { onNavChange?.(id); onMobileClose?.(); }}
          theme={theme}
          onThemeChange={onThemeChange}
          onAction={() => { onAction?.(); onMobileClose?.(); }}
          onStartTour={() => { (onStartTour || onAction)?.(); onMobileClose?.(); }}
          onLogout={() => { onLogout?.(); onMobileClose?.(); }}
        />
      </aside>
    </>
  );
}

function SidebarContent({ activeNav, onNavChange, theme, onThemeChange, onAction, onStartTour, onLogout }) {
  return (
    <>
      {/* ---- Brand ---- */}
      <div className="pb-3">
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center w-[42px] h-[42px] rounded-2xl bg-gradient-to-br from-[#1769FF] to-[#2F80FF] shadow-[0_4px_18px_rgba(23,105,255,0.30)] shrink-0">
            <Shield className="w-5 h-5 text-white" strokeWidth={2.2} />
            <div className="absolute inset-0 rounded-2xl bg-[#1769FF]/10 blur-md -z-10" />
          </div>
          <div className="min-w-0">
            <h1 className="text-[20px] font-bold text-[#0B1B3A] font-[family-name:var(--font-display)] tracking-tight truncate">
              FraudGuard
            </h1>
            <p className="text-[11px] text-[#58709A] tracking-wide truncate">
              Detect • Connect • Prevent
            </p>
          </div>
        </div>
      </div>

      {/* ---- Navigation ---- */}
      <nav className="flex-1" style={{ marginTop: '30px' }}>
        <div className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavChange?.(item.id)}
                style={{ paddingLeft: '20px', paddingRight: '16px' }}
                className={`nav-item w-full flex items-center gap-3.5 h-[46px] rounded-[14px] text-[14px] font-medium cursor-pointer ${
                  isActive
                    ? 'nav-active'
                    : 'text-[#16305A] hover:text-[#0B1B3A]'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon
                  className={`w-[20px] h-[20px] shrink-0 ${
                    isActive ? 'text-white' : 'text-[#294A78]'
                  }`}
                  strokeWidth={1.9}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ---- Bottom Safety Card & Theme Toggle ---- */}
      <div className="mt-auto flex flex-col gap-3.5 pt-2">
        {/* Guided Tour Card */}
        <div
          onClick={onStartTour || onAction}
          className="relative glass-card overflow-hidden cursor-pointer group hover:border-[#1769FF]/40 transition-all duration-300"
          style={{ padding: '16px 18px' }}
          title="Click to start interactive dashboard tour"
        >
          <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-gradient-to-br from-[#1769FF]/15 to-[#31D6D0]/15 blur-xl pointer-events-none" />
          <div className="relative flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#1769FF]/10 text-[#1769FF] dark:bg-[#1769FF]/20 dark:text-[#60A5FA] border border-[#1769FF]/20">
                <Sparkles className="w-2.5 h-2.5" /> Guided Tour
              </span>
              <button
                type="button"
                aria-label="Start guided tour"
                onClick={(e) => {
                  e.stopPropagation();
                  (onStartTour || onAction)?.();
                }}
                className="w-7 h-7 rounded-full bg-white/80 dark:bg-white/15 border border-white/90 dark:border-white/20 flex items-center justify-center shadow-sm group-hover:bg-[#1769FF] group-hover:text-white group-hover:translate-x-0.5 transition-all cursor-pointer shrink-0 tour-trigger-pulse"
              >
                <ArrowRight className="w-3.5 h-3.5 text-[#0B1B3A] dark:text-[#F8FAFC] group-hover:text-white" />
              </button>
            </div>
            <div className="text-[13px] font-bold text-[#0B1B3A] dark:text-[#F8FAFC] leading-[1.3] mt-0.5">
              A safer digital world starts with you.
            </div>
            <p className="text-[11px] text-[#58709A] dark:text-[#94A3B8] group-hover:text-[#1769FF] dark:group-hover:text-[#60A5FA] transition-colors flex items-center gap-1 font-medium">
              <span>Start interactive guide</span>
              <span className="group-hover:translate-x-0.5 transition-transform">→</span>
            </p>
          </div>
        </div>

        {/* Light / Dark Toggle */}
        <div className="flex items-center h-[42px] rounded-full glass-inset p-1 gap-1.5">
          <button
            onClick={() => onThemeChange?.('light')}
            className={`flex-1 flex items-center justify-center gap-1.5 h-full rounded-full text-[12.5px] cursor-pointer transition-all ${
              theme === 'light'
                ? 'theme-toggle-active font-semibold'
                : 'theme-toggle-inactive font-medium text-[#7C8DA8] hover:text-[#52698F]'
            }`}
          >
            <Sun className="w-3.5 h-3.5 shrink-0" />
            <span>Light</span>
          </button>
          <button
            onClick={() => onThemeChange?.('dark')}
            className={`flex-1 flex items-center justify-center gap-1.5 h-full rounded-full text-[12.5px] cursor-pointer transition-all ${
              theme === 'dark'
                ? 'theme-toggle-active font-semibold'
                : 'theme-toggle-inactive font-medium text-[#7C8DA8] hover:text-[#52698F]'
            }`}
          >
            <Moon className="w-3.5 h-3.5 shrink-0" />
            <span>Dark</span>
          </button>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 h-[38px] rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[12.5px] font-semibold transition-all cursor-pointer"
          title="Sign out of FraudGuard"
        >
          <LogOut className="w-3.5 h-3.5" strokeWidth={2.2} />
          <span>Sign Out</span>
        </button>
      </div>
    </>
  );
}
