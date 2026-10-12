# Blueprint 升级

1. 阅读 `ai-engineering-standards` `CHANGELOG.md` 中 blueprint 相关条目。  
2. 对比 `templates/harness/blueprint-v1/` 与业务仓 `.harness/`（仅模板化文件：AGENTS 结构、project 字段、通用 gates 骨架）。  
3. **禁止自动覆盖**：`governance/exceptions.yaml`、`knowledge/`、`wiki/`、`specs/`、`rules/detail/` 正文。  
4. 生成 diff 报告，人工合并。  
5. 更新 `project.yaml` → `blueprint.version`。  
6. 重跑 L0；若项目声明 L1，再跑 full + smoke。
