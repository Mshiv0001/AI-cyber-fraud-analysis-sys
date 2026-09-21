import React, { useRef, useState } from 'react';
import { X, Upload, FileSpreadsheet, AlertCircle, CheckCircle, Loader2, Download } from 'lucide-react';
import { predictBatch } from '../services/api';

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim().replace(/"/g, ''));
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] ?? ''; });
    return obj;
  });
}

export default function UploadModal({ isOpen, onClose, onComplete, onToast }) {
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | parsing | predicting | done | error
  const [results, setResults] = useState(null);
  const [errMsg, setErrMsg] = useState('');

  if (!isOpen) return null;

  const reset = () => { setFile(null); setStatus('idle'); setResults(null); setErrMsg(''); };

  const handleFile = (f) => {
    if (!f || !f.name.endsWith('.csv')) { setErrMsg('Please upload a .csv file.'); return; }
    setFile(f);
    setErrMsg('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleRun = async () => {
    if (!file) return;
    setStatus('parsing');

    const text = await file.text();
    const rows = parseCSV(text);

    if (rows.length === 0) {
      setErrMsg('CSV has no data rows.');
      setStatus('idle');
      return;
    }

    // Map CSV columns to model features
    const payload = rows.slice(0, 200).map(r => {
      const type = (r.type || 'TRANSFER').toUpperCase();
      return {
        step: Number(r.step || 1),
        amount: Number(r.amount || 0),
        oldbalanceOrg: Number(r.oldbalanceorg || r.oldbalanceorig || 0),
        newbalanceOrig: Number(r.newbalanceorig || r.newbalancedest || 0),
        oldbalanceDest: Number(r.oldbalancedest || 0),
        newbalanceDest: Number(r.newbalancedest || 0),
        type_CASH_IN: type === 'CASH_IN' ? 1 : 0,
        type_CASH_OUT: type === 'CASH_OUT' ? 1 : 0,
        type_DEBIT: type === 'DEBIT' ? 1 : 0,
        type_PAYMENT: type === 'PAYMENT' ? 1 : 0,
        type_TRANSFER: type === 'TRANSFER' ? 1 : 0,
      };
    });

    setStatus('predicting');
    const res = await predictBatch(payload);

    if (!res.success) {
      setErrMsg(res.error || 'Batch prediction failed.');
      setStatus('error');
      return;
    }

    const preds = res.data.predictions || res.data.results || [];
    const high = preds.filter(p => (p.fraud_probability ?? 0) > 0.7).length;
    const medium = preds.filter(p => (p.fraud_probability ?? 0) >= 0.4 && (p.fraud_probability ?? 0) <= 0.7).length;
    const low = preds.filter(p => (p.fraud_probability ?? 0) < 0.4).length;

    setResults({ total: preds.length, high, medium, low, predictions: preds });
    setStatus('done');
    onToast?.(`Batch of ${preds.length} records processed — ${high} high-risk flagged`);
    onComplete?.(preds);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1B3A]/30 backdrop-blur-[3px]"
        onMouseDown={onClose}>
        <div
          className="glass-card-strong w-full max-w-[520px] flex flex-col relative"
          style={{ padding: '28px 28px', maxHeight: '90vh', overflowY: 'auto' }}
          onMouseDown={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="w-5 h-5 text-[#18A96B]" strokeWidth={2.2} />
              <h2 className="text-[18px] font-bold text-[#0B1B3A] dark:text-[#F8FAFC] font-[family-name:var(--font-display)]">
                Upload Batch Data
              </h2>
            </div>
            <button onClick={() => { reset(); onClose(); }} className="w-8 h-8 rounded-full bg-white/60 border border-white/70 flex items-center justify-center hover:bg-white/90 transition-all cursor-pointer">
              <X className="w-4 h-4 text-[#475569]" />
            </button>
          </div>

          {status === 'idle' && (
            <>
              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 cursor-pointer transition-all ${dragging ? 'border-[#1769FF] bg-[#1769FF]/5' : 'border-white/60 bg-white/30 hover:border-[#1769FF]/50 hover:bg-white/40'}`}
              >
                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => handleFile(e.target.files[0])} />
                <div className="w-14 h-14 rounded-2xl bg-white/70 border border-white/80 flex items-center justify-center shadow-sm">
                  <Upload className="w-6 h-6 text-[#1769FF]" strokeWidth={2} />
                </div>
                <div className="text-center">
                  <p className="text-[14px] font-semibold text-[#0B1B3A] dark:text-[#F8FAFC]">Drag & drop your CSV here</p>
                  <p className="text-[12px] text-[#58709A] mt-1">or click to browse · max 200 rows processed</p>
                </div>
              </div>

              {file && (
                <div className="mt-3 flex items-center gap-3 p-3 rounded-xl bg-white/60 border border-white/70">
                  <FileSpreadsheet className="w-5 h-5 text-[#18A96B] shrink-0" strokeWidth={2.2} />
                  <span className="text-[13px] font-medium text-[#0B1B3A] dark:text-[#F8FAFC] truncate flex-1">{file.name}</span>
                  <button onClick={reset} className="text-[#7C8DA8] hover:text-[#F04444] transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
                </div>
              )}

              {errMsg && (
                <div className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-[#F04444]/10 border border-[#F04444]/25">
                  <AlertCircle className="w-4 h-4 text-[#F04444] shrink-0" strokeWidth={2} />
                  <p className="text-[12.5px] text-[#C0392B]">{errMsg}</p>
                </div>
              )}

              <div className="mt-3 glass-inset rounded-xl p-3 text-[12px] text-[#52698F] flex items-center justify-between gap-2">
                <div>
                  <strong className="text-[#1769FF]">Expected columns:</strong> step, type, amount, oldbalanceOrg, newbalanceOrig, oldbalanceDest, newbalanceDest
                </div>
                <a
                  href="/sample_transactions.csv"
                  download="sample_transactions.csv"
                  className="flex items-center gap-1.5 text-[11.5px] font-semibold text-[#1769FF] hover:underline shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  Sample CSV
                </a>
              </div>

              <div className="mt-4 flex gap-3">
                <button onClick={() => { reset(); onClose(); }} className="flex-1 h-[44px] rounded-[14px] text-[13px] font-semibold text-[#52698F] border border-white/70 bg-white/50 hover:bg-white/80 transition-all cursor-pointer">
                  Cancel
                </button>
                <button onClick={handleRun} disabled={!file}
                  className="flex-1 btn-primary h-[44px] text-[13px] disabled:opacity-50 disabled:cursor-not-allowed">
                  Run Batch Prediction
                </button>
              </div>
            </>
          )}

          {(status === 'parsing' || status === 'predicting') && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="w-10 h-10 text-[#1769FF] animate-spin" strokeWidth={2} />
              <p className="text-[14px] font-semibold text-[#0B1B3A] dark:text-[#F8FAFC]">
                {status === 'parsing' ? 'Parsing CSV…' : 'Running ML predictions…'}
              </p>
              <p className="text-[12px] text-[#58709A]">This may take a moment for large batches</p>
            </div>
          )}

          {status === 'done' && results && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2.5">
                <CheckCircle className="w-5 h-5 text-[#18A96B]" strokeWidth={2.2} />
                <p className="text-[15px] font-bold text-[#0B1B3A] dark:text-[#F8FAFC]">
                  Batch complete — {results.total} records processed
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'High Risk', count: results.high, color: '#F04444' },
                  { label: 'Medium', count: results.medium, color: '#D48B0A' },
                  { label: 'Cleared', count: results.low, color: '#18A96B' },
                ].map(r => (
                  <div key={r.label} className="glass-card flex flex-col items-center py-3 gap-1">
                    <span className="text-[22px] font-bold tabular-nums font-[family-name:var(--font-display)]" style={{ color: r.color }}>{r.count}</span>
                    <span className="text-[11.5px] text-[#58709A]">{r.label}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-2">
                <button onClick={() => { reset(); onClose(); }} className="flex-1 h-[44px] rounded-[14px] text-[13px] font-semibold text-[#52698F] border border-white/70 bg-white/50 hover:bg-white/80 transition-all cursor-pointer">
                  Close
                </button>
                <button onClick={reset} className="flex-1 btn-primary h-[44px] text-[13px]">
                  Upload Another
                </button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-4 py-6">
              <AlertCircle className="w-10 h-10 text-[#F04444]" strokeWidth={2} />
              <p className="text-[14px] font-bold text-[#0B1B3A] dark:text-[#F8FAFC]">Prediction failed</p>
              <p className="text-[12.5px] text-[#52698F] text-center">{errMsg}</p>
              <button onClick={reset} className="btn-primary h-[42px] px-6 text-[13px]">Try Again</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
