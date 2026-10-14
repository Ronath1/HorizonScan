import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { loadEnvConfig } from "@next/env";
import { normalizeText } from "../src/lib/backend/evidence";
import { calculateScores, overallScore } from "../src/lib/backend/scoring";
import { getStore } from "../src/lib/backend/store";
import { estimateCost, LIMITS } from "../src/lib/backend/config";
import type { ScanResponseData } from "../src/types/pestle";

loadEnvConfig(process.cwd());

// Explicit live test: one fresh search/AI request, followed by cache and
// invalid-input checks. No retries or model fallback. Credentials stay local.
async function main() {
  assert.ok(process.env.GEMINI_API_KEY?.trim(), "GEMINI_API_KEY is missing");
  const base = new URL(
    process.env.HORIZONSCAN_TEST_URL || "http://localhost:3000",
  );
  assert.ok(
    ["localhost", "127.0.0.1", "[::1]"].includes(base.hostname),
    "Run this test against a local HorizonScan server.",
  );
  const settings = await getStore().settings();
  const maximum = estimateCost(
    settings.model,
    LIMITS.inputBytes + 1024,
    LIMITS.outputTokens,
  );
  assert.ok(
    maximum < 0.01,
    "The selected model exceeds this smoke test’s $0.01 reservation ceiling.",
  );
  console.log(
    JSON.stringify({
      selected_model: settings.model,
      maximum_gemini_reservation_usd: maximum,
      live_requests: 1,
    }),
  );
  const guestResponse = await fetch(new URL("/api/guest", base));
  assert.equal(guestResponse.status, 200, "Guest API is unavailable");
  const cookie = guestResponse.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");
  assert.ok(cookie, "The server did not issue a guest session");
  const headers = {
    "Content-Type": "application/json",
    Origin: base.origin,
    Cookie: cookie,
  };
  const payload = { industry: "Renewable Energy", target_country: "Germany" };
  const before = await guestResponse.json();
  const started = Date.now();
  const response = await fetch(new URL("/api/scan", base), {
    method: "POST",
    headers,
    body: JSON.stringify({ ...payload, force_refresh: true }),
    signal: AbortSignal.timeout(90000),
  });
  const raw = await response.json();
  if (!response.ok)
    throw new Error(
      `Live scan failed: HTTP ${response.status}, ${raw.code || "UNKNOWN"}: ${raw.error || "No safe error detail supplied"}`,
    );
  const report = raw as ScanResponseData;
  assert.equal(report.data_mode, "live");
  assert.equal(report.cached, false);
  assert.equal(report.model_used, settings.model);
  assert.ok(
    report.usage &&
      report.usage.input_tokens > 0 &&
      report.usage.output_tokens > 0,
    "Missing token usage receipt",
  );
  assert.ok(
    report.usage.estimated_cost_usd <= maximum,
    "Usage exceeded the reservation estimate",
  );
  const findings = Object.values(report.pestle_breakdown).flat();
  assert.ok(findings.length > 0, "No supported findings were returned");
  let citations = 0;
  for (const finding of findings) {
    assert.ok(finding.evidence?.length, "A finding has no evidence");
    assert.equal(
      Math.sign(finding.impact_score),
      finding.type === "Risk" ? -1 : 1,
    );
    for (const evidence of finding.evidence) {
      const source = report.sources.find(
        (value) => value.id === evidence.source_id,
      );
      assert.ok(source, "Unknown evidence source");
      assert.equal(evidence.source_url, source.url);
      assert.ok(
        normalizeText(source.content).includes(normalizeText(evidence.quote)),
        "Evidence quote was not found in its source excerpt",
      );
      citations++;
    }
  }
  const scoring = calculateScores(report.pestle_breakdown);
  assert.deepEqual(report.scoring, scoring);
  assert.equal(report.overall_sentiment_score, overallScore(scoring));
  await mkdir("test-results", { recursive: true });
  await writeFile(
    "test-results/gemini-live-report.json",
    JSON.stringify(report, null, 2),
  );
  const afterFresh = await fetch(new URL("/api/guest", base), {
    headers: { Cookie: cookie },
  }).then((value) => value.json());
  assert.equal(
    afterFresh.used,
    before.used + 1,
    "Fresh scan did not consume one allowance",
  );
  const cachedResponse = await fetch(new URL("/api/scan", base), {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  assert.equal(cachedResponse.status, 200);
  const cached = await cachedResponse.json();
  assert.equal(cached.cached, true);
  assert.equal(
    cached.request_id,
    report.request_id,
    "Cached request unexpectedly generated new research",
  );
  const afterCache = await fetch(new URL("/api/guest", base), {
    headers: { Cookie: cookie },
  }).then((value) => value.json());
  assert.equal(
    afterCache.used,
    afterFresh.used,
    "Cached report consumed another allowance",
  );
  const invalid = await fetch(new URL("/api/scan", base), {
    method: "POST",
    headers,
    body: JSON.stringify({
      ...payload,
      llm_api_key: "test-only-rejected-field",
    }),
  });
  assert.equal(
    invalid.status,
    400,
    "Public API accepted a client-supplied key field",
  );
  console.log(
    JSON.stringify(
      {
        status: "passed",
        industry: report.industry,
        country: report.target_country,
        model: report.model_used,
        elapsed_seconds: Number(((Date.now() - started) / 1000).toFixed(2)),
        sources: report.sources.length,
        accepted_findings: findings.length,
        matched_citations: citations,
        covered_pillars: scoring.covered_pillars,
        overall_score: report.overall_sentiment_score,
        usage: report.usage,
        cache_check: "passed without another allowance",
        strict_input_check: "passed",
        warnings: report.warnings,
        report_file: "test-results/gemini-live-report.json",
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Live Gemini test failed",
  );
  process.exitCode = 1;
});
