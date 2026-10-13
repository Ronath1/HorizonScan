export type SignalType = 'Risk' | 'Opportunity';

export interface PestleSignal {
  id?: string;
  title: string;
  detail: string;
  type: SignalType;
  impact_score: number; // -5 to +5
  source_url: string;
  impact_reason?: string;
  evidence?: Array<{ source_id: string; quote: string; source_url: string }>;
  evidence_strength?: 'single_source' | 'multiple_sources';
  caveat?: string | null;
}

export type PestlePillarKey =
  | 'political'
  | 'economic'
  | 'social'
  | 'technological'
  | 'legal'
  | 'environmental';

export interface PestleBreakdown {
  political: PestleSignal[];
  economic: PestleSignal[];
  social: PestleSignal[];
  technological: PestleSignal[];
  legal: PestleSignal[];
  environmental: PestleSignal[];
}

export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  published_date?: string;
  score?: number;
  id?: string;
  retrieved_at?: string;
}

export interface ScanResponseData {
  industry: string;
  target_country: string;
  timestamp: string;
  summary: string;
  overall_sentiment_score: number | null;
  pestle_breakdown: PestleBreakdown;
  sources: TavilySearchResult[];
  tavily_query: string;
  cached?: boolean;
  cached_at?: string;
  model_used?: string;
  execution_time_ms?: number;
  data_mode?: 'live' | 'demo';
  stale?: boolean;
  warnings?: string[];
  scoring?: {
    version: string;
    method: string;
    pillar_scores: Record<PestlePillarKey, number | null>;
    covered_pillars: number;
    total_pillars: number;
    favorability_index: number | null;
    opportunity_count: number;
    risk_count: number;
    rubric: string;
  };
  usage?: {
    input_tokens: number;
    output_tokens: number;
    estimated_cost_usd: number;
    pricing_as_of: string;
  };
  request_id?: string;
}

export interface ScanRequestPayload {
  industry: string;
  target_country: string;
  force_refresh?: boolean;
}

export interface PillarMeta {
  key: PestlePillarKey;
  label: string;
  letter: string;
  description: string;
  accentColor: string;
  badgeBg: string;
  borderCol: string;
  iconName: string;
}
