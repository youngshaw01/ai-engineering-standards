# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- MyBatis R09: persistence layer new/legacy project governance (FluentMyBatis vs XML, Dialect Adapter)
- MyBatis R09: multi-database compatibility (MySQL / SQL Server / Oracle) via databaseIdProvider
- Phase 4: 25 documents completed (Dependencies, Project-Structure, Maven, MyBatis, Pytest, CSS, React, TypeScript, Audit, Message-Queue, RBAC, CQRS, EventDriven, Microservice, System-Design, Evaluation, FineTuning, RAG, Workflow, API-Test, E2E-Test, Integration-Test, Unit-Test, Linux, Monitoring, Nginx, PRD, SaaS, Tech-Writing, Glossary)
- Rules / Skills / Knowledge three-layer model (Skill-Governance.md, Knowledge-Management.md, skills.yaml, knowledge.yaml)
- Common-Rules.md: AI Engineering Rules Core Edition v2.0 as shared constraints for all AI tools
- SVN.md: 10 rules for SVN-based enterprise projects + SVN vs Git comparison table
- VCS-agnostic standards: version control safety rules support both Git and SVN
- project-profile.yaml: version_control field (git / svn / git-svn / none)
- templates/skills.yaml, templates/knowledge.yaml, templates/exceptions.yaml
- How-To-Use.md: complete adoption guide (new project + legacy project + SVN project paths)

### Changed
- Positioning: AI Native Engineering Standard, compatible with legacy SVN enterprise projects
- Common-Rules.md L0.2: renamed "Git 高危操作" to "版本控制高危操作", added SVN commands
- Common-Rules.md L1: added batch modification, auto-refactor, directory migration to confirmation list
- Cursor-Rules.md: refactored to Cursor-specific content, references Common-Rules.md
- README.md: added Three-Layer Model diagram (Rules / Skills / Knowledge)

## [0.3.0] - 2026-07-23

### Added
- Phase 3: 8 documents (Java17, SpringBoot, Docker, CI-CD, Kubernetes, Python3, FastAPI, TestStrategy)

## [0.2.0] - 2026-07-22

### Added
- Phase 2: 6 documents (Agent, Prompt, MCP, GitHub, Security, Redis)
- Adoption framework: project-profile.yaml, exceptions.yaml, How-To-Use.md

## [0.1.0] - 2026-07-21

### Added
- Project skeleton with 12 chapters (00-11)
- Phase 1: 5 documents (Git, Code-Review, API, Database, DDD)
- Document format specification (Rule → Example → Anti-pattern → Checklist)
- Rule severity levels (MUST / SHOULD / MAY)
- Templates: PR, API design, PRD, database design, commitlint config
- CONTRIBUTING.md
- LICENSE (MIT)
