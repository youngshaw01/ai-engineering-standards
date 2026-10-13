import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadSchema, validateAgainstSchema } from "../src/lib/schema.mjs";
import { assertSchemaSupported, collectUnsupportedSchemaKeywords } from "../src/lib/json-schema.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const valid = {
  schemaVersion: "2.0.0",
  projectId: "demo-app",
  vcs: "git",
  standards: { repository: "ai-engineering-standards", version: "2.0.0" },
};

test("schema accepts minimal valid config", () => {
  const schema = loadSchema(root);
  assert.deepEqual(validateAgainstSchema(valid, schema), []);
});

test("schema rejects unknown top-level fields", () => {
  const schema = loadSchema(root);
  const errs = validateAgainstSchema({ ...valid, extra: true }, schema);
  assert.ok(errs.some((e) => e.includes("additional property 'extra'")));
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
