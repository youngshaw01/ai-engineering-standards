# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- `11-AI-DevTools/Harness-Blueprint-v1.md`：Harness Engineering Blueprint v1 契约（Layer 0 SSOT，不另建 harness-blueprint 仓）
- `templates/harness/blueprint-v1/`：最小项目骨架（AGENTS、project.yaml、governance、adapters、gates、workflows、schema）

### Changed
- `04-Frontend/Detail-View-IA.md` **R08**：补充多列 grid 对齐原理图（双列 4n+1/4n+3 同宽）、三列 nth-child 表、`table-layout: fixed` 三要素
- `04-Frontend/Detail-View-IA.md` **R07**：补充 Tag 数量上限、摘要区容器高亮、禁止正文纯文本主状态
- `04-Frontend/Detail-View-IA.md` **R08**：补充 WIDE/COMPACT 分级宽度、折行防溢出、`DetailSection.labelWidth`；参考 `ICEmvParaDetail.vue`
- `templates/harness/standard/rules/detail/web-detail-view.md`：R07/R08 项目落地表（148/172/112px）
- `legacy-project-wiki-kit`：修正打包命令与 Skill 引用路径 `legacy-project-ai-wiki-kit` → `legacy-project-wiki-kit`
- `legacy-project-wiki-kit/.harness/prompts/05-index-and-pending.md`：明确 `_pending.md` 须「分类台账 + 附录 A 各域条目全量索引」两部分并存
- `legacy-project-wiki-kit/.harness/prompts/06-independent-audit.md`：补审计口径与基线时点声明、反模式与完成清单核对分级、报告自身不得残留未修正 ❌
- `legacy-project-wiki-kit/.harness/workflow/quality-gates.md`：G5 增附录索引条数与拆块核对；G6 增口径时点、清单统计、P0/P1/P2 分级与审计局限
- `legacy-project-wiki-kit/.harness/workflow/README.md`、`legacy-project-wiki-kit/AGENTS.md`：`source_commit` 与源码变更比对改为 VCS-agnostic（Git commit SHA 或 SVN revision）
- `skills/workflow/legacy-project-wiki/SKILL.md`：Phase 5 增全文索引要求；Phase 6 判定词统一为 `通过 / 部分支持 / 错误 / 无法验证` 并补审计章节；完成检查清单两行改写
- `skills/workflow/legacy-project-wiki/references/prompts.md`：标题改「Prompt 速查」并补可执行工作包推荐说明

### Added
- `templates/harness/standard/skills/catalog/`：常用 Skill 目录（`catalog.yaml` + `entries/`，含 superpowers、superpowers-zh、grill-me 等）；同步 `.harness/skills/catalog/`
- `04-Frontend/Detail-View-IA.md` **R08** 多列 grid label 竖向对齐原理（`:column="2/3"` + nth-child + `table-layout: fixed`）
- `04-Frontend/Detail-View-IA.md` **R07** L0 状态 Tag 语义高亮、`FE-DV-007`
- `04-Frontend/Detail-View-IA.md` **R08** Descriptions Label 等宽、`FE-DV-008`
- `04-Frontend/Detail-View-IA.md`：B 端详情查看态 IA（L0–L4 分层、查看/编辑分离、字段格式）
- `templates/harness/standard/rules/detail/web-detail-view.md`：消费项目 Harness 细则模板
- Rule IDs `FE-DV-001` … `FE-DV-006` in `.harness/config/rule-id.yaml`
- `.harness/config/rule-id.yaml` Rule ID 注册表；项目画像合并入 `harness.yaml`
- `01-Engineering/Project-Lifecycle-Governance.md`：Phase 1-7 生命周期、环境晋升、反向回归、老项目改造路线图
- `templates/harness/standard/governance/`：lifecycle.yaml、gates.yaml、legacy-roadmap.yaml
- `templates/harness/standard/skills/skills.yaml`：Skill 注册表模板（归入 `.harness/skills/`）
- Harness 三层治理模型文档：`.harness/knowledge/治理模型.md`、`.harness/knowledge/架构.md`
- `templates/harness/legacy-project-wiki-kit/`：遗留项目 Wiki 可执行工作包（Prompt 流水线、workflow 门槛、wiki 模板）（`ca2b01c`，2026-10-10）
- `.harness/skills/workflow/legacy-project-wiki/`：遗留项目 Wiki 工作流 Skill（`cd87ea0`，2026-10-10）
- `legacy-project-wiki-kit/.harness/wiki/_pending.template.md`：新增「附录 A 各域『待确认』条目全量索引」、拆块与条数核对口径
- `legacy-project-wiki-kit/.harness/wiki/_audit.template.md`：扩展为 9 章结构（审计口径声明 / 量化结果 / 覆盖度核对 / 审计发现 / 抽样回溯 / 反模式核对 / 清单统计 / 修正建议 / 审计局限）

### Changed
- **废除 `.standards/` 目录**：项目画像并入 `harness.yaml`，rule-id 在 `config/`，exceptions 在 `governance/`
- **Harness 路径统一**（HARNESS-004）：`.harness/workspace/` 取代 `.harness/project/workspace/`
- **统一 Harness 工作空间**（HARNESS-005）：禁止 `.standards/` 双轨，`.harness/` 为唯一 AI 治理目录
- `07-AI/Skill-Governance.md` 精简为指向 `11-AI-DevTools/Skill-Governance.md` 的权威引用
- `00-Introduction/How-To-Use.md` 改为 Harness-first 接入指南
- `11-AI-DevTools/rules.md` 移除（与 Common-Rules.md 重复）

### Removed
- `.standards/` 目录及 `templates/project-profile.yaml`（项目画像已合并入 `harness.yaml`）
- 根目录 `templates/rule-id.yaml`、`templates/exceptions.yaml`（已迁入 `templates/harness/standard/`）
- `templates/skills.yaml`、`templates/knowledge.yaml`（已废弃）

### Previously in Unreleased
- MyBatis R09: persistence layer new/legacy project governance (FluentMyBatis vs XML, Dialect Adapter)
- MyBatis R09: multi-database compatibility (MySQL / SQL Server / Oracle) via databaseIdProvider
- Phase 4: 25 documents completed (Dependencies, Project-Structure, Maven, MyBatis, Pytest, CSS, React, TypeScript, Audit, Message-Queue, RBAC, CQRS, EventDriven, Microservice, System-Design, Evaluation, FineTuning, RAG, Workflow, API-Test, E2E-Test, Integration-Test, Unit-Test, Linux, Monitoring, Nginx, PRD, SaaS, Tech-Writing, Glossary)
- Common-Rules.md: AI Engineering Rules Core Edition v2.0 as shared constraints for all AI tools
- SVN.md: 10 rules for SVN-based enterprise projects + SVN vs Git comparison table
- VCS-agnostic standards: version control safety rules support both Git and SVN
- project-profile.yaml: version_control field (git / svn / git-svn / none)
- How-To-Use.md: complete adoption guide (new project + legacy project + SVN project paths)

### Changed (historical)
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
