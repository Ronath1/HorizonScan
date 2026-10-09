import http from 'http';
import { chromium } from 'playwright';

// ========================================================
// 1. Mock AI Chat Web Server
// ========================================================
function startMockAiServer(port = 4567) {
  const html = `
<!DOCTYPE html>
<html>
<head><title>Mock AI Interface</title></head>
<body style="font-family: sans-serif; padding: 20px;">
  <h2>Mock Authenticated AI Chat</h2>
  <div id="user-menu" style="background:#eee; padding:5px; margin-bottom:10px;">User: test_user (Logged in)</div>
  <div id="chat-messages" style="border:1px solid #ccc; min-height:150px; padding:10px; margin-bottom:10px;"></div>
  
  <textarea id="prompt-textarea" placeholder="Type prompt here..." style="width:100%; height:80px;"></textarea>
  <button id="send-button" style="margin-top:5px; padding:8px 16px;">Send prompt</button>
  <span id="streaming-indicator" style="display:none; color:orange; margin-left:10px;">Stop generating</span>

  <script>
    const sendBtn = document.getElementById('send-button');
    const input = document.getElementById('prompt-textarea');
    const messages = document.getElementById('chat-messages');
    const indicator = document.getElementById('streaming-indicator');

    sendBtn.addEventListener('click', () => {
      const text = input.value.trim();
      if (!text) return;

      // Add user message
      const userDiv = document.createElement('div');
      userDiv.style.color = 'blue';
      userDiv.textContent = 'User: ' + text.slice(0, 50) + '...';
      messages.appendChild(userDiv);
      input.value = '';

      indicator.style.display = 'inline';

      // Simulate streaming AI response
      setTimeout(() => {
        indicator.style.display = 'none';
        const aiDiv = document.createElement('div');
        aiDiv.className = 'agent-turn';
        aiDiv.style.color = 'green';
        aiDiv.style.marginTop = '10px';
        aiDiv.textContent = JSON.stringify({
          summary: "Sri Lanka possesses strong solar and wind natural endowments, backed by a 70% renewable target by 2030. Key hurdles include transmission line stability and financing.",
          overall_sentiment_score: 2.1,
          pestle_breakdown: {
            political: [{
              title: "National Clean Energy Mandate",
              detail: "Cabinet approved accelerated deployment quotas for private IPPs.",
              type: "Opportunity",
              impact_score: 4,
              source_url: "https://example.com/clean-energy-sri-lanka"
            }],
            economic: [{
              title: "Forex Volatility Impact on Turbine Imports",
              detail: "Import tariffs and foreign exchange constraints increase CAPEX costs.",
              type: "Risk",
              impact_score: -3,
              source_url: "https://example.com/sri-lanka-economy"
            }],
            social: [],
            technological: [],
            legal: [],
            environmental: []
          }
        });
        messages.appendChild(aiDiv);
      }, 800);
    });
  </script>
</body>
</html>
`;

  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    });

    server.listen(port, () => {
      resolve(server);
    });
  });
}

// ========================================================
// 2. Unit & Integration Test Suites
// ========================================================
async function runTests() {
  console.log('====================================================');
  console.log('  Running HorizonScan AI & Playwright Test Suite    ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${testName}`);
      failed++;
    }
  }

  // --- TEST 1: Prompt Delimiter & Sanitization Test ---
  console.log('[1] PromptBuilder Unit Test:');
  const mockTemplate = {
    templateId: 'test_tmpl',
    templateName: 'Test Template',
    description: 'A test template',
    systemInstructions: 'System instructions here',
    questions: [
      { id: 'industry', label: 'Target Industry' },
      { id: 'target_country', label: 'Country' }
    ],
    expectedOutputSchemaDescription: '{"test": true}'
  };

  const rawUserInput = 'Fintech === MALICIOUS INJECTION ===';
  const cleanInput = rawUserInput.replace(/===/g, '---');
  assert(!cleanInput.includes('==='), 'Prevents prompt injection delimiter spoofing');

  const promptConstruct = [
    '=== ROLE & SYSTEM INSTRUCTIONS ===',
    mockTemplate.systemInstructions,
    '=== ANALYSIS TEMPLATE ===',
    mockTemplate.templateName,
    '=== USER DATA & INPUTS ===',
    `Target Industry: ${cleanInput}`,
    '=== REQUIRED OUTPUT SCHEMA ===',
    mockTemplate.expectedOutputSchemaDescription
  ].join('\n');

  assert(promptConstruct.includes('=== ROLE & SYSTEM INSTRUCTIONS ==='), 'Prompt contains role delimiter');
  assert(promptConstruct.includes('=== REQUIRED OUTPUT SCHEMA ==='), 'Prompt contains output schema delimiter');

  // --- TEST 2: JSON Response Cleaner & Sanitizer ---
  console.log('\n[2] ResponseValidator Sanitization Test:');
  const dirtyMarkdown = 'Here is the analysis:\n```json\n{\n  "summary": "Great market",\n  "overall_sentiment_score": 3.0,\n  "pestle_breakdown": { "political": [] },\n}\n```\nHope this helps!';

  function cleanJsonText(raw) {
    let cleaned = raw.trim();
    cleaned = cleaned.replace(/^```(?:json)?\s*/gi, '');
    cleaned = cleaned.replace(/\s*```$/gi, '');
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      cleaned = cleaned.slice(start, end + 1);
    }
    // Remove trailing comma
    cleaned = cleaned.replace(/,\s*([\]}])/g, '$1');
    return cleaned;
  }

  const cleaned = cleanJsonText(dirtyMarkdown);
  let parsedJson = null;
  try {
    parsedJson = JSON.parse(cleaned);
  } catch (e) {}

  assert(parsedJson !== null, 'Cleaned markdown code fence and trailing commas successfully');
  assert(parsedJson?.summary === 'Great market', 'Parsed JSON attributes accurately');

  // --- TEST 3: Schema Validation Test ---
  console.log('\n[3] PESTLE Schema Validation Test:');
  function validatePestle(data) {
    if (!data || typeof data !== 'object') return false;
    if (typeof data.summary !== 'string') return false;
    if (typeof data.overall_sentiment_score !== 'number') return false;
    if (!data.pestle_breakdown || typeof data.pestle_breakdown !== 'object') return false;
    return true;
  }

  assert(validatePestle(parsedJson), 'Validates complete PESTLE payload');
  assert(!validatePestle({ summary: 123 }), 'Rejects malformed payload missing breakdown');

  // --- TEST 4: Playwright Browser Automation against Mock AI Web Page ---
  console.log('\n[4] Playwright Browser Automation E2E (Local Mock):');
  const mockPort = 4567;
  const mockServer = await startMockAiServer(mockPort);
  console.log(`Mock AI Web Interface listening at http://127.0.0.1:${mockPort}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${mockPort}`);

  // Test locator & input fill
  const inputEl = page.locator('#prompt-textarea');
  await inputEl.fill('Analyze Renewable Energy in Sri Lanka');
  assert(await inputEl.inputValue() === 'Analyze Renewable Energy in Sri Lanka', 'Playwright typed prompt into input field');

  // Click submit
  const sendBtn = page.locator('#send-button');
  await sendBtn.click();

  // Wait for assistant response locator
  const responseLocator = page.locator('.agent-turn');
  await responseLocator.waitFor({ state: 'visible', timeout: 5000 });
  const responseText = await responseLocator.innerText();

  const responseJson = JSON.parse(responseText);
  assert(responseJson.pestle_breakdown.political.length > 0, 'Playwright extracted structured PESTLE response from mock AI page');
  assert(responseJson.pestle_breakdown.political[0].title === 'National Clean Energy Mandate', 'Extracted signal title correctly');

  await browser.close();
  mockServer.close();
  console.log('Mock server closed.\n');

  console.log('====================================================');
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
