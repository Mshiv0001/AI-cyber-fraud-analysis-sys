import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles, MousePointerClick, ArrowRight } from 'lucide-react';

// ─── Tour Steps Definition ───────────────────────────────────────────────────
const TOUR_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to FraudGuard!',
    description: "This interactive tour walks you through the key features of the dashboard. You'll learn how to simulate live transactions, detect fraud with machine learning, and manage cases in real time.",
    position: 'center',
    selector: null,
    icon: '🛡️',
  },
  {
    id: 'sidebar',
    title: 'Navigation Sidebar',
    description: 'Use the sidebar to navigate between sections: Dashboard, Transactions, Cases, Analytics, Alerts, and Settings. You can also toggle Light/Dark mode and relaunch this guided tour anytime.',
    position: 'right',
    selector: 'aside.app-sidebar',
    icon: '🗂️',
  },
  {
    id: 'kpi-cards',
    title: 'Real-Time KPI Cards',
    description: 'Track key performance metrics at a glance — Total Transactions Analyzed, Fraud Cases Detected, Total Value at Risk, and Model Accuracy. These update dynamically as cases stream in.',
    position: 'bottom',
    selector: '.dashboard-kpis',
    icon: '📊',
  },
  {
    id: 'sim-panel',
    title: 'Live Simulation Engine',
    description: 'Generate realistic transaction traffic on demand! Start, pause, or adjust generation speed (5, 20, 50 per min) and select attack scenarios (Normal, Mixed, or Spike Attack) to test AI resilience.',
    position: 'left',
    selector: '#tour-sim-panel',
    icon: '⚡',
  },
  {
    id: 'fraud-graph',
    title: 'Live Activity Timeline',
    description: 'Visualizes real-time transaction activity, reported cases, actual ground-truth fraud, and ML-detected fraud simultaneously on a dynamic multi-line chart.',
    position: 'top',
    selector: '#tour-fraud-graph',
    icon: '📈',
  },
  {
    id: 'case-feed',
    title: 'Live Case Feed',
    description: 'All streaming transactions evaluated by our temporal LightGBM pipeline appear here with risk badges (HIGH, MED, LOW), prediction verdicts (FRAUD / LEGIT), and transaction summaries.',
    position: 'top',
    selector: '#tour-case-feed',
    icon: '📡',
  },
  {
    id: 'new-case-btn',
    title: 'Create a New Case',
    description: 'Click "+ New Case" to test individual transactions on-demand. Enter transaction parameters to receive an instant ML fraud probability score.',
    position: 'bottom',
    selector: 'button[data-tour="new-case"]',
    icon: '➕',
    action: 'new-case',
  },
  {
    id: 'modal-intro',
    title: 'Deep Feature Analysis',
    description: 'The AI model evaluates 29+ behavioral features — such as transaction amount, origin/destination account balance deltas, transfer types, and velocity — to flag anomalous patterns.',
    position: 'center',
    selector: null,
    icon: '🤖',
  },
  {
    id: 'quick-actions',
    title: 'Quick Actions Panel',
    description: 'Quickly open the New Case modal, upload batch CSV files for bulk scanning, navigate to deep Analytics charts, or customize app settings.',
    position: 'left',
    selector: '#tour-quick-actions',
    icon: '🚀',
  },
  {
    id: 'search',
    title: 'Global Search & Alerts',
    description: 'Press Ctrl+K or use the search bar to find transactions by ID, case summaries, or navigation shortcuts. Click the Bell icon to review unread high-risk alerts.',
    position: 'bottom',
    selector: '.app-search',
    icon: '🔍',
  },
  {
    id: 'done',
    title: "You're All Set!",
    description: "You're now ready to monitor, detect, and investigate fraud with FraudGuard. Start the live simulation or create your first case to see the AI in action!",
    position: 'center',
    selector: null,
    icon: '🎉',
    action: 'finish',
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getElementInfo(selector) {
  if (!selector) return null;
  const parts = selector.split(', ');
  for (const s of parts) {
    try {
      const el = document.querySelector(s.trim());
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) return { rect, el };
      }
    } catch (_) {}
  }
  return null;
}

/**
 * Ensures the target element is scrolled into view with adequate space
 * above or below so the tooltip NEVER overlaps or gets pushed off-screen.
 */
function scrollTargetIntoView(el, preferredPos, tipH = 390) {
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const vpH = window.innerHeight;
  const GLOW = 18;
  const GAP = 16;
  const neededSpace = tipH + GLOW + GAP + 24;

  if (preferredPos === 'bottom') {
    // If element is already in the upper viewport with enough room below, keep current scroll
    if (rect.top >= 10 && rect.bottom + neededSpace <= vpH) {
      return;
    }
    // Scroll so element is near the top of the viewport (leaves maximum space below)
    const targetY = window.scrollY + rect.top - 20;
    window.scrollTo({ top: Math.max(0, targetY), behavior: 'auto' });
  } else if (preferredPos === 'top') {
    // If element has enough room above it, keep current scroll
    if (rect.top >= neededSpace && rect.bottom <= vpH) {
      return;
    }
    // Scroll so element has sufficient breathing room above it
    const targetY = window.scrollY + rect.top - neededSpace;
    window.scrollTo({ top: Math.max(0, targetY), behavior: 'auto' });
  } else {
    // Left or right: center element vertically if out of comfortable view
    if (rect.top < 40 || rect.bottom > vpH - 40) {
      el.scrollIntoView({ behavior: 'auto', block: 'center' });
    }
  }
}

/**
 * Computes pixel coordinates for the tooltip, strictly guaranteeing
 * zero intersection with the highlighted element and its glow ring.
 */
function getTooltipStyle(rect, preferredPos, vpW, vpH, tipW = 380, tipH = 390) {
  if (!rect || preferredPos === 'center') {
    return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  }

  const GLOW = 18;
  const GAP = 16;
  const MARGIN = 16;

  // Exact glow bounding box of the highlighted target
  const glowTop = Math.max(0, rect.top - GLOW);
  const glowBottom = rect.bottom + GLOW;
  const glowLeft = Math.max(0, rect.left - GLOW);
  const glowRight = rect.right + GLOW;

  // Measure available room in each direction
  const spaceBelow = vpH - glowBottom;
  const spaceAbove = glowTop;
  const spaceRight = vpW - glowRight;
  const spaceLeft = glowLeft;

  let pos = preferredPos;

  // Flip if preferred direction cannot fit the tooltip height/width
  if (pos === 'bottom' && spaceBelow < tipH + GAP && spaceAbove >= tipH + GAP) {
    pos = 'top';
  } else if (pos === 'top' && spaceAbove < tipH + GAP && spaceBelow >= tipH + GAP) {
    pos = 'bottom';
  } else if (pos === 'left' && spaceLeft < tipW + GAP && spaceRight >= tipW + GAP) {
    pos = 'right';
  } else if (pos === 'right' && spaceRight < tipW + GAP && spaceLeft >= tipW + GAP) {
    pos = 'left';
  }

  let top, left;

  if (pos === 'bottom') {
    top = glowBottom + GAP;
    left = rect.left + rect.width / 2 - tipW / 2;
  } else if (pos === 'top') {
    top = glowTop - GAP - tipH;
    left = rect.left + rect.width / 2 - tipW / 2;
  } else if (pos === 'right') {
    left = glowRight + GAP;
    top = rect.top + rect.height / 2 - tipH / 2;
  } else if (pos === 'left') {
    left = glowLeft - GAP - tipW;
    top = rect.top + rect.height / 2 - tipH / 2;
  }

  // Viewport clamping (keep entire tooltip inside visible screen)
  left = Math.max(MARGIN, Math.min(left, vpW - tipW - MARGIN));
  top = Math.max(MARGIN, Math.min(top, vpH - tipH - MARGIN));

  // ABSOLUTE ANTI-OVERLAP SAFEGUARD:
  // Check if tooltip bounding box intersects target glow box
  const overlapsVertically = (top < glowBottom) && (top + tipH > glowTop);
  const overlapsHorizontally = (left < glowRight) && (left + tipW > glowLeft);

  if (overlapsVertically && overlapsHorizontally) {
    if (spaceBelow >= spaceAbove) {
      top = glowBottom + GAP;
    } else {
      top = Math.max(MARGIN, glowTop - GAP - tipH);
    }
  }

  return { top: `${top}px`, left: `${left}px` };
}

// ─── GuidedTour Component ────────────────────────────────────────────────────
export default function GuidedTour({ isOpen, onClose }) {
  const [step, setStep] = useState(0);
  const [targetInfo, setTargetInfo] = useState(null);
  const [visible, setVisible] = useState(false);
  const [vpW, setVpW] = useState(window.innerWidth);
  const [vpH, setVpH] = useState(window.innerHeight);
  const [tipDimensions, setTipDimensions] = useState({ width: 380, height: 390 });

  const tooltipRef = useRef(null);
  const cur = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;
  const isFirst = step === 0;
  const GLOW = 18;

  // Track viewport dimensions
  useEffect(() => {
    const onResize = () => {
      setVpW(window.innerWidth);
      setVpH(window.innerHeight);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Measure actual rendered tooltip card dimensions
  useLayoutEffect(() => {
    if (tooltipRef.current) {
      const { offsetWidth, offsetHeight } = tooltipRef.current;
      if (offsetWidth > 0 && offsetHeight > 0) {
        setTipDimensions({ width: offsetWidth, height: offsetHeight });
      }
    }
  }, [step, visible]);

  // Reset when opening
  useEffect(() => {
    if (!isOpen) {
      setVisible(false);
      return;
    }
    setStep(0);
    setTargetInfo(null);
    const t = setTimeout(() => setVisible(true), 40);
    return () => clearTimeout(t);
  }, [isOpen]);

  // Step transition and element positioning
  useEffect(() => {
    if (!isOpen) return;
    setVisible(false);

    const t = setTimeout(() => {
      if (!cur.selector) {
        setTargetInfo(null);
        setVisible(true);
        return;
      }

      const info = getElementInfo(cur.selector);
      if (info?.el) {
        // Scroll target into view safely before capturing final bounding rect
        scrollTargetIntoView(info.el, cur.position, tipDimensions.height);
        // Measure fresh final rect right after scroll
        const freshRect = info.el.getBoundingClientRect();
        setTargetInfo({ el: info.el, rect: freshRect });
      } else {
        setTargetInfo(null);
      }
      setVisible(true);
    }, 120);

    return () => clearTimeout(t);
  }, [step, isOpen, cur.selector, cur.position, tipDimensions.height]);

  // Continuously track scroll & resize events to keep highlight & tooltip anchored
  useEffect(() => {
    if (!isOpen || !cur.selector) return;

    let rafId = null;
    const update = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const el = document.querySelector(cur.selector);
        if (el) {
          const rect = el.getBoundingClientRect();
          setTargetInfo({ el, rect });
        }
      });
    };

    window.addEventListener('scroll', update, { capture: true, passive: true });
    window.addEventListener('resize', update, { passive: true });
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', update, { capture: true });
      window.removeEventListener('resize', update);
    };
  }, [isOpen, cur.selector]);

  const goNext = useCallback(() => {
    if (isLast) {
      onClose();
      return;
    }
    setStep(s => s + 1);
  }, [isLast, onClose]);

  const goPrev = useCallback(() => {
    if (!isFirst) setStep(s => s - 1);
  }, [isFirst]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const h = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isOpen, goNext, goPrev, onClose]);

  if (!isOpen) return null;

  const r = targetInfo?.rect || null;
  const progress = ((step + 1) / TOUR_STEPS.length) * 100;
  const tipStyle = getTooltipStyle(r, cur.position, vpW, vpH, tipDimensions.width, tipDimensions.height);

  return (
    <div className="tour-root" role="dialog" aria-modal="true" aria-label="FraudGuard guided tour">
      {/* ── Overlay layer (SVG spotlight) ── */}
      <div className="tour-overlay-container" onClick={onClose} aria-hidden="true">
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <mask id="tourMask">
              <rect width="100%" height="100%" fill="white" />
              {r && (
                <rect
                  x={Math.max(0, r.left - GLOW)}
                  y={Math.max(0, r.top - GLOW)}
                  width={r.width + GLOW * 2}
                  height={r.height + GLOW * 2}
                  rx="14"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(5,12,30,0.75)" mask="url(#tourMask)" />
        </svg>

        {/* Spotlight glow ring */}
        {r && (
          <div
            className="tour-glow-ring"
            aria-hidden="true"
            style={{
              left: Math.max(0, r.left - GLOW),
              top: Math.max(0, r.top - GLOW),
              width: r.width + GLOW * 2,
              height: r.height + GLOW * 2,
            }}
          />
        )}
      </div>

      {/* ── Tooltip Card ── */}
      <div
        ref={tooltipRef}
        className={`tour-tooltip ${visible ? 'tour-tooltip-in' : 'tour-tooltip-out'}`}
        style={{ ...tipStyle, position: 'fixed', zIndex: 10002, width: 380 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Progress bar */}
        <div className="tour-prog-track">
          <div className="tour-prog-fill" style={{ width: `${progress}%` }} />
        </div>

        {/* Header row */}
        <div className="tour-hdr">
          <div className="tour-step-pill">
            <Sparkles className="w-3 h-3" />
            <span>Step {step + 1} / {TOUR_STEPS.length}</span>
          </div>
          <button className="tour-x-btn" onClick={onClose} aria-label="Close tour">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Emoji icon */}
        <div className="tour-emoji-wrap">
          <span role="img" aria-hidden="true" style={{ fontSize: 34 }}>{cur.icon}</span>
        </div>

        {/* Title + body */}
        <h3 className="tour-ttl">{cur.title}</h3>
        <p className="tour-body">{cur.description}</p>

        {/* Action hint */}
        {cur.action === 'new-case' && (
          <div className="tour-hint-box">
            <MousePointerClick className="w-3.5 h-3.5 shrink-0" />
            <span>Click "+ New Case" in the top bar to try it!</span>
          </div>
        )}

        {/* Nav row */}
        <div className="tour-nav-row">
          <button
            className={`tour-btn-back ${isFirst ? 'opacity-0 pointer-events-none' : ''}`}
            onClick={goPrev}
            disabled={isFirst}
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          {/* Dot indicators */}
          <div className="tour-dots-row" aria-hidden="true">
            {TOUR_STEPS.map((_, i) => (
              <button
                key={i}
                className={`tour-dot ${i === step ? 'active' : ''}`}
                onClick={() => setStep(i)}
                aria-label={`Jump to step ${i + 1}`}
              />
            ))}
          </div>

          <button className="tour-btn-next" onClick={goNext}>
            {isLast ? <><span>Let's Go!</span><ArrowRight className="w-4 h-4" /></> : <><span>Next</span><ChevronRight className="w-4 h-4" /></>}
          </button>
        </div>

        <p className="tour-kbd-hint">
          <kbd>→</kbd> Next &nbsp;·&nbsp; <kbd>←</kbd> Back &nbsp;·&nbsp; <kbd>Esc</kbd> Exit
        </p>
      </div>
    </div>
  );
}
