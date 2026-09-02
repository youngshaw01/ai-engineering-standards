# Governance Templates

> 项目级生命周期与质量门禁配置模板。
>
> 复制到消费项目：`.harness/governance/`

---

## 文件说明

| 文件 | 用途 |
|------|------|
| `lifecycle.yaml` | 生命周期阶段、门禁、环境映射（机器可读） |
| `gates.yaml` | 质量门禁：pre-commit / pre-merge / pre-deploy / post-deploy |
| `exceptions.yaml` | 老项目已知偏差登记模板 |
| `legacy-roadmap.yaml` | 老项目渐进改造里程碑模板 |

---

## 使用方法

```bash
mkdir -p .harness/governance
cp templates/harness/standard/governance/*.yaml .harness/governance/

# 编辑 lifecycle.yaml — 按项目调整阶段负责人
# 编辑 gates.yaml — 按技术栈调整命令
# 老项目额外编辑 legacy-roadmap.yaml
```

---

## 规范引用

详见 [Project-Lifecycle-Governance.md](../../../01-Engineering/Project-Lifecycle-Governance.md)。
