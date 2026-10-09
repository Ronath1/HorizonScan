import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { getPlaywrightAIConfig } from './config';
import { BrowserSessionManager } from './sessionManager';

type QueuedTask<T> = {
  task: () => Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
};

/**
 * High-reliability Playwright Browser Service with singleton lifecycle and sequential request queue
 */
export class PlaywrightBrowserService {
  private static instance: PlaywrightBrowserService | null = null;
  private browser: Browser | null = null;
  private sessionManager: BrowserSessionManager;
  private isInitializing = false;

  // Concurrency Queue
  private queue: QueuedTask<unknown>[] = [];
  private activeCount = 0;

  private constructor() {
    this.sessionManager = new BrowserSessionManager();
    this.registerProcessCleanup();
  }

  public static getInstance(): PlaywrightBrowserService {
    if (!PlaywrightBrowserService.instance) {
      PlaywrightBrowserService.instance = new PlaywrightBrowserService();
    }
    return PlaywrightBrowserService.instance;
  }

  public getSessionManager(): BrowserSessionManager {
    return this.sessionManager;
  }

  /**
   * Initializes or returns existing Chromium browser instance
   */
  public async getBrowser(): Promise<Browser> {
    if (this.browser && this.browser.isConnected()) {
      return this.browser;
    }

    if (this.isInitializing) {
      // Wait for initialization in flight
      while (this.isInitializing) {
        await new Promise((r) => setTimeout(r, 100));
      }
      if (this.browser && this.browser.isConnected()) {
        return this.browser;
      }
    }

    this.isInitializing = true;
    const config = getPlaywrightAIConfig();

    try {
      console.log(`[AI] Starting browser (headless: ${config.headless}, binary: ${config.executablePath || 'bundled Chromium'})...`);
      this.browser = await chromium.launch({
        headless: config.headless,
        slowMo: config.slowMoMs,
        executablePath: config.executablePath,
        ignoreDefaultArgs: ['--enable-automation'],
        args: [
          '--disable-blink-features=AutomationControlled',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });
      console.log('[AI] Browser launched successfully.');
      return this.browser;
    } catch (err) {
      console.error('[AI] Failed to launch Chromium browser:', err);
      throw new Error(`Failed to launch browser: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Executes a prompt request through the controlled concurrency queue
   */
  public async executePrompt(promptText: string, customTimeoutMs?: number): Promise<string> {
    return this.enqueue(async () => {
      return this.runBrowserWorkflow(promptText, customTimeoutMs);
    });
  }

  /**
   * Enqueue task ensuring AI_MAX_CONCURRENT_REQUESTS is strictly respected
   */
  private enqueue<T>(task: () => Promise<T>): Promise<T> {
    const config = getPlaywrightAIConfig();
    const maxConcurrency = Math.max(1, config.maxConcurrentRequests);

    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        task: task as () => Promise<unknown>,
        resolve: resolve as (val: unknown) => void,
        reject,
      });

      this.processQueue(maxConcurrency);
    });
  }

  private async processQueue(maxConcurrency: number) {
    if (this.activeCount >= maxConcurrency || this.queue.length === 0) {
      return;
    }

    const nextTask = this.queue.shift();
    if (!nextTask) return;

    this.activeCount++;
    try {
      const result = await nextTask.task();
      nextTask.resolve(result);
    } catch (err) {
      nextTask.reject(err);
    } finally {
      this.activeCount--;
      this.processQueue(maxConcurrency);
    }
  }

  /**
   * Complete browser workflow:
   * 1. Create context with saved storageState
   * 2. Navigate to AI Website
   * 3. Verify authentication
   * 4. Locate input and type prompt
   * 5. Submit and wait for generation to finish
   * 6. Extract response
   * 7. Clean up page and context
   */
  private async runBrowserWorkflow(promptText: string, customTimeoutMs?: number): Promise<string> {
    const config = getPlaywrightAIConfig();
    const timeoutMs = customTimeoutMs || config.responseTimeoutMs;
    const browser = await this.getBrowser();

    let context: BrowserContext | null = null;
    let page: Page | null = null;

    try {
      // 1. Context Lifecycle: create isolated context per request
      const contextOptions: { storageState?: string; viewport: { width: number; height: number } } = {
        viewport: { width: 1280, height: 800 },
      };

      if (this.sessionManager.hasSession()) {
        contextOptions.storageState = this.sessionManager.getSessionPath();
      }

      context = await browser.newContext(contextOptions);
      page = await context.newPage();
      page.setDefaultTimeout(config.navigationTimeoutMs);

      // 2. Open configured AI website
      console.log(`[AI] Opening AI website: ${config.websiteUrl}...`);
      await page.goto(config.websiteUrl, {
        waitUntil: 'domcontentloaded',
        timeout: config.navigationTimeoutMs,
      });

      // 3. Verify authentication if session was provided
      if (this.sessionManager.hasSession()) {
        const isAuthed = await this.sessionManager.verifyAuthenticated(page, 7000);
        if (!isAuthed) {
          throw new Error(
            'Authenticated session expired or invalid. Please re-run the session setup script (npm run ai:auth).'
          );
        }
        console.log('[AI] Authentication verified.');
      }

      // 4. Locate input field
      console.log('[AI] Locating AI input field...');
      const inputLocator = page.locator(config.inputSelector).first();
      await inputLocator.waitFor({ state: 'visible', timeout: 15000 });

      // Focus and fill
      await inputLocator.click();
      await inputLocator.fill(promptText);
      console.log('[AI] Prompt inserted into input field.');

      // Count existing assistant responses before submitting
      const existingResponseCount = await page.locator(config.responseSelector).count().catch(() => 0);

      // 5. Submit the prompt
      console.log('[AI] Submitting prompt...');
      const submitBtn = page.locator(config.submitSelector).first();
      const isSubmitVisible = await submitBtn.isVisible().catch(() => false);

      if (isSubmitVisible) {
        await submitBtn.click();
      } else {
        // Fallback: press Enter on input
        await inputLocator.press('Enter');
      }

      // 6. Wait for new assistant response to appear
      console.log('[AI] Waiting for AI response generation...');
      const targetResponseIndex = existingResponseCount; // 0-indexed: index of newly generated message
      const targetLocator = page.locator(config.responseSelector).nth(targetResponseIndex);

      // Wait for the new message container to become visible
      await targetLocator.waitFor({ state: 'visible', timeout: 35000 });

      // Wait for generation stream to complete:
      // We monitor text length stabilization over 2 consecutive intervals
      let lastText = '';
      let stableCount = 0;
      const startTime = Date.now();

      while (Date.now() - startTime < timeoutMs) {
        await page.waitForTimeout(1000);

        // Check if a "Stop generating" / "Stop" button is currently active
        const isStreaming = await page
          .locator('button[aria-label*="Stop"], button:has-text("Stop generating"), [data-testid="stop-button"]')
          .first()
          .isVisible()
          .catch(() => false);

        const currentText = (await targetLocator.innerText().catch(() => '')).trim();

        if (!isStreaming && currentText.length > 0 && currentText === lastText) {
          stableCount++;
          if (stableCount >= 2) {
            // Text has ceased growing and stop button is gone
            break;
          }
        } else {
          stableCount = 0;
          lastText = currentText;
        }
      }

      const finalText = (await targetLocator.innerText().catch(() => '')).trim();
      if (!finalText) {
        throw new Error('AI response was empty or could not be detected from the DOM.');
      }

      console.log('[AI] Response received and extracted successfully.');
      return finalText;
    } catch (err) {
      console.error('[AI] Browser automation error:', err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      // Clean up Page & Context for memory safety
      if (page) await page.close().catch(() => {});
      if (context) await context.close().catch(() => {});
    }
  }

  /**
   * Graceful cleanup of browser process
   */
  public async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close().catch(() => {});
      this.browser = null;
    }
  }

  private registerProcessCleanup(): void {
    const cleanup = () => {
      if (this.browser) {
        this.browser.close().catch(() => {});
      }
    };
    process.on('exit', cleanup);
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
  }
}
