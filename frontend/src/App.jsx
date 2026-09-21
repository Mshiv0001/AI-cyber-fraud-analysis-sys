import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import WelcomeHeader from './components/WelcomeHeader';
import KPICards from './components/KPICards';
import TransactionRiskAnalysis, { BATCH_DATA } from './components/TransactionRiskAnalysis';
import QuoteCard from './components/QuoteCard';
import QuickActions from './components/QuickActions';
import SafetyBanner from './components/SafetyBanner';
import DemoNoticeCard from './components/DemoNoticeCard';
import FluidBackground from './components/FluidBackground';
import NewCaseModal from './components/NewCaseModal';
import NotificationsPanel from './components/NotificationsPanel';
import UploadModal from './components/UploadModal';
import GuidedTour from './components/GuidedTour';
import SimulationControlPanel from './components/SimulationControlPanel';
import LiveFraudGraph from './components/LiveFraudGraph';
import LiveCaseFeed from './components/LiveCaseFeed';

import LoginPage from './pages/LoginPage';
import TransactionsPage from './pages/TransactionsPage';
import CasesPage, { INITIAL_CASES } from './pages/CasesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AlertsPage from './pages/AlertsPage';
import SettingsPage from './pages/SettingsPage';

import {
  checkBackendHealth,
  getTransactions,
  saveTransaction,
  updateTransactionStatus,
} from './services/api';

import {
  sseManager,
  startSimulation,
  pauseSimulation,
  resetSimulation,
  configureSimulation,
  getDashboardStats,
  getFraudTimeline,
  getCases,
  getAlerts,
  markAlertRead,
  markAllAlertsRead,
} from './services/simulationService';

// ── Nav routing ───────────────────────────────────────────────────────────────
const NAV_PATHS = {
  home: '/',
  transactions: '/transactions',
  cases: '/cases',
  analytics: '/analytics',
  alerts: '/alerts',
  settings: '/settings',
};
const PATH_TO_NAV = Object.fromEntries(Object.entries(NAV_PATHS).map(([k, v]) => [v, k]));

// ── Auth guard ────────────────────────────────────────────────────────────────
function RequireAuth({ children }) {
  const loggedIn = sessionStorage.getItem('fg_auth') === '1';
  return loggedIn ? children : <Navigate to="/login" replace />;
}

// ── Main dashboard shell ──────────────────────────────────────────────────────
function DashboardShell({
  theme, onThemeChange,
  transactions, onCaseCreated, onStatusChange, onLogout, onToast,
  // Simulation props
  simStatus, simRate, simScenario,
  simEventsGenerated, simCasesRegistered, simFraudEvents,
  onSimStart, onSimPause, onSimReset, onSimSpeedChange, onSimScenarioChange,
  // Live data
  liveStats, liveTimeline, liveCases, liveAlerts,
  onMarkAllRead,
  onMarkAlertRead,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [dialog, setDialog] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  // Clear search when navigating to pages that don't use global search
  useEffect(() => {
    if (location.pathname === '/settings' || location.pathname === '/analytics') {
      setSearchQuery('');
    }
  }, [location.pathname]);
  const [selectedTx, setSelectedTx] = useState(null);
  const [tourOpen, setTourOpen] = useState(false);
  const [user, setUser] = useState(() => {
    try {
      const u = JSON.parse(sessionStorage.getItem('fg_user') || '{}');
      return {
        name: u.name || 'Mohit',
        initials: u.initials || 'MS',
        email: u.email || 'admin@fraudguard.io',
      };
    } catch {
      return { name: 'Mohit', initials: 'MS', email: 'admin@fraudguard.io' };
    }
  });

  const handleUserChange = (newUser) => {
    setUser(newUser);
    sessionStorage.setItem('fg_user', JSON.stringify(newUser));
  };

  const activeNav = PATH_TO_NAV[location.pathname] || 'home';
  const isDark = theme === 'dark';
  const unreadAlertCount = liveAlerts.filter(a => !a.read).length;

  useEffect(() => { setMobileNavOpen(false); }, [location.pathname]);

  const handleNavChange = (id) => navigate(NAV_PATHS[id] || '/');
  const openCase = () => setDialog('case');

  const handleQuickAction = (action) => {
    if (action === 'New Case') return setDialog('case');
    if (action === 'Upload Data') return setDialog('upload');
    if (action === 'View Analytics') return navigate('/analytics');
    if (action === 'Security Alerts' || action === 'Alerts') return navigate('/alerts');
    if (action === 'Transactions' || action === 'Transaction Logs') return navigate('/transactions');
    if (action === 'Settings') return navigate('/settings');
    onToast?.(`${action} opened`);
  };

  return (
    <div className="min-h-screen relative">
      <FluidBackground />

      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-20 bg-[#0B1B3A]/30 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar
        activeNav={activeNav}
        onNavChange={handleNavChange}
        theme={theme}
        onThemeChange={onThemeChange}
        onAction={() => setTourOpen(true)}
        onStartTour={() => setTourOpen(true)}
        onLogout={onLogout}
        isMobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />

      <div className="app-main relative z-10 min-h-screen p-3 sm:p-4 flex flex-col gap-4">
        <TopBar
          user={user}
          searchQuery={searchQuery}
          onSearch={(q) => setSearchQuery(q)}
          onNewCase={openCase}
          onNotify={() => setNotifOpen(true)}
          onProfile={() => navigate('/settings')}
          onLogout={onLogout}
          onToggleMobileNav={() => setMobileNavOpen(prev => !prev)}
          unreadAlertCount={unreadAlertCount}
          transactions={transactions && transactions.length > 0 ? transactions : BATCH_DATA}
          cases={liveCases.length > 0 ? [...liveCases, ...INITIAL_CASES] : INITIAL_CASES}
          alerts={liveAlerts}
          onSelectTx={(tx) => setSelectedTx(tx)}
          onSelectCase={() => navigate('/cases')}
          onSelectAlert={() => setNotifOpen(true)}
          onNavigate={(path) => navigate(path)}
        />

        <main className="flex-1 min-w-0">
          <Routes>
            {/* Home / Dashboard */}
            <Route path="/" element={
              <div className="dashboard-columns grid grid-cols-1 xl:grid-cols-12 gap-5">
                {/* Left column (8/12) */}
                <div className="min-w-0 xl:col-span-8 flex flex-col gap-4">
                  <WelcomeHeader user={user} />
                  <div className="dashboard-kpis mb-0">
                    <KPICards liveStats={liveStats} />
                  </div>
                  {/* Live Fraud Graph */}
                  <LiveFraudGraph data={liveTimeline} isDark={isDark} />
                  {/* Live Case Feed moved into primary main column */}
                  <LiveCaseFeed
                    cases={liveCases}
                    onViewAll={() => navigate('/cases')}
                  />
                </div>

                {/* Right column (4/12) */}
                <div className="min-w-0 xl:col-span-4 flex flex-col gap-4">
                  <QuoteCard />
                  {/* Simulation Control Panel */}
                  <SimulationControlPanel
                    status={simStatus}
                    eventsGenerated={simEventsGenerated}
                    casesRegistered={simCasesRegistered}
                    fraudEvents={simFraudEvents}
                    rate={simRate}
                    scenario={simScenario}
                    onStart={onSimStart}
                    onPause={onSimPause}
                    onReset={onSimReset}
                    onSpeedChange={onSimSpeedChange}
                    onScenarioChange={onSimScenarioChange}
                  />
                  <QuickActions onAction={handleQuickAction} />
                  <DemoNoticeCard />
                </div>
              </div>
            } />

            <Route path="/transactions" element={
              <TransactionsPage
                transactions={transactions}
                onAction={onToast}
                onOpenNewCase={openCase}
                onOpenUpload={() => setDialog('upload')}
                searchQuery={searchQuery}
                onClearSearch={() => setSearchQuery('')}
                onSelectTx={(tx) => setSelectedTx(tx)}
              />
            } />

            <Route path="/cases" element={
              <CasesPage
                onOpenNewCase={openCase}
                onToast={onToast}
                liveCases={liveCases}
                searchQueryProp={searchQuery}
              />
            } />

            <Route path="/analytics" element={<AnalyticsPage />} />

            <Route path="/alerts" element={
              <AlertsPage
                onToast={onToast}
                liveAlerts={liveAlerts}
                onMarkAllRead={onMarkAllRead}
                onMarkAlertRead={onMarkAlertRead}
                searchQueryProp={searchQuery}
              />
            } />

            <Route path="/settings" element={
              <SettingsPage
                theme={theme}
                onThemeChange={onThemeChange}
                onLogout={onLogout}
                onToast={onToast}
                user={user}
                onUserChange={handleUserChange}
              />
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Guided Tour */}
      <GuidedTour isOpen={tourOpen} onClose={() => setTourOpen(false)} />

      {/* Modals & Panels */}
      <NewCaseModal
        isOpen={dialog === 'case'}
        onClose={() => setDialog(null)}
        onCaseCreated={onCaseCreated}
        onToast={onToast}
      />

      <UploadModal
        isOpen={dialog === 'upload'}
        onClose={() => setDialog(null)}
        onToast={onToast}
      />

      <NotificationsPanel
        isOpen={notifOpen}
        onClose={() => setNotifOpen(false)}
        liveAlerts={liveAlerts.length > 0 ? liveAlerts : null}
        onMarkAllRead={onMarkAllRead}
        onMarkAlertRead={onMarkAlertRead}
      />

      {/* Transaction detail drawer */}
      {selectedTx && (
        <React.Suspense fallback={null}>
          <TxDrawerLazy
            tx={selectedTx}
            onClose={() => setSelectedTx(null)}
            onStatusChange={(id, status) => {
              onStatusChange?.(id, status);
              setSelectedTx(prev => prev ? { ...prev, status } : null);
            }}
          />
        </React.Suspense>
      )}

      {/* Safety / other dialogs */}
      {dialog && dialog !== 'case' && dialog !== 'upload' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1B3A]/35 p-4" role="dialog" aria-modal="true" onMouseDown={() => setDialog(null)}>
          <div className="glass-card-strong w-full max-w-md" style={{ padding: '28px 28px' }} onMouseDown={e => e.stopPropagation()}>
            <h2 className="text-[20px] font-bold text-[#0B1B3A] dark:text-[#F8FAFC] font-[family-name:var(--font-display)]">
              {dialog === 'safety' ? 'FraudGuard Safety Guide' : 'Panel'}
            </h2>
            <p className="mt-2 text-[13px] leading-6 text-[#52698F] dark:text-[#94A3B8]">
              {dialog === 'safety' ? 'Together for a safer digital world. Use data. Find the truth. Prevent fraud. Stay alert, stay ahead.' : 'This panel is in progress.'}
            </p>
            <div className="mt-5 flex justify-end">
              <button onClick={() => setDialog(null)} className="btn-primary h-[38px] px-5 text-[13px] rounded-xl cursor-pointer">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Lazy drawer
const TransactionDetailDrawer = React.lazy(() => import('./components/TransactionDetailDrawer'));
function TxDrawerLazy({ tx, onClose, onStatusChange }) {
  return <TransactionDetailDrawer tx={tx} onClose={onClose} onStatusChange={onStatusChange} />;
}


// ═══════════════════════════════════════════════════════════════════════════════
//  Root App — wires simulation state, SSE, and live data
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState('light');
  const [toast, setToast] = useState('');
  const [transactions, setTransactions] = useState(null);

  // ── Simulation state ───────────────────────────────────────────────────────
  const [simStatus, setSimStatus] = useState('STOPPED');
  const [simRate, setSimRate] = useState(20);
  const [simScenario, setSimScenario] = useState('normal');
  const [simEventsGenerated, setSimEventsGenerated] = useState(0);
  const [simCasesRegistered, setSimCasesRegistered] = useState(0);
  const [simFraudEvents, setSimFraudEvents] = useState(0);

  // ── Live data ──────────────────────────────────────────────────────────────
  const [liveStats, setLiveStats] = useState(null);
  const [liveTimeline, setLiveTimeline] = useState([]);
  const [liveCases, setLiveCases] = useState([]);
  const [liveAlerts, setLiveAlerts] = useState([]);

  // ── Theme effect ───────────────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // ── Toast auto-clear ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(''), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // ── Apply simulation status update ─────────────────────────────────────────
  const applySimStatus = useCallback((data) => {
    if (!data) return;
    if (data.status) setSimStatus(data.status);
    if (data.rate !== undefined) setSimRate(data.rate);
    if (data.scenario) setSimScenario(data.scenario);
    if (data.events_generated !== undefined) setSimEventsGenerated(data.events_generated);
    if (data.cases_registered !== undefined) setSimCasesRegistered(data.cases_registered);
    if (data.fraud_events !== undefined) setSimFraudEvents(data.fraud_events);
  }, []);

  // ── Fetch timeline and cases periodically ─────────────────────────────────
  const refreshTimeline = useCallback(async () => {
    const res = await getFraudTimeline(20);
    if (res.success && res.timeline) setLiveTimeline(res.timeline);
  }, []);

  const refreshCases = useCallback(async () => {
    const res = await getCases(50);
    if (res.success && res.cases) setLiveCases(res.cases);
  }, []);

  const refreshAlerts = useCallback(async () => {
    const res = await getAlerts(50);
    if (res.success && res.alerts) setLiveAlerts(res.alerts);
  }, []);

  // ── SSE setup ──────────────────────────────────────────────────────────────
  useEffect(() => {
    sseManager
      .on('connected', () => {
        // Fetch initial data on SSE connect
        refreshTimeline();
        refreshCases();
        refreshAlerts();
      })
      .on('status', (data) => {
        applySimStatus(data);
      })
      .on('stats', (data) => {
        if (data) setLiveStats(data);
      })
      .on('case', (data) => {
        if (data?.id) {
          setLiveCases(prev => {
            const exists = prev.some(c => c.id === data.id);
            return exists ? prev : [data, ...prev];
          });
          setSimCasesRegistered(prev => prev + 1);
        }
        // Refresh timeline when a case arrives
        refreshTimeline();
      })
      .on('alert', (data) => {
        if (data?.id) {
          setLiveAlerts(prev => {
            const exists = prev.some(a => a.id === data.id);
            return exists ? prev : [data, ...prev];
          });
          const cleanTitle = (data.title || 'High-risk alert')
            .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
            .trim();
          announce(`${cleanTitle} — ${data.amount || ''}`);
        }
      })
      .on('transaction', (data) => {
        if (data) {
          setSimEventsGenerated(prev => prev + 1);
          if (data.ground_truth === 'FRAUD') {
            setSimFraudEvents(prev => prev + 1);
          }
          // Add to transactions list
          if (data.id) {
            // Use probability-based label so signal aligns with the visible risk score
            const p = data.fraud_probability || 0;
            const sigLabel = p >= 0.9 ? 'FRAUD' : p >= 0.35 ? 'SUSPECT' : 'CLEAR';
            const tx = {
              id: data.id,
              timestamp: 'Just now',
              created_at: data.timestamp || new Date().toISOString(),
              amount: data.amount,
              type: data.type,
              score: data.score || data.fraud_probability,
              risk: data.risk,
              signal: `[SIM] ML ${sigLabel} (p=${p.toFixed(3)})`,
              status: data.status,
              is_synthetic: true,
              ground_truth: data.ground_truth,
              model_prediction: data.model_prediction,
            };
            setTransactions(prev => {
              if (!prev) return [tx];
              // Deduplicate: skip if this tx ID is already in state
              if (prev.some(t => t.id === tx.id)) return prev;
              return [tx, ...prev];
            });
          }
        }
      })
      .on('timeline_point', () => {
        refreshTimeline();
      })
      .on('heartbeat', () => {
        // Keep-alive received
      });

    sseManager.connect();

    return () => {
      sseManager.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Initial data load ──────────────────────────────────────────────────────
  useEffect(() => {
    checkBackendHealth().then((res) => {
      if (res.success && res.model_loaded) {
        console.log(`[FraudGuard] Connected to Flask ML model (Threshold: ${res.fraud_threshold})`);
      }
    });

    getTransactions().then((res) => {
      if (res.success && res.transactions?.length > 0) {
        setTransactions(res.transactions);
      }
    });

    getDashboardStats().then((res) => {
      if (res.success) {
        const { simulation, ...stats } = res;
        if (Object.keys(stats).some(k => stats[k] > 0)) {
          setLiveStats(stats);
        }
        if (simulation) applySimStatus(simulation);
      }
    });

    refreshCases();
    refreshAlerts();
    refreshTimeline();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const announce = (msg) => setToast(msg);

  const handleLogout = () => {
    sessionStorage.removeItem('fg_auth');
    sessionStorage.removeItem('fg_user');
    announce('Signed out successfully');
    navigate('/login');
  };

  const handleCaseCreated = async (newTx) => {
    setTransactions(prev => (prev ? [newTx, ...prev] : [newTx]));
    const res = await saveTransaction(newTx);
    if (!res.success) {
      console.warn('[FraudGuard] Failed to save transaction to SQLite:', res.error);
    }
  };

  const handleStatusChange = async (txId, newStatus) => {
    setTransactions(prev =>
      prev ? prev.map(t => (t.id === txId ? { ...t, status: newStatus } : t)) : prev
    );
    await updateTransactionStatus(txId, newStatus);
  };

  // ── Simulation controls ────────────────────────────────────────────────────
  const handleSimStart = useCallback(async () => {
    const res = await startSimulation({ rate: simRate, scenario: simScenario });
    if (res.success) applySimStatus(res);
  }, [simRate, simScenario, applySimStatus]);

  const handleSimPause = useCallback(async () => {
    const res = await pauseSimulation();
    if (res.success) applySimStatus(res);
  }, [applySimStatus]);

  const handleSimReset = useCallback(async () => {
    const res = await resetSimulation();
    if (res.success) {
      applySimStatus(res);
      setLiveTimeline([]);
      setLiveCases([]);
      setLiveAlerts([]);
      setLiveStats(null);
    }
  }, [applySimStatus]);

  const handleSimSpeedChange = useCallback(async (val) => {
    setSimRate(val);
    if (simStatus === 'RUNNING' || simStatus === 'PAUSED') {
      await configureSimulation({ rate: val });
    }
  }, [simStatus]);

  const handleSimScenarioChange = useCallback(async (val) => {
    setSimScenario(val);
    if (simStatus === 'RUNNING' || simStatus === 'PAUSED') {
      await configureSimulation({ scenario: val });
    }
  }, [simStatus]);

  const handleMarkAllRead = useCallback(async () => {
    // 1. Optimistically update local states immediately
    setLiveAlerts(prev => prev.map(a => ({ ...a, read: 1 })));
    setLiveStats(prev => prev ? { ...prev, active_alerts: 0 } : prev);
    announce('All alerts marked as read');

    // 2. Call backend
    const res = await markAllAlertsRead();
    if (res && res.stats) {
      setLiveStats(res.stats);
    }
  }, []);

  const handleMarkAlertRead = useCallback(async (alertId) => {
    setLiveAlerts(prev => prev.map(a => a.id === alertId ? { ...a, read: 1 } : a));
    setLiveStats(prev => prev ? { ...prev, active_alerts: Math.max(0, (prev.active_alerts || 1) - 1) } : prev);
    const res = await markAlertRead(alertId);
    if (res && res.stats) {
      setLiveStats(res.stats);
    }
  }, []);

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={() => {}} />} />
        <Route path="/*" element={
          <RequireAuth>
            <DashboardShell
              theme={theme}
              onThemeChange={setTheme}
              transactions={transactions}
              onCaseCreated={handleCaseCreated}
              onStatusChange={handleStatusChange}
              onLogout={handleLogout}
              onToast={announce}
              // Simulation
              simStatus={simStatus}
              simRate={simRate}
              simScenario={simScenario}
              simEventsGenerated={simEventsGenerated}
              simCasesRegistered={simCasesRegistered}
              simFraudEvents={simFraudEvents}
              onSimStart={handleSimStart}
              onSimPause={handleSimPause}
              onSimReset={handleSimReset}
              onSimSpeedChange={handleSimSpeedChange}
              onSimScenarioChange={handleSimScenarioChange}
              // Live data
              liveStats={liveStats}
              liveTimeline={liveTimeline}
              liveCases={liveCases}
              liveAlerts={liveAlerts}
              onMarkAllRead={handleMarkAllRead}
              onMarkAlertRead={handleMarkAlertRead}
            />
          </RequireAuth>
        } />
      </Routes>

      {toast && (
        <div role="status" className="fixed bottom-5 left-1/2 z-[100] -translate-x-1/2 rounded-xl bg-[#0B1B3A] px-4 py-3 text-sm font-medium text-white shadow-xl" style={{ animation: 'fadeInUp 0.25s ease both' }}>
          {typeof toast === 'string' ? toast.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim() : toast}
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translate(-50%, 12px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </>
  );
}
