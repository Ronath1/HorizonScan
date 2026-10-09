import path from 'path';

/**
 * Centralized, environment-driven Playwright & AI Website configuration
 */
export interface PlaywrightAIConfig {
  headless: boolean;
  websiteUrl: string;
  inputSelector: string;
  submitSelector: string;
  responseSelector: string;
  loggedInIndicatorSelector: string;
  authStatePath: string;
  maxConcurrentRequests: number;
  responseTimeoutMs: number;
  navigationTimeoutMs: number;
  slowMoMs: number;
  executablePath?: string;
}

export function getPlaywrightAIConfig(): PlaywrightAIConfig {
  const isDev = process.env.NODE_ENV !== 'production';

  return {
    // Configurable headless mode: false allows seeing browser actions in development
    headless: process.env.PLAYWRIGHT_HEADLESS !== undefined
      ? process.env.PLAYWRIGHT_HEADLESS === 'true'
      : !isDev,

    // Target AI website URL (supports Gemini, ChatGPT, Claude, custom portals)
    websiteUrl: process.env.AI_WEBSITE_URL || 'https://gemini.google.com',

    // Selectors are completely centralized and configurable with intelligent presets
    inputSelector: process.env.AI_INPUT_SELECTOR || 'div.ql-editor, div[contenteditable="true"], #prompt-textarea, textarea',
    submitSelector: process.env.AI_SUBMIT_SELECTOR || 'button.send-button, button[aria-label*="Send"], button[data-testid="send-button"], button:has(svg)',
    responseSelector: process.env.AI_RESPONSE_SELECTOR || 'message-content, .model-response-text, [data-message-author-role="assistant"], .agent-turn, div.markdown',
    loggedInIndicatorSelector: process.env.AI_LOGGED_IN_INDICATOR_SELECTOR || 'a[aria-label*="Google Account"], img[alt*="Google Account"], button[aria-label*="Google Account"], button[data-testid="profile-button"], nav',

    // Secure local session storage path
    authStatePath: process.env.AI_AUTH_STATE_PATH || path.resolve(process.cwd(), '.auth', 'ai-session.json'),

    // Concurrency control: initially 1 to ensure safe sequential browser processing
    maxConcurrentRequests: parseInt(process.env.AI_MAX_CONCURRENT_REQUESTS || '1', 10),

    // Timeouts
    responseTimeoutMs: parseInt(process.env.AI_RESPONSE_TIMEOUT_MS || '120000', 10),
    navigationTimeoutMs: parseInt(process.env.AI_NAVIGATION_TIMEOUT_MS || '45000', 10),
    slowMoMs: parseInt(process.env.AI_SLOWMO_MS || '0', 10),
    executablePath: process.env.PLAYWRIGHT_BROWSER_PATH || undefined,
  };
}
