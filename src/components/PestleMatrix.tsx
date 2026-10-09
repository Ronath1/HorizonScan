'use client';

import React, { useState, useMemo } from 'react';
import {
  PestleBreakdown,
  PestleSignal,
  PestlePillarKey,
} from '@/types/pestle';
import { PILLARS_CONFIG } from '@/lib/constants';
import {
  Landmark,
  TrendingUp,
  Users,
  Cpu,
  Scale,
  Leaf,
  ExternalLink,
  ShieldAlert,
  ArrowUpRight,
  Filter,
  Search as SearchIcon,
  HelpCircle,
} from 'lucide-react';

interface PestleMatrixProps {
  pestleBreakdown: PestleBreakdown;
  onSelectSignal: (signal: PestleSignal, pillarName: string) => void;
}

export const PestleMatrix: React.FC<PestleMatrixProps> = ({
  pestleBreakdown,
  onSelectSignal,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'Risk' | 'Opportunity'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Icon mapping helper
  const getPillarIcon = (name: string, className: string) => {
    switch (name) {
      case 'Landmark':
        return <Landmark className={className} />;
      case 'TrendingUp':
        return <TrendingUp className={className} />;
      case 'Users':
        return <Users className={className} />;
      case 'Cpu':
        return <Cpu className={className} />;
      case 'Scale':
        return <Scale className={className} />;
      case 'Leaf':
        return <Leaf className={className} />;
      default:
        return <HelpCircle className={className} />;
    }
  };

  // Helper to extract clean domain from citation URL
  const getDomainFromUrl = (url: string) => {
    try {
      if (!url) return '';
      const parsed = new URL(url);
      return parsed.hostname.replace(/^www\./, '');
    } catch {
      return 'source';
    }
  };

  return (
    <div className="space-y-6">
      {/* Matrix Controls & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/40 p-4 rounded-xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Signal Filter:
          </span>
          <div className="flex items-center rounded-lg bg-slate-950 p-1 border border-slate-800">
            <button
              onClick={() => setFilterType('all')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                filterType === 'all'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Signals
            </button>
            <button
              onClick={() => setFilterType('Opportunity')}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition ${
                filterType === 'Opportunity'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              <ArrowUpRight className="h-3 w-3" />
              Opportunities
            </button>
            <button
              onClick={() => setFilterType('Risk')}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition ${
                filterType === 'Risk'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'text-slate-400 hover:text-rose-400'
              }`}
            >
              <ShieldAlert className="h-3 w-3" />
              Risks
            </button>
          </div>
        </div>

        {/* Search within signals */}
        <div className="relative min-w-[200px]">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search signals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950/80 py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>
      </div>

      {/* 6-Card PESTLE Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PILLARS_CONFIG.map((pillar) => {
          const rawSignals: PestleSignal[] = pestleBreakdown[pillar.key] || [];

          // Filter signals
          const signals = rawSignals.filter((sig) => {
            if (filterType !== 'all' && sig.type !== filterType) return false;
            if (searchQuery.trim()) {
              const q = searchQuery.toLowerCase();
              return (
                sig.title.toLowerCase().includes(q) ||
                sig.detail.toLowerCase().includes(q)
              );
            }
            return true;
          });

          // Pillar stats
          const oppCount = rawSignals.filter((s) => s.type === 'Opportunity').length;
          const riskCount = rawSignals.filter((s) => s.type === 'Risk').length;

          return (
            <div
              key={pillar.key}
              className={`flex flex-col rounded-2xl border ${pillar.borderCol} bg-slate-900/50 backdrop-blur-xl shadow-xl transition-all duration-300 hover:shadow-2xl overflow-hidden print-break-inside-avoid`}
            >
              {/* Card Header */}
              <div className="border-b border-slate-800/80 bg-slate-950/40 p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl font-black text-lg border ${pillar.badgeBg} shadow-inner`}
                    >
                      {pillar.letter}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-white tracking-tight">
                          {pillar.label}
                        </h3>
                        {getPillarIcon(pillar.iconName, `h-4 w-4 ${pillar.accentColor}`)}
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1">
                        {pillar.description}
                      </p>
                    </div>
                  </div>

                  {/* Signal count badge */}
                  <div className="flex items-center gap-1 text-[11px]">
                    <span className="rounded px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                      +{oppCount}
                    </span>
                    <span className="rounded px-1.5 py-0.5 bg-rose-500/10 text-rose-400 font-bold border border-rose-500/20">
                      -{riskCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Signals List */}
              <div className="flex-1 p-4 space-y-3.5 overflow-y-auto max-h-[480px]">
                {signals.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center text-slate-500">
                    <p className="text-xs">No signals matching filter criteria.</p>
                  </div>
                ) : (
                  signals.map((sig, idx) => {
                    const isOpportunity = sig.type === 'Opportunity';
                    const score = sig.impact_score;
                    const domain = getDomainFromUrl(sig.source_url);

                    return (
                      <div
                        key={sig.id || `${pillar.key}_${idx}`}
                        onClick={() => onSelectSignal(sig, pillar.label)}
                        className={`group cursor-pointer rounded-xl border p-3.5 transition-all duration-200 hover:-translate-y-0.5 ${
                          isOpportunity
                            ? 'border-emerald-500/20 bg-emerald-950/10 hover:border-emerald-500/50 hover:bg-emerald-950/20'
                            : 'border-rose-500/20 bg-rose-950/10 hover:border-rose-500/50 hover:bg-rose-950/20'
                        }`}
                      >
                        {/* Badges row: Type & Impact Score */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                              isOpportunity
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            }`}
                          >
                            {isOpportunity ? (
                              <ArrowUpRight className="h-3 w-3" />
                            ) : (
                              <ShieldAlert className="h-3 w-3" />
                            )}
                            {sig.type}
                          </span>

                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-black border ${
                              score >= 0
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            }`}
                            title={`Impact Score: ${score > 0 ? `+${score}` : score} on scale of -5 to +5`}
                          >
                            Impact: {score > 0 ? `+${score}` : score}
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="text-xs font-semibold text-slate-100 group-hover:text-white leading-snug">
                          {sig.title}
                        </h4>

                        {/* Detail text */}
                        <p className="mt-1.5 text-[11px] leading-relaxed text-slate-300">
                          {sig.detail}
                        </p>

                        {/* Citation Link */}
                        {sig.source_url && (
                          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                            <a
                              href={sig.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 hover:underline max-w-[85%] truncate font-mono text-[10px]"
                              title={`Open verified source: ${sig.source_url}`}
                            >
                              <ExternalLink className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{domain}</span>
                            </a>
                            <span className="text-[10px] text-slate-500">Citation</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
