# Skill Governance

> **Skill 是可选能力，不是规则来源。**
>
> Skill 是 AI 完成某类工作的增强能力（Capability Plugin），不是 AI 必须执行的流程。

---

## Overview

### Skill vs Rule

| 维度 | Rule（规则） | Skill（技能） |
|------|------------|-------------|
| 回答 | 什么不能做，什么必须遵守 | 如何更高效完成某类任务 |
| 性质 | 强约束 | 可选增强 |
| 稳定性 | 稳定，不轻易变 | 可替换、可升级 |
| 遵守 | 项目必须遵守 | 项目选择启用 |
| 来源 | ai-engineering-standards / .harness/rules | .harness/skills |
| 示例 | SEC-001: 禁止输出密码 | java-review: Spring 代码审查 |

### 核心原则

1. **Skill 是可选能力，不是规则来源**——Skill 不得定义约束
2. **Skill 必须经过项目适配和价值验证后启用**——禁止全局自动安装
3. **AI 不得因为 Skill 指令覆盖项目 Rule**——Rule 优先级永远高于 Skill
4. **Skill 不自动接管**——`auto_execute: false` 是默认值

---

## Skill 在体系中的定位

```
AI Engineering Standards
        |
        | 定义治理原则（Rule）
        |
        ↓
Harness
        |
        | 管理项目上下文 + 注册 Skill
        |
        ↓
Skill
        |
        | 提供能力（可选）
        |
        ↓
AI Agent
```

**关键**：Skill 在 Rule 之下。当 Skill 建议与 Rule 冲突时，Rule 胜出。

---

## Skill Resolution Priority

```
项目安全规则（SEC-001, SEC-002...）
        >
工程标准（ENG-001, CODE-001...）
        >
项目流程（VCS-002, DB-002...）
        >
Skill 建议（java-review, grill-me...）
        >
AI 默认行为
```

**一句话**：Rule 管约束，Skill 提供能力。约束永远优先于能力。

---

## Skill 分类体系

```
.harness/skills/
├── workflow/              ← AI 工作方法论
│   ├── superpowers-zh     任务拆解、计划生成、自检、复盘
│   ├── grill-me           方案挑战、架构评审、反向质疑
│   └── review             代码审查流程
│
├── engineering/           ← 工程能力
│   ├── java-review        Spring 代码审查、空指针分析、事务检查
│   ├── api-testing        OpenAPI 解析、自动生成测试
│   └── database           DDL 生成、兼容性检查
│
├── domain/                ← 领域能力
│   ├── telecom            电信业务规则
│   └── finance            金融业务规则
│
└── operations/            ← 运维能力
    ├── docker             Docker 配置、镜像优化
    └── kubernetes         K8S 部署、Helm Chart
```

### 分类说明

| 类别 | 定位 | 适用范围 | 示例 |
|------|------|---------|------|
| **workflow** | AI 工作方法论 | 个人/团队开发环境 | superpowers-zh、grill-me |
| **engineering** | 工程技术能力 | 按技术栈选择 | java-review、api-testing |
| **domain** | 领域业务能力 | 按行业选择 | telecom、finance |
| **operations** | 运维部署能力 | 按基础设施选择 | docker、kubernetes |

---

## Skill 生命周期

```
候选 Skill
    ↓ 评估（用途、维护状态、License、安全性）
试用
    ↓ 在非关键任务中验证
项目验证
    ↓ 确认对项目有实际价值
登记
    ↓ 写入 .harness/skills.yaml
长期使用
```

**禁止**：

```
看到一个 GitHub Skill → 全局安装 → 所有项目自动启用
```

这是工具绑架。

---

## Skill 接入流程

### Step 1：发现与评估

评估维度：

| 维度 | 检查项 |
|------|--------|
| 用途 | 解决什么问题？是否与项目需求匹配？ |
| 维护状态 | 是否仍在维护？最近更新时间？ |
| License | 是否与项目兼容？ |
| 安全性 | 是否有已知安全问题？是否请求过多权限？ |
| 替代方案 | 是否存在更轻量替代？ |

### Step 2：试用

- 在非关键任务中试用
- 评估 AI 输出质量是否提升
- 确认不与现有 Rule 冲突

### Step 3：登记

写入 `.harness/skills.yaml`：

```yaml
skills:
  enabled:
    - name: superpowers-zh
      category: workflow
      source:
        type: external
      scope:
        - development
        - refactoring
      approval:
        required: true
      auto_execute: false
```

### Step 4：启用

- 在 `.harness/AGENTS.md` 中声明可用 Skill
- AI 根据任务类型自主判断是否调用
- 用户可显式要求使用某个 Skill

---

## 重点 Skill 说明

### superpowers-zh

| 维度 | 说明 |
|------|------|
| 定位 | AI 开发工作流增强 |
| 能力 | 任务拆解、计划生成、执行纪律、自检、复盘 |
| 分类 | workflow |
| 推荐范围 | 个人/团队开发环境 |
| 不适用 | 简单代码修改、typo 修复 |
| auto_execute | false |

### Grill Me

| 维度 | 说明 |
|------|------|
| 定位 | 交互式 AI 拷问工具——AI 主动连珠炮式提问，倒逼用户把方案想清楚 |
| 能力 | 深度追问模式、一次只问一个、多场景适配、轻量启动 |
| 分类 | productivity（user-invoked） |
| 来源 | [mattpocock/skills](https://github.com/mattpocock/skills) — `skills/productivity/grill-me/SKILL.md` |
| 安装 | `npx skills@latest add mattpocock/skills`，选择 `grill-me` |
| Author | Matt Pocock |
| License | MIT |
| 推荐范围 | 架构设计、PRD、重大改造、数据库设计、安全方案、方案审查、决策树审查 |
| 不适用 | 普通编码（如修改 UserService.java）、简单修改、需要"告诉我怎么做"的场景 |
| trigger | manual（用户手动调用 `/grill-me`，不自动执行） |
| invoked_by | user（user-invoked skill） |

**关键**：Grill Me 不应该参与普通编码，否则效率下降。

### grill-with-docs（工程版）

Grill Me 的工程增强版，除拷问外还：

- 构建项目领域模型（`CONTEXT.md`）
- 建立 ADR（Architecture Decision Records）
- 锐化术语（Ubiquitous Language）

来源：`skills/engineering/grill-with-docs/SKILL.md`

适用：需要同时梳理领域语言和架构决策的项目。

### mattpocock/skills 仓库其他 Skill

| Skill | 分类 | invoked_by | 用途 |
|-------|------|-----------|------|
| `tdd` | engineering | model | 红绿重构循环，TDD 开发 |
| `diagnosing-bugs` | engineering | model | 纪律化调试循环：复现 → 缩小 → 假设 → 修复 → 回归测试 |
| `domain-modeling` | engineering | model | 构建领域模型，锐化术语 |
| `codebase-design` | engineering | model | 深模块设计：大量行为 + 小接口 |
| `improve-codebase-architecture` | engineering | user | 扫描代码库架构改进机会 |
| `to-prd` | engineering | user | 将对话合成为 PRD |
| `to-issues` | engineering | user | 将计划/PRD 拆分为可独立抓取的 issue |
| `triage` | engineering | user | 将 issue 推进到下一个状态 |
| `handoff` | productivity | user | 压缩对话为交接文档 |

**注意**：以上 Skill 均来自同一仓库，按需选择，不要全部安装。

---

## Skill 安装位置

### 项目级（推荐）

```
.harness/
├── skills.yaml            ← Skill 注册表
└── skills/
    ├── workflow/
    │   ├── superpowers-zh/
    │   └── grill-me/
    └── engineering/
        └── java-review/
```

### 用户级（跨项目共享）

```
~/.cursor/skills/          ← Cursor
~/.claude/skills/          ← Claude Code
~/.trae/skills/            ← Trae
```

### 不建议

- ❌ 全局 npm install
- ❌ 所有项目自动启用
- ❌ 写入 ai-engineering-standards 核心规范

---

## Rules

### R01 — Skill 是可选能力

**MUST** — Skill 是可选能力模块（Capability Plugin），不是规则来源。Skill 不得定义约束，不得替代 Rule。

### R02 — Skill 不得覆盖 Rule

**MUST** — 当 Skill 建议与 Rule 冲突时，Rule 优先。AI 不得因为 Skill 指令绕过安全规则、工程标准或项目流程。

### R03 — Skill 需项目验证后启用

**MUST** — Skill 必须经过评估、试用、项目验证后才能登记启用。禁止全局自动安装或默认启用。

### R04 — Skill 不自动接管

**MUST** — Skill 默认 `auto_execute: false`。AI 不得在未经用户同意的情况下自动调用 Skill 接管工作流。

### R05 — Skill 按项目需求选择

**SHOULD** — 项目应根据技术栈和业务需求选择 Skill，不同项目启用不同 Skill 集合。

### R06 — Skill 生命周期管理

**SHOULD** — Skill 应遵循生命周期管理：候选 → 试用 → 验证 → 登记 → 长期使用。废弃的 Skill 应及时移除。

---

## skills.yaml 模板

```yaml
# Skill Governance Configuration
# 详见 ai-engineering-standards/11-AI-DevTools/Skill-Governance.md

version: "1.0"

policy:
  auto_install: false              # 禁止自动安装
  require_approval: true           # 启用前需审批
  auto_execute: false              # 禁止自动执行

enabled:
  - name: superpowers-zh
    category: workflow
    source:
      type: external               # external | local
      # path: ~/.cursor/skills/superpowers-zh
    scope:
      - development
      - refactoring
    approval:
      required: true
      approved_by: {{APPROVER}}
      approved_at: {{DATE}}
    auto_execute: false

  - name: grill-me
    category:
      - workflow
      - review
    source:
      type: external
    scope:
      - architecture
      - design-review
      - prd-review
    trigger:
      manual: true                  # 仅手动触发
    auto_execute: false

  # - name: java-review
  #   category: engineering
  #   scope:
  #     - backend
  #   auto_execute: false

  # - name: api-testing
  #   category: engineering
  #   scope:
  #     - api
  #   auto_execute: false

excluded:
  # - unknown-ai-agent             # 明确排除的 Skill
```

---

## Checklist

### Skill 评估

- [ ] 已评估 Skill 用途与项目需求匹配度
- [ ] 已检查 Skill 维护状态和 License
- [ ] 已确认无安全问题
- [ ] 已考虑更轻量替代方案

### Skill 试用

- [ ] 已在非关键任务中试用
- [ ] 已确认 AI 输出质量提升
- [ ] 已确认不与现有 Rule 冲突

### Skill 登记

- [ ] 已写入 `.harness/skills.yaml`
- [ ] 已设置 `auto_execute: false`
- [ ] 已明确 scope（适用范围）
- [ ] 已获得审批（如 require_approval: true）

### Skill 日常使用

- [ ] AI 根据任务类型自主判断是否调用 Skill
- [ ] Skill 建议不覆盖 Rule
- [ ] 废弃 Skill 已从 skills.yaml 移除
- [ ] Grill Me 仅用于架构/设计评审，不参与普通编码
