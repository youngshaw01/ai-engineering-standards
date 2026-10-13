# Adoption Contract v2

> 上位：[harness-contract.md](harness-contract.md)

## 1. 命令

```bash
node src/adopt.mjs --project <repo-root> [--dry-run] [--force] [--acknowledge-legacy]
```

与 `init` 使用同一模板列表；**语义**为「已有仓库首次接入」。

## 2. 冲突（默认）

| 已存在 | 行为 |
| --- | --- |
| `AGENTS.md` | `CONFLICT_EXISTS`，跳过 |
| `.harness/project.yaml` | 跳过 |
| `.harness/README.md` | 跳过 |
| `.harness/workspace/` | 不存在则创建；存在则不删改内容 |

`--dry-run`：只输出 JSON 计划，不写盘。

## 3. v1 残留（信息 / 阻断）

| 信号 | 代码 | 默认 |
| --- | --- | --- |
| `.harness/harness.yaml` | `LEGACY_V1_HARNESS_YAML` | adopt 退出码 **3**，除非 `--acknowledge-legacy` |
| `project.yaml` 含 `apiVersion: harness.blueprint/v1` | `LEGACY_V1_BLUEPRINT` | 同上 |
| `project.json`（v2 过渡格式） | `LEGACY_V2_JSON` | 警告，不阻断 |

**不得**自动删除或合并 v1 树。

## 4. SVN

- 存在 `.svn/` 时，`init`/`adopt` 默认 `vcs: svn`（可用 `--vcs git` 覆盖）。  
- 存在 `.git/` 时，默认 `vcs: git`。  
- 两者并存：退出码 **4**，要求 `--vcs` 显式指定。

## 5. 验收

- [ ] `adopt --dry-run` 可审阅  
- [ ] 重复 adopt 幂等（冲突退出 2）  
- [ ] 未移动 `src/`、`java/` 等业务目录  

## 6. 职责边界（adopt 与 validate）

adopt 负责**现状发现**：只检测会阻塞接入的 v1 配置信号（§3 表），**不**检查 `FORBIDDEN_LEGACY_PATHS`（`.harness/rules`、`.harness/skills`、`.harness/knowledge`、`.harness/wiki`、`.standards`）。

禁止路径属于**合规判定**，由 `validate` 负责：存在即 `forbidden path` 失败。

原因：禁止路径不阻塞文件生成（生成物仅 `AGENTS.md` / `project.yaml` / `README.md` / `workspace/`），接入阶段允许其存在，由人工决定迁移或清理；`validate` 阶段强制判定合规。二者退出策略不同，属有意设计，由测试 `tests/forbidden-paths.test.mjs` 锁定。
