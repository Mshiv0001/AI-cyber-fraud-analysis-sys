import React, { useRef, useEffect, useState } from 'react';
import { FileText, AlertTriangle, ShieldCheck, AlertCircle, Activity } from 'lucide-react';

// ── Mini Sparkline Canvas ─────────────────────────────────────────────────────
function MiniSparkline({ data, color, width = 36, height = 22 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const step = width / (data.length - 1);

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, color + '22');
    gradient.addColorStop(1, color + '00');

    ctx.beginPath();
    data.forEach((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * (height * 0.72) - height * 0.14;
      if (i === 0) ctx.moveTo(x, y);
      else {
        const prevX = (i - 1) * step;
        const prevY = height - ((data[i - 1] - min) / range) * (height * 0.72) - height * 0.14;
        const cpx = (prevX + x) / 2;
        ctx.bezierCurveTo(cpx, prevY, cpx, y, x, y);
      }
    });
    const lastX = (data.length - 1) * step;
    ctx.lineTo(lastX, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    data.forEach((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * (height * 0.72) - height * 0.14;
      if (i === 0) ctx.moveTo(x, y);
      else {
        const prevX = (i - 1) * step;
        const prevY = height - ((data[i - 1] - min) / range) * (height * 0.72) - height * 0.14;
        const cpx = (prevX + x) / 2;
        ctx.bezierCurveTo(cpx, prevY, cpx, y, x, y);
      }
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.2;
    ctx.stroke();
  }, [data, color, width, height]);

  return (
    <canvas ref={canvasRef} style={{ width, height }} className="block" />
  );
}

// ── Animated counter (ticks up when value changes) ────────────────────────────
function AnimatedValue({ value, isLive }) {
  const [display, setDisplay] = useState(value);
  const [flashing, setFlashing] = useState(false);
  const prevRef = useRef(value);

  useEffect(() => {
    if (value !== prevRef.current && isLive) {
      setFlashing(true);
      const t = setTimeout(() => setFlashing(false), 600);
      prevRef.current = value;
      setDisplay(value);
      return () => clearTimeout(t);
    }
    setDisplay(value);
    prevRef.current = value;
  }, [value, isLive]);

  return (
    <span
      className="text-[16px] xs:text-[17px] sm:text-[20px] lg:text-[21px] font-bold text-[#0F172A] font-[family-name:var(--font-display)] leading-none tracking-tight tabular-nums kpi-card-metric"
      style={{
        transition: 'color 0.3s',
        color: flashing ? undefined : undefined,
        animation: flashing ? 'kpiFlash 0.5s ease' : 'none',
      }}
    >
      {display}
    </span>
  );
}

// ── Static fallback cards (when no live data) ─────────────────────────────────
const STATIC_CARDS = [
  {
    icon: FileText,
    cardClass: 'kpi-card-blue',
    title: 'Total Scanned',
    metric: '48,250',
    trend: '↑ 14%',
    trendColor: '#18A96B',
    footer: 'uploaded batches',
    accentColor: '#1875FF',
    sparkData: [20, 32, 28, 42, 34, 46, 40, 56],
    liveKey: null,
  },
  {
    icon: AlertTriangle,
    cardClass: 'kpi-card-red',
    title: 'High Risk',
    metric: '142',
    trend: '↓ 5%',
    trendColor: '#18A96B',
    footer: 'flagged by ML',
    accentColor: '#F04444',
    sparkData: [24, 20, 18, 22, 16, 14, 18, 12],
    liveKey: 'high_risk_cases',
  },
  {
    icon: ShieldCheck,
    cardClass: 'kpi-card-green',
    title: 'Model Accuracy',
    metric: '99.2%',
    trend: '↑ 0.8%',
    trendColor: '#18A96B',
    footer: 'validation score',
    accentColor: '#18A96B',
    sparkData: [88, 90, 92, 94, 96, 98, 98, 99],
    liveKey: null,
  },
  {
    icon: AlertCircle,
    cardClass: 'kpi-card-purple',
    title: 'Active Alerts',
    metric: '$184.2K',
    trend: '↓ 12%',
    trendColor: '#8067FF',
    footer: 'unread alerts',
    accentColor: '#8067FF',
    sparkData: [62, 55, 50, 46, 40, 36, 28, 26],
    liveKey: 'active_alerts',
  },
];

// ── Live KPI cards (shown when simulation is active) ──────────────────────────
const LIVE_CARDS = [
  {
    icon: FileText,
    cardClass: 'kpi-card-blue',
    title: 'Total Cases',
    footer: 'registered cases',
    accentColor: '#1875FF',
    sparkData: [1, 2, 3, 4, 5, 6, 7, 8],
    liveKey: 'total_cases',
    trend: '↑ live',
    trendColor: '#18A96B',
  },
  {
    icon: AlertTriangle,
    cardClass: 'kpi-card-red',
    title: 'Fraud Cases',
    footer: 'ML predicted FRAUD',
    accentColor: '#F04444',
    sparkData: [2, 3, 4, 3, 5, 4, 6, 7],
    liveKey: 'fraud_cases',
    trend: '● live',
    trendColor: '#F04444',
  },
  {
    icon: Activity,
    cardClass: 'kpi-card-green',
    title: 'Active Alerts',
    footer: 'unread high-risk',
    accentColor: '#18A96B',
    sparkData: [3, 5, 4, 6, 5, 7, 6, 8],
    liveKey: 'active_alerts',
    trend: '● live',
    trendColor: '#18A96B',
  },
  {
    icon: AlertCircle,
    cardClass: 'kpi-card-purple',
    title: 'High Risk',
    footer: 'fraud probability ≥ 0.70',
    accentColor: '#8067FF',
    sparkData: [1, 2, 2, 3, 3, 4, 4, 5],
    liveKey: 'high_risk_cases',
    trend: '↑ live',
    trendColor: '#8067FF',
  },
];

export default function KPICards({ liveStats = null }) {
  const cards = liveStats ? LIVE_CARDS : STATIC_CARDS;
  const isLive = Boolean(liveStats);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        const rawMetric = isLive && card.liveKey ? (liveStats[card.liveKey] ?? 0) : null;
        const displayMetric = rawMetric !== null ? String(rawMetric) : card.metric;

        return (
          <div
            key={card.title}
            className={`kpi-card glass-card relative overflow-hidden flex flex-col justify-between p-2.5 sm:px-3.5 sm:py-3 ${card.cardClass}`}
            style={{ minHeight: '92px' }}
          >
            {/* Top: Icon + Title */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-5 h-5 flex items-center justify-center shrink-0 bg-transparent">
                <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" style={{ color: card.accentColor }} strokeWidth={2.4} />
              </div>
              <span className="text-[11px] sm:text-[12px] font-semibold text-[#475569] truncate kpi-card-title" title={card.title}>
                {card.title}
              </span>
            </div>

            {/* Bottom: Sparkline + Metric */}
            <div className="flex items-end justify-between gap-1.5 sm:gap-3 mt-2">
              <div className="sparkline-container shrink-0">
                <MiniSparkline data={card.sparkData} color={card.accentColor} width={28} height={20} />
              </div>
              <div className="min-w-0 text-right flex-1">
                <div className="flex flex-wrap sm:flex-nowrap items-baseline justify-end gap-x-1 sm:gap-x-1.5">
                  {isLive && card.liveKey ? (
                    <AnimatedValue value={displayMetric} isLive={isLive} />
                  ) : (
                    <span className="text-[16px] xs:text-[17px] sm:text-[20px] lg:text-[21px] font-bold text-[#0F172A] font-[family-name:var(--font-display)] leading-none tracking-tight tabular-nums kpi-card-metric">
                      {displayMetric}
                    </span>
                  )}
                  <span className="text-[10px] sm:text-[11px] font-bold shrink-0 whitespace-nowrap" style={{ color: card.trendColor }}>
                    {card.trend}
                  </span>
                </div>
                <span className="text-[9.5px] sm:text-[10.5px] text-[#64748B] mt-1 block font-medium truncate kpi-card-footer" title={card.footer}>
                  {card.footer}
                </span>
              </div>
            </div>
          </div>
        );
      })}
      <style>{`
        @keyframes kpiFlash {
          0%   { transform: scale(1); }
          30%  { transform: scale(1.06); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
