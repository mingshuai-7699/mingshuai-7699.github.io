import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const manifestPath = resolve("public/media-manifest.json");
const outputPath = resolve("offline/media-manifest.js");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

await writeFile(
  outputPath,
  `window.__PORTFOLIO_MANIFEST__ = ${JSON.stringify(manifest)};\n`,
  "utf8",
);

console.log(`Prepared offline manifest with ${manifest.entries.length} entries.`);
