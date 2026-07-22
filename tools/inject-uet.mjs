import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tag = '  <script src="/uet.js" defer></script>';
let updated = 0;
let alreadyPresent = 0;

async function visit(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if ([".git", "node_modules", ".wrangler", ".dist"].includes(entry.name)) continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await visit(target);
      continue;
    }
    if (!entry.isFile() || !entry.name.endsWith(".html")) continue;
    const html = await readFile(target, "utf8");
    if (html.includes('/uet.js')) {
      alreadyPresent += 1;
      continue;
    }
    if (!html.includes("</head>")) throw new Error(`Missing </head>: ${target}`);
    await writeFile(target, html.replace("</head>", `${tag}\n</head>`), "utf8");
    updated += 1;
  }
}

await visit(root);
console.log(JSON.stringify({ updated, alreadyPresent }));
