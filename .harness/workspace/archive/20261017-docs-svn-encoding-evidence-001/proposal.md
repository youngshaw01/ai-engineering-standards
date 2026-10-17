# Proposal — docs-svn-encoding-evidence-001

> 状态：archived · 创建日期：2026-10-17

## Why

ITS 复盘 §4-2 / PayNow 复盘 §7-1 遗留：adoption-contract §4.1 目前只记 MPOC r16389/r16390 **损坏**实证，约定确立后的**通过**实证（ITS r16392/r16393、PayNow r16394/r16395，均 `--xml` 字节级验证）未入契约，证据链不完整。

## What Changes

- `contract/adoption-contract.md` §4.1：新增「验证通过记录」条目（两项目四次提交，覆盖多行中文消息、`--targets` 批量提交 22 paths、move 调度混合场景）。
- ITS/PayNow 复盘对应遗留项状态改为「已补」（闭环追溯）。

## Out of Scope

- §4.1 规则本身（命令约定）不变——仅补证据注记。
- r16389/r16390 损坏日志的服务端修复（需 pre-revprop-change hook，另行处理）。

## 验收标准

- [ ] §4.1 含通过实证（r16392/r16393/r16394/r16395）且不改动既有规则表述
- [ ] 两份复盘遗留项状态闭环
- [ ] `node src/validate.mjs` 与 `--project . --strict` PASS；全量测试全绿

## Impact

- 仅契约文档证据层与复盘状态注记，无工具/ schema 变更，消费项目零影响。
