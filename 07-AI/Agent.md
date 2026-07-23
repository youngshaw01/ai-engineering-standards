# AI Agent

## Overview

AI Agent 工程规范，涵盖 Agent 定义与分类、核心组件设计、Tool 规范、Memory 架构、Planning 策略、Multi-Agent 协作、安全、可观测性、测试、容错、Human-in-the-Loop 及 MCP 集成。适用于所有基于 LLM 的 Agent 系统的设计与实现。

---

## Rules

### R01 — Agent 定义与分类

**MUST** — Agent 必须明确声明其架构模式，不同模式对应不同的适用场景：

| 模式 | 核心思路 | 适用场景 | 复杂度 |
|------|---------|---------|--------|
| ReAct | 推理-行动循环，逐步思考并调用 Tool | 单步决策、简单任务链 | 低 |
| Plan-and-Execute | 先生成完整计划，再逐步执行 | 多步骤复杂任务、可预判流程 | 中 |
| Multi-Agent | 多个 Agent 协作，各自承担不同角色 | 大规模任务、跨领域协作 | 高 |

**选择原则：**

- 能用 ReAct 解决的，不引入 Plan-and-Execute
- 能用单 Agent 解决的，不引入 Multi-Agent
- 任务步骤 > 5 且存在依赖关系时，考虑 Plan-and-Execute
- 任务涉及 > 2 个独立领域时，考虑 Multi-Agent

✅ Correct:

```python
class SearchAgent:
    architecture = "ReAct"

    def run(self, query: str) -> str:
        thought = self.llm.think(f"需要搜索: {query}")
        observation = self.tools["search"].invoke(thought.search_query)
        answer = self.llm.think(f"基于结果回答: {observation}")
        return answer
```

```python
class ReportAgent:
    architecture = "Plan-and-Execute"

    def run(self, topic: str) -> str:
        plan = self.planner.create_plan(topic)
        results = []
        for step in plan.steps:
            result = self.executor.execute(step)
            results.append(result)
            if step.needs_replan:
                plan = self.planner.replan(plan, step, result)
        return self.synthesizer.merge(results)
```

❌ Wrong:

```python
class SimpleQAAgent:
    architecture = "Multi-Agent"

    def run(self, question: str) -> str:
        coordinator = Agent(role="coordinator")
        researcher = Agent(role="researcher")
        writer = Agent(role="writer")
        return coordinator.delegate(question)
```

> 单一问答任务使用 Multi-Agent 架构，引入不必要的复杂度。

---

### R02 — 核心组件设计

**MUST** — Agent 必须由以下三个核心组件构成，且各组件职责清晰分离：

| 组件 | 职责 | 输入 | 输出 |
|------|------|------|------|
| Tool | 与外部世界交互，执行具体动作 | 结构化参数 | 结构化结果 |
| Memory | 管理上下文与历史信息 | 查询条件 | 相关记忆片段 |
| Planning | 任务分解与执行编排 | 用户目标 | 执行计划 |

**组件间禁止交叉依赖：**

- Tool 不得直接读写 Memory
- Memory 不得调用 Tool
- Planning 通过 Agent Loop 协调 Tool 和 Memory，而非让它们直接交互

✅ Correct:

```python
class Agent:
    def __init__(self, tools: list[Tool], memory: Memory, planner: Planner):
        self.tools = {t.name: t for t in tools}
        self.memory = memory
        self.planner = planner

    def run(self, goal: str) -> str:
        plan = self.planner.decompose(goal)
        for step in plan:
            context = self.memory.retrieve(step.query)
            result = self.tools[step.tool_name].invoke(step.params)
            self.memory.store(step, result)
        return self.synthesize()
```

❌ Wrong:

```python
class Agent:
    def __init__(self):
        self.tool = DatabaseTool()
        self.tool.memory = SharedMemory()

    def run(self, goal: str) -> str:
        return self.tool.query_and_remember(goal)
```

> Tool 直接持有 Memory 引用，组件职责耦合，无法独立测试和替换。

---

### R03 — Tool 设计规范

**MUST** — 每个 Tool 必须满足以下要求：

1. **声明输入输出 Schema** — 使用 JSON Schema 或 Pydantic Model 定义
2. **提供自然语言描述** — 描述必须包含功能、适用场景和限制
3. **保证幂等性** — 相同输入产生相同副作用（读操作天然幂等，写操作需显式设计）
4. **单一职责** — 一个 Tool 只做一件事

**Tool 元数据规范：**

| 字段 | 必填 | 说明 |
|------|------|------|
| `name` | 是 | 动词+名词，kebab-case，如 `search-docs` |
| `description` | 是 | 功能描述 + 适用场景 + 限制说明 |
| `inputSchema` | 是 | JSON Schema / Pydantic Model |
| `outputSchema` | 是 | JSON Schema / Pydantic Model |
| `idempotent` | 是 | 是否幂等，供 Planning 参考 |
| `dangerous` | 是 | 是否有破坏性副作用（删除、修改等） |

✅ Correct:

```python
from pydantic import BaseModel, Field

class SearchDocsInput(BaseModel):
    query: str = Field(description="搜索关键词")
    top_k: int = Field(default=5, ge=1, le=20, description="返回结果数量")

class SearchDocsOutput(BaseModel):
    results: list[DocResult] = Field(description="搜索结果列表")
    total: int = Field(description="匹配总数")

class SearchDocsTool(Tool):
    name = "search-docs"
    description = "在知识库中搜索文档。适用于查找技术文档、API 说明、FAQ。不支持模糊语义搜索，需提供明确关键词。"
    input_schema = SearchDocsInput
    output_schema = SearchDocsOutput
    idempotent = True
    dangerous = False

    def invoke(self, params: SearchDocsInput) -> SearchDocsOutput:
        results = self.index.search(params.query, top_k=params.top_k)
        return SearchDocsOutput(results=results, total=len(results))
```

❌ Wrong:

```python
class DoStuffTool(Tool):
    name = "do_stuff"

    def invoke(self, params):
        if "search" in params:
            return self.search(params["search"])
        if "delete" in params:
            return self.delete(params["delete"])
        return "unknown action"
```

> 缺少 Schema、描述、幂等标记；一个 Tool 承担多个职责；参数无校验。

---

### R04 — Memory 架构

**MUST** — Agent Memory 必须区分三层架构，各层独立管理：

| 层级 | 名称 | 生命周期 | 存储内容 | 典型实现 |
|------|------|---------|---------|---------|
| L1 | 短期记忆（Short-Term） | 单次会话 | 当前对话上下文、中间结果 | LLM Context Window |
| L2 | 工作记忆（Working） | 单次任务 | 当前任务状态、执行进度、临时变量 | State Store / Redis |
| L3 | 长期记忆（Long-Term） | 跨会话 | 用户偏好、历史摘要、知识积累 | Vector DB / RDBMS |

**管理规则：**

- L1 超出 Context Window 时，必须执行摘要或截断，不得静默丢弃
- L2 任务结束后必须清理，不得泄漏到下次任务
- L3 写入前必须去重和压缩，避免冗余存储
- 跨层引用必须显式声明，不得隐式穿透

✅ Correct:

```python
class AgentMemory:
    def __init__(self):
        self.short_term = ConversationBuffer(max_tokens=4000)
        self.working = TaskStateStore()
        self.long_term = VectorStore(collection="user_knowledge")

    def retrieve(self, query: str) -> list[MemoryItem]:
        recent = self.short_term.get_recent(turns=3)
        task_state = self.working.load(self.task_id)
        knowledge = self.long_term.search(query, top_k=5)
        return self._merge_and_rank(recent, task_state, knowledge)

    def store(self, item: MemoryItem, layer: str):
        if layer == "short_term":
            self.short_term.add(item)
            if self.short_term.exceeds_limit():
                summary = self._summarize(self.short_term.get_all())
                self.short_term.compact(summary)
        elif layer == "working":
            self.working.save(self.task_id, item)
        elif layer == "long_term":
            deduplicated = self._deduplicate(item)
            self.long_term.upsert(deduplicated)
```

❌ Wrong:

```python
class AgentMemory:
    def __init__(self):
        self.history = []

    def add(self, message: str):
        self.history.append(message)

    def get_all(self):
        return self.history
```

> 不区分记忆层级，所有内容堆在一个列表中；无容量控制、无摘要、无去重。

---

### R05 — Planning 策略

**MUST** — Agent Planning 必须支持任务分解与动态调整：

**任务分解规则：**

- 每个子任务必须是可独立验证的原子操作
- 子任务粒度：单个 Tool 调用或单个判断逻辑
- 子任务之间显式声明依赖关系（串行 / 并行 / 条件）
- 分解深度不超过 4 层，超过时考虑引入子 Agent

**动态调整规则：**

- 执行结果与预期不符时，必须触发 Replan
- Replan 不得丢弃已完成的子任务结果
- 连续 Replan 超过 3 次时，必须暂停并请求人工干预
- Replan 必须记录原因，供后续分析

✅ Correct:

```python
class Plan:
    steps: list[Step]
    dependencies: dict[str, list[str]]

class Step:
    id: str
    tool: str
    params: dict
    status: Literal["pending", "running", "done", "failed"]
    result: Any | None

class Planner:
    def decompose(self, goal: str) -> Plan:
        steps = self._generate_steps(goal)
        deps = self._infer_dependencies(steps)
        return Plan(steps=steps, dependencies=deps)

    def replan(self, plan: Plan, failed_step: Step, error: str) -> Plan:
        self.replan_count += 1
        if self.replan_count > 3:
            raise ReplanLimitExceeded("连续 Replan 超过 3 次，请人工干预")

        preserved = [s for s in plan.steps if s.status == "done"]
        new_steps = self._generate_alternative_steps(failed_step, error)
        return Plan(
            steps=preserved + new_steps,
            dependencies=self._infer_dependencies(preserved + new_steps),
        )
```

❌ Wrong:

```python
class Planner:
    def plan(self, goal: str) -> list[str]:
        return self.llm.generate(f"为以下目标生成步骤: {goal}").split("\n")

    def execute(self, steps: list[str]):
        for step in steps:
            self.tool.run(step)
```

> 步骤无结构化定义、无依赖关系、无状态追踪、无 Replan 机制。

---

### R06 — Multi-Agent 协作模式

**MUST** — Multi-Agent 系统必须明确声明协作模式：

| 模式 | 结构 | 适用场景 | 优点 | 缺点 |
|------|------|---------|------|------|
| Orchestrator | 中心调度，Agent 向 Orchestrator 汇报 | 任务可预分解、需全局协调 | 控制力强、易追踪 | Orchestrator 成为瓶颈 |
| Pipeline | 线性流水线，上游输出即下游输入 | 顺序处理、各阶段独立 | 简单直观、延迟可预测 | 不支持回退和分支 |
| Peer-to-Peer | 对等协作，Agent 间直接通信 | 开放式探索、创意任务 | 灵活、无单点瓶颈 | 难以追踪和调试 |

**通用规则：**

- 每个 Agent 必须定义 Agent 间的通信协议（消息格式、同步/异步）
- 必须设置全局超时，防止死循环
- 必须有冲突解决机制（Orchestrator 裁决 / 投票 / 优先级）
- Agent 间禁止共享可变状态，通过消息传递数据

✅ Correct:

```python
class OrchestratorAgent:
    def __init__(self, agents: dict[str, Agent]):
        self.agents = agents
        self.timeout = 300

    def run(self, task: Task) -> Result:
        plan = self.decompose(task)
        results = {}
        for step in plan:
            agent = self.agents[step.agent_name]
            result = agent.execute(step, timeout=self.timeout)
            results[step.id] = result
            if result.conflicts_with(results):
                resolved = self.resolve_conflict(result, results)
                results.update(resolved)
        return self.merge(results)

    def resolve_conflict(self, current: Result, existing: dict) -> dict:
        return self.llm.decide(current, existing)
```

❌ Wrong:

```python
class MultiAgentSystem:
    def __init__(self):
        self.shared_state = {}
        self.agents = [Agent() for _ in range(5)]

    def run(self, task):
        for agent in self.agents:
            agent.shared_state = self.shared_state
            agent.run(task)
```

> Agent 间共享可变状态，无通信协议，无冲突解决，无超时控制。

---

### R07 — Agent 安全

**MUST** — Agent 必须实现以下安全措施：

**权限控制：**

- 每个 Tool 必须声明所需权限级别
- Agent 不得调用超出当前用户权限的 Tool
- 危险操作（删除、修改、执行代码）必须二次确认

**沙箱隔离：**

- 代码执行 Tool 必须在沙箱中运行（Docker / gVisor / WASM）
- 沙箱必须限制网络访问、文件系统访问、执行时间
- 沙箱必须限制资源使用（CPU / 内存 / 磁盘）

**输入校验：**

- 所有 Tool 输入必须经过 Schema 校验
- LLM 生成的 Tool 参数必须二次校验，不得直接信任
- 禁止将用户输入直接拼接到 Prompt 中（Prompt Injection 防护）

| 攻击类型 | 防护措施 |
|---------|---------|
| Prompt Injection | 输入输出分离、角色标记、内容过滤 |
| Tool 参数篡改 | Schema 校验 + 范围约束 |
| 越权调用 | 权限声明 + 运行时校验 |
| 资源耗尽 | 超时 + 速率限制 + 资源配额 |
| 数据泄漏 | 输出过滤 + 敏感信息脱敏 |

✅ Correct:

```python
class SecureToolInvoker:
    def invoke(self, tool: Tool, params: dict, user: User) -> ToolResult:
        if not self.permission_check(tool, user):
            raise PermissionDenied(f"用户无权调用 {tool.name}")

        validated = tool.input_schema(**params)
        if tool.dangerous:
            self.require_confirmation(tool, validated)

        if tool.name == "execute-code":
            return self.sandbox.run(validated.code, timeout=30, memory="512m")

        return tool.invoke(validated)

    def permission_check(self, tool: Tool, user: User) -> bool:
        required = tool.required_permissions
        return all(p in user.permissions for p in required)
```

❌ Wrong:

```python
def invoke_tool(tool_name: str, params: str):
    tool = globals()[tool_name]
    return tool.eval(params)
```

> 无权限校验、无输入校验、无沙箱隔离、直接 eval 用户输入。

---

### R08 — Agent 可观测性

**MUST** — Agent 必须实现三层可观测性：

| 层级 | 内容 | 用途 |
|------|------|------|
| 日志（Logging） | 每步决策、Tool 调用、参数、结果 | 调试、审计 |
| 链路追踪（Tracing） | 完整执行路径、耗时、Token 消耗 | 性能分析、瓶颈定位 |
| 指标（Metrics） | 成功率、延迟分布、Token 用量、Tool 调用频率 | 监控、告警、成本控制 |

**日志规范：**

- 每次决策必须记录：`thought` → `action` → `observation`
- Tool 调用必须记录：`tool_name`、`input`（脱敏）、`output`（脱敏）、`duration`
- 日志中不得包含敏感信息（Token、密钥、个人数据）

**Tracing 规范：**

- 每次任务执行生成一个 Trace，包含所有 Span
- 每个 Span 包含：`agent_name`、`tool_name`、`start_time`、`end_time`、`status`
- 推荐使用 OpenTelemetry 兼容格式

✅ Correct:

```python
import opentelemetry.trace as trace

tracer = trace.get_tracer("agent")

class ObservableAgent:
    def run(self, goal: str) -> str:
        with tracer.start_as_current_span("agent.run") as span:
            span.set_attribute("goal", goal)
            span.set_attribute("agent.name", self.name)

            for step in self.plan.steps:
                with tracer.start_as_current_span(f"tool.{step.tool_name}") as tool_span:
                    tool_span.set_attribute("tool.input", self._sanitize(step.params))
                    result = self.tools[step.tool_name].invoke(step.params)
                    tool_span.set_attribute("tool.output", self._sanitize(result))
                    tool_span.set_attribute("tool.duration_ms", result.duration_ms)

            self.metrics.record("agent.run.success", 1)
            self.metrics.record("agent.run.token_count", self.llm.token_usage)
```

❌ Wrong:

```python
class Agent:
    def run(self, goal: str) -> str:
        result = self.llm.chat(goal)
        print(f"got result: {result}")
        return result
```

> 仅 print 输出，无结构化日志、无 Tracing、无指标采集。

---

### R09 — Agent 测试

**MUST** — Agent 必须实现三层测试策略：

| 层级 | 测试对象 | Mock 策略 | 运行频率 |
|------|---------|----------|---------|
| 单元测试 | 单个 Tool、Memory 组件、Planner 逻辑 | Mock LLM 和外部依赖 | 每次提交 |
| 集成测试 | Agent 完整 Loop（LLM + Tool + Memory） | Mock 外部 API，使用真实 LLM | 每日 |
| E2E 测试 | 端到端用户场景 | 真实环境或 Staging | 每次发布 |

**单元测试规则：**

- Tool 测试必须覆盖：正常输入、边界输入、异常输入
- Planner 测试必须覆盖：标准分解、依赖推断、Replan 触发
- Memory 测试必须覆盖：读写、容量限制、去重

**集成测试规则：**

- 使用固定 Seed 或 Mock LLM 保证可复现性
- 必须测试 Tool 调用链的正确性
- 必须测试 Memory 对 Agent 决策的影响

**E2E 测试规则：**

- 定义典型用户场景作为测试用例
- 评估标准：任务完成率、步骤正确率、无幻觉率
- 允许非确定性，但必须设定通过阈值

✅ Correct:

```python
def test_search_tool_normal_input():
    tool = SearchDocsTool(index=MockIndex())
    result = tool.invoke(SearchDocsInput(query="Python asyncio", top_k=3))
    assert len(result.results) <= 3
    assert result.total >= 0

def test_search_tool_empty_query():
    tool = SearchDocsTool(index=MockIndex())
    with pytest.raises(ValidationError):
        tool.invoke(SearchDocsInput(query="", top_k=3))

def test_agent_integration():
    agent = ResearchAgent(
        llm=MockLLM(responses=[...]),
        tools=[SearchDocsTool(index=RealIndex())],
        memory=InMemoryStore(),
    )
    result = agent.run("查找 Python asyncio 教程")
    assert result.contains("asyncio")
    assert agent.memory.short_term.turns == 2
```

❌ Wrong:

```python
def test_agent():
    agent = Agent()
    result = agent.run("hello")
    assert result is not None
```

> 仅断言结果非空，无场景覆盖、无边界测试、无 Mock 策略。

---

### R10 — Agent 降级与容错

**MUST** — Agent 必须实现以下容错机制：

**Fallback 策略：**

- Tool 调用失败时，必须有备选方案（降级 Tool / 默认值 / 人工兜底）
- LLM 调用失败时，必须有重试或降级模型
- 整体任务失败时，必须返回部分结果 + 失败原因，不得静默返回空

**重试规则：**

- 仅对可重试错误重试（网络超时、限流），不重试业务错误（参数校验失败、权限不足）
- 重试必须使用指数退避（Exponential Backoff）
- 最大重试次数不超过 3 次
- 重试必须记录日志

**超时规则：**

- 每个 Tool 调用必须设置超时
- 单次 LLM 调用超时不超过 60 秒
- 整体任务超时不超过 300 秒
- 超时后必须执行清理（释放资源、记录状态）

✅ Correct:

```python
class ResilientToolInvoker:
    def invoke(self, tool: Tool, params: dict) -> ToolResult:
        last_error = None
        for attempt in range(3):
            try:
                result = tool.invoke(params, timeout=tool.timeout)
                return result
            except RetryableError as e:
                last_error = e
                backoff = 2 ** attempt
                logger.warning(f"Tool {tool.name} failed (attempt {attempt + 1}), retry in {backoff}s")
                time.sleep(backoff)
            except BusinessError as e:
                logger.error(f"Tool {tool.name} business error: {e}")
                return self.fallback(tool, params, e)

        logger.error(f"Tool {tool.name} exhausted retries")
        return self.fallback(tool, params, last_error)

    def fallback(self, tool: Tool, params: dict, error: Exception) -> ToolResult:
        if tool.fallback_tool:
            return tool.fallback_tool.invoke(params)
        return ToolResult(
            success=False,
            data=None,
            error=str(error),
            fallback_used=True,
        )
```

❌ Wrong:

```python
def invoke_tool(tool: Tool, params: dict):
    try:
        return tool.invoke(params)
    except Exception:
        return None
```

> 捕获所有异常后返回 None，无重试、无 Fallback、无日志、丢失错误信息。

---

### R11 — Human-in-the-Loop

**MUST** — 以下场景必须引入人工审批节点：

| 场景 | 审批方式 | 示例 |
|------|---------|------|------|
| 危险操作 | 执行前确认 | 删除数据、发送邮件、执行代码 |
| 高价值决策 | 执行前确认 | 金融交易、合同审批、生产部署 |
| 不确定判断 | 执行前确认 | LLM 置信度低于阈值、多方案冲突 |
| 连续失败 | 暂停并上报 | Replan 超限、Tool 连续失败 |
| 合规要求 | 执行前确认 | 涉及隐私数据、跨境操作 |

**审批机制设计：**

- 审批请求必须包含：操作描述、影响范围、可回滚性、超时策略
- 审批超时策略：拒绝（默认）/ 允许 / 上报
- 审批结果必须记录到审计日志
- 人工可以修改 Agent 的决策，修改记录必须保留

✅ Correct:

```python
class HumanInTheLoop:
    def request_approval(self, action: Action) -> ApprovalResult:
        request = ApprovalRequest(
            action_description=action.describe(),
            impact=action.impact_assessment(),
            rollback_possible=action.is_reversible(),
            timeout_policy="reject",
        )
        result = self.approval_service.submit(request)
        self.audit_log.record(request, result)
        if result.modified:
            self.audit_log.record_modification(result.modification)
        return result

class Agent:
    def execute_step(self, step: Step) -> StepResult:
        if step.tool.dangerous or step.estimated_impact == "high":
            approval = self.hil.request_approval(step.to_action())
            if not approval.approved:
                return StepResult(status="rejected", reason=approval.reason)
            if approval.modified:
                step = step.apply_modification(approval.modification)
        return self.tools[step.tool_name].invoke(step.params)
```

❌ Wrong:

```python
class Agent:
    def execute_step(self, step: Step) -> StepResult:
        return self.tools[step.tool_name].invoke(step.params)
```

> 所有操作直接执行，无审批节点，危险操作无保护。

---

### R12 — Agent 与 MCP 集成

**SHOULD** — Agent 应通过 MCP（Model Context Protocol）标准协议集成外部 Tool，实现跨平台互操作：

**集成原则：**

- 优先使用 MCP 协议暴露 Tool，而非自定义 API
- MCP Server 必须声明完整的 Tool Schema（name、description、inputSchema）
- Agent 作为 MCP Client，通过标准协议发现和调用 Tool
- 支持 SSE / Streamable HTTP 传输，优先 Streamable HTTP

**MCP Tool 注册规范：**

| 字段 | 必填 | 说明 |
|------|------|------|
| `name` | 是 | Tool 名称，kebab-case |
| `description` | 是 | 功能描述，供 LLM 理解 |
| `inputSchema` | 是 | JSON Schema 格式的参数定义 |
| `annotations` | 否 | `readOnlyHint`、`destructiveHint` 等语义标记 |

**MCP 集成架构：**

```
Agent (MCP Client)
  ├── MCP Server A (文件系统)
  ├── MCP Server B (数据库查询)
  └── MCP Server C (代码执行)
```

✅ Correct:

```python
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

class MCPAgent:
    def __init__(self):
        self.mcp_sessions: dict[str, ClientSession] = {}

    async def connect_server(self, name: str, command: str, args: list[str]):
        server_params = StdioServerParameters(command=command, args=args)
        async with stdio_client(server_params) as (read, write):
            session = ClientSession(read, write)
            await session.initialize()
            self.mcp_sessions[name] = session

    async def list_tools(self) -> list[Tool]:
        all_tools = []
        for name, session in self.mcp_sessions.items():
            result = await session.list_tools()
            for tool in result.tools:
                all_tools.append(Tool(
                    name=f"{name}__{tool.name}",
                    description=tool.description,
                    input_schema=tool.inputSchema,
                    source=name,
                ))
        return all_tools

    async def invoke_tool(self, tool_name: str, params: dict):
        server_name, _, local_name = tool_name.partition("__")
        session = self.mcp_sessions[server_name]
        result = await session.call_tool(local_name, arguments=params)
        return result
```

❌ Wrong:

```python
class Agent:
    def __init__(self):
        self.tools = {
            "fs": FileSystemAPI(base_url="http://internal:8080"),
            "db": DatabaseAPI(connection_string="mysql://..."),
        }

    def invoke(self, tool_name: str, params: dict):
        return self.tools[tool_name].call(params)
```

> 使用自定义 API 直接集成，无标准协议、无 Tool 发现、无 Schema 声明。

**MCP 与 Agent 安全联动：**

- MCP Tool 的 `destructiveHint: true` 必须映射到 Agent 的审批流程
- MCP Tool 的 `readOnlyHint: true` 可跳过审批，但仍需记录日志
- MCP Server 连接失败时，Agent 必须执行 Fallback，不得阻塞整个任务

---

## Checklist

- [ ] Agent 明确声明架构模式（ReAct / Plan-and-Execute / Multi-Agent）
- [ ] 核心组件（Tool / Memory / Planning）职责清晰分离
- [ ] 每个 Tool 声明完整 Schema、描述、幂等性和危险标记
- [ ] Memory 区分三层架构（短期 / 工作 / 长期），各层独立管理
- [ ] Planning 支持任务分解与动态 Replan，Replan 超限暂停
- [ ] Multi-Agent 明确协作模式，定义通信协议和冲突解决机制
- [ ] Agent 实现权限控制、沙箱隔离和输入校验
- [ ] Agent 实现三层可观测性（日志 / Tracing / 指标）
- [ ] Agent 实现三层测试策略（单元 / 集成 / E2E）
- [ ] Agent 实现 Fallback、重试（指数退避）和超时机制
- [ ] 危险操作和高价值决策引入 Human-in-the-Loop 审批
- [ ] 优先通过 MCP 协议集成外部 Tool，实现跨平台互操作
