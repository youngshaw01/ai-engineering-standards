#!/usr/bin/env node
/**
 * v2 Clean-room init — copies templates/minimal only.
 * Does not read v1 paths, sealed tags, or legacy harness trees.
 */
import fs from "node:fs";
import path from "node:path";
import { repoRoot, TEMPLATE_FILES } from "./lib/paths.mjs";

function parseArgs(argv) {
  const opts = { project: process.cwd(), dryRun: false, force: false, projectId: "my-project", displayName: "My Project" };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") opts.dryRun = true;
    else if (a === "--force") opts.force = true;
    else if (a === "--project" && argv[i + 1]) opts.project = path.resolve(argv[++i]);
    else if (a === "--project-id" && argv[i + 1]) opts.projectId = argv[++i];
    else if (a === "--display-name" && argv[i + 1]) opts.displayName = argv[++i];
    else if (a === "--help") {
      console.log(`Usage: node src/init.mjs [--project <dir>] [--dry-run] [--force] [--project-id id] [--display-name name]`);
      process.exit(0);
    }
  }
  return opts;
}

function readVersion() {
  return fs.readFileSync(path.join(repoRoot(), "VERSION"), "utf8").trim();
}

function substitute(content, vars) {
  return content.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
}

function copyTemplateFile(rel, opts, vars) {
  const src = path.join(repoRoot(), "templates", "minimal", rel);
  const dest = path.join(opts.project, rel);
  if (!fs.existsSync(src)) throw new Error(`template missing: ${rel}`);
  if (fs.existsSync(dest) && !opts.force) {
    return { rel, action: "skip", reason: "CONFLICT_EXISTS" };
  }
  const text = substitute(fs.readFileSync(src, "utf8"), vars);
  if (opts.dryRun) return { rel, action: "would-write" };
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, text, "utf8");
  return { rel, action: opts.force && fs.existsSync(dest) ? "overwrite" : "create" };
}

function main() {
  const opts = parseArgs(process.argv);
  const today = new Date().toISOString().slice(0, 10);
  const vars = {
    PROJECT_ID: opts.projectId,
    PROJECT_DISPLAY_NAME: opts.displayName,
    STANDARDS_VERSION: readVersion(),
    "YYYY-MM-DD": today,
  };

  const results = TEMPLATE_FILES.map((rel) => copyTemplateFile(rel, opts, vars));
  const legacy = [];
  if (fs.existsSync(path.join(opts.project, ".harness", "harness.yaml"))) legacy.push("LEGACY_V1_PRESENT:.harness/harness.yaml");
  if (fs.existsSync(path.join(opts.project, ".harness", "project.yaml"))) legacy.push("LEGACY_V1_PRESENT:.harness/project.yaml");

  console.log(JSON.stringify({ tool: "init", project: opts.project, dryRun: opts.dryRun, results, legacy }, null, 2));
  const conflicts = results.filter((r) => r.reason === "CONFLICT_EXISTS");
  if (conflicts.length && !opts.force) process.exit(2);
}

main();
