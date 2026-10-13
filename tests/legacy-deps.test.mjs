import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** v1 runtime paths only — not detection strings (see legacy.mjs / paths.mjs). */
const BANNED_PATTERNS = [
  /templates\/harness\//,
  /11-AI-DevTools/,
  /archive\/2026/,
  /skills\.yaml/,
  /sync\.mjs/,
];

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    if (name === "node_modules" || name === ".git") continue;
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, files);
    else if (p.endsWith(".mjs") || p.endsWith(".md")) files.push(p);
  }
  return files;
}

test("src/**/*.mjs do not reference v1 active runtime paths", () => {
  const srcDir = path.join(root, "src");
  const files = walk(srcDir);
  const hits = [];
  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    for (const pat of BANNED_PATTERNS) {
      if (pat.test(text)) hits.push(`${path.relative(root, file)}: ${pat}`);
    }
  }
  assert.deepEqual(hits, []);
});
