import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
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

test("validate rejects invalid --report value", () => {
  const r = spawnSync(process.execPath, [path.join(root, "src/validate.mjs"), "--project", ".", "--report", "xml"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(r.status, 1);
  const out = JSON.parse(r.stdout);
  assert.equal(out.error, "INVALID_ARGS");
  assert.match(r.stdout, /text or json/);
});

test("init accepts --report flag (ignored by init)", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "aes-report-init-"));
  const r = runInit(["--project", tmp, "--project-id", "r", "--display-name", "R", "--report", "text"]);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  fs.rmSync(tmp, { recursive: true, force: true });
});
