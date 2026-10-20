import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function repoRoot() {
  return path.resolve(__dirname, "..", "..");
}

export const LAYER0_LAYOUT = [
  "README.md",
  "VERSION",
  "CHANGELOG.md",
  "LICENSE",
  "contract/harness-contract.md",
  "contract/adoption-contract.md",
  "contract/migration-guide.md",
  "contract/project-config.schema.json",
  "templates/minimal",
  "templates/change",
  "templates/bootstrap",
  "src/init.mjs",
  "src/adopt.mjs",
  "src/validate.mjs",
  "examples/new-project",
  "examples/existing-project",
  "tests",
];

export const TEMPLATE_FILES = [
  "AGENTS.md",
  ".harness/project.yaml",
  ".harness/README.md",
  ".harness/workspace/changes/README.md",
  ".harness/workspace/archive/README.md",
  "docs/knowledge/README.md",
  "docs/rules/README.md",
];

export const CONSUMER_REQUIRED = [
  ".harness/project.yaml",
  ".harness/README.md",
  ".harness/workspace",
  ".harness/workspace/changes",
  ".harness/workspace/archive",
  "docs/knowledge/README.md",
  "docs/rules/README.md",
];

/** Contract §3.3 — paths that must not exist as parallel SSOT in consumer projects. */
export const FORBIDDEN_LEGACY_PATHS = [
  ".harness/harness.yaml",
  ".harness/rules",
  ".harness/skills",
  ".harness/knowledge",
  ".harness/wiki",
  ".standards",
];

/** Contract §4.1 — default change types (overridable via project.yaml workflow.types). */
export const DEFAULT_CHANGE_TYPES = ["feature", "bugfix", "refactor", "docs", "ops"];

/** Contract §4.1 — {type}-{slug}-{NNN}; archive adds a YYYYMMDD- prefix. */
export const CHANGE_DIR_RE = /^([a-z][a-z0-9-]*)-([a-z0-9]+(?:-[a-z0-9]+)*)-(\d{3})$/;
export const ARCHIVE_PREFIX_RE = /^\d{8}-/;
/** Migration-guide §2.3 — sanctioned v1 legacy vault inside archive/ (name-check exempt). */
export const ARCHIVE_VAULT_DIRS = new Set(["v1-legacy"]);

/** Contract §6 red line 1 — v1 standards-tree subdirectory signature (>=3 in one parent). */
export const STANDARDS_TREE_SIGNATURE = new Set([
  "rules",
  "skills",
  "checks",
  "workflows",
  "governance",
  "specs",
  "adapters",
  "mcp",
]);
export const STANDARDS_TREE_MIN_HITS = 3;
/** Contract §5.1 — legacy vault under docs/, exempt from red-line scans. */
export const DOCS_LEGACY_EXEMPT = "_legacy";

/** Contract §6 red line 2 — thick AI-rule adapter detection. */
export const AI_RULE_FILES = ["AI_RULES.md", ".cursorrules", ".windsurfrules", "CLAUDE.md"];
export const THICK_RULE_MAX_LINES = 60;
export const THICK_RULE_PATTERNS = [
  /L0\s*-\s*Safety/i,
  /L1\s*-\s*Confirmation/i,
  /L4\s*-\s*Output/i,
];

/** Contract §5.2 — knowledge traceability heading. */
export const KNOWLEDGE_CHANGELOG_HEADING = "## 变更记录";
export const KNOWLEDGE_DIR = "docs/knowledge";

/** Contract §4.4 — acceptance-criteria evidence IDs cited by proposal/verify. */
export const AC_ID_RE = /AC-\d+/;
/** Contract §4.2 — optional change-unit artifacts (convention only, no machine enforcement). */
export const CHANGE_OPTIONAL_ARTIFACTS = ["explore.md", "retro.md"];
/** Contract §12 — garden (info-level) finding codes; never affect ok/exit code. */
export const GARDEN_CODES = {
  acNotAdopted: "GARDEN_AC_NOT_ADOPTED",
  verifyAcGap: "GARDEN_VERIFY_AC_GAP",
  retroMissing: "GARDEN_RETRO_MISSING",
};

export function detectVcs(projectRoot) {
  const hasGit = fs.existsSync(path.join(projectRoot, ".git"));
  const hasSvn = fs.existsSync(path.join(projectRoot, ".svn"));
  if (hasGit && hasSvn) return { vcs: null, error: "AMBIGUOUS_VCS" };
  if (hasGit) return { vcs: "git" };
  if (hasSvn) return { vcs: "svn" };
  // Contract §4 — SVN 1.7+ keeps .svn only at WC root; git keeps .git at repo root.
  // Walk ancestors so a project nested inside a checkout is still detected.
  let dir = path.dirname(path.resolve(projectRoot));
  for (let depth = 0; depth < 40; depth += 1) {
    const parent = path.dirname(dir);
    if (parent === dir) break; // filesystem root
    const ancGit = fs.existsSync(path.join(dir, ".git"));
    const ancSvn = fs.existsSync(path.join(dir, ".svn"));
    if (ancGit && ancSvn) return { vcs: null, error: "AMBIGUOUS_VCS" };
    if (ancSvn) return { vcs: "svn" };
    if (ancGit) return { vcs: "git" };
    dir = parent;
  }
  return { vcs: "git" };
}
