import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { chromium } from "playwright";
import nextEnv from "@next/env";
import { getMockPreset } from "../src/lib/mockData.ts";
import { calculateScores, overallScore } from "../src/lib/backend/scoring.ts";
import { COUNTRIES } from "../src/lib/countries.ts";

nextEnv.loadEnvConfig(process.cwd());
const base = process.env.HORIZONSCAN_TEST_URL || "http://localhost:3000";
const guest = {
  guest_id: "00000000-0000-4000-8000-000000000001",
  daily_limit: 3,
  used: 0,
  blocked: false,
  scans_enabled: true,
  resets_at: "2026-10-14T00:00:00Z",
};
const sample = getMockPreset("Renewable Energy", "Germany");
const research = structuredClone(sample);
research.data_mode = "live";
research.industry = "Solar Energy";
research.target_country = "Sri Lanka";
research.warnings = [];
research.scoring = calculateScores(research.pestle_breakdown);
research.overall_sentiment_score = overallScore(research.scoring);
research.model_used = "gemini-2.5-flash-lite";
const firstSignal = research.pestle_breakdown.political[0];
firstSignal.impact_reason =
  "Fixture impact rationale for browser verification.";
firstSignal.evidence = [
  {
    source_id: "S1",
    source_url: research.sources[0].url,
    quote: research.sources[0].content,
  },
];
firstSignal.evidence_strength = "single_source";
const errors = [];
let browser;

async function noOverflow(page, name) {
  const size = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));
  assert.ok(
    size.scroll <= size.viewport + 1,
    `${name} overflows horizontally: ${JSON.stringify(size)}`,
  );
}

async function readableTypography(page) {
  const small = await page.evaluate(() => {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
    );
    const small = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const element = node.parentElement;
      if (
        !node.textContent.trim() ||
        !element ||
        element.closest('svg, script, style, [aria-hidden="true"]') ||
        !element.getClientRects().length
      )
        continue;
      const size = parseFloat(getComputedStyle(element).fontSize);
      if (size < 14)
        small.push({ text: node.textContent.trim().slice(0, 60), size });
    }
    return small;
  });
  assert.deepEqual(small, [], "Visible website text must be at least 14px");
  assert.doesNotMatch(
    await page
      .locator("h1")
      .first()
      .evaluate((node) => getComputedStyle(node).fontFamily),
    /Georgia|Times New Roman/,
  );
}

try {
  await mkdir("test-results", { recursive: true });
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  const guestResponse = await context.request.get(`${base}/api/guest`);
  assert.equal(guestResponse.status(), 200, "Real guest API is unavailable");
  assert.ok(
    (await guestResponse.json()).guest_id,
    "Real guest API did not return an identity",
  );
  await page.route("**/api/guest", (route) => route.fulfill({ json: guest }));
  await page.goto(base, { waitUntil: "networkidle" });
  await page
    .getByRole("heading", { name: "A clearer view of your next market." })
    .waitFor();
  assert.equal(
    await page.locator("#report").count(),
    0,
    "A sample must not load automatically",
  );
  assert.equal(
    await page
      .getByRole("button", { name: "Scan market", exact: true })
      .isDisabled(),
    true,
  );
  await noOverflow(page, "Desktop homepage");
  await readableTypography(page);
  await page
    .getByRole("combobox", { name: "Country or region", exact: true })
    .click();
  assert.equal(await page.getByRole("option").count(), COUNTRIES.length);
  assert.equal(COUNTRIES.length, 250);
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Enter");
  assert.equal(
    await page.getByLabel("Country or region", { exact: true }).inputValue(),
    "Zimbabwe",
  );
  for (const name of [
    "Nepal",
    "Nigeria",
    "Argentina",
    "Iceland",
    "New Zealand",
    "Zimbabwe",
    "Kosovo",
  ]) {
    assert.ok(
      COUNTRIES.some((country) => country.name === name),
      `Country missing: ${name}`,
    );
  }
  await page
    .getByRole("combobox", { name: "Country or region", exact: true })
    .fill("Nepal");
  assert.equal(await page.getByRole("option").count(), 1);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  assert.equal(
    await page.getByLabel("Country or region", { exact: true }).inputValue(),
    "Nepal",
  );
  await page
    .getByRole("button", { name: "Show countries", exact: true })
    .click();
  assert.equal(
    await page.getByRole("option").count(),
    250,
    "Reopening should show every country",
  );
  await page
    .getByRole("combobox", { name: "Country or region", exact: true })
    .fill("Zimbabwe");
  await page.getByRole("option", { name: "Zimbabwe", exact: true }).click();
  await page.getByLabel("Country or region", { exact: true }).fill("");
  await page.keyboard.press("Escape");
  await page.screenshot({
    path: "test-results/home-desktop.png",
    fullPage: true,
  });

  await page
    .getByRole("button", {
      name: "Explore sample: Renewable Energy in Germany",
    })
    .click();
  await page
    .getByText("Sample report · not live research", { exact: true })
    .waitFor();
  const originalSignal = page.locator(".priority-finding").first();
  await originalSignal.click();
  await page.getByRole("dialog").waitFor();
  await readableTypography(page);
  await page
    .getByText(
      "This historical sample uses illustrative scores. Live reports include an impact rationale.",
    )
    .waitFor();
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Tab");
    assert.equal(
      await page.evaluate(() =>
        Boolean(document.activeElement?.closest("dialog")),
      ),
      true,
      "Panel focus escaped",
    );
  }
  await page.keyboard.press("Escape");
  assert.equal(
    await page.getByRole("dialog").count(),
    0,
    "Escape did not dismiss the evidence panel",
  );
  assert.equal(
    await originalSignal.evaluate((node) => node === document.activeElement),
    true,
    "Panel did not restore focus",
  );
  await page.evaluate(() => {
    document.activeElement?.blur();
    window.scrollTo(0, 0);
  });
  await page.screenshot({
    path: "test-results/report-desktop.png",
    fullPage: true,
  });

  await page.getByRole("tab", { name: "PESTLE findings" }).click();
  await page.getByRole("button", { name: "Risks", exact: true }).click();
  assert.ok(await page.locator(".finding-card").count());
  assert.equal(
    await page.locator(".finding-card .badge.opportunity").count(),
    0,
  );
  await page.getByRole("button", { name: "Political", exact: true }).click();
  const beforeSearch = await page.locator(".finding-card").count();
  await page
    .getByRole("textbox", { name: "Search findings" })
    .fill("no-matching-finding-xyz");
  await page.getByRole("heading", { name: "No matching findings" }).waitFor();
  await page.getByRole("button", { name: "Clear filters" }).click();
  assert.ok((await page.locator(".finding-card").count()) > beforeSearch);
  await page.getByRole("tab", { name: "Sources", exact: false }).click();
  assert.equal(
    await page.locator(".source-card").count(),
    sample.sources.length,
  );
  await page.keyboard.press("ArrowRight");
  await page
    .getByRole("heading", { name: "How scores are calculated" })
    .waitFor();
  await page.keyboard.press("Home");
  await page
    .getByRole("heading", { name: "Your market at a glance" })
    .waitFor();

  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export PDF", exact: true }).click();
  const download = await downloadEvent;
  const downloadedPath = await download.path();
  assert.equal(
    (await readFile(downloadedPath)).subarray(0, 4).toString(),
    "%PDF",
  );

  let scanPayload;
  let scanState = "success";
  let scanRequests = 0;
  await page.route("**/api/scan", async (route) => {
    scanRequests++;
    scanPayload = route.request().postDataJSON();
    await new Promise((resolve) => setTimeout(resolve, 250));
    if (scanState === "fail")
      return route.fulfill({
        status: 429,
        json: { error: "Daily research allowance reached." },
      });
    if (scanState === "stale")
      return route.fulfill({
        json: {
          ...research,
          stale: true,
          cached: true,
          warnings: ["Fresh research failed. Showing an older saved report."],
        },
      });
    if (scanState === "incomplete") {
      const incomplete = structuredClone(research);
      incomplete.pestle_breakdown.legal = [];
      incomplete.scoring = calculateScores(incomplete.pestle_breakdown);
      incomplete.overall_sentiment_score = overallScore(incomplete.scoring);
      return route.fulfill({ json: incomplete });
    }
    return route.fulfill({ json: research });
  });
  await page.getByLabel("Industry", { exact: true }).fill("Solar Energy");
  await page.getByLabel("Country or region", { exact: true }).fill("Sri Lanka");
  await page.getByRole("button", { name: "Scan market", exact: true }).click();
  await page
    .getByRole("heading", { name: "Researching your market" })
    .waitFor();
  await page
    .getByRole("heading", { name: "Solar Energy in Sri Lanka" })
    .waitFor();
  assert.deepEqual(scanPayload, {
    industry: "Solar Energy",
    target_country: "Sri Lanka",
    force_refresh: false,
  });
  await page.getByRole("tab", { name: "PESTLE findings" }).click();
  await page.getByRole("button", { name: "Political", exact: true }).click();
  await page
    .getByRole("button", { name: firstSignal.title, exact: true })
    .click();
  await page.getByText(firstSignal.impact_reason).waitFor();
  await page
    .getByText(`“${research.sources[0].content}”`, { exact: true })
    .waitFor();
  await page.screenshot({
    path: "test-results/evidence-desktop.png",
    fullPage: true,
  });
  await page.keyboard.press("Escape");
  scanState = "fail";
  await page
    .getByRole("button", { name: "Refresh research", exact: true })
    .click();
  await page
    .getByRole("alert")
    .filter({ hasText: "Daily research allowance reached." })
    .waitFor();
  assert.equal(scanPayload.force_refresh, true);
  assert.ok(
    await page
      .getByRole("heading", { name: "Solar Energy in Sri Lanka" })
      .count(),
    "Failure discarded the previous report",
  );
  scanState = "incomplete";
  await page.getByRole("button", { name: "Retry scan" }).click();
  await page.getByText("Insufficient coverage", { exact: true }).waitFor();
  await page.getByText("Unscored", { exact: true }).first().waitFor();
  scanState = "stale";
  await page
    .getByRole("button", { name: "Refresh research", exact: true })
    .click();
  await page
    .getByText("Older report · refresh failed", { exact: true })
    .waitFor();

  const mobile = await context.newPage();
  await mobile.setViewportSize({ width: 390, height: 844 });
  mobile.on("pageerror", (error) => errors.push(error.message));
  await mobile.route("**/api/guest", (route) => route.fulfill({ json: guest }));
  await mobile.goto(base, { waitUntil: "networkidle" });
  await noOverflow(mobile, "Mobile homepage");
  await readableTypography(mobile);
  await mobile.setViewportSize({ width: 320, height: 720 });
  await noOverflow(mobile, "Narrow mobile homepage");
  await mobile.setViewportSize({ width: 390, height: 844 });
  await mobile.screenshot({
    path: "test-results/home-mobile.png",
    fullPage: true,
  });
  await mobile
    .getByRole("button", { name: "Explore sample: Fintech in India" })
    .click();
  await mobile
    .getByText("Sample report · not live research", { exact: true })
    .waitFor();
  await noOverflow(mobile, "Mobile report");
  await readableTypography(mobile);
  await mobile.getByRole("tab", { name: "PESTLE findings" }).click();
  await noOverflow(mobile, "Mobile findings");
  await mobile.screenshot({
    path: "test-results/findings-mobile.png",
    fullPage: true,
  });
  await mobile.locator(".finding-title").first().click();
  await noOverflow(mobile, "Mobile evidence panel");
  await mobile.getByRole("button", { name: "Close panel" }).click();
  await mobile.route("**/api/guest", (route) =>
    route.fulfill({ json: { ...guest, used: 3 } }),
  );
  await mobile.reload({ waitUntil: "networkidle" });
  await mobile.getByText("0 scans remaining today", { exact: true }).waitFor();
  assert.equal(
    await mobile
      .getByRole("checkbox", { name: "Refresh research" })
      .isDisabled(),
    true,
  );
  await mobile.route("**/api/guest", (route) =>
    route.fulfill({ json: { ...guest, scans_enabled: false } }),
  );
  await mobile.reload({ waitUntil: "networkidle" });
  await mobile.getByLabel("Industry", { exact: true }).fill("Test");
  await mobile.getByLabel("Country or region", { exact: true }).fill("Germany");
  assert.equal(
    await mobile
      .getByRole("button", { name: "Scan market", exact: true })
      .isDisabled(),
    true,
  );
  await mobile.close();

  await page.goto(`${base}/admin`, { waitUntil: "networkidle" });
  await page
    .getByLabel("Admin access code")
    .fill(process.env.ADMIN_ACCESS_CODE || "");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByRole("heading", { name: "Provider readiness" }).waitFor();
  await readableTypography(page);
  await page.screenshot({
    path: "test-results/admin-desktop.png",
    fullPage: true,
  });
  await page.getByRole("tab", { name: "AI model", exact: true }).click();
  assert.ok(
    (await page.getByLabel("Gemini model").locator("option").count()) >= 3,
  );
  await page.getByRole("tab", { name: "Access & limits", exact: true }).click();
  const originalLimit = await page
    .getByLabel("Guest scans per day", { exact: true })
    .inputValue();
  await page
    .getByLabel("Guest scans per day", { exact: true })
    .fill(originalLimit === "7" ? "8" : "7");
  await page
    .getByText("You have unsaved settings.", { exact: false })
    .waitFor();
  await page
    .getByRole("button", { name: "Cancel changes", exact: true })
    .click();
  assert.equal(
    await page.getByLabel("Guest scans per day", { exact: true }).inputValue(),
    originalLimit,
  );

  // Intercept admin edits so browser checks cannot change real public settings.
  const dashboardResponse = await context.request.get(`${base}/api/admin`);
  assert.equal(dashboardResponse.status(), 200);
  const dashboard = await dashboardResponse.json();
  dashboard.usage.guests = [
    { id: guest.guest_id, usage: { scans: 1 }, override: {} },
  ];
  let patches = 0;
  await page.route("**/api/admin", async (route) => {
    if (route.request().method() === "PATCH") {
      patches++;
      return route.fulfill({ json: { ok: true } });
    }
    return route.fulfill({ json: dashboard });
  });
  await page.getByRole("button", { name: "Refresh usage" }).click();
  await page.getByRole("tab", { name: "Guests", exact: true }).click();
  await page
    .getByRole("checkbox", { name: "Use default allowance", exact: false })
    .uncheck();
  await page.getByLabel("Daily scan limit", { exact: true }).fill("9");
  await page.getByLabel("Daily scan limit", { exact: true }).blur();
  assert.equal(patches, 0, "Guest changes should not save on blur");
  await page.getByRole("button", { name: "Save guest" }).click();
  await page.getByText("Guest allowance saved.", { exact: true }).waitFor();
  assert.equal(patches, 1);
  await page.getByRole("tab", { name: "Access & limits", exact: true }).click();
  await page.getByLabel("Guest scans per day", { exact: true }).fill("7");
  await page
    .getByRole("button", { name: "Save settings", exact: true })
    .click();
  await page
    .getByText("Settings saved. New scans will use these controls.", {
      exact: true,
    })
    .waitFor();
  assert.equal(patches, 2);
  await page.setViewportSize({ width: 390, height: 844 });
  await noOverflow(page, "Mobile administration");
  await readableTypography(page);
  await page.screenshot({
    path: "test-results/admin-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page.getByLabel("Admin access code").waitFor();
  assert.deepEqual(errors, [], "Browser reported runtime errors");
  console.log(
    `Browser checks passed: desktop/mobile layouts, explicit samples, evidence focus/escape, filters, PDF export, ${scanRequests} mocked scan responses, real guest API and admin sign-in, explicit admin saves. No live AI calls or real admin setting changes.`,
  );
} catch (error) {
  console.error(error instanceof Error ? error.stack : "Browser checks failed");
  process.exitCode = 1;
} finally {
  await browser?.close();
}
