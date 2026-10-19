# Verify — feature-harness-v31-intent-evidence-001

> 归档前必备。未验证不得声称通过；未执行的检查不得列入。

## 构建

| 命令 | 结果 | 证据（日志/输出位置） |
| --- | --- | --- |
| `node --test tests/*.test.mjs` | 通过（80/80，含新增 7 项 v31 测试） | test runner 汇总输出 |
| `node src/validate.mjs`（Layer 0 自检） | 通过，退出码 0 | CLI 退出码 |
| `node src/validate.mjs --project . --strict`（自举） | 通过，退出码 0，0 error / 0 warning | CLI 退出码 + text 报告 "no findings" |
| `node src/validate.mjs --project . --garden --report text` | 通过，退出码 0；GARDEN info：AC_NOT_ADOPTED=3 / RETRO_MISSING=3（均为 v3.1 之前的存量归档，预期内） | CLI 输出 |

## 测试

| 范围 | 命令 | 结果 | 证据 |
| --- | --- | --- | --- |
| v31 新增测试 | `node --test tests/v31-intent-evidence.test.mjs` | 7/7 通过 | 含 AC opt-in 三态（采用+缺口/采用+覆盖/未采用零误报）、归档路径 warning、garden info 语义与 --strict 不失效 |
| 全量回归 | `node --test tests/*.test.mjs` | 80/80 通过（原 73 + 新 7） | 无既有测试回归 |

## 人工核查

| AC ID | 结论 | 证据 |
| --- | --- | --- |
| AC-1 | 通过 | `contract/harness-contract.md`：头部版本行、§3.2 注释、§4.2 产物分级（+explore/retro 行）、§4.3 生命周期、新增 §4.4 AC 约定、新增 §5.4 charter、§7 +charter 行、§11 +garden 行、§12 +VERIFY_AC_UNCOVERED 与 garden 段 |
| AC-2 | 通过 | `templates/change/explore.md`、`retro.md` 新增；`proposal.md` 验收标准 AC 编号示例；`verify.md` 人工核查 AC 核对表 |
| AC-3 | 通过 | `templates/minimal/` 下 AGENTS.md、`.harness/workspace/changes/README.md`、`.harness/workspace/archive/README.md`、`docs/rules/README.md` 四处同步 |
| AC-4 | 通过 | `--garden` 输出 info 级报告且退出码 0（见构建表第 4 行）；`VERIFY_AC_UNCOVERED` opt-in 语义由测试 "AC not adopted → zero false positives" 证明存量零误报 |
| AC-5 | 通过 | `tests/v31-intent-evidence.test.mjs` 7 项；全量 80/80 |
| AC-6 | 通过 | 自检/自举 strict 均退出码 0；`VERSION`=3.1.0；`CHANGELOG.md` 含 `[3.1.0]` 段 |
| AC-7 | 通过 | 本单元 spec/plan/proposal/tasks/design/verify/retro 齐全，分 4 Phase 实施并逐 Phase 检查 |

## 结论

通过（AC-1..AC-7 全部核验）。
