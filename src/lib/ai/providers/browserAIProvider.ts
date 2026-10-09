import { AIProvider, AskOptions } from '../types';
import { PlaywrightBrowserService } from '../playwright/browserService';
import { getPlaywrightAIConfig } from '../playwright/config';

/**
 * AI Provider implementing browser automation via Playwright
 */
export class BrowserAIProvider implements AIProvider {
  public readonly name = 'BrowserAI (Playwright)';
  private browserService: PlaywrightBrowserService;

  constructor() {
    this.browserService = PlaywrightBrowserService.getInstance();
  }

  public async ask(prompt: string, options?: AskOptions): Promise<string> {
    const rawResponse = await this.browserService.executePrompt(prompt, options?.timeoutMs);
    return rawResponse;
  }

  public async isReady(): Promise<{ ready: boolean; reason?: string }> {
    const config = getPlaywrightAIConfig();
    const sessionManager = this.browserService.getSessionManager();

    if (!config.websiteUrl) {
      return { ready: false, reason: 'AI_WEBSITE_URL is not configured.' };
    }

    const hasSession = sessionManager.hasSession();
    return {
      ready: true,
      reason: hasSession
        ? 'Authenticated session loaded from storageState.'
        : 'Running without saved session (may require public or mock interface).',
    };
  }
}
