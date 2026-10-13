"use client";
import { ExternalLink, Info } from "lucide-react";
import type { TavilySearchResult } from "@/types/pestle";
import { readableDate, sourceDomain } from "@/lib/presentation";

export function SourcesContent({
  sources,
  isDemo,
}: {
  sources: TavilySearchResult[];
  isDemo?: boolean;
}) {
  return (
    <div className="report-body">
      <div className="section-heading" style={{ margin: 0 }}>
        <div>
          <h2>Follow the evidence</h2>
          <p>
            {sources.length} source{sources.length === 1 ? "" : "s"} collected
            for this {isDemo ? "sample" : "report"}. Publication dates are shown
            when supplied.
          </p>
        </div>
      </div>
      <div className="notice">
        <Info size={15} />
        <p>
          {isDemo
            ? "These historical sample excerpts have not been revalidated. They illustrate how source material is presented."
            : "Search excerpts may be incomplete or out of date. Open the original pages to check their context and the report’s interpretation."}
        </p>
      </div>
      <div className="sources-list">
        {sources.length ? (
          sources.map((source, index) => (
            <article
              className="panel source-card"
              key={source.id || `${source.url}-${index}`}
            >
              <div className="source-top">
                <span className="tag">
                  Source {index + 1} · {sourceDomain(source.url)}
                </span>
                <span className="source-date">
                  {readableDate(source.published_date) || "Date unavailable"}
                </span>
              </div>
              <h3>{source.title}</h3>
              <blockquote>“{source.content}”</blockquote>
              <a
                className="source-link"
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Read original source
                <ExternalLink size={13} />
              </a>
              {source.retrieved_at ? (
                <p className="source-date" style={{ marginTop: 10 }}>
                  Retrieved{" "}
                  {readableDate(source.retrieved_at) || "date unavailable"}
                </p>
              ) : null}
            </article>
          ))
        ) : (
          <div className="panel empty-state">
            <h3>No sources available</h3>
            <p>This report does not include source excerpts.</p>
          </div>
        )}
      </div>
    </div>
  );
}
