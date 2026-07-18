# CodeArts Rules

> 华为 CodeArts 是华为云推出的一站式 DevOps 平台，集成了 AI 代码辅助能力。

---

## Overview

CodeArts 项目规则配置与最佳实践。

---

## Rules

### R01 — 项目配置

**MUST** — CodeArts 项目规则应通过项目设置配置：

- 代码检查规则集
- 模板配置
- 流水线配置

---

### R02 — 代码检查规则

**SHOULD** — 启用以下代码检查：

- 安全漏洞扫描
- 代码风格检查
- 重复代码检测
- 依赖安全审计

---

### R03 — 与通用规则的关系

**MUST** — CodeArts 项目规则不得违反 [Cursor-Rules.md](Cursor-Rules.md) 中的 AI Engineering Rules（Core Edition）。

项目规则可以在通用规则基础上增加项目特定约束，但不得降低通用规则的要求。

---

## Checklist

- [ ] 代码检查规则集已配置
- [ ] 安全扫描已启用
- [ ] 规则未违反 AI Engineering Rules（Core Edition）
