import fs from "node:fs";
import path from "node:path";
import { repoRoot, TEMPLATE_FILES, detectVcs } from "./paths.mjs";
import { scanLegacy } from "./legacy.mjs";

export function readVersion() {
  return fs.readFileSync(path.join(repoRoot(), "VERSION"), "utf8").trim();
}

export function substitute(content, vars) {
  return content.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
}

export function applyTemplates(opts) {
  const vcsInfo = opts.vcs ? { vcs: opts.vcs } : detectVcs(opts.project);
  if (vcsInfo.error) return { error: vcsInfo.error, results: [], legacy: [] };

  const today = new Date().toISOString().slice(0, 10);
  const vars = {
    PROJECT_ID: opts.projectId,
    PROJECT_DISPLAY_NAME: opts.displayName,
    STANDARDS_VERSION: readVersion(),
    VCS: vcsInfo.vcs,
    "YYYY-MM-DD": today,
  };

  const results = TEMPLATE_FILES.map((rel) => {
    const src = path.join(repoRoot(), "templates", "minimal", rel);
    const dest = path.join(opts.project, rel);
    if (!fs.existsSync(src)) throw new Error(`template missing: ${rel}`);
    if (fs.existsSync(dest) && !opts.force) {
      return { rel, action: "skip", reason: "CONFLICT_EXISTS" };
    }
    const text = substitute(fs.readFileSync(src, "utf8"), vars);
    if (opts.dryRun) return { rel, action: "would-write" };
    const existed = fs.existsSync(dest);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, text, "utf8");
    return { rel, action: existed && opts.force ? "overwrite" : "create" };
  });

  const legacy = scanLegacy(opts.project);
  return { results, legacy, vcs: vcsInfo.vcs };
}
