import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { FORBIDDEN_LEGACY_PATHS } from "../src/lib/paths.mjs";
import { makeV3Project, run, validate, codes } from "./helpers.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("FORBIDDEN_LEGACY_PATHS matches contract §3.3 list", () => {
  assert.deepEqual(FORBIDDEN_LEGACY_PATHS, [
    ".harness/harness.yaml",
    ".harness/rules",
    ".harness/skills",
    ".harness/knowledge",
    ".harness/wiki",
    ".standards",
  ]);
});

test("adopt does not block on forbidden paths; validate does", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "aes-boundary-"));
  fs.mkdirSync(path.join(tmp, ".harness", "wiki"), { recursive: true });
  const adopt = run("src/adopt.mjs", ["--project", tmp]);
  assert.equal(adopt.status, 0, adopt.stdout + adopt.stderr);
  const val = validate(tmp);
  assert.equal(val.status, 1);
  assert.ok(codes(val.report, "error").includes("FORBIDDEN_PATH"));
  assert.ok(val.report.findings.some((f) => f.code === "FORBIDDEN_PATH" && f.path === ".harness/wiki"));
  fs.rmSync(tmp, { recursive: true, force: true });
});

test("validate fails when forbidden legacy directory exists on a v3-complete project", () => {
  const tmp = makeV3Project("aes-forbidden-");
  fs.mkdirSync(path.join(tmp, ".harness", "skills"), { recursive: true });
  const val = validate(tmp);
  assert.equal(val.status, 1);
  // The forbidden path is the only error on an otherwise valid project
  assert.deepEqual(codes(val.report, "error"), ["FORBIDDEN_PATH"]);
  assert.ok(val.report.findings.some((f) => f.code === "FORBIDDEN_PATH" && f.path === ".harness/skills"));
  fs.rmSync(tmp, { recursive: true, force: true });
});
