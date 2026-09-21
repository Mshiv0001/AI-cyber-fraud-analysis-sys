import React, { useRef, useEffect, useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';

/* ─── Mini Bar Chart ─── */
function BarChart({ data, colors, labels, height = 120 }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.offsetWidth;
    const h = height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const max = Math.max(...data, 1);
    const barW = (w / data.length) * 0.55;
    const gap = (w / data.length) * 0.45;

    data.forEach((v, i) => {
      const x = i * (barW + gap) + gap / 2;
      const barH = (v / max) * (h - 20);
      const y = h - barH - 4;
      const grad = ctx.createLinearGradient(0, y, 0, h);
      grad.addColorStop(0, colors[i % colors.length] + 'dd');
      grad.addColorStop(1, colors[i % colors.length] + '44');
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, 5);
      ctx.fillStyle = grad;
      ctx.fill();
    });
  }, [data, colors, height]);

  return (
    <div className="relative w-full">
      <canvas ref={canvasRef} style={{ width: '100%', height }} className="block" />
      <div className="flex justify-around mt-2">
        {labels.map((l, i) => (
          <span key={i} className="text-[10.5px] text-[#7C8DA8] text-center leading-tight">{l}</span>
        ))}
      </div>
    </div>
  );
}

/* ─── Donut Chart ─── */
function DonutChart({ segments, size = 120 }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    const cx = size / 2, cy = size / 2, r = size * 0.4, inner = size * 0.26;
    let start = -Math.PI / 2;
    const total = segments.reduce((s, seg) => s + seg.value, 0);
    segments.forEach(seg => {
      const angle = (seg.value / total) * 2 * Math.PI;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, start + angle);
      ctx.closePath();
      ctx.fillStyle = seg.color;
      ctx.fill();
      start += angle;
    });
    ctx.beginPath();
    ctx.arc(cx, cy, inner, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fill();
  }, [segments, size]);
  return <canvas ref={canvasRef} style={{ width: size, height: size }} className="block" />;
}

const MONTHLY = [1080, 1140, 980, 1260, 1190, 1240];
const MONTH_LABELS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
const FLAGGED = [38, 52, 31, 67, 58, 142];
const TX_TYPES = [
  { label: 'CASH_OUT', value: 35, color: '#F04444' },
  { label: 'TRANSFER', value: 30, color: '#8067FF' },
  { label: 'PAYMENT', value: 20, color: '#1769FF' },
  { label: 'CASH_IN', value: 10, color: '#18A96B' },
  { label: 'DEBIT', value: 5, color: '#F5A623' },
];

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(128,103,255,0.12)', border: '1px solid rgba(128,103,255,0.25)' }}>
          <BarChart3 className="w-5 h-5" style={{ color: '#8067FF' }} strokeWidth={2.2} />
        </div>
        <div>
          <h2 className="text-[24px] font-bold text-[#0B1B3A] dark:text-[#F8FAFC] font-[family-name:var(--font-display)] leading-tight">Analytics</h2>
          <p className="text-[13px] text-[#58709A] dark:text-[#94A3B8]">Fraud trends and model performance insights</p>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Avg. Risk Score', value: '0.34', trend: '↓ 8%', trendPos: true, color: '#1769FF' },
          { label: 'Detection Rate', value: '99.2%', trend: '↑ 0.8%', trendPos: true, color: '#18A96B' },
          { label: 'False Positive Rate', value: '0.3%', trend: '↓ 0.1%', trendPos: true, color: '#8067FF' },
          { label: 'Avg. Review Time', value: '4.2h', trend: '↓ 12%', trendPos: true, color: '#F5A623' },
        ].map(k => (
          <div key={k.label} className="glass-card flex flex-col gap-1" style={{ padding: '14px 16px' }}>
            <span className="text-[11.5px] font-semibold text-[#52698F] dark:text-[#94A3B8] uppercase tracking-wider">{k.label}</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-[24px] font-bold font-[family-name:var(--font-display)] tabular-nums" style={{ color: k.color }}>{k.value}</span>
              <span className={`text-[11px] font-bold ${k.trendPos ? 'text-[#18A96B]' : 'text-[#F04444]'}`}>{k.trend}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly transactions */}
        <div className="glass-card-strong col-span-2 flex flex-col gap-3" style={{ padding: '20px 22px' }}>
          <div className="flex items-center justify-between">
            <h3 className="text-[16px] font-bold text-[#0B1B3A] dark:text-[#F8FAFC] font-[family-name:var(--font-display)]">Monthly Transactions Scanned</h3>
            <div className="flex items-center gap-1.5 text-[#18A96B]">
              <TrendingUp className="w-4 h-4" strokeWidth={2.2} />
              <span className="text-[12px] font-semibold">+14% vs last period</span>
            </div>
          </div>
          <BarChart data={MONTHLY} colors={['#1769FF']} labels={MONTH_LABELS} height={130} />
        </div>

        {/* Transaction type donut */}
        <div className="glass-card flex flex-col gap-3" style={{ padding: '20px 22px' }}>
          <h3 className="text-[16px] font-bold text-[#0B1B3A] dark:text-[#F8FAFC] font-[family-name:var(--font-display)]">Transaction Types</h3>
          <div className="flex items-center gap-4">
            <DonutChart segments={TX_TYPES} size={110} />
            <div className="flex flex-col gap-2 flex-1">
              {TX_TYPES.map(t => (
                <div key={t.label} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: t.color }} />
                  <span className="text-[11.5px] text-[#52698F] dark:text-[#94A3B8] flex-1">{t.label}</span>
                  <span className="text-[11.5px] font-semibold text-[#0B1B3A] dark:text-[#F8FAFC]">{t.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Flagged per month */}
      <div className="glass-card-strong" style={{ padding: '20px 22px' }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[16px] font-bold text-[#0B1B3A] dark:text-[#F8FAFC] font-[family-name:var(--font-display)]">Flagged Transactions per Month</h3>
          <div className="flex items-center gap-1.5 text-[#F04444]">
            <TrendingUp className="w-4 h-4" strokeWidth={2.2} />
            <span className="text-[12px] font-semibold">Sep spike — under investigation</span>
          </div>
        </div>
        <BarChart data={FLAGGED} colors={['#F04444']} labels={MONTH_LABELS} height={110} />
      </div>

      {/* Risk Distribution */}
      <div className="glass-card" style={{ padding: '20px 22px' }}>
        <h3 className="text-[15px] font-bold text-[#0B1B3A] dark:text-[#F8FAFC] font-[family-name:var(--font-display)] mb-3">
          Cumulative Risk Score Distribution
        </h3>
        <div className="space-y-3">
          {[
            { label: 'Low Risk (< 0.40)', pct: 88.5, color: '#18A96B', Icon: CheckCircle },
            { label: 'Medium Risk (0.40 – 0.70)', pct: 7.7, color: '#F5A623', Icon: AlertTriangle },
            { label: 'High Risk (> 0.70)', pct: 3.8, color: '#F04444', Icon: AlertTriangle },
          ].map(r => (
            <div key={r.label} className="flex items-center gap-3">
              <r.Icon className="w-4 h-4 shrink-0" style={{ color: r.color }} strokeWidth={2.2} />
              <span className="text-[12.5px] text-[#52698F] dark:text-[#94A3B8] w-[190px] shrink-0">{r.label}</span>
              <div className="flex-1 h-2.5 rounded-full bg-white/50 border border-white/60 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${r.pct}%`, background: r.color }} />
              </div>
              <span className="text-[12px] font-bold text-[#0B1B3A] dark:text-[#F8FAFC] w-12 text-right">{r.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
