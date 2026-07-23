# MCP

## Overview

MCP（Model Context Protocol）规范，涵盖协议架构、Tool / Resource / Prompt 定义、Transport 选择、错误处理、安全、生命周期管理、版本兼容与性能调优。适用于所有 MCP Server 开发与 Host / Client 集成场景。

---

## Rules

### R01 — 协议架构

**MUST** — MCP 系统必须遵循 Host / Client / Server 三层架构：

| 角色 | 职责 | 示例 |
|------|------|------|
| Host | 顶层应用，管理 Client 实例，协调用户交互 | Claude Desktop、VS Code、Trae |
| Client | 与单个 Server 建立一对一连接，负责协议协商与消息路由 | Host 内部的 MCP Client 实例 |
| Server | 提供工具、资源、Prompt 等能力，响应 Client 请求 | 文件系统 Server、数据库 Server |

**架构约束：**

- 一个 Host 可包含多个 Client
- 一个 Client 仅连接一个 Server
- Client 与 Server 之间通过 Transport 层通信
- Server 之间不得直接通信

✅ Correct:

```
┌─────────────────────── Host ───────────────────────┐
│                                                     │
│  ┌─ Client A ──┐  ┌─ Client B ──┐  ┌─ Client C ─┐ │
│  │             │  │             │  │             │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘ │
└─────────┼────────────────┼────────────────┼────────┘
          │                │                │
    ┌─────▼─────┐    ┌─────▼─────┐    ┌─────▼─────┐
    │ Server A  │    │ Server B  │    │ Server C  │
    │ (Files)   │    │ (Database)│    │ (Git)     │
    └───────────┘    └───────────┘    └───────────┘
```

❌ Wrong:

```
┌─────────────────────── Host ───────────────────────┐
│                                                     │
│  ┌─ Client A ────────────────────────────────────┐ │
│  │         连接多个 Server（违反一对一约束）        │ │
│  └──────┬──────────────────┬──────────────────────┘ │
└─────────┼──────────────────┼────────────────────────┘
          │                  │
    ┌─────▼─────┐      ┌─────▼─────┐
    │ Server A  │◄────►│ Server B  │  ← Server 之间直接通信
    └───────────┘      └───────────┘
```

---

### R02 — Tool 定义规范

**MUST** — 每个 Tool 必须包含 `name`、`description`、`inputSchema`，**SHOULD** 包含 `annotations`：

| 字段 | 必填 | 说明 |
|------|------|------|
| `name` | 是 | 动词 + 名词，snake_case，全局唯一 |
| `description` | 是 | 清晰描述功能、输入、输出与副作用 |
| `inputSchema` | 是 | JSON Schema 定义参数，必须声明 `type: "object"` |
| `annotations` | 否 | 声明 Tool 的行为特征，辅助 Host 决策 |

**`annotations` 字段说明：**

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `readOnlyHint` | boolean | false | 是否只读（无副作用） |
| `destructiveHint` | boolean | false | 是否具有破坏性 |
| `idempotentHint` | boolean | false | 是否幂等 |
| `openWorldHint` | boolean | false | 是否访问外部网络 |

✅ Correct:

```json
{
  "name": "delete_file",
  "description": "Delete a file at the specified path. This operation is irreversible.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "path": {
        "type": "string",
        "description": "Absolute path of the file to delete"
      }
    },
    "required": ["path"]
  },
  "annotations": {
    "readOnlyHint": false,
    "destructiveHint": true,
    "idempotentHint": true,
    "openWorldHint": false
  }
}
```

❌ Wrong:

```json
{
  "name": "delete",
  "description": "Delete something",
  "inputSchema": {
    "type": "object"
  }
}
```

**错误点：**

- `name` 缺少名词，语义不清
- `description` 过于模糊，未说明输入输出与副作用
- `inputSchema` 未定义 `properties` 和 `required`
- 缺少 `annotations`，Host 无法判断是否需要用户确认

---

### R03 — Resource 定义规范

**MUST** — 每个 Resource 必须包含 `uri`、`name`，**SHOULD** 包含 `description`、`mimeType`：

| 字段 | 必填 | 说明 |
|------|------|------|
| `uri` | 是 | 资源唯一标识，必须遵循 URI 规范 |
| `name` | 是 | 人类可读的资源名称 |
| `description` | 否 | 资源内容描述 |
| `mimeType` | 否 | MIME 类型，辅助 Client 解析 |

**URI 模板规范：**

- 使用 RFC 6570 URI Template 表达动态参数
- 静态资源使用完整 URI
- 动态资源使用模板变量

✅ Correct:

```json
{
  "uri": "file:///project/src/{path}",
  "name": "Project Source File",
  "description": "A source file in the project src directory",
  "mimeType": "text/plain"
}
```

**Resource 列表与读取：**

- `resources/list`：返回 Server 暴露的静态资源列表
- `resources/read`：根据 URI 读取资源内容
- `resources/templates/list`：返回动态资源的 URI 模板

**订阅机制（SHOULD）：**

当 Server 声明 `resources/subscribe` 能力时，Client 可订阅资源变更：

```json
{
  "method": "resources/subscribe",
  "params": {
    "uri": "file:///project/config.json"
  }
}
```

资源变更时 Server 主动推送通知：

```json
{
  "method": "notifications/resources/updated",
  "params": {
    "uri": "file:///project/config.json"
  }
}
```

❌ Wrong:

```json
{
  "uri": "my-resource",
  "name": "Resource"
}
```

**错误点：**

- `uri` 不符合 URI 规范，缺少 scheme
- `name` 过于笼统
- 缺少 `mimeType`，Client 无法正确解析内容

---

### R04 — Prompt Template 定义

**MUST** — 每个 Prompt 必须包含 `name`、`description`、`arguments`、`messages`：

| 字段 | 必填 | 说明 |
|------|------|------|
| `name` | 是 | Prompt 标识符，snake_case |
| `description` | 是 | 描述 Prompt 的用途与适用场景 |
| `arguments` | 是 | 参数定义数组，每个参数含 `name`、`description`、`required` |
| `messages` | 是 | 消息模板数组，支持参数插值 |

**参数插值语法：** 使用 `{{argument_name}}` 引用参数值。

✅ Correct:

```json
{
  "name": "code_review",
  "description": "Generate a code review for the given code snippet",
  "arguments": [
    {
      "name": "code",
      "description": "The code snippet to review",
      "required": true
    },
    {
      "name": "language",
      "description": "Programming language of the code",
      "required": false
    }
  ],
  "messages": [
    {
      "role": "user",
      "content": {
        "type": "text",
        "text": "Please review the following {{language}} code:\n\n{{code}}"
      }
    }
  ]
}
```

❌ Wrong:

```json
{
  "name": "review",
  "description": "Review code",
  "arguments": [],
  "messages": [
    {
      "role": "user",
      "content": "Review this code"
    }
  ]
}
```

**错误点：**

- `name` 语义不清
- `description` 过于简略
- `arguments` 为空数组，Prompt 无参数化能力
- `messages` 中 `content` 应为对象格式（含 `type` 和 `text`），非纯字符串
- 未使用参数插值，丧失模板灵活性

---

### R05 — Transport 选择

**SHOULD** — 根据部署场景选择合适的 Transport：

| Transport | 适用场景 | 连接方向 | 多 Client | 部署复杂度 |
|-----------|---------|---------|-----------|-----------|
| stdio | 本地 CLI / 桌面应用集成 | Client → Server 进程 | 否（1:1） | 低 |
| SSE (HTTP + Server-Sent Events) | Web 集成、远程 Server | Client → Server HTTP | 是 | 中 |
| Streamable HTTP | 现代化 HTTP 集成、远程 Server | Client ↔ Server HTTP | 是 | 中 |

**选择决策：**

```
本地进程间通信？
  ├─ 是 → stdio
  └─ 否 → 需要向后兼容旧版 MCP？
              ├─ 是 → SSE
              └─ 否 → Streamable HTTP
```

✅ Correct:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/project"],
      "transport": "stdio"
    },
    "remote-api": {
      "url": "https://api.example.com/mcp",
      "transport": "streamable-http"
    }
  }
}
```

❌ Wrong:

```json
{
  "mcpServers": {
    "filesystem": {
      "url": "http://localhost:3000/mcp",
      "transport": "sse"
    }
  }
}
```

**错误点：**

- 本地文件系统 Server 使用远程 HTTP Transport，引入不必要的网络开销与延迟
- 应使用 stdio 直接启动本地进程

---

### R06 — 错误处理

**MUST** — MCP 实现必须遵循统一的错误处理规范：

**标准错误码：**

| 错误码 | 含义 | 使用场景 |
|--------|------|---------|
| `-32700` | Parse error | JSON 解析失败 |
| `-32600` | Invalid Request | 请求不符合 JSON-RPC 规范 |
| `-32601` | Method not found | 调用不存在的方法 |
| `-32602` | Invalid params | 参数校验失败 |
| `-32603` | Internal error | Server 内部错误 |
| `-32000` 到 `-32099` | 自定义错误 | Server 自定义业务错误 |

**错误传播规则：**

- Server 错误必须通过 JSON-RPC `error` 字段返回，不得用 `result` 包裹
- Client 收到错误后必须向 Host 传播，不得静默吞掉
- Host 应根据错误类型决定是否重试、降级或通知用户

✅ Correct:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32602,
    "message": "Invalid params",
    "data": {
      "field": "path",
      "reason": "Path traversal detected: ../etc/passwd"
    }
  }
}
```

❌ Wrong:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "status": "error",
    "message": "Something went wrong"
  }
}
```

**错误点：**

- 使用 `result` 包裹错误，违反 JSON-RPC 规范
- 错误信息过于模糊，无法定位问题
- 缺少标准错误码

**重试策略（SHOULD）：**

| 错误类型 | 是否重试 | 策略 |
|---------|---------|------|
| Parse error | 否 | 修复请求格式 |
| Invalid params | 否 | 修正参数 |
| Method not found | 否 | 检查方法名与版本 |
| Internal error | 是 | 指数退避，最多 3 次 |
| 网络超时 | 是 | 指数退避，最多 3 次 |
| 自定义业务错误 | 视场景 | 根据错误码决定 |

---

### R07 — MCP 安全

**MUST** — MCP 实现必须满足以下安全要求：

**认证与授权：**

| 场景 | 认证方式 | 说明 |
|------|---------|------|
| stdio | 操作系统权限 | 依赖进程级隔离 |
| SSE / Streamable HTTP | OAuth 2.0 / API Key | 必须使用 HTTPS |
| 跨域访问 | CORS + Origin 校验 | 限制可信 Origin |

**输入校验（MUST）：**

- 所有 Tool 参数必须通过 `inputSchema` 校验
- 禁止路径穿越（`../`、`..\\`）
- 禁止命令注入（`;`、`|`、`&&`）
- 字符串参数必须限制长度

✅ Correct:

```python
def validate_path(path: str, base_dir: str) -> str:
    resolved = os.path.realpath(os.path.join(base_dir, path))
    if not resolved.startswith(os.path.realpath(base_dir)):
        raise ValueError("Path traversal detected")
    return resolved
```

❌ Wrong:

```python
def read_file(path: str) -> str:
    with open(path, "r") as f:
        return f.read()
```

**错误点：**

- 未校验路径是否在允许范围内
- 直接使用用户输入的路径，存在路径穿越风险

**沙箱隔离（SHOULD）：**

- Server 应在沙箱环境中执行不可信操作
- 文件操作限制在项目目录内
- 网络请求需要白名单
- 禁止执行未经确认的破坏性操作（`destructiveHint: true` 的 Tool 需 Host 显式确认）

**敏感信息（MUST）：**

- Tool 返回值不得包含 AccessKey、Secret、Token、Password
- Resource 内容不得暴露 `.env`、`*.key`、`*.pem` 文件
- 日志中不得记录敏感参数

---

### R08 — Server 生命周期管理

**MUST** — MCP Server 必须正确实现三个生命周期阶段：

**阶段一：初始化（Initialization）**

```
Client                              Server
  │                                    │
  │─── initialize ───────────────────►│
  │                                    │
  │◄── result (capabilities, info) ───│
  │                                    │
  │─── notifications/initialized ────►│
  │                                    │
```

- Client 发送 `initialize` 请求，携带协议版本与自身能力
- Server 响应自身能力与支持的协议版本
- Client 发送 `notifications/initialized` 通知，完成握手
- 握手完成前，双方仅允许 `initialize` 和 `ping`

**阶段二：运行（Operation）**

- 正常处理 Tool / Resource / Prompt 请求
- 支持通过 `ping` 进行心跳检测
- 支持能力变更通知（`notifications/tools/list_changed` 等）

**阶段三：关闭（Shutdown）**

- Client 或 Server 均可主动关闭连接
- 关闭前应完成进行中的请求
- 释放资源（文件句柄、数据库连接、网络连接）

✅ Correct:

```python
class MCPServer:
    async def handle_initialize(self, params):
        self.client_capabilities = params.get("capabilities", {})
        self.protocol_version = self._negotiate_version(
            params.get("protocolVersion")
        )
        return {
            "protocolVersion": self.protocol_version,
            "capabilities": {
                "tools": {"listChanged": True},
                "resources": {"subscribe": True},
            },
            "serverInfo": {
                "name": "my-mcp-server",
                "version": "1.0.0",
            },
        }

    async def shutdown(self):
        await self._close_db_connections()
        await self._flush_pending_requests()
```

❌ Wrong:

```python
class MCPServer:
    async def handle_initialize(self, params):
        return {"status": "ok"}

    async def shutdown(self):
        pass
```

**错误点：**

- 未返回 `protocolVersion`，无法进行版本协商
- 未返回 `capabilities`，Client 无法发现 Server 能力
- 未返回 `serverInfo`，缺少 Server 标识
- 关闭时未释放资源

**健康检查（SHOULD）：**

- Server 应响应 `ping` 请求
- Host 应定期 ping 检测 Server 存活状态
- 超时未响应应标记为 Server 标记为不可用并尝试重连

---

### R09 — 版本与兼容性

**MUST** — MCP 实现必须正确处理协议版本协商与能力声明：

**协议版本协商：**

- Client 在 `initialize` 中发送支持的协议版本
- Server 必须返回双方共同支持的最高版本
- 若无共同版本，Server 返回错误，Client 应终止连接

**当前协议版本：**

| 版本 | 状态 | 说明 |
|------|------|------|
| `2025-03-26` | Latest | 当前最新稳定版本 |
| `2024-11-05` | Deprecated | 旧版本，仍可兼容 |
| `2024-10-07` | Deprecated | 早期版本 |

✅ Correct:

```python
SUPPORTED_VERSIONS = ["2025-03-26", "2024-11-05"]

def negotiate_version(client_version: str) -> str:
    if client_version in SUPPORTED_VERSIONS:
        return client_version
    for version in SUPPORTED_VERSIONS:
        if version >= client_version:
            return version
    raise VersionNegotiationError(
        f"No compatible version found. "
        f"Client: {client_version}, "
        f"Server supports: {SUPPORTED_VERSIONS}"
    )
```

❌ Wrong:

```python
def negotiate_version(client_version: str) -> str:
    return "2025-03-26"
```

**错误点：**

- 忽略 Client 版本，强制返回最新版本
- 若 Client 不支持该版本，将导致后续通信失败

**能力声明（MUST）：**

- 双方必须在 `initialize` 中声明自身能力
- 未声明的能力不得使用
- 新增能力不得破坏已有功能

**向后兼容（MUST）：**

- Server 新增可选字段不得影响旧 Client
- Server 新增 Tool / Resource 不得影响旧 Client
- 废弃能力必须提供替代方案并保留至少一个大版本周期

---

### R10 — 性能与超时

**SHOULD** — MCP 实现应遵循以下性能与超时规范：

**超时设置：**

| 操作类型 | 建议超时 | 说明 |
|---------|---------|------|
| `initialize` | 30s | 初始化允许较长等待 |
| `ping` | 5s | 心跳检测应快速响应 |
| `tools/call` | 60s | 工具调用视复杂度调整 |
| `resources/read` | 30s | 资源读取 |
| `prompts/get` | 10s | Prompt 模板渲染 |

✅ Correct:

```python
class MCPClient:
    TIMEOUT_CONFIG = {
        "initialize": 30,
        "ping": 5,
        "tools/call": 60,
        "resources/read": 30,
        "prompts/get": 10,
    }

    async def send_request(self, method: str, params: dict):
        timeout = self.TIMEOUT_CONFIG.get(method, 30)
        try:
            return await asyncio.wait_for(
                self._transport.send(method, params),
                timeout=timeout,
            )
        except asyncio.TimeoutError:
            raise MCPTimeoutError(
                f"Request {method} timed out after {timeout}s"
            )
```

❌ Wrong:

```python
async def send_request(self, method: str, params: dict):
    return await self._transport.send(method, params)
```

**错误点：**

- 未设置超时，请求可能无限等待
- 缺少超时异常处理

**并发控制（SHOULD）：**

- Server 应限制单个 Client 的并发请求数（建议 ≤ 10）
- Server 应限制总并发连接数
- 超出限制时返回 `-32000` 自定义错误

**资源限制（SHOULD）：**

| 资源 | 建议限制 | 说明 |
|------|---------|------|
| 单次 Tool 调用内存 | ≤ 512MB | 防止内存溢出 |
| 单次 Tool 返回数据 | ≤ 10MB | 超出应分页或截断 |
| Resource 内容大小 | ≤ 50MB | 大文件应分段读取 |
| 并发请求数 | ≤ 10 / Client | 防止资源耗尽 |
| 连接保持时间 | ≤ 24h | 长连接应定期重连 |

✅ Correct:

```python
class ToolExecutor:
    MAX_RESULT_SIZE = 10 * 1024 * 1024  # 10MB

    async def execute(self, tool_name: str, arguments: dict):
        result = await self._run_tool(tool_name, arguments)
        if len(json.dumps(result)) > self.MAX_RESULT_SIZE:
            return {
                "isError": True,
                "content": [
                    {
                        "type": "text",
                        "text": f"Result exceeds {self.MAX_RESULT_SIZE // 1024 // 1024}MB limit. Use pagination."
                    }
                ]
            }
        return result
```

❌ Wrong:

```python
async def execute(self, tool_name: str, arguments: dict):
    return await self._run_tool(tool_name, arguments)
```

**错误点：**

- 未限制返回数据大小，可能导致 Client 内存溢出
- 未对工具执行设置资源上限

---

## Checklist

- [ ] 遵循 Host / Client / Server 三层架构，Client 与 Server 一对一连接
- [ ] Tool 定义包含 name、description、inputSchema、annotations
- [ ] Resource 定义包含 URI（符合 URI 规范）、name、mimeType
- [ ] Prompt Template 定义包含 name、description、arguments、messages，使用 `{{param}}` 插值
- [ ] Transport 选择与部署场景匹配（本地 stdio / 远程 Streamable HTTP）
- [ ] 错误通过 JSON-RPC error 字段返回，使用标准错误码
- [ ] 输入校验防止路径穿越与命令注入，敏感信息不得暴露
- [ ] Server 正确实现 initialize / operation / shutdown 生命周期
- [ ] 协议版本协商返回双方共同支持的最高版本
- [ ] 请求设置合理超时，Tool 返回数据限制在 10MB 以内
