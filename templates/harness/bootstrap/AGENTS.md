# AGENTS.md

> 本项目的 AI 入口文件。所有 AI Agent（Cursor / Trae / Claude Code / Codex 等）首先读取此文件。

---

## Project Overview

- **项目名称**：{{PROJECT_NAME}}
- **项目类型**：{{new | legacy}}
- **版本控制**：{{git | svn | git-svn}}
- **技术栈**：{{如：Java 17 + Spring Boot 3 + MyBatis + MySQL}}
- **Harness 成熟度**：bootstrap

---

## AI Behavior Constraints

AI Agent 在本项目工作时必须遵守：

1. **全局规则**：继承 `ai-engineering-standards` 的 Common-Rules（L0-L5）
2. **项目规则**：见 `rules/` 目录
3. **最小修改原则**：仅完成明确要求的任务，不顺手重构
4. **版本控制安全**：禁止自动 commit/push，高危操作必须确认
5. **证据优先**：不猜测 API、数据库结构、业务逻辑

---

## Rules Index

| 规则类别 | 位置 | 说明 |
|---------|------|------|
| 项目规则 | `rules/` | 项目特定约束（编码规范、工程结构等） |
| 全局标准 | `ai-engineering-standards/` | 通用安全红线、编码原则 |

---

## Workspace

AI skill 产出的计划、规格、调试记录归入：

```
workspace/current/{task_id}/
```

task_id 命名规则：`{date}_{type}-{feature}`（如 `20260724_feat-token-optimization`）

完成后归档至 `workspace/history/{task_id}/`。

---

## Quick Start for AI

1. 读取本文件了解项目概览
2. 读取 `rules/` 了解项目约束
3. 执行任务时将产物写入 `workspace/current/{task_id}/`
4. 不确定时优先提问，不猜测

---

## Upgrade Path

当前为 Bootstrap 成熟度。项目稳定后可升级：

- **Standard**：增加 knowledge/、context/、config/、harness.yaml
- **Enterprise**：增加 agents/、mcp/、governance/、audit/、public/

详见 `ai-engineering-standards/11-AI-DevTools/Harness-Bootstrap.md`。
