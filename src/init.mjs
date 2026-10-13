#!/usr/bin/env node
import { parseCommonArgs } from "./lib/cli.mjs";
import { applyTemplates } from "./lib/template.mjs";

function main() {
  const opts = parseCommonArgs(process.argv);
  const out = applyTemplates(opts);
  if (out.error === "AMBIGUOUS_VCS") {
    console.log(JSON.stringify({ tool: "init", error: "AMBIGUOUS_VCS", hint: "use --vcs git|svn" }, null, 2));
    process.exit(4);
  }
  console.log(JSON.stringify({ tool: "init", project: opts.project, dryRun: opts.dryRun, vcs: out.vcs, ...out }, null, 2));
  const conflicts = out.results?.filter((r) => r.reason === "CONFLICT_EXISTS") ?? [];
  if (conflicts.length && !opts.force) process.exit(2);
}

main();
