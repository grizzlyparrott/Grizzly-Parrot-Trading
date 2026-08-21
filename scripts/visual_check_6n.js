#!/usr/bin/env node
"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require("playwright");

const pages = [
  "6n-common-mistakes.html",
  "6n-contract-specs-explained.html",
  "6n-correlations.html",
  "6n-interest-rate-impact.html",
  "6n-liquidity-guide.html",
  "6n-multi-timeframe-framework.html",
  "6n-risk-sentiment-impact.html",
  "6n-seasonal-patterns.html",
  "6n-spread-trading.html",
  "6n-trading-strategies.html",
  "6n-volatility-patterns.html",
  "6n-vs-6a-differences.html",
  "how-exports-drive-6n-trends.html",
  "how-to-read-6n-price-quotes.html",
  "how-to-trade-6n-economic-releases.html",
  "m6n-micro-contract-guide.html",
  "us-dollar-impact-on-6n.html",
  "using-6n-to-hedge-nzdusd-exposure.html",
  "what-are-6n-futures.html",
  "why-traders-use-6n-futures.html",
];

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

const base = (process.argv[2] || "http://127.0.0.1:8765").replace(/\/$/, "");
const outputRoot = path.resolve(process.argv[3] || "tests/.tmp/6n-visual");
const manifestPath = path.resolve(
  process.argv[4] || "artifacts/6n-visual-validation.json",
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
  return page.evaluate((name) => {
    const failures = [];
    const expect = (condition, message) => {
      if (!condition) failures.push(message);
    };
    const set = (id, value) => {
      document.getElementById(id).value = value;
    };
    const submit = (id) => {
      document.getElementById(id).dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    };

    if (name === "how-to-read-6n-price-quotes.html") {
      const form = document.getElementById("quote-calculator");
      submit("quote-calculator");
      expect(document.getElementById("quote-ticks").textContent === "35", "quote default ticks");
      expect(document.getElementById("quote-pnl").textContent === "$175.00", "quote default pnl");

      set("quote-side", "-1");
      set("quote-entry", "0.61510");
      set("quote-exit", "0.61260");
      set("quote-contracts", "1");
      submit("quote-calculator");
      expect(document.getElementById("quote-ticks").textContent === "50", "quote short ticks");
      expect(document.getElementById("quote-pnl").textContent === "$250.00", "quote short pnl");

      set("quote-contracts", "1.5");
      submit("quote-calculator");
      expect(document.getElementById("quote-ticks").textContent === "\u2014", "quote fractional quantity clears ticks");
      expect(document.getElementById("quote-note").textContent.includes("whole-number"), "quote fractional quantity feedback");

      set("quote-contracts", "1");
      set("quote-entry", "");
      submit("quote-calculator");
      expect(document.getElementById("quote-pnl").textContent === "\u2014", "quote empty input clears pnl");

      set("quote-entry", "0.61241");
      set("quote-exit", "0.61415");
      submit("quote-calculator");
      expect(document.getElementById("quote-note").textContent.startsWith("Off-ladder input detected"), "quote off-ladder feedback");

      set("quote-entry", "1e308");
      set("quote-exit", "1e308");
      submit("quote-calculator");
      expect(document.getElementById("quote-notional").textContent === "\u2014", "quote overflow clears output");
      expect(document.getElementById("quote-note").textContent.includes("finite arithmetic range"), "quote overflow feedback");

      form.reset();
      submit("quote-calculator");
    }

    if (name === "using-6n-to-hedge-nzdusd-exposure.html") {
      const form = document.getElementById("hedge-calculator");
      submit("hedge-calculator");
      expect(document.getElementById("hedge-side").textContent === "Short 6N", "hedge default side");
      expect(document.getElementById("hedge-floor").textContent.includes("+60,000 NZD residual"), "hedge default floor residual");
      expect(document.getElementById("hedge-nearest").textContent.includes("-40,000 NZD residual"), "hedge default nearest residual");

      set("hedge-type", "-1");
      set("hedge-amount", "240000");
      set("hedge-percent", "100");
      submit("hedge-calculator");
      expect(document.getElementById("hedge-side").textContent === "Long 6N", "hedge payable side");
      expect(document.getElementById("hedge-floor").textContent.includes("-40,000 NZD residual"), "hedge payable residual");

      set("hedge-percent", "");
      submit("hedge-calculator");
      expect(document.getElementById("hedge-side").textContent === "\u2014", "hedge empty percent clears side");
      expect(document.getElementById("hedge-note").textContent.includes("finite positive exposure"), "hedge empty percent feedback");

      set("hedge-percent", "100");
      set("hedge-amount", "-1");
      submit("hedge-calculator");
      expect(document.getElementById("hedge-floor").textContent === "\u2014", "hedge negative amount clears output");

      set("hedge-amount", "260000");
      set("hedge-percent", "101");
      submit("hedge-calculator");
      expect(document.getElementById("hedge-nearest").textContent === "\u2014", "hedge percent above range clears output");

      set("hedge-amount", "1e308");
      set("hedge-percent", "100");
      submit("hedge-calculator");
      expect(document.getElementById("hedge-floor").textContent === "\u2014", "hedge unsafe amount clears output");

      set("hedge-type", "1");
      set("hedge-amount", "260000");
      set("hedge-percent", "0");
      submit("hedge-calculator");
      expect(document.getElementById("hedge-floor").textContent.includes("0 contracts; +260,000 NZD residual"), "hedge zero-target floor");
      expect(document.getElementById("hedge-nearest").textContent.includes("0 contracts; +260,000 NZD residual"), "hedge zero-target nearest");

      form.reset();
      submit("hedge-calculator");
    }

    return failures;
  }, filename);
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
        if (!metrics.stylesheetLoaded) errors.push("6N stylesheet not loaded");
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
