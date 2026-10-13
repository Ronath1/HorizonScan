"use client";
import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Download,
  FileText,
  Info,
  Printer,
  RotateCw,
  ShieldAlert,
} from "lucide-react";
import { ExecutiveSummaryBar } from "@/components/ExecutiveSummaryBar";
import { MacroReadinessGauge } from "@/components/MacroReadinessGauge";
import { PestleMatrix } from "@/components/PestleMatrix";
import { SourcesContent } from "@/components/SourcesDrawer";
import { WorkspaceTabs } from "@/components/WorkspaceTabs";
import { PILLARS_CONFIG } from "@/lib/constants";
import { readableDate, reportFindings, signedScore } from "@/lib/presentation";
import type {
  PestlePillarKey,
  PestleSignal,
  ScanResponseData,
} from "@/types/pestle";

type ReportTab = "overview" | "findings" | "sources" | "methodology";

export function ReportWorkspace({
  data,
  onRefresh,
  onSelectSignal,
  busy,
  refreshDisabled,
}: {
  data: ScanResponseData;
  onRefresh: () => void;
  onSelectSignal: (signal: PestleSignal, pillarName: string) => void;
  busy: boolean;
  refreshDisabled: boolean;
}) {
  const [tab, setTab] = useState<ReportTab>("overview");
  const [category, setCategory] = useState<PestlePillarKey | "all">("all");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const findings = reportFindings(data.pestle_breakdown);
  const isDemo = data.data_mode === "demo";
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "findings", label: "PESTLE findings", count: findings.length },
    { id: "sources", label: "Sources", count: data.sources.length },
    { id: "methodology", label: "Methodology" },
  ] as const;
  const exportPdf = async () => {
    setExporting(true);
    setExportError("");
    try {
      const { generatePestlePdf } = await import("@/lib/pdfGenerator");
      await generatePestlePdf(data);
    } catch {
      setExportError(
        "The PDF could not be created. Try again or use Print report.",
      );
    } finally {
      setExporting(false);
    }
  };
  const exportJson = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `HorizonScan_${data.industry.replace(/[^a-z0-9]/gi, "_")}_${data.target_country.replace(/[^a-z0-9]/gi, "_")}.json`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const openCategory = (key: PestlePillarKey) => {
    setCategory(key);
    setTab("findings");
  };
  const priority = (type: "Risk" | "Opportunity") =>
    findings
      .filter((item) => item.signal.type === type)
      .sort(
        (a, b) =>
          Math.abs(b.signal.impact_score) - Math.abs(a.signal.impact_score),
      )
      .slice(0, 2);
  return (
    <section
      className="report-workspace"
      id="report"
      aria-labelledby="report-heading"
    >
      <div className="report-topline">
        <div>
          <p className="eyebrow">Market research report</p>
          <h1 className="report-title" id="report-heading">
            {data.industry} <span style={{ color: "#78867b" }}>in</span>{" "}
            {data.target_country}
          </h1>
          <div className="report-meta">
            <time dateTime={data.timestamp}>
              <CalendarDays size={12} />
              {readableDate(data.timestamp)}
            </time>
            <span className={`badge ${isDemo || data.stale ? "sample" : ""}`}>
              {isDemo
                ? "Sample report · not live research"
                : data.stale
                  ? "Older report · refresh failed"
                  : data.cached
                    ? "Saved research · 24h cache"
                    : "Fresh research"}
            </span>
          </div>
        </div>
        <div className="report-actions no-print">
          <button className="button" onClick={exportPdf} disabled={exporting}>
            {exporting ? (
              <RotateCw size={14} className="spin" />
            ) : (
              <FileText size={14} />
            )}{" "}
            {exporting ? "Creating PDF…" : "Export PDF"}
          </button>
          <button
            className="button"
            onClick={onRefresh}
            disabled={busy || refreshDisabled}
            aria-describedby="refresh-note"
          >
            <RotateCw size={13} />
            Refresh research
          </button>
        </div>
      </div>
      <p
        id="refresh-note"
        className="muted no-print"
        style={{ fontSize: 14, marginTop: 12 }}
      >
        Refresh runs fresh research and uses one scan.{" "}
        {refreshDisabled
          ? "Fresh scanning is currently unavailable for this guest."
          : isDemo
            ? "You can scan this market to replace the sample with live research."
            : ""}
      </p>
      {exportError ? (
        <div className="notice error" role="alert" style={{ marginTop: 15 }}>
          {exportError}
        </div>
      ) : null}
      <WorkspaceTabs
        tabs={tabs}
        active={tab}
        onChange={setTab}
        label="Report sections"
        prefix="report"
      />
      {data.warnings?.length ? (
        <div className="notice report-warning">
          <Info size={15} />
          <div>
            {data.warnings.map((warning, index) => (
              <p key={index}>{warning}</p>
            ))}
          </div>
        </div>
      ) : null}
      <div
        role="tabpanel"
        id={`report-panel-${tab}`}
        aria-labelledby={`report-tab-${tab}`}
        tabIndex={0}
      >
        {tab === "overview" ? (
          <div className="report-body">
            <ExecutiveSummaryBar data={data} />
            <MacroReadinessGauge
              data={data}
              onMethodology={() => setTab("methodology")}
              onSources={() => setTab("sources")}
            />
            <div className="priority-grid">
              {(["Opportunity", "Risk"] as const).map((type) => (
                <section className="panel priority-panel" key={type}>
                  <h2>
                    {type === "Risk" ? (
                      <ShieldAlert size={16} color="#a05245" />
                    ) : (
                      <ArrowUpRight size={16} color="#396c4b" />
                    )}
                    {type === "Risk"
                      ? "Risks to watch"
                      : "Leading opportunities"}
                  </h2>
                  {priority(type).length ? (
                    priority(type).map(({ signal, pillar, key }) => (
                      <button
                        key={key}
                        className="priority-finding"
                        onClick={() => onSelectSignal(signal, pillar.label)}
                      >
                        <div>
                          <strong>{signal.title}</strong>
                          <span>
                            {pillar.label} · Impact{" "}
                            {signedScore(signal.impact_score)}
                          </span>
                        </div>
                        <ArrowUpRight size={15} />
                      </button>
                    ))
                  ) : (
                    <p
                      className="muted"
                      style={{ fontSize: 16, marginTop: 16 }}
                    >
                      No supported {type.toLowerCase()} findings in this report.
                    </p>
                  )}
                </section>
              ))}
            </div>
            <section className="panel pillar-coverage">
              <div className="section-heading">
                <div>
                  <h2>Six perspectives. One market.</h2>
                  <p>
                    Explore what each PESTLE category contributes to the report.
                  </p>
                </div>
              </div>
              <div className="pillar-grid">
                {PILLARS_CONFIG.map((pillar) => {
                  const signals = data.pestle_breakdown[pillar.key];
                  const score = data.scoring?.pillar_scores[pillar.key];
                  return (
                    <button
                      key={pillar.key}
                      className="pillar-cell"
                      onClick={() => openCategory(pillar.key)}
                    >
                      <strong>{pillar.label}</strong>
                      <span>
                        {signals.length} finding
                        {signals.length === 1 ? "" : "s"}
                      </span>
                      <b>
                        {score !== null && score !== undefined
                          ? signedScore(score)
                          : signals.length
                            ? "View findings →"
                            : "Unscored"}
                      </b>
                    </button>
                  );
                })}
              </div>
              <button
                className="text-button"
                onClick={() => {
                  setCategory("all");
                  setTab("findings");
                }}
                style={{ marginTop: 20 }}
              >
                Explore all findings <ArrowRight size={13} />
              </button>
            </section>
          </div>
        ) : null}
        {tab === "findings" ? (
          <PestleMatrix
            key={category}
            pestleBreakdown={data.pestle_breakdown}
            sources={data.sources}
            initialCategory={category}
            isDemo={isDemo}
            onSelectSignal={onSelectSignal}
          />
        ) : null}
        {tab === "sources" ? (
          <SourcesContent sources={data.sources} isDemo={isDemo} />
        ) : null}
        {tab === "methodology" ? (
          <div className="methodology">
            <article className="panel">
              <h2>How this research is produced</h2>
              <p>
                {isDemo
                  ? "This report is a historical, illustrative sample. Its claims and source excerpts have not been revalidated, and its scores are examples rather than outputs of the current scoring method."
                  : "A targeted web search collects source excerpts for the selected industry and country. Gemini proposes findings, and the backend validates their structure, source references, and quoted text. Unsupported findings are discarded."}
              </p>
              <p>
                PESTLE covers Political, Economic, Social, Technological, Legal,
                and Environmental factors. A missing category means insufficient
                evidence was found; it does not mean there is no risk.
              </p>
              <p>
                Evidence matching helps you trace a finding to an excerpt. It
                does not establish that a source is correct, current, or
                independently corroborated.
              </p>
            </article>
            <article className="panel">
              <h2>How scores are calculated</h2>
              <p>
                {data.scoring?.method ||
                  (isDemo
                    ? "Historical sample scores are illustrative and may not follow the current backend calculation."
                    : "The backend averages finding impacts within each category, then gives each of the six categories equal weight. The overall score is withheld if any category lacks supported findings.")}
              </p>
              <p>
                Gemini assesses impact magnitude. The backend makes risks
                negative and opportunities positive. The result describes
                favorability in the collected findings; it is not a probability,
                forecast, or investment recommendation.
              </p>
              <div className="rubric">
                {[
                  "Minor / local",
                  "Limited",
                  "Material sector impact",
                  "Major sector impact",
                  "Transformative",
                ].map((description, index) => (
                  <div key={description}>
                    <b>{index + 1}</b>
                    <span>{description}</span>
                  </div>
                ))}
              </div>
              {data.scoring?.rubric ? <p>{data.scoring.rubric}</p> : null}
              <p>
                Research coverage counts categories with findings. Source
                coverage describes the number of domains cited. Neither is a
                confidence percentage.
              </p>
            </article>
            <article className="panel">
              <h2>Report details</h2>
              <p>
                Research date: {readableDate(data.timestamp)} · Dates shown in
                UTC.
              </p>
              <p>
                {isDemo
                  ? "Mode: historical sample"
                  : `Analysis model: ${data.model_used || "Not supplied"}`}
                {data.execution_time_ms
                  ? ` · Completed in ${(data.execution_time_ms / 1000).toFixed(1)} seconds`
                  : ""}
              </p>
              {data.scoring ? (
                <p>Scoring method version: {data.scoring.version}</p>
              ) : null}
              <details>
                <summary>View the research query</summary>
                <code>{data.tavily_query || "No query supplied."}</code>
              </details>
              <div
                className="report-actions no-print"
                style={{ marginTop: 20 }}
              >
                <button className="button" onClick={exportJson}>
                  <Download size={14} />
                  Download report data
                </button>
                <button className="button" onClick={() => window.print()}>
                  <Printer size={14} />
                  Print current view
                </button>
              </div>
            </article>
          </div>
        ) : null}
      </div>
    </section>
  );
}
