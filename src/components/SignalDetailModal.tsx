'use client';

import React from 'react';
import { PestleSignal } from '@/types/pestle';
import { X, ExternalLink, ArrowUpRight, ShieldAlert, Sparkles, Lightbulb } from 'lucide-react';

interface SignalDetailModalProps {
  signal: PestleSignal | null;
  pillarName: string;
  onClose: () => void;
}

export const SignalDetailModal: React.FC<SignalDetailModalProps> = ({
  signal,
  pillarName,
  onClose,
}) => {
  if (!signal) return null;

  const isOpportunity = signal.type === 'Opportunity';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
              {pillarName} Dimension
            </span>
            <span className="text-slate-500">&bull;</span>
            <span
              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                isOpportunity
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}
            >
              {isOpportunity ? <ArrowUpRight className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
              {signal.type}
            </span>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-white leading-snug">
          {signal.title}
        </h3>

        {/* Impact Bar */}
        <div className="rounded-xl bg-slate-950/60 p-3.5 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Market Impact Magnitude:</span>
            <span
              className={`font-black ${
                signal.impact_score >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {signal.impact_score > 0 ? `+${signal.impact_score}` : signal.impact_score} / 5.0
            </span>
          </div>
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
            {signal.impact_score < 0 ? (
              <div
                className="h-full bg-rose-500 ml-auto rounded-full"
                style={{ width: `${Math.min(100, Math.abs(signal.impact_score) * 20)}%` }}
              />
            ) : (
              <div
                className="h-full bg-emerald-500 mr-auto rounded-full"
                style={{ width: `${Math.min(100, Math.abs(signal.impact_score) * 20)}%` }}
              />
            )}
          </div>
          <p className="text-[10px] text-slate-500 text-right">
            Scale: -5 (Severe Threat) to +5 (Major Opportunity)
          </p>
        </div>

        {/* Detail Description */}
        <div className="space-y-1.5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Observation & Analysis
          </h4>
          <p className="text-sm text-slate-200 leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-slate-800/80">
            {signal.detail}
          </p>
        </div>

        {/* Strategic Guidance / Recommendation */}
        <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-3.5 space-y-1.5">
          <div className="flex items-center gap-1.5 text-indigo-300 text-xs font-semibold">
            <Lightbulb className="h-4 w-4 text-amber-400" />
            <span>Strategic Implication</span>
          </div>
          <p className="text-xs text-indigo-100 leading-relaxed">
            {isOpportunity
              ? `Capitalize on this tailwind by allocating strategic R&D and market development resources ahead of competitors. Form regional partnerships to secure early market position.`
              : `Proactively stress-test your operational compliance and pricing models against this threat. Establish defensive buffers and engage local policy advisory groups.`}
          </p>
        </div>

        {/* Source Citation */}
        {signal.source_url && (
          <div className="pt-2 border-t border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
              Grounded Evidence Source:
            </span>
            <a
              href={signal.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-cyan-400 hover:border-cyan-500 hover:text-cyan-300 transition"
            >
              <span className="truncate max-w-[85%] font-mono text-[11px]">
                {signal.source_url}
              </span>
              <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 ml-2" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
