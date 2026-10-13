import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const BANNED_PATTERNS = [
  /templates\/harness\//,
  /harness\.yaml/,
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

test("entrypoints do not reference v1 active paths", () => {
  const entrypoints = ["src/init.mjs", "src/adopt.mjs", "src/validate.mjs"].map((f) => path.join(root, f));
  const hits = [];
  for (const file of entrypoints) {
    const text = fs.readFileSync(file, "utf8");
    for (const pat of BANNED_PATTERNS) {
      if (pat.test(text)) hits.push(`${file}: ${pat}`);
    }
  }
  assert.deepEqual(hits, []);
});
