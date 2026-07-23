# MyBatis

## Overview

MyBatis 持久层规范，涵盖 Mapper 接口设计、XML Mapper 组织、ResultMap 映射、动态 SQL、分页、批量操作、缓存配置和 MyBatis vs JPA 选型指南。适用于基于 MyBatis / MyBatis-Plus 的 Java 项目。

---

## Rules

### R01 — Mapper 接口设计

**MUST** — Mapper 接口遵循以下规则：

- 一个 Mapper 对应一张主表
- 方法命名遵循统一约定
- 禁止在接口中定义业务逻辑

**方法命名约定：**

| 操作 | 方法名 | 返回类型 |
|------|--------|---------|
| 单条查询 | `selectById` / `selectByXxx` | 实体 / Optional |
| 列表查询 | `selectList` / `selectByCondition` | `List<T>` |
| 分页查询 | `selectPage` | `Page<T>` / `IPage<T>` |
| 插入 | `insert` | `int` / `long` |
| 批量插入 | `insertBatch` | `int` |
| 更新 | `updateById` / `updateByXxx` | `int` |
| 删除 | `deleteById` / `deleteByXxx` | `int` |

✅ Correct:

```java
@Mapper
public interface UserMapper {

    User selectById(@Param("id") Long id);

    List<User> selectByStatus(@Param("status") String status);

    IPage<User> selectPage(Page<User> page, @Param("query") UserQuery query);

    int insert(User user);

    int updateById(User user);

    int deleteById(@Param("id") Long id);
}
```

❌ Wrong:

```java
@Mapper
public interface UserMapper {

    User get(Long id);                    // 命名不明确

    List<User> list();                    // 缺少查询条件

    int save(User user);                  // save 语义模糊（insert or update?）

    void doSomethingComplex(Long id);     // 不应在 Mapper 中定义业务逻辑
}
```

---

### R02 — XML Mapper 组织

**MUST** — XML Mapper 文件遵循以下组织规范：

**文件位置：**

```
src/main/resources/
└── mapper/
    ├── UserMapper.xml
    ├── OrderMapper.xml
    └── ProductMapper.xml
```

**文件结构：**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.example.app.repository.UserMapper">

    <!-- 1. ResultMap -->
    <resultMap id="userResultMap" type="com.example.app.domain.User">
        <id column="id" property="id"/>
        <result column="username" property="username"/>
        <result column="email" property="email"/>
    </resultMap>

    <!-- 2. 通用 SQL 片段 -->
    <sql id="userColumns">
        id, username, email, status, created_at, updated_at
    </sql>

    <!-- 3. 查询 -->
    <select id="selectById" resultMap="userResultMap">
        SELECT <include refid="userColumns"/>
        FROM t_user
        WHERE id = #{id}
    </select>

    <!-- 4. 插入 -->
    <insert id="insert" useGeneratedKeys="true" keyProperty="id">
        INSERT INTO t_user (username, email, status)
        VALUES (#{username}, #{email}, #{status})
    </insert>

    <!-- 5. 更新 -->
    <update id="updateById">
        UPDATE t_user
        SET username = #{username}, email = #{email}
        WHERE id = #{id}
    </update>

    <!-- 6. 删除 -->
    <delete id="deleteById">
        DELETE FROM t_user WHERE id = #{id}
    </delete>

</mapper>
```

**namespace 必须与 Mapper 接口全限定名一致。**

---

### R03 — ResultMap 映射

**MUST** — 复杂映射使用 ResultMap，禁止使用 `select *`：

**一对一映射：**

```xml
<resultMap id="orderWithUserResultMap" type="com.example.app.domain.Order">
    <id column="order_id" property="id"/>
    <result column="order_no" property="orderNo"/>
    <association property="user" javaType="com.example.app.domain.User">
        <id column="user_id" property="id"/>
        <result column="username" property="username"/>
    </association>
</resultMap>
```

**一对多映射：**

```xml
<resultMap id="orderWithItemsResultMap" type="com.example.app.domain.Order">
    <id column="order_id" property="id"/>
    <result column="order_no" property="orderNo"/>
    <collection property="items" ofType="com.example.app.domain.OrderItem">
        <id column="item_id" property="id"/>
        <result column="product_name" property="productName"/>
        <result column="quantity" property="quantity"/>
    </collection>
</resultMap>
```

✅ Correct:

```xml
<resultMap id="userResultMap" type="com.example.app.domain.User">
    <id column="id" property="id"/>
    <result column="username" property="username"/>
</resultMap>

<select id="selectById" resultMap="userResultMap">
    SELECT id, username, email FROM t_user WHERE id = #{id}
</select>
```

❌ Wrong:

```xml
<select id="selectById" resultType="com.example.app.domain.User">
    SELECT * FROM t_user WHERE id = #{id}
</select>
```

---

### R04 — 动态 SQL

**MUST** — 动态 SQL 使用标准标签，禁止拼接字符串：

| 标签 | 用途 |
|------|------|
| `<if>` | 条件判断 |
| `<choose>/<when>/<otherwise>` | 多条件分支 |
| `<where>` | 动态 WHERE 子句 |
| `<set>` | 动态 UPDATE SET |
| `<foreach>` | 集合遍历 |
| `<trim>` | 自定义前后缀 |
| `<sql>/<include>` | SQL 片段复用 |

✅ Correct:

```xml
<select id="selectByCondition" resultMap="userResultMap">
    SELECT <include refid="userColumns"/>
    FROM t_user
    <where>
        <if test="username != null and username != ''">
            AND username LIKE CONCAT('%', #{username}, '%')
        </if>
        <if test="status != null">
            AND status = #{status}
        </if>
        <if test="ids != null and ids.size() > 0">
            AND id IN
            <foreach collection="ids" item="id" open="(" separator="," close=")">
                #{id}
            </foreach>
        </if>
    </where>
    ORDER BY created_at DESC
</select>
```

❌ Wrong:

```xml
<select id="selectByCondition" resultMap="userResultMap">
    SELECT * FROM t_user
    WHERE 1=1
    <if test="username != null">
        AND username LIKE '%${username}%'   <!-- ${} 存在 SQL 注入风险 -->
    </if>
</select>
```

**禁止使用 `${}` 拼接用户输入，必须使用 `#{}` 预编译。**

---

### R05 — 分页

**MUST** — 列表查询必须支持分页：

**MyBatis-Plus 分页：**

```java
@Mapper
public interface UserMapper extends BaseMapper<User> {

    IPage<User> selectPage(Page<User> page, @Param("query") UserQuery query);
}
```

```java
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserMapper userMapper;

    public IPage<User> listUsers(UserQuery query, int pageNum, int pageSize) {
        Page<User> page = new Page<>(pageNum, pageSize);
        return userMapper.selectPage(page, query);
    }
}
```

**分页参数规范：**

| 参数 | 类型 | 默认值 | 约束 |
|------|------|--------|------|
| `pageNum` | int | 1 | ≥ 1 |
| `pageSize` | int | 20 | 1 ~ 100 |

✅ Correct:

```java
Page<User> page = new Page<>(1, 20);
IPage<User> result = userMapper.selectPage(page, query);
```

❌ Wrong:

```java
// 无分页，全量查询
List<User> allUsers = userMapper.selectList(null);
```

---

### R06 — 批量操作

**MUST** — 批量操作使用专用方法，禁止循环单条操作：

✅ Correct:

```xml
<insert id="insertBatch" useGeneratedKeys="true" keyProperty="id">
    INSERT INTO t_user (username, email, status)
    VALUES
    <foreach collection="list" item="user" separator=",">
        (#{user.username}, #{user.email}, #{user.status})
    </foreach>
</insert>
```

```java
@Mapper
public interface UserMapper {

    int insertBatch(@Param("list") List<User> users);
}
```

**MyBatis-Plus 批量插入：**

```java
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserMapper userMapper;

    @Transactional
    public void batchInsert(List<User> users) {
        MybatisBatch<User> batch = new MybatisBatch<>(userMapper, users, 500);
        batch.execute((mapper, user) -> mapper.insert(user));
    }
}
```

❌ Wrong:

```java
// 循环单条插入 — 性能极差
for (User user : users) {
    userMapper.insert(userMapper.insert(user));
}
```

**批量操作限制：**

- 单次最多 500 条
- 超过 500 条分批执行
- 必须在事务中执行

---

### R07 — 缓存配置

**SHOULD** — 合理使用 MyBatis 缓存：

| 缓存类型 | 作用域 | 默认 | 建议 |
|----------|--------|------|------|
| 一级缓存 | SqlSession | 开启 | 保持开启 |
| 二级缓存 | Mapper namespace | 关闭 | 谨慎开启 |

**二级缓存使用条件：**

- 查询远多于修改
- 数据实时性要求不高
- 缓存数据量可控

✅ Correct (简单场景):

```xml
<mapper namespace="com.example.app.repository.DictMapper">
    <cache
        eviction="LRU"
        flushInterval="60000"
        size="512"
        readOnly="true"/>
</mapper>
```

❌ Wrong:

```xml
<!-- 全局开启二级缓存 — 数据一致性风险 -->
<setting name="cacheEnabled" value="true"/>
```

**生产环境推荐使用 Redis 缓存替代 MyBatis 二级缓存。**

---

### R08 — MyBatis vs JPA 选型指南

**SHOULD** — 根据场景选择 ORM 框架：

| 维度 | MyBatis | JPA (Hibernate) |
|------|---------|----------------|
| SQL 控制 | 完全控制 | 自动生成，可自定义 |
| 学习曲线 | 低（SQL 基础即可） | 高（需理解 Session / Entity 生命周期） |
| 复杂查询 | 优势（动态 SQL 灵活） | 劣势（JPQL / Criteria API 复杂） |
| 简单 CRUD | 需写 XML / 注解 | 自动生成（Repository 接口） |
| 数据库迁移 | 容易（SQL 可控） | 较难（Dialect 依赖） |
| 批量操作 | 优势（原生 SQL） | 劣势（需 flush / clear） |
| N+1 问题 | 需手动优化 | 需理解 LAZY / EAGER |
| 报表统计 | 优势 | 劣势 |

**选型建议：**

| 场景 | 推荐 |
|------|------|
| CRUD 为主、快速开发 | JPA |
| 复杂 SQL、报表、统计 | MyBatis |
| 多数据库兼容 | JPA |
| 需要精细 SQL 调优 | MyBatis |
| 团队 SQL 能力强 | MyBatis |
| 团队 OOP 能力强 | JPA |

**同一项目可混合使用**，但需在模块边界明确划分，避免同一实体同时使用两种框架。

---

## Checklist

- [ ] Mapper 接口方法命名遵循统一约定
- [ ] XML Mapper namespace 与接口全限定名一致
- [ ] 复杂映射使用 ResultMap，禁止 `select *`
- [ ] 动态 SQL 使用标准标签，禁止 `${}` 拼接用户输入
- [ ] 列表查询支持分页，单页最大 100 条
- [ ] 批量操作使用专用方法，单批最多 500 条
- [ ] 二级缓存谨慎开启，生产环境优先使用 Redis
- [ ] MyBatis / JPA 选型有明确依据
