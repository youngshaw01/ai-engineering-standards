---
name: legacy-project-wiki
description: >-
  Turns a legacy codebase into evidence-anchored business wiki pages under
  .harness/wiki through a 6-phase pipeline (recon, capability clustering,
  per-domain deep dives, cross-cutting concerns, index, adversarial audit).
  Use when the user asks to 梳理/分析遗留项目、生成业务 wiki、codebase onboarding
  docs, or says 业务梳理 / 梳理wiki / legacy wiki. Not for greenfield design.
disable-model-invocation: true
---

# Legacy Project Wiki（遗留项目业务梳理）

> **定位**：workflow Skill。把「只读侦察 → 业务聚类 → 逐域深挖 → 横切关注点 → 索引 → 反向审计」串成一条**可验证流水线**，最终产出 `.harness/wiki/`。
> **约束**：本 Skill 不覆盖项目 Rule；分析阶段**只读**，禁止修改任何源码；一切结论必须证据锚定。

## 可执行工作包（推荐）

在遗留项目仓库中部署完整工作规程，而非仅阅读本 Skill：

```
templates/harness/legacy-project-wiki-kit/
├── AGENTS.md
└── .harness/
    ├── prompts/COORDINATOR.md   ← 交给协调 Agent 的入口
    ├── workflow/                ← 门槛、交接、STATUS
    └── wiki/                    ← 初始化模板
```

**启动方式**：复制工作包到目标仓库 → 将 `COORDINATOR.md` 交给有仓库权限的 Agent → 从阶段 0 逐阶段执行，**不要**一次性跑完全部 Prompt。

阶段 Prompt 位于工作包 `.harness/prompts/`（`00-prepare.md` … `06-independent-audit.md`；`07-finalize.md` 为交付收尾，非独立阶段）。质量门槛见 `.harness/workflow/quality-gates.md`；封版验证见 `validation-checklist.md`。

## 何时使用

| 场景 | 建议 |
|------|------|
| 接手遗留系统、文档缺失、重构前摸底 | 完整 6 阶段 |
| 只需搞清单个模块 | Phase 1 + Phase 2 + 单个 Phase 3 域 |
| 新人 onboarding、业务方要读得懂的文档 | Phase 1–3 + Phase 5 索引 |
| 新项目从零设计 | **不使用**（走 PRD / 架构设计流程） |

**触发方式**：用户显式要求（`/legacy-project-wiki` 或「梳理这个项目的业务 / 生成业务 wiki」）。
**不适用**：纯代码修改、typo、单文件阅读。

## 核心原则（先想清楚，再动手）

1. **不要一次性让 agent「分析整个项目」**——上下文会爆炸，输出沦为空洞的目录复述。分阶段、分领域、每阶段独立会话。
2. **按业务能力组织，不按技术分层**——产出 `订单.md / 支付.md`，而不是 `controllers.md / services.md`。
3. **强制证据锚定（Evidence Anchoring）**——每条结论附 `文件路径:行号`；无证据一律标 `[待确认]`，禁止编造。
4. **每阶段一个产物文件，可独立校验**——阶段 N 的输出是阶段 N+1 的输入，形成流水线。

## 证据分级

| 标记 | 含义 |
|------|------|
| `[事实]` | 直接来自源码 / 配置，附 `文件:行号` |
| `[推断]` | 由证据推理得出，必须写明推断依据 |
| `[待确认]` | 无证据或超出已查证范围，**必须**汇总进 `_pending.md` |

## 目标产物结构

```
.harness/wiki/
├── README.md              # 索引 + 阅读顺序 + 反查表
├── 00-recon.md            # 侦察：技术栈/入口/配置（事实层）
├── 01-capability-map.md   # 业务能力地图（聚类层）
├── 02-architecture.md     # 架构与横切关注点
├── domains/               # 按业务域拆分 ★核心
│   ├── order.md
│   └── user-auth.md
├── flows/                 # 跨域端到端流程
├── data/                  # er.md / state-machines.md
├── integrations/          # third-party.md
├── _pending.md            # 所有 [待确认] 问题汇总
└── _audit.md              # Phase 6 审计报告
```

## 流程总览

```
Phase 0 准备 → Phase 1 侦察 → Phase 2 能力提取 → Phase 3 逐域深挖
    → Phase 4 横切关注点 → Phase 5 索引 → Phase 6 审计校验
```

**每阶段开新会话**，把上一阶段产物作为输入喂进去，避免上下文漂移。会话中断后从 `.harness/workflow/STATUS.md` 和磁盘产物续跑，不依赖聊天上下文。

---

## Phase 0 — 准备

创建目录骨架：

```bash
mkdir -p .harness/wiki/{domains,flows,data,integrations}
```

确认分析范围（是否含子模块 / frontend / ops），记入本次会话约束。

---

## Phase 1 — 全局侦察（Recon）

**只收集事实，不写业务。**

- 技术栈识别（语言 / 框架 / ORM / DB / 缓存 / MQ / 调度）→ 依据 `pom.xml` / `package.json` / `go.mod` / `requirements.txt`
- 目录结构（深度 2），每个目录仅标「推测职责」+ `[待确认]`
- **入口点清单**（后续所有分析的起点）：HTTP 路由注册文件与路由前缀、定时任务、MQ 消费者、CLI / main、启动脚本
- 配置与环境变量（配置路径 + 关键项）
- 规模与热点：代码行数 Top 20 文件、第三方服务清单

**产出**：`.harness/wiki/00-recon.md`
**验收**：随机抽 3 条结论，能顺着 `文件:行号` 找到证据。
**禁止**：出现「该模块负责 XX 业务」这类主观描述。

Prompt 见 [references/prompts.md](references/prompts.md#phase-1--全局侦察recon)。

---

## Phase 2 — 业务能力提取（Clustering）

1. 读所有路由 / API 定义，逐条列出 endpoint（method + path + handler）
2. 按 **URL 前缀 + 语义**聚类为「业务能力」（业务聚类，非技术分层）
3. 每能力给出：名称、一句话说明、包含的 endpoint、入口文件

**产出**：`.harness/wiki/01-capability-map.md`（表格 + endpoint 总数校验 + Top 10 能力域）
**验收**：扫描到的 endpoint 总数 = 归类数，无遗漏；无法归类的进「未分类」并说明原因。

Prompt 见 [references/prompts.md](references/prompts.md#phase-2--业务能力提取clustering)。

---

## Phase 3 — 领域深度分析（逐域，可并行）★核心

每个业务域**单独开一个会话 / 子 agent**，从该域入口路由顺着调用链读到「落库 / 外部调用 / 返回响应」，**不跳读**。

抽取：端到端调用链（粒度到 `文件:函数名`）、数据模型（表 / 字段 / 索引）、业务规则、外部依赖（服务 / 第三方 API / MQ topic / 缓存 key）、特殊逻辑（TODO/FIXME、魔法数字、硬编码、绕过逻辑）。

**产出**：`.harness/wiki/domains/{domain}.md`（固定模板，见 [references/artifacts.md](references/artifacts.md)）
**并行技巧**：把 Top 10 能力域分发给子 agent，每个只读**白名单路径**，省 context、防跑偏。

Prompt 见 [references/prompts.md](references/prompts.md#phase-3--领域深度分析逐域可并行)。

---

## Phase 4 — 横切关注点

产出 `.harness/wiki/02-architecture.md`，覆盖：认证与授权、错误处理、事务边界、缓存策略、日志与监控、配置与开关、部署拓扑。每条附代码位置，推断标 `[推断]`。

同时产出：`data/er.md`（全局 ER）、`data/state-machines.md`（状态机汇总）、`flows/*.md`（跨域流程）。

Prompt 见 [references/prompts.md](references/prompts.md#phase-4--横切关注点)。

---

## Phase 5 — 索引与交叉链接

产出 `.harness/wiki/README.md`：按「新人上手路径」排序阅读顺序、每文件一句话摘要、业务域 → 代码路径反查表；汇总所有 `[待确认]` 到根 `_pending.md`；检查交叉引用链接（相对链接）；报告孤立文件。

Prompt 见 [references/prompts.md](references/prompts.md#phase-5--索引与交叉链接)。

---

## Phase 6 — 审计校验（防幻觉）

用**第二个 agent** 扮演「找茬」，随机抽 20 条结论回源码验证（优先抽业务规则 / 状态机 / 数据模型），判定 `通过 / 过度推断 / 错误 / 遗漏`，输出 `_audit.md`，修正反馈给 Phase 3 修订。

Prompt 见 [references/prompts.md](references/prompts.md#phase-6--审计校验防幻觉)。

---

## Prompt 工程关键技巧

| 技巧 | 说明 |
|------|------|
| 角色 + 硬性约束前置 | 「只读」「必须附证据」「禁止编造」放 prompt 最前 |
| 强制输出路径 | 明确 `写入 .harness/wiki/xxx.md`，否则只在对话里输出会丢失 |
| 模板锁定 | 给固定 markdown 模板，跨文件结构一致，便于下游 agent 消费 |
| 总数校验 | 「扫描到 N 个，归类 M 个」强制自检遗漏 |
| 证据锚定 | 每条结论 `文件:行号`，无证据标 `[待确认]` |
| 推断分级 | `[事实]` / `[推断]` / `[待确认]` 三级 |
| 单域单会话 | 每个业务域独立 context，避免长对话后约束失效 |
| 文件白名单 | 给子 agent 明确「只准读这些路径」 |
| 反向校验 | 独立 agent 专找幻觉 |
| 先计划后执行 | 大阶段前先让 agent 出计划，人工确认后再执行 |

## 反模式（别踩）

1. ❌ 一句话 prompt：「帮我分析这个项目并写文档」→ 输出全是文件名的同义反复
2. ❌ 按技术分层建文档：`controllers / services / daos` → 业务方看不懂
3. ❌ 不做 Recon 直接进领域 → agent 找不到入口，靠猜
4. ❌ 同一会话跑完全部阶段 → 上下文污染，后期约束失效
5. ❌ 没有校验环节 → 业务规则幻觉率高
6. ❌ 文档写完就不管 → `_pending.md` 无人跟进等于没写

## 完成检查清单

```
- [ ] 00-recon.md：入口点清单完整，结论均有 文件:行号
- [ ] 01-capability-map.md：endpoint 总数 = 归类数，无遗漏
- [ ] domains/*.md：每条业务规则有代码位置；推断已标 [推断]
- [ ] 02-architecture.md + data/* + flows/* 已产出
- [ ] README.md：阅读顺序 + 反查表 + 交叉链接完整
- [ ] _pending.md：所有 [待确认] 已汇总
- [ ] _audit.md：抽检 20 条，错误项已反馈修订
- [ ] 全流程只读，未修改任何源码
```

## 与 Harness 体系的关系

| 层级 | 对应 |
|------|------|
| 产物 | `.harness/wiki/`（业务知识沉淀，非任务产物） |
| Rule | `.harness/AGENTS.md` 最小修改 / 证据优先约束 |
| 校验 | Phase 6 独立 agent 审计，对齐 `governance/gates.yaml` |

> 说明：`.harness/wiki/` 是**长期知识产物**；若项目约定任务产物写 `workspace/current/{task_id}/`，二者并不冲突——wiki 是沉淀结果，workspace 是过程记录。

## 附加资源

- **可执行工作包**：`templates/harness/legacy-project-wiki-kit/`（含 COORDINATOR、分阶段 Prompt、workflow、wiki 模板）
- Prompt 速查（会话内粘贴用）：[references/prompts.md](references/prompts.md)
- 产物模板：[references/artifacts.md](references/artifacts.md)