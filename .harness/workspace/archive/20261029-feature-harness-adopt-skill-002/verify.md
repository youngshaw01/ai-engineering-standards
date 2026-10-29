# Verify — feature-harness-adopt-skill-002

## 构建
| 命令 | 结果 | 证据 |
| --- | --- | --- |
| `node src/validate.mjs` | 通过，退出码 0 | 输出 `ok: true`, `missing: []`, `findings: []`；`EXIT1=0` |
| `node src/validate.mjs --project . --strict` | 通过，退出码 0，0 error / 0 warning | 输出 `ok: true`, `errorCount: 0`, `warningCount: 0`；`EXIT2=0` |

## 人工核查
| AC ID | 结论 | 证据 |
| --- | --- | --- |
| AC-1 | 通过 | `.trae/skills/harness-adopt/SKILL.md` 存在；frontmatter L2 `name: harness-adopt`、L3 `description:` 含触发条件与边界 |
| AC-2 | 通过 | 「权威来源」段仅列引用路径（`contract/adoption-contract.md`、`contract/migration-guide.md`、`README.md`、`templates/minimal/`、`templates/bootstrap/`），无契约正文副本 |
| AC-3 | 通过 | 步骤 1/2/3 含 init 与 adopt 两路径与 `--dry-run`（L24）；步骤 4 含退出码 2/3/4 处置与 `--vcs git|svn`（L31） |
| AC-4 | 通过 | 步骤 5 含 validate 门禁（error 清零 / `--strict` warning 清零）；「失败回退」4 条；步骤 6 引用 `templates/bootstrap/prompts/COORDINATOR.md` 只引用不复制 |
| AC-5 | 通过 | 构建表两行均退出码 0 |
| AC-6 | 通过 | `harness-flow/SKILL.md` L12 前置含"未接入 → 先加载 harness-adopt"；L24 引用表已含 `harness-adopt` |

## 结论
AC-1..AC-6 均有实测或文件行号证据，通过。本变更零契约改动。
