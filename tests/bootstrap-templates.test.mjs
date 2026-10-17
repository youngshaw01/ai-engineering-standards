import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { root } from "./helpers.mjs";

const B = (...rel) => path.join(root, "templates", "bootstrap", ...rel);

const EXPECTED_FILES = [
  "README.md",
  "prompts/COORDINATOR.md",
  "prompts/00-prepare.md",
  "prompts/01-recon.md",
  "prompts/02-capability-map.md",
  "prompts/03-domain-analysis.md",
  "prompts/04-cross-cutting.md",
  "prompts/05-index-and-pending.md",
  "prompts/06-independent-audit.md",
  "prompts/07-finalize.md",
  "workflow/README.md",
  "workflow/STATUS.template.md",
  "workflow/quality-gates.md",
  "workflow/agent-handoff.md",
  "workflow/validation-checklist.md",
  "artifacts/README.template.md",
  "artifacts/_pending.template.md",
  "artifacts/_audit.template.md",
  "artifacts/_manifest.template.yaml",
];

function walkFiles(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkFiles(p, out);
    else out.push(p);
  }
  return out;
}

test("templates/bootstrap file set is complete (20 files)", () => {
  const missing = EXPECTED_FILES.filter((rel) => !fs.existsSync(B(rel)));
  assert.deepEqual(missing, []);
  const actual = walkFiles(B()).map((p) => path.relative(B(), p).split(path.sep).join("/"));
  assert.deepEqual([...actual].sort(), [...EXPECTED_FILES].sort());
});

test("bootstrap kit references no v1 runtime paths (red line 1)", () => {
  const banned = [/\.harness\/wiki/, /\.harness\/prompts/, /\.harness\/workflow/, /\.harness\/knowledge/, /sealed\/v1/, /templates\/harness\//];
  const hits = [];
  for (const file of walkFiles(B())) {
    const text = fs.readFileSync(file, "utf8");
    for (const pat of banned) {
      if (pat.test(text)) hits.push(`${path.relative(B(), file)}: ${pat}`);
    }
  }
  assert.deepEqual(hits, []);
});

test("STATUS template tracks stages 0-6 plus finalize in a change unit", () => {
  const text = fs.readFileSync(B("workflow/STATUS.template.md"), "utf8");
  assert.match(text, /docs-knowledge-bootstrap/);
  for (const s of ["准备", "Recon", "能力地图", "领域分析", "横切分析", "索引", "审计", "交付收尾"]) {
    assert.ok(text.includes(s), `STATUS missing stage: ${s}`);
  }
  assert.match(text, /未开始/);
  assert.match(text, /阻塞/);
});

test("artifact templates carry the changelog traceability section (§5.2)", () => {
  for (const f of ["artifacts/README.template.md", "artifacts/_pending.template.md", "artifacts/_audit.template.md"]) {
    const text = fs.readFileSync(B(f), "utf8");
    assert.match(text, /## 变更记录/, `${f} missing changelog section`);
    assert.match(text, /bootstrap/);
  }
});

test("prompts 01-04 instruct the changelog convention for their outputs", () => {
  for (const f of ["01-recon.md", "02-capability-map.md", "03-domain-analysis.md", "04-cross-cutting.md"]) {
    const text = fs.readFileSync(B("prompts", f), "utf8");
    assert.match(text, /变更记录/, `${f} missing changelog convention`);
  }
});

test("bootstrap README keeps protocols in the standards library (no copy into project)", () => {
  const text = fs.readFileSync(B("README.md"), "utf8");
  assert.match(text, /不复制进消费项目/);
  assert.match(text, /docs\/knowledge/);
  assert.match(text, /人工审定/);
});

test("workflow README defines writer ownership and quality gates", () => {
  const text = fs.readFileSync(B("workflow/README.md"), "utf8");
  assert.match(text, /唯一写入者/);
  assert.match(text, /quality-gates\.md/);
  assert.match(text, /阶段 0/);
});
