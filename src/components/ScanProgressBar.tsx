'use client';

import React, { useState, useEffect } from 'react';
import { Compass, Search, Globe, Cpu, CheckCircle2, ShieldCheck, Clock } from 'lucide-react';

interface ScanProgressBarProps {
  isLoading: boolean;
  industry: string;
  country: string;
  onComplete?: () => void;
}

const STAGES = [
  {
    threshold: 22,
    icon: Search,
    title: 'Tavily Web Search',
    detail: 'Dispatching Boolean queries to index policy, regulatory, and market reports...',
    color: 'text-cyan-400',
  },
  {
    threshold: 48,
    icon: Globe,
    title: 'Grounding Web Evidence',
    detail: 'Parsing top 10 web snippets, timestamps, and verifying source citation links...',
    color: 'text-blue-400',
  },
  {
    threshold: 78,
    icon: Cpu,
    title: 'AI PESTLE Pillar Synthesis',
    detail: 'Extracting signals across Political, Economic, Social, Tech, Legal & Environmental...',
    color: 'text-indigo-400',
  },
  {
    threshold: 95,
    icon: ShieldCheck,
    title: 'Impact Scoring & Risk Modeling',
    detail: 'Evaluating risk/opportunity impacts (-5 to +5) and computing macro readiness gauge...',
    color: 'text-violet-400',
  },
  {
    threshold: 100,
    icon: CheckCircle2,
    title: 'Intelligence Ready',
    detail: 'Finalizing PESTLE radar matrix and source provenance graph...',
    color: 'text-emerald-400',
  },
];

export const ScanProgressBar: React.FC<ScanProgressBarProps> = ({
  isLoading,
  industry,
  country,
}) => {
  const [progress, setProgress] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setProgress(0);
      setElapsedSec(0);
      return;
    }

    const startTime = Date.now();

    // Elapsed timer
    const elapsedInterval = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startTime) / 1000));
    }, 500);

    // Asymptotic progress curve: starts briskly, moves to ~94% while waiting for backend
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 20) return prev + 3.5;
        if (prev < 45) return prev + 2.2;
        if (prev < 70) return prev + 1.4;
        if (prev < 88) return prev + 0.8;
        if (prev < 94) return prev + 0.3;
        return prev; // hold at 94% until loaded
      });
    }, 250);

    return () => {
      clearInterval(elapsedInterval);
      clearInterval(progressInterval);
    };
  }, [isLoading]);

  // Determine active stage
  const currentStage = STAGES.find((s) => progress <= s.threshold) || STAGES[STAGES.length - 1];
  const StageIcon = currentStage.icon;

  const displayProgress = Math.min(100, Math.round(progress));

  return (
    <div className="w-full rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-inner">
            <Compass className="h-6 w-6 animate-spin text-cyan-400" />
            <div className="absolute inset-0 rounded-xl bg-cyan-400/10 animate-ping opacity-75" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Executing Market Intelligence Pipeline
            </h3>
            <p className="text-xs text-slate-400">
              Scanning <span className="text-cyan-300 font-semibold">&ldquo;{industry}&rdquo;</span> in{' '}
              <span className="text-emerald-300 font-semibold">{country}</span>
            </p>
          </div>
        </div>

        {/* Live Elapsed & Percentage Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <Clock className="h-3.5 w-3.5 text-slate-500" />
            <span>{elapsedSec}s elapsed</span>
            <span className="text-slate-600">&bull;</span>
            <span className="text-slate-500">~15s avg</span>
          </div>

          <div className="rounded-xl border border-cyan-500/40 bg-cyan-950/40 px-3 py-1 font-mono text-base font-extrabold text-cyan-300 shadow-sm">
            {displayProgress}%
          </div>
        </div>
      </div>

      {/* Main Percentage Progress Bar */}
      <div className="space-y-2">
        <div className="relative h-4 w-full overflow-hidden rounded-full bg-slate-950 p-0.5 border border-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-400 transition-all duration-300 relative shadow-lg shadow-cyan-500/25"
            style={{ width: `${displayProgress}%` }}
          >
            {/* Shimmer light sweep effect */}
            <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 font-mono">
          <span>0% Search Query</span>
          <span>50% Web Grounding</span>
          <span>80% PESTLE AI</span>
          <span>100% Ready</span>
        </div>
      </div>

      {/* Active Stage Callout */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 transition-all duration-300">
        <div className="flex items-start gap-3">
          <div className={`rounded-lg bg-slate-900 p-2 border border-slate-800 ${currentStage.color}`}>
            <StageIcon className="h-5 w-5" />
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold uppercase tracking-wider ${currentStage.color}`}>
                Current Milestone: {currentStage.title}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                Stage {STAGES.indexOf(currentStage) + 1} of {STAGES.length}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {currentStage.detail}
            </p>
          </div>
        </div>
      </div>

      {/* Cold Start Notice (Render free tier / Chromium spin-up feedback) */}
      {elapsedSec >= 15 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3.5 text-xs text-amber-200/90 flex items-start sm:items-center gap-3 animate-in fade-in duration-300">
          <span className="text-xl flex-shrink-0">☕</span>
          <div className="space-y-0.5">
            <span className="font-semibold text-amber-300">Connecting to Backend Container:</span>{' '}
            Render free-tier instances sleep when idle. The initial container cold-start and Playwright Chromium initialization can take ~30–45s. Your scan is actively progressing!
          </div>
        </div>
      )}

      {/* 5-Step Visual Checkpoints */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
        {STAGES.map((stage, idx) => {
          const isDone = progress > stage.threshold;
          const isCurrent = currentStage.title === stage.title;

          return (
            <div
              key={stage.title}
              className={`rounded-lg p-2 border text-center transition-all ${
                isDone
                  ? 'border-emerald-500/30 bg-emerald-950/10 text-emerald-400'
                  : isCurrent
                  ? 'border-cyan-500/50 bg-cyan-950/20 text-cyan-300 shadow-sm shadow-cyan-500/10'
                  : 'border-slate-800/80 bg-slate-950/40 text-slate-600'
              }`}
            >
              <div className="text-[10px] font-bold uppercase truncate">
                {stage.title}
              </div>
              <div className="text-[9px] font-mono mt-0.5">
                {isDone ? '✓ Done' : isCurrent ? '⏳ In progress' : 'Pending'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
