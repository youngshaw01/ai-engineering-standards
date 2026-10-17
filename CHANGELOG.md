# Changelog

## [3.0.1] - 2026-10-17

### Fixed

- migration-guide §2.1：修正"零包袱型"判定口径（以 workspace 调度遗产为准，知识资产另判），补充 v1 bootstrap wiki 资产处置指引（整目录平移 `docs/knowledge/wiki/` + 批量 changelog + 探测垃圾清理）（MPOC 试点复盘 §3-1）
- adoption-contract 新增 §4.1 SVN 提交编码约定：AI 用 `-F <UTF-8 文件> --encoding UTF-8`（无 locale 环境省略 `--encoding` 会按 Latin-1 误读），人工 GBK 控制台保持 `--encoding gbk`；记载 r16389/r16390 两种实测损坏模式与 `propset --revprop` 修复路径（MPOC 试点复盘 §3-2）
- `templates/minimal/docs/rules/README.md` svn.md 示例同步编码约定

### Notes

- 文档/模板修订，无工具行为变更；消费项目无需升级 `schemaVersion`
- 变更单元：`.harness/workspace/archive/20261017-bugfix-contract-defects-001/`

## [3.0.0] - 2026-10-17

### Added

- workspace 工作流契约：变更单元模型（`{type}-{slug}-{NNN}/`）、产物分级（proposal/tasks 必备、design 可选、verify 归档前必备）、归档规则（`{YYYYMMDD}-` 前缀）
- 知识/规则落位标准：`docs/knowledge/`（含变更记录追溯约定）、`docs/rules/`（薄指针原则）
- `templates/change/`：变更单元四产物模板
- `templates/bootstrap/`：v1 封板 legacy-project-wiki 6 阶段梳理流水线 re-home（产物落点改为 `docs/knowledge/`）
- `contract/migration-guide.md`：v2 → v3 升级指南（三类项目画像）
- `validate.mjs` 差距报告模式（`--report text|json`，error/warning 分级）与红线检测（标准树副本、AI 规则厚副本）

### Changed

- `schemaVersion` 升级为 `3.0.0`（不兼容：新增 workspace 与 docs 必备结构）；新增可选 `workflow.types`
- 消费项目必备结构：新增 `workspace/changes/`、`workspace/archive/`、`docs/knowledge/README.md`、`docs/rules/README.md`

### Notes

- v2 项目升级路径见 `contract/migration-guide.md`；工具不自动搬迁内容

## [2.0.0] - 2026-10-13

### Added

- Harness Contract v2：`contract/harness-contract.md`、`adoption-contract.md`、`project-config.schema.json`
- `src/init.mjs`、`src/adopt.mjs`、`src/validate.mjs`（无第三方依赖）
- `templates/minimal/` 与 `.harness/project.yaml`（`schemaVersion: 2.0.0`，支持 `git`/`svn`）
- 自动化测试：`tests/*.test.mjs`（契约、绿场、幂等、接入、SVN 模拟、v1 依赖扫描）

### Removed

- `contract/rebuild-checklist.md`、过渡性 `project.json` 模板

### Notes

- v1 只读封板：`v1-sealed-20261013` / `sealed/v1-full`
