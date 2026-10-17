import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { makeV3Project, validate, codes } from "./helpers.mjs";

test("v2 schemaVersion fails validation with a migration-guide pointer", () => {
  const tmp = makeV3Project("aes-v2-");
  const yaml = path.join(tmp, ".harness/project.yaml");
  fs.writeFileSync(yaml, fs.readFileSync(yaml, "utf8").replace('schemaVersion: "3.0.0"', 'schemaVersion: "2.0.0"'), "utf8");

  const val = validate(tmp);
  assert.equal(val.status, 1);
  const errs = codes(val.report, "error");
  assert.ok(errs.includes("SCHEMA"), `expected SCHEMA in ${JSON.stringify(errs)}`);
  assert.ok(errs.includes("SCHEMA_VERSION_V2"));
  const hit = val.report.findings.find((f) => f.code === "SCHEMA_VERSION_V2");
  assert.match(hit.message, /migration-guide\.md/);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test("v2-shaped project also reports the structural gap (changes/archive/docs)", () => {
  // Simulate a real v2 consumer: schemaVersion 2.0.0 + old workspace layout (no changes/archive, no docs)
  const tmp = makeV3Project("aes-v2-shape-");
  fs.rmSync(path.join(tmp, ".harness/workspace/changes"), { recursive: true, force: true });
  fs.rmSync(path.join(tmp, ".harness/workspace/archive"), { recursive: true });
  fs.rmSync(path.join(tmp, "docs"), { recursive: true, force: true });
  const yaml = path.join(tmp, ".harness/project.yaml");
  fs.writeFileSync(yaml, fs.readFileSync(yaml, "utf8").replace('schemaVersion: "3.0.0"', 'schemaVersion: "2.0.0"'), "utf8");

  const val = validate(tmp);
  assert.equal(val.status, 1);
  const errs = codes(val.report, "error");
  assert.ok(errs.includes("SCHEMA_VERSION_V2"));
  assert.ok(errs.includes("MISSING_REQUIRED"));
  const missing = val.report.findings.filter((f) => f.code === "MISSING_REQUIRED").map((f) => f.path);
  for (const p of [".harness/workspace/changes", ".harness/workspace/archive", "docs/knowledge/README.md", "docs/rules/README.md"]) {
    assert.ok(missing.includes(p), `expected ${p} in ${JSON.stringify(missing)}`);
  }
  fs.rmSync(tmp, { recursive: true, force: true });
});

test("bumping schemaVersion back to 3.0.0 clears the schema errors", () => {
  const tmp = makeV3Project("aes-v2-fix-");
  const yaml = path.join(tmp, ".harness/project.yaml");
  fs.writeFileSync(yaml, fs.readFileSync(yaml, "utf8").replace('schemaVersion: "3.0.0"', 'schemaVersion: "2.0.0"'), "utf8");
  fs.writeFileSync(yaml, fs.readFileSync(yaml, "utf8").replace('schemaVersion: "2.0.0"', 'schemaVersion: "3.0.0"'), "utf8");
  const val = validate(tmp, ["--strict"]);
  assert.equal(val.status, 0, val.stdout);
  fs.rmSync(tmp, { recursive: true, force: true });
});
