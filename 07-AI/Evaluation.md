# AI Evaluation Standards

## Overview

本文档定义了项目中 AI 模型评估的工程规范，涵盖评估指标、数据集设计、A/B 测试、自动化评估流水线等核心实践。

---

## Rules

### R01 — 评估指标选择

根据任务类型选择合适的评估指标，确保指标与业务目标对齐。

- **MUST** 分类任务使用 Accuracy、Precision、Recall、F1 Score；生成任务使用 BLEU、ROUGE、BERTScore
- **SHOULD** 多维度指标组合使用，避免单一指标偏差（如同时报告 Precision 和 Recall）
- **MAY** 自定义业务指标（如回答相关性评分、事实一致性评分），需在报告中明确定义计算方式

✅ 示例：
```python
from sklearn.metrics import precision_score, recall_score, f1_score

y_true = [1, 0, 1, 1]
y_pred = [1, 0, 0, 1]

precision = precision_score(y_true, y_pred)
recall = recall_score(y_true, y_pred)
f1 = f1_score(y_true, y_pred)
print(f"Precision: {precision}, Recall: {recall}, F1: {f1}")
```

❌ 反例：仅报告 Accuracy，忽略类别不平衡场景下的 Precision/Recall。

---

### R02 — 评估数据集设计

评估数据集必须具有代表性、覆盖边界场景，并与训练集严格隔离。

- **MUST** 评估数据集与训练集、验证集无重叠样本
- **SHOULD** 评估数据集包含典型场景、边界场景（Edge Case）、对抗样本三类数据
- **MAY** 定期更新评估数据集以反映业务变化

✅ 示例：
```json
{
  "dataset": "customer_support_eval",
  "version": "2024-Q3",
  "samples": [
    {
      "id": "edge-001",
      "category": "edge_case",
      "input": "我要买那个东西",
      "expected_behavior": "引导用户明确商品名称"
    },
    {
      "id": "typical-001",
      "category": "typical",
      "input": "如何重置密码？",
      "expected_behavior": "提供密码重置步骤"
    }
  ]
}
```

❌ 反例：评估数据集直接从训练集中随机采样 10% 数据。

---

### R03 — Prompt / Model A/B 测试

Prompt 或模型变更必须通过 A/B 测试验证效果，不得凭主观判断上线。

- **MUST** A/B 测试设置对照组（Control）和实验组（Treatment），每组至少 1000 次调用
- **SHOULD** 统计显著性检验 p-value < 0.05 方可认为差异显著
- **MAY** 使用Bootstrap 方法估计置信区间，而非仅依赖点估计

✅ 示例：
```python
import scipy.stats as stats

# A/B 测试结果
control_successes = 850; control_total = 1000
treatment_successes = 910; treatment_total = 1000

# 双比例 Z 检验
z_stat, p_value = stats.proportions_ztest(
    [treatment_successes, control_successes],
    [treatment_total, control_total]
)
print(f"p-value: {p_value}")  # p < 0.05 → 显著
```

❌ 反例：仅凭一次演示效果好就判定新 Prompt 更优。

---

### R04 — 人工评估

对于自动指标无法覆盖的质量维度（如流畅度、安全性、有帮助程度），必须引入人工评估。

- **MUST** 人工评估采用盲测（Blind Test），评估者不知道输出来自哪个模型/Prompt
- **SHOULD** 至少 3 名评估者独立打分，取均值或多数投票
- **MAY** 使用 Likert Scale（1-5 分）量化主观评价维度

✅ 示例：
```json
{
  "evaluation_criteria": {
    "fluency": "回答是否自然流畅",
    "helpfulness": "回答是否解决了用户问题",
    "safety": "回答是否包含有害内容"
  },
  "rating_scale": "1=很差, 2=较差, 3=一般, 4=较好, 5=优秀"
}
```

❌ 反例：开发者自己评估自己的模型输出并声称"效果很好"。

---

### R05 — 自动化评估流水线

评估流程必须自动化，减少人为干预导致的结果偏差。

- **MUST** 每次模型或 Prompt 变更后自动触发评估流水线
- **SHOULD** 评估结果持久化存储，支持历史对比和趋势分析
- **MAY** 评估失败时自动阻断发布流程（Gate Keeping）

✅ 示例：
```yaml
# .github/workflows/evaluate.yml
name: AI Evaluation
on: [pull_request]
jobs:
  evaluate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: python scripts/run_evaluation.py --model ${{ github.sha }}
      - run: python scripts/compare_baseline.py --threshold 0.02
```

❌ 反例：手动运行评估脚本，结果仅保存在本地。

---

### R06 — Benchmark 选择

公开 Benchmark 用于横向对比，但不得替代领域内评估。

- **MUST** 通用能力评估使用 MMLU、HumanEval、GSM8K 等公认 Benchmark
- **SHOULD** 领域特定评估构建私有 Benchmark，不依赖公开榜单
- **MAY** 参考 Benchmark 排名时注明评测时间、模型版本、Prompt 格式

✅ 示例：
```
评估报告：
- 通用 Benchmark：MMLU 62.3%, HumanEval 54.1%
- 领域 Benchmark：客服问答准确率 87.2%
- 备注：以上结果基于 v1.2 模型，2024-06 评测
```

❌ 反例：仅引用 MMLU 分数作为模型能力的最终依据。

---

### R07 — 评估报告格式

评估结果必须以标准化格式输出，便于团队理解和决策。

- **MUST** 评估报告包含：评估时间、模型版本、数据集描述、指标数值、对比基线
- **SHOULD** 报告附带错误案例分析（Error Analysis），列出典型失败模式
- **MAY** 报告包含可视化图表（如混淆矩阵、指标趋势图）

✅ 示例：
```markdown
# 评估报告

## 基本信息
- 评估日期：2024-06-15
- 模型版本：gpt-4o-2024-05-13
- 评估数据集：customer_support_eval v2.0（500 条）

## 核心指标
| 指标 | 值 | 基线 | 变化 |
|------|----|------|------|
| 准确率 | 87.2% | 85.0% | +2.2% |
| 召回率 | 82.1% | 80.5% | +1.6% |

## 错误分析
1. 长尾查询理解不足（占比 15%）
2. 多轮对话上下文丢失（占比 8%）
```

❌ 反例：仅发送一句话"评估通过"而无具体数据。

---

### R08 — CI 持续评估

将评估集成到 CI/CD 流程中，确保每次变更都有质量保障。

- **MUST** PR 合并前自动运行评估，关键指标低于基线则阻止合并
- **SHOULD** 主分支定期执行全量评估，监控模型性能退化
- **MAY** 评估结果自动同步到团队通知渠道（如 Slack、飞书）

✅ 示例：
```python
# scripts/evaluate.py
def run_ci_evaluation():
    results = evaluate_model(current_model)
    baseline = load_baseline("main")

    if results["accuracy"] < baseline["accuracy"] - 0.01:
        raise ValueError(f"Accuracy regression: {results['accuracy']} < {baseline['accuracy']}")

    return results
```

❌ 反例：CI 中仅有代码检查，无任何模型评估环节。

---

## Checklist

- [ ] 根据任务类型选择了合适的评估指标
- [ ] 评估数据集与训练集无重叠，覆盖典型和边界场景
- [ ] Prompt/Model 变更经过 A/B 测试验证
- [ ] 主观质量维度已安排人工盲测
- [ ] 评估流水线已自动化，结果持久化存储
- [ ] 公开 Benchmark 与私有领域 Benchmark 结合使用
- [ ] 评估报告包含指标、基线对比和错误分析
- [ ] CI 流程中集成了评估 Gate Keeping
