import { AIProvider, AskOptions } from '../types';

/**
 * Direct API implementation of AIProvider (Gemini / OpenAI)
 */
export class ApiAIProvider implements AIProvider {
  public readonly name: string;
  private providerType: 'gemini' | 'openai';
  private apiKey?: string;

  constructor(providerType: 'gemini' | 'openai' = 'gemini', apiKey?: string) {
    this.providerType = providerType;
    this.apiKey = apiKey;
    this.name = providerType === 'gemini' ? 'Google Gemini API' : 'OpenAI API';
  }

  public async ask(prompt: string, options?: AskOptions): Promise<string> {
    if (this.providerType === 'openai') {
      const key = this.apiKey || process.env.OPENAI_API_KEY;
      if (!key) throw new Error('OpenAI API key missing.');

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
          response_format: { type: 'json_object' },
        }),
      });

      if (!res.ok) {
        throw new Error(`OpenAI HTTP ${res.status}: ${await res.text()}`);
      }
      const data = await res.json();
      return data.choices?.[0]?.message?.content || '';
    } else {
      // Gemini
      const key = this.apiKey || process.env.GEMINI_API_KEY;
      if (!key) throw new Error('Gemini API key missing.');

      const candidateModels = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
      let lastErr: Error | null = null;

      for (const model of candidateModels) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.2,
                response_mime_type: 'application/json',
              },
            }),
          });

          if (!res.ok) {
            continue;
          }

          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return text;
        } catch (e) {
          lastErr = e instanceof Error ? e : new Error(String(e));
        }
      }

      throw lastErr || new Error('Failed to generate response across Gemini models.');
    }
  }

  public async isReady(): Promise<{ ready: boolean; reason?: string }> {
    const key = this.apiKey || (this.providerType === 'gemini' ? process.env.GEMINI_API_KEY : process.env.OPENAI_API_KEY);
    return {
      ready: Boolean(key),
      reason: key ? 'API key configured.' : 'API key missing.',
    };
  }
}
