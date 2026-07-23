# Database

## Overview

关系型数据库设计规范，涵盖表命名、字段设计、主键策略、索引优化、Migration 管理等。适用于 MySQL / PostgreSQL 为主的关系型数据库项目。

---

## Rules

### R01 — 表命名规范

**MUST** — 表名必须遵循以下规则：

- 使用 snake_case
- 使用业务前缀（避免跨业务表名冲突）
- 使用单数名词（表示一个实体）
- 使用小写字母
- 禁止使用数据库保留字
- 关联表使用 `{entity_a}_{entity_b}` 格式

✅ Correct:

```sql
usr_user
usr_role
usr_user_role
ord_order
ord_order_item
pay_payment
sys_config
```

❌ Wrong:

```sql
Users           -- PascalCase
usr_users       -- 复数
User            -- 无业务前缀
t_user          -- 通用前缀无业务含义
order           -- 数据库保留字
usr_user_roles  -- 关联表使用复数
```

**业务前缀参考：**

| 前缀 | 业务域 | 示例 |
|------|--------|------|
| `usr_` | 用户 | `usr_user`, `usr_role` |
| `ord_` | 订单 | `ord_order`, `ord_order_item` |
| `pay_` | 支付 | `pay_payment`, `pay_refund` |
| `inv_` | 库存 | `inv_product`, `inv_stock` |
| `msg_` | 消息 | `msg_notification`, `msg_template` |
| `sys_` | 系统 | `sys_config`, `sys_dict` |

---

### R02 — 字段命名规范

**MUST** — 字段名必须遵循以下规则：

- 使用 snake_case
- 使用小写字母
- 命名应有明确业务含义，禁止使用缩写（除通用缩写外）
- 布尔字段使用 `is_` / `has_` / `can_` 前缀
- 时间字段使用 `_at` 后缀（如 `created_at`）
- 日期字段使用 `_date` 后缀（如 `birth_date`）
- 数量字段使用 `_count` / `_num` 后缀
- 金额字段使用 `_amount` / `_fee` 后缀

✅ Correct:

```sql
user_name
email_address
is_active
has_permission
can_edit
created_at
expired_at
birth_date
order_count
total_amount
```

❌ Wrong:

```sql
userName          -- camelCase
UserName          -- PascalCase
EMAIL             -- 全大写
nm                -- 无意义缩写
active            -- 布尔字段缺少 is_ 前缀
created           -- 时间字段缺少 _at 后缀
money             -- 金额字段不明确
```

**通用缩写白名单：**

| 缩写 | 全称 | 使用场景 |
|------|------|---------|
| `id` | identifier | 主键 |
| `url` | uniform resource locator | 链接地址 |
| `ip` | internet protocol | IP 地址 |
| `img` | image | 图片路径 |
| `desc` | description | 描述 |
| `qty` | quantity | 数量 |
| `amt` | amount | 金额 |

---

### R03 — 主键设计

**MUST** — 主键必须遵循以下规则：

- 单独的 `id` 字段，不使用业务字段作为主键
- 不使用复合主键
- 主键不可修改
- 主键类型选择根据场景决定

**主键策略对比：**

| 策略 | 类型 | 优点 | 缺点 | 适用场景 |
|------|------|------|------|---------|
| 自增 ID | `BIGINT UNSIGNED` | 简单、有序、索引性能好 | 可预测、分布式不唯一 | 单库单表 |
| 雪花 ID | `BIGINT` | 有序、分布式唯一、含时间信息 | 依赖时钟、实现稍复杂 | 分布式系统 |
| UUID | `CHAR(36)` / `BINARY(16)` | 全局唯一、无需协调 | 无序、索引性能差、存储大 | 仅特殊场景 |

**MUST** — 分布式系统必须使用雪花 ID 或类似有序分布式 ID 方案。

**SHOULD** — 单库单表场景使用自增 ID。

✅ Correct:

```sql
CREATE TABLE ord_order (
    id BIGINT NOT NULL COMMENT '雪花ID',
    ...
);

CREATE TABLE sys_config (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '自增ID',
    ...
);
```

❌ Wrong:

```sql
CREATE TABLE usr_user (
    email VARCHAR(255) PRIMARY KEY,
    ...
);

CREATE TABLE ord_order_item (
    order_id BIGINT,
    item_id BIGINT,
    PRIMARY KEY (order_id, item_id),
    ...
);

CREATE TABLE ord_order (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    ...
);
```

**雪花 ID 注意事项：**

- Worker ID 必须持久化，重启后不变化
- 时钟回拨必须有检测和容忍机制
- ID 生成服务需高可用（嵌入式生成优于独立服务）

---

### R04 — 字段类型选择

**MUST** — 字段类型必须按以下规则选择：

| 场景 | MySQL | PostgreSQL | 说明 |
|------|-------|-----------|------|
| 金额 | `DECIMAL(M, N)` | `NUMERIC(M, N)` | 禁止使用 FLOAT / DOUBLE |
| 状态 / 枚举 | `TINYINT UNSIGNED` | `SMALLINT` | 禁止使用 ENUM 类型 |
| 布尔 | `TINYINT(1)` | `BOOLEAN` | 0/1 表示 |
| 字符串（短） | `VARCHAR(N)` | `VARCHAR(N)` | 明确指定长度 |
| 字符串（长文本） | `TEXT` | `TEXT` | 参见 R10 |
| 时间戳 | `DATETIME(3)` / `TIMESTAMP(3)` | `TIMESTAMPTZ` | 精度到毫秒 |
| 日期 | `DATE` | `DATE` | 仅日期 |
| 整数 | `INT UNSIGNED` / `BIGINT UNSIGNED` | `INTEGER` / `BIGINT` | 无负数场景用 UNSIGNED |
| 二进制 | `BLOB` | `BYTEA` | 参见 R10 |
| JSON | `JSON` | `JSONB` | PostgreSQL 优先 JSONB |

✅ Correct:

```sql
price        DECIMAL(12, 2)      NOT NULL COMMENT '金额'
status       TINYINT UNSIGNED    NOT NULL COMMENT '状态: 0-禁用 1-启用'
is_active    TINYINT(1)          NOT NULL DEFAULT 1 COMMENT '是否启用'
user_name    VARCHAR(64)         NOT NULL COMMENT '用户名'
description  TEXT                NULL COMMENT '描述'
created_at   DATETIME(3)         NOT NULL COMMENT '创建时间'
```

❌ Wrong:

```sql
price        FLOAT               -- 金额使用浮点数，精度丢失
status       ENUM('active','inactive')  -- 使用 ENUM 类型，扩展困难
is_active    CHAR(1)             -- 布尔使用字符串
user_name    TEXT                -- 短文本使用 TEXT
created_at   VARCHAR(20)         -- 时间使用字符串存储
```

**金额字段规则：**

- **MUST** — 金额使用 `DECIMAL(12, 2)` 或更高精度
- 汇率场景使用 `DECIMAL(18, 8)`
- 禁止在应用层使用 `float` / `double` 计算金额
- 金额单位统一为"分"时，可使用 `BIGINT` 存储

---

### R05 — 必备字段

**MUST** — 每张业务表必须包含以下字段：

```sql
id           BIGINT          NOT NULL COMMENT '主键',
created_at   DATETIME(3)     NOT NULL COMMENT '创建时间',
updated_at   DATETIME(3)     NOT NULL COMMENT '更新时间',
deleted_at   DATETIME(3)     NULL     COMMENT '删除时间（软删除）',
created_by   BIGINT          NULL     COMMENT '创建人ID',
updated_by   BIGINT          NULL     COMMENT '更新人ID',
```

**SHOULD** — 根据业务需要，可额外添加：

```sql
version      INT UNSIGNED    NOT NULL DEFAULT 1 COMMENT '乐观锁版本号',
remark       VARCHAR(512)    NULL     COMMENT '备注',
```

✅ Correct:

```sql
CREATE TABLE ord_order (
    id          BIGINT          NOT NULL COMMENT '主键',
    order_no    VARCHAR(32)     NOT NULL COMMENT '订单编号',
    status      TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '状态',
    created_at  DATETIME(3)     NOT NULL COMMENT '创建时间',
    updated_at  DATETIME(3)     NOT NULL COMMENT '更新时间',
    deleted_at  DATETIME(3)     NULL     COMMENT '删除时间',
    created_by  BIGINT          NULL     COMMENT '创建人ID',
    updated_by  BIGINT          NULL     COMMENT '更新人ID',
    PRIMARY KEY (id)
);
```

❌ Wrong:

```sql
CREATE TABLE ord_order (
    id          BIGINT NOT NULL AUTO_INCREMENT,
    order_no    VARCHAR(32) NOT NULL,
    status      TINYINT NOT NULL DEFAULT 0,
    PRIMARY KEY (id)
);
```

---

### R06 — 索引设计

**MUST** — 索引设计必须遵循以下规则：

#### 索引命名

| 索引类型 | 命名格式 | 示例 |
|----------|---------|------|
| 主键 | `pk_{table_name}` | `pk_ord_order` |
| 唯一索引 | `uk_{table_name}_{columns}` | `uk_ord_order_order_no` |
| 普通索引 | `idx_{table_name}_{columns}` | `idx_ord_order_status_created_at` |
| 联合索引 | `idx_{table_name}_{col1}_{col2}` | `idx_ord_order_user_id_status` |

#### 联合索引最左前缀

**MUST** — 联合索引遵循最左前缀原则，将区分度高的字段放在前面：

✅ Correct:

```sql
CREATE INDEX idx_ord_order_user_id_status ON ord_order (user_id, status);
```

❌ Wrong:

```sql
CREATE INDEX idx_ord_order_status_user_id ON ord_order (status, user_id);

CREATE INDEX idx_ord_order_user_id ON ord_order (user_id);
```

#### 索引使用原则

- **MUST** — 单表索引数不超过 5 个
- **MUST** — 联合索引字段数不超过 5 个
- **MUST** — 避免冗余索引（已有 `(a, b)` 不再单独建 `(a)`）
- **SHOULD** — 频繁作为 WHERE 条件的字段建索引
- **MUST NOT** — 低区分度字段（如 `is_active`）不单独建索引
- **MUST NOT** — 频繁更新的字段不建过多索引

---

### R07 — 外键规范

**MUST** — 禁止使用物理外键（`FOREIGN KEY` 约束），使用逻辑外键：

**原因：**

- 物理外键导致 DDL 变更困难
- 物理外键引发级联锁，影响并发性能
- 物理外键在分库分表后无法使用
- 数据一致性应在应用层保障

✅ Correct:

```sql
CREATE TABLE ord_order_item (
    id          BIGINT        NOT NULL COMMENT '主键',
    order_id    BIGINT        NOT NULL COMMENT '订单ID（逻辑外键 → ord_order.id）',
    product_id  BIGINT        NOT NULL COMMENT '商品ID（逻辑外键 → inv_product.id）',
    ...
    CREATE INDEX idx_ord_order_item_order_id ON ord_order_item (order_id);
);
```

❌ Wrong:

```sql
CREATE TABLE ord_order_item (
    id          BIGINT NOT NULL,
    order_id    BIGINT NOT NULL,
    ...
    CONSTRAINT fk_order_item_order FOREIGN KEY (order_id) REFERENCES ord_order (id)
        ON DELETE CASCADE,
);
```

---

### R08 — 软删除

**MUST** — 业务表必须使用软删除，禁止物理删除：

- 使用 `deleted_at` 字段标记删除
- `NULL` 表示未删除，非 `NULL` 值为删除时间
- 所有查询默认过滤 `deleted_at IS NULL`
- 唯一索引必须包含 `deleted_at` 字段

✅ Correct:

```sql
CREATE UNIQUE INDEX uk_usr_user_email_deleted
    ON usr_user (email, deleted_at);

SELECT * FROM usr_user WHERE deleted_at IS NULL AND email = ?;
```

❌ Wrong:

```sql
DELETE FROM usr_user WHERE id = ?;

CREATE UNIQUE INDEX uk_usr_user_email ON usr_user (email);

is_deleted TINYINT(1) DEFAULT 0
```

---

### R09 — 枚举 / 状态字段

**MUST** — 枚举和状态字段遵循以下规则：

- 数据库使用整数类型（`TINYINT UNSIGNED`），禁止使用 ENUM 类型
- 每个枚举值必须有明确含义，在字段 COMMENT 中列出
- 应用层定义枚举类，禁止魔法数字

✅ Correct:

```sql
status TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '状态: 0-待支付 1-已支付 2-已取消 3-已退款'
```

```java
public enum OrderStatus {
    PENDING(0, "待支付"),
    PAID(1, "已支付"),
    CANCELLED(2, "已取消"),
    REFUNDED(3, "已退款");
}
```

❌ Wrong:

```sql
status ENUM('pending', 'paid', 'cancelled', 'refunded')
status VARCHAR(20) COMMENT '状态'
status TINYINT UNSIGNED COMMENT '状态'
```

---

### R10 — 大字段处理

**MUST** — TEXT / BLOB 类型字段必须与主表分离：

- TEXT / BLOB 与主表分离，使用独立表存储
- 一张表最多一个 TEXT / BLOB 字段
- 大字段表使用相同主键（1:1 关联）

✅ Correct:

```sql
CREATE TABLE ord_order (
    id          BIGINT        NOT NULL COMMENT '主键',
    order_no    VARCHAR(32)   NOT NULL COMMENT '订单编号',
    ...
    PRIMARY KEY (id)
);

CREATE TABLE ord_order_ext (
    id              BIGINT        NOT NULL COMMENT '主键（同 ord_order.id）',
    remark          TEXT          NULL COMMENT '备注',
    attachment      BLOB          NULL COMMENT '附件',
    PRIMARY KEY (id)
);
```

❌ Wrong:

```sql
CREATE TABLE ord_order (
    id          BIGINT        NOT NULL,
    order_no    VARCHAR(32)   NOT NULL,
    remark      TEXT          NULL,
    attachment  BLOB          NULL,
    description TEXT          NULL,
    PRIMARY KEY (id)
);
```

---

### R11 — Migration 规范

**MUST** — 数据库变更必须通过 Migration 管理，禁止手动执行 DDL：

#### 文件命名

```
V{version}__{description}.sql

示例:
V20240115103000__add_order_remark_column.sql
```

#### DDL 变更原则

- **MUST** — 所有 DDL 变更必须可回滚
- **MUST** — 变更必须向后兼容，先扩后缩
- **MUST** — 新增字段必须有默认值或允许 NULL
- **MUST NOT** — 修改字段类型时直接 ALTER（应新增字段 → 迁移数据 → 删除旧字段）

✅ Correct:

```sql
ALTER TABLE ord_order ADD COLUMN remark VARCHAR(512) DEFAULT NULL COMMENT '备注';
```

❌ Wrong:

```sql
ALTER TABLE usr_user MODIFY COLUMN phone BIGINT;
ALTER TABLE usr_user DROP COLUMN phone;
ALTER TABLE ord_order ADD COLUMN priority INT NOT NULL;
```

#### 大表变更

**MUST** — 单表数据量超过 100 万行时，DDL 变更必须：

- 使用 `pt-online-schema-change`（MySQL）或 `pg_repack`（PostgreSQL）
- 在低峰期执行
- 提前评估执行时间
- 准备回滚方案

---

### R12 — SQL 编写规范

**MUST** — SQL 编写必须遵循以下规则：

- **MUST** — 禁止 `SELECT *`，明确指定字段
- **MUST** — WHERE 条件必须使用索引字段
- **MUST** — 避免在 WHERE 条件中对字段使用函数
- **MUST** — LIKE 查询禁止前缀通配符 `%keyword`
- **MUST** — 大表分页使用游标分页，避免 `OFFSET` 过大
- **MUST** — 批量插入单次不超过 500 条
- **MUST** — INSERT 必须明确指定字段列表
- **SHOULD** — UPDATE / DELETE 必须带 WHERE 条件

✅ Correct:

```sql
SELECT id, order_no, status FROM ord_order WHERE user_id = ?;

SELECT id, order_no FROM ord_order
WHERE created_at >= '2024-01-01 00:00:00'
  AND created_at < '2024-02-01 00:00:00';

SELECT id, order_no FROM ord_order WHERE id > ? ORDER BY id LIMIT 20;
```

❌ Wrong:

```sql
SELECT * FROM ord_order WHERE user_id = ?;

SELECT id FROM ord_order WHERE DATE(created_at) = '2024-01-15';

SELECT id FROM usr_user WHERE user_name LIKE '%alice%';

SELECT id FROM ord_order ORDER BY id LIMIT 100000, 20;
```

---

### R13 — 审计字段自动填充

**MUST** — 审计字段必须自动填充，禁止手动赋值：

```java
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class BaseEntity {

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @CreatedBy
    @Column(nullable = true, updatable = false)
    private Long createdBy;

    @LastModifiedBy
    @Column(nullable = true)
    private Long updatedBy;
}
```

**注意：**

- `created_at` 必须 `updatable = false`
- `created_by` 必须 `updatable = false`
- 数据库默认值仅作兜底，应用层必须主动设置

---

### R14 — 数据库字符集与排序规则

**MUST** — 数据库字符集必须统一配置：

#### MySQL

| 配置项 | 推荐值 | 说明 |
|--------|--------|------|
| 字符集 | `utf8mb4` | 支持 4 字节 Unicode（含 Emoji） |
| 排序规则 | `utf8mb4_0900_ai_ci`（MySQL 8.0+） | 基于 Unicode 9.0 |

**MUST NOT** — 禁止使用 `utf8`（MySQL 的 `utf8` 是 `utf8mb3`，不支持 4 字节字符）。

#### PostgreSQL

| 配置项 | 推荐值 | 说明 |
|--------|--------|------|
| 编码 | `UTF8` | Unicode |
| 排序规则 | `en_US.utf8` 或 `zh_CN.utf8` | 按业务需求 |

---

### R15 — 分库分表规范

**SHOULD** — 数据量达到以下阈值时考虑分库分表：

| 指标 | 阈值 |
|------|------|
| 单表行数 | > 1000 万行 |
| 单表数据量 | > 10 GB |

**MUST** — 分库分表前必须优先尝试：优化索引 → 优化 SQL → 读写分离 → 缓存 → 冷热分离 → 归档

**MUST** — 分片键选择规则：

- 必须是高频查询条件
- 必须保证数据均匀分布
- 必须在分片键上进行查询（避免全分片扫描）

**MUST** — 分库分表注意事项：

- 跨分片 JOIN 禁止，改用应用层组装
- 分布式事务尽量避免，优先使用最终一致性
- 全局唯一 ID 必须使用分布式 ID 方案
- 分片数必须是 2 的幂次（便于扩容翻倍）

---

## Checklist

- [ ] 表名使用 snake_case + 业务前缀 + 单数名词
- [ ] 字段名使用 snake_case，布尔字段 `is_` 前缀，时间字段 `_at` 后缀
- [ ] 主键使用雪花 ID（分布式）或自增 ID（单库）
- [ ] 金额使用 DECIMAL，状态使用 TINYINT，时间使用 DATETIME(3)
- [ ] 每张业务表包含 id / created_at / updated_at / deleted_at / created_by / updated_by
- [ ] 索引命名规范（pk_ / uk_ / idx_），联合索引遵循最左前缀
- [ ] 使用逻辑外键，禁止物理外键
- [ ] 使用 deleted_at 软删除，唯一索引包含 deleted_at
- [ ] 枚举使用整数类型 + COMMENT 列出值，禁止 ENUM 类型
- [ ] TEXT / BLOB 分离到扩展表
- [ ] Migration 文件命名规范，DDL 变更向后兼容
- [ ] 禁止 SELECT *，WHERE 条件不使用函数，游标分页替代大 OFFSET
- [ ] 审计字段自动填充，created_at / created_by 不可修改
- [ ] 字符集使用 utf8mb4（MySQL）/ UTF8（PostgreSQL），禁止 utf8
- [ ] 分库分表前优先优化，分片键保证均匀分布，禁止跨分片 JOIN
