'use client';

import React from 'react';
import { PestleBreakdown } from '@/types/pestle';
import { ShieldAlert, TrendingUp, Compass } from 'lucide-react';
import { PILLARS_CONFIG } from '@/lib/constants';

interface MacroReadinessGaugeProps {
  score: number; // -5 to +5
  pestleBreakdown: PestleBreakdown;
}

export const MacroReadinessGauge: React.FC<MacroReadinessGaugeProps> = ({
  score,
  pestleBreakdown,
}) => {
  // Normalize score between -5 and 5
  const clampedScore = Math.max(-5, Math.min(5, score));
  
  // Angle for SVG needle: -90 deg (score = -5) to +90 deg (score = +5)
  // angle = ((clampedScore + 5) / 10) * 180 - 90
  const needleAngle = ((clampedScore + 5) / 10) * 180 - 90;
  
  // Normalized 0 to 100 favorability index
  const normalizedIndex = Math.round(((clampedScore + 5) / 10) * 100);

  // Compute breakdown stats
  let totalRisks = 0;
  let totalOpportunities = 0;
  const pillarNetScores: Record<string, number> = {};

  for (const pillar of PILLARS_CONFIG) {
    const signals = pestleBreakdown[pillar.key] || [];
    let pillarSum = 0;
    for (const sig of signals) {
      if (sig.type === 'Risk') totalRisks += 1;
      if (sig.type === 'Opportunity') totalOpportunities += 1;
      pillarSum += sig.impact_score;
    }
    pillarNetScores[pillar.key] = signals.length > 0 ? Number((pillarSum / signals.length).toFixed(1)) : 0;
  }

  const totalSignals = totalRisks + totalOpportunities;
  const oppPercent = totalSignals > 0 ? Math.round((totalOpportunities / totalSignals) * 100) : 50;
  const riskPercent = 100 - oppPercent;

  // Determine readiness verdict
  let verdictText = 'Balanced Environment';
  let verdictColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
  let description = 'Moderate risks and opportunities are evenly matched in this market.';

  if (clampedScore >= 3.0) {
    verdictText = 'Prime Expansion (Highly Favorable)';
    verdictColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    description = 'Strong tailwinds across regulatory, technological, and economic indicators.';
  } else if (clampedScore >= 1.0) {
    verdictText = 'Favorable (Manageable Headwinds)';
    verdictColor = 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30';
    description = 'Market conditions favor strategic entry with prudent risk mitigation.';
  } else if (clampedScore <= -3.0) {
    verdictText = 'Severe Macro Headwinds (High Threat)';
    verdictColor = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    description = 'Substantial regulatory, legal, or economic friction creates elevated risk.';
  } else if (clampedScore <= -1.0) {
    verdictText = 'Elevated Risk (Caution Advised)';
    verdictColor = 'text-rose-300 bg-rose-500/10 border-rose-500/30';
    description = 'Deterrents and regulatory barriers outweigh near-term expansion opportunities.';
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-xl">
      {/* Visual Gauge Meter (col 12 -> 5) */}
      <div className="lg:col-span-5 flex flex-col items-center justify-center p-2 border-b lg:border-b-0 lg:border-r border-slate-800/80">
        <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <Compass className="h-4 w-4 text-cyan-400" />
          <span>Macro Readiness Gauge</span>
        </div>

        {/* SVG Speedometer */}
        <div className="relative w-64 h-36 flex items-center justify-center">
          <svg viewBox="0 0 200 115" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="35%" stopColor="#f59e0b" />
                <stop offset="65%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>

            {/* Background Arc Track */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="#1e293b"
              strokeWidth="18"
              strokeLinecap="round"
            />

            {/* Colored Gradient Arc */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="url(#gaugeGradient)"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray="251.3"
              strokeDashoffset="0"
              opacity="0.9"
            />

            {/* Ticks and Zone Indicators */}
            <text x="16" y="112" fill="#ef4444" fontSize="8" fontWeight="bold">-5</text>
            <text x="96" y="24" fill="#94a3b8" fontSize="8" fontWeight="bold">0</text>
            <text x="176" y="112" fill="#10b981" fontSize="8" fontWeight="bold">+5</text>

            {/* Pivot Point */}
            <circle cx="100" cy="100" r="7" fill="#38bdf8" className="shadow-lg" />
            <circle cx="100" cy="100" r="3" fill="#0f172a" />

            {/* Animated Needle */}
            <g
              transform={`rotate(${needleAngle}, 100, 100)`}
              style={{ transition: 'transform 1s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
            >
              <polygon points="98,100 102,100 100,28" fill="#f8fafc" />
              <polygon points="99,100 101,100 100,26" fill="#38bdf8" />
            </g>
          </svg>
        </div>

        {/* Score & Verdict Display */}
        <div className="mt-2 text-center">
          <div className="flex items-baseline justify-center gap-1.5">
            <span className="text-3xl font-extrabold tracking-tight text-white">
              {clampedScore > 0 ? `+${clampedScore}` : clampedScore}
            </span>
            <span className="text-sm font-medium text-slate-400">/ +5.0</span>
          </div>
          <div className="mt-1 flex items-center justify-center gap-2">
            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${verdictColor}`}>
              {verdictText}
            </span>
          </div>
          <p className="mt-2 max-w-xs text-[11px] text-slate-400 leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      {/* Distribution & Pillar Net Impact Breakdown (col 12 -> 7) */}
      <div className="lg:col-span-7 flex flex-col justify-between space-y-5">
        {/* Risk vs Opportunity Ratio Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <TrendingUp className="h-4 w-4" />
              <span>Opportunities: {totalOpportunities} ({oppPercent}%)</span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-400">
              <ShieldAlert className="h-4 w-4" />
              <span>Risks & Threats: {totalRisks} ({riskPercent}%)</span>
            </div>
          </div>

          {/* Dual Segment Progress Bar */}
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-800 p-0.5">
            <div
              style={{ width: `${oppPercent}%` }}
              className="h-full rounded-l-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
              title={`Opportunities: ${oppPercent}%`}
            />
            <div
              style={{ width: `${riskPercent}%` }}
              className="h-full rounded-r-full bg-gradient-to-r from-rose-500 to-red-600 transition-all duration-700"
              title={`Risks: ${riskPercent}%`}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Market Expansion Signals</span>
            <span>Index Favorability: {normalizedIndex}/100</span>
            <span>Regulatory & Market Headwinds</span>
          </div>
        </div>

        {/* 6 Pillar Net Impact Micro Bars */}
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Pillar Net Sentiment Breakdown
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {PILLARS_CONFIG.map((p) => {
              const net = pillarNetScores[p.key] || 0;
              const isPositive = net > 0;
              const isNegative = net < 0;
              
              return (
                <div
                  key={p.key}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5 transition hover:border-slate-700"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-bold ${p.accentColor}`}>
                        {p.letter}
                      </span>
                      <span className="text-xs text-slate-300 font-medium">{p.label}</span>
                    </div>
                    <span
                      className={`text-[11px] font-bold ${
                        isPositive ? 'text-emerald-400' : isNegative ? 'text-rose-400' : 'text-slate-400'
                      }`}
                    >
                      {isPositive ? `+${net}` : net}
                    </span>
                  </div>
                  
                  {/* Visual micro bar */}
                  <div className="mt-2 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                    {isNegative ? (
                      <div
                        className="h-full bg-rose-500 ml-auto rounded-full"
                        style={{ width: `${Math.min(100, Math.abs(net) * 20)}%` }}
                      />
                    ) : (
                      <div
                        className="h-full bg-emerald-500 mr-auto rounded-full"
                        style={{ width: `${Math.min(100, Math.abs(net) * 20)}%` }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
