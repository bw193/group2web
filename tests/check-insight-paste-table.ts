// Verifies: opening /cms/insight/8 as admin and pasting the user's article
// text (with the multi-space "table") yields a real <table> in the editor.
//   npx tsx tests/check-insight-paste-table.ts
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });
import { SignJWT } from 'jose';

type ConsoleMessage = {
  text(): string;
  type(): string;
};

type BrowserPage = {
  evaluate<Result>(pageFunction: () => Result | Promise<Result>): Promise<Result>;
  evaluate<Arg, Result>(pageFunction: (arg: Arg) => Result | Promise<Result>, arg: Arg): Promise<Result>;
  goto(url: string, options: { timeout: number; waitUntil: 'domcontentloaded' }): Promise<unknown>;
  on(event: 'console', handler: (message: ConsoleMessage) => void): void;
  on(event: 'pageerror', handler: (error: unknown) => void): void;
  setCookie(cookie: {
    httpOnly: boolean;
    name: string;
    path: string;
    url: string;
    value: string;
  }): Promise<void>;
  waitForSelector(selector: string, options: { timeout: number }): Promise<unknown>;
};

type Browser = {
  close(): Promise<void>;
  newPage(): Promise<BrowserPage>;
};

const CHROME =
  process.env.CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = process.env.BASE || 'http://localhost:3001';

const ARTICLE = `Mirror glass material is one of the most important factors affecting the quality, durability, appearance, and after-sales risk of bathroom mirrors. For B2B buyers, choosing the right mirror glass is not only about reflection quality, but also about moisture resistance, oxidation resistance, service life, transportation safety, and long-term product profitability.

Quick Comparison: Aluminum vs Silver vs Copper-Free Silver Mirror Glass
Mirror Glass Type    Reflectivity    Moisture Resistance    Service Life    Cost Level    Suitable Market
Aluminum Mirror Glass    88%–90%    Low    2–3 years    Low    Entry-level and budget markets
Ordinary Silver Mirror Glass    ≥95%    Medium    5–8 years    Medium    Standard residential and hotel projects
5mm Copper-Free Silver Mirror Glass    Around 96%    High    Long-term use    Premium    High-end LED bathroom mirrors and export projects
How B2B Buyers Should Choose the Right Mirror Glass
For B2B buyers, the right mirror glass depends on product positioning, target market, project budget, and after-sales expectations.`;

async function loadPuppeteer() {
  try {
    const moduleName = 'puppeteer-core';
    const mod = (await import(moduleName)) as {
      default: {
        launch(options: {
          args: string[];
          executablePath: string;
          headless: boolean;
        }): Promise<Browser>;
      };
    };
    return mod.default;
  } catch {
    throw new Error('Install puppeteer-core before running this manual browser check.');
  }
}

async function main() {
  const secret = new TextEncoder().encode(
    process.env.JWT_SECRET || 'chengtai-jwt-secret-change-in-production-2025',
  );
  const token = await new SignJWT({
    userId: 1,
    username: 'smoke',
    role: 'admin',
    mustChangePassword: false,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('10m')
    .setIssuedAt()
    .sign(secret);

  const puppeteer = await loadPuppeteer();
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu'],
  });
  const page = await browser.newPage();
  await page.setCookie({
    name: 'auth-token',
    value: token,
    url: BASE,
    httpOnly: true,
    path: '/',
  });

  page.on('pageerror', (err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    console.log('[pageerror]', message);
  });
  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() === 'error' || msg.type() === 'warn') console.log(`[${msg.type()}] ${msg.text()}`);
  });

  console.log(`Opening ${BASE}/cms/insight/8 ...`);
  await page.goto(`${BASE}/cms/insight/8`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('.ProseMirror', { timeout: 30000 });
  console.log('editor mounted.');
  await new Promise((r) => setTimeout(r, 1500));

  // Replace the editor content via the clipboard paste API.
  // Set up a clean editor body, focus it, and inject a paste event.
  await page.evaluate(() => {
    const pm = document.querySelector('.ProseMirror') as HTMLElement | null;
    pm?.focus();
  });
  await page.evaluate((text: string) => {
    const pm = document.querySelector('.ProseMirror') as HTMLElement;
    pm.focus();
    // Place selection at end so the paste appends rather than overwrites.
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(pm);
    range.collapse(false);
    sel?.removeAllRanges();
    sel?.addRange(range);
    const dt = new DataTransfer();
    dt.setData('text/plain', text);
    const evt = new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true });
    Object.defineProperty(evt, 'clipboardData', { value: dt });
    pm.dispatchEvent(evt);
  }, ARTICLE);

  await new Promise((r) => setTimeout(r, 800));

  const summary = await page.evaluate(() => {
    const pm = document.querySelector('.ProseMirror');
    if (!pm) return null;
    const tables = pm.querySelectorAll('table');
    const result = {
      tableCount: tables.length,
      firstTableRows: 0,
      firstTableCols: 0,
      headerCellTexts: [] as string[],
      firstBodyRowTexts: [] as string[],
      htmlExcerpt: '',
    };
    if (tables.length > 0) {
      const t = tables[0] as HTMLTableElement;
      result.firstTableRows = t.querySelectorAll('tr').length;
      result.firstTableCols = (t.querySelector('tr') as HTMLTableRowElement | null)?.children.length ?? 0;
      result.headerCellTexts = Array.from(t.querySelectorAll('th')).map((c) => (c.textContent ?? '').trim());
      const bodyRow = t.querySelectorAll('tr')[1] as HTMLTableRowElement | undefined;
      result.firstBodyRowTexts = bodyRow ? Array.from(bodyRow.children).map((c) => (c.textContent ?? '').trim()) : [];
      result.htmlExcerpt = (pm as HTMLElement).innerHTML.slice(0, 700);
    } else {
      result.htmlExcerpt = (pm as HTMLElement).innerHTML.slice(0, 700);
    }
    return result;
  });

  console.log('result:', JSON.stringify(summary, null, 2));
  await browser.close();
}

main().then(() => process.exit(0), (e) => {
  console.error(e);
  process.exit(1);
});
