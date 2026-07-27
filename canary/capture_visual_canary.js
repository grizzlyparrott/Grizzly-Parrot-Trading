const fs = await import('node:fs/promises');
const path = await import('node:path');
const { chromium } = await import('playwright');

const viewports = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 },
];

const cases = [
  { site: 'before', base: 'http://127.0.0.1:8120', port: 9340 },
  { site: 'after', base: 'http://127.0.0.1:8121', port: 9341 },
];

const pages = [
  'futures-basics/6a-asian-session-behavior.html',
  'futures-basics/6b-pullbacks-what-clean-retracements-look-like.html',
  'futures-basics/how-futures-quotes-work.html',
  'energies/cl-fundamental-drivers.html',
  'market-basics/market-structure-basics.html',
];

function safeName(p) {
  return p.replace(/[\\/]/g, '_').replace(/[^A-Za-z0-9_.-]+/g, '_');
}

function isLocal(base, url) {
  try {
    const parsed = new URL(url);
    const host = parsed.host;
    return host === '127.0.0.1:8120' || host === '127.0.0.1:8121' || host === 'localhost:8120' || host === 'localhost:8121';
  } catch {
    return false;
  }
}

async function getDevtoolsUrl(port) {
  const r = await fetch(`http://127.0.0.1:${port}/json/version`, { signal: AbortSignal.timeout(5000) });
  if (!r.ok) throw new Error(`DevTools version status ${r.status}`);
  const data = await r.json();
  if (!data.webSocketDebuggerUrl) throw new Error('Missing webSocketDebuggerUrl');
  return data.webSocketDebuggerUrl;
}

async function captureOne({ site, base, port }, pagePath, viewport, shotRoot) {
  const browserUrl = `${base}/${pagePath}`;
  const record = {
    site,
    page: pagePath,
    viewport: viewport.name,
    viewportWidth: viewport.width,
    viewportHeight: viewport.height,
    base,
    url: browserUrl,
    status: null,
    httpStatus: null,
    documentWidth: null,
    viewportWidthActual: null,
    horizontalOverflow: false,
    consoleExceptionCount: 0,
    failedLocalAssetCount: 0,
    screenshotPath: null,
  };

  const ws = await getDevtoolsUrl(port);
  const browser = await chromium.connectOverCDP(ws);
  try {
    const context = browser.contexts()?.[0] ?? (await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } }));
    const page = await context.newPage();
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    page.setDefaultTimeout(20000);
    page.setDefaultNavigationTimeout(30000);

    let consoleErrors = 0;
    let failedLocal = 0;

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors += 1;
      }
    });

    page.on('pageerror', () => {
      consoleErrors += 1;
    });

    page.on('requestfailed', (req) => {
      if (isLocal(base, req.url())) {
        failedLocal += 1;
      }
    });

    page.on('response', async (res) => {
      try {
        const status = res.status();
        if (isLocal(base, res.url()) && status >= 400) {
          failedLocal += 1;
        }
      } catch {
        // ignore
      }
    });

    const response = await page.goto(browserUrl, { waitUntil: 'networkidle', timeout: 30000 });
    record.status = 'loaded';
    record.httpStatus = response ? response.status() : null;

    await page.waitForTimeout(500);

    const metrics = await page.evaluate(() => {
      return {
        documentWidth: Math.max(document.documentElement.scrollWidth || 0, document.body?.scrollWidth || 0),
        viewportWidth: window.innerWidth,
      };
    });

    record.documentWidth = metrics.documentWidth;
    record.viewportWidthActual = metrics.viewportWidth;
    record.horizontalOverflow = metrics.documentWidth > metrics.viewportWidth;

    const shotName = `${safeName(pagePath)}_${site}_${viewport.name}.png`;
    const shotPath = path.join(shotRoot, shotName);
    await page.screenshot({ path: shotPath, fullPage: true });
    record.screenshotPath = shotPath;

    record.consoleExceptionCount = consoleErrors;
    record.failedLocalAssetCount = failedLocal;
  } finally {
    await browser.close();
  }

  return record;
}

const shotRoot = 'C:/Users/grizz/Documents/Codex/2026-07-21/continue-with-the-remaining-work-that/work/canary/shots';
await fs.mkdir(shotRoot, { recursive: true });

const all = [];
for (const vp of viewports) {
  for (const c of cases) {
    for (const p of pages) {
      all.push(await captureOne(c, p, vp, shotRoot));
    }
  }
}

const manifestPath = 'C:/Users/grizz/Documents/Codex/2026-07-21/continue-with-the-remaining-work-that/work/canary/visual_manifest.json';
await fs.writeFile(manifestPath, JSON.stringify(all, null, 2));
console.log(manifestPath);
console.log(JSON.stringify(all, null, 2));
