#!/usr/bin/env node
"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require("playwright");

const pages = [
  { cluster: "6A", file: "6a-contract-specs-tick-size-value.html" },
  { cluster: "6B", file: "6b-contract-specs-tick-size-and-margin.html" },
  { cluster: "6C", file: "6c-tick-size-tick-value.html" },
  { cluster: "6E", file: "6e-important-correlations.html" },
  { cluster: "6E-special", file: "6e-tick-size-tick-value-margin-requirements.html" },
  { cluster: "6J", file: "6j-contract-specs.html" },
  { cluster: "6M", file: "6m-tick-size.html" },
  { cluster: "6N", file: "6n-contract-specs-explained.html" },
];

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

const base = (process.argv[2] || "http://127.0.0.1:8878").replace(/\/$/, "");
const outputRoot = path.resolve(process.argv[3] || "tests/.tmp/currency-theme-visual");
const manifestPath = path.resolve(
  process.argv[4] || "artifacts/currency-library-visual-validation.json",
);

const allowedDarkSurfaces = new Set([
  "rgb(3, 8, 23)",
  "rgb(6, 19, 33)",
  "rgb(7, 17, 31)",
  "rgb(9, 20, 35)",
  "rgb(13, 27, 45)",
  "rgb(17, 36, 58)",
  "rgb(18, 51, 38)",
]);

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

      for (const target of pages) {
        const page = await context.newPage();
        const localFailures = [];
        const consoleErrors = [];
        page.on("console", (message) => {
          if (message.type() === "error" && message.location().url.startsWith(base)) {
            consoleErrors.push(message.text());
          }
        });
        page.on("requestfailed", (request) => {
          if (request.url().startsWith(base)) localFailures.push(request.url());
        });

        const url = `${base}/futures-basics/${target.file}`;
        const response = await page.goto(url, {
          waitUntil: "networkidle",
          timeout: 30_000,
        });

        const metrics = await page.evaluate(() => {
          const shared = document.querySelector(".currency-library");
          const special = document.querySelector(".euro-contract-guide");
          const root = shared || special;
          const hero = document.querySelector(".fx-hero, .e6-hero");
          const card = shared
            ? document.querySelector(
                ".fx-panel, .fx-stat, .fx-event-card, .fx-check-grid article",
              )
            : document.querySelector(".e6-source-card, .e6-distinction");
          const contentLink = document.querySelector(
            ".fx-section a, .fx-sources a, .e6-section a, .e6-sources a",
          );
          const documentWidth = Math.max(
            document.documentElement.scrollWidth,
            document.body.scrollWidth,
          );
          return {
            canonicalLinkCount: document.querySelectorAll(
              'link[href="/futures-basics/currency-research-library.css?v=20260820a"]',
            ).length,
            canonicalSheetLoaded: [...document.styleSheets].some((sheet) =>
              String(sheet.href || "").includes(
                "currency-research-library.css?v=20260820a",
              ),
            ),
            sharedArchitecture: Boolean(shared),
            specialArchitecture: Boolean(special),
            rootBackground: root ? getComputedStyle(root).backgroundColor : null,
            rootColor: root ? getComputedStyle(root).color : null,
            heroBackground: hero ? getComputedStyle(hero).backgroundImage : null,
            heroColor: hero ? getComputedStyle(hero).color : null,
            cardBackground: card ? getComputedStyle(card).backgroundColor : null,
            cardBackgroundImage: card ? getComputedStyle(card).backgroundImage : null,
            contentLinkColor: contentLink
              ? getComputedStyle(contentLink).color
              : null,
            horizontalOverflow: documentWidth > window.innerWidth + 1,
            documentWidth,
            viewportWidth: window.innerWidth,
            h1Count: document.querySelectorAll("h1").length,
            overflowingElements: [...document.querySelectorAll("body *")]
              .map((element) => {
                const box = element.getBoundingClientRect();
                return {
                  tag: element.tagName.toLowerCase(),
                  className: String(element.className || ""),
                  left: Math.round(box.left),
                  right: Math.round(box.right),
                  width: Math.round(box.width),
                };
              })
              .filter((item) => item.left < -1 || item.right > window.innerWidth + 1)
              .slice(0, 12),
          };
        });

        const errors = [];
        if (!response || response.status() !== 200) {
          errors.push(`document HTTP status ${response ? response.status() : "none"}`);
        }
        if (metrics.canonicalLinkCount !== 1) errors.push("canonical link count");
        if (!metrics.canonicalSheetLoaded) errors.push("canonical stylesheet not loaded");
        if (!metrics.sharedArchitecture && !metrics.specialArchitecture) {
          errors.push("currency-library root missing");
        }
        if (metrics.sharedArchitecture && metrics.rootBackground !== "rgb(3, 8, 23)") {
          errors.push(`shared root background ${metrics.rootBackground}`);
        }
        if (metrics.rootColor !== "rgb(248, 250, 252)") {
          errors.push(`root text color ${metrics.rootColor}`);
        }
        if (
          metrics.cardBackground &&
          !allowedDarkSurfaces.has(metrics.cardBackground) &&
          !(
            metrics.specialArchitecture &&
            metrics.cardBackground === "rgba(0, 0, 0, 0)" &&
            metrics.cardBackgroundImage !== "none"
          )
        ) {
          errors.push(`card background ${metrics.cardBackground}`);
        }
        if (
          metrics.contentLinkColor &&
          !["rgb(81, 227, 145)", "rgb(115, 240, 170)"].includes(
            metrics.contentLinkColor,
          )
        ) {
          errors.push(`content link color ${metrics.contentLinkColor}`);
        }
        if (metrics.horizontalOverflow) {
          errors.push(
            `horizontal overflow ${metrics.documentWidth}/${metrics.viewportWidth}`,
          );
        }
        if (metrics.h1Count !== 1) errors.push(`h1 count ${metrics.h1Count}`);
        if (localFailures.length) errors.push(`${localFailures.length} failed local asset(s)`);
        if (consoleErrors.length) errors.push(`${consoleErrors.length} local console error(s)`);

        const screenshotPath = path.join(
          outputRoot,
          `${target.cluster.toLowerCase()}-${viewport.name}.png`,
        );
        await page.screenshot({ path: screenshotPath, fullPage: true });

        records.push({
          ...target,
          viewport: viewport.name,
          width: viewport.width,
          height: viewport.height,
          url,
          httpStatus: response?.status() ?? null,
          ...metrics,
          localFailures,
          consoleErrors,
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
    representativePageCount: pages.length,
    viewportCount: viewports.length,
    caseCount: records.length,
    failureCount: failures.length,
    records,
  };
  await fs.mkdir(path.dirname(manifestPath), { recursive: true });
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  console.log(
    `Checked ${records.length} representative desktop/mobile currency-library cases; ` +
      `${failures.length} failure(s).`,
  );
  for (const failure of failures) {
    console.error(
      `${failure.cluster} ${failure.file} ${failure.viewport}: ${failure.errors.join("; ")}`,
    );
  }
  process.exitCode = failures.length ? 1 : 0;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
