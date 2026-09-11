# Project Rules

> 项目特定规则存放目录。
>
> 全局通用规则由 `ai-engineering-standards` 提供，此处只放**本项目特有**的约束。

---

## 推荐规则文件

| 文件 | 内容 |
|------|------|
| `项目编码规范.md` | 命名、格式、注释等约定 |
| `工程结构.md` | 目录划分、模块职责 |
| `版本控制.md` | SVN/Git 提交规范、分支策略 |
| `数据库.md` | 表命名、字段类型、索引约定 |

---

## 规则组织建议

### 按层级组织（复杂项目）

```
rules/
├── 工程结构.md
├── 项目编码规范.md
├── 开发流程规范.md
├── detail/               ← 详细规则（按需加载）
│   ├── java-conventions.md
│   ├── web-conventions.md
│   ├── web-detail-view.md    ← 详情查看态 IA（继承 04-Frontend/Detail-View-IA.md）
│   └── sql.md
└── layers/               ← 分层架构规则（按层加载）
    ├── 01-controller.md
    ├── 02-service.md
    └── 03-dao.md
```

### 引用全局规则

通过 Rule ID 引用全局标准，避免重复定义：

```markdown
## SEC-001: Sensitive Information Protection
Source: ai-engineering-standards/11-AI-DevTools/Common-Rules.md
本项目必须遵守（详见 source）

## VCS-002: SVN Commit Policy（项目特定）
本项目 SVN 服务器使用 GBK 编码，commit 必须带 --encoding gbk
```
