# Proposal — bugfix-detectvcs-ancestors-001

> 状态：archived · 创建日期：2026-10-17

## Why

ITS 迁移发现（ITS 复盘 §4-1）：SVN 工作副本根在祖先目录（`D:\document\svn\posp`）时，项目根无 `.svn` → `detectVcs` 误判 `vcs: git`。PayNow（同为 posp 子目录）必然复现；当前只能 `--vcs svn` 显式绕过。

## What Changes

- `src/lib/paths.mjs` `detectVcs`：项目根无标记时沿祖先目录上溯探测 `.svn` / `.git`（SVN 1.7+ 仅 WC 根有 `.svn`；git 仅仓库根有 `.git`，嵌套项目同理受益）。祖先同时存在两者 → 仍 `AMBIGUOUS_VCS`。
- `tests/`：新增嵌套工作副本探测测试（临时目录内造两层嵌套验证 svn/git 上溯与默认回退）。

## Out of Scope

- adoption-contract §4.1 补记 r16392 实证（另项处理）。
- PayNow 迁移执行（本变更完成后启动）。

## 验收标准

- [ ] 嵌套两层目录下（祖先有 `.svn`）`detectVcs` 返回 svn
- [ ] 项目根双标记 → AMBIGUOUS_VCS（原行为不回归）
- [ ] 无任何标记 → 默认 git（原行为不回归）
- [ ] `node src/validate.mjs` 与 `--project . --strict` PASS；全量测试全绿

## Impact

- `init` / `adopt` 的 vcs 自动检测；`--vcs` 显式参数行为不变（优先级更高）。消费项目无 schema 变更。
