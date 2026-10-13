#!/usr/bin/env node
/**
 * v2 Clean-room validate — Layer 0 self-check or consumer --project.
 */
import fs from "node:fs";
import path from "node:path";
import { repoRoot, LAYER0_LAYOUT, CONSUMER_REQUIRED } from "./lib/paths.mjs";
import { loadProjectJson } from "./lib/schema.mjs";

function parseArgs(argv) {
  const opts = { mode: "layer0", project: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--project" && argv[i + 1]) {
      opts.mode = "consumer";
      opts.project = path.resolve(argv[++i]);
    } else if (a === "--help") {
      console.log("Usage: node src/validate.mjs [--project <consumer-repo>]");
      process.exit(0);
    }
  }
  return opts;
}

function validateLayer0(root) {
  const missing = LAYER0_LAYOUT.filter((rel) => !fs.existsSync(path.join(root, rel)));
  return { ok: missing.length === 0, missing };
}

function validateConsumer(projectRoot) {
  const missing = CONSUMER_REQUIRED.filter((rel) => !fs.existsSync(path.join(projectRoot, rel)));
  const { errors, data } = loadProjectJson(projectRoot);
  const legacy = [];
  if (fs.existsSync(path.join(projectRoot, ".harness", "harness.yaml"))) legacy.push("LEGACY_V1_PRESENT");
  if (fs.existsSync(path.join(projectRoot, ".harness", "project.yaml"))) legacy.push("LEGACY_V1_PRESENT");
  const ok = missing.length === 0 && errors.length === 0;
  return { ok, missing, configErrors: errors, projectId: data?.projectId, legacy };
}

function main() {
  const opts = parseArgs(process.argv);
  const report =
    opts.mode === "layer0"
      ? { tool: "validate", target: "layer0", ...validateLayer0(repoRoot()) }
      : { tool: "validate", target: opts.project, ...validateConsumer(opts.project) };
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exit(1);
}

main();
