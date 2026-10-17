# AGENTS.md

> v3 入口。契约：`ai-engineering-standards` → `contract/harness-contract.md`（本仓库即 Layer 0）

## Project

- 机器配置：`.harness/project.yaml`（本仓库自举为 v3 消费项目）
- 变更工作区：`.harness/workspace/changes/`（进行中）· `.harness/workspace/archive/`（已归档）
- 领域知识：`docs/knowledge/` · 项目特化规则：`docs/rules/`

## Rules

- 业务事实以代码与测试为准；勿将本文件当作需求文档。
- 工具规则扩展前须先修订 Layer 0 契约，禁止在项目内复制完整标准树。
- 变更产物写入所属 change 的 `artifacts/`，禁止散落 workspace 根。

## Workflow（变更单元）

1. 创建 change：`{type}-{slug}-{NNN}/`，从标准库 `templates/change/` 起草 proposal + tasks
2. 最小改动实现，勾选 tasks
3. verify 记录构建/测试证据；未验证不得声称通过
4. 归档：移入 `archive/` 并加 `{YYYYMMDD}-` 前缀
5. 有持久认知价值 → 合并进 `docs/knowledge/` 并登记"变更记录"

## Layer 0 特有

- 契约修改走 spec → plan → 分 Phase 实施（产物在 `docs/superpowers/`）
- `node src/validate.mjs`（layer0 自检）与 `node src/validate.mjs --project . --strict`（自举校验）均须通过
