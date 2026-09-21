import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  ArrowRight,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { predictTransaction } from '../services/api';

const TRANSACTION_TYPES = [
  { value: 'TRANSFER', label: 'TRANSFER (Wire / Bank Transfer)', method: 'Wire Transfer' },
  { value: 'CASH_OUT', label: 'CASH_OUT (Cash Withdrawal / Out)', method: 'Cash Out' },
  { value: 'PAYMENT', label: 'PAYMENT (Merchant / POS Payment)', method: 'Merchant Payment' },
  { value: 'CASH_IN', label: 'CASH_IN (Account Deposit)', method: 'Account Deposit' },
  { value: 'DEBIT', label: 'DEBIT (Debit Purchase / Card)', method: 'Debit Purchase' },
];

const PRESETS = [
  {
    name: 'Suspicious Wire (Drain)',
    data: {
      amount: '18500',
      type: 'TRANSFER',
      oldbalanceOrg: '18500',
      newbalanceOrig: '0',
      oldbalanceDest: '0',
      newbalanceDest: '18500',
      step: '1',
    },
  },
  {
    name: 'Normal Payment',
    data: {
      amount: '240',
      type: 'PAYMENT',
      oldbalanceOrg: '4800',
      newbalanceOrig: '4560',
      oldbalanceDest: '0',
      newbalanceDest: '0',
      step: '1',
    },
  },
  {
    name: 'Legitimate Transfer',
    data: {
      amount: '5000',
      type: 'TRANSFER',
      oldbalanceOrg: '35000',
      newbalanceOrig: '30000',
      oldbalanceDest: '12000',
      newbalanceDest: '17000',
      step: '1',
    },
  },
];

export default function NewCaseModal({ isOpen, onClose, onCaseCreated, onToast }) {
  const [formData, setFormData] = useState({
    amount: '14850',
    type: 'TRANSFER',
    oldbalanceOrg: '15000',
    newbalanceOrig: '150',
    oldbalanceDest: '2500',
    newbalanceDest: '17350',
    step: '1',
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const loadPreset = (presetData) => {
    setFormData(presetData);
    setResult(null);
    setError('');
  };

  const autoFillDrainFraud = () => {
    const amt = parseFloat(formData.amount) || 10000;
    setFormData((prev) => ({
      ...prev,
      oldbalanceOrg: String(amt),
      newbalanceOrig: '0',
      oldbalanceDest: '0',
      newbalanceDest: String(amt),
      type: 'TRANSFER',
    }));
  };

  const autoCalculateBalances = () => {
    const amt = parseFloat(formData.amount) || 0;
    const oldOrg = parseFloat(formData.oldbalanceOrg) || 0;
    const oldDest = parseFloat(formData.oldbalanceDest) || 0;
    setFormData((prev) => ({
      ...prev,
      newbalanceOrig: String(Math.max(0, oldOrg - amt)),
      newbalanceDest: String(oldDest + amt),
    }));
  };

  const handleAnalyze = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    const res = await predictTransaction(formData);
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Failed to connect to Flask backend at http://localhost:5000');
      return;
    }

    setResult(res.data);
  };

  const handleSaveToTable = () => {
    if (!result) return;

    const numAmount = parseFloat(formData.amount) || 0;
    const matchedType = TRANSACTION_TYPES.find((t) => t.value === formData.type);
    const typeLabel = matchedType ? matchedType.method : 'Wire Transfer';

    const now = new Date();
    const newTx = {
      id: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: 'Just now',
      created_at: now.toISOString(),
      amount: `$${numAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      type: typeLabel,
      payment_method: typeLabel,
      score: result.fraud_probability,
      risk: result.is_fraud ? 'high' : result.fraud_probability >= 0.35 ? 'medium' : 'low',
      signal: result.is_fraud
        ? `ML Model Flagged (p=${result.fraud_probability.toFixed(3)} ≥ ${result.threshold})`
        : `ML Model Verified (p=${result.fraud_probability.toFixed(3)} < ${result.threshold})`,
      status: result.is_fraud ? 'Flagged' : 'Cleared',
    };

    onCaseCreated?.(newTx);
    onToast?.(`New Case ${newTx.id} added (${newTx.status} • Risk: ${result.risk_score}%)`);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1B3A]/45 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-white/95 dark:bg-[#0C1C3E]/95 backdrop-blur-2xl border border-white/80 dark:border-white/15 p-5 sm:p-6 shadow-2xl text-[#0B1B3A] dark:text-[#F8FAFC] my-8"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1769FF]/15 border border-[#1769FF]/30 flex items-center justify-center text-[#1769FF]">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[17px] sm:text-[18px] font-bold font-[family-name:var(--font-display)]">
                New Case — AI Fraud Investigation
              </h2>
              <p className="text-[12px] text-[#64748B] dark:text-[#94A3B8]">
                Evaluates live against LightGBM model at <span className="font-mono text-[#1875FF]">http://localhost:5000</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-2 my-3 pt-1 flex-wrap">
          <span className="text-[11.5px] font-semibold text-[#64748B] dark:text-[#94A3B8] flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#F5A623]" /> Presets:
          </span>
          {PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => loadPreset(p.data)}
              className="text-[11px] sm:text-[11.5px] font-medium px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-[#29466F] dark:text-[#E2E8F0] transition-colors cursor-pointer"
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Form Fields */}
        <form onSubmit={handleAnalyze} className="space-y-3.5">
          {/* Amount & Transaction Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-[#52698F] dark:text-[#94A3B8] mb-1">
                Amount ($)
              </label>
              <input
                type="number"
                step="any"
                required
                value={formData.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                className="w-full px-3 py-2 text-[13px] rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/15 focus:border-[#1875FF] outline-none font-medium"
                placeholder="10000.00"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#52698F] dark:text-[#94A3B8] mb-1">
                Transaction Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className="w-full px-3 py-2 text-[13px] rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/15 focus:border-[#1875FF] outline-none font-medium"
              >
                {TRANSACTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value} className="dark:bg-[#0B1B3A] text-slate-800 dark:text-slate-100">
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Balance Helpers */}
          <div className="flex items-center gap-2 pt-0.5">
            <button
              type="button"
              onClick={autoCalculateBalances}
              className="flex-1 px-3 py-1.5 text-[11.5px] font-semibold rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all cursor-pointer"
              title="Calculate new balance: Old Balance minus Amount"
            >
              Auto-Calculate Balance
            </button>
            <button
              type="button"
              onClick={autoFillDrainFraud}
              className="flex-1 px-3 py-1.5 text-[11.5px] font-semibold rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all cursor-pointer"
              title="Simulate Account Drain (New Balance = $0)"
            >
              Drain Account ($0 New)
            </button>
          </div>

          {/* Origin Account Balances */}
          <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[11.5px] font-bold text-[#1875FF] uppercase tracking-wider">
                Origin Account (Sender)
              </p>
              <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                {formData.newbalanceOrig === '0' ? '⚠️ Drained (Strong Fraud Signal)' : 'Normal Sender'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8] mb-1">
                  Old Balance (oldbalanceOrg)
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.oldbalanceOrg}
                  onChange={(e) => handleChange('oldbalanceOrg', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-[12.5px] rounded-lg bg-white dark:bg-white/10 border border-slate-200 dark:border-white/15 outline-none font-medium"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8] mb-1">
                  New Balance (newbalanceOrig)
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.newbalanceOrig}
                  onChange={(e) => handleChange('newbalanceOrig', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-[12.5px] rounded-lg bg-white dark:bg-white/10 border border-slate-200 dark:border-white/15 outline-none font-medium"
                />
              </div>
            </div>
          </div>

          {/* Destination Account Balances */}
          <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 space-y-2">
            <p className="text-[11.5px] font-bold text-[#8067FF] uppercase tracking-wider">
              Destination Account (Recipient)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8] mb-1">
                  Old Balance (oldbalanceDest)
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.oldbalanceDest}
                  onChange={(e) => handleChange('oldbalanceDest', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-[12.5px] rounded-lg bg-white dark:bg-white/10 border border-slate-200 dark:border-white/15 outline-none font-medium"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#64748B] dark:text-[#94A3B8] mb-1">
                  New Balance (newbalanceDest)
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.newbalanceDest}
                  onChange={(e) => handleChange('newbalanceDest', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-[12.5px] rounded-lg bg-white dark:bg-white/10 border border-slate-200 dark:border-white/15 outline-none font-medium"
                />
              </div>
            </div>
          </div>

          {/* Step / Time parameter */}
          <div className="flex items-center justify-between text-[11.5px] text-[#64748B] dark:text-[#94A3B8] px-1">
            <span>Model Feature: <strong>step = {formData.step}</strong> (1 hour simulation interval)</span>
            <button
              type="button"
              onClick={() => handleChange('step', String(Number(formData.step) + 1))}
              className="text-[#1875FF] hover:underline cursor-pointer"
            >
              Increment Step +1
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-[12px] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Prediction Result Banner */}
          {result && (
            <div
              className={`p-4 rounded-xl border transition-all ${
                result.is_fraud
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-950 dark:text-rose-100'
                  : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-950 dark:text-emerald-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {result.is_fraud ? (
                    <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}
                  <div>
                    <span className="text-[11px] uppercase tracking-wider font-bold">
                      LightGBM Model Verdict
                    </span>
                    <h3 className="text-[16px] font-extrabold leading-tight">
                      {result.status === 'FRAUD' ? 'FRAUD SUSPECTED (High Risk)' : 'LEGITIMATE TRANSACTION'}
                    </h3>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] opacity-80">Risk Score</span>
                  <p className="text-[20px] font-extrabold tabular-nums leading-none">
                    {result.risk_score}%
                  </p>
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-current/20 flex items-center justify-between text-[11.5px] opacity-90">
                <span>Fraud Probability: <strong>{result.fraud_probability}</strong></span>
                <span>Decision Threshold: <strong>{result.threshold}</strong></span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[13px] font-semibold rounded-xl text-[#52698F] hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {!result ? (
              <button
                type="submit"
                disabled={loading}
                className="btn-primary px-5 py-2 text-[13px] font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    Analyzing with ML Model...
                  </>
                ) : (
                  <>
                    Run Model Prediction
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveToTable}
                className="btn-primary px-5 py-2 text-[13px] font-semibold flex items-center gap-2 cursor-pointer"
              >
                Add to Live Table & Complete
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
