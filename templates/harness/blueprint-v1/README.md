# Harness blueprint-v1 模板

> **Blueprint 契约**：[`11-AI-DevTools/Harness-Blueprint-v1.md`](../../11-AI-DevTools/Harness-Blueprint-v1.md)  
> **版本**：`1.0.0`

## 用途

- **新项目**：拷贝本目录骨架到业务仓库，重命名/填写 `project.yaml`，再按 `workflows/init.md` 验收。  
- **既有项目**：不要整目录覆盖；按 `workflows/adopt.md` 做 gap 映射后分批合并。

## 目录

| 路径 | 说明 |
| --- | --- |
| `AGENTS.md` | 根入口模板（复制到仓库根） |
| `project.yaml` | 复制到 `.harness/project.yaml` 并修改 |
| `governance/exceptions.yaml` | 例外登记骨架 |
| `rules/` | 规则目录说明 + `detail/` 占位 |
| `adapters/manifest.json` | 最小 manifest 示例 |
| `public/tooling/gates.yaml` | 最小 fast gate（需项目实现 sync/verify 脚本） |
| `workflows/` | init / adopt / upgrade |
| `schema/` | `project.schema.yaml` |

## 与 bootstrap / standard 的关系

| 档位 | 何时用 |
| --- | --- |
| `bootstrap` | 最小试点、无 governance |
| **blueprint-v1** | 明确 SSOT + project.yaml + gates 契约的新接入 |
| `standard` | 含 knowledge、context、harness.yaml 的完整标准档 |
| `enterprise` | 可选；仅成熟项目按需叠加 |
