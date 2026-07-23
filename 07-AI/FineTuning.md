# AI Fine-Tuning Standards

## Overview

本文档定义了项目中 AI 模型微调（Fine-Tuning）的工程规范，涵盖微调决策、数据准备、训练配置、过拟合预防等核心实践。

---

## Rules

### R01 — 微调决策

在决定是否微调前，必须评估 Prompt Engineering 和 RAG 是否已满足需求。

- **MUST** 优先尝试 Prompt Engineering → RAG → Fine-Tuning 的递进方案
- **SHOULD** 仅在以下场景考虑微调：需要特定输出格式、风格模仿、复杂推理能力提升
- **MAY** 对开源模型进行 SFT（Supervised Fine-Tuning）以降低 API 成本

✅ 决策流程：
```
1. Prompt Engineering 能否解决？→ 能则直接使用
2. RAG + Prompt 能否解决？→ 能则使用 RAG
3. 以上均不满足 → 评估微调必要性
```

❌ 反例：跳过 Prompt 和 RAG 直接微调基础模型。

---

### R02 — 数据格式与质量

微调数据的质量直接决定模型效果，必须严格把控数据格式和质量。

- **MUST** 数据格式统一为指令微调格式（Instruction Tuning Format），包含 instruction、input、output 字段
- **SHOULD** 每条数据至少经过人工审核或规则校验，确保 output 的正确性和一致性
- **MAY** 使用 GPT-4 / Claude 生成种子数据，但必须经过人工后处理验证

✅ 示例：
```json
{
  "instruction": "将以下英文翻译为中文",
  "input": "Hello, how are you?",
  "output": "你好，你最近怎么样？"
}
```

❌ 反例：
```json
{
  "text": "Hello world",
  "label": "你好世界"
}
```

---

### R03 — 数据去重与分布

训练数据中的重复和类别不平衡会导致模型偏向高频模式。

- **MUST** 训练集去重率 > 95%，使用 MinHash / LSH 检测近似重复
- **SHOULD** 各类别样本数量差异不超过 10 倍，必要时进行欠采样或过采样
- **MAY** 使用 DPO（Direct Preference Optimization）替代传统 SFT 处理偏好数据

✅ 示例：
```python
from datasketch import MinHash, MinHashLSH

lsh = MinHashLSH(threshold=0.8)
for i, text in enumerate(dataset):
    mh = MinHash(num_perm=128)
    for word in text.split():
        mh.update(word.encode('utf-8'))
    lsh.insert(str(i), mh)

# 检测并移除重复
duplicates = lsh.query(mh)
```

❌ 反例：未做去重，同一回答模板重复出现 1000+ 次。

---

### R04 — 训练方法选择

根据算力预算和目标效果选择合适的微调方法。

- **MUST** 资源受限时使用 LoRA / QLoRA（参数高效微调，仅需训练 <1% 参数）
- **SHOULD** 全量微调（Full Fine-Tuning）仅在有充足算力且追求极致效果时使用
- **MAY** 结合 LoRA + DoRA 混合策略平衡效果与效率

✅ 示例：
```yaml
# QLoRA 配置
base_model: meta-llama/Llama-3-8B
finetuning_type: lora
lora_r: 16
lora_alpha: 32
lora_dropout: 0.05
quantization: bitsandbytes-nf4
learning_rate: 2e-4
epochs: 3
```

❌ 反例：在单卡 A100 上对 70B 模型进行全量微调。

---

### R05 — 训练过程监控

微调过程中必须持续监控关键指标，及时发现问题。

- **MUST** 记录每个 Epoch 的 Train Loss 和 Val Loss，绘制学习曲线
- **SHOULD** 监控梯度范数（Gradient Norm），防止梯度爆炸/消失
- **MAY** 定期采样生成结果，人工检查输出质量变化

✅ 示例：
```python
# TensorBoard 日志
from torch.utils.tensorboard import SummaryWriter

writer = SummaryWriter()
for epoch in range(num_epochs):
    train_loss = train(...)
    val_loss = validate(...)
    writer.add_scalar('Loss/train', train_loss, epoch)
    writer.add_scalar('Loss/val', val_loss, epoch)
```

❌ 反例：训练完成后才发现 Loss 不收敛。

---

### R06 — 过拟合预防

微调模型极易过拟合小规模训练数据，必须采取预防措施。

- **MUST** 训练集与验证集严格按 80/20 划分，不得混用
- **SHOULD** 实施 Early Stopping（当 Val Loss 连续 3 个 Epoch 不下降时停止）
- **MAY** 使用 Weight Decay（0.01-0.1）和 Dropout（0.1-0.3）正则化

✅ 示例：
```python
from sklearn.model_selection import train_test_split

train_data, val_data = train_test_split(
    dataset, test_size=0.2, random_state=42
)

# Early Stopping callback
early_stop = EarlyStopping(
    patience=3,
    min_delta=0.001,
    restore_best_weights=True
)
```

❌ 反例：训练 100 Epoch 而不监控验证集表现。

---

### R07 — 模型版本管理

微调后的模型必须纳入版本管理体系，确保可追溯和可回滚。

- **MUST** 每次微调产出模型附带完整元信息：基座模型、训练数据版本、超参数、评估指标
- **SHOULD** 使用 MLflow / W&B 记录实验参数和指标，支持对比分析
- **MAY** 模型文件存储至对象存储（如 S3 / OSS），通过 URI 引用

✅ 示例：
```yaml
# model_card.yaml
model_name: finetuned-llama3-8b-customer-support
base_model: meta-llama/Llama-3-8B
version: v1.2.0
training_data: customer_support_v3.parquet
hyperparameters:
  learning_rate: 2e-4
  epochs: 3
  lora_r: 16
metrics:
  accuracy: 0.89
  bleu_score: 0.72
```

❌ 反例：微调模型仅保存为 `model_final.bin`，无任何元信息。

---

### R08 — 部署与成本管理

微调模型的部署需权衡性能、延迟和成本。

- **MUST** 部署前在独立测试环境验证模型功能和性能指标
- **SHOULD** 使用量化（INT8/INT4）降低推理成本，保持精度损失 < 1%
- **MAY** 采用 vLLM / TGI 等高性能推理框架优化吞吐

✅ 示例：
```dockerfile
# Dockerfile
FROM vllm/vllm-openai:latest
MODEL_ID: finetuned-llama3-8b-customer-support
QUANTIZATION: awq
MAX_MODEL_LEN: 4096
```

❌ 反例：未经测试直接将微调模型部署到生产环境。

---

## Checklist

- [ ] 已评估 Prompt Engineering 和 RAG 方案不可行后再决定微调
- [ ] 训练数据符合指令微调格式，经人工审核
- [ ] 训练集去重率 > 95%，类别分布均衡
- [ ] 根据算力选择 LoRA/QLoRA 或全量微调
- [ ] 训练过程监控 Train Loss 和 Val Loss
- [ ] 实施 Early Stopping 和正则化防止过拟合
- [ ] 微调模型附带完整元信息和版本号
- [ ] 部署前完成独立环境验证和量化评估
