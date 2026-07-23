# Cursor Rules

> 公共约束见 [Common-Rules.md](Common-Rules.md)（AI Engineering Rules Core Edition v2.0，L0-L5 全量）。
> 本文档仅包含 Cursor 特有的配置与约定。

---

## Cursor Rules 机制

Cursor 通过 `.cursor/rules/` 目录加载项目规则，支持三种规则类型：

| 类型 | 文件名模式 | 触发时机 | 适用场景 |
|------|-----------|---------|---------|
| **Always** | `*.md`（默认） | 每次对话自动加载 | 安全规则、编码规范 |
| **Auto** | `*.mdc` + ` globs` | 匹配文件模式时加载 | 框架特定规则（如 `*.java.mdc`） |
| **Manual** | `*.md` + `@` 引用 | 用户 `@rules` 手动引用 | 低频规则、架构决策 |

---

## 项目级 Rules 文件结构

```
your-project/
├── .cursor/
│   └── rules/
│       ├── 00-safety.md        ← Always — 安全护栏（从 Common-Rules.md L0 提取）
│       ├── 01-java.md          ← Always — Java 编码规范
│       ├── 02-api.md           ← Always — API 设计规范
│       └── 03-testing.md       ← Always — 测试规范
```

---

## 生成方式

根据项目 `.standards/profile.yaml` 中的 `rules.include`，从 ai-engineering-standards 对应章节提取适用规则，生成精简版 `.cursor/rules/` 文件。

**原则：**

- 只加载当前项目适用的规则（避免上下文浪费）
- 每个文件 ≤ 12KB（Cursor 单文件加载上限参考）
- 安全规则始终在最前面（`00-safety.md`）
- 排除 `rules.exclude` 中声明的架构规则

---

## Cursor 特有约定

### 1. `.cursorignore`

类似 `.gitignore`，排除 Cursor 索引的文件：

```
target/
node_modules/
*.class
*.jar
```

### 2. Composer 模式

Cursor Composer 支持 Agent 模式，配置建议：

- **Mode**: Agent（自动执行，但受 L0 安全规则约束）
- **Max Steps**: 25（防止无限循环）
- **Auto-apply**: 仅对安全规则允许的操作自动执行

### 3. Context 优先级

```
.cursor/rules/       ← 最高（项目级规则）
docs/AI_AGENT_RULES.md  ← 次高（项目 AI 约束）
.standards/profile.yaml ← 配置（声明技术栈）
```

---

## 与 Common-Rules.md 的关系

| 文档 | 内容 | 作用 |
|------|------|------|
| [Common-Rules.md](Common-Rules.md) | L0-L5 全量公共约束 | 所有 AI 工具共享的底线 |
| 本文档 | Cursor 机制 + 特有约定 | Cursor 项目配置指南 |
| `.cursor/rules/` | 项目级精简规则 | Cursor 运行时加载的规则 |
