# Proposal — bugfix-contract-defects-001

> 状态：archived · 创建日期：2026-10-17

## Why

MPOC 试点复盘（[2026-10-17-mpoc-pilot-retro.md](../../../docs/superpowers/retros/2026-10-17-mpoc-pilot-retro.md) §3）发现 2 处契约缺陷，须在推广 ITS/PayNow 前修订：

1. **migration-guide 画像偏差**：§2.1 将 MPOC 判为"零包袱型（无 v1 遗产）"，实际存在 v1 bootstrap wiki 资产（23 篇已对抗审计，~500KB），画像描述与处置指引缺失。
2. **SVN commit 编码陷阱**：AI 环境提交中文日志两条路径均实测损坏——r16389（内联中文 + `--encoding gbk` → 字面 `?`）、r16390（无 locale shell 下 `-F UTF-8` 文件不带 `--encoding` → 按 Latin-1 误读，双重编码损坏）。契约未记载正确约定。

## What Changes

- `contract/migration-guide.md` §2.1：修正"零包袱型"现状定义（区分"workspace 调度遗产"与"知识资产"）；新增 v1 wiki 资产处置指引（整目录平移 `docs/knowledge/wiki/` + 批量 changelog + 探测垃圾清理）。
- `contract/adoption-contract.md` §4：新增 §4.1 提交编码约定（AI：`-F <UTF-8 文件> --encoding UTF-8`；人工 GBK 控制台：`--encoding gbk`；损坏日志修复路径）。
- `templates/minimal/docs/rules/README.md`：svn.md 示例行同步编码约定。
- `docs/superpowers/retros/2026-10-17-mpoc-pilot-retro.md`：§1/§3/§4 更新为 r16390 实测后的结论（原"-F 不带 --encoding"方案已被证伪）。

## Out of Scope

- `VERSION`/`CHANGELOG` 的 3.0.1 发布登记（commit 时由用户决定是否纳入）。
- r16389/r16390 已损坏日志的服务端修复（需 pre-revprop-change hook，属 SVN 管理员操作）。
- ITS/PayNow 推广执行（本变更完成后另行启动）。

## 验收标准

- [ ] migration-guide §2.1 含 v1 wiki 资产处置指引，画像描述与 MPOC 实际相符
- [ ] adoption-contract §4.1 给出 AI/人工两条正确的提交命令，并说明两种损坏模式
- [ ] 复盘文档不再包含已被证伪的"-F 不带 --encoding"指引
- [ ] `node src/validate.mjs` 与 `node src/validate.mjs --project . --strict` 均 PASS
- [ ] `node --test tests/` 全绿

## Impact

- 契约文档（migration-guide、adoption-contract）：向后兼容补充，无行为变更。
- 模板（rules/README.md 示例）：仅示例文案。
- 复盘文档：事实修正。
- 消费项目：无需升级 schemaVersion；后续 SVN 项目接入时按 §4.1 执行即可。
