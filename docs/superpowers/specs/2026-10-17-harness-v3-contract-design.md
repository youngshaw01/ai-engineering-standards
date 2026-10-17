# Harness Contract v3.0.0 设计规格（渐进基线制）

> 日期：2026-10-17
> 状态：待用户审查
> 上位契约：`contract/harness-contract.md`（v2.0.0，本设计将升级它）

## 1. 背景与问题诊断

### 1.1 现状

三个 SVN 项目已接入 harness contract v2.0.0（`project.yaml` 均已提交），契约层统一成功；但 v2 只定义了"接入的最小形状"（4 个文件），workspace 内部结构、任务单元生命周期、命名约定、知识落位全部留白，导致落地层各自为政。

| 维度 | PayNow | MPOC-AM | ITS |
|---|---|---|---|
| workspace 布局 | `changes/{change_id}/` 变更单元制 + 950 行 v1 遗留 task.yaml | 空（2026-10-17 刚 init） | 自造 `current/{task_id}/` 目录制 |
| change/task 命名 | 两套并存（v1 式 + 日期前缀式） | — | `{date}_{type}-{feature}` |
| 知识/规则落位 | `docs/harness/`（14 子目录，v1 标准树整体搬入项目） | `mpoc/docs/ai-knowledge/` | `docs/knowledge/` + `docs/rules/` |
| AI 规则适配层 | .cursor/.trae 多套并存 | AI_RULES.md 薄指针 | AI_RULES.md 完整 L0-L5 副本（已分叉） |

具体问题：PayNow 有 9 个脚本写入自家规范禁止的目录（规则与执行脱节）；ITS 归档文档存在 `.harness/knowledge/` 失效引用；MPOC 散落 20+ 个 `commit_msg_*.txt` 无治理。

### 1.2 根因

v2 契约定义了"接入的最小形状"，没有定义"工作起来之后的形状"。每个项目只能自由发挥，产生三套互不兼容的落地形态。

### 1.3 目标

在不改变各项目业务代码的前提下：

1. 升级 Layer 0 契约到 v3.0.0，覆盖 workspace 工作流、知识/规则落位、全生命周期（需求 → 归档）。
2. 按 MPOC → ITS → PayNow 顺序迁移存量项目，每步验证后再前进。
3. 迁移方式：工具判合规 + 人工迁内容（工具只生成结构与判定差距，不自动搬内容）。

## 2. 已确认的决策记录

| 决策点 | 结论 |
|---|---|
| 契约范围 | 全生命周期工作流（workspace 结构 + 知识落位 + 需求→归档流程） |
| 学习对象 | 业界开源框架为主（spec-kit / OpenSpec / Agent OS v3） |
| 迁移顺序 | MPOC → ITS → PayNow |
| 迁移方式 | 工具判合规 + 人工迁内容 |
| PayNow v1 遗产 | 分层处置：提取转化 + 封存 + 归位（第二轮执行，本设计只定标准） |
| 方案选型 | 方案三：渐进基线制（工作流层用轻量变更制，知识层按需生长，契约分三层实施） |
| 知识追溯（Q1） | knowledge 文档尾部强制 changelog 小节（日期/来源 change-id/摘要）；归档回流时登记；validate warning 级校验 |
| 梳理流水线（Q2） | 复活 v1 封板的 legacy-project-wiki 6 阶段流水线进入 v3 契约（bootstrap 可选阶段）；MPOC 试点只平移现有文档，流水线试点后按需启用 |

## 3. 业界参考与借鉴

| 框架 | 借鉴点 |
|---|---|
| GitHub spec-kit（140k+ stars） | constitution（项目不可协商原则）；产物固定文件名的流水线 |
| OpenSpec（Fission-AI） | `changes/{change-id}/` + `archive/` 目录模型；delta spec（只描述变更）；skip 机制（避免过度 ceremony）；brownfield 友好 |
| Agent OS v3（buildermethods） | 双层架构与 Layer 0/Layer 1 同构；standards 索引（index 思想）；"薄指针而非厚副本"；不重复 AI 工具原生能力，只做标准沉淀 |

## 4. 设计第 1 节：workspace 工作流层（契约核心）

### 4.1 消费项目布局（v3.0.0）

```
AGENTS.md                          # 薄入口（保持 v2，≤120 行）
.harness/
├── project.yaml                   # schemaVersion: 3.0.0
├── README.md
└── workspace/
    ├── changes/                   # 进行中的变更单元（可多个并行）
    │   └── {type}-{slug}-{NNN}/   # 如 feature-pci-module-split-001
    │       ├── proposal.md        # 必备：Why / What / Impact / 验收标准
    │       ├── design.md          # 可选：跨模块/架构级变更才需要
    │       ├── tasks.md           # 必备：任务清单（checkbox 可追踪）
    │       ├── verify.md          # 归档前必备：构建/测试/验证记录
    │       └── artifacts/         # 可选：该变更的脚本/SQL/报告等产物
    └── archive/                   # 已完成归档（只读）
        └── {YYYYMMDD}-{type}-{slug}-{NNN}/   # 归档时加日期前缀
docs/
├── knowledge/                     # 领域知识：系统"是什么"
│   ├── README.md                  # 索引
│   └── business.md / architecture.md / database.md / deployment.md
└── rules/                         # 项目特化规则："必须怎么做"
    ├── README.md
    └── *.md                       # 如 svn.md、pci-compliance.md
```

### 4.2 change-id 命名规范

- 格式：`{type}-{slug}-{NNN}`
- type ∈ `feature | bugfix | refactor | docs | ops`（项目可通过 `project.yaml` 的 `workflow.types` 定制扩展）
- slug：kebab-case，英文小写
- NNN：三位序号，项目内递增
- 归档时前缀 `{YYYYMMDD}-`（使用变更**创建**日期，目录移动即可）
- 理由：进行中变更目录名稳定（不前置日期），归档时才盖日期戳；终结 PayNow 两套命名并存问题

### 4.3 产物分级

| 产物 | 要求 | 内容要求 |
|---|---|---|
| proposal.md | **必备** | 变更理由 + 范围（含 out-of-scope）+ 验收标准 |
| tasks.md | **必备** | 任务清单；小变更可以只有 3 行 |
| design.md | 可选 | 跨模块/影响架构/改接口时才要求 |
| verify.md | **归档前必备** | 构建/测试/验证记录；未验证不得声称通过 |
| artifacts/ | 可选 | 该变更专属的脚本/SQL/报告等，杜绝散落根目录 |

### 4.4 生命周期

```
创建 change（proposal + tasks） → [design 可选] → 实现（勾选 tasks）
→ verify（记录验证证据） → archive（移动到 archive/，加日期前缀）
→ [可选] 知识回流：已验证的行为认知合并进 docs/knowledge/
```

- 知识回流是**人工动作**，契约只规定去处（docs/knowledge/），不强制时机。
- 回流时**必须**在目标 knowledge 文档尾部 changelog 登记一行（见 5.1），保证 change → knowledge 可生成、knowledge → change 可反查。
- v2 的"保守默认"语义沿袭：工具不删改用户内容，冲突跳过。

### 4.5 红线（validate 机器强制）

1. 禁止在项目内复制标准库契约/规则树（裁决 PayNow `docs/harness/` 问题的依据）。
2. AI 规则适配层（AI_RULES.md 等）必须为**薄指针**——指向 AGENTS.md / 标准库引用，禁止整份规则副本（解决 ITS 分叉问题）。
3. `workspace/` 内禁止出现永久规范正文（对齐 v2 §4）。
4. 沿袭 v2 禁止路径：`.harness/rules/`、`.harness/skills/`、`.harness/knowledge/`、`.harness/wiki/`、`.standards/`、`harness.yaml` 等。

红线 2 的可检测信号：AI 规则文件超过 60 行，或包含 L0-L5 章节结构特征（如 "L0 - Safety Guardrails" 标题模式）。

## 5. 设计第 2 节：知识层落位标准 + Layer 0 工具链升级

### 5.1 知识/规则落位标准

| 内容类型 | 标准位置 | 判定规则 |
|---|---|---|
| 领域知识（业务/架构/DB/部署/领域术语） | `docs/knowledge/` | 描述系统"是什么"的事实 |
| 项目特化规则（SVN 规范、PCI 合规、模块路径约定） | `docs/rules/` | 描述"必须怎么做"；项目特有才放此 |
| 通用工程规则（L0-L5 等） | **不落项目**，引用标准库/全局规则 | 适配层只做薄指针 |
| 过程产物 | `.harness/workspace/` | 变更单元生命周期内 |
| v1 遗产 | `workspace/archive/` 封存 或 `docs/_legacy/` 只读 | 禁止留在活动路径 |

- `docs/knowledge/README.md` 为索引：每个知识文件一行摘要 + 指针，控制 AI 上下文注入量。
- 知识**按需生长**：不强制初始全量基线；archive 时按 delta 精神合并已验证认知。

#### 5.1.1 knowledge 文档结构约定（追溯性）

每个 `docs/knowledge/*.md` 尾部**必须**有变更记录小节：

```markdown
## 变更记录
| 日期 | 来源 change-id | 摘要 |
|---|---|---|
| 2026-10-17 | bootstrap | 初始梳理（legacy-project-wiki 流水线） |
| 2026-10-20 | 20261020-feature-xxx-001 | 补充 Webhook 模块时序说明 |
```

- 初始梳理来源记 `bootstrap`；日常回流记归档后的 change-id。
- validate 校验：knowledge/*.md 存在但无变更记录小节 → `warning`。
- 追溯链：`archive/{date}-{change-id}/`（过程证据）⇄ `docs/knowledge/*.md` changelog（当前态 + 来源），配合 SVN 历史形成完整闭环。

#### 5.1.2 初始知识梳理（bootstrap，可选阶段）

存量项目引入时可启用**业务代码驱动的初始梳理**，复活 v1 封板的 legacy-project-wiki 6 阶段流水线（recon → capability-map → domain-analysis → cross-cutting → index → audit），re-home 到 Layer 0 的 `templates/bootstrap/`：

- 形态：AI 辅助梳理 + **人工审定**（非全自动）；逐阶段产物评审后推进。
- 产出：`docs/knowledge/` 初始集（架构、领域模块、数据库/ER、部署、领域术语），changelog 来源记 `bootstrap`。
- 对已有 v1 时代文档的项目（MPOC/ITS/PayNow）：定位为"**校验现有文档与代码一致性 + 补缺口**"，而非从零重写。
- v1 kit 的产物落点 `.harness/wiki/` 是 v3 禁止路径，re-home 时全部改指向 `docs/knowledge/`。
- MPOC 试点**不启用** bootstrap（只平移现有文档）；流水线在试点后按需启用（决策记录 Q2）。

### 5.2 Layer 0（本仓库）升级内容

契约文档：

- `contract/harness-contract.md` → v3.0.0：
  - 新增 §workspace 结构契约（变更单元模型、命名、产物分级、生命周期）
  - 新增 §知识/规则落位标准（5.1 表格内容）
  - 红线清单更新（4.5）
- `contract/project-config.schema.json` → 3.0.0：新增可选字段 `workflow.types`（定制 type 清单）；保持必填字段与 v2 一致
- 新增 `contract/migration-guide.md`：存量项目分层迁移指南（提取转化 / 封存 / 归位操作手册）

工具链（命令语义保持，能力扩展）：

- `init.mjs`：生成 v3 完整结构（含 `workspace/changes/`、`workspace/archive/`、`docs/knowledge/`、`docs/rules/` 及模板文件）
- `adopt.mjs`：沿袭 v2 保守语义（冲突跳过），新增生成 docs/ 骨架
- `validate.mjs`：
  - 新增**差距报告模式**：`--report text|json`，输出分级判定（`error`：违反红线/缺必备结构；`warning`：命名不规范/知识缺索引/knowledge 文档缺 changelog 小节）
  - 校验规则与契约同步（禁止路径、红线 2 的厚副本检测）
- 新增 `templates/change/`：proposal / tasks / verify / design 四个产物模板
- 新增 `templates/bootstrap/`：从 `sealed/v1-full` 的 `legacy-project-wiki-kit` re-home 6 阶段梳理流水线（prompt 模板 + 产物模板），产物落点改为 `docs/knowledge/`
- `templates/minimal/` 同步升级

### 5.3 兼容与版本

- `schemaVersion: 3.0.0`（不兼容升级：workspace 结构要求变更）；工具拒绝未知主版本（沿 v2 策略）
- v2 项目 → v3 路径：`adopt --dry-run` 预览 → 人工按 migration-guide 执行 → `validate --report` 看差距 → 迭代至通过
- 工具不自动搬内容（已确认决策）

## 6. 设计第 3 节：MPOC 试点迁移设计

### 6.1 选型理由

MPOC-AM 2026-10-17 刚 init（r16373），workspace 为空、零 v1 包袱、AGENTS.md 为模板原文——验证"新契约从零启动的完整形态"，不被历史迁移问题干扰。ITS/PayNow 的存量迁移问题在第二、三轮处理。

### 6.2 试点步骤（每步可验证、可回滚——SVN 本地不提交即可回退）

| 步骤 | 操作 | 验证 |
|---|---|---|
| 1. Layer 0 就绪 | 本仓库完成 v3 升级（契约 + 工具 + 模板） | `node --test tests/*.test.mjs` 全绿 |
| 2. 差距判定 | MPOC 上 `node <standards>/src/validate.mjs --project . --report text` | 输出基线差距报告（预期：缺 changes/archive/docs 结构） |
| 3. 结构生成 | `adopt.mjs --dry-run` 审阅后执行；`project.yaml` 升级 `schemaVersion: 3.0.0` | 生成清单与 dry-run 一致 |
| 4. 入口定制 | AGENTS.md 升级为 MPOC 定制版（指向 docs/knowledge/、docs/rules/、MPOC 构建命令、PCI 引用）；AI_RULES.md 转薄指针 | ≤120 行、无标准树副本 |
| 5. 知识平移 | 从 `mpoc/docs/ai-knowledge/` 现有内容平移到标准位置（只搬 + 归位，不新写；平移即初始 changelog 登记，来源记 `bootstrap`）；平移完成后原位置删除（文档非业务代码，SVN 可回溯）。不启用梳理流水线（试点后按需） | knowledge/README.md 索引可导航，原位置无残留 |
| 6. 合规验收 | `validate --project . --strict` | 退出码 0 |
| 7. 实战验证 | 在 MPOC 选一个真实小变更，走完 proposal → tasks → 实现 → verify → archive 全流程 | 产物齐全、结构合规、负担可接受 |

### 6.3 试点成功标准（满足后才启动 ITS / PayNow）

1. `validate --strict` 通过。
2. 至少 1 个真实变更走完归档全流程（步骤 7）。
3. 用户 review 认可工作流负担与产出价值平衡（ceremony 量级：小变更 ≤10 分钟、大变更 ≤30 分钟）。
4. 试点中发现的契约缺陷已在 Layer 0 修订（试点即契约的实战测试）。

ITS / PayNow 推广按已确认顺序与策略执行，只定标准、不定日程。

### 6.4 范围外（本次不做）

- 不动 MPOC 的 `commit_msg_*.txt`（本地工作习惯，只记录卫生建议）。
- 不实现工具自动迁移存量内容。
- 不做知识内容的自动化质量判定（机器只管结构）。
- 不修改任何项目业务代码（"不改变业务"硬约束）。

## 7. 错误处理与回滚

- 所有工具操作保持 v2 保守默认：目标文件存在则跳过并报 `CONFLICT_EXISTS`，仅 `--force` 覆盖模板列表内文件。
- 迁移回滚：SVN 项目用 `svn revert` / 删除未提交的新增文件；Layer 0 用 git 分支。
- 校验器 fail-closed：未实现的 JSON Schema 关键字拒绝加载（沿 v2 §6）。

## 8. 测试策略

- Layer 0：新增/更新测试覆盖——v3 结构生成（init/adopt）、差距报告分级、红线检测（标准树副本/厚副本/禁止路径）、命名规范校验、knowledge changelog 校验（warning 级）、schemaVersion 3.0.0 校验、v2→v3 升级路径。
- bootstrap 流水线：模板完整性测试（6 阶段 prompt/产物模板存在且落点指向 docs/knowledge/，不引用禁止路径）；流水线本身在 MPOC 试点后首个启用项目中做集成验证。
- MPOC 试点：以 `validate --strict` 退出码 + 一个真实变更全流程作为集成验收。

## 9. 实施顺序（writing-plans 阶段的输入）

1. Layer 0 契约 + schema + 模板升级（含 changelog 约定入契约）
2. 工具链（init/adopt/validate）升级 + 测试
3. migration-guide 编写 + bootstrap 流水线模板 re-home（`templates/bootstrap/`）
4. MPOC 试点（步骤 2–7）
5. 试点复盘 → 修订 Layer 0 →（后续轮次）ITS → PayNow（启用 bootstrap：校验现有文档一致性 + 补缺口）
