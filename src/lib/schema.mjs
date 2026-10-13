import fs from "node:fs";
import path from "node:path";
import { parseProjectYaml } from "./yaml.mjs";

export function loadSchema(repoRoot) {
  const p = path.join(repoRoot, "contract", "project-config.schema.json");
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

export function validateAgainstSchema(obj, schema) {
  const errors = [];
  const req = schema.required || [];
  for (const k of req) {
    if (obj[k] === undefined) errors.push(`missing required: ${k}`);
  }
  if (obj.schemaVersion !== "2.0.0") errors.push("schemaVersion must be 2.0.0");
  if (obj.projectId && !/^[a-z0-9][a-z0-9-]{0,62}$/.test(obj.projectId)) {
    errors.push("projectId pattern invalid");
  }
  if (obj.vcs && !["git", "svn"].includes(obj.vcs)) errors.push("vcs must be git or svn");
  const s = obj.standards;
  if (!s || s.repository !== "ai-engineering-standards") errors.push("standards.repository invalid");
  if (!s?.version) errors.push("standards.version required");
  if (s?.contract && s.contract !== "contract/harness-contract.md") {
    errors.push("standards.contract must be contract/harness-contract.md");
  }
  return errors;
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
