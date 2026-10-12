# 常用 Skill 目录（Catalog）

本目录维护**推荐、可复用的 Skill 清单与安装说明**，供团队选型与 onboarding 使用。

## 与 `skills.yaml` 的区别

| 文件 | 作用 |
|------|------|
| `catalog/catalog.yaml` + `catalog/entries/*.yaml` | 常用 Skill **目录**（来源、安装、子技能、适用场景）；**不表示已启用** |
| `skills.yaml` | 项目 **治理注册表**（经审批后 `enabled` 的 Skill；默认 `auto_execute: false`） |

**MUST** — 从目录选用 Skill 后，仍须按 [Skill-Governance.md](../../../../../11-AI-DevTools/Skill-Governance.md) 评估、试用，并写入 `skills.yaml` 方可视为项目已登记。

## 目录结构

```
skills/
├── skills.yaml              ← 项目启用清单（治理）
├── catalog/
│   ├── README.md            ← 本文件
│   ├── catalog.yaml         ← 索引（指向 entries）
│   └── entries/             ← 各 Skill 详情
│       ├── superpowers.yaml
│       ├── superpowers-zh.yaml
│       └── ...
├── workflow/                ← 本仓库自带的 local Skill（如 stable-iteration）
└── ...
```

## 维护方式

1. 新增常用 Skill：在 `entries/` 增加 `{id}.yaml`，并在 `catalog.yaml` 的 `entries` 列表登记 `id`。
2. 升级外部 Skill：更新 entry 中的 `source.version_pin` 或 `install` 说明，并在 CHANGELOG 记录。
3. 本仓库（Layer 0）模板与 `.harness/skills/catalog/` 保持同步（见 `.harness/rules/standards-maintenance.md` R03）。

## 快速启用示例

选定 Skill 后，将 entry 中的核心字段合并进 `skills.yaml` 的 `enabled` 段，并完成 `approval` 字段。
