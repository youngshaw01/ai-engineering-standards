import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function runInit(target) {
  return spawnSync(
    process.execPath,
    ["src/init.mjs", "--project", target, "--project-id", "test-proj", "--display-name", "Test"],
    { cwd: root, encoding: "utf8" }
  );
}

test("init is idempotent on empty directory", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "aes-init-"));
  const first = runInit(tmp);
  assert.equal(first.status, 0, first.stdout);
  const second = runInit(tmp);
  assert.equal(second.status, 2, "second run should report conflicts");
  const val = spawnSync(process.execPath, ["src/validate.mjs", "--project", tmp], { cwd: root, encoding: "utf8" });
  assert.equal(val.status, 0, val.stdout);
  fs.rmSync(tmp, { recursive: true, force: true });
});
