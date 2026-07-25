# Workspace - Current Tasks

> 当前进行中的 AI 任务产物。
>
> 每个任务一个子目录：`{date}_{type}-{feature}/`

---

## 任务产物

每个任务目录可包含：

| 文件 | 用途 | 来源 Skill |
|------|------|-----------|
| `plan.md` | 实现计划 | superpowers / executing-plans |
| `spec.md` | 规格文档 | openspec |
| `tasks.md` | 任务清单 | openspec |
| `checklist.md` | 验证清单 | openspec |
| `debug-log.md` | 调试记录 | systematic-debugging |
| `validation.md` | 验证结果 | test-driven-development |

---

## task_id 命名规则

```
{date}_{type}-{feature}

type: feat | fix | refactor | docs | test | chore

示例：
  20260724_feat-token-optimization
  20260725_fix-svn-encoding
```

---

## 生命周期

```
current/{task_id}/  →  完成后  →  history/{task_id}/
```

完成后将整个任务目录移动至 `../history/`，保持 `current/` 精简。
