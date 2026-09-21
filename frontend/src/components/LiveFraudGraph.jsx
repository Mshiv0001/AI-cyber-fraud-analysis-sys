import React, { useRef, useEffect, useCallback } from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';

const SERIES = [
  { key: 'happening', label: 'Cases Happening', color: '#1875FF', dashLen: 0 },
  { key: 'reported',  label: 'Reported Cases',  color: '#8067FF', dashLen: 0 },
  { key: 'actual_fraud', label: 'Actual Fraud (Ground Truth)', color: '#F04444', dashLen: 0 },
  { key: 'ml_fraud', label: 'ML Detected Fraud', color: '#18A96B', dashLen: [5, 4] },
];

function drawChart(canvas, data, isDark) {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.offsetWidth;
  const h = canvas.offsetHeight;
  if (w === 0 || h === 0) return;

  canvas.width  = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  const PAD = { top: 14, right: 20, bottom: 40, left: 38 };
  const cw = w - PAD.left - PAD.right;
  const ch = h - PAD.top - PAD.bottom;

  // Background grid
  const textColor = isDark ? 'rgba(148,163,184,0.7)' : 'rgba(82,105,143,0.65)';
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(11,27,58,0.06)';

  const allVals = data.flatMap(d => SERIES.map(s => d[s.key] || 0));
  const maxVal = Math.max(...allVals, 5);
  const ySteps = 5;

  // Grid lines
  for (let i = 0; i <= ySteps; i++) {
    const y = PAD.top + ch - (i / ySteps) * ch;
    ctx.beginPath();
    ctx.moveTo(PAD.left, y);
    ctx.lineTo(PAD.left + cw, y);
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Y label
    const label = Math.round((i / ySteps) * maxVal);
    ctx.fillStyle = textColor;
    ctx.font = `${9 * Math.min(dpr, 1)}px Inter, system-ui, sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText(label, PAD.left - 5, y + 3);
  }

  if (data.length < 2) {
    // No data placeholder
    ctx.fillStyle = textColor;
    ctx.font = `13px Inter, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('Start simulation to see live data', w / 2, h / 2);
    return;
  }

  const xStep = cw / (data.length - 1);

  // X axis labels (minute slots)
  const labelEvery = Math.max(1, Math.floor(data.length / 6));
  ctx.fillStyle = textColor;
  ctx.font = `9px Inter, system-ui, sans-serif`;
  ctx.textAlign = 'center';
  data.forEach((d, i) => {
    if (i % labelEvery === 0 || i === data.length - 1) {
      const x = PAD.left + i * xStep;
      ctx.fillText(d.minute, x, h - PAD.bottom + 16);
    }
  });

  // Draw each series
  SERIES.forEach(series => {
    const pts = data.map((d, i) => ({
      x: PAD.left + i * xStep,
      y: PAD.top + ch - ((d[series.key] || 0) / maxVal) * ch,
    }));

    // Gradient fill under line
    const grad = ctx.createLinearGradient(0, PAD.top, 0, PAD.top + ch);
    grad.addColorStop(0, series.color + '28');
    grad.addColorStop(1, series.color + '00');

    ctx.beginPath();
    pts.forEach((p, i) => {
      if (i === 0) {
        ctx.moveTo(p.x, p.y);
      } else {
        const prev = pts[i - 1];
        const cpx = (prev.x + p.x) / 2;
        ctx.bezierCurveTo(cpx, prev.y, cpx, p.y, p.x, p.y);
      }
    });
    ctx.lineTo(pts[pts.length - 1].x, PAD.top + ch);
    ctx.lineTo(pts[0].x, PAD.top + ch);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Stroke line
    ctx.beginPath();
    if (Array.isArray(series.dashLen) && series.dashLen.length) {
      ctx.setLineDash(series.dashLen);
    } else {
      ctx.setLineDash([]);
    }
    pts.forEach((p, i) => {
      if (i === 0) {
        ctx.moveTo(p.x, p.y);
      } else {
        const prev = pts[i - 1];
        const cpx = (prev.x + p.x) / 2;
        ctx.bezierCurveTo(cpx, prev.y, cpx, p.y, p.x, p.y);
      }
    });
    ctx.strokeStyle = series.color;
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.setLineDash([]);

    // Dot at last point
    const last = pts[pts.length - 1];
    ctx.beginPath();
    ctx.arc(last.x, last.y, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = series.color;
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });
}

export default function LiveFraudGraph({ data = [], isDark = false }) {
  const canvasRef = useRef(null);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawChart(canvas, data, isDark);
  }, [data, isDark]);

  useEffect(() => {
    redraw();
    const ro = new ResizeObserver(redraw);
    if (canvasRef.current?.parentElement) ro.observe(canvasRef.current.parentElement);
    return () => ro.disconnect();
  }, [redraw]);

  return (
    <div id="tour-fraud-graph" className="glass-card-strong flex flex-col" style={{ padding: '20px 22px' }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(240,68,68,0.10)', border: '1px solid rgba(240,68,68,0.25)' }}
          >
            <BarChart3 className="w-[18px] h-[18px]" style={{ color: '#F04444' }} strokeWidth={2.2} />
          </div>
          <div>
            <h3 className="text-[16px] font-bold text-[#0B1B3A] dark:text-[#F8FAFC] font-[family-name:var(--font-display)]">
              Live Fraud Case Activity
            </h3>
            <p className="text-[12px] text-[#58709A] dark:text-[#94A3B8]">
              Live simulation: incidents, reported cases, and ground-truth fraud.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[#18A96B] shrink-0">
          <TrendingUp className="w-3.5 h-3.5" strokeWidth={2.2} />
          <span className="text-[11px] font-semibold">Live</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-3">
        {SERIES.map(s => (
          <div key={s.key} className="flex items-center gap-1.5">
            <div
              className="w-6 h-1.5 rounded-full"
              style={{
                background: s.color,
                opacity: Array.isArray(s.dashLen) && s.dashLen.length ? 0.7 : 1,
              }}
            />
            <span className="text-[11px] text-[#52698F] dark:text-[#94A3B8] font-medium">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Canvas */}
      <div className="relative w-full" style={{ height: 180 }}>
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%', display: 'block' }}
          aria-label="Live Fraud Case Activity Chart"
        />
      </div>

      {/* X axis label */}
      <p className="text-center text-[10.5px] text-[#7C8DA8] dark:text-[#94A3B8] mt-2 font-medium">
        Time (minute)
      </p>
    </div>
  );
}
