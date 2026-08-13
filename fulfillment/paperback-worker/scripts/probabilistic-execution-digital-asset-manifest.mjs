// Verify the immutable digital PDF and EPUB, then print private R2 upload
// commands. This script never uploads or publishes either paid file.
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { PROBABILISTIC_DIGITAL_DELIVERY } from "../src/digital-delivery.mjs";

const rootArgument = process.argv[2];
if (!rootArgument) {
  throw new Error("Usage: node scripts/probabilistic-execution-digital-asset-manifest.mjs <absolute path to production/digital>");
}

const root = resolve(rootArgument);
for (const asset of PROBABILISTIC_DIGITAL_DELIVERY.assets) {
  const source = resolve(root, asset.filename);
  const bytes = await readFile(source);
  const actual = createHash("sha256").update(bytes).digest("hex").toUpperCase();
  if (actual !== asset.sha256) throw new Error(`${asset.filename} SHA-256 does not match the delivery manifest.`);
  console.log(`npx wrangler r2 object put grizzly-parrot-print-assets/${asset.key} --file "${source}" --content-type ${asset.contentType}`);
}
