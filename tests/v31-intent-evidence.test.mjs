import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { makeV3Project, validate, codes, root } from "./helpers.mjs";

const T = (tmp, ...rel) => path.join(tmp, ...rel);
const chDir = (tmp, ...rel) => T(tmp, ".harness/workspace/changes", ...rel);
const arDir = (tmp, ...rel) => T(tmp, ".harness/workspace/archive", ...rel);

const PROPOSAL_AC = "# Proposal — feature-x-001\n\n## 验收标准\n\n- [ ] AC-1：上传成功后 3 秒内进入剪辑态\n- [ ] AC-2：超时自动取消并保留草稿\n";
const PROPOSAL_NO_AC = "# Proposal — feature-x-001\n\n## 验收标准\n\n- [ ] 上传成功\n";
const VERIFY_NO_AC = "# Verify — feature-x-001\n\n## 结论\n\n通过\n";
const VERIFY_AC = "# Verify — feature-x-001\n\n## 人工核查\n\n| AC-1 | 通过 | log |\n| AC-2 | 通过 | log |\n";

test("templates/change includes explore.md and retro.md (contract §4.2)", () => {
  for (const f of ["explore.md", "retro.md"]) {
    assert.ok(fs.existsSync(path.join(root, "templates", "change", f)), `missing templates/change/${f}`);
  }
});

test("AC adopted but verify cites none → VERIFY_AC_UNCOVERED (in-progress)", () => {
  const tmp = makeV3Project("aes-v31-ac-");
  fs.mkdirSync(chDir(tmp, "feature-ac-gap-001"));
  fs.writeFileSync(chDir(tmp, "feature-ac-gap-001", "proposal.md"), PROPOSAL_AC);
  fs.writeFileSync(chDir(tmp, "feature-ac-gap-001", "tasks.md"), "- [ ] T1\n");
  fs.writeFileSync(chDir(tmp, "feature-ac-gap-001", "verify.md"), VERIFY_NO_AC);
  const val = validate(tmp);
  assert.equal(val.status, 0, val.stdout);
  assert.ok(codes(val.report, "warning").includes("VERIFY_AC_UNCOVERED"), JSON.stringify(val.report.findings));
  fs.rmSync(tmp, { recursive: true, force: true });
});

test("AC adopted and verify cites AC → no VERIFY_AC_UNCOVERED (strict clean)", () => {
  const tmp = makeV3Project("aes-v31-ok-");
  fs.mkdirSync(chDir(tmp, "feature-ac-ok-001"));
  fs.writeFileSync(chDir(tmp, "feature-ac-ok-001", "proposal.md"), PROPOSAL_AC);
  fs.writeFileSync(chDir(tmp, "feature-ac-ok-001", "tasks.md"), "- [ ] T1\n");
  fs.writeFileSync(chDir(tmp, "feature-ac-ok-001", "verify.md"), VERIFY_AC);
  const val = validate(tmp, ["--strict"]);
  assert.equal(val.status, 0, val.stdout);
  assert.ok(!codes(val.report, "warning").includes("VERIFY_AC_UNCOVERED"));
  fs.rmSync(tmp, { recursive: true, force: true });
});

test("AC not adopted → zero false positives (legacy projects unaffected)", () => {
  const tmp = makeV3Project("aes-v31-noadopt-");
  fs.mkdirSync(chDir(tmp, "feature-legacy-001"));
  fs.writeFileSync(chDir(tmp, "feature-legacy-001", "proposal.md"), PROPOSAL_NO_AC);
  fs.writeFileSync(chDir(tmp, "feature-legacy-001", "tasks.md"), "- [ ] T1\n");
  fs.writeFileSync(chDir(tmp, "feature-legacy-001", "verify.md"), VERIFY_NO_AC);
  const val = validate(tmp, ["--strict"]);
  assert.equal(val.status, 0, val.stdout);
  assert.ok(!codes(val.report, "warning").includes("VERIFY_AC_UNCOVERED"));
  fs.rmSync(tmp, { recursive: true, force: true });
});

test("archived change: AC adopted + verify without AC → warning on archive path", () => {
  const tmp = makeV3Project("aes-v31-arch-");
  fs.mkdirSync(arDir(tmp, "20261018-feature-ac-gap-002"));
  fs.writeFileSync(arDir(tmp, "20261018-feature-ac-gap-002", "proposal.md"), PROPOSAL_AC);
  fs.writeFileSync(arDir(tmp, "20261018-feature-ac-gap-002", "verify.md"), VERIFY_NO_AC);
  const val = validate(tmp);
  assert.equal(val.status, 0, val.stdout);
  const hit = val.report.findings.filter((f) => f.code === "VERIFY_AC_UNCOVERED");
  assert.equal(hit.length, 1);
  assert.match(hit[0].path, /archive\/20261018-feature-ac-gap-002\/verify\.md$/);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test("--garden: info-level report; exit code unaffected even with --strict", () => {
  const tmp = makeV3Project("aes-v31-garden-");
  fs.mkdirSync(chDir(tmp, "feature-garden-001"));
  fs.writeFileSync(chDir(tmp, "feature-garden-001", "proposal.md"), PROPOSAL_NO_AC);
  fs.writeFileSync(chDir(tmp, "feature-garden-001", "tasks.md"), "- [ ] T1\n");
  fs.mkdirSync(arDir(tmp, "20261017-feature-old-002"));
  fs.writeFileSync(arDir(tmp, "20261017-feature-old-002", "proposal.md"), PROPOSAL_NO_AC);
  fs.writeFileSync(arDir(tmp, "20261017-feature-old-002", "verify.md"), "v\n");
  fs.mkdirSync(arDir(tmp, "20261016-feature-old-003"));
  fs.writeFileSync(arDir(tmp, "20261016-feature-old-003", "proposal.md"), PROPOSAL_NO_AC);
  fs.writeFileSync(arDir(tmp, "20261016-feature-old-003", "verify.md"), "v\n");
  fs.writeFileSync(arDir(tmp, "20261016-feature-old-003", "retro.md"), "r\n");

  const val = validate(tmp, ["--garden", "--strict"]);
  assert.equal(val.status, 0, val.stdout);
  assert.ok(val.report.garden, "garden section missing");
  const gc = val.report.garden.findings.map((f) => f.code);
  assert.ok(gc.includes("GARDEN_AC_NOT_ADOPTED"), gc.join(","));
  assert.ok(gc.includes("GARDEN_RETRO_MISSING"), gc.join(","));
  assert.equal(gc.filter((c) => c === "GARDEN_RETRO_MISSING").length, 1);
  for (const f of val.report.garden.findings) assert.equal(f.level, "info");
  fs.rmSync(tmp, { recursive: true, force: true });
});

test("garden verify-AC gap surfaces as GARDEN_VERIFY_AC_GAP; retro present suppresses RETRO_MISSING", () => {
  const tmp = makeV3Project("aes-v31-gap-");
  fs.mkdirSync(arDir(tmp, "20261015-feature-gap-001"));
  fs.writeFileSync(arDir(tmp, "20261015-feature-gap-001", "proposal.md"), PROPOSAL_AC);
  fs.writeFileSync(arDir(tmp, "20261015-feature-gap-001", "verify.md"), VERIFY_NO_AC);
  fs.writeFileSync(arDir(tmp, "20261015-feature-gap-001", "retro.md"), "r\n");
  const val = validate(tmp, ["--garden"]);
  assert.equal(val.status, 0, val.stdout);
  const gc = val.report.garden.findings.map((f) => f.code);
  assert.ok(gc.includes("GARDEN_VERIFY_AC_GAP"), gc.join(","));
  assert.ok(!gc.includes("GARDEN_RETRO_MISSING"), gc.join(","));
  fs.rmSync(tmp, { recursive: true, force: true });
});
