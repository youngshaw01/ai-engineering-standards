# Stable Iteration — 产出物模板

任务目录：`.harness/workspace/current/{task_id}/`

---

## 01-diagnosis.md

```markdown
# 静态分析报告 — {task_id}

## 扫描范围
- 目录/文件：{paths}
- 工具：{eslint|sonar|manual}

## Top 问题（P0 ≤ 5）
| 优先级 | 位置 | 问题 | 修改方向 |
|--------|------|------|----------|
| P0 | file:line | ... | ... |

## 本次纳入范围
- [ ] 问题 ID / 描述

## 暂不处理（及原因）
- ...
```

---

## 02-dependencies.md

```markdown
# 依赖梳理 — {task_id}

## 目标文件
{target_file}

## 依赖树
（树状或列表）

## 外部输入
- 环境变量：...
- 配置：...
- 数据表：...

## 副作用
- ...

## 分区
| 区域 | 文件/模块 | 说明 |
|------|-----------|------|
| 安全区 | ... | 可修改 |
| 保护区 | ... | 只读，不可改 |
```

---

## 03-refactor-plan.md

```markdown
# 重构计划 — {function_name}

## 现状
- 行数：...
- 职责过多点：...

## 拆分方案
| 新函数 | 职责 | 预估行数 |
|--------|------|----------|
| ... | ... | ... |

## 边界情况
- ...

## 人工确认
- [ ] 计划已确认，可生成代码
```

---

## 04-test-report.md

```markdown
# 测试报告 — {task_id}

## 测试文件
- {test_file_path}

## 用例清单
| 用例名 | 场景 | 状态 |
|--------|------|------|
| should_... | ... | pass/fail |

## 执行证据
- 命令：`{test_command}`
- 结果：{pass_count}/{total}
```

---

## 05-review.md

```markdown
# 对抗性 Review — {task_id}

| # | 严重性 | 位置 | 问题 | 处理 |
|---|--------|------|------|------|
| 1 | high | file:line | ... | fixed/accepted/wontfix |
```

---

## 06-rollout.md

```markdown
# 灰度方案 — {task_id}

## Feature Flag
- 名称：`FEATURE_{NAME}`
- 默认值：`false`
- 入口位置：{file:line}

## 灰度节奏
1. 内网 / staging：{date}
2. 5% 流量：{date}，观察 {metrics}
3. 50% → 全量：...

## 观察指标
- ...
```

---

## 07-rollback.md

```markdown
# 回滚预案 — {task_id}

## Git Tag
- `before-{task_id}`

## 快速止血（关 Flag）
\`\`\`bash
FEATURE_{NAME}=false ...
\`\`\`

## 彻底回滚
\`\`\`bash
git checkout before-{task_id} -- {paths}
\`\`\`

## PR 描述粘贴区
（将上述命令复制到 PR）
```

---

## checklist.md

```markdown
# 完成检查 — {task_id}

- [ ] Step 1–7 产出物齐全
- [ ] 测试通过
- [ ] CI 通过
- [ ] Review 问题已关闭
- [ ] 回滚命令已写入 PR
```
