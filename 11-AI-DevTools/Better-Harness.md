# Better Harness

> **AI 编码工作流审计与持续改进** — 基于 [QoderAI/better-harness](https://github.com/QoderAI/better-harness) 的 Agent Work Loop 五维模型，与本仓库 `.harness/` 治理体系对齐。
>
> Better Harness 是**可选审计工具**，不是 Rule 来源；与 `stable-iteration`（单次改动 SOP）互补。

---

## Overview

### 它解决什么

AI 写代码更快，但工作流常失控：目标模糊、路径不可复现、能跑无证据、跳过 Review、经验不沉淀。只审查最终 diff 会漏掉这些系统问题。

Better Harness 审计 **diff 背后的工作流**：收集项目与会话证据，按五维评估，输出带证据的 Findings（风险、修复范围、验收清单）。缺失证据会明确标注，不臆造评分。

### 与本仓库的关系

```
ai-engineering-standards（Layer 0）
        │  定义 Rules / 模板 / 门禁
        ↓
.harness/（消费项目 Layer 1）
        │  项目事实 + Skill 注册 + workspace 证据
        ↓
Better Harness（可选审计层）
        │  发现「规范写了但未执行」的缺口
        ↓
stable-iteration 等 Skill（执行层）
        │  单次改动按 SOP 落地
```

| 能力 | 本仓库 | Better Harness |
|------|--------|----------------|
| 约束 AI 行为 | Rules（MUST/SHOULD） | 不定义约束 |
| 单次改动 SOP | `stable-iteration` Skill | 不替代 |
| 工作流全景审计 | `gates.yaml` 声明门禁 | 自动采集证据 + 报告 |
| 经验沉淀 | `workspace/history/` | 历史趋势对比 |

---

## Agent Work Loop 五维映射

| 维度 | 问题 | 本仓库落地位置 | 审计时看什么 |
|------|------|----------------|--------------|
| **任务理解** | 是否知道目标和「完成」标准？ | `AGENTS.md`、`workspace/current/{task_id}/spec.md`、PRD | 验收标准是否可测试；Out of Scope 是否写明 |
| **受控执行** | 操作是否可复现、有边界？ | `skills/skills.yaml`、`AI-Workflow.md` R01/R05、MCP/Skill | 修改预算；是否先计划后改码 |
| **变更验证** | 改动是否有验证证据？ | `gates.yaml`、测试规范、`validation.md` | lint/单测/Hook 执行记录 |
| **可靠交付** | 是否跳过 Review / CI？ | `Project-Lifecycle-Governance.md`、CI/CD | PR Review、审批、回滚预案 |
| **经验沉淀** | 下次能否复用？ | `workspace/history/`、Skill 登记 | 任务是否归档；同类问题是否重复 |

手工自检清单见 `templates/harness/standard/governance/workflow-audit.yaml`。

---

## 接入方式

### 原则

- **SHOULD** — 消费项目在 Standard 成熟度后，每季度或重大改造前运行一次工作流审计
- **MAY** — 将 Better Harness 登记为外部 Skill（见 `skills/skills.yaml` 示例）
- **MUST NOT** — 将 Better Harness 报告结论覆盖项目 Rule

### 按宿主安装

| 宿主 | 安装 | 调用 |
|------|------|------|
| **Qoder Desktop** | 内置，无需安装 | `/better-harness 分析此项目的 AI 编码工作流并生成基于证据的报告` |
| **Claude Code** | `/plugin marketplace add QoderAI/better-harness` → `/plugin install better-harness@better-harness` | 同上（英文：`analyze this project's AI coding workflow...`） |
| **Codex** | Marketplace 添加 `https://github.com/QoderAI/better-harness.git` | `@better-harness analyze...` |
| **Cursor** | 官方 Marketplace **未发布**；见下方 Cursor 路径 | 见下方 |
| **GitHub Copilot CLI** | `copilot plugin marketplace add QoderAI/better-harness` | `/better-harness analyze...` |

### Cursor 推荐路径

官方当前将 Cursor 插件生命周期标为 **session-only / 合同核对中**。推荐两种方式：

**方式 1 — 独立 CLI（仅项目证据，不读会话）**

```bash
git clone https://github.com/QoderAI/better-harness.git
cd better-harness && npm ci

node scripts/better-harness.mjs report --no-sessions \
  --workspace /path/to/your-project
```

**方式 2 — 规划与验证安装状态**

```bash
better-harness plugin plan install --host cursor --surface agent --scope session
better-harness plugin verify --host cursor --surface agent
```

**方式 3 — 手工加载 Skill（变通）**

在 Cursor 会话中引用 clone 后的 `skills/better-harness/SKILL.md`，再发送审计指令。

### 报告产物归档

**SHOULD** — 审计报告存入项目 workspace，便于趋势对比：

```
.harness/workspace/history/{date}_audit-workflow/
├── report.md              ← 从 Better Harness 导出或摘要
├── findings.json          ← 若有
└── remediation-plan.md    ← 团队整改计划（人工维护）
```

Qoder / Cursor Canvas 报告：导出或截图关键 Findings 后写入上述目录。

---

## 审计节奏建议

| 时机 | 动作 |
|------|------|
| 项目首次接入 Standard 模板 | 建立基线报告 |
| 每季度 | 重跑审计，对比五维变化 |
| 重大重构 / AI 大规模改动前 | 审计 + 启用 `stable-iteration` |
| 线上事故后 | 针对「可靠交付」「变更验证」维度复盘 |

---

## 与 gates / stable-iteration 配合

```
Better Harness 审计 → 产出 Findings
        ↓
按优先级更新 .harness/（rules、knowledge、gates、skills）
        ↓
日常改动走 stable-iteration 7 步
        ↓
合并前 gates.yaml pre_merge 门禁
        ↓
下次审计验证缺口是否关闭
```

Findings 中「机制存在但未使用」类问题：补证据（如 `validation.md`、CI 日志链接），而非仅改文档。

---

## Rules

### R01 — 审计不替代 Rule

**MUST** — Better Harness 结论不得覆盖 `Common-Rules`、项目 `rules/` 或 `gates.yaml` 中的 MUST 条款。

### R02 — 证据缺口须显式处理

**MUST** — 对报告中标注为「证据缺失」的项，要么补证据，要么在 `governance/exceptions.yaml` 登记例外与原因；不得忽略。

### R03 — 整改可验收

**SHOULD** — 每条采纳的 Finding 在 `remediation-plan.md` 中写明：修复范围、负责人、验收标准、目标日期。

### R04 — 与 Skill 治理一致

**MUST** — 将 Better Harness 作为外部 Skill 启用时，遵循 [Skill-Governance.md](Skill-Governance.md)：`require_approval: true`、`auto_execute: false`。

---

## Checklist

- [ ] 消费项目已建立 `.harness/`（至少 Standard）
- [ ] 已选择宿主安装路径（Qoder / Claude / CLI 等）
- [ ] 首次基线报告已归档至 `workspace/history/`
- [ ] 五维映射缺口已对照 `workflow-audit.yaml` 自检
- [ ] P0 Findings 已纳入整改计划或例外登记
- [ ] 与 `stable-iteration`、`gates.yaml` 职责边界已团队共识

---

## 参考

- 仓库：[QoderAI/better-harness](https://github.com/QoderAI/better-harness)（MIT）
- 示例报告：[Harness Inspector](https://qoderai.github.io/better-harness/inspector)
- 本仓库：`stable-iteration` Skill、`AI-Workflow.md`、`Project-Lifecycle-Governance.md`
