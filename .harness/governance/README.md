# Governance — ai-engineering-standards

> 本仓库（Layer 0 标准库）的生命周期与质量门禁实例。
>
> 消费项目请复制 `templates/harness/standard/governance/` 并按 [Project-Lifecycle-Governance.md](../../01-Engineering/Project-Lifecycle-Governance.md) 调整。

---

## 文件说明

| 文件 | 用途 |
|------|------|
| `lifecycle.yaml` | 标准文档维护生命周期（非业务软件交付） |
| `gates.yaml` | 文档/Harness 结构校验门禁 |

本仓库为 `type: new`，不使用 `legacy-roadmap.yaml`。老项目改造模板见 `templates/harness/standard/governance/legacy-roadmap.yaml`。

---

## 维护原则（R03）

修改 Harness 规范时同步更新：

1. `11-AI-DevTools/Harness-Bootstrap.md`
2. `templates/harness/`
3. `.harness/`（本目录及同级实例）
