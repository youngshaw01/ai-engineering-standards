# AGENTS.md

> 本项目的 AI 入口文件。所有 AI Agent 首先读取此文件。

---

## Project Overview

- **项目名称**：ai-engineering-standards
- **项目类型**：new（全局标准库，非业务项目）
- **版本控制**：git
- **技术栈**：Markdown / YAML 文档体系
- **Harness 成熟度**：standard

---

## Project Role

本仓库是 **Layer 0: Global AI Engineering Standard**——跨项目通用规则库。

```
ai-engineering-standards（本仓库，Layer 0）
        ↓ inherit
.harness/（消费项目的 Layer 1）
        ↓ expose
.cursor/.trae/.claude（Layer 2 Adapter）
```

**职责**：定义规范与模板，不保存具体项目内容。项目数据全部在消费项目的 `.harness/` 中。

---

## AI Behavior Constraints

AI Agent 在本仓库工作时必须遵守：

1. **标准维护规则**：见 `rules/` 目录
2. **仓库知识**：见 `knowledge/` 目录（结构、治理模型、文档格式）
3. **上下文分层**：按 `context/layers.yaml` 加载（L1 常驻 / L2 阶段 / L3 按需）
4. **最小修改原则**：仅完成明确要求的任务，不顺手重构无关章节
5. **版本控制安全**：禁止自动 commit/push，高危操作必须确认
6. **证据优先**：不猜测规范意图，修改前先读现有文档
7. **Single Source of Truth**：规则只在一处定义，其他地方只引用 Rule ID
8. **Harness 规范一致**：`.harness/` 结构与 `templates/harness/` 模板保持同步

---

## Rules Index

| 规则类别 | 位置 | 说明 |
|---------|------|------|
| 项目治理配置 | `harness.yaml` | 项目画像、成熟度、规则继承 |
| 标准维护规则 | `rules/` | 文档格式、Harness 模板维护约束 |
| 仓库知识 | `knowledge/` | 目录结构、三层治理模型 |
| 上下文分层 | `context/layers.yaml` | AI 上下文加载策略 |
| 路径配置 | `config/paths.yaml` | 章节与模板路径常量 |
| 生命周期门禁 | `governance/` | 标准库维护流程与合并门禁 |
| Harness 规范 | `11-AI-DevTools/Harness-Bootstrap.md` | .harness 标准结构定义 |
| 公共 AI 规则 | `11-AI-DevTools/Common-Rules.md` | L0-L5 安全与工程约束 |

---

## Workspace

AI skill 产出的计划、规格、调试记录归入：

```
workspace/current/{task_id}/
```

task_id 命名规则：`{date}_{type}-{feature}`

完成后归档至 `workspace/history/{task_id}/`。

---

## Context Loading Strategy

- **L1（常驻）**：AGENTS.md、标准维护规则
- **L2（阶段）**：按任务类型加载对应章节或模板
- **L3（按需）**：knowledge/、workspace/history/

原则：**Just-enough Context**，会话填充率目标 < 40%。

---

## Quick Start for AI

1. 读取本文件了解仓库角色
2. 读取 `rules/standards-maintenance.md` 了解维护约束
3. 按 `context/layers.yaml` 加载 L1 常驻内容
4. 修改规范文档时遵循 R01-Rxx 文档格式（见 `00-Introduction/How-To-Use.md`）
5. 修改 Harness 模板时同步更新 `Harness-Bootstrap.md` 与 `templates/harness/`
6. 任务产物写入 `workspace/current/{task_id}/`
7. 不确定时优先提问，不猜测

---

## Upgrade Path

当前为 Standard 成熟度。如需 Enterprise 能力（多 Agent、MCP、审计），参考 `templates/harness/enterprise/README.md`。
