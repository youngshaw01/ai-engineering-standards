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
