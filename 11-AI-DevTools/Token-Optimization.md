# Token Optimization

> AI 编程 Token 消耗优化规范——核心理念：**优化 Token 消耗 ≠ 降低代码质量**。
>
> 大部分 Token 浪费来自**上下文管理不当**，而不是模型本身。

---

## Overview

### 为什么需要优化

真实案例（某项目 7 月 7 日 - 8 月 7 日消耗）：

- **Cursor Models**：27.5 亿 Token（已使用 97%）
  - `cursor-grok-4.5-high-fast`：15 亿（59.1%）
  - `composer-2.5-fast`：8.8 亿（30.0%）
- **Other Models**：6 亿 Token（100%）
  - `Claude Opus Thinking`：3.9 亿（77.6%）

### 消耗特征诊断

上述数据反映典型高消耗模式：

1. 大量使用 Composer / Agent（而非普通 Chat）
2. 大量长上下文对话
3. Thinking 模型占比过高
4. 持续开发而非单次问答

### Token 增长曲线

```
第 1 次修改 LoginService       → 3,000 tokens
第 2 次继续修改（带历史上下文）   → 20,000 tokens
第 3 次继续                    → 50,000 tokens
```

**真正消耗 Token 的不是回答，而是重复发送上下文。**

### 预期收益

执行本规范可降低 **30%~60%** Token 消耗，同时让 AI 回答更聚焦、更稳定。

---

## Rules

### R01 — 上下文隔离 ⭐⭐⭐⭐⭐

**MUST** — 每个功能模块独立使用 Composer / Chat，避免单一会话承载长期开发。

❌ 错误：在一个 Composer 中开发整个系统一个月。

✅ 正确：按功能模块切分会话：

```
Epic（如：AI 外呼平台）
├── Chat1 — Scheduler
├── Chat2 — DialWorker
├── Chat3 — Recording
├── Chat4 — Kafka
├── Chat5 — API
├── Chat6 — UI
└── Chat7 — Test
```

每个 Chat 只处理一个主题，完成后关闭并新建。

**预期效果：Token 减少 30%~50%**

---

### R02 — 精准上下文引用 ⭐⭐⭐⭐⭐

**MUST** — 使用显式文件 / 目录引用，禁止全工程扫描作为默认行为。

❌ 错误：

```
@Codebase
帮我改一下
```

工具会扫描整个工程（4000 文件时 Token 暴涨）。

✅ 正确：

```
@DialService.java
@CallWorker.java
修改这里
```

**预期效果：大型项目效果非常明显**

---

### R03 — 模型分级使用 ⭐⭐⭐⭐

**MUST** — 根据任务复杂度选择模型，禁止默认使用 Thinking 模型。

| 场景 | 推荐模型 | 原因 |
|------|---------|------|
| 架构设计、复杂重构、Bug 分析 | Claude Thinking / Opus | 需要强推理 |
| 日常开发、简单修改、生成样板代码 | GPT / Grok Fast / Composer Fast | Token 消耗低 |

Thinking 模型 Token 消耗非常大，仅在真正需要复杂推理时使用。

---

### R04 — 规则固化 ⭐⭐⭐⭐

**MUST** — 长期规范写入 Project Rules，禁止每次 Prompt 重复描述。

❌ 错误：每次对话都说：

```
使用 DDD
不要修改接口
SpringBoot 3
Java 21
使用 MapStruct
日志规范...
```

每次都占用大量 Token。

✅ 正确：写入：

- `.cursor/rules/`
- `.trae/rules/`
- `CLAUDE.md`
- `.harness/project/rules/`

模型自动加载，无需重复理解。

---

### R05 — 任务原子化 ⭐⭐⭐

**SHOULD** — 一次只做一件事，禁止单次 Prompt 包含多任务。

❌ 错误：

```
帮我：
1 改数据库
2 改接口
3 改前端
4 写测试
5 更新文档
```

这是一个巨大 Context。

✅ 正确：

```
Step1 → 改 Repository → 完成
Step2 → 改 Service    → 完成
Step3 → 改 API        → 完成
```

总体 Token 反而更少。

---

### R06 — 大类拆分 ⭐⭐⭐

**SHOULD** — 超长文件（>1000 行）应拆分为多个职责单一的小文件。

❌ 反例：`DialService.java` 3500 行，每次修改 10 行，工具仍发送整个文件（3500 行）。

✅ 正确：

```
DialService
   ↓
DialManager
DialScheduler
DialExecutor
DialResultHandler
```

Token 显著下降，长期收益明显。

---

### R07 — 先规划后执行 ⭐⭐⭐

**SHOULD** — 大任务先让 AI 输出修改计划，再分步执行。

❌ 错误：直接修改 100 个文件。

✅ 正确：

```
第一步：只输出修改计划
第二步：开始修改（分多轮）
```

规划一次，修改多次。比"规划+修改"循环的 Token 少很多。

---

### R08 — 读取范围限制 ⭐⭐⭐

**SHOULD** — 搜索 / 分析时明确限定范围，禁止全工程扫描。

❌ 错误：搜索整个工程。

✅ 正确：

```
只搜索：
  dial/
  worker/

甚至：
  只分析 DialScheduler.java
```

---

### R09 — 长对话重启 ⭐⭐⭐

**MUST** — 长对话累积上下文过多时，必须总结后新建会话。

❌ 错误：

```
继续
继续
继续
继续
```

每次都会带整个历史。

✅ 正确：

```
1. 总结当前进度：
   已完成：xxx
   待完成：xxx

2. New Chat

3. 继续开发
```

上下文重新开始。

---

### R10 — Prompt 精简 ⭐⭐

**SHOULD** — Prompt 直入主题，去除角色扮演套话。

❌ 错误：

```
请你作为全球最优秀的软件架构师……
```

对 AI 编程工具几乎没有收益。

✅ 正确：

```
修改：DialService
目标：支持多线路。
要求：保持接口兼容。
```

---

## Implementation

### 任务驱动 + 短上下文模式

适用于：微服务、平台级开发、长期项目。

```
Epic（业务目标）
  ├── Chat1 — 模块 A
  ├── Chat2 — 模块 B
  ├── Chat3 — 模块 C
  └── ChatN — 模块 N
```

### 跨模块任务

让 AI 先生成一份简短的计划，再在新的 Chat 中逐步实施。

### 会话生命周期

```
新建会话 → 执行单一任务 → 完成 → 总结 → 关闭 → 新建下一个
```

---

## Expected ROI

| 优先级 | 优化项 | 预期效果 |
|--------|--------|----------|
| ⭐⭐⭐⭐⭐ | 每个功能新建 Composer/Chat，避免长期上下文（R01） | Token 减少 30%~50% |
| ⭐⭐⭐⭐⭐ | 精准 `@file` 替代 `@Codebase`（R02） | 大型项目效果非常明显 |
| ⭐⭐⭐⭐☆ | 复杂推理才用 Thinking，日常用 Fast 模型（R03） | 显著降低高成本模型消耗 |
| ⭐⭐⭐⭐☆ | 长期规范写入 Rules（R04） | 减少重复上下文 |
| ⭐⭐⭐☆☆ | 超大类拆分（R06） | 长期收益明显 |
| ⭐⭐⭐☆☆ | 大任务拆成小任务（R05/R07） | 减少上下文累积，便于 Review |

**综合预期：降低 30%~60% Token 消耗，基本不影响代码质量。**

---

## Checklist

- [ ] 每个功能模块使用独立 Composer / Chat，完成后关闭
- [ ] 使用 `@file` / `@directory` 引用，而非 `@Codebase`
- [ ] 日常开发使用 Fast 模型，仅复杂推理使用 Thinking
- [ ] 长期规范写入 Project Rules，不在 Prompt 中重复
- [ ] 单次 Prompt 只包含一个任务
- [ ] 超长文件（>1000 行）已拆分或计划拆分
- [ ] 大任务先规划后执行
- [ ] 搜索 / 分析限定目录范围
- [ ] 长对话总结后新建会话
- [ ] Prompt 直入主题，无角色扮演套话
