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
Layer 0: Global Standard                 ← 跨项目通用（本仓库）
    ai-engineering-standards
        |
        | inherit
        ↓
Layer 1: Project Governance               ← 项目真实规则（最高权威）
    .harness / .standards
        |
        | adapter
        ↓
Layer 2: AI Tool Adapter                  ← 格式转换层，不定义规则
    .trae/rules / .cursor/rules / .claude
```

### Priority（冲突时）

```
Layer 1 (Project Rules) > Layer 0 (Global Rules) > Layer 2 (Tool Adapter)
```

| Layer | Location | Defines | Does NOT define |
|-------|----------|---------|-----------------|
| **Layer 0** | `ai-engineering-standards/` | 通用安全红线、编码原则、测试策略、架构模式 | 项目特定约束、业务规则、遗留系统约定 |
| **Layer 1** | `.harness/` or `.standards/` | 项目约束、业务规则、技术选型、SVN 约定、遗留系统约定 | 与 Layer 0 重复的通用规则（应引用） |
| **Layer 2** | `.trae/rules/` / `.cursor/rules/` | 无（纯转换层） | 任何规则 |

### AI Tool Adapter 职责

AI 工具规则文件**只做格式转换**，把 Layer 0 + Layer 1 规则转换为 AI 可加载的格式：

```markdown
# .trae/rules/project-rules.md

Source: .harness/project/rules/项目编码规范.md

AI 必须遵守：
- Java 编码规范（详见 source）
- SVN 提交规范（详见 source）
- 数据库规范（详见 source）
```

❌ 不应该：

```markdown
# .trae/rules/java.md  ← 不应该在这里重新定义规则

- 禁止 @Autowired 字段注入  ← 这应该在 .harness 或 ai-engineering-standards 中定义
- 构造器注入优先             ← 重复定义会导致规则漂移
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
