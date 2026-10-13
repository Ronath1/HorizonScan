"use client";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, Building2, Globe2, LoaderCircle } from "lucide-react";
import { POPULAR_COUNTRIES, POPULAR_INDUSTRIES } from "@/lib/constants";
import type { GuestState } from "@/components/Header";

interface SearchFormProps {
  onSearch: (industry: string, country: string, forceRefresh: boolean) => void;
  isLoading: boolean;
  initialIndustry?: string;
  initialCountry?: string;
  guest?: GuestState | null;
  compact?: boolean;
}

export function SearchForm({
  onSearch,
  isLoading,
  initialIndustry = "",
  initialCountry = "",
  guest,
  compact,
}: SearchFormProps) {
  const [industry, setIndustry] = useState(initialIndustry);
  const [country, setCountry] = useState(initialCountry);
  const [forceRefresh, setForceRefresh] = useState(false);
  useEffect(() => {
    setIndustry(initialIndustry);
    setForceRefresh(false);
  }, [initialIndustry]);
  useEffect(() => {
    setCountry(initialCountry);
    setForceRefresh(false);
  }, [initialCountry]);
  const unavailable = Boolean(
    guest?.blocked || (guest && !guest.scans_enabled),
  );
  const exhausted = Boolean(guest && guest.used >= guest.daily_limit);
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (
      !industry.trim() ||
      !country.trim() ||
      isLoading ||
      unavailable ||
      (forceRefresh && exhausted)
    )
      return;
    onSearch(industry.trim(), country.trim(), forceRefresh);
  };
  return (
    <section
      className="panel scan-panel no-print"
      aria-labelledby="scan-heading"
    >
      <div className="section-heading">
        <div>
          <h2 id="scan-heading">
            {compact
              ? "Explore another market"
              : "Where do you want to explore?"}
          </h2>
          {!compact ? (
            <p>Choose an industry and a country. We’ll connect the dots.</p>
          ) : null}
        </div>
        <span className="tag">PESTLE research</span>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="scan-fields">
          <label className="field" htmlFor="industry">
            Industry
            <div className="input-wrap">
              <Building2 />
              <input
                id="industry"
                className="input"
                list="industry-suggestions"
                value={industry}
                onChange={(event) => setIndustry(event.target.value)}
                maxLength={100}
                placeholder="e.g. Renewable energy"
                required
                disabled={isLoading}
              />
            </div>
          </label>
          <datalist id="industry-suggestions">
            {POPULAR_INDUSTRIES.map((value) => (
              <option key={value} value={value} />
            ))}
          </datalist>
          <label className="field" htmlFor="country">
            Country or region
            <div className="input-wrap">
              <Globe2 />
              <input
                id="country"
                className="input"
                list="country-suggestions"
                value={country}
                onChange={(event) => setCountry(event.target.value)}
                maxLength={80}
                placeholder="e.g. Sri Lanka"
                required
                disabled={isLoading}
              />
            </div>
          </label>
          <datalist id="country-suggestions">
            {POPULAR_COUNTRIES.map((item) => (
              <option key={item.name} value={item.name}>
                {item.region}
              </option>
            ))}
          </datalist>
          <button
            className="button primary scan-submit"
            disabled={
              isLoading ||
              !industry.trim() ||
              !country.trim() ||
              unavailable ||
              (forceRefresh && exhausted)
            }
          >
            {isLoading ? (
              <>
                <LoaderCircle size={15} className="spin" />
                Scanning…
              </>
            ) : (
              <>
                Scan market
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </div>
        <div className="scan-bottom">
          <div className="suggestions">
            <span>Try an industry:</span>
            {POPULAR_INDUSTRIES.slice(0, 3).map((item) => (
              <button
                key={item}
                type="button"
                disabled={isLoading}
                onClick={() => setIndustry(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={forceRefresh}
              disabled={isLoading || exhausted}
              onChange={(event) => setForceRefresh(event.target.checked)}
              aria-describedby="scan-allowance-note"
            />
            Refresh research
          </label>
        </div>
        <p
          id="scan-allowance-note"
          className="muted"
          style={{ fontSize: 10, marginTop: 12 }}
        >
          {guest?.blocked
            ? "Scanning is unavailable for this guest. Sample reports remain available."
            : guest && !guest.scans_enabled
              ? "New scans are temporarily paused. You can still explore sample reports."
              : exhausted
                ? `You’ve used today’s allowance. Saved reports may still be available; fresh research resumes ${new Date(guest!.resets_at).toLocaleString()}.`
                : "Fresh research uses one scan from your daily allowance. Saved reports use none. Refresh requests new research."}
        </p>
      </form>
    </section>
  );
}
