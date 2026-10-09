import { getFromCache, setInCache } from './cache';
import { searchTavily } from './tavily';
import { callGeminiFlash, callOpenAI, formatSearchSnippetsForPrompt } from './llm';
import { getMockPreset } from './mockData';
import { ScanRequestPayload, ScanResponseData, PestleBreakdown } from '../types/pestle';
import { AIService } from './ai/aiService';
import { PestleAnalysisTemplate } from './ai/templates/pestleTemplate';

export interface ScanResult {
  status: number;
  data: ScanResponseData | { error: string; needsKeys?: boolean; execution_time_ms?: number };
}

export async function processScanRequest(body: ScanRequestPayload): Promise<ScanResult> {
  const startTime = Date.now();

  try {
    const {
      industry,
      target_country,
      tavily_api_key,
      llm_api_key,
      llm_provider = 'gemini',
      force_refresh = false,
    } = body || {};

    if (!industry || typeof industry !== 'string' || industry.trim().length === 0) {
      return {
        status: 400,
        data: { error: 'Industry is required (e.g., "Renewable Energy", "Fintech").' },
      };
    }

    if (!target_country || typeof target_country !== 'string' || target_country.trim().length === 0) {
      return {
        status: 400,
        data: { error: 'Target country is required (e.g., "Germany", "India").' },
      };
    }

    const cleanIndustry = industry.trim();
    const cleanCountry = target_country.trim();

    // 1. Check 24-hour Cache unless force_refresh is requested
    if (!force_refresh) {
      const cachedResult = getFromCache(cleanIndustry, cleanCountry);
      if (cachedResult) {
        return {
          status: 200,
          data: {
            ...cachedResult,
            execution_time_ms: Date.now() - startTime,
          },
        };
      }
    }

    // 2. Resolve API Keys
    const tavilyKey = tavily_api_key?.trim() || process.env.TAVILY_API_KEY?.trim();
    let geminiKey = process.env.GEMINI_API_KEY?.trim();
    let openaiKey = process.env.OPENAI_API_KEY?.trim();

    if (llm_api_key?.trim()) {
      if (llm_provider === 'openai') {
        openaiKey = llm_api_key.trim();
      } else {
        geminiKey = llm_api_key.trim();
      }
    }

    // Check if live execution is supported (either Tavily + Browser, or Tavily + API key)
    const hasLiveKeys = Boolean(tavilyKey && (llm_provider === 'browser' || geminiKey || openaiKey));

    if (!hasLiveKeys) {
      // If keys are not configured, check for available preset or simulated intelligence
      const preset = getMockPreset(cleanIndustry, cleanCountry);
      if (preset) {
        const responseData: ScanResponseData = {
          ...preset,
          cached: false,
          execution_time_ms: Date.now() - startTime,
        };
        setInCache(cleanIndustry, cleanCountry, responseData);
        return {
          status: 200,
          data: responseData,
        };
      }

      return {
        status: 400,
        data: {
          error:
            'Tavily API Key and an AI Provider (Browser Automation via Playwright, Gemini, or OpenAI) are required to scan custom queries. Please click "API Keys" in the top-right header to configure your keys or select Browser Automation mode.',
          needsKeys: true,
        },
      };
    }

    // 3. Step 1: Tavily Search Integration Pipeline
    const { results: sources, query: tavily_query } = await searchTavily(
      cleanIndustry,
      cleanCountry,
      tavilyKey
    );

    if (sources.length === 0) {
      return {
        status: 404,
        data: {
          error: `No search results found for query: "${tavily_query}". Try broadening your industry or country term.`,
        },
      };
    }

    // 4. Step 2: AI Extraction & PESTLE Classification via AIService Architecture
    const formattedSnippets = formatSearchSnippetsForPrompt(sources);
    let llmResult: { summary: string; overall_sentiment_score: number; pestle_breakdown: PestleBreakdown };
    let modelUsed = '';

    if (llm_provider === 'browser') {
      const analysis = await AIService.runAnalysis(
        PestleAnalysisTemplate,
        { industry: cleanIndustry, target_country: cleanCountry },
        formattedSnippets,
        { providerType: 'browser' }
      );
      llmResult = analysis.data;
      modelUsed = analysis.modelUsed;
    } else if (llm_provider === 'openai' && openaiKey) {
      const res = await callOpenAI(cleanIndustry, cleanCountry, sources, openaiKey);
      llmResult = res.output;
      modelUsed = res.model;
    } else if (geminiKey) {
      const res = await callGeminiFlash(cleanIndustry, cleanCountry, sources, geminiKey);
      llmResult = res.output;
      modelUsed = res.model;
    } else if (openaiKey) {
      const res = await callOpenAI(cleanIndustry, cleanCountry, sources, openaiKey);
      llmResult = res.output;
      modelUsed = res.model;
    } else {
      throw new Error('No valid AI provider or key available to classify search snippets.');
    }

    // 5. Build final structured response
    const responseData: ScanResponseData = {
      industry: cleanIndustry,
      target_country: cleanCountry,
      timestamp: new Date().toISOString(),
      summary: llmResult.summary,
      overall_sentiment_score: llmResult.overall_sentiment_score,
      pestle_breakdown: llmResult.pestle_breakdown,
      sources,
      tavily_query,
      cached: false,
      model_used: modelUsed,
      execution_time_ms: Date.now() - startTime,
    };

    // 6. Cache for 24 hours
    setInCache(cleanIndustry, cleanCountry, responseData);

    return {
      status: 200,
      data: responseData,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('PESTLE Scan Processing Error:', errorMsg);

    let status = 500;
    if (errorMsg.includes('rate limit') || errorMsg.includes('429')) status = 429;
    if (errorMsg.includes('authentication failed') || errorMsg.includes('401')) status = 401;

    return {
      status,
      data: {
        error: errorMsg,
        execution_time_ms: Date.now() - startTime,
      },
    };
  }
}
