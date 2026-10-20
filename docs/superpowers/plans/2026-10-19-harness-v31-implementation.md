# Harness Contract v3.1.0 实现计划

> 日期：2026-10-19
> 规格：`docs/superpowers/specs/2026-10-19-harness-v31-intent-evidence-design.md`（已批准）
> 变更单元：`.harness/workspace/changes/feature-harness-v31-intent-evidence-001/`
> 执行方式：分 Phase 推进，每个 Phase 结束设检查点

## 完成标准（全部满足才算完成）

1. `node --test tests/*.test.mjs` 全绿（含新增 v31 测试）
2. `node src/validate.mjs`（Layer 0 自检）退出码 0
3. `node src/validate.mjs --project . --strict`（Layer 0 自举）退出码 0
4. 契约/模板/代码/测试四类产物与 spec §3 逐项对应
5. `VERSION` = 3.1.0，`CHANGELOG.md` 含 `[3.1.0]` 段
6. 本变更单元 verify.md 记录证据后归档（加 `20261019-` 前缀），retro.md 同步完成

## 规模披露

涉及约 16 个文件（新增 6：explore/retro 模板、spec、plan、测试、change 单元产物；修改 10：契约、VERSION、CHANGELOG、3 处模板、cli/paths/validate、自举 AGENTS/project.yaml），约 900 行。**本计划获批即视为对该规模的确认。**

---

## Phase 1：契约与发布资产（纯文档）

| 文件 | 变更 |
|---|---|
| `contract/harness-contract.md` | additive 升级 v3.1.0：§3.2 注释、§4.2 产物分级（+explore/retro 行、AC 说明）、§4.3 生命周期、新增 §4.4 AC 约定、新增 §5.4 charter、§7 +charter 行、§11 +garden 行、§12 +VERIFY_AC_UNCOVERED 与 garden 说明 |
| `VERSION` | `3.0.2` → `3.1.0` |
| `CHANGELOG.md` | 新增 `[3.1.0]` 段（Added/Notes） |

**检查点**：人工 review 契约文本；`node src/validate.mjs` 仍退出码 0（Layer 0 布局未变）。

## Phase 2：模板

| 文件 | 变更 |
|---|---|
| `templates/change/explore.md`（新增） | 意图澄清模板 |
| `templates/change/retro.md`（新增） | 归档复盘模板 |
| `templates/change/proposal.md` | 验收标准 AC 编号示例 |
| `templates/change/verify.md` | 人工核查 AC 逐条核对表 |
| `templates/minimal/AGENTS.md` | charter 指向 + explore/AC/retro 约定 |
| `templates/minimal/.harness/workspace/changes/README.md` | 产物列表补 explore/retro |
| `templates/minimal/.harness/workspace/archive/README.md` | retro 说明 |
| `templates/minimal/docs/rules/README.md` | charter.md 示例行 |

**检查点**：模板文本 review；init 生成树仍完整（TEMPLATE_FILES 不变——explore/retro 为 change 级可选产物，不进 init 清单）。

## Phase 3：工具与测试

| 文件 | 变更 |
|---|---|
| `src/lib/cli.mjs` | `--garden` flag |
| `src/lib/paths.mjs` | AC_ID_RE / CHANGE_OPTIONAL_ARTIFACTS / GARDEN_CODES |
| `src/validate.mjs` | checkVerifyAcCoverage + gardenScan + main 接线 |
| `tests/v31-intent-evidence.test.mjs（新增）` | spec §3.4 六项测试 |

**检查点**：`node --test tests/*.test.mjs` 全绿。

## Phase 4：自举、验证与归档

| 文件 | 变更 |
|---|---|
| `AGENTS.md`（仓库自身） | Workflow 段补 explore/AC/retro/charter 约定 |
| `.harness/project.yaml` | `standards.version` → `3.1.0` |
| 变更单元 `verify.md` / `retro.md` | 记录证据后归档 |

**检查点**：自检 + 自举 strict 0/0；全测试绿；归档并加日期前缀。
