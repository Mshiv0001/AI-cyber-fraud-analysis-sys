import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Search, Bell, Plus, ChevronDown, Menu, Settings, LogOut,
  ArrowLeftRight, Briefcase, BarChart3, ArrowRight,
} from 'lucide-react';

const NAV_SHORTCUTS = [
  { label: 'Transactions', path: '/transactions', icon: ArrowLeftRight, desc: 'View transaction logs & risk scoring' },
  { label: 'Cases', path: '/cases', icon: Briefcase, desc: 'Manage fraud investigation cases' },
  { label: 'Analytics', path: '/analytics', icon: BarChart3, desc: 'Fraud trends & model performance' },
  { label: 'Alerts', path: '/alerts', icon: Bell, desc: 'Security events & notifications' },
  { label: 'Settings', path: '/settings', icon: Settings, desc: 'Profile and preferences' },
];

function getRiskBadge(risk) {
  const r = (risk || '').toLowerCase();
  if (r === 'high' || r === 'critical') return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30';
  if (r === 'medium') return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30';
  return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30';
}

function getStatusBadge(status) {
  const s = (status || '').toLowerCase();
  if (s === 'open') return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30';
  if (s.includes('review')) return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30';
  return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30';
}

export default function TopBar({
  user = { name: 'Mohit', initials: 'MS', email: 'admin@fraudguard.io' },
  onNewCase,
  onNotify,
  onProfile,
  onLogout,
  onSearch,
  searchQuery = '',
  onToggleMobileNav,
  unreadAlertCount = 0,
  transactions = [],
  cases = [],
  alerts = [],
  onSelectTx,
  onSelectCase,
  onSelectAlert,
  onNavigate,
}) {
  const [query, setQuery] = useState(searchQuery);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const inputRef = useRef(null);
  const profileRef = useRef(null);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    setQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const handler = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        if (query.trim()) setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      const inSearchContainer = searchContainerRef.current && searchContainerRef.current.contains(e.target);
      if (!inSearchContainer) {
        setSearchOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleChange = (event) => {
    const val = event.target.value;
    setQuery(val);
    onSearch?.(val);
    setSearchOpen(val.trim().length > 0);
  };

  const submitSearch = (event) => {
    event.preventDefault();
    const q = query.trim();
    if (!q) return;
    onSearch?.(q);
    setSearchOpen(false);

    if (q.toLowerCase().startsWith('case-')) {
      onNavigate?.('/cases');
    } else if (onNavigate) {
      onNavigate('/transactions');
    } else {
      const table = document.getElementById('tour-risk-table');
      if (table) table.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const searchResults = useMemo(() => {
    const q = (query || '').trim().toLowerCase();
    if (!q) return null;

    const matchedPages = NAV_SHORTCUTS.filter(p =>
      p.label.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)
    );

    const cleanSearchNum = q.replace(/[^0-9.]/g, '');
    const matchedTx = (transactions || []).filter(tx => {
      const id = String(tx.id || '').toLowerCase();
      const type = String(tx.type || tx.payment_method || '').toLowerCase();
      const signal = String(tx.signal || '').toLowerCase();
      const status = String(tx.status || '').toLowerCase();
      const risk = String(tx.risk || '').toLowerCase();
      const customerId = String(tx.customer_id || '').toLowerCase();
      const strAmount = String(tx.amount || '');
      const cleanTxNum = strAmount.replace(/[^0-9.]/g, '');

      return (
        id.includes(q) ||
        type.includes(q) ||
        signal.includes(q) ||
        status.includes(q) ||
        risk.includes(q) ||
        customerId.includes(q) ||
        (cleanSearchNum.length > 0 && cleanTxNum.includes(cleanSearchNum))
      );
    }).slice(0, 4);

    const matchedCases = (cases || []).filter(c => {
      const id = String(c.id || '').toLowerCase();
      const summary = String(c.summary || '').toLowerCase();
      const analyst = String(c.analyst || '').toLowerCase();
      const status = String(c.status || '').toLowerCase();
      const risk = String(c.risk || c.risk_level || '').toLowerCase();

      return id.includes(q) || summary.includes(q) || analyst.includes(q) || status.includes(q) || risk.includes(q);
    }).slice(0, 3);

    const matchedAlerts = (alerts || []).filter(a => {
      const title = String(a.title || '').toLowerCase();
      const body = String(a.body || '').toLowerCase();
      const severity = String(a.severity || '').toLowerCase();

      return title.includes(q) || body.includes(q) || severity.includes(q);
    }).slice(0, 2);

    const totalCount = matchedPages.length + matchedTx.length + matchedCases.length + matchedAlerts.length;

    return {
      pages: matchedPages,
      transactions: matchedTx,
      cases: matchedCases,
      alerts: matchedAlerts,
      totalCount,
    };
  }, [query, transactions, cases, alerts]);

  return (
    <header className={`app-topbar glass-topbar min-h-[56px] sm:min-h-[72px] flex items-center justify-between gap-2 sm:gap-3 relative overflow-visible transition-all ${searchOpen ? 'z-50' : 'z-20'}`}>
      <button
        type="button"
        onClick={onToggleMobileNav}
        className="lg:hidden w-[40px] h-[40px] sm:w-[46px] sm:h-[46px] rounded-xl sm:rounded-2xl bg-white/50 dark:bg-white/10 border border-white/70 dark:border-white/15 flex items-center justify-center hover:bg-white/70 dark:hover:bg-white/20 transition-all cursor-pointer shrink-0 shadow-sm"
        aria-label="Open navigation menu"
        aria-expanded="false"
      >
        <Menu className="w-[20px] h-[20px] sm:w-[22px] sm:h-[22px] text-[#193B6D] dark:text-[#F8FAFC]" strokeWidth={1.9} />
      </button>

      <div className="relative flex-1 min-w-0 max-w-[700px]" ref={searchContainerRef}>
        <form onSubmit={submitSearch} className="app-search glass-input flex min-w-0 w-full items-center gap-2 sm:gap-3 h-[42px] sm:h-[48px] px-3 sm:px-4">
          <Search className="w-[18px] h-[18px] sm:w-[20px] sm:h-[20px] shrink-0 text-[#193B6D] dark:text-[#94A3B8]" strokeWidth={2} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            onFocus={() => { if (query.trim()) setSearchOpen(true); }}
            placeholder="Search cases, txs, batches..."
            className="min-w-0 flex-1 bg-transparent text-[13px] sm:text-[14px] text-[#0B1B3A] dark:text-[#F8FAFC] placeholder:text-[#52698F] dark:placeholder:text-[#94A3B8] outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                onSearch?.('');
                setSearchOpen(false);
              }}
              className="text-[12px] text-[#7C8DA8] hover:text-[#0B1B3A] dark:hover:text-[#F8FAFC] px-2 py-0.5 rounded cursor-pointer"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
          <button type="button" onClick={() => inputRef.current?.focus()} className="hidden sm:flex items-center gap-0.5 px-3 py-1 rounded-md bg-transparent border border-transparent text-[11px] text-[#52698F] dark:text-[#94A3B8] font-medium shrink-0" aria-label="Focus search with Control K">Ctrl K</button>
        </form>

        {searchOpen && searchResults && (
          <div className="absolute left-0 right-0 top-full mt-2 z-[100] rounded-2xl bg-white dark:bg-[#0B1528] border border-white/80 dark:border-white/20 shadow-[0_24px_60px_rgba(0,0,0,0.65)] overflow-hidden flex flex-col max-h-[460px]">
            <div className="overflow-y-auto p-2.5 flex flex-col gap-3 divide-y divide-white/40 dark:divide-white/5">
              {searchResults.pages.length > 0 && (
                <div className="pt-1 first:pt-0">
                  <p className="text-[11px] font-bold text-[#52698F] dark:text-[#94A3B8] uppercase tracking-wider px-2.5 mb-1.5">
                    Pages
                  </p>
                  <div className="space-y-1">
                    {searchResults.pages.map(p => {
                      const Icon = p.icon;
                      return (
                        <button
                          key={p.path}
                          type="button"
                          onClick={() => {
                            onNavigate?.(p.path);
                            setSearchOpen(false);
                            setQuery('');
                            onSearch?.('');
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-[#1769FF]/10 dark:hover:bg-white/5 transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-[#1769FF]/10 dark:bg-[#1769FF]/20 flex items-center justify-center text-[#1769FF] dark:text-[#38BDF8] shrink-0">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[13px] font-semibold text-[#0B1B3A] dark:text-[#F8FAFC] group-hover:text-[#1769FF] dark:group-hover:text-[#38BDF8] transition-colors truncate">
                                {p.label}
                              </p>
                              <p className="text-[11px] text-[#52698F] dark:text-[#94A3B8] truncate">{p.desc}</p>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-[#7C8DA8] dark:text-[#64748B] group-hover:translate-x-0.5 transition-transform shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {searchResults.transactions.length > 0 && (
                <div className="pt-2 first:pt-0">
                  <p className="text-[11px] font-bold text-[#52698F] dark:text-[#94A3B8] uppercase tracking-wider px-2.5 mb-1.5">
                    Transactions ({searchResults.transactions.length})
                  </p>
                  <div className="space-y-1">
                    {searchResults.transactions.map(tx => (
                      <button
                        key={tx.id}
                        type="button"
                        onClick={() => {
                          onSelectTx?.(tx);
                          onSearch?.(tx.id);
                          setQuery(tx.id);
                          setSearchOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-[#1769FF]/10 dark:hover:bg-white/5 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center text-[#1769FF] dark:text-[#38BDF8] shrink-0">
                            <ArrowLeftRight className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-bold text-[#0B1B3A] dark:text-[#F8FAFC] group-hover:text-[#1769FF] dark:group-hover:text-[#38BDF8] transition-colors truncate">
                              {tx.id}
                            </p>
                            <p className="text-[11.5px] text-[#52698F] dark:text-[#94A3B8] truncate">
                              {tx.type || tx.payment_method || 'Transaction'} • <span className="font-semibold text-[#0B1B3A] dark:text-[#F8FAFC]">{tx.amount}</span>
                              {tx.signal ? ` • ${tx.signal}` : ''}
                            </p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${getRiskBadge(tx.risk)}`}>
                          {tx.risk || 'Normal'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.cases.length > 0 && (
                <div className="pt-2 first:pt-0">
                  <p className="text-[11px] font-bold text-[#52698F] dark:text-[#94A3B8] uppercase tracking-wider px-2.5 mb-1.5">
                    Cases ({searchResults.cases.length})
                  </p>
                  <div className="space-y-1">
                    {searchResults.cases.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          onSelectCase?.(c.id);
                          onSearch?.(c.id);
                          setQuery(c.id);
                          onNavigate?.('/cases');
                          setSearchOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-purple-500/10 dark:hover:bg-white/5 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                            <Briefcase className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-bold text-[#0B1B3A] dark:text-[#F8FAFC] group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
                              {c.id}
                            </p>
                            <p className="text-[11.5px] text-[#52698F] dark:text-[#94A3B8] truncate">
                              {c.summary}
                            </p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${getStatusBadge(c.status)}`}>
                          {c.status || 'Open'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.alerts.length > 0 && (
                <div className="pt-2 first:pt-0">
                  <p className="text-[11px] font-bold text-[#52698F] dark:text-[#94A3B8] uppercase tracking-wider px-2.5 mb-1.5">
                    Alerts ({searchResults.alerts.length})
                  </p>
                  <div className="space-y-1">
                    {searchResults.alerts.map(a => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => {
                          onSelectAlert?.(a);
                          onNavigate?.('/alerts');
                          setSearchOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-rose-500/10 dark:hover:bg-white/5 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-rose-500/10 dark:bg-rose-500/20 flex items-center justify-center text-rose-500 shrink-0">
                            <Bell className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-bold text-[#0B1B3A] dark:text-[#F8FAFC] group-hover:text-rose-500 transition-colors truncate">
                              {a.title}
                            </p>
                            <p className="text-[11.5px] text-[#52698F] dark:text-[#94A3B8] truncate">{a.body}</p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${getRiskBadge(a.severity)}`}>
                          {a.severity || 'Alert'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.totalCount === 0 && (
                <div className="py-8 px-4 text-center">
                  <Search className="w-8 h-8 mx-auto text-[#7C8DA8] opacity-40 mb-2" />
                  <p className="text-[13.5px] font-semibold text-[#0B1B3A] dark:text-[#F8FAFC]">
                    No matches found for &ldquo;{query}&rdquo;
                  </p>
                  <p className="text-[12px] text-[#52698F] dark:text-[#94A3B8] mt-1 max-w-sm mx-auto">
                    Try searching by Transaction ID (e.g. TX-9842), Case ID, amount, type, or status.
                  </p>
                </div>
              )}
            </div>

            <div className="px-3.5 py-2 border-t border-white/40 dark:border-white/10 bg-white/40 dark:bg-white/5 flex items-center justify-between text-[11px] text-[#52698F] dark:text-[#94A3B8]">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-[#0B1B3A] dark:text-[#F8FAFC]">Tip:</span>
                <span>Press <kbd className="px-1.5 py-0.5 rounded bg-white/80 dark:bg-white/10 border border-white/60 dark:border-white/15 font-mono text-[10px]">↵ Enter</kbd> to search transactions</span>
              </div>
              <span className="opacity-75">Esc to close</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
        <button
          onClick={onNewCase}
          data-tour="new-case"
          className="app-new-case btn-primary flex items-center justify-center gap-1.5 sm:gap-2 h-[40px] sm:h-[48px] px-3 sm:px-4 text-[13px] sm:text-[14px] shrink-0"
          aria-label="Create new case"
        >
          <Plus className="w-[17px] h-[17px] sm:w-[18px] sm:h-[18px]" strokeWidth={2.2} />
          <span className="hidden sm:inline">New Case</span>
        </button>

        <button
          aria-label="Show notifications"
          onClick={onNotify}
          className="relative hidden sm:flex w-[46px] h-[46px] rounded-2xl bg-white/50 dark:bg-white/10 border border-white/70 dark:border-white/15 items-center justify-center hover:bg-white/70 dark:hover:bg-white/20 transition-all cursor-pointer shadow-sm"
        >
          <Bell className="w-[22px] h-[22px] text-[#193B6D] dark:text-[#F8FAFC]" strokeWidth={1.9} />
          {unreadAlertCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-[#F04444] text-white text-[10px] font-bold ring-2 ring-white dark:ring-[#0B1B3A] shadow-sm">
              {unreadAlertCount > 99 ? '99+' : unreadAlertCount}
            </span>
          )}
        </button>

        <div className="relative" ref={profileRef}>
          <button
            aria-label="Open profile menu"
            onClick={() => setProfileOpen(prev => !prev)}
            className="profile-button hidden md:flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-2xl hover:bg-white/40 dark:hover:bg-white/10 transition-all cursor-pointer"
          >
            <div className="profile-avatar w-[44px] h-[44px] rounded-full bg-gradient-to-br from-[#D9E8FF] to-[#BFD6FF] flex items-center justify-center text-[15px] font-bold text-[#12315D] border border-white/70">
              {user.initials || 'MS'}
            </div>
            <span className="profile-name text-[14px] font-medium text-[#0B1B3A] dark:text-[#F8FAFC] hidden lg:block">
              {user.name || 'Mohit'}
            </span>
            <ChevronDown className={`profile-chevron w-4 h-4 text-[#52698F] dark:text-[#94A3B8] hidden lg:block transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2.5 w-56 rounded-2xl glass-card-strong p-2 shadow-2xl z-50 flex flex-col gap-1 border border-white/70 dark:border-white/15">
              <div className="px-3 py-2 border-b border-white/40 dark:border-white/10">
                <p className="text-[13.5px] font-bold text-[#0B1B3A] dark:text-[#F8FAFC]">{user.name || 'Mohit'}</p>
                <p className="text-[11.5px] text-[#52698F] dark:text-[#94A3B8] truncate">{user.email || 'admin@fraudguard.io'}</p>
              </div>

              <button
                onClick={() => {
                  setProfileOpen(false);
                  onProfile?.();
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-[#29466F] dark:text-[#E2E8F0] hover:bg-white/50 dark:hover:bg-white/10 transition-all cursor-pointer text-left"
              >
                <Settings className="w-4 h-4 text-[#52698F]" />
                <span>Settings</span>
              </button>

              <div className="my-0.5 border-t border-white/40 dark:border-white/10" />

              <button
                onClick={() => {
                  setProfileOpen(false);
                  onLogout?.();
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer text-left"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
