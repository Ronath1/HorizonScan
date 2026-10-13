import { createHash } from 'node:crypto';
import { z } from 'zod';
import { LIMITS, PILLARS } from './config';
import { ServiceError } from './errors';
import { PestleBreakdown, PestleSignal, TavilySearchResult } from '@/types/pestle';

export const REQUEST_SCHEMA = z.object({
  industry: z.string().trim().min(2).max(100).regex(/^[\p{L}\p{N} &.,'’()+/\-]+$/u),
  target_country: z.string().trim().min(2).max(80).regex(/^[\p{L}\p{N} &.,'’()\-]+$/u),
  force_refresh: z.boolean().default(false),
}).strict();
const citationSchema = z.object({ source_id: z.string().min(1).max(32), quote: z.string().trim().min(30).max(300) }).strict();
export const ANALYSIS_SCHEMA = z.object({ signals: z.array(z.object({
  pillar: z.enum(PILLARS), title: z.string().trim().min(8).max(100),
  detail: z.string().trim().min(20).max(320), type: z.enum(['Risk', 'Opportunity']),
  impact_magnitude: z.number().int().min(1).max(5),
  impact_reason: z.string().trim().min(15).max(180),
  evidence: z.array(citationSchema).min(1).max(2),
  caveat: z.string().trim().max(160).nullable(),
}).strict()).max(LIMITS.signals) }).strict();
export type RawAnalysis = z.infer<typeof ANALYSIS_SCHEMA>;
export function normalizeText(text: string) {
  return text.normalize('NFKC').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();
}
export function safeSourceUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || !url.hostname.includes('.')) return null;
    if (/^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(url.hostname) || url.hostname.startsWith('[')) return null;
    url.hash = '';
    for (const key of [...url.searchParams.keys()]) if (/^utm_|^(fbclid|gclid)$/i.test(key)) url.searchParams.delete(key);
    return url.toString();
  } catch { return null; }
}

export function prepareEvidence(raw: TavilySearchResult[], now = new Date()): TavilySearchResult[] {
  const seen = new Set<string>();
  const texts = new Set<string>();
  let remaining = LIMITS.evidenceChars as number;
  const sources: TavilySearchResult[] = [];
  for (const item of raw) {
    const url = safeSourceUrl(item.url);
    if (!url || seen.has(url)) continue;
    const content = normalizeText(item.content).slice(0, Math.min(LIMITS.snippetChars, remaining));
    if (content.length < 80 || texts.has(content)) continue;
    seen.add(url); texts.add(content); remaining -= content.length;
    const dateMs = item.published_date ? Date.parse(item.published_date) : NaN;
    const parsedDate = Number.isFinite(dateMs) && dateMs <= now.getTime()+86400000 ? new Date(dateMs).toISOString() : undefined;
    sources.push({ id: `src_${createHash('sha256').update(url).digest('hex').slice(0, 12)}`, url,
      title: normalizeText(item.title).slice(0, 160), content, published_date: parsedDate,
      retrieved_at: now.toISOString(), score: item.score });
    if (sources.length >= LIMITS.sourceCount || remaining < 80) break;
  }
  return sources;
}

export function validateEvidence(raw: unknown, sources: TavilySearchResult[]) {
  const result = ANALYSIS_SCHEMA.safeParse(raw);
  if (!result.success) throw new ServiceError('INVALID_AI_OUTPUT', 502, 'The AI response failed structural validation. No report was published.');
  const byId = new Map(sources.map(s => [s.id, s]));
  const breakdown = Object.fromEntries(PILLARS.map(p => [p, []])) as unknown as PestleBreakdown;
  const warnings: string[] = [];
  const seenTitles = new Set<string>();
  const seenQuotes = new Set<string>();
  let rejected = 0;
  for (const signal of result.data.signals) {
    const titleKey = normalizeText(signal.title).toLowerCase();
    const quoteKey = signal.evidence.map(e => `${e.source_id}:${normalizeText(e.quote).toLowerCase()}`).sort().join('|');
    const valid = signal.evidence.every(e => {
      const source = byId.get(e.source_id);
      return source && normalizeText(source.content).includes(normalizeText(e.quote));
    });
    if (!valid || seenTitles.has(titleKey) || seenQuotes.has(quoteKey) || breakdown[signal.pillar].length >= 2) { rejected++; continue; }
    seenTitles.add(titleKey); seenQuotes.add(quoteKey);
    const evidence = signal.evidence.map(e => ({ ...e, source_url: byId.get(e.source_id)!.url }));
    const domains = new Set(evidence.map(e => new URL(e.source_url).hostname.replace(/^www\./, '')));
    const output: PestleSignal = {
      id: `${signal.pillar}_${createHash('sha256').update(titleKey).digest('hex').slice(0, 12)}`,
      title: signal.title, detail: signal.detail, type: signal.type,
      impact_score: (signal.type === 'Risk' ? -1 : 1) * signal.impact_magnitude,
      impact_reason: signal.impact_reason, source_url: evidence[0].source_url,
      evidence, evidence_strength: domains.size > 1 ? 'multiple_sources' : 'single_source', caveat: signal.caveat,
    };
    breakdown[signal.pillar].push(output);
  }
  if (rejected) warnings.push(`${rejected} finding(s) were excluded because their evidence could not be matched, they duplicated evidence, or exceeded the pillar limit.`);
  if (!Object.values(breakdown).flat().length) throw new ServiceError('INSUFFICIENT_EVIDENCE', 422, 'No findings passed the evidence checks. Try a broader industry or country.');
  warnings.push('Matching excerpts confirms traceability, not factual truth or that an excerpt fully supports the interpretation.');
  return { breakdown, warnings };
}
