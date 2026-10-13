import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function run(cmd, args, cwd) {
  return spawnSync(process.execPath, [cmd, ...args], { cwd, encoding: "utf8" });
}

test("greenfield init + independent validate", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "aes-green-"));
  const init = run(path.join(root, "src/init.mjs"), ["--project", tmp, "--project-id", "demo", "--display-name", "Demo"], root);
  assert.equal(init.status, 0, init.stdout + init.stderr);
  const val = run(path.join(root, "src/validate.mjs"), ["--project", tmp], root);
  assert.equal(val.status, 0, val.stdout);
  const yaml = fs.readFileSync(path.join(tmp, ".harness/project.yaml"), "utf8");
  assert.match(yaml, /schemaVersion: "2.0.0"/);
  assert.match(yaml, /projectId: demo/);
  const hreadme = fs.readFileSync(path.join(tmp, ".harness/README.md"), "utf8");
  assert.match(hreadme, /project\.yaml/);
  assert.doesNotMatch(hreadme, /project\.json/);
  fs.rmSync(tmp, { recursive: true, force: true });
});
