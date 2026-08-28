#!/usr/bin/env node
"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require("playwright");

const pages = [
  "best-times-to-trade-es-e-mini-sp500.html",
  "es-atr-behavior-and-volatility-zones.html",
  "es-building-a-simple-trading-plan.html",
  "es-common-retail-trader-mistakes.html",
  "es-gap-behavior-and-how-to-trade-it.html",
  "es-how-to-size-positions-by-account-balance.html",
  "es-intraday-support-and-resistance-levels.html",
  "es-key-economic-reports-that-move-price.html",
  "es-liquidity-pockets-and-order-book-structure.html",
  "es-market-structure-trends-pulls-and-reversals.html",
  "es-mini-vs-mes-micro-which-should-you-trade.html",
  "es-news-events-and-volatility-traps.html",
  "es-opening-range-strategies-for-beginners.html",
  "es-overnight-session-vs-regular-trading-hours.html",
  "es-roll-dates-and-contract-switching.html",
  "es-scalping-vs-swing-trading-pros-and-cons.html",
  "es-session-highs-lows-and-vwap-usage.html",
  "es-tick-size-tick-value-and-margin.html",
  "es-using-dom-and-time-and-sales.html",
  "es-using-spy-and-spx-as-confirmation.html",
  "es-vs-mes-vs-nq.html",
  "mnq-bad-habits.html",
  "nq-best-times.html",
  "nq-earnings-impact.html",
  "nq-execution-mistakes.html",
  "nq-liquidity-windows.html",
  "nq-margin.html",
  "nq-news-volatility.html",
  "nq-position-sizing.html",
  "nq-pullbacks-vs-breakouts.html",
  "nq-tick-value.html",
  "nq-volatility-vs-es.html",
  "nq-vs-es.html",
  "nq-what-is-nq.html",
  "why-futures-lead-the-stock-market.html",
];

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

const base = (process.argv[2] || "http://127.0.0.1:8765").replace(/\/$/, "");
const outputRoot = path.resolve(
  process.argv[3] || "tests/.tmp/equity-index-visual",
);
const manifestPath = path.resolve(
  process.argv[4] || "artifacts/equity-index-visual-validation.json",
);

function isLocal(url) {
  try {
    return new URL(url).origin === new URL(base).origin;
  } catch {
    return false;
  }
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
          if (isLocal(request.url())) failedLocalAssets.push(request.url());
        });
        page.on("response", (response) => {
          if (isLocal(response.url()) && response.status() >= 400) {
            badLocalResponses.push(`${response.status()} ${response.url()}`);
          }
        });

        const url = `${base}/futures-basics/${filename}`;
        const response = await page.goto(url, {
          waitUntil: "networkidle",
          timeout: 30_000,
        });
        const skip = page.locator(".fx-skip-link");
        await skip.focus();
        await page.waitForTimeout(25);

        const metrics = await page.evaluate(() => {
          const root = document.documentElement;
          const body = document.body;
          const skipLink = document.querySelector(".fx-skip-link");
          const skipBox = skipLink?.getBoundingClientRect();
          const skipStyle = skipLink ? getComputedStyle(skipLink) : null;
          const tables = [...document.querySelectorAll("table")];
          const localBrokenImages = [...document.images]
            .filter((image) => {
              const source = image.currentSrc || image.src;
              try {
                return (
                  new URL(source).origin === location.origin &&
                  (!image.complete || image.naturalWidth === 0)
                );
              } catch {
                return true;
              }
            })
            .map((image) => image.currentSrc || image.src);

          return {
            title: document.title,
            h1Count: document.querySelectorAll("h1").length,
            mainCount: document.querySelectorAll(
              "main#main-content.currency-library",
            ).length,
            sourceDetailsCount: document.querySelectorAll("details.fx-sources")
              .length,
            sharedStylesheetLoaded: [...document.styleSheets].some((sheet) =>
              String(sheet.href || "").includes(
                "currency-research-library.css?v=20260820a",
              ),
            ),
            articleSpecificStyleCount:
              document.querySelectorAll("style").length,
            documentWidth: Math.max(root.scrollWidth || 0, body?.scrollWidth || 0),
            viewportWidth: window.innerWidth,
            horizontalOverflow:
              Math.max(root.scrollWidth || 0, body?.scrollWidth || 0) >
              window.innerWidth + 1,
            skipLinkVisibleOnFocus:
              document.activeElement === skipLink &&
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
            imagesWithoutAlt: [...document.images].filter(
              (image) => !image.hasAttribute("alt"),
            ).length,
            localBrokenImages,
          };
        });

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
        if (!metrics.sharedStylesheetLoaded) errors.push("shared stylesheet not loaded");
        if (metrics.articleSpecificStyleCount) {
          errors.push(`${metrics.articleSpecificStyleCount} article-specific style block(s)`);
        }
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
        if (metrics.imagesWithoutAlt) {
          errors.push(`${metrics.imagesWithoutAlt} image(s) missing alt attributes`);
        }
        if (metrics.localBrokenImages.length) {
          errors.push(`${metrics.localBrokenImages.length} broken local image(s)`);
        }
        if (consoleErrors.length) errors.push(`${consoleErrors.length} console error(s)`);
        if (pageErrors.length) errors.push(`${pageErrors.length} page exception(s)`);
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
          failedLocalAssets,
          badLocalResponses,
          screenshotPath: path
            .relative(process.cwd(), screenshotPath)
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
