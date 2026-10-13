import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Layer 0 repo root (parent of src/) */
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
  "contract/rebuild-checklist.md",
  "templates/minimal",
  "src/init.mjs",
  "src/validate.mjs",
  "examples/new-project",
  "examples/existing-project",
  "tests",
];

/** Files init may materialize (relative to consumer repo root) */
export const TEMPLATE_FILES = [
  "AGENTS.md",
  ".harness/project.json",
  ".harness/README.md",
  ".harness/workspace/.gitkeep",
];

export const CONSUMER_REQUIRED = [
  ".harness/project.json",
  ".harness/README.md",
  ".harness/workspace",
];
