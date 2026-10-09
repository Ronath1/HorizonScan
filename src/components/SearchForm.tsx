'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Globe, RotateCw, Sparkles, ChevronDown } from 'lucide-react';
import { POPULAR_INDUSTRIES, POPULAR_COUNTRIES } from '@/lib/constants';

interface SearchFormProps {
  onSearch: (industry: string, country: string, forceRefresh: boolean) => void;
  isLoading: boolean;
  initialIndustry?: string;
  initialCountry?: string;
}

export const SearchForm: React.FC<SearchFormProps> = ({
  onSearch,
  isLoading,
  initialIndustry = '',
  initialCountry = '',
}) => {
  const [industry, setIndustry] = useState(initialIndustry);
  const [country, setCountry] = useState(initialCountry);
  const [forceRefresh, setForceRefresh] = useState(false);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialIndustry) setIndustry(initialIndustry);
  }, [initialIndustry]);

  useEffect(() => {
    if (initialCountry) setCountry(initialCountry);
  }, [initialCountry]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCountryDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!industry.trim() || !country.trim() || isLoading) return;
    setIsCountryDropdownOpen(false);
    onSearch(industry.trim(), country.trim(), forceRefresh);
  };

  const handleSelectCountry = (countryName: string) => {
    setCountry(countryName);
    setIsCountryDropdownOpen(false);
  };

  const filteredCountries = POPULAR_COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(country.toLowerCase())
  );

  return (
    <div className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-2xl backdrop-blur-xl sm:p-7">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          {/* Industry Input */}
          <div className="md:col-span-6 space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Target Industry
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Search className="h-4 w-4 text-cyan-400" />
              </div>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="e.g. Renewable Energy, Fintech, MedTech..."
                disabled={isLoading}
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/70 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 shadow-inner focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition disabled:opacity-50"
              />
            </div>
          </div>

          {/* Country / Region Autocomplete */}
          <div className="md:col-span-4 space-y-1.5 relative" ref={dropdownRef}>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Country / Region
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Globe className="h-4 w-4 text-emerald-400" />
              </div>
              <input
                type="text"
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                  setIsCountryDropdownOpen(true);
                }}
                onFocus={() => setIsCountryDropdownOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    setIsCountryDropdownOpen(false);
                    handleSubmit(e);
                  }
                }}
                placeholder="e.g. Sri Lanka, Germany, India..."
                disabled={isLoading}
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/70 py-3 pl-10 pr-9 text-sm text-white placeholder-slate-500 shadow-inner focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-white"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            {/* Country Autocomplete Dropdown */}
            {isCountryDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 max-h-56 overflow-y-auto rounded-xl border border-slate-700/80 bg-slate-900 p-1.5 shadow-2xl backdrop-blur-xl z-50">
                {filteredCountries.length > 0 ? (
                  filteredCountries.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => handleSelectCountry(c.name)}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs text-slate-200 hover:bg-cyan-500/10 hover:text-cyan-300 transition"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{c.flag}</span>
                        <span className="font-medium">{c.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">{c.region}</span>
                    </button>
                  ))
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsCountryDropdownOpen(false)}
                    className="w-full text-left px-3 py-2 text-xs text-cyan-300 hover:bg-cyan-500/10 rounded-lg"
                  >
                    Use &quot;{country}&quot; as target country
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="md:col-span-2 flex flex-col justify-end">
            <button
              type="submit"
              disabled={isLoading || !industry.trim() || !country.trim()}
              className="flex h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-violet-600 px-5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RotateCw className="h-4 w-4 animate-spin text-white" />
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Scan Market</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Suggestion Chips & Force Refresh Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5 text-slate-400">
            <span className="text-slate-400 text-[11px] font-medium mr-1">Trending:</span>
            {POPULAR_INDUSTRIES.slice(0, 5).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setIndustry(item)}
                className="rounded-lg border border-slate-800 bg-slate-950/60 px-2.5 py-1 text-[11px] text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300 hover:bg-slate-850 transition"
              >
                {item}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-300">
            <input
              type="checkbox"
              checked={forceRefresh}
              onChange={(e) => setForceRefresh(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-0 focus:ring-offset-0"
            />
            <span className="text-[11px]">Bypass 24h cache (Force live Tavily call)</span>
          </label>
        </div>
      </form>
    </div>
  );
};
