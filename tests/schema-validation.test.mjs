import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadSchema, validateAgainstSchema } from "../src/lib/schema.mjs";
import { assertSchemaSupported, collectUnsupportedSchemaKeywords } from "../src/lib/json-schema.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const valid = {
  schemaVersion: "3.0.0",
  projectId: "demo-app",
  vcs: "git",
  standards: { repository: "ai-engineering-standards", version: "3.0.0" },
};

test("schema accepts minimal valid config", () => {
  const schema = loadSchema(root);
  assert.deepEqual(validateAgainstSchema(valid, schema), []);
});

test("schema accepts optional workflow.types", () => {
  const schema = loadSchema(root);
  const errs = validateAgainstSchema(
    { ...valid, workflow: { types: ["feature", "bugfix", "hotfix"] } },
    schema,
  );
  assert.deepEqual(errs, []);
});

test("schema rejects empty workflow.types (minItems)", () => {
  const schema = loadSchema(root);
  const errs = validateAgainstSchema({ ...valid, workflow: { types: [] } }, schema);
  assert.ok(errs.some((e) => e.includes("minItems")));
});

test("schema rejects non-lowercase workflow type (pattern)", () => {
  const schema = loadSchema(root);
  const errs = validateAgainstSchema({ ...valid, workflow: { types: ["Feature"] } }, schema);
  assert.ok(errs.some((e) => e.includes("pattern")));
});

test("schema rejects duplicate workflow types (uniqueItems)", () => {
  const schema = loadSchema(root);
  const errs = validateAgainstSchema(
    { ...valid, workflow: { types: ["feature", "feature"] } },
    schema,
  );
  assert.ok(errs.some((e) => e.includes("unique")));
});

test("schema rejects non-string workflow type (items type)", () => {
  const schema = loadSchema(root);
  const errs = validateAgainstSchema({ ...valid, workflow: { types: [1] } }, schema);
  assert.ok(errs.length > 0);
});

test("schema rejects unknown workflow property", () => {
  const schema = loadSchema(root);
  const errs = validateAgainstSchema({ ...valid, workflow: { modes: ["a"] } }, schema);
  assert.ok(errs.some((e) => e.includes("additional property 'modes'")));
});

test("schema rejects unknown top-level fields", () => {
  const schema = loadSchema(root);
  const errs = validateAgainstSchema({ ...valid, extra: true }, schema);
  assert.ok(errs.some((e) => e.includes("additional property 'extra'")));
});

test("schema rejects v2 schemaVersion", () => {
  const schema = loadSchema(root);
  const errs = validateAgainstSchema({ ...valid, schemaVersion: "2.0.0" }, schema);
  assert.ok(errs.some((e) => e.includes("schemaVersion")));
});

test("schema rejects empty displayName", () => {
  const schema = loadSchema(root);
  const errs = validateAgainstSchema({ ...valid, displayName: "" }, schema);
  assert.ok(errs.some((e) => e.includes("minLength")));
});

test("schema rejects invalid adoptedAt", () => {
  const schema = loadSchema(root);
  const errs = validateAgainstSchema({ ...valid, adoptedAt: "2026/10/13" }, schema);
  assert.ok(errs.some((e) => e.includes("pattern")));
});

test("contract schema uses only supported JSON Schema keywords", () => {
  const schema = loadSchema(root);
  assert.deepEqual(collectUnsupportedSchemaKeywords(schema), []);
});

test("unsupported schema keyword fails closed", () => {
  const bad = {
    type: "object",
    properties: { x: { type: "string", format: "email" } },
  };
  assert.throws(() => assertSchemaSupported(bad), /unsupported schema keyword 'format'/);
});
