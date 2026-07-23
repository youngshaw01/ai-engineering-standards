# SaaS

## Overview

SaaS（Software as a Service）工程规范，涵盖多租户架构、租户识别与路由、数据隔离策略、租户定制化、计费与计量、租户生命周期管理、SaaS 可扩展性、SaaS 安全。适用于所有构建多租户 SaaS 产品的场景。

---

## Rules

### R01 — 多租户架构选择

**MUST** — 多租户架构必须在项目启动阶段确定，并遵循以下规则：

- 架构选择必须基于业务需求、数据规模、合规要求综合评估
- 架构一旦确定，后续迁移成本极高，必须慎重决策
- 不同租户规模可混合使用不同隔离级别

**三种隔离模型对比：**

| 模型 | 隔离级别 | 成本 | 运维复杂度 | 数据安全 | 适用场景 |
|------|---------|------|-----------|---------|---------|
| 共享数据库共享 Schema | 低 | 最低 | 低 | 低 | 小型 SaaS、成本敏感 |
| 共享数据库独立 Schema | 中 | 中 | 中 | 中 | 中型 SaaS、适度隔离 |
| 独立数据库 | 高 | 最高 | 高 | 高 | 大客户、合规要求严格 |

✅ Correct:

```markdown
## 多租户架构决策

### 决策背景
- 预期租户数量：100-500
- 单租户数据量：1GB-50GB
- 合规要求：金融行业，需数据物理隔离

### 决策结果
采用混合架构：
- 标准租户：共享数据库独立 Schema
- 企业租户：独立数据库

### 决策依据
1. 标准租户数量多，成本优先
2. 企业租户合规要求高，需物理隔离
3. 混合架构兼顾成本与合规
```

**共享数据库共享 Schema 实现：**

```sql
-- 所有租户共享表结构，通过 tenant_id 隔离
CREATE TABLE orders (
    id VARCHAR(32) PRIMARY KEY,
    tenant_id VARCHAR(32) NOT NULL,
    user_id VARCHAR(32) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 必须创建 tenant_id 索引
CREATE INDEX idx_orders_tenant_id ON orders(tenant_id);

-- 查询时必须带 tenant_id 条件
SELECT * FROM orders WHERE tenant_id = 'tenant_001' AND user_id = 'user_001';
```

**共享数据库独立 Schema 实现：**

```sql
-- 每个租户独立 Schema
CREATE SCHEMA tenant_001;
CREATE SCHEMA tenant_002;

-- 各 Schema 下独立建表
CREATE TABLE tenant_001.orders (...);
CREATE TABLE tenant_002.orders (...);
```

❌ Wrong:

```markdown
# ❌ 没有架构决策记录
直接开始开发，使用共享数据库

# ❌ 没有考虑合规要求
所有租户共享数据库和 Schema，金融客户数据混在一起
```

---

### R02 — 租户识别与路由

**MUST** — 租户识别与路由必须遵循以下规则：

- 每个请求必须明确识别所属租户
- 租户识别必须在请求链路最前端完成
- 租户上下文必须贯穿整个请求生命周期
- 禁止在业务逻辑中硬编码租户信息

**租户识别策略：**

| 策略 | 实现方式 | 优点 | 缺点 |
|------|---------|------|------|
| 子域名 | tenant.app.com | 直观、SEO 友好 | DNS 配置复杂 |
| URL 路径 | /t/{tenant_id}/api | 简单直接 | URL 较长 |
| 请求头 | X-Tenant-ID | API 友好 | 浏览器不便 |
| Token | JWT claim | 安全、无状态 | 需认证系统 |

✅ Correct:

```python
# Python FastAPI 租户中间件
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from contextvars import ContextVar

tenant_context: ContextVar[str] = ContextVar("tenant_id", default="")

class TenantMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        tenant_id = self._resolve_tenant(request)
        if not tenant_id:
            return JSONResponse(
                status_code=400,
                content={"error": "Missing tenant identifier"}
            )

        tenant = tenant_service.get_tenant(tenant_id)
        if not tenant or tenant.status != "active":
            return JSONResponse(
                status_code=403,
                content={"error": "Tenant not found or inactive"}
            )

        tenant_context.set(tenant_id)
        request.state.tenant = tenant
        response = await call_next(request)
        return response

    def _resolve_tenant(self, request: Request) -> str:
        host = request.headers.get("host", "")
        if host.endswith(".app.com"):
            return host.split(".")[0]

        tenant_header = request.headers.get("X-Tenant-ID")
        if tenant_header:
            return tenant_header

        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            payload = jwt.decode(auth[7:], options={"verify_exp": True})
            return payload.get("tenant_id", "")

        return ""
```

```java
// Java Spring Boot 租户拦截器
@Component
public class TenantInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response,
                             Object handler) throws Exception {
        String tenantId = resolveTenant(request);
        if (tenantId == null) {
            response.sendError(400, "Missing tenant identifier");
            return false;
        }

        Tenant tenant = tenantService.getTenant(tenantId);
        if (tenant == null || !tenant.isActive()) {
            response.sendError(403, "Tenant not found or inactive");
            return false;
        }

        TenantContext.set(tenantId);
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request,
                                HttpServletResponse response,
                                Object handler, Exception ex) {
        TenantContext.clear();
    }
}
```

❌ Wrong:

```python
# ❌ 在业务代码中硬编码租户
def get_orders():
    tenant_id = "tenant_001"  # ❌ 硬编码
    return Order.query.filter_by(tenant_id=tenant_id).all()

# ❌ 没有租户上下文清理
# ❌ 没有验证租户状态
```

**租户上下文传播：**

```
Request → Gateway (解析 tenant_id)
    → Middleware (验证租户 + 设置上下文)
    → Controller (从上下文获取 tenant_id)
    → Service (自动注入 tenant_id)
    → Repository (WHERE tenant_id = ?)
    → Response (清理上下文)
```

---

### R03 — 数据隔离策略

**MUST** — 数据隔离必须遵循以下规则：

- 所有数据访问必须自动附加租户过滤条件
- 禁止绕过租户隔离直接访问数据
- 必须防止租户间数据泄漏
- 必须定期审计数据隔离有效性

**行级安全策略（Row-Level Security）：**

✅ Correct:

```sql
-- PostgreSQL RLS 实现
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON orders
    USING (tenant_id = current_setting('app.current_tenant')::VARCHAR);

-- 应用层设置租户上下文
SET app.current_tenant = 'tenant_001';

-- 查询自动过滤
SELECT * FROM orders;  -- 等价于 SELECT * FROM orders WHERE tenant_id = 'tenant_001'
```

```python
# Python SQLAlchemy 自动租户过滤
from sqlalchemy import event
from sqlalchemy.orm import Session

@event.listens_for(Session, "before_flush")
def auto_tenant_filter(session, flush_context, instances):
    for instance in session.new:
        if hasattr(instance, 'tenant_id'):
            if not instance.tenant_id:
                instance.tenant_id = tenant_context.get()

class TenantQuery(Query):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if tenant_context.get():
            self._criterion = self._criterion.and_(
                self._entity_from_pre_ent_zero.tenant_id == tenant_context.get()
            )
```

```java
// Java Hibernate Filter
@FilterDef(name = "tenantFilter", parameters = {
    @ParamDef(name = "tenantId", type = String.class)
})
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
@Entity
@Table(name = "orders")
public class Order {
    @Column(name = "tenant_id", nullable = false)
    private String tenantId;
}

// 启用 Filter
Session session = sessionFactory.openSession();
session.enableFilter("tenantFilter").setParameter("tenantId", TenantContext.get());
```

❌ Wrong:

```python
# ❌ 手动添加租户过滤，容易遗漏
def get_order(order_id):
    return Order.query.filter_by(id=order_id, tenant_id=tenant_context.get()).first()

# ❌ 某些查询忘记加 tenant_id
def get_all_orders():
    return Order.query.all()  # ❌ 返回所有租户数据
```

**数据隔离审计：**

| 审计项 | 频率 | 方法 |
|--------|------|------|
| 跨租户数据访问 | 每月 | 日志分析 + 渗透测试 |
| RLS 策略有效性 | 每季度 | 模拟跨租户查询 |
| 数据泄漏检测 | 实时 | 监控告警 |
| 权限配置审查 | 每月 | 自动化扫描 |

---

### R04 — 租户定制化

**MUST** — 租户定制化必须遵循以下规则：

- 核心业务逻辑不可定制，仅允许配置级定制
- 定制化必须通过配置驱动，禁止代码分支
- 定制化配置必须版本化管理
- 定制化不得影响其他租户

**定制化层级：**

| 层级 | 定制内容 | 实现方式 | 示例 |
|------|---------|---------|------|
| L1 - UI 定制 | 主题、Logo、布局 | 配置 + 模板引擎 | 品牌色、Logo |
| L2 - 功能开关 | 功能模块启用/禁用 | Feature Flag | 审批流程开关 |
| L3 - 流程定制 | 业务流程调整 | 工作流引擎 | 审批节点配置 |
| L4 - 字段扩展 | 自定义字段 | EAV / JSON | 自定义订单属性 |

✅ Correct:

```yaml
# 租户配置文件
tenant_id: tenant_001
name: "Acme Corp"
plan: enterprise

features:
  approval_workflow: true
  advanced_analytics: true
  custom_fields: true
  sso_integration: true
  api_access: true

branding:
  primary_color: "#1a73e8"
  logo_url: "https://cdn.example.com/tenants/tenant_001/logo.png"
  favicon: "https://cdn.example.com/tenants/tenant_001/favicon.ico"
  login_title: "Acme Corp Portal"

workflow:
  order_approval:
    enabled: true
    steps:
      - role: manager
        auto_approve_below: 1000
      - role: director
        auto_approve_below: 10000
      - role: cfo
        auto_approve_below: 0

custom_fields:
  order:
    - name: cost_center
      type: string
      required: true
      options: ["CC-001", "CC-002", "CC-003"]
    - name: project_code
      type: string
      required: false
```

```python
# Feature Flag 检查
def check_feature(tenant_id: str, feature: str) -> bool:
    config = tenant_config_service.get(tenant_id)
    return config.features.get(feature, False)

# 使用示例
if check_feature(tenant_id, "approval_workflow"):
    order = submit_for_approval(order)
else:
    order = auto_approve(order)
```

❌ Wrong:

```python
# ❌ 代码分支实现定制化
if tenant_id == "tenant_001":
    process_order_v1(order)
elif tenant_id == "tenant_002":
    process_order_v2(order)
else:
    process_order_default(order)

# ❌ 每增加一个租户就要改代码
# ❌ 无法通过测试覆盖所有分支
```

**定制化配置管理：**

| 要求 | 说明 |
|------|------|
| 版本化 | 配置变更可追溯、可回滚 |
| 默认值 | 未配置时使用合理默认值 |
| 校验 | 配置值必须通过格式校验 |
| 热更新 | 配置变更无需重启服务 |

---

### R05 — 计费与计量

**MUST** — 计费与计量系统必须遵循以下规则：

- 必须准确计量每个租户的资源使用量
- 计费规则必须透明、可审计
- 必须支持多种计费模式
- 必须提供用量查询和账单导出

**计费模式：**

| 模式 | 说明 | 适用场景 | 示例 |
|------|------|---------|------|
| 固定价 | 按月/年固定收费 | 功能固定的套餐 | ¥99/月/用户 |
| 按量计费 | 按实际使用量收费 | 弹性资源 | ¥0.01/次 API 调用 |
| 阶梯计费 | 用量越大单价越低 | 鼓励大量使用 | 0-1000: ¥1, 1000+: ¥0.8 |
| 混合计费 | 固定 + 按量 | 常见 SaaS 模式 | 基础费 + 超量费 |

✅ Correct:

```yaml
# 计费计划定义
plans:
  starter:
    name: "入门版"
    price: 99
    currency: CNY
    billing_cycle: monthly
    limits:
      users: 10
      storage_gb: 5
      api_calls: 10000
    overages:
      additional_user: 10
      additional_storage_gb: 5
      additional_1000_api_calls: 2

  professional:
    name: "专业版"
    price: 299
    currency: CNY
    billing_cycle: monthly
    limits:
      users: 50
      storage_gb: 50
      api_calls: 100000
    overages:
      additional_user: 8
      additional_storage_gb: 4
      additional_1000_api_calls: 1.5

  enterprise:
    name: "企业版"
    price: null
    currency: CNY
    billing_cycle: custom
    limits:
      users: unlimited
      storage_gb: unlimited
      api_calls: unlimited
```

```python
# 用量计量服务
class MeteringService:
    def record_usage(self, tenant_id: str, metric: str, value: float):
        metering_record = MeteringRecord(
            tenant_id=tenant_id,
            metric=metric,
            value=value,
            timestamp=datetime.utcnow()
        )
        self.repository.save(metering_record)

    def get_usage(self, tenant_id: str, metric: str,
                  start: datetime, end: datetime) -> float:
        return self.repository.aggregate(
            tenant_id=tenant_id,
            metric=metric,
            start=start,
            end=end
        )

    def check_limit(self, tenant_id: str, metric: str) -> bool:
        plan = self.plan_service.get_plan(tenant_id)
        current_usage = self.get_usage(
            tenant_id, metric,
            start=billing_cycle_start(),
            end=datetime.utcnow()
        )
        limit = plan.limits.get(metric)
        if limit == "unlimited":
            return True
        return current_usage < limit
```

❌ Wrong:

```python
# ❌ 没有计量系统，无法准确计费
# ❌ 计费规则硬编码
if tenant.plan == "pro":
    charge = 299
```

**计量指标设计：**

| 指标 | 计量方式 | 粒度 | 存储策略 |
|------|---------|------|---------|
| API 调用次数 | Counter | 每次请求 +1 | 按小时聚合 |
| 存储空间 | Gauge | 每日快照 | 保留 90 天 |
| 活跃用户数 | Counter | 每日去重 | 保留 365 天 |
| 计算资源 | Histogram | 每次执行记录 | 按小时聚合 |

---

### R06 — 租户生命周期管理

**MUST** — 租户生命周期管理必须遵循以下规则：

- 必须定义完整的租户状态机
- 租户创建必须自动化，减少人工干预
- 租户停用必须保留数据，支持恢复
- 租户删除必须遵循数据保留策略

**租户状态机：**

```
         创建
           ↓
    ┌─────────────┐
    │   Pending    │  等待配置
    └──────┬──────┘
           │ 激活
    ┌──────▼──────┐
    │   Active     │◄──────────────┐
    └──────┬──────┘               │
           │ 欠费/违规              │ 恢复
    ┌──────▼──────┐               │
    │  Suspended   │──────────────┘
    └──────┬──────┘
           │ 长期未恢复
    ┌──────▼──────┐
    │  Deactivated │  数据保留
    └──────┬──────┘
           │ 保留期到期
    ┌──────▼──────┐
    │   Deleted    │  数据清除
    └─────────────┘
```

✅ Correct:

```python
# 租户生命周期管理
class TenantLifecycleService:

    def create_tenant(self, name: str, plan: str, admin_email: str) -> Tenant:
        tenant = Tenant(
            id=generate_id(),
            name=name,
            plan=plan,
            status="pending",
            created_at=datetime.utcnow()
        )
        self.tenant_repo.save(tenant)

        self._provision_infrastructure(tenant)
        self._send_welcome_email(tenant, admin_email)

        return tenant

    def activate_tenant(self, tenant_id: str):
        tenant = self.tenant_repo.get(tenant_id)
        self._validate_activation(tenant)
        tenant.status = "active"
        tenant.activated_at = datetime.utcnow()
        self.tenant_repo.save(tenant)

    def suspend_tenant(self, tenant_id: str, reason: str):
        tenant = self.tenant_repo.get(tenant_id)
        tenant.status = "suspended"
        tenant.suspended_reason = reason
        tenant.suspended_at = datetime.utcnow()
        self.tenant_repo.save(tenant)
        self._disable_access(tenant)
        self._notify_admin(tenant, reason)

    def deactivate_tenant(self, tenant_id: str):
        tenant = self.tenant_repo.get(tenant_id)
        tenant.status = "deactivated"
        tenant.deactivated_at = datetime.utcnow()
        self.tenant_repo.save(tenant)
        self._archive_data(tenant)
        self._release_resources(tenant)

    def delete_tenant(self, tenant_id: str):
        tenant = self.tenant_repo.get(tenant_id)
        if tenant.status != "deactivated":
            raise InvalidStateError("Must deactivate before deletion")
        if not self._retention_period_expired(tenant):
            raise RetentionPeriodError("Data retention period not expired")

        self._purge_all_data(tenant)
        self.tenant_repo.delete(tenant_id)
```

❌ Wrong:

```python
# ❌ 直接删除租户数据，无法恢复
def delete_tenant(tenant_id):
    db.execute(f"DELETE FROM tenants WHERE id = '{tenant_id}'")
    db.execute(f"DELETE FROM orders WHERE tenant_id = '{tenant_id}'")
    # ❌ 没有数据保留期
    # ❌ 没有确认流程
    # ❌ SQL 注入风险
```

**数据保留策略：**

| 租户状态 | 数据保留期 | 处理方式 |
|---------|-----------|---------|
| Suspended | 无限期 | 数据保留，访问禁用 |
| Deactivated | 90 天 | 数据归档，可恢复 |
| Deleted | 立即 | 数据永久清除 |

---

### R07 — SaaS 可扩展性

**MUST** — SaaS 系统必须遵循以下可扩展性规则：

- 必须支持水平扩展，无状态服务层
- 必须支持租户级资源配额和限流
- 必须支持数据库分片（Sharding）
- 必须监控租户级资源使用

**扩展性架构：**

```
                    ┌─────────────┐
                    │   Gateway   │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────▼────┐ ┌────▼─────┐ ┌────▼─────┐
        │ Service  │ │ Service  │ │ Service  │
        │  Pool A  │ │  Pool B  │ │  Pool C  │
        └─────┬────┘ └────┬─────┘ └────┬─────┘
              │            │            │
        ┌─────▼────┐ ┌────▼─────┐ ┌────▼─────┐
        │   DB     │ │   DB     │ │   DB     │
        │ Shard 1  │ │ Shard 2  │ │ Shard 3  │
        └──────────┘ └──────────┘ └──────────┘
```

**租户分片策略：**

| 策略 | 说明 | 优点 | 缺点 |
|------|------|------|------|------|
| 哈希分片 | hash(tenant_id) % N | 分布均匀 | 扩容需 rehash |
| 范围分片 | tenant_id 范围映射 | 扩容方便 | 可能热点 |
| 目录分片 | 查询映射表 | 灵活 | 映射表瓶颈 |

✅ Correct:

```python
# 租户分片路由
class ShardRouter:
    def __init__(self, shard_config: dict):
        self.shards = shard_config
        self.mapping_cache = {}

    def get_shard(self, tenant_id: str) -> str:
        if tenant_id in self.mapping_cache:
            return self.mapping_cache[tenant_id]

        shard_key = self._calculate_shard(tenant_id)
        self.mapping_cache[tenant_id] = shard_key
        return shard_key

    def _calculate_shard(self, tenant_id: str) -> str:
        hash_value = int(hashlib.md5(tenant_id.encode()).hexdigest(), 16)
        shard_index = hash_value % len(self.shards)
        return f"shard_{shard_index}"

# 租户级限流
class TenantRateLimiter:
    def __init__(self, redis_client):
        self.redis = redis_client

    def check_rate(self, tenant_id: str, limit: int, window: int) -> bool:
        key = f"rate_limit:{tenant_id}"
        current = self.redis.incr(key)
        if current == 1:
            self.redis.expire(key, window)
        return current <= limit
```

❌ Wrong:

```python
# ❌ 所有租户共享单一数据库，无法扩展
# ❌ 没有租户级限流
# ❌ 大租户可能影响小租户性能
```

**资源配额设计：**

| 资源 | 计费计划 | 限制方式 | 超限处理 |
|------|---------|---------|---------|
| API 调用 | 按计划 | Counter + 限流 | 返回 429 |
| 存储空间 | 按计划 | 配额检查 | 禁止上传 |
| 并发连接 | 按计划 | 连接池限制 | 排队等待 |
| 计算资源 | 按计划 | CPU 时间限制 | 降级处理 |

---

### R08 — SaaS 安全

**MUST** — SaaS 安全必须遵循以下规则：

- 必须实现租户级数据访问控制
- 必须支持租户级认证（SSO/SAML/OIDC）
- 必须审计所有跨租户操作
- 必须加密租户敏感数据
- 必须防止 Noisy Neighbor 问题

**租户级访问控制：**

✅ Correct:

```python
# 租户级权限检查
class TenantAccessControl:

    def check_access(self, user_id: str, tenant_id: str,
                     resource: str, action: str) -> bool:
        user = self.user_repo.get(user_id)
        if not user:
            return False

        membership = self.membership_repo.get(user_id, tenant_id)
        if not membership or not membership.is_active:
            return False

        role = membership.role
        permissions = self.role_repo.get_permissions(role)
        required_permission = f"{resource}:{action}"

        return required_permission in permissions

    def get_accessible_tenants(self, user_id: str) -> list:
        memberships = self.membership_repo.list_by_user(user_id)
        return [m.tenant_id for m in memberships if m.is_active]
```

**租户级审计日志：**

```python
# 审计日志记录
class AuditService:

    def log(self, tenant_id: str, user_id: str,
            action: str, resource: str, details: dict = None):
        audit_record = AuditLog(
            id=generate_id(),
            tenant_id=tenant_id,
            user_id=user_id,
            action=action,
            resource=resource,
            details=details or {},
            ip_address=request_context.get_ip(),
            user_agent=request_context.get_user_agent(),
            timestamp=datetime.utcnow()
        )
        self.audit_repo.save(audit_record)

    def query(self, tenant_id: str, filters: dict) -> list:
        return self.audit_repo.query(
            tenant_id=tenant_id,
            **filters
        )
```

❌ Wrong:

```python
# ❌ 没有租户级权限检查
def get_data(resource_id):
    return db.query(resource_id)  # ❌ 任何用户都能访问

# ❌ 审计日志没有租户隔离
def log_action(user_id, action):
    audit_log.write(f"{user_id} performed {action}")
    # ❌ 缺少 tenant_id
```

**Noisy Neighbor 防护：**

| 防护措施 | 说明 | 实现方式 |
|---------|------|---------|
| 资源配额 | 限制单租户资源使用 | Rate Limiting + Quota |
| 资源隔离 | 物理或逻辑隔离 | 独立数据库 / Schema |
| 优先级队列 | 区分租户优先级 | Weighted Queue |
| 自动扩容 | 负载自动扩展 | HPA / KEDA |
| 降级策略 | 过载时保护核心功能 | Circuit Breaker |

**数据加密策略：**

| 数据类型 | 加密方式 | 说明 |
|---------|---------|------|
| 传输中 | TLS 1.2+ | 所有 API 通信 |
| 静态数据 | AES-256 | 数据库加密 |
| 敏感字段 | 应用层加密 | 密钥按租户隔离 |
| 备份数据 | AES-256 | 异地备份加密 |

---

## Checklist

- [ ] 多租户架构在项目启动阶段确定并记录决策依据
- [ ] 架构选择基于业务需求、数据规模、合规要求综合评估
- [ ] 每个请求明确识别所属租户，租户上下文贯穿请求生命周期
- [ ] 租户识别在请求链路最前端完成
- [ ] 数据访问自动附加租户过滤条件，禁止绕过隔离
- [ ] 使用 RLS / Hibernate Filter / SQLAlchemy Filter 等机制自动隔离
- [ ] 定期审计数据隔离有效性
- [ ] 定制化通过配置驱动，禁止代码分支
- [ ] 定制化配置版本化管理，支持热更新
- [ ] 准确计量每个租户的资源使用量
- [ ] 计费规则透明可审计，支持多种计费模式
- [ ] 租户状态机完整定义（Pending → Active → Suspended → Deactivated → Deleted）
- [ ] 租户停用保留数据，删除遵循数据保留策略
- [ ] 系统支持水平扩展，无状态服务层
- [ ] 数据库支持分片，租户级限流和配额
- [ ] 实现租户级数据访问控制和审计日志
- [ ] 支持租户级 SSO/SAML/OIDC 认证
- [ ] 租户敏感数据加密，密钥按租户隔离
- [ ] Noisy Neighbor 防护措施到位
