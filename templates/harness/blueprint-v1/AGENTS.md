# AGENTS.md

> 复制到**项目仓库根目录**。完整 Harness 维护说明见 `.harness/AGENTS.md`（可选）。  
> Blueprint：`ai-engineering-standards` → `11-AI-DevTools/Harness-Blueprint-v1.md`

## Project

- **定位**：见根目录 `README.md`。
- **模块入口**：见 `.harness/index/` 或 `docs/project-overview.md`（按项目填写）。
- **机器配置**：`.harness/project.yaml`。

## Rules

- Layer 0：继承 `ai-engineering-standards`（Common-Rules、本仓库 Harness 文档）。
- Layer 1：`.harness/rules/detail/` 为工具规则 SSOT；例外见 `.harness/governance/exceptions.yaml`。
- 禁止在 `.cursor/rules` 等生成物上手写与 detail 冲突的红线。

## Workflow

1. 明确变更目标、范围与验收标准。  
2. 查索引与相关 rules/specs/代码。  
3. 最小完整实现；交付代码写入项目约定目录（如 `src/`、`java/`、`web/`）。  
4. 运行 `project.yaml` 中声明的检查（至少 L0）。  
5. 汇报：变更范围、验证命令与结果、未解决风险。

## Completion

- 区分**已执行验证**与推断；未运行的检查不得写「通过」。  
- 发现文档与代码不一致时，报告权威来源建议。

## References

- 项目 README：`README.md`  
- Blueprint v1：`11-AI-DevTools/Harness-Blueprint-v1.md`（标准库）  
- Bootstrap：`11-AI-DevTools/Harness-Bootstrap.md`  
- 门禁：以 `.harness/project.yaml` → `tooling.gates_fast` 为准  
