# API

## Overview

RESTful API 设计规范，涵盖 URL 设计、请求/响应格式、版本控制、错误处理、分页、认证等。适用于所有对外和对内的 HTTP API。

---

## Rules

### R01 — URL 设计

**MUST** — URL 必须遵循以下规则：

- 使用名词复数表示资源
- 使用 kebab-case
- 嵌套资源最多两层
- 不使用动词（动作由 HTTP Method 表达）

✅ Correct:

```
GET  /api/v1/users
GET  /api/v1/users/123
GET  /api/v1/users/123/orders
POST /api/v1/users
PUT  /api/v1/users/123
```

❌ Wrong:

```
GET  /api/v1/getUsers
POST /api/v1/user/create
GET  /api/v1/users/123/orders/456/items/789
GET  /api/v1/User
POST /api/v1/addUser
```

---

### R02 — HTTP Method 语义

**MUST** — 严格遵循 HTTP Method 语义：

| Method | 语义 | 幂等 | 安全 |
|--------|------|------|------|
| `GET` | 查询资源 | 是 | 是 |
| `POST` | 创建资源 / 触发动作 | 否 | 否 |
| `PUT` | 全量更新资源 | 是 | 否 |
| `PATCH` | 部分更新资源 | 否 | 否 |
| `DELETE` | 删除资源 | 是 | 否 |

✅ Correct:

```
POST   /api/v1/users          → 创建用户
GET    /api/v1/users/123      → 查询用户
PUT    /api/v1/users/123      → 全量更新用户
PATCH  /api/v1/users/123      → 部分更新用户
DELETE /api/v1/users/123      → 删除用户
```

❌ Wrong:

```
POST /api/v1/users/123        → 用 POST 查询用户
GET  /api/v1/users/123/delete → 用 GET 删除用户
PUT  /api/v1/users/123        → 只传了 name 字段做部分更新
```

---

### R03 — HTTP Status Code

**MUST** — 使用标准 HTTP 状态码，不自定义状态码：

| Code | 含义 | 使用场景 |
|------|------|---------|
| `200` | OK | GET / PUT / PATCH 成功 |
| `201` | Created | POST 创建成功 |
| `204` | No Content | DELETE 成功 |
| `400` | Bad Request | 请求参数错误 |
| `401` | Unauthorized | 未认证 |
| `403` | Forbidden | 无权限 |
| `404` | Not Found | 资源不存在 |
| `409` | Conflict | 资源冲突（如唯一约束） |
| `422` | Unprocessable Entity | 参数校验失败 |
| `429` | Too Many Requests | 限流 |
| `500` | Internal Server Error | 服务器内部错误 |

**禁止用 200 包裹错误：**

✅ Correct:

```json
HTTP 404

{
  "code": "USER_NOT_FOUND",
  "message": "User 123 not found"
}
```

❌ Wrong:

```json
HTTP 200

{
  "code": 404,
  "message": "User not found",
  "data": null
}
```

---

### R04 — 统一响应格式

**MUST** — 响应体必须遵循统一格式：

#### 单个资源

```json
{
  "code": "SUCCESS",
  "message": "OK",
  "data": {
    "id": 123,
    "name": "Alice"
  }
}
```

#### 集合（带分页）

```json
{
  "code": "SUCCESS",
  "message": "OK",
  "data": {
    "items": [
      { "id": 1, "name": "Alice" },
      { "id": 2, "name": "Bob" }
    ],
    "pagination": {
      "page": 1,
      "size": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

#### 错误

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "errors": [
    { "field": "email", "message": "Invalid email format" },
    { "field": "age", "message": "Must be a positive integer" }
  ]
}
```

---

### R05 — 错误码设计

**MUST** — 使用字符串错误码，不使用数字错误码：

```
<DOMAIN>_<ERROR_TYPE>

示例：
USER_NOT_FOUND
USER_ALREADY_EXISTS
VALIDATION_ERROR
AUTH_TOKEN_EXPIRED
AUTH_PERMISSION_DENIED
RATE_LIMIT_EXCEEDED
INTERNAL_ERROR
```

**错误码分类：**

| 前缀 | 领域 | 示例 |
|------|------|------|
| `AUTH_` | 认证授权 | `AUTH_TOKEN_EXPIRED` |
| `USER_` | 用户 | `USER_NOT_FOUND` |
| `ORDER_` | 订单 | `ORDER_STATUS_INVALID` |
| `PAYMENT_` | 支付 | `PAYMENT_FAILED` |
| `VALIDATION_` | 校验 | `VALIDATION_ERROR` |
| `RATE_` | 限流 | `RATE_LIMIT_EXCEEDED` |
| `INTERNAL_` | 内部错误 | `INTERNAL_ERROR` |

---

### R06 — API 版本控制

**MUST** — API 必须包含版本号，使用 URL Path 方式：

```
/api/v1/users
/api/v2/users
```

**版本升级规则：**

| 变更类型 | 版本变化 | 示例 |
|----------|---------|------|
| 新增字段（兼容） | 不升级 | 响应增加 `nickname` 字段 |
| 新增端点（兼容） | 不升级 | 新增 `GET /v1/users/search` |
| 删除字段 | Major +1 | `v1` → `v2` |
| 修改字段语义 | Major +1 | `v1` → `v2` |
| 修改响应结构 | Major +1 | `v1` → `v2` |

**旧版本保留至少 6 个月**，提前 3 个月通知下线。

---

### R07 — 分页规范

**MUST** — 集合接口必须支持分页：

#### 请求参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `page` | integer | 1 | 页码（从 1 开始） |
| `size` | integer | 20 | 每页条数（最大 100） |

```
GET /api/v1/users?page=2&size=20
```

#### 响应格式

```json
{
  "data": {
    "items": [],
    "pagination": {
      "page": 2,
      "size": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

**禁止返回不带分页的全量数据**，除非数据量可确定很小（如字典表）。

---

### R08 — 过滤与排序

**SHOULD** — 集合接口支持过滤和排序：

```
# 过滤
GET /api/v1/users?status=active&role=admin

# 排序（默认升序，-前缀降序）
GET /api/v1/users?sort=created_at
GET /api/v1/users?sort=-created_at
GET /api/v1/users?sort=name,-created_at

# 组合
GET /api/v1/users?status=active&sort=-created_at&page=1&size=20
```

---

### R09 — 认证

**MUST** — API 必须使用 Bearer Token 认证：

```
Authorization: Bearer <token>
```

**禁止将 Token 放在 URL 参数中：**

❌ Wrong:

```
GET /api/v1/users?token=abc123
```

---

### R10 — 请求体格式

**MUST** — 请求体使用 JSON：

```
Content-Type: application/json
```

**字段命名使用 camelCase：**

✅ Correct:

```json
{
  "firstName": "Alice",
  "lastName": "Smith",
  "emailAddress": "alice@example.com"
}
```

❌ Wrong:

```json
{
  "first_name": "Alice",
  "FirstName": "Alice",
  "EMAIL": "alice@example.com"
}
```

---

### R11 — 响应字段命名

**MUST** — 响应字段使用 camelCase，与请求体一致：

```json
{
  "id": 123,
  "firstName": "Alice",
  "createdAt": "2024-01-15T08:30:00Z",
  "updatedAt": "2024-01-15T08:30:00Z"
}
```

---

### R12 — 时间格式

**MUST** — 时间字段必须使用 ISO 8601 格式：

```
2024-01-15T08:30:00Z           # UTC
2024-01-15T16:30:00+08:00      # 带时区
```

**禁止使用以下格式：**

❌ Wrong:

```
2024/01/15
01-15-2024
1705312200
2024-01-15 08:30:00
```

---

### R13 — 空值处理

**MUST** — 响应中空值字段的处理：

- 字符串：返回空字符串 `""` 或 `null`（团队统一）
- 数字：返回 `0` 或 `null`（团队统一）
- 数组：返回空数组 `[]`，不返回 `null`
- 对象：返回 `null`，不返回 `{}`

**团队必须在项目初期统一空值策略。**

---

### R14 — 批量操作

**SHOULD** — 批量操作使用专门的端点：

```
POST /api/v1/users/batch
{
  "operations": [
    { "action": "create", "data": { "name": "Alice" } },
    { "action": "update", "id": 123, "data": { "name": "Bob" } },
    { "action": "delete", "id": 456 }
  ]
}
```

**批量操作限制：**

- 单次最多 100 条
- 部分失败时返回每条操作的结果
- 使用事务保证原子性（或明确说明非原子性）

---

### R15 — 限流

**MUST** — 对外 API 必须实现限流：

**响应头：**

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705312200
```

**超限时返回：**

```
HTTP 429 Too Many Requests

{
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Rate limit exceeded. Retry after 60 seconds.",
  "retryAfter": 60
}
```

---

### R16 — 幂等性

**MUST** — 写操作应考虑幂等性：

| Method | 幂等性 | 实现方式 |
|--------|--------|---------|
| `POST` | 非幂等 | 使用 `Idempotency-Key` 请求头 |
| `PUT` | 幂等 | 全量替换 |
| `PATCH` | 视实现而定 | 使用条件更新（ETag / If-Match） |
| `DELETE` | 幂等 | 重复删除返回 204 |

**Idempotency-Key 示例：**

```
POST /api/v1/orders
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000

{
  "productId": 123,
  "quantity": 1
}
```

服务端保存 Key 与响应的映射，相同 Key 返回缓存的响应。

---

### R17 — CORS

**MUST** — API 必须正确配置 CORS：

```
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type, Idempotency-Key
Access-Control-Max-Age: 86400
```

**禁止使用 `Access-Control-Allow-Origin: *`** 用于需要认证的 API。

---

### R18 — API 文档

**MUST** — 所有 API 必须有文档，使用 OpenAPI 3.0+ 规范：

```yaml
openapi: 3.0.3
info:
  title: User Service API
  version: 1.0.0
paths:
  /api/v1/users:
    get:
      summary: List users
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: size
          in: query
          schema:
            type: integer
            default: 20
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserListResponse'
```

---

### R19 — 健康检查

**MUST** — 服务必须提供健康检查端点：

```
GET /health

200 OK
{
  "status": "UP",
  "version": "1.2.0",
  "uptime": "30d 12h 30m"
}
```

---

### R20 — 废弃 API 处理

**MUST** — 废弃 API 必须在响应头中标记：

```
Deprecation: true
Sunset: Sat, 01 Jan 2025 00:00:00 GMT
Link: </api/v2/users>; rel="successor-version"
```

---

## Checklist

- [ ] URL 使用名词复数、kebab-case
- [ ] HTTP Method 语义正确
- [ ] 使用标准 HTTP Status Code
- [ ] 响应体格式统一
- [ ] 错误码使用字符串（`DOMAIN_ERROR_TYPE`）
- [ ] API 包含版本号（URL Path 方式）
- [ ] 集合接口支持分页
- [ ] 时间使用 ISO 8601 格式
- [ ] 字段命名使用 camelCase
- [ ] 认证使用 Bearer Token
- [ ] 写操作考虑幂等性
- [ ] 对外 API 实现限流
- [ ] CORS 配置正确
- [ ] API 文档使用 OpenAPI 3.0+
- [ ] 提供健康检查端点
- [ ] 废弃 API 标记 Deprecation + Sunset
