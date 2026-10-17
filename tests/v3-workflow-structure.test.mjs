import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { makeV3Project, validate, codes, setWorkflowTypes, root } from "./helpers.mjs";
import { TEMPLATE_FILES } from "../src/lib/paths.mjs";

const T = (tmp, ...rel) => path.join(tmp, ...rel);

test("templates/change artifact set exists (contract §4.2)", () => {
  for (const f of ["proposal.md", "tasks.md", "design.md", "verify.md"]) {
    const p = path.join(root, "templates", "change", f);
    assert.ok(fs.existsSync(p), `missing templates/change/${f}`);
  }
});

test("init generates the complete v3 tree (all TEMPLATE_FILES)", () => {
  const tmp = makeV3Project("aes-tree-");
  for (const rel of TEMPLATE_FILES) {
    assert.ok(fs.existsSync(T(tmp, rel)), `missing ${rel}`);
  }
  fs.rmSync(tmp, { recursive: true, force: true });
});

test("valid change units pass strict validation", () => {
  const tmp = makeV3Project("aes-wf-ok-");
  for (const [name, files] of [
    ["feature-pay-now-001", ["proposal.md", "tasks.md"]],
    ["bugfix-null-pointer-002", ["proposal.md", "tasks.md", "verify.md"]],
  ]) {
    fs.mkdirSync(T(tmp, ".harness/workspace/changes", name));
    for (const f of files) fs.writeFileSync(T(tmp, ".harness/workspace/changes", name, f), "x\n");
  }
  const val = validate(tmp, ["--strict"]);
  assert.equal(val.status, 0, val.stdout);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test("invalid change names, missing artifacts and stray files produce warnings", () => {
  const tmp = makeV3Project("aes-wf-bad-");
  const ch = T(tmp, ".harness/workspace/changes");
  fs.mkdirSync(path.join(ch, "20261017-noname")); // no type/slug/NNN
  fs.mkdirSync(path.join(ch, "unknown-type-x-001")); // valid shape, unknown type
  fs.mkdirSync(path.join(ch, "feature-no-artifacts-003")); // missing proposal/tasks
  fs.writeFileSync(path.join(ch, "stray.txt"), "x\n"); // stray file at root
  fs.mkdirSync(path.join(ch, "feature")); // bare type name — not a valid change unit
  fs.writeFileSync(path.join(ch, "feature", "ok.md"), "x\n");

  const val = validate(tmp); // non-strict: warnings only → pass
  assert.equal(val.status, 0, val.stdout);
  const warned = codes(val.report, "warning");
  for (const expected of [
    "CHANGE_NAME_INVALID",
    "CHANGE_TYPE_UNKNOWN",
    "CHANGE_MISSING_ARTIFACT",
    "CHANGES_STRAY_FILE",
  ]) {
    assert.ok(warned.includes(expected), `expected ${expected} in ${JSON.stringify(warned)}`);
  }
  // nested "feature" dir is a name-invalid change unit too (no -slug-NNN)
  const strict = validate(tmp, ["--strict"]);
  assert.equal(strict.status, 1);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test("workflow.types override: custom types accepted, defaults rejected", () => {
  const tmp = makeV3Project("aes-wf-types-");
  setWorkflowTypes(tmp, ["feature", "hotfix"]);
  const ch = T(tmp, ".harness/workspace/changes");
  for (const name of ["hotfix-pay-bug-001", "ops-cleanup-002"]) {
    fs.mkdirSync(path.join(ch, name));
    fs.writeFileSync(path.join(ch, name, "proposal.md"), "x\n");
    fs.writeFileSync(path.join(ch, name, "tasks.md"), "x\n");
  }
  const val = validate(tmp);
  assert.equal(val.status, 0, val.stdout);
  const typeWarnings = val.report.findings.filter((f) => f.code === "CHANGE_TYPE_UNKNOWN");
  assert.deepEqual(typeWarnings.map((f) => f.path), [".harness/workspace/changes/ops-cleanup-002"]);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test("archive naming: date prefix and verify.md enforced; v1-legacy vault exempt", () => {
  const tmp = makeV3Project("aes-wf-arch-");
  const ar = T(tmp, ".harness/workspace/archive");
  fs.mkdirSync(path.join(ar, "20261017-feature-old-001"));
  fs.writeFileSync(path.join(ar, "20261017-feature-old-001", "verify.md"), "v\n");
  fs.mkdirSync(path.join(ar, "feature-no-prefix-002")); // missing YYYYMMDD prefix
  fs.mkdirSync(path.join(ar, "20261018-feature-noverify-003")); // missing verify.md
  fs.mkdirSync(path.join(ar, "v1-legacy")); // sanctioned vault, exempt

  const val = validate(tmp);
  assert.equal(val.status, 0, val.stdout);
  const w = val.report.findings.filter((f) => f.level === "warning");
  assert.deepEqual(
    w.map((f) => f.code).sort(),
    ["ARCHIVE_MISSING_VERIFY", "ARCHIVE_NAME_INVALID"].sort(),
  );
  fs.rmSync(tmp, { recursive: true, force: true });
});
