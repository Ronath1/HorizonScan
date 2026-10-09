export type SignalType = 'Risk' | 'Opportunity';

export interface PestleSignal {
  id?: string;
  title: string;
  detail: string;
  type: SignalType;
  impact_score: number; // -5 to +5
  source_url: string;
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
}

export interface ScanResponseData {
  industry: string;
  target_country: string;
  timestamp: string;
  summary: string;
  overall_sentiment_score: number; // e.g. -5.0 to 5.0 or normalized
  pestle_breakdown: PestleBreakdown;
  sources: TavilySearchResult[];
  tavily_query: string;
  cached?: boolean;
  cached_at?: string;
  model_used?: string;
  execution_time_ms?: number;
}

export interface ScanRequestPayload {
  industry: string;
  target_country: string;
  tavily_api_key?: string;
  llm_api_key?: string;
  llm_provider?: 'gemini' | 'openai' | 'browser';
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
