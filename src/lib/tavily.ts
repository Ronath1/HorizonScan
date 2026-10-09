import { TavilySearchResult } from '@/types/pestle';

export interface TavilyApiResponse {
  query: string;
  results: Array<{
    title: string;
    url: string;
    content: string;
    score?: number;
    published_date?: string;
  }>;
  response_time?: number;
}

export function buildTavilyQuery(industry: string, targetCountry: string): string {
  return `${industry.trim()} ${targetCountry.trim()} (policy OR market economy OR consumer trends OR tech innovation OR regulation OR climate environmental laws)`;
}

export async function searchTavily(
  industry: string,
  targetCountry: string,
  apiKey?: string
): Promise<{ results: TavilySearchResult[]; query: string }> {
  const finalApiKey = apiKey || process.env.TAVILY_API_KEY;

  if (!finalApiKey) {
    throw new Error(
      'Tavily API key is missing. Please set TAVILY_API_KEY in your environment or provide it in the API settings.'
    );
  }

  const query = buildTavilyQuery(industry, targetCountry);

  const payload = {
    api_key: finalApiKey,
    query,
    search_depth: 'advanced',
    include_answer: false,
    max_results: 10,
    include_raw_content: false,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 429) {
      throw new Error('Tavily API rate limit exceeded (HTTP 429). Please wait a moment or verify your quota.');
    }

    if (response.status === 401 || response.status === 403) {
      throw new Error('Tavily API authentication failed (HTTP 401/403). Please verify your Tavily API Key.');
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Tavily API error: HTTP ${response.status} - ${errorText || response.statusText}`);
    }

    const data: TavilyApiResponse = await response.json();

    if (!data.results || data.results.length === 0) {
      return { results: [], query };
    }

    // Extract title, url, content (snippet), published_date
    const results: TavilySearchResult[] = data.results.map((item) => ({
      title: item.title || 'Untitled Source',
      url: item.url || '',
      content: item.content || '',
      published_date: item.published_date,
      score: item.score,
    }));

    return { results, query };
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Tavily Search API request timed out after 25 seconds.');
    }
    throw error;
  }
}
