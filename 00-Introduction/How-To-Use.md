# How To Use

AI Engineering Standards — 接入指南。

---

## 核心理念

> **标准库提供能力，项目只声明自己采用哪些。**

本仓库是一套规则库，不是项目管理平台。每个项目通过 `.standards/profile.yaml` 声明自己的技术栈和适用规则，AI 开发工具（Cursor / Trae / Claude Code）据此加载对应规则。

---

## 快速开始

### 新项目

```bash
# 1. 复制模板
cp templates/project-profile.yaml your-project/.standards/profile.yaml
cp templates/exceptions.yaml your-project/.standards/exceptions.yaml

# 2. 编辑 profile.yaml，声明你的技术栈
#    type: new
#    technology: { backend: [java], database: [mysql] }

# 3. 将 AI Rules 文件链接到项目
#    根据你的 AI 工具选择：
#    - Cursor: 复制 .cursor/rules/*.md 到项目根目录或 .cursor/rules/
#    - Trae: 复制 AI_RULES.md 到项目根目录
#    - Claude Code: 复制 .claude/rules/*.md 到项目根目录

# 4. 开始开发 — AI 会自动应用对应规则
```

### 老项目

```bash
# 1. 复制模板
cp templates/project-profile.yaml your-project/.standards/profile.yaml
cp templates/exceptions.yaml your-project/.standards/exceptions.yaml

# 2. 编辑 profile.yaml
#    type: legacy
#    rules.include: 只包含你当前能执行的规则

# 3. 在 exceptions.yaml 中记录已知的例外情况

# 4. 遵循 Boy Scout Rule：
#    新代码必须符合标准，旧代码逐步治理
```

---

## profile.yaml 详解

每个项目只需一个配置文件：

```yaml
project:
  name: payment-service
  description: 支付服务

type:
  # new — 从零开始，第一天就符合标准
  # legacy — 已有代码，渐进接入
  type: new

technology:
  backend:
    - java          # java | python | go | nodejs
  frontend:
    - vue           # react | vue | angular
  database:
    - mysql        # mysql | postgresql | mongodb | redis
  ai_tool:
    - cursor       # cursor | trae | claude-code | codex | none

architecture:
  style:
    - monolith     # monolith | microservice | ddd | event-driven

standards:
  level: standard   # standard | strict

rules:
  include:
    # 核心规则（始终推荐）
    - safety            # 安全、敏感信息、删除保护
    - git               # Git 工作流、提交规范
    - coding            # 编码规范（按语言）
    - api               # API 设计模式
    - testing           # 测试策略

  exclude:
    # 架构规则 — 只有实际使用时才包含
    - ddd               # 如果不用 DDD，排除
    - microservice      # 如果不用微服务，排除
    - kubernetes        # 如果不上 K8S，排除
    - event-driven      # 如果不用事件驱动，排除
```

### 关键说明

| 字段 | 说明 |
|------|------|
| `type` | 只有两个值：`new` 或 `legacy`。不需要 L1/L2/L3 成熟度分级。 |
| `rules.include` | 显式声明采用哪些规则集。不写 = 不适用。 |
| `rules.exclude` | 显式排除不适用的架构规则。避免 AI 给出无关建议。 |
| `ai_tool` | 声明使用的 AI 开发工具，决定加载哪套 Rules 文件。 |

---

## 两种路径

### 路径 A：新项目 — 从第一天符合标准

```
创建项目
    ↓
初始化 .standards/profile.yaml（type: new）
    ↓
选择技术栈 → 自动确定 rules.include
    ↓
生成 AI Rules（.cursor/rules/ 或 AI_RULES.md）
    ↓
开始开发
```

**新项目默认包含的规则：**

| 类别 | 规则 | 原因 |
|------|------|------|
| 必选 | safety | 安全不可妥协 |
| 必选 | git | 版本控制基础 |
| 必选 | coding | 编码规范 |
| 必选 | api | API 一致性 |
| 必选 | testing | 质量保障 |
| 可选 | ddd | 仅当使用领域驱动设计 |
| 可选 | microservice | 仅当使用微服务架构 |
| 可选 | kubernetes | 仅当部署到 K8S |
| 可选 | event-driven | 仅当使用事件驱动架构 |

### 路径 B：老项目 — 渐进接入（Boy Scout Rule）

> **每次经过营地，让它比你离开时更干净。**
> — Robert C. Martin

```
接入
    ↓
扫描现有代码，识别差距
    ↓
在 exceptions.yaml 中记录例外
    ↓
制定迁移计划（按优先级排序）
    ↓
每次迭代修复 1-2 个差距项
    ↓
新代码必须符合标准
```

**老项目接入原则：**

1. **不要求全部整改** — 这是不可执行的
2. **新代码必须符合标准** — 每次修改都是改进机会
3. **例外必须记录** — 在 exceptions.yaml 中声明理由和负责人
4. **优先修复安全问题** — SQL 注入、XSS、硬编码密钥等必须立即处理

**示例 — 老项目差距报告：**

```markdown
# Project Audit

## Security
❌ SQL拼接 — 发现 15 处
   处理: 新代码禁止，旧代码 Sprint 3 修复

❌ 硬编码密钥 — 发现 3 处
   处理: 本周内修复

## API
⚠️ 无统一错误码 — 影响 32 个 API
   计划: Sprint 4 统一改造

## Redis
⚠️ 45% 的 Key 不符合命名规范
   计划: 新代码强制遵守，旧代码逐步迁移
```

---

## AI 工具接入

### 工作原理

```
项目启动
    ↓
AI 工具读取 .standards/profile.yaml
    ↓
根据 rules.include 加载对应章节的规则
    ↓
开发者编写代码 → AI 自动应用规则
    ↓
提交代码 → AI 用 Checklist 自检
```

### 各工具配置方式

#### Cursor

```
your-project/
├── .cursor/
│   └── rules/
│       ├── 00-safety.md          ← 从 safety 章节生成
│       ├── 01-git.md             ← 从 git 章节生成
│       ├── 02-java.md            ← 从 coding 章节生成
│       └── 03-api.md             ← 从 api 章节生成
└── .standards/
    └── profile.yaml
```

#### Trae

```
your-project/
├── AI_RULES.md                    ← 合并后的规则文件
└── .standards/
    └── profile.yaml
```

#### Claude Code

```
your-project/
├── .claude/
│   └── rules/
│       ├── safety.md
│       ├── git.md
│       └── java.md
└── .standards/
    └── profile.yaml
```

### 为什么不让 AI 读取整个 standards 仓库？

- **上下文浪费** — 全量加载会占用大量 token，降低 AI 响应质量
- **规则冲突** — 无关规则可能产生矛盾建议
- **性能问题** — 每次对话都要重新加载所有规则

**正确做法：** 根据 profile.yaml 的 `rules.include` 生成精简版规则文件，只保留当前项目适用的内容。

---

## 规则分级

本仓库使用三种严重级别：

| 级别 | 含义 | 对 AI 的指令 |
|------|------|------------|
| **MUST** | 必须执行 | "You MUST follow this rule" |
| **SHOULD** | 建议执行 | "You SHOULD follow this unless justified" |
| **MAY** | 可选执行 | "You MAY consider this approach" |

**映射关系：**

| 本仓库 | 你的分类 | 场景 |
|--------|---------|------|
| MUST | Required | 安全、敏感信息、删除保护、Git 危险操作 |
| SHOULD | Recommended | 日志规范、API 规范、测试规范 |
| MAY | Optional | DDD、微服务、K8S、事件驱动 |

---

## 最小可落地版本

Phase 1 只需要三样东西：

```
ai-engineering-standards/
├── core/              ← 安全 + Git + AI 工作规则
├── engineering/       ← 后端 + API + 数据库
├── languages/         ← Java / Python / ...
├── templates/
│   ├── project-profile.yaml   ← 项目画像模板
│   └── exceptions.yaml        ← 例外声明模板
└── docs/
    └── How-To-Use.md          ← 本文档
```

**项目侧只需要：**

```
your-project/
├── .standards/
│   ├── profile.yaml    ← 声明技术栈和规则
│   └── exceptions.yaml ← 记录例外（可选）
└── AI_RULES.md         ← AI 工具读取的规则（从标准库生成）
```

---

## 常见问题

### Q: 老项目有大量历史代码，怎么开始？

A: 第一步只做两件事：
1. 添加 `.standards/profile.yaml`，声明 `type: legacy`
2. 在 `exceptions.yaml` 中记录最明显的几个例外

然后每次修改代码时，确保新代码符合标准即可。不需要一次性整改所有历史代码。

### Q: 如何知道哪些规则适用于我的项目？

A: 看 `profile.yaml` 中的 `rules.include`：
- `safety` — 所有项目都需要
- `git` — 所有项目都需要
- `coding` — 必须有（对应你的编程语言）
- `api` — 后端项目需要
- `testing` — 所有项目都需要
- `ddd` / `microservice` / `kubernetes` — 只有实际使用时才包含

### Q: 可以自定义规则吗？

A: 可以。在项目的 `.standards/` 目录下添加自定义规则文件，AI 工具会同时加载标准库规则和你的项目级规则。项目级规则优先级更高。

### Q: 如何处理与团队现有规范的冲突？

A: 在 `exceptions.yaml` 中声明例外，并注明：
- 原因（为什么偏离标准）
- 范围（哪些文件受影响）
- 负责人（谁批准了这个例外）
- 截止日期（何时应该解决这个例外）

---

## 下一步

- 查看 [Glossary](Glossary.md) 了解术语定义
- 查看 [Chapter Index](../README.md) 浏览完整规则列表
- 查看 [templates/](../templates/) 获取可用模板
