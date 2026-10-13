# Adoption Contract（既有项目接入）

> 适用于 **已存在代码与目录** 的仓库首次运行 v2 工具链。  
> 上位：[harness-contract.md](harness-contract.md)

## 1. 目标

- 识别与 v2 生成物 **冲突** 的路径（已存在 `.harness/`、根 `AGENTS.md` 等）。  
- 输出 **gap / conflict 报告**；由人决策后再执行 `init --force` 或手工合并。  
- **禁止** 自动搬迁 `src/`、`java/`、业务配置或 v1 `.harness` 内容。

## 2. 接入流程

```
validate --project <repo>     # 可选：先看重冲突
init --project <repo>         # 默认：仅创建缺失的契约文件
init --project <repo> --dry-run
```

### 冲突策略（默认）

| 已存在路径 | 默认行为 |
| --- | --- |
| `.harness/project.json` | **跳过**，报告 `CONFLICT_EXISTS` |
| `.harness/README.md` | 跳过 |
| `AGENTS.md` | 跳过 |
| `.harness/workspace/` | 若缺失则创建；已存在则不删改内容 |

`--force`：仅覆盖 **契约明确列出的模板文件**，仍不得删除目录或覆盖未在模板列表中的文件。

## 3. 与 v1 并存期

- 若项目仍含 v1 `harness.yaml` / 旧 `.harness` 树：**不自动删除**。  
- `validate` 报告 `LEGACY_V1_PRESENT`（信息级），不视为 v2 通过。  
- 迁移 v1 → v2 为 **独立人工项目**，不在 `init` 自动化范围内。

## 4. 接入验收

- [ ] `init --dry-run` 输出与预期一致  
- [ ] 重复 `init` 无新增文件  
- [ ] `validate --project` 通过或仅含已接受的 LEGACY 信息  
- [ ] 业务构建与测试未因 Harness 接入而被动修改  
