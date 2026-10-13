"use client";
import { ExternalLink, Info } from "lucide-react";
import { SidePanel } from "@/components/SidePanel";
import { readableDate, signedScore, sourceDomain } from "@/lib/presentation";
import type { PestleSignal, TavilySearchResult } from "@/types/pestle";

export function SignalDetailModal({
  signal,
  pillarName,
  sources,
  isDemo,
  onClose,
}: {
  signal: PestleSignal | null;
  pillarName: string;
  sources: TavilySearchResult[];
  isDemo?: boolean;
  onClose: () => void;
}) {
  if (!signal) return null;
  const primarySource = sources.find(
    (source) => source.url === signal.source_url,
  );
  const primaryDate = readableDate(primarySource?.published_date);
  return (
    <SidePanel title={`${pillarName} · Finding details`} onClose={onClose}>
      <div className="finding-labels">
        <span
          className={`badge ${signal.type === "Risk" ? "risk" : "opportunity"}`}
        >
          {signal.type}
        </span>
        {isDemo ? (
          <span className="badge sample">
            Sample report · historical example
          </span>
        ) : null}
      </div>
      <h3>{signal.title}</h3>
      <div className="impact-panel">
        <div>
          <span>Assessed market impact</span>
          <span>−5 major risk to +5 major opportunity</span>
        </div>
        <strong>{signedScore(signal.impact_score)}</strong>
      </div>
      <section className="detail-section">
        <h4>Why it matters</h4>
        <p>{signal.detail}</p>
      </section>
      <section className="detail-section">
        <h4>Why this impact score?</h4>
        <p>
          {signal.impact_reason ||
            (isDemo
              ? "This historical sample uses illustrative scores. Live reports include an impact rationale."
              : "No impact rationale was supplied for this finding.")}
        </p>
      </section>
      {signal.caveat ? (
        <section className="detail-section">
          <h4>Limitations</h4>
          <p>{signal.caveat}</p>
        </section>
      ) : null}
      <section className="detail-section">
        <h4>Supporting evidence</h4>
        {signal.evidence?.length ? (
          signal.evidence.map((item, index) => {
            const source = sources.find(
              (value) =>
                value.id === item.source_id || value.url === item.source_url,
            );
            const date = readableDate(source?.published_date);
            return (
              <div key={`${item.source_id}-${index}`}>
                <blockquote className="evidence-quote">
                  “{item.quote}”
                </blockquote>
                <a
                  className="source-link"
                  href={item.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {sourceDomain(item.source_url)}
                  <ExternalLink size={12} />
                </a>
                <p style={{ fontSize: 10, marginTop: 5 }}>
                  {date ? `Published ${date}` : "Publication date unavailable"}
                </p>
              </div>
            );
          })
        ) : (
          <p>
            {isDemo
              ? "This sample does not contain validated evidence excerpts. Open the original page to investigate the illustrative claim."
              : "No supporting excerpt is available for this finding."}
          </p>
        )}
      </section>
      {signal.source_url ? (
        <section className="detail-section">
          <h4>Original source</h4>
          <a
            className="source-link"
            href={signal.source_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {primarySource?.title || sourceDomain(signal.source_url)}
            <ExternalLink size={13} style={{ flexShrink: 0 }} />
          </a>
          <p style={{ fontSize: 10, marginTop: 7 }}>
            {primaryDate
              ? `Published ${primaryDate}`
              : "Publication date unavailable"}
          </p>
        </section>
      ) : null}
      <div className="notice" style={{ marginTop: 28 }}>
        <Info size={15} />
        <p>
          {isDemo
            ? "Historical sample. Claims, sources, and scores have not been revalidated."
            : `${signal.evidence_strength === "multiple_sources" ? "Evidence spans multiple source domains." : "Evidence comes from one source domain."} Excerpt matching provides traceability; it does not independently verify the interpretation.`}
        </p>
      </div>
    </SidePanel>
  );
}
