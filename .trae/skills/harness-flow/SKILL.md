---
name: harness-flow
description: 需要"按 Harness 流程完整走一遍"时使用——把变更单元生命周期、校验门禁、提交协议编排为一条单 Agent 顺序清单。当用户说"按 harness 流程走一次变更""跑一遍 harness 工作流"时触发。
---

# harness-flow：工作流编排（单 Agent 顺序执行）

> 本 flow 是**单 Agent 顺序清单**，不是多 Agent 编排。

## 前置
读 `.harness/project.yaml` 确认 `vcs`；确认已接入 Harness（`.harness/workspace/` 存在）。

## 顺序清单
1. 加载 `harness-change`，推进变更单元至 `verify`（含 AC 逐条核对）。
   - 校验点：`verify.md` 存在，且人工核查逐条引用了 proposal 的 AC ID。
2. 校验门禁（任一命令退出码非 0 则**回退到 1**，禁止继续）：
   - `node src/validate.mjs`（Layer 0 自检）
   - `node src/validate.mjs --project . --strict`（自举校验；消费项目改为 `--project <dir>`）
3. 加载 `harness-vcs`，按 `vcs` 分派提交。
4. 归档 +（可选）retro + 知识回流登记。

## 引用
- 同级 skill：`harness-change`、`harness-vcs`
- 契约 `contract/harness-contract.md` §11（生命周期命令表）
