// Verify the exact staged Probabilistic Execution PDFs and print the R2 upload
// commands. This script is read-only and never uploads anything by itself.
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { PROBABILISTIC_EXECUTION_PRINT_EDITIONS } from "../src/catalog.mjs";

const rootArgument = process.argv[2];
if (!rootArgument) {
  throw new Error("Usage: node scripts/probabilistic-execution-asset-manifest.mjs <absolute path to production/print>");
}

const root = resolve(rootArgument);
const paths = {
  "probabilistic-execution": {
    interior: "Probabilistic-Execution-Lulu-Paperback-Interior.pdf",
    cover: "Probabilistic-Execution-Lulu-Paperback-Cover.pdf"
  },
  "probabilistic-execution-hardcover": {
    interior: "Probabilistic-Execution-Lulu-Hardcover-Interior.pdf",
    cover: "Probabilistic-Execution-Lulu-Hardcover-Cover.pdf"
  }
};

for (const [slug, book] of Object.entries(PROBABILISTIC_EXECUTION_PRINT_EDITIONS)) {
  for (const type of ["interior", "cover"]) {
    const source = resolve(root, paths[slug][type]);
    const actual = createHash("md5").update(await readFile(source)).digest("hex").toUpperCase();
    const expected = book.assets[`${type}Md5`];
    if (actual !== expected) throw new Error(`${slug} ${type} MD5 does not match the release-controlled catalog.`);
    console.log(`npx wrangler r2 object put grizzly-parrot-print-assets/${book.assets[`${type}Key`]} --file "${source}" --content-type application/pdf`);
  }
}
