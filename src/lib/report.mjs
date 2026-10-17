/**
 * Report rendering for validate.mjs — contract §12.
 * json: backward-compatible structure plus `findings`; text: human-readable graded report.
 */

export function formatReport(report, format = "json") {
  if (format === "text") return formatText(report);
  return JSON.stringify(report, null, 2);
}

function formatText(report) {
  const findings = report.findings ?? [];
  const errors = findings.filter((f) => f.level === "error");
  const warnings = findings.filter((f) => f.level === "warning");
  const lines = [];
  lines.push(`validate — ${report.target}`);
  lines.push("=".repeat("validate — ".length + String(report.target).length));

  if (errors.length) {
    lines.push("");
    lines.push("ERRORS:");
    for (const f of errors) lines.push(`  [error] ${f.code}  ${f.path ?? ""}${f.path ? " — " : ""}${f.message}`);
  }
  if (warnings.length) {
    lines.push("");
    lines.push("WARNINGS:");
    for (const f of warnings) lines.push(`  [warn]  ${f.code}  ${f.path ?? ""}${f.path ? " — " : ""}${f.message}`);
  }
  if (!errors.length && !warnings.length) {
    lines.push("");
    lines.push("no findings");
  }

  lines.push("");
  lines.push(`findings: ${errors.length} error(s), ${warnings.length} warning(s)`);
  lines.push(`result: ${report.ok ? "PASS" : "FAIL"}${report.strict ? " (strict)" : ""}`);

  const codes = new Set(findings.map((f) => f.code));
  if (!report.ok) {
    if (codes.has("SCHEMA") || codes.has("MISSING_REQUIRED")) {
      lines.push("next: v2 → v3 upgrade steps — contract/migration-guide.md");
    }
    if (report.ok === false && errors.length === 0 && warnings.length > 0) {
      lines.push("next: warnings fail under --strict; fix or re-run without --strict");
    }
  }
  return lines.join("\n");
}
