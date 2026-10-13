#!/usr/bin/env node
import { parseCommonArgs, exitOnCliErrors } from "./lib/cli.mjs";
import { applyTemplates } from "./lib/template.mjs";
import { scanLegacy, hasBlockingLegacy } from "./lib/legacy.mjs";

function main() {
  const { opts, errors } = parseCommonArgs(process.argv);
  if (exitOnCliErrors("adopt", errors)) return;
  const preLegacy = scanLegacy(opts.project);
  if (hasBlockingLegacy(preLegacy) && !opts.acknowledgeLegacy) {
    console.log(JSON.stringify({ tool: "adopt", project: opts.project, blocked: true, legacy: preLegacy }, null, 2));
    process.exit(3);
  }
  const out = applyTemplates({ ...opts, force: opts.force });
  if (out.error === "AMBIGUOUS_VCS") {
    console.log(JSON.stringify({ tool: "adopt", error: "AMBIGUOUS_VCS", hint: "use --vcs git|svn" }, null, 2));
    process.exit(4);
  }
  const blocking = hasBlockingLegacy(out.legacy ?? []);
  if (blocking && !opts.acknowledgeLegacy) {
    console.log(
      JSON.stringify(
        { tool: "adopt", project: opts.project, dryRun: opts.dryRun, blocked: true, legacy: out.legacy, results: out.results },
        null,
        2
      )
    );
    process.exit(3);
  }
  console.log(JSON.stringify({ tool: "adopt", project: opts.project, dryRun: opts.dryRun, vcs: out.vcs, ...out }, null, 2));
  const conflicts = out.results?.filter((r) => r.reason === "CONFLICT_EXISTS") ?? [];
  if (conflicts.length && !opts.force) process.exit(2);
}

main();
