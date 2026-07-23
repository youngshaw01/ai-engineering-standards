# AI Workflow Engineering Standards

## Overview

本文档定义了项目中 AI 工作流（Workflow）的工程规范，涵盖工作流定义、Prompt 链式调用、工具编排、人机协作等核心实践。

---

## Rules

### R01 — 工作流定义与描述

AI 工作流必须以声明式方式定义，确保可读性和可维护性。

- **MUST** 使用 YAML / JSON 或专用 DSL（如 LangGraph、Dify）定义工作流拓扑结构
- **SHOULD** 每个节点包含：唯一 ID、输入/输出类型、处理逻辑、超时配置
- **MAY** 支持条件分支（Conditional Branching）和并行执行（Parallel Execution）

✅ 示例：
```yaml
workflow:
  name: customer_support_pipeline
  version: "2.0"
  nodes:
    - id: intent_classifier
      type: llm
      input: user_query
      output: intent
      model: gpt-4o-mini
      timeout: 30s

    - id: knowledge_retrieval
      type: rag
      input: intent + user_query
      output: context
      top_k: 5

    - id: response_generator
      type: llm
      input: context + user_query
      output: answer
      model: gpt-4o
      timeout: 60s
```

❌ 反例：将工作流逻辑硬编码在 Python 脚本中，无法可视化。

---

### R02 — Prompt 链式调用

多步骤任务通过 Prompt 链式调用实现，每步输出作为下一步输入。

- **MUST** 每个 Prompt 节点有明确的输入/输出契约（Schema），包括字段名、类型、必填项
- **SHOULD** 链式调用中间结果可缓存，避免重复 LLM 调用
- **MAY** 使用 Chain of Thought（CoT）提示提升复杂推理质量

✅ 示例：
```python
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate

# Step 1: 提取意图
intent_prompt = PromptTemplate(
    input_variables=["user_query"],
    template="从以下查询中提取用户意图：{user_query}"
)

# Step 2: 生成回答
answer_prompt = PromptTemplate(
    input_variables=["intent", "context"],
    template="根据意图 {intent} 和上下文 {context} 生成回答："
)

chain = LLMChain(llm=llm, prompt=intent_prompt) | LLMChain(llm=llm, prompt=answer_prompt)
result = chain.run(user_query="如何退款？")
```

❌ 反例：将所有 Prompt 拼接成一个超大 Prompt 一次性发送。

---

### R03 — 工具调用编排

AI 工作流需要调用外部工具（API、数据库、搜索引擎）时，必须规范编排。

- **MUST** 每个工具调用有独立的错误处理和超时控制
- **SHOULD** 工具调用结果进行结构化校验，失败时回退到默认行为
- **MAY** 支持工具自动选择（Tool Selection），由 LLM 根据意图动态决定调用哪个工具

✅ 示例：
```python
def call_with_fallback(tool_func, fallback_value, timeout=30):
    try:
        result = asyncio.wait_for(tool_func(), timeout=timeout)
        return validate_result(result)
    except (TimeoutError, ToolError) as e:
        logger.warning(f"Tool call failed: {e}")
        return fallback_value

# 使用
weather = call_with_fallback(
    tool_func=get_weather,
    fallback_value={"city": "未知", "temp": "暂无数据"},
    timeout=10
)
```

❌ 反例：工具调用失败后直接抛出异常导致整个工作流中断。

---

### R04 — 人机协作集成

涉及高风险决策的工作流必须引入人工审核环节。

- **MUST** 人工审核节点设置明确的审批标准（Criteria），而非主观判断
- **SHOULD** 审核请求附带完整的上下文信息和推荐方案，减少人工决策时间
- **MAY** 支持审核超时自动升级（Escalation）机制

✅ 示例：
```yaml
nodes:
  - id: draft_response
    type: llm
    output: draft

  - id: human_review
    type: approval
    input: draft
    criteria:
      - "回复内容是否包含敏感信息"
      - "退款金额是否正确"
    timeout: 30min
    escalation: supervisor@company.com

  - id: send_response
    type: action
    input: approved_draft
```

❌ 反例：所有操作全自动执行，无任何人工审核环节。

---

### R05 — 错误处理与重试

工作流必须具备完善的错误处理和重试机制。

- **MUST** 每个节点配置最大重试次数（建议 3 次）和指数退避策略
- **SHOULD** 区分可恢复错误（网络超时、限流）和不可恢复错误（参数错误、权限不足）
- **MAY** 重试耗尽后触发降级策略（Fallback），如返回默认值或转人工

✅ 示例：
```python
import tenacity

@tenacity.retry(
    stop=tenacity.stop_after_attempt(3),
    wait=tenacity.wait_exponential(multiplier=1, min=1, max=10),
    retry=tenacity.retry_if_exception_type((TimeoutError, RateLimitError)),
    before_sleep=tenacity.before_sleep_log(logger, logging.WARNING)
)
def call_llm_with_retry(prompt: str):
    return llm.invoke(prompt)
```

❌ 反例：遇到错误直接终止工作流，无重试和降级。

---

### R06 — 工作流可观测性

生产环境的工作流必须具备完整的可观测性，便于调试和监控。

- **MUST** 记录每次执行的完整链路日志：输入 → 各节点输出 → 最终结果
- **SHOULD** 关键指标上报至监控系统：成功率、平均耗时、各节点 P99 延迟
- **MAY** 支持分布式追踪（Distributed Tracing），关联跨服务调用链

✅ 示例：
```python
import structlog

logger = structlog.get_logger()

def execute_node(node_id: str, input_data):
    start = time.time()
    try:
        result = node_handler(input_data)
        duration = time.time() - start
        logger.info("node_completed",
            node_id=node_id,
            duration_ms=round(duration * 1000, 2),
            status="success"
        )
        metrics.histogram(f"node.{node_id}.duration", duration)
        return result
    except Exception as e:
        logger.error("node_failed",
            node_id=node_id,
            error=str(e),
            status="error"
        )
        raise
```

❌ 反例：仅打印 `print()` 语句，无结构化日志和指标。

---

### R07 — 工作流版本管理

工作流定义变更必须纳入版本管理，确保可追溯和可回滚。

- **MUST** 工作流定义文件存储于 Git 仓库，每次变更提交 PR 并 Code Review
- **SHOULD** 版本号遵循语义化版本（Semantic Versioning）：主版本号.功能版本号.修订号
- **MAY** 支持灰度发布（Canary Deployment），新版本先对小比例流量生效

✅ 示例：
```
workflows/
├── customer_support/
│   ├── v1.0.0.yaml    # 初始版本
│   ├── v1.1.0.yaml    # 新增 Reranker 节点
│   └── v2.0.0.yaml    # 架构重构
```

❌ 反例：工作流定义直接在线上平台编辑，无版本记录。

---

### R08 — 工作流测试

工作流上线前必须经过系统化测试，验证各路径的正确性。

- **MUST** 覆盖正常路径（Happy Path）、边界场景和异常路径
- **SHOULD** 使用固定测试用例集（Golden Test Set），每次变更后自动回归
- **MAY** 实施混沌测试（Chaos Testing），随机注入故障验证容错能力

✅ 示例：
```python
TEST_CASES = [
    {
        "name": "normal_refund_request",
        "input": "我要退款，订单号 12345",
        "expected_path": ["intent_classifier", "knowledge_retrieval", "human_review", "send_response"],
        "expected_output_contains": ["退款"]
    },
    {
        "name": "sensitive_topic",
        "input": "投诉你们的产品安全问题",
        "expected_path": ["intent_classifier", "escalation"],
        "expected_output_contains": ["已转交"]
    }
]

def test_workflow(case):
    result = workflow.execute(case["input"])
    assert result.path == case["expected_path"]
    assert any(kw in result.output for kw in case["expected_output_contains"])
```

❌ 反例：仅手动点击几个样本就认为工作流正确。

---

## Checklist

- [ ] 工作流以声明式方式定义，节点含 ID、类型、超时配置
- [ ] Prompt 链式调用有明确输入/输出 Schema
- [ ] 工具调用有错误处理和超时控制
- [ ] 高风险决策节点设置人工审核
- [ ] 每个节点配置重试和降级策略
- [ ] 执行链路日志完整，关键指标上报监控
- [ ] 工作流定义纳入 Git 版本管理
- [ ] 上线前覆盖正常、边界、异常路径测试
