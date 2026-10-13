import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function runInit(args) {
  return spawnSync(process.execPath, [path.join(root, "src/init.mjs"), ...args], { cwd: root, encoding: "utf8" });
}

test("init rejects unknown flags", () => {
  const r = runInit(["--project", ".", "--typo-flag"]);
  assert.equal(r.status, 1);
  const out = JSON.parse(r.stdout);
  assert.equal(out.error, "INVALID_ARGS");
});

test("init rejects invalid --vcs", () => {
  const r = runInit(["--project", ".", "--vcs", "hg"]);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /git or svn/);
});

test("init rejects --project without value", () => {
  const r = runInit(["--project"]);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /requires a value/);
});
