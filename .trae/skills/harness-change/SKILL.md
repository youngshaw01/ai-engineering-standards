---
name: harness-change
description: 在实行 Harness 变更单元工作流时使用——创建（explore/proposal/tasks）、推进实现、编写 verify（逐条引用 AC）、归档到 archive/、（可选）补 retro 与知识回流。当用户要求新建变更单元、写提案/任务清单/验收证据、归档变更单元时触发。不适用于纯代码编写，也不适用于未接入 Harness 的项目。
---

# harness-change：变更单元生命周期

## 何时使用
- 用户要新建一个变更单元（change）
- 需要起草 explore / proposal / tasks / design / verify / retro
- 需要归档一个已完成的变更单元

## 何时不使用
- 只是写业务代码，不涉及变更单元
- 项目未接入 Harness（无 `.harness/workspace/`）

## 权威来源（唯一 SSOT，禁止在本文件复制其正文）
- 契约 `contract/harness-contract.md` §4（workspace 工作流契约）、§5.2（变更记录追溯）
- 模板 `templates/change/`：explore.md / proposal.md / tasks.md / design.md / verify.md / retro.md

## 步骤
1. 方向不明时：读 `templates/change/explore.md` 起草 `explore.md`（问题/选项/约束/待决问题/结论），人拍板后再继续。
2. 读 `contract/harness-contract.md` §4.1，按其命名规则创建 `.harness/workspace/changes/{change-id}/`；`type` 取值先读 `.harness/project.yaml → workflow.types`，无覆盖时用默认清单。
3. 依 `templates/change/proposal.md` 起草 `proposal.md`（验收标准条目用 `AC-<n>` 编号）；依 `templates/change/tasks.md` 起草 `tasks.md`。
4. 跨模块 / 架构级变更：依 `templates/change/design.md` 增补 `design.md`（可选）。
5. 实现并勾选 `tasks.md`。
6. **校验点**：归档前依 `templates/change/verify.md` 编写 `verify.md`——记录构建/测试证据，人工核查逐条引用 proposal 的 AC ID（契约 §4.4）。未验证不得声称通过。
7. 归档：将 change 目录移入 `.harness/workspace/archive/`，按契约 §4.1 加日期前缀（日期取变更创建日）。
8. 可选：依 `templates/change/retro.md` 补 `retro.md`。
9. 知识回流（人工动作）：把已验证认知合并进 `docs/knowledge/`，并在目标文档"变更记录"小节登记一行（契约 §5.2）。

## 失败回退
- `verify.md` 缺 AC 引用 → 回到步骤 6 补齐后再归档。
- `.harness/workspace/changes/` 根出现散落文件 → 移回所属 change 目录内。
