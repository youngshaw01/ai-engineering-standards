import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("adopt blocks legacy harness.yaml without acknowledge", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "aes-legacy-"));
  fs.mkdirSync(path.join(tmp, ".harness"), { recursive: true });
  fs.writeFileSync(path.join(tmp, ".harness/harness.yaml"), "version: 1\n");
  const r = spawnSync(process.execPath, [path.join(root, "src/adopt.mjs"), "--project", tmp], { cwd: root, encoding: "utf8" });
  assert.equal(r.status, 3);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test("adopt respects existing AGENTS.md conflict", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "aes-agents-"));
  fs.writeFileSync(path.join(tmp, "AGENTS.md"), "# existing\n");
  const r = spawnSync(process.execPath, [path.join(root, "src/adopt.mjs"), "--project", tmp], { cwd: root, encoding: "utf8" });
  assert.equal(r.status, 2);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test("svn working copy defaults vcs svn", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "aes-svn-"));
  fs.mkdirSync(path.join(tmp, ".svn"), { recursive: true });
  const r = spawnSync(
    process.execPath,
    [path.join(root, "src/init.mjs"), "--project", tmp, "--project-id", "svn-demo", "--display-name", "S"],
    { cwd: root, encoding: "utf8" }
  );
  assert.equal(r.status, 0, r.stdout);
  const yaml = fs.readFileSync(path.join(tmp, ".harness/project.yaml"), "utf8");
  assert.match(yaml, /vcs: svn/);
  fs.rmSync(tmp, { recursive: true, force: true });
});
