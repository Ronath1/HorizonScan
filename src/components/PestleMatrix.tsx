"use client";
import { useState } from "react";
import { ArrowRight, ExternalLink, Search } from "lucide-react";
import { PILLARS_CONFIG } from "@/lib/constants";
import {
  readableDate,
  reportFindings,
  signedScore,
  sourceDomain,
} from "@/lib/presentation";
import type {
  PestleBreakdown,
  PestlePillarKey,
  PestleSignal,
  TavilySearchResult,
} from "@/types/pestle";

export function PestleMatrix({
  pestleBreakdown,
  sources,
  onSelectSignal,
  initialCategory = "all",
  isDemo,
}: {
  pestleBreakdown: PestleBreakdown;
  sources: TavilySearchResult[];
  onSelectSignal: (signal: PestleSignal, pillarName: string) => void;
  initialCategory?: PestlePillarKey | "all";
  isDemo?: boolean;
}) {
  const [category, setCategory] = useState<PestlePillarKey | "all">(
    initialCategory,
  );
  const [type, setType] = useState<"all" | "Opportunity" | "Risk">("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("impact");
  const all = reportFindings(pestleBreakdown);
  const findings = all.filter(
    ({ signal, pillar }) =>
      (category === "all" || pillar.key === category) &&
      (type === "all" || signal.type === type) &&
      `${signal.title} ${signal.detail}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  if (sort === "impact")
    findings.sort(
      (a, b) =>
        Math.abs(b.signal.impact_score) - Math.abs(a.signal.impact_score),
    );
  const reset = () => {
    setCategory("all");
    setType("all");
    setQuery("");
  };
  return (
    <div className="report-body">
      <div className="panel filters-panel no-print">
        <div className="filter-row">
          <div className="segmented" aria-label="Finding type">
            {(["all", "Opportunity", "Risk"] as const).map((value) => (
              <button
                key={value}
                className="filter-chip"
                aria-pressed={type === value}
                onClick={() => setType(value)}
              >
                {value === "all"
                  ? "All findings"
                  : value === "Risk"
                    ? "Risks"
                    : "Opportunities"}
              </button>
            ))}
          </div>
          <p className="findings-count" role="status">
            {findings.length} of {all.length} findings
          </p>
        </div>
        <div className="segmented" aria-label="PESTLE category">
          <button
            className="filter-chip"
            aria-pressed={category === "all"}
            onClick={() => setCategory("all")}
          >
            All categories
          </button>
          {PILLARS_CONFIG.map((pillar) => (
            <button
              key={pillar.key}
              className="filter-chip"
              aria-pressed={category === pillar.key}
              onClick={() => setCategory(pillar.key)}
            >
              {pillar.label}
            </button>
          ))}
        </div>
        <div className="findings-tools">
          <div className="input-wrap">
            <Search />
            <input
              className="input"
              aria-label="Search findings"
              placeholder="Search within this report…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <select
            className="select"
            aria-label="Sort findings"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option value="impact">Highest impact first</option>
            <option value="category">Group by category</option>
          </select>
        </div>
      </div>
      <div className="findings-list">
        {findings.length ? (
          findings.map(({ signal, pillar, key }) => {
            const source = sources.find(
              (item) => item.url === signal.source_url,
            );
            const date = readableDate(source?.published_date);
            return (
              <article className="panel finding-card" key={key}>
                <div>
                  <div className="finding-labels">
                    <span
                      className={`badge ${signal.type === "Risk" ? "risk" : "opportunity"}`}
                    >
                      {signal.type}
                    </span>
                    <span className="muted" style={{ fontSize: 10 }}>
                      {pillar.label}
                    </span>
                    {isDemo ? (
                      <span className="badge sample">Sample</span>
                    ) : null}
                  </div>
                  <h3>
                    <button
                      className="finding-title"
                      onClick={() => onSelectSignal(signal, pillar.label)}
                    >
                      {signal.title}
                    </button>
                  </h3>
                  <p>{signal.detail}</p>
                  <div className="finding-footer">
                    {signal.source_url ? (
                      <a
                        href={signal.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {sourceDomain(signal.source_url)}
                        <ExternalLink size={10} />
                      </a>
                    ) : (
                      <span>No source page available</span>
                    )}
                    <span>
                      {date
                        ? `Published ${date}`
                        : "Publication date unavailable"}
                    </span>
                    <span>
                      {isDemo
                        ? "Illustrative finding"
                        : signal.evidence_strength === "multiple_sources"
                          ? "Multiple source domains"
                          : "Single source domain"}
                    </span>
                  </div>
                </div>
                <div className="finding-side">
                  <strong>{signedScore(signal.impact_score)}</strong>
                  <span>Assessed impact</span>
                  <button
                    className="text-button"
                    onClick={() => onSelectSignal(signal, pillar.label)}
                    aria-label={`View evidence: ${signal.title}`}
                  >
                    Evidence
                    <ArrowRight size={12} />
                  </button>
                </div>
              </article>
            );
          })
        ) : (
          <div className="panel empty-state">
            <h3>No matching findings</h3>
            <p>
              {all.length
                ? "Try another category, search term, or finding type."
                : "There are no supported findings in this report. Missing evidence is not a neutral result."}
            </p>
            {all.length ? (
              <button className="button" onClick={reset}>
                Clear filters
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
