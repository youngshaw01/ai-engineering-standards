import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { makeV3Project, validate, codes } from "./helpers.mjs";

test("init'd knowledge README carries the changelog section (strict pass)", () => {
  const tmp = makeV3Project("aes-kn-");
  const text = fs.readFileSync(path.join(tmp, "docs/knowledge/README.md"), "utf8");
  assert.match(text, /## 变更记录/);
  const val = validate(tmp, ["--strict"]);
  assert.equal(val.status, 0, val.stdout);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test("knowledge doc without changelog section warns; strict fails", () => {
  const tmp = makeV3Project("aes-kn-miss-");
  fs.writeFileSync(
    path.join(tmp, "docs/knowledge/database.md"),
    "# DB\n\nschema goes here\n",
  );
  const val = validate(tmp);
  assert.equal(val.status, 0, val.stdout);
  assert.ok(codes(val.report, "warning").includes("KNOWLEDGE_NO_CHANGELOG"));
  const hit = val.report.findings.find((f) => f.code === "KNOWLEDGE_NO_CHANGELOG");
  assert.equal(hit.path, "docs/knowledge/database.md");
  const strict = validate(tmp, ["--strict"]);
  assert.equal(strict.status, 1);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test("knowledge doc with changelog section passes strict", () => {
  const tmp = makeV3Project("aes-kn-ok-");
  fs.writeFileSync(
    path.join(tmp, "docs/knowledge/database.md"),
    "# DB\n\n## 变更记录\n\n| 日期 | 来源 change-id | 摘要 |\n| --- | --- | --- |\n| 2026-10-17 | bootstrap | 初始 |",
  );
  const val = validate(tmp, ["--strict"]);
  assert.equal(val.status, 0, val.stdout);
  fs.rmSync(tmp, { recursive: true, force: true });
});
