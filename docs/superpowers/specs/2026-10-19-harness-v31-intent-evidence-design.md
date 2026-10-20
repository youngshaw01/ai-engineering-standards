# Harness Contract v3.1.0 设计规格（意图与证据增强）

> 日期：2026-10-19
> 状态：已批准（随变更单元 feature-harness-v31-intent-evidence-001 执行）
> 上位契约：`contract/harness-contract.md`（v3.0.2，本设计将其 additive 升级到 v3.1.0）
> 输入：开源生态调研（Top 20：OpenSpec 72.3k★ / spec-kit / spec-kitty / gsd-core 64.2k★ / lattice / ProductSpec / universal-dev-standards 等）

## 1. 背景与问题诊断

### 1.1 调研结论

- 行业形态收敛：`changes/ + archive/` 双区、AGENTS.md 薄入口、proposal/design/tasks/verify 产物命名——v3 契约方向正确，**不推倒重来**；
- v3 相对行业前沿的三处缺口：
  1. **意图前置态缺失**：OpenSpec 有 `/opsx:explore`、GSD 有 Discuss、spec-kit 有 constitution、spec-kitty 有 charter——"写代码之前先把意图定下来"是共同范式，v3 直接从 proposal 开始；
  2. **验收无证据 ID**：ProductSpec 用 `AC-<n>` 挂证据 + reconcile 核对；v3 验收标准是无编号 checkbox，verify 与 proposal 对应关系无法机器核对；
  3. **无复盘与巡检**：spec-kitty 每 mission 默认 retrospective；ProductSpec 有 garden 健康扫描。v3 归档即终点。

### 1.2 设计约束（来自 v3 契约自身）

- 红线 1：禁止项目内复制标准树——charter 必须落位既有 `docs/rules/`，不新增顶层目录；
- §9 版本策略：不兼容变更才 bump schemaVersion——本版 additive，`schemaVersion` 保持 `3.0.0`；
- 保守默认：工具不删改用户内容；新增校验**不得**让存量合规项目从 0 warning 变成非 0。

## 2. 已确认的决策记录

| 决策点 | 结论 |
|---|---|
| 版本策略 | additive：契约文档版本 3.1.0，`schemaVersion` 不变；消费项目零改动 |
| AC 证据 ID 校验语义 | **opt-in**：仅当 proposal 已采用 `AC-<n>` 编号时才要求 verify 引用；未采用方零误报 |
| garden 定位 | info 级巡检报告，**不影响退出码**；与 error/warning 分级隔离 |
| charter 落位 | `docs/rules/charter.md`（推荐非必备），不新增 `.harness/` 结构 |
| explore/retro 落位 | change 目录内可选产物 `explore.md` / `retro.md`，无机器强制 |
| lanes 机器状态 | **不做**（v4 候选）——本版仅文书约定，避免状态机复杂化 |

## 3. 设计明细

### 3.1 契约变更（contract/harness-contract.md）

| 节 | 变更 |
|---|---|
| 头部 | 版本 3.0.0 → 3.1.0；注明"配置 Schema 仍为 schemaVersion 3.0.0，本版为 additive 约定层" |
| §3.2 布局图 | `docs/rules/*.md` 注释补 `charter.md`（推荐） |
| §4.2 产物分级 | 新增 `explore.md`（可选：意图前置）、`retro.md`（可选：归档复盘）两行；proposal 行补 AC 编号说明；verify 行补"逐条引用 AC ID" |
| §4.3 生命周期 | 图与文字补：创建 change 前可先 explore；archive 后可写 retro |
| §4.4（新增） | 验收证据 ID 约定：`AC-<n>` 编号规则、verify 引用规则、opt-in 校验语义 |
| §5.4（新增） | charter：位置、一次定义、跨 change 稳定、AGENTS.md 指向、与 rules 执行层的关系 |
| §7 文件职责 | 新增 `docs/rules/charter.md` 行（项目宪法；禁止与 proposal 冲突、禁过程产物） |
| §11 生命周期表 | 新增 `--garden` 巡检行（info 级，不影响退出码） |
| §12 校验规则 | warnings 增 `VERIFY_AC_UNCOVERED`；新增 garden 模式说明段 |

### 3.2 模板变更

| 文件 | 变更 |
|---|---|
| `templates/change/explore.md`（新增） | 意图澄清：问题/选项/约束/待决问题/结论；大需求或方向不明时启用 |
| `templates/change/retro.md`（新增） | 归档复盘：做得好/踩坑/改进项/回流 knowledge 的条目 |
| `templates/change/proposal.md` | 验收标准示例改 `AC-1`…`AC-n` 编号 |
| `templates/change/verify.md` | 人工核查改 AC 逐条核对表（AC ID / 结论 / 证据） |
| `templates/minimal/AGENTS.md` | Project 段指向 charter；Workflow 段补 explore → AC 编号 → retro 约定 |
| `templates/minimal/.harness/workspace/changes/README.md` | 产物列表补 explore/retro |
| `templates/minimal/.harness/workspace/archive/README.md` | retro 说明 |
| `templates/minimal/docs/rules/README.md` | 索引示例补 charter.md 行 |

### 3.3 工具变更

**`src/lib/cli.mjs`**：`KNOWN_FLAGS` 增 `--garden`（boolean，`opts.garden`）。

**`src/lib/paths.mjs`**：新增常量 `AC_ID_RE`（`/AC-\d+/`）、`CHANGE_OPTIONAL_ARTIFACTS`（explore/retro）、`GARDEN_CODES`（三码）。

**`src/validate.mjs`**：

1. `checkVerifyAcCoverage()`——对 in-progress 与 archived change：若 proposal 含 `AC-\d+` 且 verify.md 存在但不含任何 `AC-\d+` → warning `VERIFY_AC_UNCOVERED`。未采用 AC 编号的 change 不检查（opt-in）。
2. `gardenReport()`——info 级缺口数组：
   - `GARDEN_AC_NOT_ADOPTED`：change 的 proposal 未采用 AC 编号；
   - `GARDEN_VERIFY_AC_GAP`：采用 AC 但 verify 未引用（与 warning 同源，garden 视图汇总）；
   - `GARDEN_RETRO_MISSING`：archived change 无 retro.md。
3. `main()`：`--garden` 时在 report 上挂 `garden` 字段，**不参与 ok 计算、不改退出码**；无 `--project` 时对 Layer 0 自身 workspace 巡检。text 报告渲染 GARDEN 段（`src/lib/report.mjs`）。

### 3.4 测试变更（tests/v31-intent-evidence.test.mjs）

1. `templates/change/` 含 explore.md + retro.md；
2. AC 采用 + verify 无引用 → `VERIFY_AC_UNCOVERED`（in-progress 与 archived 各一）；
3. AC 采用 + verify 有引用 → 无该 warning；
4. 未采用 AC → 无该 warning（存量项目零误报回归）；
5. `--garden`：status 0、report.garden 存在、含预期 info 码、`--garden --strict` 仍 status 0；
6. retro 存在时抑制对应 `GARDEN_RETRO_MISSING`。

## 4. 兼容性

- 消费项目：无需任何改动；新能力全部 optional；
- 存量 strict 0 warning 项目（ITS/PayNow/MPOC）：新增检查 opt-in 触发，状态不变；
- v2 → v3 迁移指南不受影响；本版不产生新的迁移路径。
