import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("validate layer0 passes on standards repo", () => {
  const r = spawnSync(process.execPath, [path.join(root, "src/validate.mjs")], { cwd: root, encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr || r.stdout);
});
