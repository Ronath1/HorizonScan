import fs from 'fs';
import path from 'path';
import { BrowserContext, Page } from 'playwright';
import { getPlaywrightAIConfig } from './config';

/**
 * Manages saving, loading, and verifying authenticated Playwright storageState
 */
export class BrowserSessionManager {
  private authStatePath: string;

  constructor(customPath?: string) {
    const config = getPlaywrightAIConfig();
    this.authStatePath = customPath || config.authStatePath;
  }

  /**
   * Check if an authentication session file exists on disk
   */
  public hasSession(): boolean {
    try {
      if (!fs.existsSync(this.authStatePath)) {
        return false;
      }
      const stats = fs.statSync(this.authStatePath);
      if (stats.size === 0) return false;

      // Verify it is valid JSON
      const content = fs.readFileSync(this.authStatePath, 'utf8');
      const parsed = JSON.parse(content);
      return Boolean(parsed.cookies || parsed.origins);
    } catch {
      return false;
    }
  }

  /**
   * Returns the absolute path to the session file
   */
  public getSessionPath(): string {
    return this.authStatePath;
  }

  /**
   * Saves the current browser context state (cookies + localStorage)
   */
  public async saveSession(context: BrowserContext): Promise<string> {
    const dir = path.dirname(this.authStatePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    await context.storageState({ path: this.authStatePath });
    return this.authStatePath;
  }

  /**
   * Verifies if the loaded page is authenticated according to the indicator selector
   */
  public async verifyAuthenticated(page: Page, timeoutMs = 8000): Promise<boolean> {
    const config = getPlaywrightAIConfig();

    try {
      // Check if logged-in indicator element is visible
      const indicator = page.locator(config.loggedInIndicatorSelector).first();
      await indicator.waitFor({ state: 'visible', timeout: timeoutMs });
      return true;
    } catch {
      // Check if common login/signup buttons are present (signaling unauthenticated)
      const unauthDetected = await page
        .locator('button:has-text("Log in"), a:has-text("Log in"), button:has-text("Sign up")')
        .first()
        .isVisible()
        .catch(() => false);

      return !unauthDetected;
    }
  }

  /**
   * Clear session if invalidated or expired
   */
  public clearSession(): void {
    try {
      if (fs.existsSync(this.authStatePath)) {
        fs.unlinkSync(this.authStatePath);
      }
    } catch (err) {
      console.error('[SessionManager] Error removing session file:', err);
    }
  }
}
