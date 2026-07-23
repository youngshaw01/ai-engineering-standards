# RBAC

## Overview

基于角色的访问控制（Role-Based Access Control）规范，涵盖角色设计原则、权限粒度、用户角色分配、角色层级、数据级权限、权限缓存、动态权限和审计合规。适用于所有需要权限管理的后端系统。

---

## Rules

### R01 — 角色设计原则

**MUST** — 角色与权限分离设计：

**核心模型：**

```
User ←→ UserRole ←→ Role ←→ RolePermission ←→ Permission
```

**数据模型：**

```sql
CREATE TABLE t_user (
    id          BIGINT PRIMARY KEY,
    username    VARCHAR(64) NOT NULL UNIQUE,
    status      VARCHAR(16) NOT NULL DEFAULT 'ACTIVE'
);

CREATE TABLE t_role (
    id          BIGINT PRIMARY KEY,
    role_code   VARCHAR(64) NOT NULL UNIQUE,
    role_name   VARCHAR(128) NOT NULL,
    description VARCHAR(256),
    status      VARCHAR(16) NOT NULL DEFAULT 'ACTIVE'
);

CREATE TABLE t_permission (
    id              BIGINT PRIMARY KEY,
    permission_code VARCHAR(128) NOT NULL UNIQUE,
    permission_name VARCHAR(128) NOT NULL,
    resource_type   VARCHAR(64) NOT NULL,
    resource_key    VARCHAR(128) NOT NULL,
    action          VARCHAR(32) NOT NULL
);

CREATE TABLE t_user_role (
    id          BIGINT PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    role_id     BIGINT NOT NULL,
    granted_by  VARCHAR(64),
    granted_at  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE (user_id, role_id)
);

CREATE TABLE t_role_permission (
    id              BIGINT PRIMARY KEY,
    role_id         BIGINT NOT NULL,
    permission_id   BIGINT NOT NULL,
    UNIQUE (role_id, permission_id)
);
```

**角色 vs 权限：**

| 概念 | 说明 | 示例 |
|------|------|------|
| 角色 | 一组权限的集合，面向业务职能 | `ADMIN`, `EDITOR`, `VIEWER` |
| 权限 | 最小授权单元，面向操作 | `user:read`, `user:write` |

✅ Correct:

```
角色：ORDER_MANAGER
权限：order:read, order:write, order:cancel
```

❌ Wrong:

```
角色：CAN_READ_AND_WRITE_ORDER  # 角色名包含权限细节
权限：order_all                  # 权限粒度过粗
```

---

### R02 — 权限粒度

**MUST** — 权限编码遵循统一格式：

```
<resource>:<action>

示例：
user:read
user:write
user:delete
order:read
order:write
order:approve
report:export
system:config
```

**Action 定义：**

| Action | 说明 | 典型场景 |
|--------|------|---------|
| `read` | 查看资源 | 查看用户列表 |
| `write` | 创建 / 修改资源 | 创建订单、修改用户 |
| `delete` | 删除资源 | 删除用户 |
| `approve` | 审批资源 | 审批订单 |
| `export` | 导出资源 | 导出报表 |
| `config` | 配置系统 | 修改系统参数 |

**权限粒度原则：**

| 原则 | 说明 |
|------|------|
| 最小权限 | 只授予完成任务所需的最小权限 |
| 资源 + 操作 | 权限必须同时包含资源和操作 |
| 可组合 | 权限可自由组合成角色 |
| 可扩展 | 新增资源只需新增权限编码 |

✅ Correct:

```java
@PreAuthorize("hasPermission('order:write')")
public Order createOrder(CreateOrderRequest request) {
    ...
}
```

❌ Wrong:

```java
@PreAuthorize("hasRole('ADMIN')")  // 角色检查，粒度过粗
public Order createOrder(CreateOrderRequest request) {
    ...
}
```

---

### R03 — 用户角色分配

**MUST** — 用户角色分配遵循以下规则：

**分配原则：**

| 原则 | 说明 |
|------|------|
| 最少角色 | 每个用户只分配必要的角色 |
| 职责分离 | 互斥角色不能同时分配给同一用户 |
| 可追溯 | 角色分配 / 撤销必须记录审计日志 |
| 可过期 | 临时角色支持过期时间 |

**互斥角色：**

```sql
CREATE TABLE t_role_exclusion (
    id          BIGINT PRIMARY KEY,
    role_id_a   BIGINT NOT NULL,
    role_id_b   BIGINT NOT NULL,
    description VARCHAR(256),
    UNIQUE (role_id_a, role_id_b)
);
```

✅ Correct:

```
用户 Alice → 角色：ORDER_VIEWER（查看订单）
用户 Bob   → 角色：ORDER_MANAGER（管理订单）
互斥：PAYMENT_ADMIN 和 ORDER_ADMIN 不能同时分配
```

❌ Wrong:

```
用户 Alice → 角色：ADMIN, EDITOR, VIEWER, AUDITOR（角色过多）
无互斥检查：同一用户同时拥有付款审批和订单创建角色
```

**临时角色：**

```sql
CREATE TABLE t_user_role (
    id          BIGINT PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    role_id     BIGINT NOT NULL,
    expires_at  TIMESTAMP(3),  -- NULL 表示永久
    ...
);
```

---

### R04 — 角色层级

**SHOULD** — 支持角色继承，减少重复配置：

```
SUPER_ADMIN
    └── ADMIN
        ├── USER_MANAGER
        │   ├── USER_EDITOR
        │   └── USER_VIEWER
        └── ORDER_MANAGER
            ├── ORDER_EDITOR
            └── ORDER_VIEWER
```

**数据模型：**

```sql
CREATE TABLE t_role_hierarchy (
    id              BIGINT PRIMARY KEY,
    parent_role_id  BIGINT NOT NULL,
    child_role_id   BIGINT NOT NULL,
    UNIQUE (parent_role_id, child_role_id)
);
```

**权限继承规则：**

- 子角色自动继承父角色的所有权限
- 同一权限在多层级定义时，以最具体的层级为准
- 角色层级深度不超过 3 层

✅ Correct:

```
ADMIN 继承 USER_MANAGER 和 ORDER_MANAGER 的所有权限
USER_MANAGER 继承 USER_EDITOR 和 USER_VIEWER 的所有权限
```

❌ Wrong:

```
角色层级深度 5 层 → 权限计算复杂，难以维护
循环继承：A → B → C → A
```

---

### R05 — 数据级权限

**MUST** — 支持行级和列级数据权限控制：

**行级权限（Row-Level）：**

| 策略 | 说明 | 示例 |
|------|------|------|
| 仅本人 | 只能查看自己的数据 | 员工查看自己的考勤 |
| 本部门 | 查看本部门数据 | 部门经理查看本部门员工 |
| 本部门及下级 | 查看本部门及子部门 | 区域经理查看辖区数据 |
| 全部 | 查看所有数据 | HR 查看所有员工 |

✅ Correct:

```java
@DataScope(type = DataScopeType.DEPT_AND_SUB)
public List<User> listUsers(UserQuery query) {
    // 自动注入部门过滤条件
    // WHERE user.dept_id IN (当前部门及子部门 ID)
}
```

**列级权限（Column-Level）：**

| 策略 | 说明 | 示例 |
|------|------|------|
| 隐藏列 | 不返回敏感字段 | 普通用户看不到薪资列 |
| 脱敏列 | 返回脱敏数据 | 手机号显示为 138****1234 |
| 只读列 | 可查看不可修改 | 订单号不可修改 |

✅ Correct:

```java
@FieldPermission(field = "salary", action = FieldAction.MASK)
@FieldPermission(field = "phone", action = FieldAction.DESSENSITIZE)
public class UserResponse {
    private String name;
    private BigDecimal salary;  // 无权限时返回 null
    private String phone;       // 脱敏后返回 138****1234
}
```

---

### R06 — 权限缓存

**MUST** — 权限数据必须缓存，避免每次请求查询数据库：

**缓存策略：**

| 策略 | 说明 |
|------|------|
| 缓存 Key | `user:permissions:{userId}` |
| 缓存内容 | 用户所有权限编码集合 |
| 过期时间 | 5 ~ 30 分钟 |
| 更新机制 | 权限变更时主动失效 |

✅ Correct:

```java
@Service
@RequiredArgsConstructor
public class PermissionService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final UserRoleMapper userRoleMapper;
    private final RolePermissionMapper rolePermissionMapper;

    private static final long CACHE_TTL_MINUTES = 15;

    public Set<String> getUserPermissions(Long userId) {
        String key = "user:permissions:" + userId;
        Set<String> permissions = (Set<String>) redisTemplate.opsForValue().get(key);
        if (permissions != null) {
            return permissions;
        }
        permissions = loadPermissionsFromDB(userId);
        redisTemplate.opsForValue().set(key, permissions, CACHE_TTL_MINUTES, TimeUnit.MINUTES);
        return permissions;
    }

    public void evictUserPermissions(Long userId) {
        redisTemplate.delete("user:permissions:" + userId);
    }
}
```

**权限变更时主动失效：**

```java
@Service
@RequiredArgsConstructor
public class RoleService {

    private final PermissionService permissionService;
    private final UserRoleMapper userRoleMapper;

    public void updateRolePermissions(Long roleId) {
        rolePermissionMapper.updateByRoleId(roleId);
        List<Long> userIds = userRoleMapper.selectUserIdsByRoleId(roleId);
        userIds.forEach(permissionService::evictUserPermissions);
    }
}
```

---

### R07 — 动态权限

**MAY** — 支持运行时动态调整权限，无需重启服务：

**动态权限场景：**

| 场景 | 说明 |
|------|------|
| 功能开关 | 按租户 / 环境启用或禁用功能 |
| 临时授权 | 紧急情况下临时授予额外权限 |
| ABAC 混合 | 基于属性的条件权限（时间 / IP / 设备） |

✅ Correct (条件权限):

```java
@PreAuthorize("hasPermission('order:approve') and @conditionEvaluator.isWorkingHour()")
public void approveOrder(Long orderId) {
    ...
}
```

**动态权限实现：**

```java
@Component
public class DynamicPermissionEvaluator {

    private final PermissionService permissionService;

    public boolean hasPermission(Long userId, String permissionCode) {
        Set<String> permissions = permissionService.getUserPermissions(userId);
        return permissions.contains(permissionCode);
    }

    public boolean hasPermission(Long userId, String resourceType, String action) {
        return hasPermission(userId, resourceType + ":" + action);
    }
}
```

**动态权限注意事项：**

- 权限变更后缓存立即失效
- 动态权限规则必须有审计日志
- 避免过度复杂的条件组合

---

### R08 — 审计与合规

**MUST** — 权限相关操作必须记录审计日志：

**必须审计的操作：**

| 操作 | 说明 |
|------|------|
| 角色创建 / 修改 / 删除 | 角色生命周期管理 |
| 权限分配 / 撤销 | 角色权限变更 |
| 用户角色分配 / 撤销 | 用户角色变更 |
| 权限检查失败 | 越权访问尝试 |
| 动态权限变更 | 运行时权限调整 |

✅ Correct:

```java
@AuditLog(action = "GRANT_ROLE", resourceType = "UserRole")
public void assignRole(Long userId, Long roleId, String reason) {
    UserRole userRole = new UserRole(userId, roleId);
    userRole.setGrantedBy(getCurrentUserId());
    userRole.setReason(reason);
    userRoleMapper.insert(userRole);
    permissionService.evictUserPermissions(userId);
}
```

**合规检查清单：**

- [ ] 权限变更需审批（至少 2 人确认）
- [ ] 定期审查用户角色（每季度）
- [ ] 离职用户权限及时回收
- [ ] 互斥角色检查生效
- [ ] 权限检查失败有告警
- [ ] 审计日志不可篡改

**定期权限审查：**

✅ Correct:

```sql
-- 查询超过 90 天未使用的角色
SELECT ur.user_id, ur.role_id, r.role_code, ur.granted_at
FROM t_user_role ur
JOIN t_role r ON ur.role_id = r.id
WHERE ur.granted_at < DATE_SUB(NOW(), INTERVAL 90 DAY)
  AND ur.user_id NOT IN (
      SELECT DISTINCT operator_id FROM audit_log
      WHERE operated_at > DATE_SUB(NOW(), INTERVAL 90 DAY)
  );
```

---

## Checklist

- [ ] 角色与权限分离，权限编码遵循 `<resource>:<action>` 格式
- [ ] 权限粒度合理，遵循最小权限原则
- [ ] 用户角色分配遵循最少角色和职责分离
- [ ] 角色层级不超过 3 层，无循环继承
- [ ] 支持行级和列级数据权限
- [ ] 权限数据缓存，变更时主动失效
- [ ] 动态权限变更立即生效，有审计日志
- [ ] 权限操作有完整审计日志，定期审查
