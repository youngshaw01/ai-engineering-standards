# AI Workflow

> AI-assisted development workflow: prompt-chaining, context management, and human-in-the-loop practices.

---

## Overview

AI 辅助开发工作流规范，适用于 Cursor、Trae、Claude Code 等所有 AI 开发工具。

---

## Rules

### R01 — 任务分解

**MUST** — 复杂任务必须分解为小步骤：

1. 每步 ≤300 行代码修改
2. 每步 ≤5 个文件
3. 每步完成后自检
4. 超过预算必须确认

---

### R02 — 上下文管理

**SHOULD** — 主动管理 AI 上下文窗口：

- 优先提供关键文件内容
- 使用 `@file` 引用而非复制粘贴
- 长对话后总结关键决策
- 避免上下文窗口溢出

---

### R03 — 人机协作模式

**MUST** — 以下场景必须人工确认：

- 架构变更
- 数据库 Schema 修改
- API 接口变更
- 安全相关修改
- 生产环境配置

---

### R04 — AI 输出验证

**MUST** — AI 生成的代码必须验证：

- 编译通过
- 测试通过
- 逻辑正确
- 无安全漏洞
- 符合项目规范

不得盲目信任 AI 输出。

---

### R05 — 渐进式开发

**SHOULD** — 采用渐进式开发流程：

```
需求理解 → 方案设计 → 确认 → 实现骨架 → 确认 → 填充细节 → 确认 → 自检 → 完成
```

避免一次性生成大量代码。

---

### R06 — AI Skill 产物归属

**MUST** — 所有 AI skill（superpowers、executing-plans、openspec、systematic-debugging、TDD 等）产出的文件归入：

```
.harness/workspace/current/{task_id}/
```

**禁止放入**：

- `docs/`（人类正式文档目录）
- 项目根目录
- `.cursor/rules/` / `.trae/rules/`（工具适配层，不存储内容）

### task_id 命名规则

```
{date}_{type}-{feature}

type: feat | fix | refactor | docs | test | chore

示例：
  20260724_feat-token-optimization
  20260725_fix-svn-encoding
```

### 单任务产物结构

```
.harness/workspace/current/{task_id}/
├── plan.md                ← 实现计划
├── spec.md                ← 规格文档
├── tasks.md               ← 任务清单
├── checklist.md           ← 验证清单
├── debug-log.md           ← 调试记录
└── validation.md          ← 验证结果
```

### 生命周期

```
current/{task_id}/  →  完成后  →  history/{task_id}/
```

详见 [Harness-Bootstrap.md](Harness-Bootstrap.md)。

---

### R07 — .harness 接入前置

**MUST** — 项目接入 `ai-engineering-standards` 前，必须建立 `.harness/` 目录（至少 Bootstrap 成熟度）。

AI 检测到项目无 `.harness/` 时，应：

1. 暂停任务执行
2. 提示用户："本项目未建立 .harness，无法接入 ai-engineering-standards"
3. 引导用户从 `templates/harness/bootstrap/` 初始化
4. 完成初始化后继续任务

详见 [Harness-Bootstrap.md](Harness-Bootstrap.md)。

---

## Checklist

- [ ] 复杂任务已分解为小步骤
- [ ] 每步修改量在预算内
- [ ] 关键决策点已人工确认
- [ ] AI 输出已验证
- [ ] 上下文窗口有效利用
- [ ] AI skill 产物已归入 `.harness/workspace/{task_id}/`
- [ ] 项目已建立 `.harness/`（至少 Bootstrap 成熟度）
