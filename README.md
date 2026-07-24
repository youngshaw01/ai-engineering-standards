# AI Engineering Standards

> AI Native Software Engineering Standard — 兼容传统 SVN 企业项目，并支持未来 Git 迁移。

---

## What is this?

**Layer 0: Global AI Engineering Standard** — 跨项目通用规则库，不包含具体项目规则。

- **Engineering teams** seeking consistent, high-quality development practices
- **Legacy projects** (SVN-based enterprise systems) needing incremental adoption
- **AI-assisted development** workflows with Cursor, Claude Code, Trae, and more

Key principle: **Standards are not bound to Git. Version control is just one part of engineering practice.**

---

## Three-Layer Governance Model

> **Source of Truth 原则：规则只在一处定义，其他地方只引用。**

```
                 Layer 0
        ai-engineering-standards
        Global Standard（通用标准库）
                 |
                 | inherit
                 ↓
                 Layer 1
              .harness
        Project Governance（项目AI工作空间）
                 |
                 | expose
                 ↓
                 Layer 2
       .cursor/.trae/.claude
          AI Adapter（工具适配层）
```

**关键：** 项目继承全局标准，AI 工具消费规则。Adapter 无规则权力。

### Rule Resolution Priority

```
1. Project Override (.harness)              ← 项目规则覆盖一切
2. Global Standard (ai-engineering-standards) ← 通用标准兜底
3. AI Tool Default Rules                     ← 工具默认行为
```

```
项目规则覆盖通用标准
通用标准覆盖 AI 默认行为
Adapter 无规则权力
```

### Layer 职责

| Layer | Location | Role | Defines |
|-------|----------|------|---------|
| **Layer 0** | `ai-engineering-standards/` | Global Standard | 通用安全红线、编码原则、测试策略、架构模式 |
| **Layer 1** | `.harness/` | Project Governance | 项目约束、业务规则、技术选型、遗留系统约定 |
| **Layer 2** | `.cursor/rules/` / `.trae/rules/` | AI Adapter | 无（纯转换层，消费 Layer 0 + Layer 1 规则） |

### .harness vs .standards 职责分工

当项目同时存在 `.harness` 和 `.standards` 时：

| 目录 | 职责 | 内容 |
|------|------|------|
| `.harness/` | 项目事实 | rules/、wiki/、workspace/、specs/、agents/ |
| `.standards/` | AI 接入声明 | profile.yaml、skills.yaml、knowledge.yaml、rule-id.yaml |

```
project/
├── .harness/              ← 项目事实（rules/wiki/workspace）
└── .standards/            ← AI 接入声明（profile/skills/knowledge）
```

### AI Tool Adapter 职责

AI 工具规则文件**只做格式转换**，通过 Rule ID 引用，不重新定义规则：

```markdown
# .trae/rules/project-rules.md

## SEC-001: Sensitive Information Protection
Source: ai-engineering-standards/11-AI-DevTools/Common-Rules.md
AI 必须遵守（详见 source）

## VCS-001: SVN Commit Policy
Source: .harness/project/rules/svn.md
AI 必须遵守（详见 source）
```

❌ 不应该：

```markdown
# .trae/rules/java.md  ← 不应该在这里重新定义规则

- 禁止 @Autowired 字段注入  ← 重复定义会导致规则漂移
```

### 内容归属判断

| 内容 | 归属 Layer | 原因 |
|------|-----------|------|
| 禁止泄露密钥 | Layer 0 | 通用安全红线 |
| AI 不自动 commit | Layer 0 | 通用 AI 行为约束 |
| 最小修改原则 | Layer 0 | 通用工程原则 |
| SVN --encoding gbk | Layer 1 | 项目技术约束 |
| 禁止修改 c/ 目录 | Layer 1 | 项目特殊约束 |
| DTO 命名规范 | Layer 0 | 可形成 Java Standard |
| 数据库 tbl_ 前缀 | 部分归 Layer 0（通用）+ 部分归 Layer 1（具体表名） | 通用原则 + 项目约定 |

---

## Rules / Skills / Knowledge

在 Layer 0 层面，本仓库提供三类内容：

```
                 AI Agent
                    ▲
        ┌───────────┼───────────┐
        │           │           │
     Rules       Skills     Knowledge
        │           │           │
   约束行为     扩展能力     提供知识
   "不能做"     "会做"       "知道"
```

| Layer | Question | Content | Location |
|-------|----------|---------|----------|
| **Rules** | AI 能不能做？ | 安全护栏、编码规范、版本控制规则 | 各章节文档 |
| **Skills** | AI 会什么？ | TDD、调试、代码审查、架构设计 | `templates/skills.yaml` |
| **Knowledge** | AI 知道什么？ | 架构文档、数据库设计、API 契约 | `templates/knowledge.yaml` |

---

## Chapters

| # | Chapter | Description | Docs |
|---|---------|-------------|------|
| 00 | **Introduction** | How to use, glossary, governance model | [→](00-Introduction/) |
| 01 | **Engineering** | Git, SVN, Code Review, Project Structure, Dependencies | [→](01-Engineering/) |
| 02 | **Java** | Java 17, Spring Boot, MyBatis, Maven | [→](02-Java/) |
| 03 | **Python** | Python 3, FastAPI, Pytest | [→](03-Python/) |
| 04 | **Frontend** | TypeScript, React, CSS | [→](04-Frontend/) |
| 05 | **Backend** | API, Security, Audit, RBAC, Database, Redis, MQ | [→](05-Backend/) |
| 06 | **Architecture** | DDD, Microservice, Event-Driven, CQRS, System Design | [→](06-Architecture/) |
| 07 | **AI** | Agent, MCP, Prompt, RAG, Workflow, FineTuning, Evaluation, Skill Governance, Knowledge Management | [→](07-AI/) |
| 08 | **Testing** | Strategy, Unit, Integration, API, E2E | [→](08-Testing/) |
| 09 | **DevOps** | Docker, Kubernetes, CI/CD, Nginx, Linux, Monitoring | [→](09-DevOps/) |
| 10 | **Product** | PRD, SaaS, Tech Writing | [→](10-Product/) |
| 11 | **AI DevTools** | Common Rules, Cursor Rules, Trae Rules, AI Workflow, MCP Server | [→](11-AI-DevTools/) |

---

## Directory Structure

```
ai-engineering-standards/
├── 00-Introduction/
├── 01-Engineering/
├── 02-Java/
├── 03-Python/
├── 04-Frontend/
├── 05-Backend/
├── 06-Architecture/
├── 07-AI/
├── 08-Testing/
├── 09-DevOps/
├── 10-Product/
├── 11-AI-DevTools/
├── templates/          # Ready-to-use templates (profile.yaml, skills.yaml, etc.)
└── examples/          # Code examples
```

---

## Document Format

Every document follows this structure:

```markdown
# Title

## Overview
Brief description of the standard and its scope.

## Rules

### R01 — Rule Title
**MUST / SHOULD / MAY** — Description.

✅ Correct:
```language
example code
```

❌ Wrong:
```language
anti-pattern code
```

## Checklist
- [ ] Item 1
- [ ] Item 2
```

### Rule Severity

| Level | Meaning |
|-------|---------|
| **MUST** | Mandatory. Violation is a bug. |
| **MUST NOT** | Prohibited. Violation is a bug. |
| **SHOULD** | Recommended. Deviation requires justification. |
| **SHOULD NOT** | Discouraged. Deviation requires justification. |
| **MAY** | Optional. No justification needed. |

---

## Quick Start

1. Read [How To Use](00-Introduction/How-To-Use.md)
2. Pick the chapter relevant to your work
3. Apply rules using the checklist at the end of each document
4. Use [templates/](templates/) for project profile, skills, knowledge

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

[MIT](LICENSE)
