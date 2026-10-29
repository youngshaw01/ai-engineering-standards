# Verify — feature-harness-workflow-skills-001

## 构建
| 命令 | 结果 | 证据 |
| --- | --- | --- |
| `node src/validate.mjs` | 通过，退出码 0 | 输出 `ok: true`, `missing: []`, `findings: []`；`EXIT=0` |
| `node src/validate.mjs --project . --strict` | 通过，退出码 0，0 error / 0 warning | 输出 `ok: true`, `errorCount: 0`, `warningCount: 0`, `vcs: git`；`EXIT=0` |

## 人工核查
| AC ID | 结论 | 证据 |
| --- | --- | --- |
| AC-1 | 通过 | `.trae/skills/harness-change|harness-vcs|harness-flow/SKILL.md` 均存在；frontmatter 含 `name` + `description`（Select-String 命中 name/description 行） |
| AC-2 | 通过 | 三个 SKILL.md 的规则均以引用路径指向 `contract/*` 或 `templates/*`（各文「权威来源」段），无契约正文副本 |
| AC-3 | 通过 | harness-vcs 含 `git add -A` 禁令（L13）、`--encoding UTF-8`（L19）、`svn log --xml`（L20/L29） |
| AC-4 | 通过 | harness-flow 含单 Agent 声明（L8）、校验门禁（L16-18）与失败回退（"回退到 1）"） |
| AC-5 | 通过 | 构建表两行均退出码 0 |
| AC-6 | 待验证 | 需新会话输入"按 harness 流程走一次变更"，人工记录 `harness-flow` 加载结果 |

## 结论
- 代码/文档侧交付物（AC-1..AC-5）已通过实测证据确认。
- AC-6 属运行时触发验证，须在新会话人工确认后回填本行证据。
