// Run locally before each deployment after the proof-approved PDFs are selected.
// It prints the six R2 object commands and verifies that their MD5 values match
// the immutable catalog. It never uploads anything by itself.
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { PAPERBACK_BOOKS } from "../src/catalog.mjs";

const rootArgument = process.argv[2];
if (!rootArgument) {
  throw new Error("Usage: node scripts/print-asset-manifest.mjs <absolute path to the proof-approved POD Production directory>");
}
const root = resolve(rootArgument);
const paths = {
  "currency-market-structure": {
    interior: "Volume I - Currency Market Structure/Currency-Market-Structure-Volume-I-Lulu-Paperback-Interior.pdf",
    cover: "Volume I - Currency Market Structure/Currency-Market-Structure-Volume-I-Lulu-Paperback-Cover.pdf"
  },
  "metals-market-structure": {
    interior: "Volume II - Metals Market Structure/Metals-Market-Structure-Volume-II-Lulu-Paperback-Interior.pdf",
    cover: "Volume II - Metals Market Structure/Metals-Market-Structure-Volume-II-Lulu-Paperback-Cover.pdf"
  },
  "equity-market-structure": {
    interior: "Volume III - Equity Market Structure/Equity-Market-Structure-Volume-III-Lulu-Paperback-Interior.pdf",
    cover: "Volume III - Equity Market Structure/Equity-Market-Structure-Volume-III-Lulu-Paperback-Cover.pdf"
  }
};

for (const [slug, book] of Object.entries(PAPERBACK_BOOKS)) {
  for (const type of ["interior", "cover"]) {
    const source = resolve(root, paths[slug][type]);
    const actual = createHash("md5").update(await readFile(source)).digest("hex").toUpperCase();
    const expected = book.assets[`${type}Md5`];
    if (actual !== expected) throw new Error(`${slug} ${type} MD5 does not match the catalog.`);
    console.log(`npx wrangler r2 object put grizzly-parrot-print-assets/${book.assets[`${type}Key`]} --file "${source}" --content-type application/pdf`);
  }
}
