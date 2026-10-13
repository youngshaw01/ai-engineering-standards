import fs from "node:fs";
import path from "node:path";
import { parseProjectYaml } from "./yaml.mjs";

export function scanLegacy(projectRoot) {
  const flags = [];
  const hy = path.join(projectRoot, ".harness", "harness.yaml");
  if (fs.existsSync(hy)) flags.push("LEGACY_V1_HARNESS_YAML");
  const pj = path.join(projectRoot, ".harness", "project.yaml");
  if (fs.existsSync(pj)) {
    try {
      const t = fs.readFileSync(pj, "utf8");
      if (t.includes("apiVersion:") && t.includes("harness.blueprint/v1")) {
        flags.push("LEGACY_V1_BLUEPRINT");
      } else {
        const o = parseProjectYaml(t);
        if (o.schemaVersion !== "2.0.0" && o.apiVersion) flags.push("LEGACY_V1_BLUEPRINT");
      }
    } catch {
      flags.push("LEGACY_V1_BLUEPRINT");
    }
  }
  if (fs.existsSync(path.join(projectRoot, ".harness", "project.json"))) {
    flags.push("LEGACY_V2_JSON");
  }
  return flags;
}

export function hasBlockingLegacy(flags) {
  return flags.some((f) => f === "LEGACY_V1_HARNESS_YAML" || f === "LEGACY_V1_BLUEPRINT");
}
