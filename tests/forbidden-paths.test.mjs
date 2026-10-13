import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { FORBIDDEN_LEGACY_PATHS } from "../src/lib/paths.mjs";

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

test("validate fails when forbidden legacy directory exists", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "aes-forbidden-"));
  fs.mkdirSync(path.join(tmp, ".harness", "skills"), { recursive: true });
  fs.mkdirSync(path.join(tmp, ".harness", "workspace"), { recursive: true });
  fs.writeFileSync(
    path.join(tmp, ".harness/project.yaml"),
    `schemaVersion: "2.0.0"
projectId: x
vcs: git
standards:
  repository: ai-engineering-standards
  version: "2.0.0"
`
  );
  fs.writeFileSync(path.join(tmp, ".harness/README.md"), "# harness\n");
  fs.writeFileSync(path.join(tmp, "AGENTS.md"), "# agents\n");
  const r = spawnSync(process.execPath, [path.join(root, "src/validate.mjs"), "--project", tmp], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(r.status, 1);
  const report = JSON.parse(r.stdout);
  assert.ok(report.configErrors.some((e) => e.includes(".harness/skills")));
  fs.rmSync(tmp, { recursive: true, force: true });
});
