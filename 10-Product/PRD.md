# PRD

## Overview

产品需求文档（Product Requirements Document）工程规范，涵盖 PRD 结构、用户故事格式、需求优先级排序、验收标准定义、非功能性需求、API 契约、数据模型、PRD 评审流程。适用于所有需要编写产品需求文档的场景。

---

## Rules

### R01 — PRD 结构规范

**MUST** — PRD 必须包含以下核心章节：

- **背景与目标**：说明为什么做这个功能，期望达成什么目标
- **范围定义**：明确包含和不包含的内容
- **用户故事**：以用户视角描述需求
- **功能需求**：详细的功能点描述
- **非功能性需求**：性能、安全、可用性等要求
- **API 契约**：接口定义（如适用）
- **数据模型**：数据库表结构（如适用）
- **验收标准**：明确的完成条件

**PRD 模板结构：**

```markdown
# {产品/功能名称} PRD

## 1. 背景与目标
### 1.1 背景
### 1.2 目标
### 1.3 成功指标

## 2. 范围定义
### 2.1 包含内容
### 2.2 不包含内容
### 2.3 依赖关系

## 3. 用户故事
### 3.1 用户画像
### 3.2 用户故事列表

## 4. 功能需求
### 4.1 功能模块一
### 4.2 功能模块二

## 5. 非功能性需求
### 5.1 性能要求
### 5.2 安全要求
### 5.3 可用性要求

## 6. API 契约
### 6.1 接口列表
### 6.2 接口详情

## 7. 数据模型
### 7.1 实体关系图
### 7.2 表结构定义

## 8. 验收标准
### 8.1 功能验收
### 8.2 非功能验收

## 9. 时间计划
### 9.1 里程碑
### 9.2 交付物

## 10. 风险与依赖
```

✅ Correct:

```markdown
# 用户登录功能 PRD

## 1. 背景与目标

### 1.1 背景
当前系统缺少统一的用户认证机制，各模块独立管理用户信息，导致：
- 用户体验差，需要多次登录
- 安全隐患，密码策略不一致
- 运维成本高，难以统一管理

### 1.2 目标
构建统一的用户认证中心，实现：
- 单点登录（SSO）
- 多因素认证（MFA）
- 统一的权限管理

### 1.3 成功指标
- 登录成功率 > 99%
- 平均登录时间 < 2 秒
- 用户满意度 > 4.5/5

## 2. 范围定义

### 2.1 包含内容
- 用户名密码登录
- 手机验证码登录
- 第三方 OAuth 登录（微信、Google）
- 会话管理
- 密码找回

### 2.2 不包含内容
- 用户注册流程（由其他 PRD 覆盖）
- 权限细粒度控制（RBAC 由其他 PRD 覆盖）

## 3. 用户故事
...
```

❌ Wrong:

```markdown
# 登录功能

## 背景
要做登录功能。

## 需求
1. 支持用户名密码登录
2. 支持手机登录
3. 支持第三方登录

# ❌ 缺少目标和成功指标
# ❌ 没有范围定义
# ❌ 没有用户故事
# ❌ 没有验收标准
```

---

### R02 — 用户故事格式

**MUST** — 用户故事必须遵循以下格式：

```
作为 <角色>，我希望 <功能>，以便 <价值>
```

**用户故事三要素：**

| 要素 | 说明 | 示例 |
|------|------|------|
| 角色 | 谁在使用 | 普通用户、管理员、游客 |
| 功能 | 想要什么 | 能够通过手机号登录 |
| 价值 | 为什么需要 | 忘记密码时也能快速登录 |

✅ Correct:

```markdown
## 用户故事列表

### US-001: 用户名密码登录
**作为** 已注册用户
**我希望** 使用用户名和密码登录系统
**以便** 访问我的个人数据

**验收标准：**
- Given 用户输入正确的用户名和密码
- When 点击登录按钮
- Then 成功跳转到首页
- And 显示欢迎消息

### US-002: 手机验证码登录
**作为** 已注册用户
**我希望** 使用手机号和验证码登录
**以便** 在忘记密码时也能登录

**验收标准：**
- Given 用户输入正确的手机号
- When 点击获取验证码
- Then 60 秒内收到短信验证码
- And 输入正确验证码后成功登录

### US-003: 第三方登录
**作为** 新用户
**我希望** 使用微信账号直接登录
**以便** 无需注册即可开始使用

**验收标准：**
- Given 用户选择微信登录
- When 授权成功后
- Then 自动创建账号并登录
- And 绑定微信账号
```

❌ Wrong:

```markdown
# ❌ 格式不完整
用户希望登录系统

# ❌ 缺少角色
作为用户，要能登录

# ❌ 没有价值说明
作为用户，我希望有登录功能
```

**用户故事拆分原则：**

| 原则 | 说明 | 示例 |
|------|------|------|
| 独立性 | 每个故事可独立交付 | 登录、注册分开 |
| 可协商性 | 细节可在开发中讨论 | 具体 UI 实现 |
| 有价值的 | 对用户有明确价值 | 完整的登录流程 |
| 可估算 | 团队能估算工作量 | 1-5 人天 |
| 小而精 | 单个故事 1-2 周完成 | 避免过大 |

---

### R03 — 需求优先级排序

**MUST** — 需求优先级必须使用 MoSCoW 方法分类：

- **Must Have（必须有）**：核心功能，缺失则系统无法运行
- **Should Have（应该有）**：重要功能，显著提升体验
- **Could Have（可以有）**：锦上添花的功能
- **Won't Have（本次不做）**：明确排除的需求

**MoSCoW 判定标准：**

| 级别 | 判定标准 | 示例 |
|------|---------|------|
| Must | MVP 核心，无此功能产品无法上线 | 用户登录、支付 |
| Should | 重要但非核心，有替代方案 | 记住密码、头像上传 |
| Could | 增强体验，不影响核心流程 | 动画效果、快捷键 |
| Won't | 明确记录但不在本期范围 | 未来可能的扩展 |

✅ Correct:

```markdown
## 需求优先级

### Must Have（MVP 核心）
| ID | 需求 | 原因 |
|----|------|------|
| F-001 | 用户名密码登录 | 基础认证方式 |
| F-002 | 会话管理 | 保持登录状态 |
| F-003 | 密码加密存储 | 安全合规要求 |

### Should Have（重要功能）
| ID | 需求 | 原因 |
|----|------|------|
| F-004 | 手机验证码登录 | 提升用户体验 |
| F-005 | 登录失败提示 | 减少用户困惑 |
| F-006 | 记住我功能 | 方便常用设备 |

### Could Have（增强功能）
| ID | 需求 | 原因 |
|----|------|------|
| F-007 | 第三方 OAuth 登录 | 降低注册门槛 |
| F-008 | 生物识别登录 | 提升便捷性 |

### Won't Have（本期不做）
| ID | 需求 | 原因 |
|----|------|------|
| F-009 | 指纹登录 | 需硬件支持，覆盖率低 |
| F-010 | 人脸识别登录 | 隐私问题待评估 |
```

❌ Wrong:

```markdown
# ❌ 没有优先级分类
需求列表：
1. 登录功能
2. 验证码
3. 第三方登录

# ❌ 优先级模糊
高优先级：
- 登录功能（其实可以延后）
```

**优先级决策框架：**

```
是否影响核心业务流程？
├── 是 → Must Have
└── 否 → 继续判断
    ├── 是否显著提升用户体验？
    │   ├── 是 → Should Have
    │   └── 否 → 继续判断
    │       ├── 是否有低成本实现方案？
    │       │   ├── 是 → Could Have
    │       │   └── 否 → Won't Have
    │       └── 是否为未来扩展预留？
    │           └── 记录到 Won't Have
```

---

### R04 — 验收标准定义

**MUST** — 验收标准必须使用 Given/When/Then 格式：

- **Given（前置条件）**：执行前的状态或上下文
- **When（操作动作）**：用户执行的操作
- **Then（预期结果）**：期望的系统响应

**Gherkin 语法：**

✅ Correct:

```gherkin
Feature: 用户登录功能

  Scenario: 成功登录
    Given 用户已注册且账号状态正常
    And 用户在登录页面
    When 用户输入正确的用户名 "testuser"
    And 用户输入正确的密码 "password123"
    And 用户点击登录按钮
    Then 系统验证凭据成功
    And 用户被重定向到首页
    And 显示欢迎消息 "欢迎回来，testuser"
    And 创建会话 token

  Scenario: 登录失败 - 密码错误
    Given 用户已注册
    And 用户在登录页面
    When 用户输入正确的用户名
    And 用户输入错误的密码
    And 用户点击登录按钮
    Then 系统返回错误消息 "用户名或密码错误"
    And 不创建会话
    And 登录失败次数 +1

  Scenario: 登录失败 - 账号锁定
    Given 用户连续 5 次登录失败
    When 用户尝试登录
    Then 系统返回错误消息 "账号已被锁定，请 30 分钟后再试"
    And 发送通知邮件

  Scenario: 验证码登录
    Given 用户输入正确的手机号
    When 用户点击获取验证码
    Then 系统生成 6 位随机验证码
    And 发送短信验证码
    And 启动 60 秒倒计时
    And 禁用重新发送按钮

  Scenario: 验证码过期
    Given 用户已获取验证码
    And 等待超过 60 秒
    When 用户输入验证码并提交
    Then 系统返回错误消息 "验证码已过期"
    And 允许重新获取验证码
```

❌ Wrong:

```gherkin
# ❌ 缺少 Given 前置条件
Scenario: 登录成功
  When 用户输入正确的用户名和密码
  Then 登录成功

# ❌ 预期结果不明确
Scenario: 登录失败
  When 输入错误密码
  Then 显示错误

# ❌ 没有覆盖边界情况
Scenario: 正常登录
  Given 用户存在
  When 正确登录
  Then 成功
```

**验收标准检查清单：**

| 检查项 | 说明 |
|--------|------|
| 正向场景 | 正常流程能否成功 |
| 异常场景 | 错误处理是否完善 |
| 边界情况 | 极端值是否处理 |
| 并发情况 | 多用户同时操作 |
| 权限控制 | 不同角色权限 |

---

### R05 — 非功能性需求

**MUST** — PRD 必须明确定义非功能性需求：

- **性能需求**：响应时间、吞吐量、并发量
- **安全需求**：认证、授权、加密、审计
- **可用性需求**：SLA、故障恢复、降级策略
- **兼容性需求**：浏览器、设备、系统版本
- **可维护性需求**：日志、监控、配置管理

**非功能性需求模板：**

✅ Correct:

```markdown
## 非功能性需求

### 5.1 性能要求

| 指标 | 目标值 | 测量方法 |
|------|--------|---------|
| 登录响应时间（p95） | < 500ms | APM 监控 |
| 登录响应时间（p99） | < 1s | APM 监控 |
| 并发登录请求 | 1000 QPS | 压测工具 |
| 系统可用性 | 99.95% | 监控统计 |

### 5.2 安全要求

| 需求 | 实现方式 | 验证方法 |
|------|---------|---------|
| 密码加密 | bcrypt (cost=12) | 代码审查 |
| 防止暴力破解 | 5 次失败锁定 30 分钟 | 渗透测试 |
| 会话安全 | JWT + Redis 黑名单 | 安全扫描 |
| 传输加密 | TLS 1.2+ | SSL Labs 检测 |
| 敏感数据保护 | 手机号脱敏显示 | 代码审查 |

### 5.3 可用性要求

| 指标 | 目标值 | 保障措施 |
|------|--------|---------|
| 服务可用性 | 99.95% | 多机房部署 |
| 故障恢复时间 | < 5 分钟 | 自动故障转移 |
| 数据备份频率 | 每日全量 + 实时增量 | 定期恢复演练 |

### 5.4 兼容性要求

| 类型 | 支持范围 |
|------|---------|
| 浏览器 | Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ |
| 移动端 | iOS 14+, Android 10+ |
| 屏幕尺寸 | 320px - 2560px |

### 5.5 可维护性要求

| 需求 | 说明 |
|------|------|
| 日志规范 | 结构化 JSON 日志，包含 traceId |
| 监控告警 | 关键指标监控，P0/P1 告警 |
| 配置管理 | 环境变量注入，禁止硬编码 |
| API 文档 | OpenAPI 3.0 规范，自动生成 |
```

❌ Wrong:

```markdown
# ❌ 性能要求模糊
性能要好，响应要快

# ❌ 没有具体指标
安全性：要保证安全

# ❌ 缺少验证方法
可用性：99.9%
```

**SMART 原则应用：**

| 原则 | 说明 | 示例 |
|------|------|------|
| Specific | 具体的 | "登录响应时间"而非"性能好" |
| Measurable | 可测量的 | "< 500ms"而非"很快" |
| Achievable | 可实现的 | 基于历史数据设定 |
| Relevant | 相关的 | 与业务目标一致 |
| Time-bound | 有时间限制 | 明确测量周期 |

---

### R06 — API 契约定义

**MUST** — PRD 中的 API 契约必须遵循以下规则：

- 使用 OpenAPI 3.0 / Swagger 规范
- 明确定义请求参数和响应格式
- 包含错误码定义
- 提供请求/响应示例

**API 契约模板：**

✅ Correct:

```yaml
openapi: 3.0.3
info:
  title: 用户认证 API
  version: 1.0.0
  description: 用户登录、登出、Token 刷新接口

paths:
  /api/v1/auth/login:
    post:
      summary: 用户登录
      description: 使用用户名密码登录系统
      operationId: login
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LoginRequest'
            example:
              username: "testuser"
              password: "password123"
      responses:
        '200':
          description: 登录成功
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/LoginResponse'
              example:
                code: 0
                message: "success"
                data:
                  token: "eyJhbGciOiJIUzI1NiIs..."
                  expiresIn: 7200
                  user:
                    id: "u_001"
                    username: "testuser"
                    nickname: "Test User"
        '401':
          description: 认证失败
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                code: 40101
                message: "用户名或密码错误"

components:
  schemas:
    LoginRequest:
      type: object
      required:
        - username
        - password
      properties:
        username:
          type: string
          minLength: 3
          maxLength: 50
          example: "testuser"
        password:
          type: string
          minLength: 8
          maxLength: 100
          format: password
          example: "password123"

    LoginResponse:
      type: object
      properties:
        code:
          type: integer
          example: 0
        message:
          type: string
          example: "success"
        data:
          type: object
          properties:
            token:
              type: string
              description: JWT access token
            expiresIn:
              type: integer
              description: Token 有效期（秒）
              example: 7200
            user:
              $ref: '#/components/schemas/User'

    User:
      type: object
      properties:
        id:
          type: string
          example: "u_001"
        username:
          type: string
          example: "testuser"
        nickname:
          type: string
          example: "Test User"

    ErrorResponse:
      type: object
      properties:
        code:
          type: integer
          description: 业务错误码
        message:
          type: string
          description: 错误描述
        details:
          type: array
          items:
            type: string
          description: 详细错误信息
```

❌ Wrong:

```yaml
# ❌ 缺少请求体定义
POST /api/login

# ❌ 响应格式不明确
responses:
  200: success
  400: error

# ❌ 没有错误码定义
```

**API 设计原则：**

| 原则 | 说明 | 示例 |
|------|------|------|
| RESTful | 资源导向，HTTP 方法语义化 | GET /users, POST /users |
| 版本控制 | URL 路径包含版本号 | /api/v1/ |
| 统一响应 | 一致的响应结构 | { code, message, data } |
| 分页查询 | 支持 limit/offset | ?limit=20&offset=0 |
| 过滤排序 | 支持字段过滤和排序 | ?status=active&sort=createdAt |

---

### R07 — 数据模型定义

**MUST** — PRD 中的数据模型必须包含：

- 实体关系图（ER Diagram）
- 表结构定义（字段、类型、约束）
- 索引设计
- 数据字典

**数据模型模板：**

✅ Correct:

```markdown
## 数据模型

### 7.1 实体关系图

```
┌─────────────┐       ┌─────────────┐
│   User      │──────<│  Session   │
├─────────────┤ 1:N   ├─────────────┤
│ id          │       │ id          │
│ username    │       │ user_id     │─────► User.id
│ password    │       │ token       │
│ email       │       │ ip_address  │
│ status      │       │ created_at  │
│ created_at  │       │ expired_at  │
└─────────────┘       └─────────────┘
         │
         │ 1:N
         ▼
┌─────────────┐
│LoginAttempt │
├─────────────┤
│ id          │
│ user_id     │─────► User.id
│ success     │
│ ip_address  │
│ created_at  │
└─────────────┘
```

### 7.2 表结构定义

#### users 表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | VARCHAR(32) | PK | 用户唯一标识 |
| username | VARCHAR(50) | UNIQUE, NOT NULL | 用户名 |
| password | VARCHAR(255) | NOT NULL | bcrypt 哈希密码 |
| email | VARCHAR(100) | UNIQUE | 邮箱（可选） |
| phone | VARCHAR(20) | UNIQUE | 手机号（可选） |
| status | ENUM('active','inactive','locked') | NOT NULL, DEFAULT 'active' | 账号状态 |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() ON UPDATE | 更新时间 |

**索引设计：**

| 索引名 | 字段 | 类型 | 用途 |
|--------|------|------|------|
| idx_username | username | UNIQUE | 用户名登录查询 |
| idx_email | email | UNIQUE | 邮箱登录查询 |
| idx_phone | phone | UNIQUE | 手机号登录查询 |
| idx_status | status | BTREE | 状态筛选 |

#### sessions 表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | VARCHAR(64) | PK | 会话唯一标识 |
| user_id | VARCHAR(32) | FK, NOT NULL | 关联用户 |
| token | VARCHAR(255) | NOT NULL | JWT token |
| ip_address | VARCHAR(45) | | 登录 IP |
| user_agent | VARCHAR(500) | | 浏览器信息 |
| created_at | TIMESTAMP | NOT NULL | 创建时间 |
| expired_at | TIMESTAMP | NOT NULL | 过期时间 |

**索引设计：**

| 索引名 | 字段 | 类型 | 用途 |
|--------|------|------|------|
| idx_token | token | UNIQUE | Token 查询 |
| idx_user_id | user_id | BTREE | 用户会话查询 |
| idx_expired_at | expired_at | BTREE | 过期清理 |

### 7.3 数据字典

#### user.status 枚举值

| 值 | 说明 | 触发条件 |
|----|------|---------|
| active | 正常 | 默认状态 |
| inactive | 未激活 | 注册后未验证邮箱 |
| locked | 已锁定 | 连续 5 次登录失败 |
| deleted | 已注销 | 用户主动注销 |
```

❌ Wrong:

```markdown
# ❌ 只有表名，没有字段定义
表：users, sessions

# ❌ 缺少约束定义
username: 字符串
password: 字符串

# ❌ 没有索引设计
```

**命名规范：**

| 对象 | 规范 | 示例 |
|------|------|------|
| 表名 | 小写复数，下划线分隔 | `user_accounts` |
| 字段名 | 小写下划线分隔 | `created_at` |
| 主键 | `id` | `id` |
| 外键 | `{关联表单数}_id` | `user_id` |
| 时间戳 | `{动作}_at` | `created_at`, `updated_at` |
| 布尔值 | `is_` 前缀 | `is_active` |

---

### R08 — PRD 评审流程

**MUST** — PRD 评审必须遵循以下流程：

- 初稿完成后进行内部评审
- 邀请相关方参与评审会议
- 收集反馈并修订
- 最终确认后进入开发阶段

**评审流程：**

```
PRD 初稿
    ↓
内部评审（产品、技术负责人）
    ↓
修订 PRD
    ↓
正式评审会（产品、开发、测试、设计）
    ↓
收集反馈意见
    ↓
修订 PRD（如需）
    ↓
最终确认签字
    ↓
进入开发阶段
```

✅ Correct:

```markdown
## PRD 评审记录

### 评审信息
- **日期**: 2024-01-15
- **参与人**: 张三（产品）、李四（技术）、王五（测试）、赵六（设计）
- **地点**: 会议室 A / 线上会议

### 评审意见

| 编号 | 提出人 | 意见内容 | 处理结果 | 状态 |
|------|--------|---------|---------|------|
| 1 | 李四 | 建议增加登录失败次数限制的具体策略 | 已补充，5 次失败锁定 30 分钟 | 已解决 |
| 2 | 王五 | 需要明确验证码有效期的边界情况 | 已补充，60 秒过期 | 已解决 |
| 3 | 赵六 | 登录页面的交互流程需要简化 | 已调整，减少步骤 | 已解决 |
| 4 | 张三 | 考虑增加指纹登录（未来扩展） | 记录到 Won't Have | 已记录 |

### 评审结论
- [x] PRD 通过评审
- [ ] 需要修订后再次评审
- [ ] 暂缓，需进一步调研

### 签字确认
- 产品经理: ___________ 日期: ___________
- 技术负责人: ___________ 日期: ___________
- 测试负责人: ___________ 日期: ___________
```

❌ Wrong:

```markdown
# ❌ 没有评审记录
PRD 已完成，直接进入开发

# ❌ 评审意见未跟踪
评审意见：
- 需要修改密码策略
（但没有记录是否已修改）
```

**评审检查清单：**

| 检查项 | 说明 |
|--------|------|
| 背景清晰 | 为什么做这个功能 |
| 目标明确 | 期望达成什么 |
| 范围合理 | 包含/不包含的内容 |
| 用户故事完整 | 覆盖所有角色和场景 |
| 验收标准可测试 | Given/When/Then 格式 |
| 非功能需求量化 | 有具体指标 |
| API 契约完整 | 请求/响应/错误码 |
| 数据模型合理 | ER 图 + 表结构 |
| 优先级合理 | MoSCoW 分类 |
| 风险已识别 | 已知风险和应对措施 |

---

## Checklist

- [ ] PRD 包含背景与目标章节
- [ ] 目标有明确的成功指标（SMART）
- [ ] 范围定义清晰，包含和不包含内容明确
- [ ] 用户故事遵循 As a... I want... So that... 格式
- [ ] 用户故事可独立交付、可估算
- [ ] 需求使用 MoSCoW 方法分类优先级
- [ ] Must Have 需求不超过总需求的 30%
- [ ] 验收标准使用 Given/When/Then 格式
- [ ] 覆盖正向、异常、边界场景
- [ ] 性能需求有具体指标（响应时间、吞吐量）
- [ ] 安全需求明确（加密、认证、授权）
- [ ] 可用性需求量化（SLA、恢复时间）
- [ ] API 契约使用 OpenAPI 3.0 规范
- [ ] API 包含请求参数、响应格式、错误码
- [ ] 数据模型包含 ER 图和表结构定义
- [ ] 表结构包含字段类型、约束、索引
- [ ] PRD 经过正式评审
- [ ] 评审意见已记录并处理
- [ ] 相关方签字确认
