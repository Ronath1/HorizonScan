"use client";
import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";

export function ScanProgressBar({
  industry,
  country,
}: {
  industry: string;
  country: string;
}) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const started = Date.now();
    const timer = setInterval(
      () => setElapsed(Math.floor((Date.now() - started) / 1000)),
      1000,
    );
    return () => clearInterval(timer);
  }, []);
  return (
    <section
      className="panel scan-progress no-print"
      aria-label="Scan progress"
      aria-busy="true"
    >
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <LoaderCircle size={22} className="spin" color="var(--teal)" />
        <div role="status">
          <h2>Researching your market</h2>
          <p>
            {industry} in {country}. Your report will appear here when ready.
          </p>
        </div>
      </div>
      <div className="progress-track" aria-hidden="true">
        <div className="progress-indicator" />
      </div>
      <p>
        <span aria-hidden="true">{elapsed}s elapsed · </span>We collect sources,
        check findings, and calculate scores. This can take about a minute.
        Individual stage progress is unavailable.
      </p>
    </section>
  );
}
