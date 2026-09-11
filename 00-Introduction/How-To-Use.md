# How To Use

AI Engineering Standards — 接入指南。

---

## 核心理念

> **AI Native Engineering Standard，兼容传统 SVN 企业项目，并支持未来 Git 迁移。**

本仓库是一套规则库，不是项目管理平台。项目通过 **`.harness/`** 接入标准体系（唯一项目级 AI 治理目录）。

标准体系采用 **Harness 三层治理 + Rules / Skills / Knowledge 模型**：

| 层 | 回答的问题 | 内容 | 位置 |
|---|---------|------|------|
| **Rules** | AI 能不能做？ | 安全护栏、编码规范、版本控制 | `.harness/rules/` + 章节文档 |
| **Skills** | AI 会什么？ | TDD、调试、代码审查、架构设计 | `.harness/skills/skills.yaml` |
| **Knowledge** | AI 知道什么？ | 架构文档、数据库设计、API 契约 | `.harness/knowledge/` |

三者职责不混用：Rules 约束行为，Skills 扩展能力，Knowledge 提供知识。

**工作流审计（可选）**：Standard 项目可定期用 [Better Harness](../11-AI-DevTools/Better-Harness.md) 或 `governance/workflow-audit.yaml` 检查五维证据链是否闭环。

> **接入前置条件**：任何项目必须先建立 `.harness/`（至少 Bootstrap 成熟度）。详见 [Harness-Bootstrap.md](../11-AI-DevTools/Harness-Bootstrap.md)。

---

## Harness-first 快速开始

### 新项目（Git，推荐）

```bash
# 1. 复制 Standard 模板（约 30 分钟，含 Bootstrap 能力）
cp -r templates/harness/standard/. your-project/.harness/

# 2. 编辑 .harness/AGENTS.md 与 harness.yaml（项目画像唯一入口）

# 3. 在 rules/、knowledge/ 补充项目约束与业务知识

# 4. 配置 AI 工具 Adapter（.cursor/rules/ 等，引用 Rule ID）
```

仅需最小接入时，可先使用 Bootstrap 模板（约 5 分钟）：

```bash
cp -r templates/harness/bootstrap/. your-project/.harness/
# 后续再 cp -r templates/harness/standard/. 升级
```

### 老项目（SVN）

```bash
# 1. 创建 .harness（Bootstrap 模板）
cp -r templates/harness/bootstrap/. your-project/.harness/

# 2. AI 扫描项目，生成 knowledge/、rules/（人工确认后启用）
# 3. 渐进升级到 Standard / Enterprise
```

详见 [Harness-Bootstrap.md](../11-AI-DevTools/Harness-Bootstrap.md)。

项目全生命周期（需求→开发→测试→部署→交付）及老项目改造路径，详见 [Project-Lifecycle-Governance.md](../01-Engineering/Project-Lifecycle-Governance.md)。

---

## harness.yaml 配置项

| 配置 | 位置 | 说明 |
|------|------|------|
| 项目画像 | `.harness/harness.yaml` | 名称、类型、技术栈、成熟度 |
| Rule ID 注册表 | `.harness/config/rule-id.yaml` | 跨层规则追溯 |
| 例外登记 | `.harness/governance/exceptions.yaml` | 老项目已知偏差 |
| 生命周期门禁 | `.harness/governance/` | lifecycle.yaml、gates.yaml |

模板：`templates/harness/standard/harness.yaml`

---

## harness.yaml 详解

项目治理配置统一在 `.harness/harness.yaml`（模板：`templates/harness/standard/harness.yaml`）。

```yaml
project:
  name: payment-service
  type: new
  version_control: git

technology:
  backend: [java]
  ai_tool: [cursor]

global_standards:
  inherit: [safety, coding, api, testing]

exclude: []

rule_identity:
  registry: .harness/config/rule-id.yaml
```

### 关键说明

| 字段 | 说明 |
|------|------|
| `project.type` | `new` 或 `legacy` |
| `project.version_control` | 决定加载 Git.md 还是 SVN.md |
| `global_standards.inherit` | 继承的全局规则集 |
| `exclude` | 排除不适用的架构规则 |
| `maturity` | bootstrap / standard / enterprise |

---

## 两种路径

### 路径 A：新项目 — 从第一天符合标准

```
创建项目
    ↓
初始化 .harness/（type: new，见 harness.yaml）
    ↓
选择技术栈 → 配置 global_standards.inherit
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
在 .harness/governance/exceptions.yaml 中记录例外
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
3. **例外必须记录** — 在 `.harness/governance/exceptions.yaml` 中声明理由和负责人
4. **优先修复安全问题** — SQL 注入、XSS、硬编码密钥等必须立即处理
5. **不推动 SVN→Git 迁移** — 迁移是独立决策，不在标准接入范围内

**SVN 项目特别注意：**

SVN 老项目使用 AI 的最大风险不是提交，而是 **AI 大范围修改**。因此：

- AI Rules 必须限制批量修改、自动重构、目录迁移、依赖升级、全工程格式化
- 开发流程：`svn checkout` → `Cursor 打开项目` → `AI 读取 .cursor/rules/` → `开发` → `人工 svn commit`
- 不要让 AI 执行任何 svn 命令，所有版本控制操作由开发者手动执行

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
AI 读取 .harness/AGENTS.md + harness.yaml
    ↓
按 harness.yaml 继承全局规则 + 加载 .harness/rules/
    ↓
按 .harness/skills/skills.yaml 加载 Skill（Skills 层）
    ↓
按 .harness/knowledge/ 按需查询（Knowledge 层）
    ↓
开发者编写代码 → AI 自动应用规则
    ↓
产物归入 .harness/workspace/{task_id}/
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
└── .harness/
    └── config/
        └── rule-id.yaml
```

#### Trae

```
your-project/
├── AI_RULES.md                    ← 合并后的规则文件
└── .harness/
    └── config/
        └── rule-id.yaml
```

#### Claude Code

```
your-project/
├── .claude/
│   └── rules/
│       ├── safety.md
│       ├── git.md
│       └── java.md
└── .harness/
    └── config/
        └── rule-id.yaml
```

### 为什么不让 AI 读取整个 standards 仓库？

- **上下文浪费** — 全量加载会占用大量 token，降低 AI 响应质量
- **规则冲突** — 无关规则可能产生矛盾建议
- **性能问题** — 每次对话都要重新加载所有规则

**正确做法：** 根据 `harness.yaml` 的 `global_standards.inherit` 生成精简版规则文件，只保留当前项目适用的内容。

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

**标准库侧**：按章节组织（`00-Introduction/` … `11-AI-DevTools/`），模板在 `templates/`。

**项目侧**：

```
your-project/
├── .harness/                  ← 唯一项目级 AI 治理目录
│   ├── AGENTS.md
│   ├── harness.yaml           ← 项目画像 + 治理配置
│   ├── config/rule-id.yaml
│   ├── governance/exceptions.yaml
│   ├── rules/
│   ├── knowledge/
│   ├── skills/skills.yaml
│   └── workspace/
└── .cursor/rules/             ← Adapter 层（引用 Rule ID）
```

---

## 常见问题

### Q: 老项目有大量历史代码，怎么开始？

A: 第一步只做两件事：
1. 建立 `.harness/`（Bootstrap），在 `harness.yaml` 中声明 `type: legacy`
2. 在 `.harness/governance/exceptions.yaml` 中记录最明显的几个例外

然后每次修改代码时，确保新代码符合标准即可。不需要一次性整改所有历史代码。

### Q: 如何知道哪些规则适用于我的项目？

A: 看 `harness.yaml` 中的 `global_standards.inherit`：
- `safety` — 所有项目都需要
- `vcs` — 必须有（根据 `version_control.type` 自动选择 Git.md 或 SVN.md）
- `coding` — 必须有（对应你的编程语言）
- `api` — 后端项目需要
- `testing` — 所有项目都需要
- `ddd` / `microservice` / `kubernetes` — 只有实际使用时才包含

### Q: 可以自定义规则吗？

A: 可以。在项目的 `.harness/rules/` 目录下添加自定义规则，AI 工具通过 Rule ID 引用。项目级规则优先级高于全局标准。

### Q: 如何处理与团队现有规范的冲突？

A: 在 `.harness/governance/exceptions.yaml` 中声明例外，并注明：
- 原因（为什么偏离标准）
- 范围（哪些文件受影响）
- 负责人（谁批准了这个例外）
- 截止日期（何时应该解决这个例外）

---

## 下一步

- 查看 [Glossary](Glossary.md) 了解术语定义
- 查看 [Chapter Index](../README.md) 浏览完整规则列表
- 查看 [templates/](../templates/) 获取可用模板
