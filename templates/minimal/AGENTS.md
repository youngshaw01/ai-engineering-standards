# AGENTS.md

> v2 Clean-room 入口。契约：`ai-engineering-standards` → `contract/harness-contract.md`

## Project

- 机器配置：`.harness/project.json`
- 过程产物：`.harness/workspace/`

## Rules

- 业务事实以代码与测试为准；勿将本文件当作需求文档。
- 工具规则扩展前须先修订 Layer 0 契约，禁止在项目内复制完整标准树。

## Workflow

1. 明确目标与验收标准  
2. 最小改动实现  
3. 运行项目自有构建/测试；未执行的检查不得声称通过
