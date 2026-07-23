# Audit

## Overview

审计日志规范，涵盖审计日志设计、审计字段、操作日志、数据变更追踪、审计日志存储、查询与保留策略、合规要求和审计日志安全。适用于所有需要操作审计和数据追溯的后端系统。

---

## Rules

### R01 — 审计日志设计

**MUST** — 审计日志必须记录以下核心要素（5W）：

| 要素 | 字段 | 说明 |
|------|------|------|
| Who | `operator_id` | 操作人 ID |
| What | `action` | 操作类型（CREATE / UPDATE / DELETE / READ） |
| When | `operated_at` | 操作时间（ISO 8601） |
| Where | `source_ip` | 操作来源 IP |
| Why | `reason` | 操作原因（可选） |

**审计日志数据模型：**

```sql
CREATE TABLE audit_log (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    trace_id        VARCHAR(64) NOT NULL,
    operator_id     VARCHAR(64) NOT NULL,
    operator_name   VARCHAR(128),
    action          VARCHAR(32) NOT NULL,
    resource_type   VARCHAR(64) NOT NULL,
    resource_id     VARCHAR(128) NOT NULL,
    resource_name   VARCHAR(256),
    source_ip       VARCHAR(45),
    user_agent      VARCHAR(512),
    request_path    VARCHAR(256),
    request_method  VARCHAR(8),
    before_value    JSON,
    after_value     JSON,
    diff_value      JSON,
    reason          VARCHAR(512),
    status          VARCHAR(16) NOT NULL DEFAULT 'SUCCESS',
    error_message   TEXT,
    operated_at     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX idx_operator_id (operator_id),
    INDEX idx_resource (resource_type, resource_id),
    INDEX idx_action (action),
    INDEX idx_operated_at (operated_at)
);
```

✅ Correct:

```json
{
    "traceId": "abc-123-def",
    "operatorId": "user_001",
    "operatorName": "Alice",
    "action": "UPDATE",
    "resourceType": "User",
    "resourceId": "123",
    "sourceIp": "10.0.1.100",
    "operatedAt": "2024-01-15T08:30:00.000Z"
}
```

❌ Wrong:

```json
{
    "action": "修改了用户",
    "time": "2024-01-15"
}
```

---

### R02 — 审计字段

**MUST** — 核心业务表必须包含以下审计字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| `created_by` | VARCHAR(64) | 创建人 ID |
| `created_at` | TIMESTAMP(3) | 创建时间 |
| `updated_by` | VARCHAR(64) | 最后修改人 ID |
| `updated_at` | TIMESTAMP(3) | 最后修改时间 |
| `deleted_by` | VARCHAR(64) | 删除人 ID（软删除） |
| `deleted_at` | TIMESTAMP(3) | 删除时间（软删除） |

✅ Correct:

```sql
CREATE TABLE t_user (
    id          BIGINT PRIMARY KEY,
    username    VARCHAR(64) NOT NULL,
    email       VARCHAR(128),
    created_by  VARCHAR(64) NOT NULL,
    created_at  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_by  VARCHAR(64) NOT NULL,
    updated_at  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    deleted_by  VARCHAR(64),
    deleted_at  TIMESTAMP(3)
);
```

❌ Wrong:

```sql
CREATE TABLE t_user (
    id          BIGINT PRIMARY KEY,
    username    VARCHAR(64) NOT NULL
    -- 缺少审计字段
);
```

**审计字段自动填充（JPA / MyBatis-Plus）：**

✅ Correct (MyBatis-Plus):

```java
@Component
public class AuditMetaObjectHandler implements MetaObjectHandler {

    @Override
    public void insertFill(MetaObject metaObject) {
        this.strictInsertFill(metaObject, "createdBy", String.class, getCurrentUserId());
        this.strictInsertFill(metaObject, "createdAt", LocalDateTime.class, LocalDateTime.now());
        this.strictInsertFill(metaObject, "updatedBy", String.class, getCurrentUserId());
        this.strictInsertFill(metaObject, "updatedAt", LocalDateTime.class, LocalDateTime.now());
    }

    @Override
    public void updateFill(MetaObject metaObject) {
        this.strictUpdateFill(metaObject, "updatedBy", String.class, getCurrentUserId());
        this.strictUpdateFill(metaObject, "updatedAt", LocalDateTime.class, LocalDateTime.now());
    }
}
```

---

### R03 — 操作日志

**MUST** — 关键业务操作必须记录操作日志：

**必须记录的操作：**

| 类别 | 操作 | 示例 |
|------|------|------|
| 数据变更 | CREATE / UPDATE / DELETE | 创建用户、修改订单状态 |
| 权限变更 | GRANT / REVOKE | 分配角色、撤销权限 |
| 认证事件 | LOGIN / LOGOUT / LOGIN_FAIL | 用户登录、登出 |
| 系统配置 | CONFIG_CHANGE | 修改系统参数 |
| 数据导出 | EXPORT | 导出用户数据 |
| 审批操作 | APPROVE / REJECT | 审批通过、驳回 |

✅ Correct:

```java
@AuditLog(action = "UPDATE", resourceType = "User", description = "修改用户状态")
public void updateUserStatus(Long userId, String status) {
    User user = userRepository.findById(userId).orElseThrow();
    String oldStatus = user.getStatus();
    user.setStatus(status);
    userRepository.save(user);
    AuditContext.setDiff("status", oldStatus, status);
}
```

❌ Wrong:

```java
// 关键操作无审计日志
public void updateUserStatus(Long userId, String status) {
    User user = userRepository.findById(userId).orElseThrow();
    user.setStatus(status);
    userRepository.save(user);
}
```

---

### R04 — 数据变更追踪

**MUST** — 数据变更必须记录变更前后的值（Diff）：

**变更追踪方式：**

| 方式 | 适用场景 | 存储格式 |
|------|---------|---------|
| 全量快照 | 变更频率低、数据量小 | `before_value` + `after_value` |
| 字段 Diff | 变更频率高、数据量大 | `diff_value` |
| Event Sourcing | 需要完整事件回放 | 事件流 |

✅ Correct (字段 Diff):

```json
{
    "diff_value": {
        "status": {
            "old": "ACTIVE",
            "new": "SUSPENDED"
        },
        "updated_by": {
            "old": "system",
            "new": "admin_001"
        }
    }
}
```

✅ Correct (全量快照):

```json
{
    "before_value": {
        "id": 123,
        "username": "alice",
        "status": "ACTIVE"
    },
    "after_value": {
        "id": 123,
        "username": "alice",
        "status": "SUSPENDED"
    }
}
```

**敏感字段脱敏：**

✅ Correct:

```json
{
    "diff_value": {
        "password": {
            "old": "***",
            "new": "***"
        }
    }
}
```

❌ Wrong:

```json
{
    "diff_value": {
        "password": {
            "old": "plaintext_old",
            "new": "plaintext_new"
        }
    }
}
```

---

### R05 — 审计日志存储

**MUST** — 审计日志与业务数据分离存储：

| 存储方案 | 适用场景 | 说明 |
|----------|---------|------|
| 独立数据库表 | 中小规模 | 简单，查询方便 |
| Elasticsearch | 大规模 / 全文搜索 | 支持复杂查询和聚合 |
| 对象存储（S3 / OSS） | 归档 | 成本低，查询需加载 |
| 专用审计系统 | 合规要求高 | 如 ELK / Splunk |

**存储策略：**

```
热数据（近 90 天）  → Elasticsearch / 数据库
温数据（90 天 - 1 年）→ 压缩归档到对象存储
冷数据（1 年以上）  → 对象存储长期保留
```

✅ Correct:

```yaml
# logback-spring.xml — 审计日志独立 Appender
<appender name="AUDIT" class="ch.qos.logback.core.rolling.RollingFileAppender">
    <file>logs/audit.log</file>
    <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
        <fileNamePattern>logs/audit.%d{yyyy-MM-dd}.log.gz</fileNamePattern>
        <maxHistory>365</maxHistory>
    </rollingPolicy>
</appender>

<logger name="AUDIT_LOGGER" level="INFO" additivity="false">
    <appender-ref ref="AUDIT"/>
</logger>
```

---

### R06 — 查询与保留策略

**MUST** — 审计日志必须支持查询，并定义保留策略：

**查询维度：**

| 维度 | 示例 |
|------|------|
| 按操作人 | 查询某用户的所有操作 |
| 按资源 | 查询某订单的变更历史 |
| 按时间范围 | 查询某时间段的操作 |
| 按操作类型 | 查询所有删除操作 |
| 按 Trace ID | 查询某次请求的完整链路 |

**保留策略：**

| 数据类型 | 保留期限 | 法律依据 |
|----------|---------|---------|
| 金融交易 | 7 年 | 金融监管要求 |
| 用户隐私数据操作 | 5 年 | GDPR / 个保法 |
| 系统操作日志 | 1 年 | 内部合规 |
| 登录日志 | 180 天 | 网络安全法 |

✅ Correct:

```sql
-- 定期归档（cron job）
INSERT INTO audit_log_archive
SELECT * FROM audit_log
WHERE operated_at < DATE_SUB(NOW(), INTERVAL 90 DAY);

DELETE FROM audit_log
WHERE operated_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
```

---

### R07 — 合规要求

**MUST** — 审计日志满足以下合规要求：

| 合规标准 | 要求 |
|----------|------|
| GDPR | 数据主体有权查询其数据操作记录 |
| 个保法 | 处理个人信息需记录处理目的和方式 |
| SOX | 财务相关操作需完整审计追踪 |
| 等保 2.0 | 安全审计需覆盖重要用户行为和系统事件 |
| PCI DSS | 支付卡数据访问需记录 |

**合规检查清单：**

- [ ] 审计日志不可篡改（Append-Only）
- [ ] 审计日志有完整性校验（Hash / 签名）
- [ ] 敏感数据脱敏后记录
- [ ] 支持按用户查询其数据操作记录
- [ ] 日志保留期限符合法规要求
- [ ] 日志访问有权限控制

✅ Correct:

```java
@Immutable
@Entity
@Table(name = "audit_log")
public class AuditLog {
    // Append-Only：无 update / delete 方法
}
```

❌ Wrong:

```java
// 允许修改审计日志
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    // 继承了 save / delete 方法，审计日志可被修改
}
```

---

### R08 — 审计日志安全

**MUST** — 审计日志本身必须受到安全保护：

| 安全措施 | 说明 |
|----------|------|
| 访问控制 | 仅安全 / 审计团队可查询 |
| 不可篡改 | Append-Only 存储，禁止 UPDATE / DELETE |
| 完整性校验 | 日志条目包含 Hash 或数字签名 |
| 传输加密 | TLS 传输到存储层 |
| 存储加密 | 静态数据加密（AES-256） |
| 异常告警 | 日志被异常删除或修改时告警 |

✅ Correct:

```sql
-- 数据库层面禁止 UPDATE / DELETE
REVOKE UPDATE, DELETE ON audit_log FROM application_user;

-- 仅审计角色可查询
GRANT SELECT ON audit_log TO audit_role;
```

**完整性校验：**

✅ Correct:

```java
public class AuditLogEntry {
    private String content;
    private String hash;

    public static AuditLogEntry create(String content, String previousHash) {
        String hash = DigestUtils.sha256Hex(content + previousHash);
        return new AuditLogEntry(content, hash);
    }
}
```

**异常告警：**

✅ Correct:

```yaml
# 监控规则
alert:
  - name: audit_log_deletion
    condition: "audit_log_count_decrease > 0"
    severity: CRITICAL
    notify: security-team
```

---

## Checklist

- [ ] 审计日志记录 5W 要素（Who / What / When / Where / Why）
- [ ] 核心业务表包含审计字段（created_by / updated_by / deleted_by）
- [ ] 关键业务操作记录操作日志
- [ ] 数据变更记录 Diff，敏感字段脱敏
- [ ] 审计日志与业务数据分离存储
- [ ] 定义日志保留策略，定期归档
- [ ] 满足合规要求（不可篡改 / 完整性校验 / 脱敏）
- [ ] 审计日志有访问控制和异常告警
