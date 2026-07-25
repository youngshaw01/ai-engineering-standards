# Workspace - History

> 已完成任务的归档目录。
>
> 任务完成后从 `../current/{task_id}/` 移动至此，用于追溯。

---

## 归档原则

1. **完整归档**——任务目录整体移动，不拆分文件
2. **只读追溯**——归档后不修改，仅供查询历史决策
3. **task_id 唯一**——一个 task_id 只能出现一次

---

## 查询场景

- "这个功能当时是怎么设计的？" → 查 `history/{task_id}/plan.md`
- "这个 Bug 当时是怎么修的？" → 查 `history/{task_id}/debug-log.md`
- "这次重构的验证清单？" → 查 `history/{task_id}/checklist.md`
