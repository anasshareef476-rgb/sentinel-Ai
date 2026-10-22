const puppeteer = require('./frontend/node_modules/puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = path.join(__dirname, 'video_assets');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function capture() {
  console.log('Launching Chrome from:', CHROME_PATH);
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));

  console.log('1. Capturing Initial Simulator Overview...');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01_overview.png') });

  // 2. Select Prohibited Linux Shadow File & Intercept
  console.log('2. Testing Prohibited Action (Shadow file)...');
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await (await btn.getProperty('innerText')).jsonValue();
    if (text.includes('Linux Shadow File') || text.includes('SHADOW') || text.includes('PROHIB-001')) {
      await btn.click();
      await new Promise(r => setTimeout(r, 600));
      break;
    }
  }

  // Click intercept button
  const submitBtn = await page.$('button[type="submit"]');
  if (submitBtn) {
    await submitBtn.click();
    await new Promise(r => setTimeout(r, 1200));
  }
  await page.screenshot({ path: path.join(OUTPUT_DIR, '02_blocked_action.png') });

  // 3. Select Bulk PII Export (Approval Required)
  console.log('3. Testing Sensitive Action (Bulk PII Export)...');
  const buttons2 = await page.$$('button');
  for (const btn of buttons2) {
    const text = await (await btn.getProperty('innerText')).jsonValue();
    if (text.includes('Bulk Export') || text.includes('PII') || text.includes('REVIEW-001')) {
      await btn.click();
      await new Promise(r => setTimeout(r, 600));
      break;
    }
  }
  const submitBtn2 = await page.$('button[type="submit"]');
  if (submitBtn2) {
    await submitBtn2.click();
    await new Promise(r => setTimeout(r, 1200));
  }
  await page.screenshot({ path: path.join(OUTPUT_DIR, '03_sensitive_action.png') });

  // 4. Navigate to Human Review
  console.log('4. Navigating to Human Review Queue...');
  await page.evaluate(() => {
    const navButtons = Array.from(document.querySelectorAll('nav button'));
    const approvalsBtn = navButtons.find(b => b.textContent.includes('Human Review'));
    if (approvalsBtn) approvalsBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '04_approvals_queue.png') });

  // 5. Click first item in queue if available
  const queueCards = await page.$$('.glass-panel div[style*="cursor: pointer"]');
  if (queueCards.length > 0) {
    await queueCards[0].click();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '05_approval_inspect.png') });

    // Approve the action
    const approveBtn = await page.$('button.btn-success');
    if (approveBtn) {
      await approveBtn.click();
      await new Promise(r => setTimeout(r, 1200));
      await page.screenshot({ path: path.join(OUTPUT_DIR, '06_approved_executed.png') });
    }
  }

  // 6. Navigate to Forensic Audit
  console.log('6. Navigating to Forensic Audit Log...');
  await page.evaluate(() => {
    const navButtons = Array.from(document.querySelectorAll('nav button'));
    const auditBtn = navButtons.find(b => b.textContent.includes('Forensic Audit'));
    if (auditBtn) auditBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '07_audit_trail.png') });

  // 7. Navigate to Policy Rules
  console.log('7. Navigating to Policy Rules Manager...');
  await page.evaluate(() => {
    const navButtons = Array.from(document.querySelectorAll('nav button'));
    const polBtn = navButtons.find(b => b.textContent.includes('Policy Rules'));
    if (polBtn) polBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '08_policy_rules.png') });

  // 8. Navigate to Benchmark Suite & Run
  console.log('8. Navigating to Benchmark & Evaluation Suite...');
  await page.evaluate(() => {
    const navButtons = Array.from(document.querySelectorAll('nav button'));
    const benchBtn = navButtons.find(b => b.textContent.includes('Benchmark'));
    if (benchBtn) benchBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Run benchmark
  const runBtn = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const b = buttons.find(btn => btn.textContent.includes('Run Benchmark') || btn.textContent.includes('Execute All'));
    if (b) { b.click(); return true; }
    return false;
  });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '09_benchmark_results.png') });

  // 9. Navigate to Architecture & Team
  console.log('9. Navigating to Architecture & Team...');
  await page.evaluate(() => {
    const navButtons = Array.from(document.querySelectorAll('nav button'));
    const aboutBtn = navButtons.find(b => b.textContent.includes('Architecture & Team'));
    if (aboutBtn) aboutBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '10_architecture_team.png') });

  await browser.close();
  console.log('All screenshots captured successfully in:', OUTPUT_DIR);
}

capture().catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});
