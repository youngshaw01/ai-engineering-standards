import path from "node:path";

export function parseCommonArgs(argv) {
  const opts = {
    project: process.cwd(),
    dryRun: false,
    force: false,
    projectId: "my-project",
    displayName: "My Project",
    vcs: null,
    acknowledgeLegacy: false,
    strict: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") opts.dryRun = true;
    else if (a === "--force") opts.force = true;
    else if (a === "--strict") opts.strict = true;
    else if (a === "--acknowledge-legacy") opts.acknowledgeLegacy = true;
    else if (a === "--project" && argv[i + 1]) opts.project = path.resolve(argv[++i]);
    else if (a === "--project-id" && argv[i + 1]) opts.projectId = argv[++i];
    else if (a === "--display-name" && argv[i + 1]) opts.displayName = argv[++i];
    else if (a === "--vcs" && argv[i + 1]) opts.vcs = argv[++i];
  }
  return opts;
}
