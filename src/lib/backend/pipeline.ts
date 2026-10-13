import { createHash, randomUUID } from 'node:crypto';
import { ScanResponseData, TavilySearchResult } from '@/types/pestle';
import { LIMITS, PIPELINE_VERSION, estimateCost, configurationStatus, ModelId } from './config';
import { REQUEST_SCHEMA, prepareEvidence, validateEvidence } from './evidence';
import { ServiceError } from './errors';
import { GenerationResult, GenerationUsage, searchWeb, generateAnalysis } from './providers';
import { calculateScores, createSummary, overallScore } from './scoring';
import { Store } from './store';

type Dependencies = {
  search: (industry:string,country:string,signal?:AbortSignal) => Promise<{ sources:TavilySearchResult[];query:string }>;
  generate: (industry:string,country:string,sources:TavilySearchResult[],model:ModelId,signal?:AbortSignal) => Promise<GenerationResult>;
  configured: () => boolean;
};
const defaults: Dependencies = { search:searchWeb,generate:generateAnalysis,configured:() => { const c=configurationStatus();return c.gemini && c.tavily; } };
export async function runScan(payload: unknown, identity: { guest:string;ip:string }, store: Store, deps: Dependencies = defaults): Promise<ScanResponseData> {
  const parsed = REQUEST_SCHEMA.safeParse(payload);
  if (!parsed.success) throw new ServiceError('INVALID_REQUEST',400,'Enter an industry (2–100 characters) and country (2–80 characters). Only industry, target_country and force_refresh are accepted.');
  const { industry,target_country,force_refresh } = parsed.data;
  const settings = await store.settings();
  await store.throttle(`scan:${identity.ip}`,settings.requests_per_minute);
  const override = await store.get<{ blocked?:boolean }>(`override:${identity.guest}`);
  if (override?.blocked) throw new ServiceError('BLOCKED',403,'Scanning is disabled for this guest.');
  if (!settings.scans_enabled) throw new ServiceError('SCANS_PAUSED',503,'The administrator has paused public scanning.');
  const key = `cache:${createHash('sha256').update(JSON.stringify([PIPELINE_VERSION,settings.model,industry.toLowerCase(),target_country.toLowerCase()])).digest('hex')}`;
  const cached = await store.get<ScanResponseData>(key);
  const age = cached ? Date.now()-Date.parse(cached.timestamp) : Infinity;
  if (!force_refresh && cached && age < LIMITS.cacheSeconds*1000) return { ...cached,cached:true,cached_at:cached.timestamp,stale:false };
  if (!deps.configured()) throw new ServiceError('PROVIDER_NOT_CONFIGURED',503,'Gemini and Tavily server API keys must be configured before live scanning. Demo examples remain available.');
  const requestId = randomUUID(), started = Date.now();
  const maximumCost = estimateCost(settings.model,LIMITS.inputBytes+1024,LIMITS.outputTokens);
  const reservation = await store.reserve(identity.guest,identity.ip,key,requestId,settings,maximumCost);
  const deadline = AbortSignal.timeout(LIMITS.deadlineMs);
  let receipt: GenerationUsage | undefined;
  let success = false;
  try {
    const research = await deps.search(industry,target_country,deadline);
    const sources = prepareEvidence(research.sources);
    if (sources.length < 2) throw new ServiceError('INSUFFICIENT_SOURCES',422,'Search found fewer than two usable sources. Try a broader industry or country.');
    const generated = await deps.generate(industry,target_country,sources,settings.model,deadline);
    receipt = generated.usage;
    const { breakdown,warnings } = validateEvidence(generated.analysis,sources);
    const undated=sources.filter(s=>!s.published_date).length;
    if(undated)warnings.push(`${undated} of ${sources.length} search excerpts have no publication date; retrieval today does not make them current.`);
    const old=sources.filter(s=>s.published_date&&Date.now()-Date.parse(s.published_date)>730*86400000).length;
    if(old)warnings.push(`${old} source excerpt(s) are over two years old. Check whether their claims still apply.`);
    const scoring = calculateScores(breakdown);
    if (scoring.covered_pillars < 6) warnings.push('The overall score is withheld because some PESTLE pillars lack evidence. Missing evidence does not mean neutral impact.');
    const data: ScanResponseData = { industry,target_country,timestamp:new Date().toISOString(),summary:createSummary(breakdown,industry,target_country,scoring.covered_pillars),
      overall_sentiment_score:overallScore(scoring),pestle_breakdown:breakdown,sources,tavily_query:research.query,model_used:settings.model,
      execution_time_ms:Date.now()-started,data_mode:'live',cached:false,stale:false,warnings,scoring,usage:receipt,request_id:requestId };
    await store.set(key,data,LIMITS.staleSeconds);
    success = true;
    return data;
  } catch (error) {
    if (cached && age < LIMITS.staleSeconds*1000 && error instanceof ServiceError && (error.status === 502 || error.status === 504 || error.code.endsWith('_RATE_LIMIT'))) {
      return { ...cached,cached:true,stale:true,cached_at:cached.timestamp,warnings:[...(cached.warnings || []),`Fresh scan failed (${error.code}); this report is older cached research. The fresh attempt used an allowance.`] };
    }
    throw error;
  } finally {
    try { await store.settle(reservation,success,receipt?.estimated_cost_usd ?? null,receipt?.input_tokens,receipt?.output_tokens); }
    catch { console.error('HorizonScan usage settlement failed',requestId); }
    try { await store.release(reservation); } catch { /* the 90s lock expires */ }
  }
}
