#!/usr/bin/env node
"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require("playwright");

const pages = [
  "6z-algorithmic-behavior.html",
  "6z-liquidity-map.html",
  "6z-margin-requirements.html",
  "6z-position-sizing.html",
  "6z-seasonal-patterns.html",
  "6z-tick-size-and-value.html",
  "6z-trade-management-guide.html",
  "6z-trading-psychology.html",
  "6z-volatility-profile.html",
  "6z-vs-6e-vs-6j-differences.html",
  "best-indicators-for-6z.html",
  "best-times-to-trade-6z-futures.html",
  "common-6z-trading-mistakes.html",
  "fundamental-drivers-of-6z.html",
  "how-sarb-influences-6z.html",
  "how-us-dollar-moves-6z.html",
  "sarb-rates-impact-6z.html",
  "what-are-6z-futures.html",
  "why-6z-slippage-hits-harder.html",
  "why-6z-trades-differently.html",
];

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

const base = (process.argv[2] || "http://127.0.0.1:8765").replace(/\/$/, "");
const outputRoot = path.resolve(process.argv[3] || "tests/.tmp/6z-visual");
const manifestPath = path.resolve(
  process.argv[4] || "artifacts/6z-visual-validation.json",
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
        if (!metrics.stylesheetLoaded) errors.push("6Z stylesheet not loaded");
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
