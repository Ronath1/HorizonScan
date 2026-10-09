import { PestleBreakdown, PestleSignal, TavilySearchResult } from '@/types/pestle';

export interface LlmPestleOutput {
  summary: string;
  overall_sentiment_score: number;
  pestle_breakdown: PestleBreakdown;
}

export function formatSearchSnippetsForPrompt(sources: TavilySearchResult[]): string {
  if (sources.length === 0) {
    return 'No search snippets were retrieved.';
  }

  return sources
    .map((src, index) => {
      const dateStr = src.published_date ? ` [Date: ${src.published_date}]` : '';
      return `--- Snippet #${index + 1} ---
Title: ${src.title}
URL: ${src.url}${dateStr}
Content: ${src.content}
`;
    })
    .join('\n');
}

export function createPestlePrompt(
  industry: string,
  targetCountry: string,
  snippetsText: string
): { systemInstruction: string; userPrompt: string } {
  const systemInstruction = `Analyze the provided search snippets for industry: '${industry}' in country: '${targetCountry}'.
Extract concrete signals and classify them into the 6 PESTLE pillars.
Rules:
1. Every item must be grounded in the provided search results.
2. Provide direct citations (URL from Tavily results).
3. Assign a type ('Risk' or 'Opportunity') and an impact score from -5 (severe threat) to +5 (major opportunity).
4. Return ONLY valid JSON matching this exact schema:

{
  "summary": "Brief 2-sentence executive summary of the macro environment",
  "overall_sentiment_score": 0.0,
  "pestle_breakdown": {
    "political": [
      {
        "title": "Short title",
        "detail": "Actionable 1-2 sentence description",
        "type": "Risk" | "Opportunity",
        "impact_score": -5 to 5,
        "source_url": "https://..."
      }
    ],
    "economic": [],
    "social": [],
    "technological": [],
    "legal": [],
    "environmental": []
  }
}`;

  const userPrompt = `Target Industry: ${industry}
Target Country / Region: ${targetCountry}

GROUND TRUTH SEARCH SNIPPETS:
${snippetsText}

Perform the PESTLE classification and return ONLY the JSON object.`;

  return { systemInstruction, userPrompt };
}

function cleanAndParseJson(rawText: string): LlmPestleOutput {
  let cleaned = rawText.trim();

  // Strip Markdown code fences if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
    cleaned = cleaned.replace(/\s*```$/i, '');
  }

  // Find opening and closing braces
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    // Attempt removing trailing commas before closing braces/brackets
    const sanitized = cleaned
      .replace(/,\s*([}\]])/g, '$1');
    try {
      parsed = JSON.parse(sanitized);
    } catch {
      throw new Error(`Failed to parse LLM response as JSON: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return validateAndNormalizePestleOutput(parsed);
}

function validateAndNormalizePestleOutput(data: unknown): LlmPestleOutput {
  if (typeof data !== 'object' || data === null) {
    throw new Error('LLM output is not an object.');
  }

  const record = data as Record<string, unknown>;
  const summary = typeof record.summary === 'string' ? record.summary : 'Executive summary unavailable.';
  
  let overallSentiment = 0.0;
  if (typeof record.overall_sentiment_score === 'number') {
    overallSentiment = Math.max(-5, Math.min(5, record.overall_sentiment_score));
  }

  const rawBreakdown = (typeof record.pestle_breakdown === 'object' && record.pestle_breakdown !== null)
    ? (record.pestle_breakdown as Record<string, unknown>)
    : {};

  const pillars = ['political', 'economic', 'social', 'technological', 'legal', 'environmental'] as const;
  const pestle_breakdown: PestleBreakdown = {
    political: [],
    economic: [],
    social: [],
    technological: [],
    legal: [],
    environmental: [],
  };

  for (const pillar of pillars) {
    const rawSignals = Array.isArray(rawBreakdown[pillar]) ? rawBreakdown[pillar] : [];
    pestle_breakdown[pillar] = rawSignals.map((item: unknown, index: number): PestleSignal => {
      const sig = typeof item === 'object' && item !== null ? (item as Record<string, unknown>) : {};
      const title = typeof sig.title === 'string' ? sig.title : `Signal #${index + 1}`;
      const detail = typeof sig.detail === 'string' ? sig.detail : '';
      const rawType = String(sig.type || '').trim().toLowerCase();
      const type: 'Risk' | 'Opportunity' = rawType.includes('risk') || rawType.includes('threat') ? 'Risk' : 'Opportunity';
      
      let impact_score = typeof sig.impact_score === 'number' ? sig.impact_score : (type === 'Risk' ? -2 : 3);
      impact_score = Math.max(-5, Math.min(5, Math.round(impact_score)));

      const source_url = typeof sig.source_url === 'string' && sig.source_url.startsWith('http')
        ? sig.source_url
        : '';

      return {
        id: `${pillar}_${index}_${Date.now()}`,
        title,
        detail,
        type,
        impact_score,
        source_url,
      };
    });
  }

  // Calculate overall sentiment if not computed accurately
  let totalSignals = 0;
  let sumScore = 0;
  for (const pillar of pillars) {
    for (const sig of pestle_breakdown[pillar]) {
      totalSignals += 1;
      sumScore += sig.impact_score;
    }
  }

  if (totalSignals > 0 && Math.abs(overallSentiment) < 0.001) {
    overallSentiment = Number((sumScore / totalSignals).toFixed(1));
  }

  return {
    summary,
    overall_sentiment_score: overallSentiment,
    pestle_breakdown,
  };
}

export async function callGeminiFlash(
  industry: string,
  targetCountry: string,
  sources: TavilySearchResult[],
  apiKey?: string
): Promise<{ output: LlmPestleOutput; model: string }> {
  const finalKey = apiKey || process.env.GEMINI_API_KEY;
  if (!finalKey) {
    throw new Error('Gemini API key is missing. Set GEMINI_API_KEY or provide it in the API settings.');
  }

  const snippetsText = formatSearchSnippetsForPrompt(sources);
  const { systemInstruction, userPrompt } = createPestlePrompt(industry, targetCountry, snippetsText);

  // Support active Gemini models with resilience against 503 load spikes
  const models = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
  let lastError: Error | null = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${finalKey}`;
      const payload = {
        system_instruction: {
          parts: [{ text: systemInstruction }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          topP: 0.8,
          response_mime_type: 'application/json',
        },
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Gemini API error (${model}): HTTP ${response.status} - ${errorText}`);
      }

      const resData = await response.json();
      const generatedText = resData.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) {
        throw new Error(`Gemini response returned empty content (${model})`);
      }

      const output = cleanAndParseJson(generatedText);
      return { output, model };
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // Continue to next model if this was a model not found error
      continue;
    }
  }

  throw lastError || new Error('Failed to generate PESTLE classification with Gemini.');
}

export async function callOpenAI(
  industry: string,
  targetCountry: string,
  sources: TavilySearchResult[],
  apiKey?: string
): Promise<{ output: LlmPestleOutput; model: string }> {
  const finalKey = apiKey || process.env.OPENAI_API_KEY;
  if (!finalKey) {
    throw new Error('OpenAI API key is missing. Set OPENAI_API_KEY or provide it in the API settings.');
  }

  const snippetsText = formatSearchSnippetsForPrompt(sources);
  const { systemInstruction, userPrompt } = createPestlePrompt(industry, targetCountry, snippetsText);
  const model = 'gpt-4o-mini';

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${finalKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`OpenAI API error: HTTP ${response.status} - ${errorText}`);
  }

  const resData = await response.json();
  const text = resData.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error('OpenAI returned empty message content.');
  }

  const output = cleanAndParseJson(text);
  return { output, model };
}
