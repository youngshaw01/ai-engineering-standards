# 新项目示例

在空仓库根目录：

```bash
node /path/to/ai-engineering-standards/src/init.mjs --project . --project-id demo-app --display-name "Demo App"
node /path/to/ai-engineering-standards/src/validate.mjs --project .
```

预期：生成 `AGENTS.md` 与 `.harness/project.json`，`validate` 退出码 0。
