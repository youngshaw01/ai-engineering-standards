# .harness

本仓库是 Layer 0 标准库，同时自举为 v3 消费项目。配置 SSOT：[`project.yaml`](project.yaml)。

- `workspace/changes/`：进行中的变更单元（`{type}-{slug}-{NNN}/`）
- `workspace/archive/`：已归档变更（只读，`{YYYYMMDD}-` 前缀）

> 本仓库的特殊性：契约与模板的修改本身走 Layer 0 流程（spec → plan → 分 Phase 实施），变更产物落 `workspace/`。
