# Workflow Audit Archive

AI 工作流审计报告归档目录（可选）。

## 用途

存放 [Better Harness](https://github.com/QoderAI/better-harness) 或手工五维自检的产出，便于季度对比与复盘。

## 推荐结构

```
workspace/history/{date}_audit-workflow/
├── report.md              # 报告摘要或全文
├── findings.json          # 结构化发现（若有）
└── remediation-plan.md    # 整改计划
```

## 规范

详见 `ai-engineering-standards/11-AI-DevTools/Better-Harness.md` 与 `governance/workflow-audit.yaml`。
