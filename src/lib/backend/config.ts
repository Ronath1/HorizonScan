import { z } from 'zod';

export const PIPELINE_VERSION = 'evidence-v1';
export const PILLARS = ['political', 'economic', 'social', 'technological', 'legal', 'environmental'] as const;
// USD / million text tokens. Reviewed against Google's pricing on 2026-10-12.
// Model changes are explicit admin actions; there is no automatic model fallback.
export const MODELS = {
  'gemini-2.5-flash-lite': { label: 'Gemini 2.5 Flash-Lite', input: 0.10, output: 0.40, legacy: true },
  'gemini-3.1-flash-lite': { label: 'Gemini 3.1 Flash-Lite', input: 0.25, output: 1.50, legacy: false },
  'gemini-3.5-flash-lite': { label: 'Gemini 3.5 Flash-Lite', input: 0.30, output: 2.50, legacy: false },
  'gemini-2.5-flash': { label: 'Gemini 2.5 Flash', input: 0.30, output: 2.50, legacy: true },
  'gemini-3.8-flash': { label: 'Gemini 3.8 Flash', input: 0.75, output: 3.75, legacy: false },
} as const;
export type ModelId = keyof typeof MODELS;
export const SETTINGS_SCHEMA = z.object({
  model: z.enum(Object.keys(MODELS) as [ModelId, ...ModelId[]]),
  guest_daily_limit: z.number().int().min(0).max(100),
  ip_daily_limit: z.number().int().min(0).max(1000),
  global_daily_limit: z.number().int().min(0).max(10000),
  daily_budget_usd: z.number().min(0).max(100),
  requests_per_minute: z.number().int().min(1).max(120),
  scans_enabled: z.boolean(),
}).strict();
export type Settings = z.infer<typeof SETTINGS_SCHEMA>;
export const DEFAULT_SETTINGS: Settings = {
  model: 'gemini-2.5-flash-lite', guest_daily_limit: 3, ip_daily_limit: 10,
  global_daily_limit: 100, daily_budget_usd: 0.25, requests_per_minute: 10, scans_enabled: true,
};
export const LIMITS = {
  bodyBytes: 2048, inputBytes: 14000, outputTokens: 3000, sourceCount: 8,
  snippetChars: 1000, evidenceChars: 6500, signals: 12,
  deadlineMs: 65000, searchTimeoutMs: 18000, aiTimeoutMs: 40000,
  cacheSeconds: 86400, staleSeconds: 172800,
} as const;

export function pricing(model: ModelId, now = new Date()) {
  const base = MODELS[model];
  const later = model === 'gemini-3.8-flash' && now >= new Date('2027-01-01T00:00:00Z');
  return { input: later ? 1.50 : base.input, output: later ? 7.50 : base.output };
}
export function estimateCost(model: ModelId, inputTokens: number, outputTokens: number) {
  const rates = pricing(model);
  return Math.ceil((inputTokens * rates.input + outputTokens * rates.output)) / 1_000_000;
}
export function configurationStatus() {
  return {
    gemini: Boolean(process.env.GEMINI_API_KEY?.trim()),
    tavily: Boolean(process.env.TAVILY_API_KEY?.trim()),
    session: (process.env.SESSION_SECRET?.length || 0) >= 32,
    admin: (process.env.ADMIN_ACCESS_CODE?.length || 0) >= 16,
    shared_store: Boolean((process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL) && (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN)),
  };
}
