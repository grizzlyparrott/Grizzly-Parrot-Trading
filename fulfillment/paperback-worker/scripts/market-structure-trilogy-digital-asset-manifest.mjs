// Verify the six immutable Market Structure sale assets, then print private R2
// upload commands. This script never uploads or publishes a paid file.
import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { isAbsolute, resolve } from "node:path";
import { MARKET_STRUCTURE_TRILOGY_DIGITAL_DELIVERY } from "../src/digital-delivery.mjs";

const rootArgument = process.argv[2];
if (!rootArgument || !isAbsolute(rootArgument)) {
  throw new Error("Usage: node scripts/market-structure-trilogy-digital-asset-manifest.mjs <absolute path to Market_Structure_Series>");
}

const root = resolve(rootArgument);
for (const asset of MARKET_STRUCTURE_TRILOGY_DIGITAL_DELIVERY.assets) {
  const source = resolve(root, asset.sourceRelativePath);
  const file = await stat(source);
  if (!file.isFile() || file.size <= 0) throw new Error(`${asset.filename} is missing or empty.`);
  const bytes = await readFile(source);
  const actual = createHash("sha256").update(bytes).digest("hex").toUpperCase();
  if (actual !== asset.sha256) throw new Error(`${asset.filename} SHA-256 does not match the delivery manifest.`);
  console.log(`npx wrangler r2 object put grizzly-parrot-print-assets/${asset.key} --remote --file "${source}" --content-type ${asset.contentType}`);
}
