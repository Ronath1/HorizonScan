'use client';

import React, { useState } from 'react';
import { Compass, Key, Printer, Download, Sparkles, BookOpen, FileText, RotateCw } from 'lucide-react';
import { ScanResponseData } from '@/types/pestle';
import { generatePestlePdf } from '@/lib/pdfGenerator';

interface HeaderProps {
  onOpenApiModal: () => void;
  hasCustomKeys: boolean;
  onSelectPreset: (industry: string, country: string) => void;
  currentData: ScanResponseData | null;
  onOpenSourcesDrawer: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenApiModal,
  hasCustomKeys,
  onSelectPreset,
  currentData,
  onOpenSourcesDrawer,
}) => {
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleExportPdf = async () => {
    if (!currentData || isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      await generatePestlePdf(currentData);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      alert('Unable to generate PDF report: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportJson = () => {
    if (!currentData) return;
    const blob = new Blob([JSON.stringify(currentData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `horizonscan_${currentData.industry.toLowerCase().replace(/\s+/g, '_')}_${currentData.target_country.toLowerCase().replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-violet-500 shadow-lg shadow-cyan-500/20 ring-1 ring-white/20">
            <Compass className="h-5 w-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white">
                Horizon<span className="text-cyan-400">Scan</span>
              </span>
              <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-400 border border-cyan-500/30">
                PESTLE AI
              </span>
            </div>
            <p className="hidden text-xs text-slate-400 sm:block">
              Tavily Deep Search &bull; Grounded Macro Risk Intelligence
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Presets Dropdown */}
          <div className="relative group hidden md:block">
            <button className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-700 hover:text-white transition">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Demo Presets</span>
            </button>
            <div className="absolute right-0 mt-1 hidden w-56 rounded-lg border border-slate-800 bg-slate-900/95 p-1.5 shadow-xl backdrop-blur-lg group-hover:block z-50">
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Instant Evaluation Presets
              </div>
              <button
                onClick={() => onSelectPreset('Renewable Energy', 'Germany')}
                className="w-full rounded px-2.5 py-1.5 text-left text-xs text-slate-200 hover:bg-cyan-500/10 hover:text-cyan-300 flex items-center justify-between"
              >
                <span>Renewable Energy</span>
                <span className="text-slate-400">🇩🇪 Germany</span>
              </button>
              <button
                onClick={() => onSelectPreset('Fintech', 'India')}
                className="w-full rounded px-2.5 py-1.5 text-left text-xs text-slate-200 hover:bg-cyan-500/10 hover:text-cyan-300 flex items-center justify-between"
              >
                <span>Fintech Rails</span>
                <span className="text-slate-400">🇮🇳 India</span>
              </button>
              <button
                onClick={() => onSelectPreset('Autonomous Vehicles', 'United States')}
                className="w-full rounded px-2.5 py-1.5 text-left text-xs text-slate-200 hover:bg-cyan-500/10 hover:text-cyan-300 flex items-center justify-between"
              >
                <span>Autonomous Vehicles</span>
                <span className="text-slate-400">🇺🇸 USA</span>
              </button>
            </div>
          </div>

          {/* Sources Grounding Button (if data loaded) */}
          {currentData && currentData.sources && currentData.sources.length > 0 && (
            <button
              onClick={onOpenSourcesDrawer}
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-700 hover:text-cyan-400 transition"
              title="Inspect Raw Tavily Search Grounding Snippets"
            >
              <BookOpen className="h-3.5 w-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Sources</span>
              <span className="rounded-full bg-slate-800 px-1.5 py-0.2 text-[10px] text-slate-400">
                {currentData.sources.length}
              </span>
            </button>
          )}

          {/* Export Colorful PDF Report */}
          {currentData && (
            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-500/60 transition shadow-sm shadow-cyan-500/10 disabled:opacity-50"
              title="Download colorful Executive PESTLE PDF Report"
            >
              {isExportingPdf ? (
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
          )}

          {/* Optional Export JSON */}
          {currentData && (
            <button
              onClick={handleExportJson}
              className="hidden md:flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:border-slate-700 hover:text-white transition"
              title="Export Raw JSON"
            >
              <Download className="h-3.5 w-3.5 text-slate-400" />
              <span>JSON</span>
            </button>
          )}

          {/* Print / Save PDF */}
          {currentData && (
            <button
              onClick={handlePrint}
              className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-700 hover:text-white transition"
              title="Print or Save PDF"
            >
              <Printer className="h-3.5 w-3.5 text-slate-400" />
              <span>Print/PDF</span>
            </button>
          )}

          {/* API Keys Settings */}
          <button
            onClick={onOpenApiModal}
            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              hasCustomKeys
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700 hover:text-white'
            }`}
            title="Configure Tavily & LLM API Keys"
          >
            <Key className="h-3.5 w-3.5 text-cyan-400" />
            <span>API Keys</span>
            <span
              className={`h-2 w-2 rounded-full ${
                hasCustomKeys ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-amber-400/60'
              }`}
            />
          </button>
        </div>
      </div>
    </header>
  );
};
