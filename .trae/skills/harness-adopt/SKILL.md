---
name: harness-adopt
description: 在把 Harness 标准接入到新项目或存量项目时使用——判定画像（新仓 init / 已有仓 adopt）、dry-run 预览、冲突与 v1 残留退出码处置、接入后 validate 门禁，并指向可选的 bootstrap 知识梳理。当用户要求"给某项目接入 harness""初始化 harness""旧项目改造接入""adopt"时触发。不适用于已接入项目内部的日常变更（走 harness-change），也不适用于契约修订。
---

# harness-adopt：Harness 接入（新项目 / 存量项目）

## 何时使用
- 目标项目尚无 `.harness/`，需建立最小 Harness 形状（`.harness/project.yaml` + `AGENTS.md` + `workspace/` + `docs/knowledge|rules/`）
- 存量项目首次接入，或 v2（`schemaVersion: 2.0.0`）升级到 v3
- 接入后需要建立初始知识库（可选，见步骤 6）

## 何时不使用
- 项目已接入，只是推进变更单元 → `harness-change` / `harness-flow`
- 修改 Layer 0 契约 → 走契约修订流程，非本 skill

## 前置
确认标准库位置（本仓库即 Layer 0 的 `src/`；消费项目用 `<standards>/src/`）。接入默认只读业务目录，只生成 `AGENTS.md` / `.harness/project.yaml` / `.harness/README.md` / `workspace/`（+ `docs/knowledge|rules/README.md`）。

## 步骤
1. 判定画像：
   - 空仓 / 新项目（无存量业务代码）→ 走 init。
   - 已有仓库 → 走 adopt；若 `.harness/project.yaml` 为 `schemaVersion: 2.0.0`，先读 `contract/migration-guide.md` §1 通用升级步骤。
2. **预览（必做）**：`node <standards>/src/adopt.mjs --project . --dry-run`（新项目用 `init.mjs --dry-run`），审阅 JSON 计划后再落盘。
3. 执行：
   - 新项目：`node <standards>/src/init.mjs --project . --project-id <id> --display-name "<name>"`
   - 存量项目：`node <standards>/src/adopt.mjs --project .`
4. **退出码处置**（依据 `contract/adoption-contract.md` §2/§3/§4）：
   - `2` `CONFLICT_EXISTS`：已有 `AGENTS.md` / `project.yaml` / `README.md` 被跳过 → **人工合并**，禁止用 `--force` 覆盖。
   - `3` 阻断性 v1 残留（`LEGACY_V1_HARNESS_YAML` / `LEGACY_V1_BLUEPRINT`）→ 人工判断后加 `--acknowledge-legacy`；**不得**自动删除或合并 v1 树。
   - `4` `AMBIGUOUS_VCS`（`.git/` 与 `.svn/` 并存）→ 显式 `--vcs git|svn`。
5. **校验门禁**：`node <standards>/src/validate.mjs --project .`，error 清零；再 `--strict` 使 warning 清零（`--report text` 出可读报告）。
   - 非清零 → 人工处置后复跑，禁止带 error 进入日常变更。
   - 禁路径（`.harness/rules`、`.harness/skills`、`.harness/knowledge`、`.harness/wiki`、`.standards`）由 validate 判定（`adoption-contract.md` §6）：存在即失败，需人工迁移/清理。
6. （存量项目可选）初始知识库：按 `templates/bootstrap/README.md` 创建 `docs-knowledge-bootstrap-{NNN}` 变更单元，把 `templates/bootstrap/prompts/COORDINATOR.md` 交给有仓库权限的 Agent，按阶段 0→6 执行；prompts 从标准库读取，**不复制进项目**。
7. 接入完成 → 后续变更交 `harness-change`（或 `harness-flow` 全流程）。

## 权威来源（唯一 SSOT，禁止复制正文）
- `contract/adoption-contract.md`（§1 命令 / §2 冲突 / §3 v1 残留 / §4 VCS 与提交编码 / §6 adopt↔validate 边界）
- `contract/migration-guide.md`（§1 通用升级步骤 / §2 三类画像 / §3 回滚）
- `README.md`（新项目 / 已有项目 / 校验命令）
- `templates/minimal/`（生成物模板清单）；`templates/bootstrap/`（知识梳理工作包）

## 失败回退
- 冲突退出码 `2` → 人工合并后复跑，不使用 `--force`。
- 发现触碰业务目录（`src/`、`java/` 等）→ 立即停止并报告。
- validate 报 forbidden path → 迁移/清理后再复跑。
- v1 残留阻断（码 `3`）且未经人工确认 → 停止，不动 v1 树。
