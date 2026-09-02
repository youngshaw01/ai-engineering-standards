# Standards Maintenance Rules

> 本仓库（Layer 0）的维护约束。消费项目的规则应放在其 `.harness/rules/` 下。

---

## R01 — 文档格式统一

**MUST** — 所有规范文档遵循统一结构：

```markdown
# Title
## Overview
## Rules
### R01 — Rule Title
**MUST / SHOULD / MAY** — Description.
## Checklist
```

---

## R02 — Single Source of Truth

**MUST** — 规则只在一处定义，其他地方通过 Rule ID 引用。

- 全局规则：定义在对应章节文档
- 项目规则：定义在消费项目的 `.harness/rules/`
- Adapter 层：只引用，不重复定义

---

## R03 — Harness 模板同步

**MUST** — 修改 Harness 规范时，同步更新：

1. `11-AI-DevTools/Harness-Bootstrap.md`（规范定义）
2. `templates/harness/`（可复制的模板）
3. 本目录 `.harness/`（本仓库实例，保持一致）

---

## R04 — 模板与实例分离

**MUST** — `templates/` 存放占位符模板（`{{PROJECT_NAME}}`），`.harness/` 存放本仓库的实际配置。

禁止在 `templates/` 中写入本仓库特定内容。

---

## R05 — 禁止 `.standards/` 双轨配置

**MUST NOT** — 创建 `.standards/`、`profile.yaml` 或 `project-profile.yaml` 作为平行配置入口。

**MUST** — 项目 AI 治理唯一工作空间为 `.harness/`：

| 内容 | 路径 |
|------|------|
| 项目画像与治理参数 | `harness.yaml` |
| Rule ID 注册表 | `.harness/config/rule-id.yaml` |
| 路径常量 | `.harness/config/paths.yaml` |
| 例外登记 | `.harness/governance/exceptions.yaml` |

详见 `11-AI-DevTools/Harness-Bootstrap.md#R05`。

---

## R06 — skills 目录规范

**MUST** — Skill 注册表路径统一为 `.harness/skills/skills.yaml`。

详见 `11-AI-DevTools/Skill-Governance.md`。

---

## R07 — 最小修改

**MUST** — 编辑规范文档时仅修改与任务相关的章节，禁止顺手重构无关内容或全文件格式化。

---

## R08 — 路径引用规范

**MUST** — 引用 Harness 路径时使用：

- `.harness/harness.yaml`（项目画像，不是 `profile.yaml`）
- `.harness/rules/`（不是 `.harness/project/rules/`）
- `.harness/workspace/`（不是 `.harness/project/workspace/`）
- `.harness/skills/skills.yaml`
- `.harness/config/rule-id.yaml`
- `.harness/governance/exceptions.yaml`（不是 `.harness/config/exceptions.yaml`）
- 禁止 `.standards/` 目录
