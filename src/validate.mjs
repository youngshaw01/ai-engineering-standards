#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { repoRoot, LAYER0_LAYOUT, CONSUMER_REQUIRED, FORBIDDEN_LEGACY_PATHS } from "./lib/paths.mjs";
import { loadProjectConfig } from "./lib/schema.mjs";
import { scanLegacy } from "./lib/legacy.mjs";
import { parseCommonArgs } from "./lib/cli.mjs";

function validateLayer0(root) {
  const missing = LAYER0_LAYOUT.filter((rel) => !fs.existsSync(path.join(root, rel)));
  return { ok: missing.length === 0, missing };
}

function validateConsumer(projectRoot, standardsRoot, strict) {
  const missing = CONSUMER_REQUIRED.filter((rel) => !fs.existsSync(path.join(projectRoot, rel)));
  if (!fs.existsSync(path.join(projectRoot, "AGENTS.md"))) missing.push("AGENTS.md");
  const forbidden = FORBIDDEN_LEGACY_PATHS.filter((rel) => fs.existsSync(path.join(projectRoot, rel)));
  const { errors, data } = loadProjectConfig(projectRoot, standardsRoot);
  const legacy = scanLegacy(projectRoot);
  const configErrors = [...errors, ...forbidden.map((f) => `forbidden path: ${f}`)];
  const legacyBlocks = strict && legacy.some((l) => l.startsWith("LEGACY_V1"));
  const ok = missing.length === 0 && configErrors.length === 0 && !legacyBlocks;
  return { ok, missing, configErrors, projectId: data?.projectId, vcs: data?.vcs, legacy };
}

function main() {
  const opts = parseCommonArgs(process.argv);
  const root = repoRoot();
  const report = process.argv.includes("--project")
    ? { tool: "validate", target: opts.project, ...validateConsumer(opts.project, root, opts.strict) }
    : { tool: "validate", target: "layer0", ...validateLayer0(root) };
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exit(1);
}

main();
