import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { makeV3Project, validate, codes } from "./helpers.mjs";

const SIG = ["rules", "skills", "checks"]; // 3 of the 8 signature dirs — enough to trip the line

test("standards-tree copy under docs/ is a red-line error", () => {
  const tmp = makeV3Project("aes-tree-copy-");
  for (const d of SIG) fs.mkdirSync(path.join(tmp, "docs", "harness", d), { recursive: true });
  const val = validate(tmp);
  assert.equal(val.status, 1);
  assert.ok(codes(val.report, "error").includes("REDLINE_STANDARDS_TREE"));
  const hit = val.report.findings.find((f) => f.code === "REDLINE_STANDARDS_TREE");
  assert.equal(hit.path, "docs/harness");
  fs.rmSync(tmp, { recursive: true, force: true });
});

test("two signature dirs stay below the threshold", () => {
  const tmp = makeV3Project("aes-tree-two-");
  for (const d of SIG.slice(0, 2)) fs.mkdirSync(path.join(tmp, "docs", "harness", d), { recursive: true });
  const val = validate(tmp, ["--strict"]);
  assert.equal(val.status, 0, val.stdout);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test("docs/_legacy vault is exempt from the red-line scan", () => {
  const tmp = makeV3Project("aes-tree-leg-");
  for (const d of SIG) fs.mkdirSync(path.join(tmp, "docs", "_legacy", "harness", d), { recursive: true });
  const val = validate(tmp, ["--strict"]);
  assert.equal(val.status, 0, val.stdout);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test("signature dirs nested deeper in docs/ are still detected", () => {
  const tmp = makeV3Project("aes-tree-deep-");
  for (const d of ["specs", "adapters", "mcp"]) fs.mkdirSync(path.join(tmp, "docs", "a", "b", d), { recursive: true });
  const val = validate(tmp);
  assert.equal(val.status, 1);
  assert.ok(codes(val.report, "error").includes("REDLINE_STANDARDS_TREE"));
  fs.rmSync(tmp, { recursive: true, force: true });
});
