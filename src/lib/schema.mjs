import fs from "node:fs";
import path from "node:path";

/**
 * Minimal validator for project-config.schema.json required shape.
 * Intentionally dependency-free (no Ajv); expand with contract changes.
 */
export function validateProjectConfig(obj) {
  const errors = [];
  if (!obj || typeof obj !== "object") {
    return ["project.json must be a JSON object"];
  }
  if (obj.schemaVersion !== "2.0.0") {
    errors.push("schemaVersion must be 2.0.0");
  }
  if (typeof obj.projectId !== "string" || !/^[a-z0-9][a-z0-9-]{0,62}$/.test(obj.projectId)) {
    errors.push("projectId must match ^[a-z0-9][a-z0-9-]{0,62}$");
  }
  const s = obj.standards;
  if (!s || s.repository !== "ai-engineering-standards" || typeof s.version !== "string") {
    errors.push("standards.repository and standards.version are required");
  }
  if (s?.contract && s.contract !== "contract/harness-contract.md") {
    errors.push("standards.contract must be contract/harness-contract.md when set");
  }
  return errors;
}

export function loadProjectJson(projectRoot) {
  const p = path.join(projectRoot, ".harness", "project.json");
  if (!fs.existsSync(p)) return { errors: ["missing .harness/project.json"], data: null };
  try {
    const data = JSON.parse(fs.readFileSync(p, "utf8"));
    return { errors: validateProjectConfig(data), data };
  } catch (e) {
    return { errors: [`invalid JSON: ${e.message}`], data: null };
  }
}
