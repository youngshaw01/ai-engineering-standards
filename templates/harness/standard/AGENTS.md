# AGENTS.md

> 本项目的 AI 入口文件。所有 AI Agent 首先读取此文件。

---

## Project Overview

- **项目名称**：{{PROJECT_NAME}}
- **项目类型**：{{new | legacy}}
- **版本控制**：{{git | svn | git-svn}}
- **技术栈**：{{如：Java 17 + Spring Boot 3 + MyBatis + MySQL}}
- **Harness 成熟度**：standard

---

## AI Behavior Constraints

AI Agent 在本项目工作时必须遵守：

1. **全局规则**：继承 `ai-engineering-standards` 的 Common-Rules（L0-L5）
2. **项目规则**：见 `rules/` 目录
3. **项目知识**：见 `knowledge/` 目录（架构、业务流程、数据模型）
4. **上下文分层**：按 `context/layers.yaml` 加载（L1 常驻 / L2 阶段 / L3 按需）
5. **最小修改原则**：仅完成明确要求的任务
6. **版本控制安全**：禁止自动 commit/push，高危操作必须确认
7. **证据优先**：不猜测 API、数据库结构、业务逻辑

---

## Rules Index

| 规则类别 | 位置 | 说明 |
|---------|------|------|
| 项目规则 | `rules/` | 项目特定约束 |
| 项目知识 | `knowledge/` | 架构、业务流程、数据模型 |
| 上下文分层 | `context/layers.yaml` | AI 上下文加载策略 |
| 路径配置 | `config/paths.yaml` | 项目路径常量 |
| 全局标准 | `ai-engineering-standards/` | 通用安全红线、编码原则 |

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

AI 应按 `context/layers.yaml` 的分层策略加载上下文：

- **L1（常驻）**：AGENTS.md、核心规则——会话开始即加载
- **L2（阶段）**：按开发阶段加载对应 skill / spec
- **L3（按需）**：AI 根据任务自主查阅，不主动预加载

原则：**Just-enough Context**，会话填充率目标 < 40%。

---

## Quick Start for AI

1. 读取本文件了解项目概览
2. 读取 `rules/` 了解项目约束
3. 按 `context/layers.yaml` 加载 L1 常驻内容
4. 执行任务时将产物写入 `workspace/current/{task_id}/`
5. 需要业务知识时查阅 `knowledge/`
6. 不确定时优先提问，不猜测

---

## Upgrade Path

当前为 Standard 成熟度。项目复杂度增长后可升级到 Enterprise：

- 增加 `agents/`（多 Agent 协作）
- 增加 `mcp/`（MCP Server 集成）
- 增加 `governance/`（治理策略）
- 增加 `audit/`（审计记录）

详见 `ai-engineering-standards/11-AI-DevTools/Harness-Bootstrap.md`。
