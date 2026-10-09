'use client';

import React, { useState } from 'react';
import { ScanResponseData } from '@/types/pestle';
import { Sparkles, Clock, Zap, ShieldCheck, FileText, RotateCw } from 'lucide-react';
import { generatePestlePdf } from '@/lib/pdfGenerator';

interface ExecutiveSummaryBarProps {
  data: ScanResponseData;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const ExecutiveSummaryBar: React.FC<ExecutiveSummaryBarProps> = ({
  data,
  onRefresh,
  isRefreshing,
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!data || isExporting) return;
    setIsExporting(true);
    try {
      await generatePestlePdf(data);
    } catch (err) {
      console.error('PDF export error:', err);
      alert('Unable to generate PDF report: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 h-40 w-40 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Meta Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {data.industry} <span className="text-slate-500">in</span> {data.target_country}
            </h2>
            {data.cached ? (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 text-[11px] font-medium text-cyan-300"
                title="Served from 24-hour cache"
              >
                <Zap className="h-3 w-3 text-cyan-400" />
                <span>24h Cache Hit</span>
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300"
                title="Live Tavily research & LLM extraction"
              >
                <Sparkles className="h-3 w-3 text-emerald-400" />
                <span>Live Grounded Scan</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-slate-500" />
              {new Date(data.timestamp).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
            {data.model_used && (
              <span className="text-slate-500 font-mono text-[11px]">
                Model: {data.model_used}
              </span>
            )}
            {data.execution_time_ms && (
              <span className="text-slate-500 text-[11px]">
                {(data.execution_time_ms / 1000).toFixed(2)}s execution
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Direct Export PDF */}
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-3.5 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-500/60 transition shadow-sm shadow-cyan-500/10 disabled:opacity-50"
            title="Download colorful Executive PESTLE PDF Report"
          >
            {isExporting ? (
              <>
                <RotateCw className="h-3.5 w-3.5 animate-spin text-cyan-400" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <FileText className="h-3.5 w-3.5 text-cyan-400" />
                <span>Export PDF</span>
              </>
            )}
          </button>

          {/* Re-scan button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/70 px-3.5 py-1.5 text-xs font-medium text-slate-200 hover:border-cyan-500/50 hover:bg-slate-800 hover:text-white transition disabled:opacity-50"
          >
            <Zap className="h-3.5 w-3.5 text-cyan-400" />
            <span>{isRefreshing ? 'Re-scanning...' : 'Re-scan Grounding'}</span>
          </button>
        </div>
      </div>

      {/* Executive Summary Box */}
      <div className="mt-4 rounded-xl border border-cyan-500/10 bg-cyan-950/20 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400 ring-1 ring-cyan-500/20 mt-0.5">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              Executive Macro Assessment
            </h3>
            <p className="text-sm sm:text-base leading-relaxed text-slate-200">
              {data.summary}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
