import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { makeV3Project, run, validate } from "./helpers.mjs";

test("--report text renders a human-readable graded report", () => {
  const tmp = makeV3Project("aes-rpt-");
  fs.mkdirSync(path.join(tmp, ".harness/workspace/changes", "badname"));
  const r = run("src/validate.mjs", ["--project", tmp, "--report", "text"]);
  assert.equal(r.status, 0, r.stdout + r.stderr); // warnings only, non-strict
  assert.match(r.stdout, /WARNINGS:/);
  assert.match(r.stdout, /CHANGE_NAME_INVALID/);
  assert.match(r.stdout, /result: PASS/);
  assert.match(r.stdout, /warning\(s\)/);
  assert.doesNotMatch(r.stdout, /^\{/);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test("--report text under --strict shows FAIL and a next-step hint", () => {
  const tmp = makeV3Project("aes-rpt-strict-");
  fs.mkdirSync(path.join(tmp, ".harness/workspace/changes", "badname"));
  const r = run("src/validate.mjs", ["--project", tmp, "--strict", "--report", "text"]);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /result: FAIL/);
  assert.match(r.stdout, /next: warnings fail under --strict/);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test("default json report stays backward compatible and carries findings", () => {
  const tmp = makeV3Project("aes-rpt-json-");
  const val = validate(tmp); // no --report flag
  assert.equal(val.status, 0);
  assert.equal(typeof val.report.ok, "boolean");
  assert.ok(Array.isArray(val.report.findings));
  assert.deepEqual(val.report.findings, []);
  assert.equal(val.report.errorCount, 0);
  assert.equal(val.report.warningCount, 0);
  assert.equal(val.report.projectId, "t");
  fs.rmSync(tmp, { recursive: true, force: true });
});

test("--report json is accepted explicitly", () => {
  const tmp = makeV3Project("aes-rpt-json2-");
  const r = run("src/validate.mjs", ["--project", tmp, "--report", "json"]);
  assert.equal(r.status, 0, r.stdout);
  const report = JSON.parse(r.stdout);
  assert.ok(report.ok);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test("error reports point v2 projects at the migration guide", () => {
  const tmp = makeV3Project("aes-rpt-v2-");
  const yaml = path.join(tmp, ".harness/project.yaml");
  fs.writeFileSync(yaml, fs.readFileSync(yaml, "utf8").replace('"3.0.0"', '"2.0.0"'), "utf8");
  const r = run("src/validate.mjs", ["--project", tmp, "--report", "text"]);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /SCHEMA_VERSION_V2/);
  assert.match(r.stdout, /next: v2 → v3 upgrade steps — contract\/migration-guide\.md/);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test("layer0 mode renders text report too", () => {
  const r = run("src/validate.mjs", ["--report", "text"]);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /result: PASS/);
  assert.match(r.stdout, /no findings/);
});
