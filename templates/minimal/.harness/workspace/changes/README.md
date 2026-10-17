# changes/ — 进行中的变更单元

每个子目录是一个变更单元：`{type}-{slug}-{NNN}`（如 `feature-pci-module-split-001`）。

- `type`：`feature | bugfix | refactor | docs | ops`（可经 `project.yaml` → `workflow.types` 定制）
- 产物：`proposal.md`（必备）、`tasks.md`（必备）、`design.md`（可选，跨模块/架构级）、`verify.md`（归档前必备）、`artifacts/`（可选）
- 模板：标准库 `templates/change/`（项目内不保留副本）
- 完成后移入 `../archive/` 并加 `{YYYYMMDD}-` 前缀（日期取变更创建日）

禁止在本目录根散落文件。
