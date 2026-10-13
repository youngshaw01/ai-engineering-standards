import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { TEMPLATE_FILES } from "../src/lib/paths.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function run(script, args) {
  return spawnSync(process.execPath, [path.join(root, script), ...args], { cwd: root, encoding: "utf8" });
}

test("cold start: empty directory init then independent validate", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "aes-cold-empty-"));
  const init = run("src/init.mjs", ["--project", tmp, "--project-id", "cold", "--display-name", "Cold"]);
  assert.equal(init.status, 0, init.stdout + init.stderr);
  const val = run("src/validate.mjs", ["--project", tmp]);
  assert.equal(val.status, 0, val.stdout);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test("cold start: existing project adopt dry-run matches plan and does not write", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "aes-cold-existing-"));
  fs.mkdirSync(path.join(tmp, "src"), { recursive: true });
  fs.writeFileSync(path.join(tmp, "README.md"), "# legacy app\n");
  fs.writeFileSync(path.join(tmp, "src/app.mjs"), "export {};\n");

  const adopt = run("src/adopt.mjs", [
    "--project",
    tmp,
    "--dry-run",
    "--project-id",
    "legacy",
    "--display-name",
    "Legacy",
  ]);
  assert.equal(adopt.status, 0, adopt.stdout + adopt.stderr);
  const out = JSON.parse(adopt.stdout);
  assert.equal(out.dryRun, true);
  assert.deepEqual(out.summary.wouldWrite, TEMPLATE_FILES);
  assert.deepEqual(out.summary.skip, []);
  assert.deepEqual(out.summary.create, []);
  assert.deepEqual(out.summary.overwrite, []);

  for (const rel of TEMPLATE_FILES) {
    assert.equal(fs.existsSync(path.join(tmp, rel)), false, `should not write ${rel}`);
  }
  assert.equal(fs.existsSync(path.join(tmp, "AGENTS.md")), false);
  fs.rmSync(tmp, { recursive: true, force: true });
});
