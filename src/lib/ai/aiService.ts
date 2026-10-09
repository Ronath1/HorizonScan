import { AIProvider, AnalysisTemplate } from './types';
import { BrowserAIProvider } from './providers/browserAIProvider';
import { ApiAIProvider } from './providers/apiAIProvider';
import { PromptBuilder } from './promptBuilder';
import { ResponseValidator } from './responseValidator';

export type ProviderChoice = 'browser' | 'gemini' | 'openai';

export interface AIServiceOptions {
  providerType?: ProviderChoice;
  customApiKey?: string;
  timeoutMs?: number;
}

/**
 * Unified AI Service orchestrator exposing clean askAI and runAnalysis interfaces
 */
export class AIService {
  private static browserProviderInstance: BrowserAIProvider | null = null;

  /**
   * Factory to get the desired AIProvider instance
   */
  public static getProvider(choice: ProviderChoice = 'gemini', customApiKey?: string): AIProvider {
    if (choice === 'browser') {
      if (!this.browserProviderInstance) {
        this.browserProviderInstance = new BrowserAIProvider();
      }
      return this.browserProviderInstance;
    }

    if (choice === 'openai') {
      return new ApiAIProvider('openai', customApiKey);
    }

    // Default to Gemini
    return new ApiAIProvider('gemini', customApiKey);
  }

  /**
   * Core simple method: askAI(prompt): Promise<string>
   * Hides all Playwright/API details from caller
   */
  public static async askAI(prompt: string, options?: AIServiceOptions): Promise<string> {
    const provider = this.getProvider(options?.providerType || 'gemini', options?.customApiKey);
    return provider.ask(prompt, { timeoutMs: options?.timeoutMs });
  }

  /**
   * High-level template-based structured analysis with automatic prompt generation & validation
   */
  public static async runAnalysis<T>(
    template: AnalysisTemplate<T>,
    answers: Record<string, string>,
    groundingEvidence?: string,
    options?: AIServiceOptions
  ): Promise<{ data: T; modelUsed: string }> {
    const provider = this.getProvider(options?.providerType || 'gemini', options?.customApiKey);

    // 1. Build deterministic prompt
    const prompt = PromptBuilder.buildPrompt({
      template,
      answers,
      groundingEvidence,
    });

    console.log(`[AI] Running analysis using provider: ${provider.name}`);

    // 2. Query the AI Provider (Browser or API)
    const rawResponse = await provider.ask(prompt, { timeoutMs: options?.timeoutMs });

    // 3. Validate and clean response
    const validationResult = await ResponseValidator.validateAndExtract(
      rawResponse,
      template,
      provider,
      true // allow 1-attempt correction
    );

    if (!validationResult.success || !validationResult.data) {
      throw new Error(
        `AI analysis output failed validation: ${validationResult.error || 'Schema mismatch'}`
      );
    }

    return {
      data: validationResult.data,
      modelUsed: provider.name,
    };
  }
}
