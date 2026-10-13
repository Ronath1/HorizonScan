# HorizonScan

HorizonScan researches one industry and country through a Next.js API. A guest scan uses one Tavily Basic search to collect up to eight excerpts, then one selected Gemini model to extract at most twelve PESTLE findings. The server checks the JSON shape, verifies every cited quote appears in the supplied excerpt, attaches the actual source URL, and rejects unsupported findings. The server signs risk scores negative, opportunity scores positive, and calculates pillar averages. It only publishes an overall score when all six pillars have supported findings. Quote matching provides traceability, **not independent fact checking**; open source pages before relying on a finding.

The app is one Next.js deployment on Vercel. The previous Express/Render/Playwright Gemini browser path has been removed. API keys stay server side. The public API rejects client supplied keys, provider settings, and arbitrary fields. The sample reports are historical examples and are marked as demos in the page and PDF.

## Research workspace

The interface uses straightforward sans-serif typography: 16px body/input text and at least 14px supporting text across public reports and administration. Country selection is a searchable, keyboard-accessible combobox with 250 alphabetized country/territory entries, including Kosovo. The list is bundled locally, with no runtime country-data API call; attribution is in `THIRD_PARTY_NOTICES.md`.

The frontend uses a light research workspace with navy navigation, teal actions, and a responsive layout. Visitors start with an empty industry/country form; historical sample reports are an explicit choice and consume no scans. A report opens with the market summary, favorability, evidence coverage, and highest-impact opportunities and risks. Its four sections are Overview, PESTLE findings, Sources, and Methodology.

Findings can be searched, filtered by type/category, and sorted by assessed impact. Keyboard-accessible side panels show impact rationales, evidence quotes, source links, available publication dates, and caveats. Missing dates and incomplete research coverage are stated explicitly; the interface does not invent confidence percentages. PDF export loads on demand, and JSON download and printing are available in Methodology. Scans show an honest indeterminate loading state; failures preserve the previous report with an explanation.

Administration has Overview, AI model, Access & limits, and Guests sections. Provider status reflects credential presence rather than a successful live provider check. Settings and guest overrides use explicit save/cancel controls; leaving a field does not save it. Unsaved global settings are retained between admin sections, and refreshing/signing out is disabled until those settings are saved or cancelled.

## Run locally

1. `npm install`
2. Copy `.env.example` to `.env.local` and set `TAVILY_API_KEY`, `GEMINI_API_KEY`, `SESSION_SECRET` (at least 32 characters), and `ADMIN_ACCESS_CODE` (at least 16 characters). If the Vercel Upstash integration is linked, `vercel env pull .env.local --environment development` provides `KV_REST_API_URL` and `KV_REST_API_TOKEN`; preserve your locally set secrets when pulling. Local development can use an in-memory store when Redis is absent, but production fails closed without Redis.
3. `npm run dev`, then open `/` or `/admin`. The admin access code is the `ADMIN_ACCESS_CODE` value in your ignored `.env.local` file. Never commit or share this value.

This workspace already has the Vercel `horizonscan` project linked to the Upstash free plan and generated local session/admin secrets in `.env.local`. Gemini is deliberately blank in `.env.local` until the new key is available. The existing `.env` remains ignored and may contain earlier provider settings; the new pipeline does not use the old browser settings.

## Administration and spend

The `/admin` screen controls the Gemini model, guest daily scans, network daily scans, sitewide daily scans, daily estimated Gemini budget, per-minute throttle, a public scan pause switch, and per-guest overrides or blocking. Defaults are 3 scans per guest per UTC day, 10 per network, 100 sitewide, $0.25 estimated Gemini spend per day, and 10 requests per network per minute. A signed HttpOnly guest cookie identifies a browser; it is **not a verified person**. The network limit reduces simple cookie resets. Clerk or another login system can later replace guest identity and grant verified user credits.

Redis performs quota checks, spending reservations, duplicate scan locks, and usage settlement atomically across Vercel instances. A fresh scan reserves a conservative maximum before calling Tavily or Gemini. Failed/uncertain provider usage retains the reservation. Returned token usage adjusts the estimate when confirmed. A 24-hour report cache avoids provider calls; forced refreshes use allowance. A stale report can appear for up to 48 hours only after a fresh provider failure and is clearly labelled. Admin model selection is explicit; no paid model fallback or automatic AI retry occurs. The estimate uses published **text** token rates checked on 2026-10-12. Tavily credits, hosting, taxes, and provider pricing changes are separate from the displayed Gemini estimate. Provider-level budget limits should also be set in the provider console.

The default model is `gemini-2.5-flash-lite` ($0.10/M text input tokens, $0.40/M output tokens at the reviewed rate). Google currently limits Gemini 2.5 API access for new projects, so the new key may require the admin to choose `gemini-3.1-flash-lite` or `gemini-3.5-flash-lite`. The other listed models cost more. Check current access and pricing before enabling public scans. If a selected model is unavailable, the API reports that failure; it does not silently switch models.

## Deployment

The existing Vercel project is connected to `Ronath1/HorizonScan` on GitHub, with `main` as its production branch. Push changes to `main` to trigger an automatic production deployment. Check the matching commit under Vercel's Deployments tab and wait for `Ready` before verifying the result at `https://horizonscan-five.vercel.app`. Connecting this repository was necessary because the earlier deployments were uploaded manually and GitHub pushes did not update the domain.

The Vercel project is `ronath1s-projects/horizonscan` using Next.js and Node 22. Its Functions run in Mumbai (`bom1`), near the Upstash store. Upstash provides `KV_REST_API_URL` and `KV_REST_API_TOKEN` in production, preview, and development. `SESSION_SECRET`, `ADMIN_ACCESS_CODE`, and `TAVILY_API_KEY` were added as Vercel Secret variables. Add the **new** `GEMINI_API_KEY` as a Secret variable in the Vercel project when it is ready. Do not add it with a `NEXT_PUBLIC_` prefix. A first deployment is available at `https://horizonscan-five.vercel.app` with Gemini scanning disabled. After adding the key, verify `/api/guest`, `/admin`, a live scan, the citation excerpts, and quotas before inviting public users. Vercel Hobby is intended for personal, noncommercial projects; review the plan terms before commercial use.

The project currently has no Gemini key in Vercel, so `/api/scan` returns a clear configuration error and makes no search or Gemini request. Demo reports remain visible. A live Gemini research-quality check and any public production launch remain pending the new key.

## Checks

- `npm test`: real production modules with deterministic Tavily/Gemini fixtures, including citation rejection, incomplete scoring, cache behavior, quota/budget, and signed sessions.
- `npm run test:redis`: a small live Upstash reservation and settlement check; uses an isolated temporary prefix.
- `npm run test:tavily`: one live Basic search credit and source preparation check. It never calls Gemini.
- `npm run test:browser`: desktop/mobile browser checks for opt-in samples, report sections, filters, evidence panel focus/escape, PDF download, scan success/failure/stale/incomplete responses, and guest/admin controls. It reads the real guest API and signs in to the real local admin API. Research responses and admin edits are intercepted, so the test makes no live AI requests and does not change real public settings. Assumes a server at `http://localhost:3000`; set `HORIZONSCAN_TEST_URL` to use another local port.
- `npm run build`: Next.js production build and TypeScript check.

After the new Gemini key is available, add a small live benchmark of several different industry/country pairs. For each report, inspect original pages for factual support and currency, count accepted and rejected findings, measure pillar coverage and token cost, and review provider failures. A matching excerpt alone does not prove the model's interpretation.
