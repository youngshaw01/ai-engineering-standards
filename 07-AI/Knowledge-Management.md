# Knowledge Management

## Overview

本规范定义项目知识（架构文档、数据库 schema、API 契约、业务流程、Wiki）如何被提取、结构化并提供给 AI Agent。

**核心原则**：知识不应被全量倾倒给 AI，而应精炼为 **Knowledge Pack**——结构化、可消费、与源码同步的知识包。

---

## Rules

### R01 — Knowledge Pack 概念

**MUST** 将项目知识精炼为 AI 可消费的结构化文档，而非整个 Wiki/Confluence。

**SHOULD** 每个 Knowledge Pack 聚焦单一主题，保持独立可加载。

**MAY** 根据任务类型动态组合多个 Knowledge Pack。

**Why**：全量知识会导致上下文爆炸，降低 AI 推理效率；精炼后的知识提升准确性和响应速度。

#### ✅ Correct

```yaml
# .standards/knowledge.yaml
packs:
  - name: architecture
    description: "系统架构概览"
    file: docs/ai-knowledge/architecture.md
    size: 3.2KB
    load_trigger: ["architecture", "design", "refactor"]

  - name: database
    description: "数据库表结构与关系"
    file: docs/ai-knowledge/database.md
    size: 2.8KB
    load_trigger: ["database", "sql", "query", "migration"]
```

#### ❌ Wrong

```yaml
# 错误：直接引用整个 Wiki
packs:
  - name: full-wiki
    description: "全部知识"
    file: https://wiki.company.com/all-pages
    size: 50MB  # 上下文爆炸
```

---

### R02 — Knowledge 分类

**MUST** 按以下 7 类组织知识，每类独立文档。

| 类别 | 标识 | 内容范围 | 典型文件 |
|------|------|----------|----------|
| Architecture | `architecture` | 系统架构、模块划分、技术栈、部署拓扑 | `architecture.md` |
| Database | `database` | 表结构、字段语义、索引、外键关系 | `database.md` |
| API | `api` | 接口契约、请求/响应示例、错误码 | `api.md` |
| Business Flow | `business-flow` | 核心业务流程、状态机、决策树 | `business-flow.md` |
| Deployment | `deployment` | 环境配置、CI/CD、容器编排 | `deployment.md` |
| Security | `security` | 认证授权、敏感数据、安全策略 | `security.md` |
| History | `history` | 重大变更记录、废弃功能、迁移指南 | `history.md` |

**SHOULD** 每类知识不超过 4KB，超出时拆分子文档。

**MAY** 根据项目特点扩展新类别，需在 `knowledge.yaml` 中声明。

#### ✅ Correct

```
docs/ai-knowledge/
├── architecture.md      # 3.1KB
├── database.md          # 2.9KB
├── api.md               # 3.5KB
├── business-flow.md     # 2.2KB
├── deployment.md        # 1.8KB
├── security.md          # 1.5KB
└── history.md           # 2.0KB
```

#### ❌ Wrong

```
docs/ai-knowledge/
├── everything.md        # 50KB，无法针对性加载
└── notes/               # 散乱笔记，无结构
```

---

### R03 — Knowledge 提取流程

**MUST** 区分老项目和新项目的提取策略。

**老项目**（已有代码库）：

```
AI 扫描代码 → 生成初稿 → 人工确认 → 入库
```

**新项目**（从零开始）：

```
同步编写 → 随代码演进更新
```

**SHOULD** 老项目提取完成后再进行 Skill 开发，确保 AI 具备领域知识。

**MAY** 使用自动化脚本辅助扫描，但最终必须人工确认。

#### ✅ Correct

```bash
# 老项目提取流程
$ ai-scan --source ./src --output drafts/
$ ls drafts/
architecture.md
database.md
api.md

# 人工审查后确认
$ ai-confirm --file drafts/architecture.md --approve
```

#### ❌ Wrong

```bash
# 跳过知识提取，直接让 AI 写代码
$ ai-generate --prompt "添加新功能"
# 结果：AI 不了解现有架构，产生冲突代码
```

---

### R04 — Knowledge 质量标准

**MUST** 每个 Knowledge 文档满足以下标准：

| 维度 | 要求 |
|------|------|
| 大小 | ≤ 4KB |
| 结构 | 清晰的标题层级（H2/H3） |
| 示例 | 关键场景提供代码示例 |
| 同步 | 与源码保持一致 |
| 时效 | 标注最后更新时间 |

**SHOULD** 使用模板化结构，便于 AI 解析。

**MAY** 包含指向源码的链接，增强可信度。

#### ✅ Correct

```markdown
# Database Schema

## Tables

### users (InnoDB)

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | BIGINT | NO | 主键，雪花 ID |
| email | VARCHAR(255) | NO | 唯一邮箱 |
| created_at | TIMESTAMP | NO | 创建时间 |

**Usage Example:**
```sql
SELECT * FROM users WHERE email = ?;
```

> Last updated: 2024-01-15 | Source: src/models/user.go
```

#### ❌ Wrong

```markdown
# users table
id, email, created_at, ...  # 不完整
# 缺少类型、约束、示例
```

---

### R05 — Knowledge 目录结构

**MUST** 遵循以下目录结构：

```
<project>/
├── docs/
│   └── ai-knowledge/
│       ├── architecture.md
│       ├── database.md
│       ├── api.md
│       ├── business-flow.md
│       ├── deployment.md
│       ├── security.md
│       └── history.md
└── .standards/
    └── knowledge.yaml    # 知识包元数据
```

**SHOULD** `knowledge.yaml` 与目录结构一一对应。

**MAY** 大型项目可按子系统分目录，如 `docs/ai-knowledge/payment/`。

#### ✅ Correct

```yaml
# .standards/knowledge.yaml
version: 1.0
packs:
  - id: architecture
    file: docs/ai-knowledge/architecture.md
    keywords: ["架构", "设计", "模块"]
    depends_on: []

  - id: database
    file: docs/ai-knowledge/database.md
    keywords: ["数据库", "SQL", "表"]
    depends_on: [architecture]
```

#### ❌ Wrong

```yaml
# knowledge.yaml 与实际文件不匹配
packs:
  - id: api
    file: docs/api.md  # 实际不存在
```

---

### R06 — Knowledge 加载策略

**MUST** 根据任务类型选择性加载 Knowledge Pack，禁止全量加载。

**SHOULD** 建立任务类型与 Knowledge Pack 的映射关系。

**MAY** 实现延迟加载机制，仅在需要时读取。

#### ✅ Correct

```python
# 任务类型 → Knowledge Pack 映射
TASK_KNOWLEDGE_MAP = {
    "add_feature": ["architecture", "api", "database"],
    "fix_bug": ["api", "business-flow"],
    "optimize_sql": ["database"],
    "deploy": ["deployment", "security"],
}

def load_knowledge(task_type: str):
    packs = TASK_KNOWLEDGE_MAP.get(task_type, [])
    return [read_pack(p) for p in packs]
```

#### ❌ Wrong

```python
# 全量加载导致上下文爆炸
def load_knowledge():
    all_packs = read_all_packs()  # 15KB × 7 = 105KB
    return all_packs
```

---

### R07 — 老项目 Knowledge Extraction

**MUST** SVN/遗留项目第一步执行 Knowledge 提取，而非直接开发 Skill。

**提取顺序**：

1. 扫描代码仓库
2. 生成 `architecture.md`（系统整体结构）
3. 生成 `database.md`（表结构与关系）
4. 生成 `api.md`（接口契约）
5. 人工确认并修正
6. 入库并建立基线

**SHOULD** 提取过程中标记不确定项，供人工重点审查。

**MAY** 使用 AI 辅助识别隐式依赖和业务逻辑。

#### ✅ Correct

```bash
# Step 1: 扫描代码
$ ai-extract --repo ./legacy-svn --type svn

# Step 2: 生成草稿
Generated:
  - drafts/architecture.md (3.2KB)
  - drafts/database.md (2.8KB)
  - drafts/api.md (3.5KB)

# Step 3: 人工确认
$ vim drafts/architecture.md
# 修正 AI 误解的业务逻辑

# Step 4: 入库
$ mv drafts/* docs/ai-knowledge/
$ git add docs/ai-knowledge/
$ git commit -m "feat: add initial knowledge base"
```

#### ❌ Wrong

```bash
# 跳过知识提取，直接让 AI 改代码
$ svn update
$ ai-commit --message "修复 bug"
# 结果：AI 不了解旧架构，引入新问题
```

---

### R08 — Knowledge 维护与同步

**MUST** 源码变更时同步更新相关 Knowledge 文档。

**SHOULD** 建立以下维护机制：

| 机制 | 频率 | 负责人 |
|------|------|--------|
| 实时同步 | 代码提交时 | 开发者 |
| 定期校验 | 每周 | AI / 自动化 |
| 版本追踪 | 每次更新 | Git |

**MAY** 使用 Git Hook 自动检测 Knowledge 与源码不一致。

#### ✅ Correct

```bash
# 修改数据库表后同步更新
$ ALTER TABLE users ADD COLUMN phone VARCHAR(20);

# 立即更新 Knowledge
$ vim docs/ai-knowledge/database.md
# 添加 phone 字段说明

# 提交时附带更新
$ git add docs/ai-knowledge/database.md
$ git commit -m "chore: sync database knowledge after adding phone column"
```

#### ❌ Wrong

```bash
# 修改了代码但忘记更新 Knowledge
$ ALTER TABLE users ADD COLUMN phone VARCHAR(20);
$ git commit -am "add phone field"
# 结果：Knowledge 与源码不一致，AI 基于过时信息工作
```

---

## Checklist

### 创建 Knowledge Pack

- [ ] 确定知识类别（architecture/database/api/business-flow/deployment/security/history）
- [ ] 创建对应 Markdown 文件于 `docs/ai-knowledge/`
- [ ] 编写内容，确保 ≤ 4KB
- [ ] 添加代码示例和源码链接
- [ ] 更新 `.standards/knowledge.yaml`
- [ ] 人工审查并确认

### 老项目 Knowledge 提取

- [ ] 执行代码扫描，生成初稿
- [ ] 审查 `architecture.md` 是否准确反映系统结构
- [ ] 审查 `database.md` 是否完整覆盖表结构
- [ ] 审查 `api.md` 是否包含关键接口
- [ ] 标记不确定项并人工确认
- [ ] 建立 Git 基线

### 日常维护

- [ ] 代码变更后检查是否需要更新 Knowledge
- [ ] 提交时附带 Knowledge 更新（如有）
- [ ] 每周运行校验脚本检查一致性
- [ ] 定期清理过期或冗余内容

### 加载策略验证

- [ ] 确认任务类型映射合理
- [ ] 测试不同任务下加载的 Knowledge 是否精准
- [ ] 监控上下文大小，避免超过限制
