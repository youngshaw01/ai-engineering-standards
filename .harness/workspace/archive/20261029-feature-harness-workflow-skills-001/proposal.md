# Proposal — feature-harness-workflow-skills-001

## Why
Layer 0 与消费项目反复执行同一批 SOP（变更单元生命周期、提交协议、校验门禁），目前散落在 AGENTS.md / contract / 人工经验中，AI 每次需重新理解，存在跑偏与重复叮嘱成本。

## What Changes
在 `.trae/skills/` 落地 3 个 Trae 项目级薄编排 skill（harness-change / harness-vcs / harness-flow），并建 flow 串联。本变更零契约改动。

## Out of Scope
契约修订；消费项目分发；多 Agent 编排；tests/ 新增引用存在性检查。

## 验收标准
- AC-1：`.trae/skills/` 下 3 个 SKILL.md 存在，frontmatter 含 name + description，description 明确写触发条件与边界。
- AC-2：三个 SKILL.md 不含契约正文副本；规则以引用路径指向 contract/* 或 templates/*。
- AC-3：harness-vcs 的 git 分支禁止 `git add -A`/`git add .`；svn 分支含 `-F UTF-8 --encoding UTF-8` 与 `svn log --xml` 校验步骤。
- AC-4：harness-flow 为单 Agent 顺序清单，含校验门禁步骤与失败回退，并显式声明非多 Agent 编排。
- AC-5：`node src/validate.mjs` 与 `node src/validate.mjs --project . --strict` 均退出码 0。
- AC-6：新会话触发验证：说"按 harness 流程走一次变更"时 harness-flow 被加载（人工记录）。

## Impact
新增 `.trae/skills/`（git 版本化）；不改动 contract/*、src/*、templates/*；不影响 validate 既有判定。

## 设计依据
docs/superpowers/specs/2026-10-29-harness-workflow-skills-design.md
