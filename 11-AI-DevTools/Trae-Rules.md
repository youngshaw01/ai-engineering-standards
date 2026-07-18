# Trae Rules

> Trae 是字节跳动推出的 AI IDE，支持智能代码补全、对话式编程、项目级上下文理解。

---

## Overview

Trae 项目规则配置与最佳实践。

---

## Rules

### R01 — 项目规则文件位置

**MUST** — Trae 项目规则放置在以下位置：

```
.trae/rules/project_rules.md
```

✅ Correct:

```
project/
├── .trae/
│   └── rules/
│       └── project_rules.md
├── src/
└── package.json
```

❌ Wrong:

```
project/
├── .cursorrules
├── .trae_rules
└── src/
```

---

### R02 — 规则内容结构

**SHOULD** — 项目规则文件应包含以下结构：

```markdown
# 项目规则

## 技术栈
- 语言 / 框架 / 主要依赖

## 编码规范
- 命名约定
- 文件组织

## AI 辅助约定
- 修改前确认门槛
- 敏感信息处理
- 输出语言偏好
```

---

### R03 — 上下文管理

**SHOULD** — 利用 Trae 的项目级上下文能力：

- 在规则中明确项目的技术栈和架构
- 指定关键的入口文件和配置文件
- 说明项目特有的约定和模式

---

### R04 — 与通用规则的关系

**MUST** — Trae 项目规则不得违反 [Cursor-Rules.md](Cursor-Rules.md) 中的 AI Engineering Rules（Core Edition）：

- L0 安全原则
- L1 确认规则
- L2 工程原则
- L3 工作方式
- L4 输出规范
- L5 优先级

项目规则可以在通用规则基础上增加项目特定约束，但不得降低通用规则的要求。

---

## Checklist

- [ ] 项目规则文件位于 `.trae/rules/project_rules.md`
- [ ] 规则内容包含技术栈、编码规范、AI 辅助约定
- [ ] 规则未违反 AI Engineering Rules（Core Edition）
- [ ] 上下文信息完整且准确
