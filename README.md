# AI Engineering Standards

> AI Native Software Engineering Standard — 兼容传统 SVN 企业项目，并支持未来 Git 迁移。

---

## What is this?

A comprehensive, opinionated set of engineering standards designed for:

- **Engineering teams** seeking consistent, high-quality development practices
- **Legacy projects** (SVN-based enterprise systems) needing incremental adoption
- **AI-assisted development** workflows with Cursor, Claude Code, Trae, and more

Key principle: **Standards are not bound to Git. Version control is just one part of engineering practice.**

Every standard follows the same structure: **Rule → Example → Anti-pattern → Checklist**.

---

## Chapters

| # | Chapter | Description | Docs |
|---|---------|-------------|------|
| 00 | **Introduction** | How to use, glossary | [→](00-Introduction/) |
| 01 | **Engineering** | Git, GitHub, Code Review, Project Structure, Dependencies | [→](01-Engineering/) |
| 02 | **Java** | Java 17, Spring Boot, MyBatis, Maven | [→](02-Java/) |
| 03 | **Python** | Python 3, FastAPI, Pytest | [→](03-Python/) |
| 04 | **Frontend** | TypeScript, React, CSS | [→](04-Frontend/) |
| 05 | **Backend** | API, Security, Audit, RBAC, Database, Redis, MQ | [→](05-Backend/) |
| 06 | **Architecture** | DDD, Microservice, Event-Driven, CQRS, System Design | [→](06-Architecture/) |
| 07 | **AI** | Agent, MCP, Prompt, RAG, Workflow, FineTuning, Evaluation | [→](07-AI/) |
| 08 | **Testing** | Strategy, Unit, Integration, API, E2E | [→](08-Testing/) |
| 09 | **DevOps** | Docker, Kubernetes, CI/CD, Nginx, Linux, Monitoring | [→](09-DevOps/) |
| 10 | **Product** | PRD, SaaS, Tech Writing | [→](10-Product/) |
| 11 | **AI DevTools** | Cursor Rules, Trae Rules, CodeArts Rules, AI Workflow, MCP Server | [→](11-AI-DevTools/) |

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
├── templates/          # Ready-to-use templates
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
4. Use [templates/](templates/) for PR, API design, PRD, etc.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

[MIT](LICENSE)
