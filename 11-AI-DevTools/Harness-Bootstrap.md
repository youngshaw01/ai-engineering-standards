# Harness Specification

> **Project AI Governance Workspace** — 所有项目接入 `ai-engineering-standards` 的前置条件。
>
> `.harness` 不是配置目录，它是 AI 在项目中的工作空间。

---

## Overview

### 为什么 .harness 必须存在？

AI Agent 与传统开发最大的区别：

```
传统开发：      开发者 → 代码

AI 时代：       AI Agent → 规则 → 知识 → 上下文 → 代码
```

没有 `.harness`，AI 不知道：

- 项目规则在哪里
- 当前任务是什么
- 哪些知识可信
- 修改记录在哪里
- 谁定义了例外

### 核心原则

1. **.harness 是唯一项目级 AI 工作空间**——不再设计 `.ai/`、`.ai-workspace/` 等替代方案
2. **接入前置条件**——任何项目（新/旧、Git/SVN）接入 `ai-engineering-standards` 必须先建立 `.harness`
3. **不保存标准内容**——`.harness` 只保存项目事实，通用标准由 `ai-engineering-standards` 提供
4. **新旧项目统一流程**——通过成熟度分级，支持渐进式接入

---

## Three-Layer Governance Model

```
ai-engineering-standards
        |
        | Global Rules（通用规则）
        |
        ↓
.harness
        |
        | Project Reality（项目事实）
        |
        ↓
.cursor/.trae/.claude
        |
        | Adapter（工具适配，无规则权力）
        |
        ↓
AI Agent
```

### 职责分工

| Layer | Location | Role | Defines |
|-------|----------|------|---------|
| **Layer 0** | `ai-engineering-standards/` | Global Standard | 通用安全红线、编码原则、Harness 规范 |
| **Layer 1** | `.harness/` | Project Governance | 项目规则、知识、AI 工作记录、上下文 |
| **Layer 2** | `.cursor/rules/` / `.trae/rules/` | AI Adapter | 无（纯转换层，消费 Layer 0 + Layer 1） |

---

## .harness 标准结构

```
.harness/
├── AGENTS.md              ← AI 入口
├── harness.yaml           ← 项目治理配置
│
├── rules/                 ← 项目规则（Layer 1）
├── knowledge/             ← 项目知识
├── skills/                ← AI 能力（可选，详见 Skill-Governance.md）
│   ├── skills.yaml        ← Skill 注册表
│   ├── workflow/          ← AI 工作方法论（superpowers-zh、grill-me）
│   ├── engineering/       ← 工程能力（java-review、api-testing）
│   ├── domain/            ← 领域能力（telecom、finance）
│   └── operations/        ← 运维能力（docker、kubernetes）
├── workspace/             ← AI 工作记录
│   ├── current/{task_id}/
│   └── history/{task_id}/
├── context/               ← AI 上下文分层
└── config/                ← 项目配置
```

项目全生命周期治理（需求→交付、环境晋升、反向回归、老项目改造），详见 [Project-Lifecycle-Governance.md](../01-Engineering/Project-Lifecycle-Governance.md)。

### 各目录职责

| 目录 | 职责 | 内容示例 |
|------|------|---------|
| `AGENTS.md` | AI 入口 | 项目概览、AI 行为约束、规则索引 |
| `harness.yaml` | 治理配置 | maturity、workspace path、task_id pattern |
| `rules/` | 项目规则 | 编码规范、工程结构、版本控制约束 |
| `knowledge/` | 项目知识 | 架构文档、业务流程、数据模型、领域术语 |
| `skills/` | AI 能力（可选） | skills.yaml + 分类 Skill（workflow/engineering/domain/operations） |
| `workspace/` | 工作记录 | plan.md、spec.md、tasks.md、debug-log.md |
| `context/` | 上下文分层 | layers.yaml——L1 常驻 / L2 阶段 / L3 按需 |
| `config/` | 项目配置 | paths.yaml、mcp servers 等 |
| `governance/` | 生命周期与门禁 | lifecycle.yaml、gates.yaml、legacy-roadmap.yaml |

### 关键调整：workspace 上提

**统一使用 `.harness/workspace/`**（不再是 `.harness/project/workspace/`）。

原因：workspace 是 Harness 核心能力，不属于 project 子域。

---

## Maturity Levels（接入成熟度）

不是功能等级，而是**接入成熟度**——项目可从 Bootstrap 起步，渐进升级。

### Bootstrap（必须，5 分钟接入）

**目标**：让 AI 有地方工作。

**适用**：所有项目初始化、脚本项目、POC、个人小工具。

```
.harness/
├── AGENTS.md
├── rules/
│   └── README.md
└── workspace/
    ├── current/
    └── history/
```

**最低要求**：

- AI 入口（AGENTS.md）
- 规则位置（rules/）
- 任务记录（workspace/）

### Standard（推荐，30 分钟接入）

**目标**：完整的 AI 工作环境。

**适用**：80% 的企业项目。

```
.harness/
├── AGENTS.md
├── harness.yaml
├── rules/
├── knowledge/
├── workspace/
│   ├── current/
│   └── history/
├── context/
└── config/
```

**增加**：

- 项目知识（knowledge/）
- 技术栈与路径配置（config/）
- 上下文管理（context/）
- 治理配置（harness.yaml）

### Enterprise（复杂系统，2 小时接入）

**目标**：多 Agent 协作、企业治理、审计。

**适用**：核心业务系统（如 Malaysia AcqSys）。

在 Standard 基础上增加：

```
.harness/
├── agents/                ← 多 Agent 定义
├── mcp/                   ← MCP Server 配置
├── skills/                ← AI 能力（SKILL.md）
├── governance/            ← 治理策略
├── audit/                 ← 审计记录
└── public/                ← 可复用资源
    ├── skills/
    ├── templates/
    └── tooling/
```

**增加**：

- 多 Agent 协作（agents/）
- MCP 集成（mcp/）
- 企业治理与审计（governance/、audit/）
- 可复用资源（public/）

---

## AI Skill 产物归属

### 统一规则

所有 AI skill（superpowers、executing-plans、openspec、systematic-debugging、TDD 等）产出的文件归入：

```
.harness/workspace/{task_id}/
```

**禁止放入**：

- `docs/`（人类正式文档目录）
- 项目根目录
- `.cursor/rules/` / `.trae/rules/`（工具适配层，不存储内容）

### task_id 命名规则

```
{date}_{type}-{feature}

示例：
  20260724_feat-token-optimization
  20260725_fix-svn-encoding
  20260718_refactor-dial-service
  20260720_bugfix-gbk-encoding
```

type 取值：`feat` / `fix` / `refactor` / `docs` / `test` / `chore`

### 单任务产物结构

```
.harness/workspace/current/{task_id}/
├── plan.md                ← 实现计划
├── spec.md                ← 规格文档
├── tasks.md               ← 任务清单
├── checklist.md           ← 验证清单
├── debug-log.md           ← 调试记录
└── validation.md          ← 验证结果
```

### 生命周期

```
current/{task_id}/  →  完成后  →  history/{task_id}/
```

完成后归档至 `history/`，`current/` 保持精简。

---

## Skill / Knowledge 归属

### 统一进入 .harness

```
.harness/
├── skills/
│   ├── skills.yaml        ← Skill 注册表（治理配置）
│   ├── workflow/           ← AI 工作方法论
│   ├── engineering/        ← 工程能力
│   ├── domain/             ← 领域能力
│   └── operations/         ← 运维能力
├── knowledge/
│   ├── README.md          ← 知识索引
│   ├── 架构.md
│   ├── 业务流程.md
│   └── 数据模型.md
└── workspace/
```

**不放 `.standards/`**——Skill 和 Knowledge 是项目运行时能力，不是标准。

### Skill 治理原则

1. **Skill 是可选能力，不是规则来源**——Skill 不得定义约束
2. **Skill 必须经过项目验证后启用**——禁止全局自动安装
3. **Skill 不得覆盖 Rule**——Rule 优先级永远高于 Skill
4. **Skill 不自动接管**——`auto_execute: false` 是默认值

详见 [Skill-Governance.md](Skill-Governance.md)。

### .standards/ 只保留 AI 接入声明

```
.standards/
├── profile.yaml           ← 项目接入配置
└── rule-id.yaml           ← 规则 ID 登记表
```

### 职责分工

| 目录 | 职责 | 内容 |
|------|------|------|
| `.harness/` | 项目运行时 | rules、knowledge、skills、workspace、context |
| `.standards/` | AI 接入声明 | profile.yaml、rule-id.yaml |
| `.cursor/` / `.trae/` | 工具适配 | 纯转换层，引用规则 ID |

---

## 新旧项目接入流程

### 新项目（Git）

```
1. mkdir .harness
2. 复制 templates/harness/bootstrap/ 内容
3. 编辑 AGENTS.md 填写项目信息
4. 开始开发
5. 项目成熟后升级到 Standard / Enterprise
```

### 老项目（SVN）

```
1. SVN checkout 现有代码
2. 创建 .harness（Bootstrap 模板）
3. AI 扫描项目，生成：
   - knowledge/（架构、业务流程、数据模型）
   - context/（layers.yaml）
   - rules/（从代码推断的约定）
4. 人工确认 AI 生成内容
5. 进入日常开发
6. 渐进升级到 Standard / Enterprise
```

**关键原则**：老项目接入不改代码，只建 .harness。

### 成熟度升级路径

```
Bootstrap → Standard → Enterprise

任意时刻可升级，升级时只增加目录，不删除现有内容。
```

---

## profile.yaml 配置

```yaml
governance:
  harness:
    required: true                          # 接入前置条件
    version: "1.x"                          # Harness 规范版本
    maturity: standard                      # bootstrap | standard | enterprise
    path: .harness/
    workspace:
      path: .harness/workspace/
      task_id_pattern: '{date}_{type}-{feature}'

  global_standards:
    source: ai-engineering-standards
    inherit:
      - safety
      - coding
      - api
      - testing

  adapters:
    enabled:
      - trae
```

---

## ai-engineering-standards 最终职责

`ai-engineering-standards` 只负责**定义规范**，不保存项目内容：

```
Global Standards
├── Security
├── Coding
├── Architecture
├── Database
├── DevOps
├── AI Rules
└── Harness Specification  ← 本文档
```

它定义：

> 如何建立和使用 Harness。

但不保存项目数据——项目数据全部在 `.harness/`。

---

## Rules

### R01 — .harness 接入前置

**MUST** — 任何项目接入 `ai-engineering-standards` 必须建立 `.harness/` 目录，至少达到 Bootstrap 成熟度。

### R02 — workspace 统一归属

**MUST** — AI skill 产出的计划、规格、调试记录归入 `.harness/workspace/{task_id}/`，禁止放入 `docs/` 或项目根目录。

### R03 — 成熟度分级

**SHOULD** — 项目应根据复杂度选择合适的成熟度（Bootstrap/Standard/Enterprise），并支持渐进升级。

### R04 — workspace 上提

**MUST** — 统一使用 `.harness/workspace/`，不使用 `.harness/project/workspace/`。workspace 是 Harness 核心能力，不属于 project 子域。

### R05 — Skill/Knowledge 归属

**MUST** — skills.yaml 和 knowledge/ 归入 `.harness/`，不放入 `.standards/`。`.standards/` 只保留 AI 接入声明（profile.yaml、rule-id.yaml）。

### R06 — 老项目接入不改代码

**MUST** — 老项目（SVN/Git）接入时，只创建 `.harness/`，不修改业务代码。AI 扫描生成的 knowledge/context/rules 必须经人工确认。

### R07 — Skill 不得覆盖 Rule

**MUST** — Skill 是可选能力模块，不是规则来源。当 Skill 建议与 Rule 冲突时，Rule 优先。AI 不得因为 Skill 指令绕过安全规则、工程标准或项目流程。

详见 [Skill-Governance.md](Skill-Governance.md)。

---

## Checklist

### Bootstrap 接入

- [ ] 已创建 `.harness/` 目录
- [ ] 已编写 `AGENTS.md`（项目概览 + AI 行为约束）
- [ ] 已创建 `rules/README.md`（规则占位）
- [ ] 已创建 `workspace/current/` 和 `workspace/history/`

### Standard 升级

- [ ] 已创建 `harness.yaml`（治理配置）
- [ ] 已创建 `knowledge/`（至少含 README.md 索引）
- [ ] 已创建 `context/layers.yaml`（上下文分层）
- [ ] 已创建 `config/paths.yaml`（路径配置）
- [ ] 已创建 `governance/`（生命周期与门禁，见 [Project-Lifecycle-Governance.md](../01-Engineering/Project-Lifecycle-Governance.md)）

### Enterprise 升级

- [ ] 已创建 `agents/`（多 Agent 定义）
- [ ] 已创建 `mcp/servers.yaml`（MCP 配置）
- [ ] 已创建 `governance/`（治理策略）
- [ ] 已创建 `audit/`（审计记录）
- [ ] 已创建 `public/skills/`（可复用 skill）

### 日常使用

- [ ] AI skill 产物已归入 `workspace/current/{task_id}/`
- [ ] 完成的任务已归档至 `workspace/history/`
- [ ] task_id 遵循 `{date}_{type}-{feature}` 命名规则
- [ ] `.standards/` 只含 profile.yaml 和 rule-id.yaml
