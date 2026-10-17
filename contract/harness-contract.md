# Harness Contract v3

> **版本**：`3.0.0`（与 `project.yaml` → `schemaVersion` 一致）  
> **配置 Schema**：[`project-config.schema.json`](project-config.schema.json)（校验解析后的对象）  
> **接入**：[`adoption-contract.md`](adoption-contract.md) · **v2 → v3 升级**：[`migration-guide.md`](migration-guide.md)

## 1. 目的、范围与非目标

### 1.1 目的

为消费项目提供 **可验证、可复制** 的工程管理结构：机器可读配置、短入口 `AGENTS.md`、变更单元工作流（proposal → tasks → verify → archive）、领域知识标准落位与追溯约定。

### 1.2 适用范围

- Git 或 SVN 工作副本上的应用/库仓库。  
- 通过本仓库 `src/init.mjs`、`src/adopt.mjs`、`src/validate.mjs` 生成与校验（**不得**依赖 v1 封板树内脚本）。

### 1.3 非目标

- 语言/框架规范大全、`rules/` 并列体系、`.harness/` 内 `wiki/`/`knowledge/`/`context/`/`index/`/`agents/` 未经契约扩展不得出现。  
- MCP、插件自动同步、多 Agent 编排、跨仓库索引。  
- 自动搬迁业务源码或删除用户目录；知识内容的自动化质量判定（机器只管结构）。

## 2. 标准库仓库（Layer 0）布局

```
ai-engineering-standards/
├── README.md
├── VERSION
├── CHANGELOG.md
├── LICENSE
├── contract/
│   ├── harness-contract.md          # 本文件（SSOT）
│   ├── project-config.schema.json
│   ├── adoption-contract.md
│   └── migration-guide.md           # v2 → v3 升级指南
├── templates/
│   ├── minimal/                     # 消费项目骨架模板
│   ├── change/                      # 变更单元产物模板（proposal/tasks/design/verify）
│   └── bootstrap/                   # 初始知识梳理流水线（标准库内读取，不复制进项目）
├── src/init.mjs | adopt.mjs | validate.mjs
├── examples/new-project/ | existing-project/
└── tests/
```

**禁止** Layer 0 根目录出现 `.harness/` 元副本、`archive/`、v1 章节目录作为活动实现。

## 3. 消费项目（Layer 1）布局

### 3.1 必需

| 路径 | 必需 |
| --- | --- |
| `AGENTS.md` | 是（init/adopt 生成，可编辑） |
| `.harness/project.yaml` | 是（`schemaVersion: 3.0.0`） |
| `.harness/README.md` | 是 |
| `.harness/workspace/changes/` | 是（目录存在即可） |
| `.harness/workspace/archive/` | 是（目录存在即可） |
| `docs/knowledge/README.md` | 是（知识索引） |
| `docs/rules/README.md` | 是（项目特化规则索引） |

### 3.2 标准布局（生成 + 推荐）

```
AGENTS.md
.harness/
├── project.yaml
├── README.md
└── workspace/
    ├── changes/                   # 进行中的变更单元（可多个并行）
    │   └── {type}-{slug}-{NNN}/   # 如 feature-pci-module-split-001
    │       ├── proposal.md        # 必备
    │       ├── design.md          # 可选（跨模块/架构级变更）
    │       ├── tasks.md           # 必备
    │       ├── verify.md          # 归档前必备
    │       └── artifacts/         # 可选（该变更专属脚本/SQL/报告）
    └── archive/                   # 已完成归档（只读）
        └── {YYYYMMDD}-{type}-{slug}-{NNN}/
docs/
├── knowledge/                     # 领域知识：系统"是什么"
│   ├── README.md                  # 索引（必备）
│   └── business.md / architecture.md / database.md / deployment.md（推荐初始集）
└── rules/                         # 项目特化规则："必须怎么做"
    ├── README.md
    └── *.md                       # 如 svn.md、pci-compliance.md
```

推荐初始集文件按需创建；运行 bootstrap 流水线（§5.3）时以其产物结构（recon / capability-map / domains / flows / data / integrations 等）扩展 `docs/knowledge/`。`workspace/.gitkeep`（v2 遗留占位）不再生成。

### 3.3 禁止（未经扩展不得作为并列 SSOT）

`harness.yaml`、v1 `apiVersion: harness.blueprint/v1` 配置、`.harness/rules/`、`.harness/skills/`、`.harness/knowledge/`、`.harness/wiki/`、`.standards/`。

校验器 **必须** 检测上述路径（文件或目录）是否存在；规则集合与 `FORBIDDEN_LEGACY_PATHS`（`src/lib/paths.mjs`）及测试保持一致。

## 4. workspace 工作流契约（变更单元模型）

### 4.1 change-id 命名

- 进行中：`{type}-{slug}-{NNN}`，如 `feature-pci-module-split-001`。  
- `type` ∈ `feature | bugfix | refactor | docs | ops`；项目可通过 `project.yaml` → `workflow.types` 覆盖默认清单。  
- `slug`：kebab-case 英文小写；`NNN`：三位序号，项目内递增。  
- 归档：目录移入 `archive/` 并加 `{YYYYMMDD}-` 前缀（日期取变更**创建**日）。

### 4.2 产物分级

| 产物 | 要求 | 说明 |
| --- | --- | --- |
| `proposal.md` | 必备 | Why / What Changes / Out of Scope / 验收标准 / Impact |
| `tasks.md` | 必备 | 任务清单（checkbox）；小变更可仅 3 行 |
| `design.md` | 可选 | 跨模块 / 影响架构 / 修改接口的变更才要求 |
| `verify.md` | 归档前必备 | 构建/测试/验证记录；未验证不得声称通过 |
| `artifacts/` | 可选 | 变更专属产物；禁止散落 workspace 根 |

模板：标准库 `templates/change/`（项目内不保留副本，创建 change 时引用）。

### 4.3 生命周期

```
创建 change（proposal + tasks）→ [design 可选] → 实现（勾选 tasks）
→ verify（记录证据）→ archive（移入 archive/，加日期前缀）
→ [可选] 知识回流：已验证认知合并进 docs/knowledge/ 并登记变更记录
```

- `workspace/changes/` 根目录禁止散落文件（产物必须位于 change 目录内）。  
- 知识回流为人工动作；回流时 **必须** 在目标 knowledge 文档"变更记录"登记一行（§5.2）。

## 5. 知识与规则落位

### 5.1 落位标准

| 内容类型 | 标准位置 | 判定 |
| --- | --- | --- |
| 领域知识（业务/架构/DB/部署/术语） | `docs/knowledge/` | 描述系统"是什么" |
| 项目特化规则（SVN 规范、合规、路径约定） | `docs/rules/` | 描述"必须怎么做"；项目特有才放此 |
| 通用工程规则（L0-L5 等） | **不落项目**；引用标准库/全局规则 | AI 适配层只做薄指针 |
| 过程产物 | `.harness/workspace/` | 变更单元生命周期内 |
| v1 遗产 | `workspace/archive/` 封存 或 `docs/_legacy/` 只读 | 禁止留在活动路径 |

### 5.2 追溯约定（变更记录）

每个 `docs/knowledge/*.md` 尾部 **必须** 含：

```markdown
## 变更记录
| 日期 | 来源 change-id | 摘要 |
| --- | --- | --- |
| 2026-10-17 | bootstrap | 初始梳理（bootstrap 流水线） |
```

- 初始梳理来源记 `bootstrap`；日常回流记归档后的 change-id。  
- 追溯链：`archive/`（过程证据）⇄ knowledge 变更记录（当前态 + 来源）⇄ VCS 历史。

### 5.3 初始知识梳理（bootstrap，可选阶段）

存量项目可启用业务代码驱动的初始梳理：标准库 `templates/bootstrap/` 提供 6 阶段流水线（recon → capability-map → domain-analysis → cross-cutting → index → audit）+ 交付收尾。

- 形态：AI 辅助梳理 + **人工审定**；逐阶段验收后推进（门槛见 `templates/bootstrap/workflow/quality-gates.md`）。  
- Prompt 与规程在 **标准库内读取**，不复制进项目（红线 1）。  
- 进度状态 `STATUS.md` 写入变更单元 `.harness/workspace/changes/docs-knowledge-bootstrap-{NNN}/`。  
- 产物落 `docs/knowledge/`，变更记录来源记 `bootstrap`。  
- 对已有旧文档的项目：定位为"校验现有文档与代码一致性 + 补缺口"，非从零重写。

## 6. 红线

| # | 红线 | 执行方式 |
| --- | --- | --- |
| 1 | 禁止在项目内复制标准库契约/规则树 | 机器强制（error）：`docs/` 下出现标准树签名子目录组合（`docs/_legacy/` 豁免） |
| 2 | AI 规则适配层（AI_RULES.md 等）必须为薄指针 | 机器强制（error）：>60 行或含 L0-L5 章节结构特征 |
| 3 | `workspace/` 内禁止永久规范正文 | 人工审查（机器不作正文内容判定） |
| 4 | §3.3 禁止路径 | 机器强制（error） |

## 7. 文件职责（SSOT）

| 路径 | 唯一职责 | 禁止 |
| --- | --- | --- |
| `AGENTS.md` | Agent 入口；≤120 行 | 长 SOP、重复 project.yaml 字段表 |
| `.harness/project.yaml` | 身份、`vcs`、标准库版本引用、workflow 定制 | 业务模块表、密钥 |
| `.harness/workspace/` | 变更单元与过程产物 | 永久规范正文 |
| `docs/knowledge/` | 领域知识当前态 + 变更记录 | 过程产物、规则正文 |
| `docs/rules/` | 项目特化规则 | 标准库规则副本 |
| `contract/*`（标准库） | 契约 SSOT | 项目内复制整份契约 |

**重复内容**：业务事实以代码/测试为准；契约只定义 Harness 形状，不定义业务规则正文。

## 8. AGENTS.md

- **长度**：目标 50–120 行。  
- **必须**：指向 `.harness/project.yaml`；说明 workspace 用途与变更单元工作流入口；指向 `docs/knowledge/`、`docs/rules/`。  
- **不得**：复制 `harness-contract.md` 全文；不得定义与契约冲突的目录。

## 9. project.yaml

- **格式**：YAML。  
- **Schema**：`project-config.schema.json`（`schemaVersion` **必须**为 `3.0.0`）；校验器 **必须**按该 JSON Schema 文件执行验证（`src/lib/json-schema.mjs`），不得维护与之冲突的平行规则集；**未实现**的 JSON Schema 关键字须 **fail-closed**（拒绝加载或校验），不得静默忽略。  
- **必填**：`schemaVersion`、`projectId`、`vcs`（`git` | `svn`）、`standards.repository`、`standards.version`。  
- **可选**：`workflow.types`（string[]，覆盖默认 type 清单）。  
- **默认**：`standards.contract` 缺省视为 `contract/harness-contract.md`（校验器按此补全后验证）。  
- **版本策略**：不兼容变更 bump `schemaVersion`；工具拒绝未知主版本。

## 10. 优先级（消费项目内）

1. 代码、迁移、可重复测试/门禁日志  
2. `.harness/project.yaml`  
3. 本仓库 `contract/`（引用，非项目内第二副本）  
4. v1 Git 封板 `v1-sealed-20261013`（**仅人工阅读**，工具 **禁止**读取）

## 11. 生命周期

| 操作 | 命令 | 失败码 |
| --- | --- | --- |
| 新项目 | `node src/init.mjs --project <dir> ...` | 2=冲突 |
| 已有项目 | `node src/adopt.mjs --project <dir> ...` | 2=冲突, 3=legacy 未确认 |
| 校验 Layer 0 | `node src/validate.mjs` | 1=失败 |
| 校验消费项目 | `node src/validate.mjs --project <dir> [--report text]` | 1=失败 |
| v2 → v3 升级 | 见 `migration-guide.md`：`adopt --dry-run` → 人工升级 → `validate` 迭代 | — |
| 回滚 | 用户 VCS 回滚；工具不写回滚逻辑 | — |
| 退出 | 删除 `.harness/` 与 AGENTS.md（人工）；工具不提供 uninstall | — |

**保守默认**：存在目标文件则 **跳过** 并报告 `CONFLICT_EXISTS`；仅 `--force` 覆盖模板列表内文件。

## 12. 校验器规则与通过标准

`validate.mjs` **独立**于 `init`/`adopt` 实现（单独模块校验路径与 Schema）。输出分级 findings（`--report text|json`，默认 json）。

**error**（失败）：

- §3.1 必需结构缺失；`project.yaml` 解析/Schema 校验失败（`schemaVersion: 2.0.0` → 输出 `migration-guide.md` 升级指引）；§3.3 禁止路径；红线 1/2/4。

**warning**（`--strict` 模式下失败）：

- change 目录命名不合规（type 不在清单 / 格式错误 / 归档目录缺日期前缀）；`changes/` 根散落文件；`docs/knowledge/**/*.md` 缺"变更记录"小节；进行中 change 缺 `proposal.md` 或 `tasks.md`；v1 残留 `LEGACY_V1_*`（沿袭 v2）。

**通过**：`ok = errors.length === 0 && (!strict || warnings.length === 0)`；失败退出码 1。

## 13. 兼容性

- v3 **不**向后兼容 v2 workspace 预期：v2 项目缺 `changes/`/`archive/`/`docs/` 结构 → 差距报告 + `migration-guide.md` 升级路径。  
- v2 → v3 的 `project.yaml` 仅需 bump `schemaVersion`（v3 新增字段均可选）。  
- v1 残留语义沿袭 `adoption-contract.md`。
