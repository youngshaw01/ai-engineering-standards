# Workspace - Current Tasks

> 当前进行中的 AI 任务产物。
>
> 每个任务一个子目录：`{date}_{type}-{feature}/`

---

## 任务产物

| 文件 | 用途 |
|------|------|
| `plan.md` | 实现计划 |
| `spec.md` | 规格文档 |
| `tasks.md` | 任务清单 |
| `checklist.md` | 验证清单 |
| `debug-log.md` | 调试记录 |
| `validation.md` | 验证结果 |

---

## task_id 命名规则

```
{date}_{type}-{feature}

type: feat | fix | refactor | docs | test | chore

示例：
  20260831_feat-harness-init
  20260831_docs-how-to-use-update
```

---

## 生命周期

```
current/{task_id}/  →  完成后  →  history/{task_id}/
```
