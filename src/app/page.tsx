"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, RotateCw } from "lucide-react";
import { Header, type GuestState } from "@/components/Header";
import { SearchForm } from "@/components/SearchForm";
import {
  MarketHero,
  MarketExamples,
  HowItWorks,
} from "@/components/MarketIntro";
import { ReportWorkspace } from "@/components/ReportWorkspace";
import { SignalDetailModal } from "@/components/SignalDetailModal";
import { ScanProgressBar } from "@/components/ScanProgressBar";
import type { ScanResponseData, PestleSignal } from "@/types/pestle";

type Search = { industry: string; country: string; forceRefresh: boolean };

export default function HomePage() {
  const [data, setData] = useState<ScanResponseData | null>(null);
  const [guest, setGuest] = useState<GuestState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSignal, setSelectedSignal] = useState<{
    signal: PestleSignal;
    pillarName: string;
  } | null>(null);
  const [currentSearch, setCurrentSearch] = useState<Search>({
    industry: "",
    country: "",
    forceRefresh: false,
  });
  const [reportVersion, setReportVersion] = useState(0);
  const requestPending = useRef(false);
  const reportFocusPending = useRef(false);
  const refreshGuest = useCallback(async () => {
    try {
      const response = await fetch("/api/guest", { cache: "no-store" });
      if (response.ok) {
        const value = await response.json();
        if (value.guest_id) setGuest(value);
      }
    } catch {
      /* The scan API still enforces limits when allowance status is unavailable. */
    }
  }, []);
  useEffect(() => {
    try {
      for (const key of Object.keys(localStorage))
        if (
          ["hs_tavily_api_key", "hs_llm_api_key", "hs_llm_provider"].includes(
            key,
          ) ||
          key.startsWith("hs_cache_")
        )
          localStorage.removeItem(key);
    } catch {
      /* Storage may be disabled. */
    }
    void refreshGuest();
    const onFocus = () => {
      void refreshGuest();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshGuest]);
  useEffect(() => {
    if (!reportFocusPending.current) return;
    reportFocusPending.current = false;
    const heading = document.getElementById("report-heading");
    heading?.setAttribute("tabindex", "-1");
    heading?.focus({ preventScroll: true });
    document
      .getElementById("report")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [reportVersion]);

  const executeScan = async (
    industry: string,
    country: string,
    forceRefresh = false,
  ) => {
    if (requestPending.current) return;
    requestPending.current = true;
    setIsLoading(true);
    setError(null);
    setCurrentSearch({ industry, country, forceRefresh });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90000);
    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industry,
          target_country: country,
          force_refresh: forceRefresh,
        }),
        signal: controller.signal,
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(json.error || `Scan failed (${response.status}).`);
      if (!json.pestle_breakdown || !Array.isArray(json.sources))
        throw new Error("An incomplete report was returned. Please try again.");
      setData(json as ScanResponseData);
      reportFocusPending.current = true;
      setReportVersion((value) => value + 1);
    } catch (err) {
      setError(
        err instanceof Error && err.name === "AbortError"
          ? "The request timed out. Please wait before retrying; research may still be finishing."
          : err instanceof Error
            ? err.message
            : "Scan failed. Please try again.",
      );
    } finally {
      clearTimeout(timeout);
      requestPending.current = false;
      setIsLoading(false);
      void refreshGuest();
    }
  };
  const selectDemo = async (industry: string, country: string) => {
    if (requestPending.current) return;
    const { getMockPreset } = await import("@/lib/mockData");
    if (requestPending.current) return;
    const sample = getMockPreset(industry, country);
    if (sample) {
      setData(sample);
      setCurrentSearch({ industry, country, forceRefresh: false });
      setError(null);
      reportFocusPending.current = true;
      setReportVersion((value) => value + 1);
    }
  };
  const newScan = () => {
    if (requestPending.current) return;
    setData(null);
    setSelectedSignal(null);
    setError(null);
    setCurrentSearch({ industry: "", country: "", forceRefresh: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const refreshDisabled = Boolean(
    guest &&
      (guest.blocked ||
        !guest.scans_enabled ||
        guest.used >= guest.daily_limit),
  );
  return (
    <div className="app-shell">
      <Header
        guest={guest}
        hasReport={Boolean(data)}
        onNewScan={newScan}
        onSample={() => {
          void selectDemo("Renewable Energy", "Germany");
        }}
      />
      <div className="main-shell">
        <main className="content" id="main-content">
          {data ? (
            <div className="no-print" style={{ marginBottom: 20 }}>
              <button
                className="text-button"
                onClick={newScan}
                disabled={isLoading}
              >
                <ArrowLeft size={13} />
                Start a new scan
              </button>
            </div>
          ) : (
            <MarketHero />
          )}
          <SearchForm
            onSearch={executeScan}
            isLoading={isLoading}
            initialIndustry={currentSearch.industry}
            initialCountry={currentSearch.country}
            guest={guest}
            compact={Boolean(data)}
          />
          {isLoading ? (
            <ScanProgressBar
              industry={currentSearch.industry}
              country={currentSearch.country}
            />
          ) : null}
          {error ? (
            <div
              className="notice error no-print"
              role="alert"
              style={{ marginTop: 20 }}
            >
              <AlertCircle size={17} />
              <div>
                <strong>We couldn’t complete this scan.</strong>
                <p>{error}</p>
                <p>
                  {data
                    ? "The report below is your previous report; it has not been updated by this scan."
                    : "You can explore a sample report while scanning is unavailable."}
                </p>
                <button
                  className="text-button"
                  disabled={isLoading}
                  onClick={() => {
                    void executeScan(
                      currentSearch.industry,
                      currentSearch.country,
                      currentSearch.forceRefresh,
                    );
                  }}
                >
                  <RotateCw size={12} />
                  Retry scan
                </button>
              </div>
            </div>
          ) : null}
          {data ? (
            <ReportWorkspace
              key={reportVersion}
              data={data}
              onRefresh={() => {
                void executeScan(data.industry, data.target_country, true);
              }}
              busy={isLoading}
              refreshDisabled={refreshDisabled}
              onSelectSignal={(signal, pillarName) =>
                setSelectedSignal({ signal, pillarName })
              }
            />
          ) : (
            <>
              <MarketExamples
                onSelect={(industry, country) => {
                  void selectDemo(industry, country);
                }}
                disabled={isLoading}
              />
              <HowItWorks />
            </>
          )}
          <footer className="site-footer">
            <span>
              HorizonScan · A wider perspective, grounded in evidence.
            </span>
            <span>
              Research support for your own assessment.{" "}
              <Link href="/admin">Admin</Link>
            </span>
          </footer>
        </main>
      </div>
      {selectedSignal && data ? (
        <SignalDetailModal
          signal={selectedSignal.signal}
          pillarName={selectedSignal.pillarName}
          sources={data.sources}
          isDemo={data.data_mode === "demo"}
          onClose={() => setSelectedSignal(null)}
        />
      ) : null}
    </div>
  );
}
