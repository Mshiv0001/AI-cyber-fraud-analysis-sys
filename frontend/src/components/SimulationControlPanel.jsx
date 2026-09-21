import React, { useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, Zap, Activity, AlertTriangle, TrendingUp, Info } from 'lucide-react';

const SPEEDS = [
  { label: 'Slow', value: 5, desc: '5/min' },
  { label: 'Normal', value: 20, desc: '20/min' },
  { label: 'Fast', value: 50, desc: '50/min' },
];

const SCENARIOS = [
  { value: 'normal', label: 'Normal', desc: '~5% fraud', color: '#18A96B' },
  { value: 'mixed', label: 'Mixed', desc: '~20% fraud', color: '#F5A623' },
  { value: 'spike', label: 'Spike', desc: '~50% fraud', color: '#F04444' },
];

export default function SimulationControlPanel({
  status = 'STOPPED',
  eventsGenerated = 0,
  casesRegistered = 0,
  fraudEvents = 0,
  rate = 20,
  scenario = 'normal',
  onStart,
  onPause,
  onReset,
  onSpeedChange,
  onScenarioChange,
}) {
  const [showInfo, setShowInfo] = useState(false);

  const isRunning = status === 'RUNNING';
  const isPaused = status === 'PAUSED';

  const handleSpeedSelect = useCallback((val) => {
    onSpeedChange?.(val);
  }, [onSpeedChange]);

  const handleScenarioSelect = useCallback((val) => {
    onScenarioChange?.(val);
  }, [onScenarioChange]);

  const statusColor = isRunning ? '#18A96B' : isPaused ? '#F5A623' : '#7C8DA8';
  const statusLabel = isRunning ? 'RUNNING' : isPaused ? 'PAUSED' : 'STOPPED';
  const currentScenario = SCENARIOS.find(s => s.value === scenario) || SCENARIOS[0];

  return (
    <div
      id="tour-sim-panel"
      className="glass-card-strong relative overflow-hidden flex flex-col gap-4"
      style={{ padding: '20px 22px' }}
    >
      {/* Animated pulse ring when running */}
      {isRunning && (
        <div
          className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full"
          style={{
            background: '#18A96B',
            boxShadow: '0 0 0 0 rgba(24,169,107,0.5)',
            animation: 'simPulse 1.5s infinite',
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(24,169,107,0.12)', border: '1px solid rgba(24,169,107,0.3)' }}
          >
            <Activity className="w-[18px] h-[18px]" style={{ color: '#18A96B' }} strokeWidth={2.2} />
          </div>
          <div>
            <h3 className="text-[16px] font-bold text-[#0B1B3A] dark:text-[#F8FAFC] font-[family-name:var(--font-display)]">
              Live Simulation
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider"
                style={{
                  background: statusColor + '18',
                  color: statusColor,
                  border: `1px solid ${statusColor}40`,
                }}
              >
                ● {statusLabel}
              </span>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full tracking-wider"
                style={{
                  background: 'rgba(128,103,255,0.12)',
                  color: '#8067FF',
                  border: '1px solid rgba(128,103,255,0.25)',
                }}
              >
                LIVE SIMULATION DATA
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowInfo(v => !v)}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[#7C8DA8] dark:text-[#94A3B8] hover:text-[#1875FF] dark:hover:text-[#38BDF8] hover:bg-white/50 dark:hover:bg-white/10 transition-all cursor-pointer"
          title="About simulation"
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Info tooltip */}
      {showInfo && (
        <div
          className="rounded-xl text-[12px] leading-relaxed text-[#52698F] dark:text-[#CBD5E1] bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/20 dark:border-blue-500/30 p-3"
        >
          <p><strong className="text-[#0B1B3A] dark:text-[#F8FAFC]">How it works:</strong> Realistic transactions are generated and passed through the real LightGBM ML model. Ground truth (intended pattern) and model prediction are stored independently — enabling genuine TP/FP/FN/TN analysis.</p>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex items-center gap-2">
        {!isRunning ? (
          <button
            id="sim-start-btn"
            onClick={onStart}
            className="flex items-center gap-2 px-4 h-[38px] rounded-xl text-[13px] font-semibold text-white transition-all cursor-pointer hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #18A96B, #1069A8)', boxShadow: '0 4px 14px rgba(24,169,107,0.35)' }}
          >
            <Play className="w-3.5 h-3.5" strokeWidth={2.5} />
            {isPaused ? 'Resume' : 'Start Simulation'}
          </button>
        ) : (
          <button
            id="sim-pause-btn"
            onClick={onPause}
            className="flex items-center gap-2 px-4 h-[38px] rounded-xl text-[13px] font-semibold transition-all cursor-pointer hover:opacity-90 active:scale-95 bg-amber-500/15 dark:bg-amber-500/20 border border-amber-500/35 dark:border-amber-500/40 text-[#D48B0A] dark:text-amber-300"
          >
            <Pause className="w-3.5 h-3.5" strokeWidth={2.5} />
            Pause
          </button>
        )}
        <button
          id="sim-reset-btn"
          onClick={onReset}
          className="flex items-center gap-2 px-3.5 h-[38px] rounded-xl text-[13px] font-semibold transition-all cursor-pointer hover:opacity-90 active:scale-95 bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/20 dark:border-rose-500/30 text-[#E05555] dark:text-rose-400"
        >
          <RotateCcw className="w-3.5 h-3.5" strokeWidth={2.5} />
          Reset
        </button>
      </div>

      {/* Speed Selection */}
      <div>
        <p className="text-[11px] font-semibold text-[#52698F] dark:text-[#94A3B8] uppercase tracking-wider mb-2">
          Speed
        </p>
        <div className="flex gap-1.5">
          {SPEEDS.map(s => {
            const isSelected = rate === s.value;
            return (
              <button
                key={s.value}
                onClick={() => handleSpeedSelect(s.value)}
                className={`flex-1 flex flex-col items-center py-2 rounded-xl text-[12px] font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#1769FF]/15 dark:bg-[#1769FF]/25 border border-[#1769FF]/40 dark:border-[#38BDF8]/60 text-[#1769FF] dark:text-[#38BDF8] shadow-sm'
                    : 'bg-white/45 dark:bg-white/5 border border-white/60 dark:border-white/10 text-[#52698F] dark:text-[#E2E8F0] hover:bg-white/70 dark:hover:bg-white/10'
                }`}
              >
                <span className="font-bold">{s.label}</span>
                <span className={`text-[10px] font-medium ${isSelected ? 'opacity-85' : 'opacity-70 dark:opacity-80 dark:text-[#94A3B8]'}`}>
                  {s.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Scenario Selection */}
      <div>
        <p className="text-[11px] font-semibold text-[#52698F] dark:text-[#94A3B8] uppercase tracking-wider mb-2">
          Scenario
        </p>
        <div className="flex gap-1.5">
          {SCENARIOS.map(s => {
            const isSelected = scenario === s.value;
            return (
              <button
                key={s.value}
                onClick={() => handleScenarioSelect(s.value)}
                className={`flex-1 flex flex-col items-center py-2 rounded-xl text-[12px] font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'shadow-sm'
                    : 'bg-white/45 dark:bg-white/5 border border-white/60 dark:border-white/10 text-[#52698F] dark:text-[#E2E8F0] hover:bg-white/70 dark:hover:bg-white/10'
                }`}
                style={isSelected ? {
                  background: s.color + '22',
                  border: `1px solid ${s.color}60`,
                  color: s.color,
                } : undefined}
              >
                <span className="font-bold">{s.label}</span>
                <span className={`text-[10px] font-medium ${isSelected ? 'opacity-90' : 'opacity-70 dark:opacity-80 dark:text-[#94A3B8]'}`}>
                  {s.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Counters */}
      <div
        className="grid grid-cols-3 gap-2 rounded-xl p-3 bg-white/35 dark:bg-white/5 border border-white/55 dark:border-white/10"
      >
        {[
          { Icon: Zap, label: 'Events', value: eventsGenerated.toLocaleString(), color: '#1875FF' },
          { Icon: TrendingUp, label: 'Cases', value: casesRegistered.toLocaleString(), color: '#8067FF' },
          { Icon: AlertTriangle, label: 'Fraud', value: fraudEvents.toLocaleString(), color: '#F04444' },
        ].map(({ Icon, label, value, color }) => (
          <div key={label} className="flex flex-col items-center gap-0.5">
            <Icon className="w-3.5 h-3.5 mb-0.5" style={{ color }} strokeWidth={2.2} />
            <span
              className="text-[18px] font-bold tabular-nums font-[family-name:var(--font-display)]"
              style={{ color }}
            >
              {value}
            </span>
            <span className="text-[10.5px] text-[#7C8DA8] dark:text-[#94A3B8] font-medium">{label}</span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes simPulse {
          0%   { box-shadow: 0 0 0 0 rgba(24,169,107,0.55); }
          70%  { box-shadow: 0 0 0 8px rgba(24,169,107,0); }
          100% { box-shadow: 0 0 0 0 rgba(24,169,107,0); }
        }
      `}</style>
    </div>
  );
}
