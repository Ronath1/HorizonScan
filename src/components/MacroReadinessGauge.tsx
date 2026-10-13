"use client";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  ChartNoAxesCombined,
} from "lucide-react";
import type { ScanResponseData } from "@/types/pestle";
import { reportFindings, signedScore } from "@/lib/presentation";

export function MacroReadinessGauge({
  data,
  onMethodology,
  onSources,
}: {
  data: ScanResponseData;
  onMethodology: () => void;
  onSources: () => void;
}) {
  const findings = reportFindings(data.pestle_breakdown);
  const score = data.overall_sentiment_score;
  const coverage =
    data.scoring?.covered_pillars ??
    new Set(findings.map((item) => item.pillar.key)).size;
  const opportunities = findings.filter(
    (item) => item.signal.type === "Opportunity",
  ).length;
  const outlook =
    score === null
      ? "Insufficient coverage"
      : score >= 1
        ? "Leans toward opportunity"
        : score <= -1
          ? "Leans toward risk"
          : "Mixed market signals";
  return (
    <section className="metrics-grid" aria-label="Report measures">
      <article className="panel metric">
        <div className="metric-label">
          Market favorability
          <ChartNoAxesCombined size={15} />
        </div>
        <p className="metric-value">
          {score === null ? "Unscored" : signedScore(score)}{" "}
          {score !== null ? <small>/ +5</small> : null}
        </p>
        <p className="metric-caption">{outlook}</p>
        {score !== null ? (
          <>
            <div className="score-track" aria-hidden="true">
              <span
                className="score-marker"
                style={{
                  left: `${Math.max(1, Math.min(99, (score + 5) * 10))}%`,
                }}
              />
            </div>
            <div className="score-labels">
              <span>−5 Risk</span>
              <span>+5 Opportunity</span>
            </div>
          </>
        ) : (
          <p className="metric-caption" style={{ marginTop: 9 }}>
            All six categories need evidence for an overall score.
          </p>
        )}
        <button className="text-button metric-link" onClick={onMethodology}>
          How scoring works <ArrowRight size={12} />
        </button>
      </article>
      <article className="panel metric">
        <div className="metric-label">
          Findings identified
          <ArrowUpRight size={15} />
        </div>
        <p className="metric-value">
          {findings.length} <small>findings</small>
        </p>
        <p className="metric-caption">
          {opportunities} opportunities · {findings.length - opportunities}{" "}
          risks
        </p>
        <p className="metric-caption" style={{ marginTop: 15 }}>
          Ranked by assessed impact, with evidence available for inspection.
        </p>
      </article>
      <article className="panel metric">
        <div className="metric-label">
          Research coverage
          <BookOpen size={15} />
        </div>
        <p className="metric-value">
          {coverage} <small>/ 6 categories</small>
        </p>
        <p className="metric-caption">
          {data.sources.length} source{data.sources.length === 1 ? "" : "s"}{" "}
          collected{data.data_mode === "demo" ? " in this sample" : ""}
        </p>
        <p className="metric-caption" style={{ marginTop: 15 }}>
          Coverage indicates available evidence, not certainty.
        </p>
        <button className="text-button metric-link" onClick={onSources}>
          Inspect sources <ArrowRight size={12} />
        </button>
      </article>
    </section>
  );
}
