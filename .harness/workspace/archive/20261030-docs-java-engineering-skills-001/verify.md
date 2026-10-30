# Verify — docs-java-engineering-skills-001

> 归档前必备。未验证不得声称通过；未执行的检查不得列入。

## 构建

| 命令 | 结果 | 证据（日志/输出位置） |
| --- | --- | --- |
| `node src/validate.mjs`（Layer 0 自检） | 退出码 0，`ok: true`，`findings: []` | 本文件「校验输出」段 |
| `node src/validate.mjs --project . --strict`（自举严格校验） | 退出码 0，`ok: true`，`errorCount: 0`，`warningCount: 0` | 本文件「校验输出」段 |

## 测试

| 范围 | 命令 | 结果 | 证据 |
| --- | --- | --- | --- |
| 标准库单元测试 | `node --test tests/*.test.mjs` | 未执行（本次未改动 `src/`，仅新增分发内容与契约文档） | — |

## 人工核查

> 逐条引用 proposal 的 AC 编号（契约 §4.4）；未执行的检查不得列入。

| AC ID | 结论 | 证据 |
| --- | --- | --- |
| AC-1 | 通过 | 6 个文件 SHA256 与迁入来源逐一比对：`java-code-structure/SKILL.md`、`java-code-structure/references/structure-rules.md`、`java-transaction-management/SKILL.md`、`java-transaction-management/references/transaction-rules.md`、`java-code-review/SKILL.md`、`java-code-review/references/review-rules.md` 全部 `SAME`；规则计数 ST=10、TX=10、RV=8 |
| AC-2 | 通过 | 契约 §2.1 新增（含流程型/规则型职责表与四条规则型约定）；§1.3 非目标加例外句；§2 布局树新增 `.trae/skills/`；§7 职责表新增 `.trae/skills/harness-*`、`.trae/skills/java-*` 两行 |
| AC-3 | 通过 | `VERSION` = `3.2.0`；`CHANGELOG.md` 首条为 `[3.2.0] - 2026-10-30`，Added / Changed / Notes 三段齐备；契约首部版本行同步为 `3.2.0` |
| AC-4 | 通过 | 两条校验命令退出码均为 0（见「校验输出」） |
| AC-5 | 通过 | `contract/project-config.schema.json` 未修改；契约 §9 与 CHANGELOG 均声明 `schemaVersion` 保持 `3.0.0`；`src/` 无改动 |

## 校验输出

```
$ node src/validate.mjs
{ "tool": "validate", "target": "layer0", "strict": false, "ok": true,
  "missing": [], "findings": [] }
EXIT_LAYER0=0

$ node src/validate.mjs --project . --strict
{ "tool": "validate", "target": "...ai-engineering-standards", "strict": true,
  "ok": true, "missing": [], "configErrors": [], "findings": [],
  "errorCount": 0, "warningCount": 0,
  "projectId": "ai-engineering-standards", "vcs": "git", "legacy": [] }
EXIT_SELF=0
```

## 结论

通过。T7 / T8 已回填；`tests/*.test.mjs` 未执行且已如实注明（未改 `src/`）。
