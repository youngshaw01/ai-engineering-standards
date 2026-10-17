/** Shared helpers for v3 consumer-project tests. Not a test file. */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function run(script, args) {
  return spawnSync(process.execPath, [path.join(root, script), ...args], {
    cwd: root,
    encoding: "utf8",
  });
}

/** Create a fully v3-valid consumer project via init. */
export function makeV3Project(prefix = "aes-v3-") {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  const r = run("src/init.mjs", ["--project", tmp, "--project-id", "t", "--display-name", "T"]);
  if (r.status !== 0) throw new Error(`init failed: ${r.stdout}${r.stderr}`);
  return tmp;
}

/** Run validate; parse json report when possible. */
export function validate(tmp, extraArgs = []) {
  const r = run("src/validate.mjs", ["--project", tmp, ...extraArgs]);
  let report = null;
  try {
    report = JSON.parse(r.stdout);
  } catch {}
  return { status: r.status, report, stdout: r.stdout, stderr: r.stderr };
}

/** Finding codes, optionally filtered by level ("error" | "warning"). */
export function codes(report, level) {
  return (report?.findings ?? [])
    .filter((f) => !level || f.level === level)
    .map((f) => f.code);
}

/** Append a top-level workflow.types section to project.yaml. */
export function setWorkflowTypes(tmp, types) {
  fs.appendFileSync(
    path.join(tmp, ".harness/project.yaml"),
    `\nworkflow:\n  types: [${types.join(", ")}]\n`,
    "utf8",
  );
}
