import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const authDir = path.resolve(process.cwd(), '.auth');
const authPath = path.resolve(authDir, 'ai-session.json');
const targetUrl = process.env.AI_WEBSITE_URL || 'https://gemini.google.com';

async function promptUser(questionText) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(questionText, (ans) => {
      rl.close();
      resolve(ans);
    });
  });
}

async function main() {
  console.log('====================================================');
  console.log('  HorizonScan - AI Browser Session Setup Utility    ');
  console.log('====================================================\n');
  console.log(`Target AI Website: ${targetUrl}`);
  console.log(`Session Output:    ${authPath}\n`);
  console.log('Instructions:');
  console.log('1. A visible Chromium browser window will open.');
  console.log('2. Log into your AI account manually (support for MFA/SSO).');
  console.log('3. Return to this terminal and press ENTER when you are logged in.');
  console.log('----------------------------------------------------\n');

  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const bravePath = 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe';
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  let chosenPath = process.env.PLAYWRIGHT_BROWSER_PATH;
  if (!chosenPath) {
    if (fs.existsSync(bravePath)) chosenPath = bravePath;
    else if (fs.existsSync(chromePath)) chosenPath = chromePath;
  }

  console.log(`Launching Browser: ${chosenPath ? chosenPath : 'Bundled Chromium'}\n`);

  const browser = await chromium.launch({
    headless: false,
    executablePath: chosenPath,
    ignoreDefaultArgs: ['--enable-automation'],
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();
  console.log(`Navigating to ${targetUrl}...`);
  await page.goto(targetUrl).catch((err) => {
    console.log(`Navigation notice: ${err.message}`);
  });

  await promptUser('\n>>> Press ENTER in this terminal once you have completed login in the browser window... <<< ');

  console.log('\nCapturing authenticated session state...');
  await context.storageState({ path: authPath });

  console.log(`\n✓ SUCCESS! Authenticated session securely saved to:`);
  console.log(`  ${authPath}`);
  console.log('\nThis file is strictly git-ignored and will be used by PlaywrightBrowserService.');
  console.log('You can now run HorizonScan with Browser AI automation enabled.\n');

  await browser.close();
}

main().catch((err) => {
  console.error('Session setup failed:', err);
  process.exit(1);
});
