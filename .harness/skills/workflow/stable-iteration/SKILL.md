---
name: stable-iteration
description: >-
  Guides AI-assisted refactoring and feature changes through a 7-step SOP
  (diagnose, dependencies, small steps, TDD gate, adversarial review, canary,
  rollback). Use when refactoring, AI-assisted code changes, technical debt
  cleanup, or when the user asks for stable iteration / 稳定迭代 / 防翻车流程.
disable-model-invocation: true
---

# Stable Iteration（稳定迭代 7 步 SOP）

> **定位**：workflow Skill，提供 AI 辅助改动的执行方法论。
> **约束**：本 Skill 不覆盖项目 Rule；与 `11-AI-DevTools/AI-Workflow.md` 及 `.harness/governance/gates.yaml` 对齐。

## 何时使用

| 场景 | 建议 |
|------|------|
| AI 重构、技术债清理、核心链路改动 | 完整 7 步 |
| 单文件 1–2 个函数小改 | 精简版（至少 Step 4 + PR 门禁） |
| typo、注释、纯文档 | 不使用本 Skill |

**触发方式**：用户显式要求，或任务涉及 `refactor` / `feat` 且触及核心模块。

## 前置条件

1. 读取 `.harness/AGENTS.md` 与项目 `rules/`
2. 创建任务目录：`.harness/workspace/current/{task_id}/`
3. 每步产出写入该目录（模板见 [references/artifacts.md](references/artifacts.md)）
4. 修改预算：每步 ≤5 文件、≤300 行；超出须人工确认

## 流程总览

```
Step 1 静态分析 → Step 2 依赖梳理 → Step 3 小步重构 ⇄ Step 4 TDD 守门
    → Step 5 对抗性 Review → Step 6 灰度发布 → Step 7 回滚预案
```

Step 3 与 Step 4 循环，直到单测全部通过，再进入 Step 5。

---

## Step 1 — 静态分析（先诊断，再施工）

**目标**：产出问题清单，不是修改建议。

**做法**：

1. 优先用项目已有工具（ESLint、SonarQube、Checkstyle 等）
2. AI 补充语义层问题：函数职责、命名意图、吞异常、重复逻辑
3. 按 P0/P1/P2 排序，P0 ≤ 5 个

**产出**：`workspace/current/{task_id}/01-diagnosis.md`

**禁止**：此步直接改代码。

Prompt 模板见 [references/prompts.md](references/prompts.md#step-1)。

---

## Step 2 — 依赖梳理（标安全区与保护区）

**目标**：明确可改范围，避免隐式依赖翻车。

**必须梳理**：

- 直接 / 间接 import（至少两层）
- 环境变量、配置文件、数据库表
- 副作用：缓存、日志、MQ、全局状态
- 被其他团队或模块引用的共享代码 → **保护区**

**产出**：`workspace/current/{task_id}/02-dependencies.md`（含安全区 / 保护区）

**禁止**：未标记保护区前进入 Step 3。

Prompt 模板见 [references/prompts.md](references/prompts.md#step-2)。

---

## Step 3 — 小步重构（单函数粒度）

**原则**：

- 一次只改一个函数；改完验证后再下一个
- **先出重构计划，人工确认后再生成代码**
- 保持 public API、错误处理、可观察行为不变（日志、异常类型、HTTP 状态码）
- 不擅自更换内部数据结构（如 `Array` → `Map`），除非测试已覆盖

**产出**：单文件 diff + `workspace/current/{task_id}/03-refactor-plan.md`

与 Step 4 未通过时，回到本步，不跳步。

Prompt 模板见 [references/prompts.md](references/prompts.md#step-3)。

---

## Step 4 — TDD 守门（最关键，不可省略）

**原则**：

- **先写测试，再让 AI 改实现**
- 测试不通过：将错误信息反馈给 AI，循环 Step 3/4
- 覆盖率低时：只补本次改动范围的测试，不追求一次全覆盖

**产出**：

- 测试文件（项目约定目录）
- `workspace/current/{task_id}/04-test-report.md`（用例列表 + 通过证据）

**禁止**：无测试保护即合入核心逻辑。

Prompt 模板见 [references/prompts.md](references/prompts.md#step-4)。

---

## Step 5 — 对抗性 Code Review

**做法**：用新鲜上下文，扮演「第一次看这个项目的新人」审查 diff。

**审查维度**：可读性、正确性、一致性、安全性、性能（循环内查库、不必要序列化等）。

**产出**：`workspace/current/{task_id}/05-review.md`（逐项关闭或接受）

Prompt 模板见 [references/prompts.md](references/prompts.md#step-5)。

---

## Step 6 — 灰度发布（Feature Flag）

**原则**：

- 新逻辑走独立路径，默认关闭
- 小团队可用 `env var + if/else`，不必上重型 Flag 平台
- 节奏：内网 → 5% 流量 24h → 50% → 全量

**产出**：`workspace/current/{task_id}/06-rollout.md`（开关名、默认值、观察指标）

---

## Step 7 — 回滚预案（开工前即准备）

**两层保险**：

1. **快速止血**：关闭 Feature Flag，旧逻辑立即生效
2. **彻底回滚**：`git tag` 恢复文件 + 重新部署

**开工前执行**：

```bash
git tag -a "before-{task_id}" -m "checkpoint before stable-iteration {task_id}"
```

**产出**：`workspace/current/{task_id}/07-rollback.md`（含一键回滚命令，写入 PR 描述）

---

## 完成检查清单

任务结束前，确认 `workspace/current/{task_id}/checklist.md` 全部勾选：

```
- [ ] 01-diagnosis.md 已产出，P0 已处理或已登记例外
- [ ] 02-dependencies.md 已标保护区
- [ ] 目标函数有测试保护（04-test-report.md）
- [ ] 05-review.md 问题已逐项关闭
- [ ] 06-rollout.md 灰度方案已就绪（或已说明为何跳过）
- [ ] 07-rollback.md 回滚命令已写入 PR
- [ ] 本地/CI：编译、lint、测试通过
- [ ] 符合 governance/gates.yaml 合并门禁
```

完成后归档至 `workspace/history/{task_id}/`。

---

## 精简版（小改动）

至少保留：

1. Step 4 — 先测后改
2. PR + CI 门禁（lint / test / review）
3. Step 7 — 回滚命令写入 PR

---

## 与 Harness 体系的关系

| 层级 | 对应 |
|------|------|
| Rule | `AI-Workflow.md` R01–R05、项目 `rules/` |
| 门禁 | `governance/gates.yaml`、`Project-Lifecycle-Governance.md` |
| 证据 | `workspace/current/{task_id}/` 各步产出 |
| 审计 | [Better-Harness.md](../../11-AI-DevTools/Better-Harness.md) 五维模型；`governance/workflow-audit.yaml` 手工自检 |

---

## 附加资源

- Prompt 模板：[references/prompts.md](references/prompts.md)
- 产出物模板：[references/artifacts.md](references/artifacts.md)
