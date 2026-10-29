# Proposal — feature-harness-adopt-skill-002

## Why
现有 3 个 skill（harness-change / harness-vcs / harness-flow）前置假设"项目已接入 Harness"。而"把 Harness 接入新项目 / 存量项目"这一段只有契约（`contract/adoption-contract.md`、`migration-guide.md`）+ CLI（`src/init.mjs`、`src/adopt.mjs`）+ 模板，未 skill 化，AI 每次需重新拼装命令与退出码语义。

## What Changes
新增 `.trae/skills/harness-adopt/SKILL.md`（薄编排：画像判定 → dry-run 预览 → init/adopt → 退出码处置 → validate 门禁 → 可选 bootstrap 知识梳理），并在 Harness-flow 前置补一条"未接入则先接入"的指向。

## Out of Scope
契约修订；把 `templates/bootstrap/` 阶段流程正文并入 skill（仅引用）；改动 `src/*`、`contract/*`、`templates/*`。

## 验收标准
- AC-1：`.trae/skills/harness-adopt/SKILL.md` 存在，frontmatter 含 name + description，description 写明触发条件（新项目/存量接入/adopt）与边界（不覆盖已接入项目的日常变更、不含契约修订）。
- AC-2：SKILL.md 不含契约正文副本；规则以引用路径指向 `contract/adoption-contract.md`、`contract/migration-guide.md`、`README.md`、`templates/minimal/`、`templates/bootstrap/`。
- AC-3：含 init 与 adopt 两条路径、`--dry-run` 先预览、退出码 2/3/4 处置、VCS 歧义用 `--vcs` 显式指定。
- AC-4：含接入后 validate 门禁（error 清零、`--strict` warning 清零）与失败回退；含可选 bootstrap 知识梳理路径（只引用标准库 prompts，不复制）。
- AC-5：`node src/validate.mjs` 与 `node src/validate.mjs --project . --strict` 均退出码 0。
- AC-6：`harness-flow/SKILL.md` 前置含"未接入 → 先 harness-adopt"的指向。

## Impact
新增 1 个 skill 目录（git 版本化）；`harness-flow/SKILL.md` 增加 1-2 行前置指向；不改 `src/*`、`contract/*`、`templates/*`；不影响 validate 判定。

## 设计依据
本轮决策（AskUserQuestion，2026-10-29）：范围为"只做接入 skill"，bootstrap 知识梳理不并入、仅引用。
