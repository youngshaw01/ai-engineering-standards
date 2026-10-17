import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { makeV3Project, validate, codes } from "./helpers.mjs";
import { THICK_RULE_MAX_LINES } from "../src/lib/paths.mjs";

test("AI_RULES.md over the line threshold is a red-line error", () => {
  const tmp = makeV3Project("aes-thick-");
  fs.writeFileSync(
    path.join(tmp, "AI_RULES.md"),
    Array.from({ length: THICK_RULE_MAX_LINES + 1 }, (_, i) => `rule line ${i}`).join("\n") + "\n",
  );
  const val = validate(tmp);
  assert.equal(val.status, 1);
  assert.ok(codes(val.report, "error").includes("REDLINE_THICK_AI_RULES"));
  fs.rmSync(tmp, { recursive: true, force: true });
});

test("AI_RULES.md with L0-L5 chapter patterns is a red-line error regardless of length", () => {
  const tmp = makeV3Project("aes-thick-pat-");
  fs.writeFileSync(
    path.join(tmp, "AI_RULES.md"),
    "# AI Rules\n\n## L0 - Safety Guardrails\n\nSee AGENTS.md.\n",
  );
  const val = validate(tmp);
  assert.equal(val.status, 1);
  assert.ok(codes(val.report, "error").includes("REDLINE_THICK_AI_RULES"));
  fs.rmSync(tmp, { recursive: true, force: true });
});

test("thin-pointer AI_RULES.md (at threshold, no patterns) passes strict", () => {
  const tmp = makeV3Project("aes-thin-");
  fs.writeFileSync(
    path.join(tmp, "AI_RULES.md"),
    [
      "# AI Rules (thin pointer)",
      "",
      "Engineering rules live in the standards library; project-specific",
      "rules live in docs/rules/. Entry point: AGENTS.md.",
      "",
      ...Array.from({ length: THICK_RULE_MAX_LINES - 5 }, (_, i) => `ref ${i}`),
    ].join("\n") + "\n",
  );
  const val = validate(tmp, ["--strict"]);
  assert.equal(val.status, 0, val.stdout);
  fs.rmSync(tmp, { recursive: true, force: true });
});
