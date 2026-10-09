'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { SearchForm } from '@/components/SearchForm';
import { MacroReadinessGauge } from '@/components/MacroReadinessGauge';
import { ExecutiveSummaryBar } from '@/components/ExecutiveSummaryBar';
import { PestleMatrix } from '@/components/PestleMatrix';
import { SignalDetailModal } from '@/components/SignalDetailModal';
import { SourcesDrawer } from '@/components/SourcesDrawer';
import { ApiKeyModal } from '@/components/ApiKeyModal';
import { ScanProgressBar } from '@/components/ScanProgressBar';
import { ScanResponseData, PestleSignal } from '@/types/pestle';
import { AlertCircle, RotateCw, Compass, Sparkles, Key } from 'lucide-react';
import { getMockPreset } from '@/lib/mockData';

export default function HomePage() {
  const [data, setData] = useState<ScanResponseData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isSourcesDrawerOpen, setIsSourcesDrawerOpen] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState<{
    signal: PestleSignal;
    pillarName: string;
  } | null>(null);
  const [hasCustomKeys, setHasCustomKeys] = useState(false);

  // Search input state tracker
  const [currentSearch, setCurrentSearch] = useState({
    industry: 'Renewable Energy',
    country: 'Germany',
  });

  const checkCustomKeys = useCallback(() => {
    if (typeof window !== 'undefined') {
      const tavily = localStorage.getItem('hs_tavily_api_key');
      const llm = localStorage.getItem('hs_llm_api_key');
      setHasCustomKeys(Boolean(tavily && llm));
    }
  }, []);

  useEffect(() => {
    checkCustomKeys();
    // Load initial showcase preset
    const defaultData = getMockPreset('Renewable Energy', 'Germany');
    if (defaultData) {
      setData(defaultData);
    }
  }, [checkCustomKeys]);

  const executeScan = async (
    targetIndustry: string,
    targetCountry: string,
    forceRefresh: boolean = false
  ) => {
    setIsLoading(true);
    setError(null);
    setCurrentSearch({ industry: targetIndustry, country: targetCountry });

    // 1. Check client-side 24h localStorage cache
    const cacheKey = `hs_cache_${targetIndustry.trim().toLowerCase()}_${targetCountry.trim().toLowerCase()}`;
    if (!forceRefresh && typeof window !== 'undefined') {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          const ageHours = (Date.now() - parsed.savedAt) / (1000 * 60 * 60);
          if (ageHours < 24) {
            setData({
              ...parsed.data,
              cached: true,
            });
            setIsLoading(false);
            return;
          }
        } catch {
          localStorage.removeItem(cacheKey);
        }
      }
    }

    // 2. Fetch from API
    try {
      const tavilyKey = typeof window !== 'undefined' ? localStorage.getItem('hs_tavily_api_key') || undefined : undefined;
      const llmKey = typeof window !== 'undefined' ? localStorage.getItem('hs_llm_api_key') || undefined : undefined;
      const llmProvider = typeof window !== 'undefined' ? (localStorage.getItem('hs_llm_provider') as 'gemini' | 'openai' | 'browser') || 'gemini' : 'gemini';

      // 2. Fetch from backend (Vercel frontend calling Render backend or local Next.js API)
      const backendBaseUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || '').trim().replace(/\/$/, '');
      const scanEndpoint = backendBaseUrl ? `${backendBaseUrl}/api/scan` : '/api/scan';

      const res = await fetch(scanEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industry: targetIndustry,
          target_country: targetCountry,
          tavily_api_key: tavilyKey,
          llm_api_key: llmKey,
          llm_provider: llmProvider,
          force_refresh: forceRefresh,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.error || `Error scanning market: HTTP ${res.status}`);
      }

      // Smooth progress bar completion payoff (500ms at 100%)
      await new Promise((resolve) => setTimeout(resolve, 500));

      setData(json);

      // Save to client 24h cache
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            data: json,
            savedAt: Date.now(),
          })
        );
      }
    } catch (err: unknown) {
      let message = err instanceof Error ? err.message : String(err);
      if (
        message.toLowerCase().includes('failed to fetch') ||
        message.toLowerCase().includes('networkerror') ||
        message.toLowerCase().includes('load failed')
      ) {
        const targetBackend = process.env.NEXT_PUBLIC_BACKEND_URL || 'local server';
        message = `Could not connect to HorizonScan backend at ${targetBackend}. If deploying on Render free-tier, the instance may be spinning up from sleep (~30-50s) or experiencing CORS restrictions. Please wait a moment and retry.`;
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPreset = (presetIndustry: string, presetCountry: string) => {
    executeScan(presetIndustry, presetCountry, false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Navigation Header */}
      <Header
        onOpenApiModal={() => setIsApiKeyModalOpen(true)}
        hasCustomKeys={hasCustomKeys}
        onSelectPreset={handleSelectPreset}
        currentData={data}
        onOpenSourcesDrawer={() => setIsSourcesDrawerOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Hero & Intro */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span>AI Market Intelligence & PESTLE Risk Radar</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Targeted Macro Intelligence <br />
            <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Grounded in Live Web Signals
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400">
            Extract policy, economic, social, tech, legal, and environmental signals via Tavily Search API and classify strategic opportunities & risks with LLM reasoning.
          </p>
        </div>

        {/* Search Control Card */}
        <SearchForm
          onSearch={(ind, ctry, force) => executeScan(ind, ctry, force)}
          isLoading={isLoading}
          initialIndustry={currentSearch.industry}
          initialCountry={currentSearch.country}
        />

        {/* Loading Real-Time Percentage Progress Bar */}
        {isLoading && (
          <ScanProgressBar
            isLoading={isLoading}
            industry={currentSearch.industry}
            country={currentSearch.country}
          />
        )}

        {/* Error Feedback */}
        {error && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-6 backdrop-blur-xl space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-rose-300">Scan Pipeline Notice</h3>
                <p className="text-xs text-rose-200 leading-relaxed">{error}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setIsApiKeyModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-200 border border-rose-500/40 hover:bg-rose-500/30 transition"
              >
                <Key className="h-3.5 w-3.5" />
                <span>Configure API Keys</span>
              </button>
              <button
                onClick={() => handleSelectPreset('Renewable Energy', 'Germany')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition"
              >
                <span>Load Germany Renewable Preset</span>
              </button>
            </div>
          </div>
        )}

        {/* Dashboard Results (when data is present and not loading) */}
        {data && !isLoading && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Executive Summary Bar */}
            <ExecutiveSummaryBar
              data={data}
              onRefresh={() => executeScan(data.industry, data.target_country, true)}
              isRefreshing={isLoading}
            />

            {/* Macro Readiness Gauge */}
            <MacroReadinessGauge
              score={data.overall_sentiment_score}
              pestleBreakdown={data.pestle_breakdown}
            />

            {/* 6-Card PESTLE Matrix */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-white">
                    PESTLE Environmental Matrix
                  </h2>
                  <p className="text-xs text-slate-400">
                    6-pillar macro signals classified by impact magnitude and opportunity type
                  </p>
                </div>
              </div>

              <PestleMatrix
                pestleBreakdown={data.pestle_breakdown}
                onSelectSignal={(signal, pillarName) => setSelectedSignal({ signal, pillarName })}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>HorizonScan &bull; Market Intelligence & Risk Analysis Engine</p>
          <p className="font-mono text-[11px]">
            Powered by Tavily Search API &bull; Gemini Flash &bull; 24h Smart Cache
          </p>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <SignalDetailModal
        signal={selectedSignal?.signal || null}
        pillarName={selectedSignal?.pillarName || ''}
        onClose={() => setSelectedSignal(null)}
      />

      {data && (
        <SourcesDrawer
          isOpen={isSourcesDrawerOpen}
          onClose={() => setIsSourcesDrawerOpen(false)}
          sources={data.sources}
          tavilyQuery={data.tavily_query}
        />
      )}

      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onKeysUpdated={checkCustomKeys}
      />
    </div>
  );
}
