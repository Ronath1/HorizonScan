'use client';

import React, { useState, useEffect } from 'react';
import { Key, X, Check, Shield, ExternalLink, Trash2 } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeysUpdated: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onKeysUpdated,
}) => {
  const [tavilyKey, setTavilyKey] = useState('');
  const [llmKey, setLlmKey] = useState('');
  const [llmProvider, setLlmProvider] = useState<'gemini' | 'openai' | 'browser'>('gemini');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedTavily = localStorage.getItem('hs_tavily_api_key') || '';
      const storedLlm = localStorage.getItem('hs_llm_api_key') || '';
      const storedProvider = (localStorage.getItem('hs_llm_provider') as 'gemini' | 'openai' | 'browser') || 'gemini';
      setTavilyKey(storedTavily);
      setLlmKey(storedLlm);
      setLlmProvider(storedProvider);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      if (tavilyKey.trim()) {
        localStorage.setItem('hs_tavily_api_key', tavilyKey.trim());
      } else {
        localStorage.removeItem('hs_tavily_api_key');
      }

      if (llmKey.trim()) {
        localStorage.setItem('hs_llm_api_key', llmKey.trim());
      } else {
        localStorage.removeItem('hs_llm_api_key');
      }

      localStorage.setItem('hs_llm_provider', llmProvider);
    }

    setSavedSuccess(true);
    onKeysUpdated();
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleClear = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('hs_tavily_api_key');
      localStorage.removeItem('hs_llm_api_key');
      setTavilyKey('');
      setLlmKey('');
    }
    onKeysUpdated();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Key className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">API Key Configuration</h3>
              <p className="text-[11px] text-slate-400">Stored locally in your browser</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Info callout */}
        <div className="flex items-start gap-2.5 rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs text-slate-300">
          <Shield className="h-4 w-4 text-cyan-400 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            HorizonScan queries Tavily for market intelligence and uses an LLM to classify PESTLE pillars. You can also configure keys in a server <code className="text-cyan-300">.env.local</code> file.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4">
          {/* Tavily Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Tavily API Key
              </label>
              <a
                href="https://tavily.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:underline"
              >
                <span>Get key</span>
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
            <input
              type="password"
              value={tavilyKey}
              onChange={(e) => setTavilyKey(e.target.value)}
              placeholder="tvly-..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* LLM Provider Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              AI Analysis Engine
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setLlmProvider('gemini')}
                className={`rounded-xl border p-2 text-[11px] font-medium text-center transition ${
                  llmProvider === 'gemini'
                    ? 'border-cyan-500 bg-cyan-500/15 text-cyan-300 font-semibold'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                Gemini Flash
              </button>
              <button
                type="button"
                onClick={() => setLlmProvider('browser')}
                className={`rounded-xl border p-2 text-[11px] font-medium text-center transition ${
                  llmProvider === 'browser'
                    ? 'border-cyan-500 bg-cyan-500/15 text-cyan-300 font-semibold'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                Playwright Browser
              </button>
              <button
                type="button"
                onClick={() => setLlmProvider('openai')}
                className={`rounded-xl border p-2 text-[11px] font-medium text-center transition ${
                  llmProvider === 'openai'
                    ? 'border-cyan-500 bg-cyan-500/15 text-cyan-300 font-semibold'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                GPT-4o-mini
              </button>
            </div>
          </div>

          {/* Conditional Input based on provider */}
          {llmProvider === 'browser' ? (
            <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-3 space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                <span>🤖 Playwright Browser Automation Active</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-300">
                Queries will be automated via Chromium using your authenticated browser session. No LLM API key required.
              </p>
              <div className="rounded bg-slate-950 p-2 font-mono text-[10px] text-cyan-400 border border-slate-800">
                To capture session: npm run ai:auth
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  {llmProvider === 'gemini' ? 'Gemini API Key' : 'OpenAI API Key'}
                </label>
                <a
                  href={
                    llmProvider === 'gemini'
                      ? 'https://aistudio.google.com'
                      : 'https://platform.openai.com'
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:underline"
                >
                  <span>Get key</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>
              <input
                type="password"
                value={llmKey}
                onChange={(e) => setLlmKey(e.target.value)}
                placeholder={llmProvider === 'gemini' ? 'AIzaSy...' : 'sk-...'}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear Keys</span>
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 transition"
            >
              {savedSuccess ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Keys</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
