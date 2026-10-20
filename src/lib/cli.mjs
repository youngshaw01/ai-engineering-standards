import path from "node:path";

const FLAG_VALUE = new Set(["--project", "--project-id", "--display-name", "--vcs", "--report"]);

const KNOWN_FLAGS = new Set([
  "--dry-run",
  "--force",
  "--strict",
  "--garden",
  "--acknowledge-legacy",
  "--project",
  "--project-id",
  "--display-name",
  "--vcs",
  "--report",
]);

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
    garden: false,
    report: "json",
  };
  const errors = [];

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) {
      errors.push(`unexpected argument: ${a}`);
      continue;
    }
    if (!KNOWN_FLAGS.has(a)) {
      errors.push(`unknown option: ${a}`);
      continue;
    }
    if (FLAG_VALUE.has(a)) {
      const v = argv[i + 1];
      if (!v || v.startsWith("--")) {
        errors.push(`${a} requires a value`);
        continue;
      }
      i++;
      if (a === "--project") opts.project = path.resolve(v);
      else if (a === "--project-id") opts.projectId = v;
      else if (a === "--display-name") opts.displayName = v;
      else if (a === "--report") {
        if (!["text", "json"].includes(v)) errors.push(`--report must be text or json, got: ${v}`);
        else opts.report = v;
      }
      else if (a === "--vcs") {
        if (!["git", "svn"].includes(v)) errors.push(`--vcs must be git or svn, got: ${v}`);
        else opts.vcs = v;
      }
      continue;
    }
    if (a === "--dry-run") opts.dryRun = true;
    else if (a === "--force") opts.force = true;
    else if (a === "--strict") opts.strict = true;
    else if (a === "--garden") opts.garden = true;
    else if (a === "--acknowledge-legacy") opts.acknowledgeLegacy = true;
  }

  return { opts, errors };
}

export function exitOnCliErrors(tool, errors) {
  if (!errors.length) return false;
  console.log(JSON.stringify({ tool, error: "INVALID_ARGS", details: errors }, null, 2));
  process.exit(1);
  return true;
}
