import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { makeV3Project, validate } from "./helpers.mjs";

test("greenfield init + independent validate (strict)", () => {
  const tmp = makeV3Project("aes-green-");
  const val = validate(tmp, ["--strict"]);
  assert.equal(val.status, 0, val.stdout);

  const yaml = fs.readFileSync(path.join(tmp, ".harness/project.yaml"), "utf8");
  assert.match(yaml, /schemaVersion: "3.0.0"/);
  assert.match(yaml, /projectId: t/);

  // v3 required tree (contract §3.1)
  for (const rel of [
    ".harness/README.md",
    ".harness/workspace/changes/README.md",
    ".harness/workspace/archive/README.md",
    "docs/knowledge/README.md",
    "docs/rules/README.md",
  ]) {
    assert.ok(fs.existsSync(path.join(tmp, rel)), `missing ${rel}`);
  }
  // v2 placeholder is gone
  assert.equal(fs.existsSync(path.join(tmp, ".harness/workspace/.gitkeep")), false);

  const hreadme = fs.readFileSync(path.join(tmp, ".harness/README.md"), "utf8");
  assert.match(hreadme, /project\.yaml/);
  assert.doesNotMatch(hreadme, /project\.json/);
  fs.rmSync(tmp, { recursive: true, force: true });
});
