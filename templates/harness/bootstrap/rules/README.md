# Project Rules

> 项目特定规则存放目录。
>
> 全局通用规则由 `ai-engineering-standards` 提供，此处只放**本项目特有**的约束。

---

## 规则组织建议

| 文件 | 内容 |
|------|------|
| `项目编码规范.md` | 命名、格式、注释等约定 |
| `工程结构.md` | 目录划分、模块职责 |
| `版本控制.md` | SVN/Git 提交规范、分支策略 |

---

## 当前状态

Bootstrap 阶段——规则待补充。

升级到 Standard 后，应至少包含：

- 项目编码规范
- 工程结构说明
- 版本控制约束（如 SVN 项目需明确 `--encoding gbk`）

---

## 引用全局规则

项目规则可通过 Rule ID 引用全局标准，避免重复定义：

```markdown
## SEC-001: Sensitive Information Protection
Source: ai-engineering-standards/11-AI-DevTools/Common-Rules.md
本项目必须遵守（详见 source）

## VCS-002: SVN Commit Policy（项目特定）
本项目 SVN 服务器使用 GBK 编码，commit 必须带 --encoding gbk
```
