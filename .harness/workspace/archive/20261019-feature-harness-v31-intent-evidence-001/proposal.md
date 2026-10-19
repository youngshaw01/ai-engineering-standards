# Proposal — feature-harness-v31-intent-evidence-001

> 状态：accepted · 创建日期：2026-10-19

## Why

开源生态调研（2026-10-19，Top 20 项目：OpenSpec / spec-kit / spec-kitty / gsd-core / lattice / ProductSpec 等）显示行业已收敛于 `changes/ + archive/` 双区与 AGENTS.md 薄入口——v3 契约方向正确。但 v3 缺三块被广泛验证的能力：

1. **意图前置态**：需求方向不明时缺少 explore/discuss 环节，目标漂移防控完全依赖写代码后的审查（OpenSpec explore、GSD discuss、spec-kit constitution、spec-kitty charter 均有此层）；
2. **验收证据挂载**：验收标准无稳定 ID，verify 与 proposal 的对应关系靠人眼，无法机器核对（ProductSpec 的 AC-/EVAL-/SM- 证据 ID + reconcile 是成熟范式）；
3. **复盘与巡检**：归档后无 retro 沉淀，仓库健康（证据缺口、retro 缺失）无巡检入口（spec-kitty retrospective、ProductSpec garden）。

另需确立**项目宪法（charter）**层：跨 change 稳定的不可协商原则，此前散落在各项目 `docs/rules/` 无固定居点。

## What Changes

additive 约定层升级 **3.0.2 → 3.1.0**（`schemaVersion` 保持 `3.0.0`：无新配置字段，消费项目零改动即可受益；新增能力全部 optional/opt-in）：

- 契约 `contract/harness-contract.md`：
  - §4.2 产物分级新增 `explore.md`（可选，意图前置）、`retro.md`（可选，归档复盘）；
  - §4.3 生命周期补 explore 前置态与 retro 后置态；
  - 新增 §4.4 验收证据 ID（AC）约定；
  - §5 新增 5.4 charter（项目宪法，落位 `docs/rules/charter.md`）；
  - §11 新增 `--garden` 巡检命令；§12 新增 `VERIFY_AC_UNCOVERED` warning 与 garden 说明；
  - §7 文件职责表新增 `docs/rules/charter.md` 行。
- 模板：`templates/change/` 新增 `explore.md`、`retro.md`；`proposal.md` 验收标准改 AC 编号；`verify.md` 人工核查改 AC 逐条核对表；`templates/minimal/` 的 AGENTS.md / changes/README.md / archive/README.md / docs/rules/README.md 同步。
- 工具：`validate.mjs` 新增 `--garden`（info 级缺口巡检，不影响退出码）与 `VERIFY_AC_UNCOVERED` warning（opt-in：仅对已采用 AC 编号的 change 生效，不破坏存量项目 strict 0 warning）。
- 测试：新增 `tests/v31-intent-evidence.test.mjs`。
- 发布：`VERSION` → `3.1.0`；`CHANGELOG.md` 新增 `[3.1.0]` 段。

## Out of Scope

- `schemaVersion` bump 到 4.0.0（无破坏性变更，不做）；
- 多 Agent 编排、模型路由、MCP 生态（v3 非目标沿袭）；
- work package lanes 机器状态（spec-kitty 式）——列入 v4 候选，本版仅文书约定；
- `reconcile` 命令（ProductSpec 式 Agent Run 核对）——列入 v4 候选。

## 验收标准

- AC-1：契约 v3.1.0 文本落地，explore/retro/AC/charter/garden 五能力成文且互相引用一致
- AC-2：`templates/change/` 含 explore.md + retro.md；proposal/verify 模板体现 AC 编号约定
- AC-3：`templates/minimal/` 四文件（AGENTS/changes README/archive README/rules README）同步新约定
- AC-4：`validate --garden` 输出 info 级缺口报告且退出码不受影响；`VERIFY_AC_UNCOVERED` 对未采用 AC 的项目零误报
- AC-5：新测试文件覆盖 AC opt-in 语义与 garden 行为，`node --test tests/*.test.mjs` 全绿
- AC-6：Layer 0 自检与自举校验均退出码 0；VERSION/CHANGELOG 更新为 3.1.0
- AC-7：本变更单元按 spec → plan → 分 Phase 实施，verify.md 记录证据后归档

## Impact

- 消费项目：零强制改动；采用 AC/charter/explore/retro 均为可选；
- 存量 strict 校验：新增 warning 仅 opt-in 触发，不影响 ITS/PayNow/MPOC 的 0 warning 状态；
- 工具：`validate.mjs` 新增一个 flag 与两类检查，无第三方依赖。
