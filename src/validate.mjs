#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {
  repoRoot,
  LAYER0_LAYOUT,
  CONSUMER_REQUIRED,
  FORBIDDEN_LEGACY_PATHS,
  DEFAULT_CHANGE_TYPES,
  CHANGE_DIR_RE,
  ARCHIVE_PREFIX_RE,
  ARCHIVE_VAULT_DIRS,
  STANDARDS_TREE_SIGNATURE,
  STANDARDS_TREE_MIN_HITS,
  DOCS_LEGACY_EXEMPT,
  AI_RULE_FILES,
  THICK_RULE_MAX_LINES,
  THICK_RULE_PATTERNS,
  KNOWLEDGE_CHANGELOG_HEADING,
  KNOWLEDGE_DIR,
} from "./lib/paths.mjs";
import { loadProjectConfig } from "./lib/schema.mjs";
import { scanLegacy } from "./lib/legacy.mjs";
import { parseCommonArgs, exitOnCliErrors } from "./lib/cli.mjs";
import { formatReport } from "./lib/report.mjs";

function walkFiles(root, out = []) {
  for (const e of fs.readdirSync(root, { withFileTypes: true })) {
    const p = path.join(root, e.name);
    if (e.isDirectory()) walkFiles(p, out);
    else out.push(p);
  }
  return out;
}

function validateLayer0(root) {
  const findings = [];
  const missing = [];
  for (const rel of LAYER0_LAYOUT) {
    if (!fs.existsSync(path.join(root, rel))) {
      missing.push(rel);
      findings.push({ level: "error", code: "MISSING_LAYER0", path: rel, message: "Layer 0 required path missing" });
    }
  }
  return { ok: missing.length === 0, missing, findings };
}

/** Contract §6 red line 1 — standards-tree copy detection under docs/ (docs/_legacy exempt). */
function checkStandardsTreeCopy(projectRoot, findings) {
  const docsDir = path.join(projectRoot, "docs");
  if (!fs.existsSync(docsDir)) return;
  const dirs = [docsDir];
  while (dirs.length) {
    const dir = dirs.pop();
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const hits = entries.filter(
      (e) => e.isDirectory() && STANDARDS_TREE_SIGNATURE.has(e.name.toLowerCase()),
    );
    if (hits.length >= STANDARDS_TREE_MIN_HITS) {
      findings.push({
        level: "error",
        code: "REDLINE_STANDARDS_TREE",
        path: path.relative(projectRoot, dir).split(path.sep).join("/"),
        message: `standards-tree copy: ${hits.map((h) => h.name).join(", ")} (contract §6 red line 1; extract to docs/rules|knowledge then move to docs/_legacy)`,
      });
    }
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      if (dir === docsDir && e.name === DOCS_LEGACY_EXEMPT) continue;
      dirs.push(path.join(dir, e.name));
    }
  }
}

/** Contract §6 red line 2 — thick AI-rule adapter detection. */
function checkThickAiRules(projectRoot, findings) {
  for (const name of AI_RULE_FILES) {
    const p = path.join(projectRoot, name);
    if (!fs.existsSync(p) || !fs.statSync(p).isFile()) continue;
    const text = fs.readFileSync(p, "utf8");
    const lines = text.split(/\r?\n/);
    const matched = THICK_RULE_PATTERNS.filter((re) => re.test(text)).map((re) => re.source);
    if (lines.length > THICK_RULE_MAX_LINES || matched.length) {
      const why = [];
      if (lines.length > THICK_RULE_MAX_LINES) why.push(`${lines.length} lines > ${THICK_RULE_MAX_LINES}`);
      if (matched.length) why.push(`L0-L5 rule-body patterns (${matched.join(", ")})`);
      findings.push({
        level: "error",
        code: "REDLINE_THICK_AI_RULES",
        path: name,
        message: `thick AI-rule adapter (${why.join("; ")}); must be a thin pointer to AGENTS.md / standards library (contract §6 red line 2)`,
      });
    }
  }
}

/** Contract §4 — change-unit naming and artifact checks (warning level). */
function checkWorkflow(projectRoot, data, findings) {
  const types = Array.isArray(data?.workflow?.types) && data.workflow.types.length
    ? data.workflow.types
    : DEFAULT_CHANGE_TYPES;
  const workspace = path.join(projectRoot, ".harness", "workspace");
  const changesDir = path.join(workspace, "changes");
  const archiveDir = path.join(workspace, "archive");

  if (fs.existsSync(changesDir)) {
    for (const e of fs.readdirSync(changesDir, { withFileTypes: true })) {
      const rel = `.harness/workspace/changes/${e.name}`;
      if (!e.isDirectory() && e.name !== "README.md") {
        findings.push({ level: "warning", code: "CHANGES_STRAY_FILE", path: rel, message: "stray file at changes/ root; artifacts belong inside a change directory" });
        continue;
      }
      if (!e.isDirectory()) continue;
      checkChangeName(e.name, types, rel, findings);
      for (const artifact of ["proposal.md", "tasks.md"]) {
        if (!fs.existsSync(path.join(changesDir, e.name, artifact))) {
          findings.push({ level: "warning", code: "CHANGE_MISSING_ARTIFACT", path: `${rel}/${artifact}`, message: `in-progress change missing required artifact` });
        }
      }
    }
  }

  if (fs.existsSync(archiveDir)) {
    for (const e of fs.readdirSync(archiveDir, { withFileTypes: true })) {
      if (!e.isDirectory()) continue;
      const rel = `.harness/workspace/archive/${e.name}`;
      if (ARCHIVE_VAULT_DIRS.has(e.name)) continue;
      if (!ARCHIVE_PREFIX_RE.test(e.name)) {
        findings.push({ level: "warning", code: "ARCHIVE_NAME_INVALID", path: rel, message: "archive directory missing {YYYYMMDD}- prefix" });
        continue;
      }
      checkChangeName(e.name.slice(9), types, rel, findings);
      if (!fs.existsSync(path.join(archiveDir, e.name, "verify.md"))) {
        findings.push({ level: "warning", code: "ARCHIVE_MISSING_VERIFY", path: `${rel}/verify.md`, message: "archived change missing verify.md" });
      }
    }
  }
}

function checkChangeName(name, types, rel, findings) {
  // Deterministic parse: try each known type as the prefix (slug may contain hyphens).
  for (const t of types) {
    if (new RegExp(`^${t}-[a-z0-9]+(?:-[a-z0-9]+)*-\\d{3}$`).test(name)) return;
  }
  const m = CHANGE_DIR_RE.exec(name);
  if (m) {
    findings.push({ level: "warning", code: "CHANGE_TYPE_UNKNOWN", path: rel, message: `type '${m[1]}' not in [${types.join(", ")}]` });
  } else {
    findings.push({ level: "warning", code: "CHANGE_NAME_INVALID", path: rel, message: `expected {type}-{slug}-{NNN}, got: ${name}` });
  }
}

/** Contract §5.2 — knowledge changelog traceability (warning level). */
function checkKnowledgeChangelog(projectRoot, findings) {
  const kdir = path.join(projectRoot, KNOWLEDGE_DIR);
  if (!fs.existsSync(kdir)) return;
  for (const file of walkFiles(kdir)) {
    if (!file.endsWith(".md")) continue;
    const text = fs.readFileSync(file, "utf8");
    if (!text.includes(KNOWLEDGE_CHANGELOG_HEADING)) {
      findings.push({
        level: "warning",
        code: "KNOWLEDGE_NO_CHANGELOG",
        path: path.relative(projectRoot, file).split(path.sep).join("/"),
        message: `missing '${KNOWLEDGE_CHANGELOG_HEADING}' section (contract §5.2)`,
      });
    }
  }
}

function validateConsumer(projectRoot, standardsRoot, strict) {
  const findings = [];
  const missing = [];
  for (const rel of [...CONSUMER_REQUIRED, "AGENTS.md"]) {
    if (!fs.existsSync(path.join(projectRoot, rel))) {
      missing.push(rel);
      findings.push({ level: "error", code: "MISSING_REQUIRED", path: rel, message: "required path missing (contract §3.1)" });
    }
  }
  for (const rel of FORBIDDEN_LEGACY_PATHS) {
    if (fs.existsSync(path.join(projectRoot, rel))) {
      findings.push({ level: "error", code: "FORBIDDEN_PATH", path: rel, message: "forbidden legacy path (contract §3.3)" });
    }
  }

  const { errors, data } = loadProjectConfig(projectRoot, standardsRoot);
  const configErrors = [...errors];
  if (errors.length) {
    for (const e of errors) findings.push({ level: "error", code: "SCHEMA", path: ".harness/project.yaml", message: e });
    if (data?.schemaVersion === "2.0.0") {
      findings.push({
        level: "error",
        code: "SCHEMA_VERSION_V2",
        path: ".harness/project.yaml",
        message: "schemaVersion 2.0.0 → bump to 3.0.0 per contract/migration-guide.md",
      });
    }
  }

  checkStandardsTreeCopy(projectRoot, findings);
  checkThickAiRules(projectRoot, findings);
  checkWorkflow(projectRoot, data, findings);
  checkKnowledgeChangelog(projectRoot, findings);

  const legacy = scanLegacy(projectRoot);
  for (const code of legacy) {
    findings.push({ level: "warning", code, path: "", message: "legacy residue detected (adoption-contract §3)" });
  }

  const errorCount = findings.filter((f) => f.level === "error").length;
  const warningCount = findings.filter((f) => f.level === "warning").length;
  const ok = errorCount === 0 && (!strict || warningCount === 0);
  return {
    ok,
    missing,
    configErrors,
    findings,
    errorCount,
    warningCount,
    projectId: data?.projectId,
    vcs: data?.vcs,
    legacy,
  };
}

function main() {
  const { opts, errors } = parseCommonArgs(process.argv);
  if (exitOnCliErrors("validate", errors)) return;
  const root = repoRoot();
  const report = process.argv.includes("--project")
    ? { tool: "validate", target: opts.project, strict: opts.strict, ...validateConsumer(opts.project, root, opts.strict) }
    : { tool: "validate", target: "layer0", strict: opts.strict, ...validateLayer0(root) };
  console.log(formatReport(report, opts.report));
  if (!report.ok) process.exit(1);
}

main();
