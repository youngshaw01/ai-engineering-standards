# Changelog

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
