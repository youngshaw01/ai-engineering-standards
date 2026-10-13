import fs from "node:fs";
import path from "node:path";
import { parseProjectYaml } from "./yaml.mjs";
import { assertSchemaSupported, validateJsonSchema } from "./json-schema.mjs";

export function loadSchema(repoRoot) {
  const p = path.join(repoRoot, "contract", "project-config.schema.json");
  const schema = JSON.parse(fs.readFileSync(p, "utf8"));
  assertSchemaSupported(schema);
  return schema;
}

export function validateAgainstSchema(obj, schema) {
  return validateJsonSchema(obj, schema);
}

export function loadProjectConfig(projectRoot, standardsRepoRoot) {
  const yamlPath = path.join(projectRoot, ".harness", "project.yaml");
  if (!fs.existsSync(yamlPath)) return { errors: ["missing .harness/project.yaml"], data: null };
  try {
    const data = parseProjectYaml(fs.readFileSync(yamlPath, "utf8"));
    if (!data.standards) data.standards = {};
    if (!data.standards.contract) data.standards.contract = "contract/harness-contract.md";
    const schema = loadSchema(standardsRepoRoot);
    return { errors: validateAgainstSchema(data, schema), data };
  } catch (e) {
    return { errors: [`yaml parse: ${e.message}`], data: null };
  }
}
