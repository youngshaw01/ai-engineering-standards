# 既有项目示例

已有 `AGENTS.md` 时，默认 `init` 会跳过冲突文件（退出码 2）：

```bash
node src/init.mjs --project . --dry-run
```

查看 JSON 输出中的 `CONFLICT_EXISTS`，按 [contract/adoption-contract.md](../contract/adoption-contract.md) 人工决策后，再考虑 `--force`（仅覆盖模板列出的文件）。

若存在 v1 `.harness/project.yaml`，`validate` 会附带 `LEGACY_V1_PRESENT` 信息，**不**自动迁移。
