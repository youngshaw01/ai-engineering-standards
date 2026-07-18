# MCP Server

> Model Context Protocol Server development standards.

---

## Overview

MCP（Model Context Protocol）Server 开发规范，适用于为 AI 工具提供扩展能力。

---

## Rules

### R01 — 工具定义

**MUST** — 每个 MCP 工具必须包含：

- 清晰的名称（动词 + 名词）
- 完整的参数描述（类型、必填/可选、默认值）
- 返回值结构定义
- 错误码定义

✅ Correct:

```json
{
  "name": "search_files",
  "description": "Search files by name pattern in the workspace",
  "parameters": {
    "pattern": {
      "type": "string",
      "required": true,
      "description": "Glob pattern to match file names"
    },
    "max_results": {
      "type": "integer",
      "required": false,
      "default": 10,
      "description": "Maximum number of results to return"
    }
  }
}
```

❌ Wrong:

```json
{
  "name": "search",
  "description": "Search stuff"
}
```

---

### R02 — 错误处理

**MUST** — MCP Server 必须实现完善的错误处理：

- 参数校验错误 → 明确的错误信息
- 外部服务不可用 → 降级响应
- 超时 → 合理的超时时间和重试策略
- 权限不足 → 清晰的权限提示

---

### R03 — 安全原则

**MUST** — MCP Server 必须遵循安全原则：

- 不得暴露敏感信息
- 不得执行未经确认的破坏性操作
- 文件操作限制在项目目录内
- 网络请求需要白名单

---

### R04 — Transport 选择

**SHOULD** — 根据场景选择合适的 Transport：

| Transport | 适用场景 |
|-----------|---------|
| stdio | 本地 CLI 工具 |
| SSE | Web 集成 |
| Streamable HTTP | 现代化 HTTP 集成 |

---

## Checklist

- [ ] 工具定义包含完整的参数描述和返回值结构
- [ ] 错误处理覆盖所有异常场景
- [ ] 安全原则已遵循
- [ ] Transport 选择合理
