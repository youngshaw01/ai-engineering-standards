# 已有项目

```bash
node ../../src/adopt.mjs --project . --dry-run
node ../../src/adopt.mjs --project .
```

若存在 v1 `.harness/harness.yaml`，需 `--acknowledge-legacy` 后才继续（仍不会自动删除 v1 文件）。
