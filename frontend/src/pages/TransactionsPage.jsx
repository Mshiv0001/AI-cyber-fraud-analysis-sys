import React, { useState } from 'react';
import { ArrowLeftRight, Plus } from 'lucide-react';
import TransactionRiskAnalysis from '../components/TransactionRiskAnalysis';

export default function TransactionsPage({
  transactions,
  onAction,
  onOpenNewCase,
  onOpenUpload,
  searchQuery = '',
  onClearSearch,
  onSelectTx,
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(23,105,255,0.12)', border: '1px solid rgba(23,105,255,0.25)' }}
          >
            <ArrowLeftRight className="w-5 h-5" style={{ color: '#1769FF' }} strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="text-[24px] font-bold text-[#0B1B3A] dark:text-[#F8FAFC] font-[family-name:var(--font-display)] leading-tight">
              Transactions
            </h2>
            <p className="text-[13px] text-[#58709A] dark:text-[#94A3B8]">
              Full transaction log with ML risk scoring
            </p>
          </div>
        </div>
        <button
          onClick={onOpenNewCase}
          className="btn-primary flex items-center gap-2 h-[44px] px-5 text-[13px] shrink-0"
        >
          <Plus className="w-4 h-4" strokeWidth={2.2} />
          <span>New Case</span>
        </button>
      </div>

      {/* Reuse the full transaction risk analysis table */}
      <TransactionRiskAnalysis
        transactions={transactions}
        searchQueryProp={searchQuery}
        onClearSearch={onClearSearch}
        onRowClick={onSelectTx}
        onAction={onAction}
        onOpenUpload={onOpenUpload}
        compact={false}
        pageSize={12}
      />
    </div>
  );
}
