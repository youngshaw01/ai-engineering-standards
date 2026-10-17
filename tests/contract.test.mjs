import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LAYER0_LAYOUT } from "../src/lib/paths.mjs";
import { loadSchema, validateAgainstSchema } from "../src/lib/schema.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("Layer 0 layout matches contract list", () => {
  const missing = LAYER0_LAYOUT.filter((rel) => !fs.existsSync(path.join(root, rel)));
  assert.deepEqual(missing, []);
});

test("schema rejects invalid project config object", () => {
  const schema = loadSchema(root);
  const bad = validateAgainstSchema({ schemaVersion: "1.0.0", projectId: "x" }, schema);
  assert.ok(bad.length > 0);
});

test("harness-contract references adoption and schema files", () => {
  const text = fs.readFileSync(path.join(root, "contract/harness-contract.md"), "utf8");
  assert.match(text, /adoption-contract\.md/);
  assert.match(text, /project-config\.schema\.json/);
});

test("harness-contract v3 covers workspace workflow, knowledge placement and red lines", () => {
  const text = fs.readFileSync(path.join(root, "contract/harness-contract.md"), "utf8");
  assert.match(text, /schemaVersion.*3\.0\.0/s);
  assert.match(text, /workspace\/changes/);
  assert.match(text, /workspace\/archive/);
  assert.match(text, /docs\/knowledge/);
  assert.match(text, /docs\/rules/);
  assert.match(text, /migration-guide\.md/);
  assert.match(text, /变更记录/);
  assert.match(text, /红线/);
  assert.match(text, /warning/);
});
