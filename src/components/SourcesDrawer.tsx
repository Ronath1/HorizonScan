'use client';

import React from 'react';
import { TavilySearchResult } from '@/types/pestle';
import { X, ExternalLink, Calendar, Database, CheckCircle2 } from 'lucide-react';

interface SourcesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sources: TavilySearchResult[];
  tavilyQuery: string;
}

export const SourcesDrawer: React.FC<SourcesDrawerProps> = ({
  isOpen,
  onClose,
  sources,
  tavilyQuery,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Tavily Grounding Evidence</h3>
              <p className="text-xs text-slate-400">
                {sources.length} Verified Web Snippets via Tavily Search API
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Query banner */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 font-semibold mb-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Targeted Search Query Executed:</span>
          </div>
          <code className="block rounded bg-slate-950 p-2 text-[11px] text-cyan-300 font-mono border border-slate-800 break-words">
            {tavilyQuery || 'Search query'}
          </code>
        </div>

        {/* Sources List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {sources.map((item, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-2.5 hover:border-slate-700 transition"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-400">
                  Result #{idx + 1}
                </span>
                {item.published_date && (
                  <span className="flex items-center gap-1 text-[11px] text-slate-500">
                    <Calendar className="h-3 w-3" />
                    {item.published_date}
                  </span>
                )}
              </div>

              <h4 className="text-xs sm:text-sm font-semibold text-white leading-snug">
                {item.title}
              </h4>

              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                &ldquo;{item.content}&rdquo;
              </p>

              <div className="pt-1 flex items-center justify-between text-xs">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 hover:underline max-w-[90%] truncate font-mono text-[11px]"
                >
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{item.url}</span>
                </a>
                {item.score && (
                  <span className="text-[10px] text-slate-500 font-mono">
                    Score: {item.score.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
