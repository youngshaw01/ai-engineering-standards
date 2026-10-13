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
  "contract/project-config.schema.json",
  "templates/minimal",
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
  ".harness/workspace/.gitkeep",
];

export const CONSUMER_REQUIRED = [
  ".harness/project.yaml",
  ".harness/README.md",
  ".harness/workspace",
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

export function detectVcs(projectRoot) {
  const hasGit = fs.existsSync(path.join(projectRoot, ".git"));
  const hasSvn = fs.existsSync(path.join(projectRoot, ".svn"));
  if (hasGit && hasSvn) return { vcs: null, error: "AMBIGUOUS_VCS" };
  if (hasGit) return { vcs: "git" };
  if (hasSvn) return { vcs: "svn" };
  return { vcs: "git" };
}
