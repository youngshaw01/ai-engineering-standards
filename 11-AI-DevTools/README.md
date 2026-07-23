# 11 — AI DevTools

AI-assisted development tool standards: Cursor, Trae, CodeArts, Claude Code, and more.

## Documents

| Document | Description |
|----------|-------------|
| [Common-Rules](Common-Rules.md) | **AI Engineering Rules Core Edition v2.0** — L0-L5 公共约束，所有 AI 工具共享 |
| [Cursor-Rules](Cursor-Rules.md) | Cursor Rules 机制、项目规则结构、特有约定 |
| [Trae-Rules](Trae-Rules.md) | Trae project rules, AI workflow configuration |
| [CodeArts-Rules](CodeArts-Rules.md) | Huawei CodeArts rules, project configuration |
| [AI-Workflow](AI-Workflow.md) | AI-assisted development workflow, prompt-chaining, context management |
| [MCP-Server](MCP-Server.md) | MCP Server development, tool registration, transport |

## Universal Rules

以下规则适用于**所有 AI 开发工具**，详见 [Common-Rules.md](Common-Rules.md)：

- **L0** — Safety Guardrails（不可恢复操作、Git 高危操作、敏感信息）
- **L1** — Confirmation Rules（修改确认门槛）
- **L2** — Engineering Rules（最小修改、兼容性、架构决策）
- **L3** — AI Working Rules（工作流程、证据优先、信息不足）
- **L4** — Output Rules（输出规范、语言约定）
- **L5** — Engineering Priority（冲突处理优先级）

## 各工具引用方式

| 工具 | 引用 Common-Rules 的方式 |
|------|------------------------|
| Cursor | `.cursor/rules/00-safety.md`（从 Common-Rules L0 提取精简版） |
| Trae | `AI_RULES.md`（合并 Common-Rules + 项目规则） |
| Claude Code | `.claude/rules/`（从 Common-Rules 提取） |
| Codex CLI | `AGENTS.md`（从 Common-Rules 提取） |
