# 遗留项目 Wiki 工作流操作手册

## 目的与角色
本流程让有仓库访问权限的 Agent 把真实代码转化为业务 Wiki。它不是“一次性项目总结”Prompt，而是一条有输入、输出、门槛、可恢复点的流水线。

- **协调 Agent（Orchestrator）**：维护阶段状态、分配任务、执行门槛检查、汇总结果；不代替领域 Agent 编造业务。
- **阶段 Agent**：每次只执行一个阶段，产出规定文件。
- **领域 Agent**：每个业务域单独上下文，只读分配的路径白名单和公共证据。
- **审计 Agent**：与撰写者尽可能分离，负责反证、查错和覆盖审查。
- **人类确认人**：解决代码无法回答的产品语义、业务意图和历史兼容原因。

## 阶段模型

| 编号 | 名称 | Prompt | 说明 |
|------|------|--------|------|
| 0 | 准备 | `00-prepare.md` | 基线、范围、目录骨架 |
| 1 | Recon | `01-recon.md` | 技术栈与分类入口清单 |
| 2 | 能力地图 | `02-capability-map.md` | 入口聚类与独立计数 |
| 3 | 领域分析 | `03-domain-analysis.md` | 每域一个文件，可并行 |
| 4 | 横切分析 | `04-cross-cutting.md` | 架构、ER、状态机、流程、集成 |
| 5 | 索引 | `05-index-and-pending.md` | README、`_pending.md`、`_manifest.yaml` |
| 6 | 审计 | `06-independent-audit.md` | 独立反证，产出 `_audit.md` |
| — | 交付收尾 | `07-finalize.md` | **非独立阶段**；阶段 6 后由协调 Agent 做机械化核验与交付报告 |

## 首次启动
1. 确认当前工作目录是仓库根目录：`git rev-parse --show-toplevel`（若不是 Git 仓库，记录原因）。
2. 查看 `git status --short`、当前分支与 commit SHA。不得覆盖已有未提交改动。
3. 阅读根目录 `AGENTS.md` 及仓库贡献指南、安全规则（若存在）。
4. 检查 `.harness/wiki/` 是否已有内容。若有，先盘点并备份/比较，不得无条件覆盖。
5. 创建目标目录：`mkdir -p .harness/wiki/{domains,flows,data,integrations}`。
6. 从模板初始化（**路径均相对仓库根**）：
   - `.harness/workflow/STATUS.template.md` → `.harness/workflow/STATUS.md`
   - `.harness/wiki/README.template.md` → `.harness/wiki/README.md`
   - `.harness/wiki/_pending.template.md` → `.harness/wiki/_pending.md`
   - `.harness/wiki/_audit.template.md` → `.harness/wiki/_audit.md`
   - `.harness/wiki/_manifest.template.yaml` → `.harness/wiki/_manifest.yaml`
7. 按阶段 0→6 执行；阶段 6 通过后执行 `07-finalize.md`。阶段之间可新开会话，但交接必须使用磁盘文件。

## 路径与链接规则（复制到旧项目后）

| 引用类型 | 规则 | 示例 |
|----------|------|------|
| Prompt / 规程 | 相对仓库根 | `.harness/prompts/01-recon.md` |
| Wiki 互链 | 相对 `.harness/wiki/` | `domains/order.md`、`data/er.md` |
| Wiki → 源码 | 从 wiki 文件到仓库根，带行号锚点 | 自 `00-recon.md`：`../../src/api/router.go#L10-L20` |
| 证据正文 | `相对路径:起始行-结束行` | `src/handler/order.go:42-88` |

复制后自检：打开 `README.md` 中 2–3 条 wiki 互链和 2–3 条源码链接，确认目标文件存在且行号可定位。

## 入口计数规范（阶段 1–2 强制）

各类入口**分开统计、分开建表**，禁止把 MQ/定时任务/CLI 混入 HTTP endpoint 数。

| 类别 | 计数键 | 说明 |
|------|--------|------|
| HTTP/API | `http_raw` / `http_unique` / `http_classified` / `http_unclassified` | 须满足 `http_unique = classified + unclassified`；去重规则写入文档 |
| MQ 消费者 | `non_http_by_type.mq_consumer` | topic/queue、handler、注册位置 |
| 定时任务 | `non_http_by_type.cron` | job 名、cron 表达式、handler |
| CLI / 管理命令 | `non_http_by_type.cli` | 命令、子命令、入口函数 |
| Webhook / 事件 | `non_http_by_type.webhook` 等 | 触发源、handler |
| 动态路由盲区 | 单独章节 | 反射、代码生成、运行时注册——列可能遗漏范围，不得假装已全量 |

数字同步写入 `01-capability-map.md` 与 `_manifest.yaml` 的 `entry_counts`。

## 文件写入者（多 Agent 并行）

| 文件 | 唯一写入者 | 并行约束 |
|------|------------|----------|
| `domains/<slug>.md` | 该域领域 Agent | 每 Agent 仅一个 slug；不写其他域或全局文件 |
| `00-recon.md` | 阶段 1 Agent | — |
| `01-capability-map.md` | 阶段 2 Agent | — |
| `02-architecture.md`、`data/*`、`flows/*`、`integrations/*` | 协调 Agent 或阶段 4 Agent | 不与领域 Agent 并行写 |
| `README.md`、`_pending.md`、`_manifest.yaml` | 协调 Agent（阶段 5） | 合并各域待确认项 |
| `_audit.md` | 审计 Agent（阶段 6） | 与撰写 Agent 分离 |
| `STATUS.md` | 协调 Agent | 各阶段结束后更新 |

领域 Agent 的待确认问题写入本域文档 §11；**不得**直接修改根目录 `_pending.md`。

## 完成状态命名

**阶段状态**（`STATUS.md`）：`未开始` | `进行中` | `通过` | `有条件通过` | `阻塞`

- `通过`：对应 `quality-gates.md` 该阶段全部满足。
- `有条件通过`：核心交付物可用，但有已知局限、待确认项或部分盲区已记录；可进入下一阶段，但须在 `_pending.md` 或交付报告中说明。
- `阻塞`：门槛未满足或存在未修订的错误结论；**不得**进入下一阶段。

**审计最终结论**（`_audit.md`）：`通过` | `有条件通过` | `不通过`（与 `_manifest.yaml` 的 `audit_status` 映射：`passed` | `conditional` | `failed`）

**Wiki 整体**（`_manifest.yaml`）：`coverage_status` = `complete` | `partial` | `blocked`

文档生成成功 ≠ 证据通过审计。仅当阶段 6 为 `通过` 或 `有条件通过`，且 `07-finalize.md` 交付报告完成，才可对外称 Wiki 可交付。

## Wiki 与源码版本绑定

每次分析维护 `.harness/wiki/_manifest.yaml`（自 `_manifest.template.yaml` 初始化）：

- `source_commit`：分析对应的源码基线标识（Git commit SHA 或 SVN revision）
- `analyzed_at`：分析日期
- `coverage_status`：`complete` | `partial` | `blocked`
- `audit_status`：`not_audited` | `passed` | `conditional` | `failed`
- `pending_count`：未关闭待确认项数量
- `domains[]`：各域 slug、`source_commit`、`coverage_status`、主要路径

**源码变更后**：若当前 revision ≠ `source_commit`，标记 `stale: true`，用版本控制工具的差异命令识别受影响路径（Git：`git diff source_commit..HEAD --name-only`；SVN：`svn diff -r <rev>:HEAD --summarize`），更新 `domains_needing_reanalysis`，仅重审受影响域及相关横切文档（入口注册机制变更时重跑阶段 1–2）。

## 阶段门槛
| 阶段 | 必须交付 | 推进条件 |
|---|---|---|
| 0 准备 | STATUS.md、仓库基线、范围声明 | 工作区状态记录完成，权限与范围明确 |
| 1 Recon | `.harness/wiki/00-recon.md` | 技术/入口/配置清单有证据；覆盖范围和盲区明确 |
| 2 能力地图 | `.harness/wiki/01-capability-map.md` | endpoint/入口清单与分类计数可复核；未分类项显式列出 |
| 3 领域分析 | `.harness/wiki/domains/*.md` | 每个选定领域按模板完成；关键规则均有证据；待确认项转入总清单 |
| 4 横切分析 | 架构、ER、状态机、跨域流程、集成文档 | 只汇总已验证信息；关系和流程标明证据及推断 |
| 5 索引 | `README.md`、`_pending.md`（含附录：各域「待确认」全量索引） | 链接有效、待确认项去重、业务域反查表完整；附录条数已核对 |
| 6 审计 | `_audit.md` | 抽样可复现；错误已修订并复核；口径时点、清单统计、审计局限已写明；最终结论为通过或有条件通过 |
| 交付收尾 | 交付报告（聊天或 `workspace/`） | `07-finalize.md` 检查通过；`_manifest.yaml` 与审计一致 |

## 推荐执行节奏
- 中小型仓库：一个协调 Agent + 阶段 Agent；领域可以串行。
- 中大型仓库：一个协调 Agent + 1 个 Recon Agent + 领域 Agent 并行 + 独立审计 Agent。
- 并行只在 Recon 与能力地图通过之后进行。领域 Agent 的任务边界必须来自能力地图和文件路径证据，不得凭模块名猜。
- 同时运行的领域 Agent 建议不超过 3–5 个，避免相互覆盖和上下文浪费。
- 每个 Agent 只写分配的目标文件。README、全局待确认清单、最终 ER 与总状态由协调 Agent 统一维护。

## 续跑/恢复
会话中断后：
1. 先读 `STATUS.md`，再读最近阶段产物和仓库当前 commit。
2. 检查文件是否存在、是否完整、是否通过门槛；不要仅凭状态文件中的“完成”字样相信结果。
3. 从第一个未通过门槛的阶段恢复。已通过阶段不重做，除非源码 commit 变化或后续审计发现基础错误。
4. 若 commit SHA 变化，标记旧 Wiki 可能过期；比较改动范围，重跑受影响的阶段和引用审计。
5. 失败重试最多两次；仍失败时记录具体阻塞、已尝试方法与需要的人类决策，不得无限探索。

## 版本控制与提交
- 开始和结束均记录工作区状态与源码基线标识（Git：`git status --short` + commit SHA；SVN：`svn status` + revision）。
- 默认不自动 commit、不 push、不创建 PR；除非用户明确授权。
- 只允许提交用户要求的文档目录；绝不把源码改动、秘密文件或无关格式化混入。
- 完成后提供变更文件清单、阶段门槛结果、未覆盖范围、审计结果和建议的人工确认事项。

## Wiki 的维护机制
每个领域文档头部包含：`source_commit`、`analyzed_at`、主要源码范围、`coverage_status`（与 `_manifest.yaml` 中该域条目一致）。
代码改动后按 `_manifest.yaml` 的重审规则更新受影响域和横切文档。无法确认的语义进入 `_pending.md`，不把未决问题永久留在聊天记录中。

封版前验证见 `.harness/workflow/validation-checklist.md`。
