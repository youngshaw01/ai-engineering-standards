import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function runInit(target) {
  return spawnSync(process.execPath, [path.join(root, "src/init.mjs"), "--project", target, "--project-id", "test-proj", "--display-name", "Test"], {
    cwd: root,
    encoding: "utf8",
  });
}

test("init is idempotent (second run conflicts)", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "aes-init-"));
  assert.equal(runInit(tmp).status, 0);
  assert.equal(runInit(tmp).status, 2);
  fs.rmSync(tmp, { recursive: true, force: true });
});
