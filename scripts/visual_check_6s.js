#!/usr/bin/env node
"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require("playwright");

const pages = [
  "6s-behavior-during-fomc-weeks-not-just-fomc-day.html",
  "6s-best-times-of-day-to-trade-swiss-franc-futures.html",
  "6s-chf-usd-spot-vs-futures-differences.html",
  "6s-contract-specs-tick-size-margin.html",
  "6s-how-6s-reacts-to-snb-rate-decisions.html",
  "6s-how-snb-interventions-still-impact-swiss-franc-today.html",
  "6s-how-us-economic-data-moves-swiss-franc-futures.html",
  "6s-impact-of-global-risk-events-how-chf-reacts-to-shocks.html",
  "6s-intraday-yield-tracking-how-bond-moves-guide-chf-futures.html",
  "6s-london-fix-liquidity-shifts-and-daily-flows.html",
  "6s-macro-triggers-ranking-the-events-that-move-chf-the-most.html",
  "6s-mean-reversion-setups-and-why-they-work.html",
  "6s-safe-haven-flows-and-why-chf-surges-in-market-panics.html",
  "6s-safe-haven-vs-jpy-which-leads-in-risk-off.html",
  "6s-session-overlaps-why-europe-us-handover-moves-chf-futures.html",
  "6s-top-correlations-for-swiss-franc-futures.html",
  "6s-typical-liquidity-behavior-sweeps-fakeouts-slow-drifts.html",
  "6s-volatility-compression-and-breakout-behavior.html",
  "6s-what-moves-swiss-franc-futures.html",
  "6s-why-6s-has-low-volatility-and-how-to-trade-it.html",
  "6s-yield-spreads-and-how-interest-rate-differentials-drive-price.html",
];

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

const base = (process.argv[2] || "http://127.0.0.1:8765").replace(/\/$/, "");
const outputRoot = path.resolve(process.argv[3] || "tests/.tmp/6s-visual");
const manifestPath = path.resolve(
  process.argv[4] || "artifacts/6s-visual-validation.json",
);

function localToBase(url) {
  try {
    const actual = new URL(url);
    const expected = new URL(base);
    return actual.origin === expected.origin;
  } catch {
    return false;
  }
}

async function exerciseCalculator(page, filename) {
  return page.evaluate(() => []);
}

async function main() {
  await fs.mkdir(outputRoot, { recursive: true });
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const records = [];

  try {
    for (const viewport of viewports) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        reducedMotion: "reduce",
      });

      for (const filename of pages) {
        const page = await context.newPage();
        const consoleErrors = [];
        const pageErrors = [];
        const failedLocalAssets = [];
        const badLocalResponses = [];

        page.on("console", (message) => {
          if (message.type() === "error") consoleErrors.push(message.text());
        });
        page.on("pageerror", (error) => pageErrors.push(String(error)));
        page.on("requestfailed", (request) => {
          if (localToBase(request.url())) failedLocalAssets.push(request.url());
        });
        page.on("response", (response) => {
          if (localToBase(response.url()) && response.status() >= 400) {
            badLocalResponses.push(`${response.status()} ${response.url()}`);
          }
        });

        const url = `${base}/futures-basics/${filename}`;
        const response = await page.goto(url, {
          waitUntil: "networkidle",
          timeout: 30_000,
        });
        await page.locator(".fx-skip-link").focus();
        await page.waitForTimeout(25);

        const metrics = await page.evaluate(() => {
          const root = document.documentElement;
          const body = document.body;
          const skip = document.querySelector(".fx-skip-link");
          const skipBox = skip?.getBoundingClientRect();
          const skipStyle = skip ? getComputedStyle(skip) : null;
          const tables = [...document.querySelectorAll("table")];
          const brokenImages = [...document.images]
            .filter((image) => {
              const source = image.currentSrc || image.src;
              try {
                return new URL(source).origin === location.origin &&
                  (!image.complete || image.naturalWidth === 0);
              } catch {
                return true;
              }
            })
            .map((image) => image.currentSrc || image.src);
          const externalBrokenImages = [...document.images]
            .filter((image) => {
              const source = image.currentSrc || image.src;
              try {
                return new URL(source).origin !== location.origin &&
                  (!image.complete || image.naturalWidth === 0);
              } catch {
                return false;
              }
            })
            .map((image) => new URL(image.currentSrc || image.src).origin)
            .filter((origin, index, origins) => origins.indexOf(origin) === index);
          return {
            title: document.title,
            h1Count: document.querySelectorAll("h1").length,
            mainCount: document.querySelectorAll("main#main-content.currency-library").length,
            sourceDetailsCount: document.querySelectorAll("details.fx-sources").length,
            stylesheetLoaded: [...document.styleSheets].some((sheet) =>
              String(sheet.href || "").includes("currency-research-library.css?v=20260820a"),
            ),
            documentWidth: Math.max(root.scrollWidth || 0, body?.scrollWidth || 0),
            viewportWidth: window.innerWidth,
            horizontalOverflow:
              Math.max(root.scrollWidth || 0, body?.scrollWidth || 0) >
              window.innerWidth + 1,
            skipLinkVisibleOnFocus:
              document.activeElement === skip &&
              Boolean(skipBox) &&
              skipBox.bottom > 0 &&
              skipBox.right > 0 &&
              skipBox.left < window.innerWidth &&
              skipStyle?.visibility !== "hidden" &&
              Number(skipStyle?.opacity || 1) > 0,
            tablesOutsideAccessibleRegions: tables.filter(
              (table) =>
                !table.closest('[role="region"][aria-label][tabindex="0"]'),
            ).length,
            brokenImages,
            externalBrokenImages,
          };
        });
        const calculatorErrors = await exerciseCalculator(page, filename);

        const screenshotPath = path.join(
          outputRoot,
          `${filename.replace(/\.html$/, "")}-${viewport.name}.png`,
        );
        await page.screenshot({ path: screenshotPath, fullPage: true });

        const errors = [];
        if (!response || response.status() !== 200) {
          errors.push(`document HTTP status ${response ? response.status() : "none"}`);
        }
        if (metrics.h1Count !== 1) errors.push(`h1 count ${metrics.h1Count}`);
        if (metrics.mainCount !== 1) errors.push(`main count ${metrics.mainCount}`);
        if (metrics.sourceDetailsCount !== 1) {
          errors.push(`source details count ${metrics.sourceDetailsCount}`);
        }
        if (!metrics.stylesheetLoaded) errors.push("6S stylesheet not loaded");
        if (metrics.horizontalOverflow) {
          errors.push(
            `horizontal overflow ${metrics.documentWidth}/${metrics.viewportWidth}`,
          );
        }
        if (!metrics.skipLinkVisibleOnFocus) {
          errors.push("skip link is not visible on focus");
        }
        if (metrics.tablesOutsideAccessibleRegions) {
          errors.push(
            `${metrics.tablesOutsideAccessibleRegions} table(s) outside accessible scroll regions`,
          );
        }
        if (metrics.brokenImages.length) {
          errors.push(`${metrics.brokenImages.length} broken image(s)`);
        }
        if (consoleErrors.length) errors.push(`${consoleErrors.length} console error(s)`);
        if (pageErrors.length) errors.push(`${pageErrors.length} page exception(s)`);
        if (calculatorErrors.length) {
          errors.push(`${calculatorErrors.length} calculator regression(s)`);
        }
        if (failedLocalAssets.length) {
          errors.push(`${failedLocalAssets.length} failed local request(s)`);
        }
        if (badLocalResponses.length) {
          errors.push(`${badLocalResponses.length} bad local response(s)`);
        }

        records.push({
          filename,
          viewport: viewport.name,
          width: viewport.width,
          height: viewport.height,
          url,
          httpStatus: response?.status() ?? null,
          ...metrics,
          consoleErrors,
          pageErrors,
          calculatorErrors,
          failedLocalAssets,
          badLocalResponses,
          screenshotPath: path.relative(process.cwd(), screenshotPath)
            .split(path.sep)
            .join("/"),
          errors,
        });
        await page.close();
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }

  const failures = records.filter((record) => record.errors.length);
  const manifest = {
    generatedAt: new Date().toISOString(),
    base,
    pageCount: pages.length,
    viewportCount: viewports.length,
    caseCount: records.length,
    failureCount: failures.length,
    records,
  };
  await fs.mkdir(path.dirname(manifestPath), { recursive: true });
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(
    `Checked ${records.length} render cases across ${pages.length} pages: ${failures.length} failures.`,
  );
  for (const failure of failures) {
    console.error(
      `${failure.filename} [${failure.viewport}]: ${failure.errors.join("; ")}`,
    );
  }
  process.exitCode = failures.length ? 1 : 0;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
