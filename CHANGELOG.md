# Changelog

## [2.0.0-cleanroom] - 2026-10-13

### Changed

- **策略**：Clean-room 重建；v1 封板为 `v1-sealed-20261013` / `sealed/v1-full`，不参与生成与校验。
- **活动布局**：`contract/`、`templates/minimal/`、`src/init.mjs`、`src/validate.mjs`、`examples/`、`tests/`。
- 移除 transitional `harness/`、根 `.harness/`、`AGENTS.md`（标准库内不保留元副本）。

### Added

- `contract/harness-contract.md`、`adoption-contract.md`、`project-config.schema.json`
- 无第三方依赖的 `init` / `validate` 与 `node --test` 验收用例

## [2.0.0] - 2026-10-13

- 过渡性 `harness/` 布局（已由 clean-room 取代）
