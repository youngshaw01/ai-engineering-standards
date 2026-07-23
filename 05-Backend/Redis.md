# Redis

## Overview

Redis 工程规范，涵盖 Key 命名、数据结构选择、缓存策略、TTL 管理、缓存三大问题防护、序列化、Big Key / Hot Key 处理、分布式锁、集群与分片、内存淘汰策略、监控与告警等。适用于以 Redis 为缓存或数据存储的后端项目。

---

## Rules

### R01 — Key 命名规范

**MUST** — Key 必须遵循 `业务前缀:实体:ID` 格式：

- 使用冒号 `:` 作为层级分隔符（Redis 社区惯例）
- 业务前缀 2~4 个字符，标识所属业务域
- 实体名单数名词
- ID 部分使用业务唯一标识
- Key 全长不超过 128 字节
- 禁止使用特殊字符（空格、换行、引号）
- Key 名全部使用小写字母 + 数字 + 冒号 + 下划线

✅ Correct:

```
usr:user:10001
ord:order:202401150001
pay:refund:90001
inv:stock:sku_8899
msg:template:welcome
sys:config:mail_smtp
```

❌ Wrong:

```
user_10001              -- 无业务前缀，无层级
ORD:ORDER:10001         -- 大写
usr:users:10001         -- 复数
usr:user                -- 缺少 ID，无法区分实例
order:10001             -- 前缀过长且无层级
usr:user:10001:detail:extra:info  -- 层级过深
```

**业务前缀参考：**

| 前缀 | 业务域 | 示例 |
|------|--------|------|
| `usr` | 用户 | `usr:user:10001`, `usr:token:abc123` |
| `ord` | 订单 | `ord:order:202401150001`, `ord:cart:10001` |
| `pay` | 支付 | `pay:payment:90001`, `pay:refund:90001` |
| `inv` | 库存 | `inv:stock:sku_8899`, `inv:product:100` |
| `msg` | 消息 | `msg:notification:10001`, `msg:template:welcome` |
| `sys` | 系统 | `sys:config:mail_smtp`, `sys:dict:order_status` |

---

### R02 — 数据结构选择

**MUST** — 根据数据特征选择合适的数据结构，禁止所有场景都用 String：

| 数据结构 | 适用场景 | 不适用场景 |
|----------|---------|-----------|
| `String` | 简单 KV、计数器、分布式锁、缓存对象 | 需要部分更新的对象 |
| `Hash` | 对象属性存储（用户信息、商品详情） | 需要排序、范围查询 |
| `List` | 消息队列（简单场景）、最新列表、时间线 | 需要去重、随机访问 |
| `Set` | 去重集合、标签、共同好友、抽奖 | 需要排序 |
| `Sorted Set` | 排行榜、延迟队列、带权重的集合 | 无需排序的简单集合 |
| `Stream` | 消息队列（可靠场景）、事件流 | 简单 KV 缓存 |

✅ Correct:

```
-- 用户信息：使用 Hash，支持部分字段读写
HSET usr:user:10001 name "张三" age 28 email "zhangsan@example.com"
HGET usr:user:10001 name

-- 文章点赞数：使用 String 计数器
INCR art:like:article_100

-- 最新订单列表：使用 List
LPUSH ord:recent:10001 order_202401150001
LRANGE ord:recent:10001 0 9

-- 用户标签：使用 Set
SADD usr:tags:10001 "java" "redis" "mysql"

-- 积分排行榜：使用 Sorted Set
ZADD ord:rank:daily 980 "user_10001" 870 "user_10002"

-- 消息队列：使用 Stream
XADD msg:queue:order MAXLEN ~ 10000 * orderId 202401150001 status created
```

❌ Wrong:

```
-- 用户信息使用 String 存 JSON：无法部分更新，每次需全量读写
SET usr:user:10001 '{"name":"张三","age":28,"email":"zhangsan@example.com"}'

-- 排行榜使用 List：无法按分数排序
LPUSH ord:rank:daily "user_10001:980"

-- 去重场景使用 List：无法去重
LPUSH usr:tags:10001 "java" "java" "redis"

-- 计数器使用 Hash：多余开销
HSET art:like:article_100 count 1
```

**SHOULD** — 存储对象时优先使用 Hash 而非 String + JSON 序列化，原因：

- Hash 支持 `HGET` / `HSET` 单字段操作，无需全量读写
- Hash 在字段较少时使用 ziplist 编码，内存更省
- Hash 支持 `HINCRBY` 对单个数值字段自增

---

### R03 — 缓存策略

**MUST** — 根据业务场景选择合适的缓存策略：

| 策略 | 写入方式 | 一致性 | 适用场景 |
|------|---------|--------|---------|
| Cache-Aside | 应用层管理缓存 | 最终一致 | 通用场景（推荐默认） |
| Read-Through | 缓存层自动加载 | 最终一致 | 读多写少、加载逻辑统一 |
| Write-Through | 写缓存 → 同步写 DB | 强一致 | 一致性要求高 |
| Write-Behind | 写缓存 → 异步写 DB | 最终一致 | 写入频繁、容忍少量丢失 |

**MUST** — 默认使用 Cache-Aside 模式：

✅ Correct（Cache-Aside）:

```java
public User getUser(Long userId) {
    String key = "usr:user:" + userId;
    User user = redis.get(key, User.class);
    if (user != null) {
        return user;
    }
    user = userMapper.selectById(userId);
    if (user != null) {
        redis.setex(key, 3600, user);
    }
    return user;
}

public void updateUser(User user) {
    userMapper.updateById(user);
    redis.del("usr:user:" + user.getId());
}
```

❌ Wrong:

```java
public void updateUser(User user) {
    userMapper.updateById(user);
    redis.set("usr:user:" + user.getId(), user);
}
```

> 先更新 DB 再更新缓存，可能导致并发写时数据不一致（A 先更新 DB、B 后更新 DB，但 B 先更新缓存、A 后更新缓存）。应先更新 DB 再删除缓存。

**MUST** — Cache-Aside 写操作遵循"先更新 DB，再删除缓存"：

✅ Correct:

```java
userMapper.updateById(user);
redis.del("usr:user:" + user.getId());
```

❌ Wrong:

```java
redis.del("usr:user:" + user.getId());
userMapper.updateById(user);

redis.set("usr:user:" + user.getId(), user);
userMapper.updateById(user);
```

**SHOULD** — 延迟双删用于一致性要求更高的场景：

```java
userMapper.updateById(user);
redis.del("usr:user:" + user.getId());
Thread.sleep(500);
redis.del("usr:user:" + user.getId());
```

---

### R04 — TTL 设置

**MUST** — 所有缓存 Key 必须设置 TTL，禁止永久 Key：

- **MUST** — 使用 `SETEX` 或 `EX` 参数设置过期时间
- **MUST NOT** — 使用无过期时间的 `SET`
- **SHOULD** — TTL 基础值上增加随机偏移，避免同时过期

**业务场景 TTL 参考：**

| 场景 | TTL | 说明 |
|------|-----|------|
| 验证码 | 5 分钟 | `300s` |
| Session / Token | 30 分钟 ~ 2 小时 | `1800s ~ 7200s` |
| 短信限流 | 1 分钟 | `60s` |
| 用户信息缓存 | 1 ~ 4 小时 | `3600s ~ 14400s` |
| 商品详情缓存 | 10 ~ 30 分钟 | `600s ~ 1800s` |
| 热点排行榜 | 5 ~ 15 分钟 | `300s ~ 900s` |
| 配置信息 | 10 ~ 30 分钟 | `600s ~ 1800s` |
| 分布式锁 | 10 ~ 30 秒 | `10s ~ 30s` |
| 每日统计 | 48 小时 | `172800s` |

✅ Correct:

```java
int baseTtl = 3600;
int randomOffset = ThreadLocalRandom.current().nextInt(300);
redis.setex(key, baseTtl + randomOffset, value);
```

❌ Wrong:

```java
redis.set(key, value);

redis.setex(key, 3600, value);
```

> 所有相同 TTL 的 Key 在同一时刻过期，可能引发缓存雪崩。

**SHOULD** — 对无 TTL 的历史 Key 进行定期巡检：

```bash
redis-cli --scan --pattern "usr:*" | while read key; do
    ttl=$(redis-cli TTL "$key")
    if [ "$ttl" -eq -1 ]; then
        echo "无 TTL: $key"
    fi
done
```

---

### R05 — 缓存三大问题

**MUST** — 缓存系统必须对穿透、击穿、雪崩进行防护：

#### 缓存穿透

查询不存在的数据，请求直达 DB。

**解决方案：**

| 方案 | 原理 | 适用场景 |
|------|------|---------|
| 缓存空值 | 查不到也缓存 NULL，设短 TTL | 少量无效 Key |
| 布隆过滤器 | 前置判断 Key 是否可能存在 | 大量无效 Key |
| 请求参数校验 | 拦截非法请求 | 基础防线 |

✅ Correct:

```java
public User getUser(Long userId) {
    if (userId == null || userId <= 0) {
        return null;
    }
    String key = "usr:user:" + userId;
    User user = redis.get(key, User.class);
    if (user != null) {
        return user;
    }
    String nullKey = "usr:user:null:" + userId;
    if (redis.exists(nullKey)) {
        return null;
    }
    user = userMapper.selectById(userId);
    if (user != null) {
        redis.setex(key, 3600, user);
    } else {
        redis.setex(nullKey, 60, "NULL");
    }
    return user;
}
```

❌ Wrong:

```java
public User getUser(Long userId) {
    String key = "usr:user:" + userId;
    User user = redis.get(key, User.class);
    if (user != null) {
        return user;
    }
    return userMapper.selectById(userId);
}
```

#### 缓存击穿

热点 Key 过期瞬间，大量请求同时打到 DB。

**解决方案：**

| 方案 | 原理 | 适用场景 |
|------|------|---------|
| 互斥锁 | 只允许一个线程回源 | 热点 Key 较少 |
| 逻辑过期 | 不设 TTL，数据中含逻辑过期时间，过期后异步更新 | 高可用优先 |
| 永不过期 + 异步刷新 | 热点 Key 不设 TTL，后台定时刷新 | 核心热点数据 |

✅ Correct（互斥锁）:

```java
public User getUserWithLock(Long userId) {
    String key = "usr:user:" + userId;
    User user = redis.get(key, User.class);
    if (user != null) {
        return user;
    }
    String lockKey = "lock:usr:user:" + userId;
    if (redis.setnx(lockKey, "1", 10)) {
        try {
            user = userMapper.selectById(userId);
            if (user != null) {
                redis.setex(key, 3600, user);
            } else {
                redis.setex(key, 60, "NULL");
            }
        } finally {
            redis.del(lockKey);
        }
    } else {
        Thread.sleep(50);
        return getUserWithLock(userId);
    }
    return user;
}
```

❌ Wrong:

```java
if (user == null) {
    user = userMapper.selectById(userId);
}
```

> 无防护时，100 个并发请求同时穿透到 DB。

#### 缓存雪崩

大量 Key 同时过期或 Redis 宕机，请求全部打到 DB。

**解决方案：**

| 方案 | 原理 |
|------|------|
| TTL 随机偏移 | 避免 Key 同时过期 |
| 多级缓存 | 本地缓存 + Redis 缓存 |
| Redis 高可用 | Sentinel / Cluster |
| 限流降级 | 保护 DB 不被压垮 |

✅ Correct:

```java
int baseTtl = 3600;
int randomOffset = ThreadLocalRandom.current().nextInt(600);
redis.setex(key, baseTtl + randomOffset, value);
```

❌ Wrong:

```java
redis.setex("usr:user:" + userId, 3600, value);
```

---

### R06 — 序列化规范

**MUST** — 缓存值序列化格式按以下规则选择：

| 序列化格式 | 体积 | 可读性 | 跨语言 | 适用场景 |
|-----------|------|--------|--------|---------|
| JSON | 较大 | 好 | 好 | 通用场景、需要人工可读 |
| MessagePack | 较小 | 不可读 | 好 | 高性能场景、跨语言 |
| Protobuf | 小 | 不可读 | 好 | 高性能、Schema 固定场景 |
| JDK 序列化 | 大 | 不可读 | 仅 Java | **禁止使用** |

**MUST NOT** — 禁止使用 Java 原生序列化：

- 体积大（约为 JSON 的 2~3 倍）
- 存在安全漏洞（反序列化攻击）
- 跨语言不可用
- 版本兼容性差

✅ Correct:

```java
RedisSerializer<String> keySerializer = RedisSerializer.string();
RedisSerializer<Object> valueSerializer = new GenericJackson2JsonRedisSerializer();

RedisTemplate<String, Object> template = new RedisTemplate<>();
template.setKeySerializer(keySerializer);
template.setHashKeySerializer(keySerializer);
template.setValueSerializer(valueSerializer);
template.setHashValueSerializer(valueSerializer);
```

❌ Wrong:

```java
RedisTemplate<Object, Object> template = new RedisTemplate<>();

template.setDefaultSerializer(new JdkSerializationRedisSerializer());
```

> JDK 序列化在 Redis 中存储后不可读，体积大，且存在反序列化安全风险。

**SHOULD** — 同一项目统一使用一种序列化格式，禁止混用：

- 纯 Java 项目推荐 JSON（Jackson）
- 对性能敏感且跨语言场景推荐 MessagePack 或 Protobuf
- Key 一律使用 String 序列化

---

### R07 — Big Key 处理

**MUST** — 禁止写入 Big Key：

- String 类型：不超过 10 KB
- Hash 类型：字段数不超过 5000
- List / Set / Sorted Set 类型：元素数不超过 5000
- 总 Key 内存占用不超过 1 MB

**Big Key 危害：**

- 阻塞 Redis（单线程模型，大 Key 操作耗时长）
- 网络拥塞（大 Value 传输占用带宽）
- 集群不均衡（Slot 数据倾斜）

#### 识别 Big Key

**SHOULD** — 定期扫描 Big Key：

```bash
redis-cli --bigkeys -i 0.1

redis-cli MEMORY USAGE usr:user:10001
```

#### 拆分 Big Key

✅ Correct:

```java
Map<String, String> fields = new HashMap<>();
fields.put("f1", "v1");
fields.put("f2", "v2");
fields.put("f3", "v3");

for (Map.Entry<String, String> entry : fields.entrySet()) {
    redis.hset("usr:profile:10001:" + entry.getKey().hashCode() % 4,
               entry.getKey(), entry.getValue());
}
```

❌ Wrong:

```java
Map<String, String> hugeMap = loadAllFields();
redis.hmset("usr:profile:10001", hugeMap);
```

> 10 万个字段直接 HMSET 到一个 Hash Key，会阻塞 Redis 数百毫秒。

#### 删除 Big Key

**MUST** — 禁止对 Big Key 使用 `DEL`（同步删除会阻塞）：

✅ Correct:

```bash
UNLINK usr:bigkey:10001
```

```lua
-- Hash 分批删除字段
local cursor = 0
repeat
    local reply = redis.call('HSCAN', KEYS[1], cursor, 'COUNT', 200)
    cursor = tonumber(reply[1])
    local fields = reply[2]
    if #fields > 0 then
        redis.call('HDEL', KEYS[1], unpack(fields))
    end
until cursor == 0
redis.call('DEL', KEYS[1])
```

❌ Wrong:

```bash
DEL usr:bigkey:10001
```

> 10 万元素的 Hash Key，`DEL` 会阻塞 Redis 数百毫秒甚至数秒。

---

### R08 — Hot Key 处理

**MUST** — QPS 超过 5000 的 Key 必须进行 Hot Key 防护：

#### 识别 Hot Key

| 方式 | 说明 |
|------|------|
| `redis-cli --hotkeys` | Redis 4.0+ LFU 统计 |
| `MONITOR` 命令 | 实时抓取命令（仅排查时短时使用） |
| `OBJECT FREQ` | 查看 LFU 访问频率 |
| 应用层埋点 | 在业务代码中统计 Key 访问频次 |

#### 解决方案

| 方案 | 原理 | 适用场景 |
|------|------|---------|
| 本地缓存 | JVM 进程内缓存，零网络开销 | 读多写少、容忍短暂不一致 |
| 读写分离 | 从节点分担读压力 | 读多写少 |
| Key 分片 | 将热点 Key 拆分为多个子 Key | 写入频繁 |
| 限流 | 限制单 Key 并发访问量 | 兜底保护 |

✅ Correct（本地缓存 + Redis 二级缓存）:

```java
private final Cache<User> localCache = Caffeine.newBuilder()
        .maximumSize(10000)
        .expireAfterWrite(30, TimeUnit.SECONDS)
        .build();

public User getUser(Long userId) {
    String key = "usr:user:" + userId;
    User user = localCache.getIfPresent(key);
    if (user != null) {
        return user;
    }
    user = redis.get(key, User.class);
    if (user != null) {
        localCache.put(key, user);
        return user;
    }
    user = userMapper.selectById(userId);
    if (user != null) {
        redis.setex(key, 3600, user);
        localCache.put(key, user);
    }
    return user;
}
```

✅ Correct（Key 分片）:

```java
public String getHotKey(String baseKey, String id) {
    int shard = Math.abs(id.hashCode()) % 8;
    return baseKey + ":shard" + shard + ":" + id;
}
```

❌ Wrong:

```java
public User getUser(Long userId) {
    return redis.get("usr:user:" + userId, User.class);
}
```

> 万级 QPS 直接打到同一个 Redis Key，可能导致 Redis 单节点 CPU 飙升。

---

### R09 — 分布式锁

**MUST** — 分布式锁必须使用 `SET NX EX` 原子命令：

✅ Correct:

```java
public boolean tryLock(String lockKey, String requestId, int expireSeconds) {
    return redis.set(lockKey, requestId, "NX", "EX", expireSeconds);
}
```

**MUST** — 释放锁必须使用 Lua 脚本保证原子性（先判断再删除）：

✅ Correct:

```lua
if redis.call('GET', KEYS[1]) == ARGV[1] then
    return redis.call('DEL', KEYS[1])
else
    return 0
end
```

❌ Wrong:

```java
String value = redis.get(lockKey);
if (requestId.equals(value)) {
    redis.del(lockKey);
}
```

> GET 和 DEL 非原子操作：GET 判断通过后，锁可能已过期并被其他线程获取，此时 DEL 会误删别人的锁。

**MUST** — 分布式锁的注意事项：

| 项目 | 规则 | 原因 |
|------|------|------|
| 锁超时 | **MUST** 设置合理的 EX 时间 | 防止持有锁的进程崩溃导致死锁 |
| 唯一标识 | **MUST** 使用 UUID / 雪花 ID 作为 value | 防止误删他人锁 |
| 可重入 | **SHOULD** 使用 Hash + Lua 实现可重入 | 同一线程多次加锁 |
| 续期 | **SHOULD** 使用 Watchdog 自动续期 | 长时间任务防止锁过期 |
| 分支容忍 | **MAY** 使用 Redlock（多节点） | 对一致性要求极高的场景 |

**MUST NOT** — 以下行为禁止：

- 禁止使用 `SETNX` + `EXPIRE` 两条命令（非原子）
- 禁止不设过期时间
- 禁止释放锁时不校验唯一标识

❌ Wrong:

```java
redis.setnx(lockKey, "1");
redis.expire(lockKey, 30);

if (redis.get(lockKey) != null) {
    redis.del(lockKey);
}
```

**SHOULD** — 推荐使用 Redisson 等成熟库，已内置 Watchdog 续期和可重入支持：

```java
RLock lock = redisson.getLock("lock:order:10001");
try {
    if (lock.tryLock(3, 30, TimeUnit.SECONDS)) {
    }
} finally {
    if (lock.isHeldByCurrentThread()) {
        lock.unlock();
    }
}
```

---

### R10 — 集群与分片

**MUST** — 生产环境必须使用 Redis Cluster 或 Sentinel 高可用方案：

| 方案 | 最小节点 | 适用场景 | 特点 |
|------|---------|---------|------|
| Sentinel | 3 Sentinel + 1 主 + 1 从 | 读多写少、数据量小 | 主从切换自动故障转移 |
| Cluster | 6 节点（3 主 3 从） | 大数据量、高并发 | 自动分片、水平扩展 |

**MUST** — Cluster 模式下的 Key 设计规则：

- **MUST** — 同一事务 / Lua 脚本操作的 Key 必须在同一个 Slot
- **MUST** — 使用 Hash Tag `{}` 确保相关 Key 路由到同一 Slot

✅ Correct:

```
usr:user:{10001}:profile
usr:user:{10001}:settings
usr:user:{10001}:stats
```

> Hash Tag `{10001}` 保证同一用户的 Key 路由到同一 Slot，支持 `MGET` / `MSET` / Lua 脚本。

❌ Wrong:

```
usr:user:10001:profile
usr:user:10001:settings
usr:user:10001:stats
```

> 无 Hash Tag 时，三个 Key 可能分布在不同 Slot，`MGET` 会报 `CROSSSLOT` 错误。

**SHOULD** — 分片策略选择：

| 策略 | 方式 | 优点 | 缺点 |
|------|------|------|------|
| Redis Cluster | 自动按 Slot 分片 | 运维简单、自动均衡 | 扩容需迁移 Slot |
| 一致性哈希 | 客户端分片 | 扩缩容影响范围小 | 需客户端实现 |
| 范围分片 | 按 ID 范围分片 | 简单直观 | 可能不均衡 |
| Hash 分片 | `hash(key) % N` | 均匀分布 | 扩容需重新分布 |

**MUST** — 集群注意事项：

- 禁止 `KEYS *` 等全库扫描命令（使用 `SCAN` 代替）
- 禁止批量操作不同 Slot 的 Key（使用 Hash Tag 或逐条操作）
- 集群最小 6 节点（3 主 3 从），保证每个主节点至少 1 个从节点
- 客户端必须支持 Cluster 拓扑自动发现和 MOVED 重定向

---

### R11 — 内存淘汰策略

**MUST** — 生产环境必须显式配置 `maxmemory`，禁止使用默认值（默认无限制）：

**`maxmemory-policy` 选择参考：**

| 策略 | 淘汰规则 | 适用场景 |
|------|---------|---------|
| `allkeys-lru` | 所有 Key 中淘汰最久未使用 | 纯缓存场景（推荐） |
| `volatile-lru` | 设了 TTL 的 Key 中淘汰最久未使用 | 有持久化数据 + 缓存混合 |
| `allkeys-lfu` | 所有 Key 中淘汰最少使用 | 热点数据明显（Redis 4.0+） |
| `volatile-lfu` | 设了 TTL 的 Key 中淘汰最少使用 | 有持久化数据 + 热点明显 |
| `allkeys-random` | 所有 Key 随机淘汰 | 无访问热点 |
| `volatile-ttl` | 设了 TTL 的 Key 中淘汰 TTL 最短的 | 业务有明显过期分层 |
| `noeviction` | 不淘汰，内存满时拒绝写入 | 数据不可丢失（持久化存储） |

✅ Correct:

```
maxmemory 8gb
maxmemory-policy allkeys-lru
```

❌ Wrong:

```
maxmemory 0
maxmemory-policy noeviction
```

> 纯缓存场景使用 `noeviction`，内存满后所有写入返回错误。

**SHOULD** — 内存规划原则：

| 指标 | 建议值 | 说明 |
|------|--------|------|
| Redis 内存使用率 | ≤ 70% | 超过后触发告警 |
| 系统可用内存 | ≥ Redis maxmemory 的 2 倍 | 预留 fork / AOF 重写开销 |
| 单实例 maxmemory | ≤ 10 GB | 单实例过大影响 RDB / AOF 性能 |
| maxmemory-samples | 5 ~ 10 | LRU / LFU 采样数，越大越精确但越慢 |

**MUST** — 监控以下内存指标：

- `used_memory`：已使用内存
- `used_memory_rss`：操作系统分配的物理内存
- `mem_fragmentation_ratio`：`rss / used_memory`，> 1.5 说明碎片严重需重启或 `activedefrag`

---

### R12 — 监控与告警

**MUST** — 生产环境 Redis 必须配置监控与告警：

#### 关键监控指标

| 分类 | 指标 | 告警阈值 | 说明 |
|------|------|---------|------|
| 内存 | `used_memory` | > 70% maxmemory | 内存使用率 |
| 内存 | `mem_fragmentation_ratio` | > 1.5 | 内存碎片率 |
| 连接 | `connected_clients` | > maxclients × 80% | 客户端连接数 |
| 命令 | `instantaneous_ops_per_sec` | 根据基线设定 | 实时 QPS |
| 延迟 | `latency` | > 10ms (P99) | 命令执行延迟 |
| 主从 | `replication_offset_diff` | > 1MB | 主从复制延迟 |
| Key | `expired_keys` | 突增告警 | 过期 Key 数量 |
| Key | `evicted_keys` | > 0 | 被淘汰 Key 数量 |
| 持久化 | `rdb_last_bgsave_status` | err | RDB 最后保存状态 |
| 持久化 | `aof_last_bgrewrite_status` | err | AOF 最后重写状态 |

#### 慢查询

**MUST** — 配置慢查询日志：

```
slowlog-log-slower-than 10000
slowlog-max-len 128
```

**SHOULD** — 定期检查慢查询：

```bash
redis-cli SLOWLOG GET 10
```

**常见慢查询原因：**

| 原因 | 命令 | 解决方案 |
|------|------|---------|
| Big Key 操作 | `DEL`, `HGETALL` | 拆分 Key、使用 `UNLINK` |
| 全库扫描 | `KEYS *` | 使用 `SCAN` |
| 复杂聚合 | `SORT`, `SINTER` | 优化数据结构 |
| 大量 Pipeline | 批量命令过多 | 控制单次 Pipeline 命令数 ≤ 100 |

#### 大 Key 扫描

**SHOULD** — 定期执行大 Key 扫描并记录：

```bash
redis-cli --bigkeys -i 0.1

redis-cli --memkeys -i 0.1
```

**SHOULD** — 使用 RDB 分析工具离线分析：

```bash
redis-rdb-tools / rdb-tools

rdb --command json -k "usr:*" dump.rdb
```

**MUST NOT** — 禁止在线上使用以下命令：

- `KEYS *` — 全库扫描，阻塞 Redis
- `FLUSHALL` / `FLUSHDB` — 清库
- `MONITOR` — 长时间运行（仅排查时短时使用，< 30 秒）

---

## Checklist

- [ ] Key 命名遵循 `业务前缀:实体:ID` 格式，使用冒号分隔，全小写
- [ ] 根据数据特征选择合适的数据结构，对象优先使用 Hash
- [ ] 使用 Cache-Aside 缓存策略，写操作先更新 DB 再删除缓存
- [ ] 所有缓存 Key 设置 TTL，基础 TTL 增加随机偏移避免同时过期
- [ ] 缓存穿透使用空值缓存或布隆过滤器，击穿使用互斥锁，雪崩使用 TTL 随机 + 多级缓存
- [ ] 序列化格式统一（推荐 JSON），禁止 JDK 序列化
- [ ] String 不超过 10 KB，集合元素不超过 5000，Big Key 使用 UNLINK 删除
- [ ] Hot Key 使用本地缓存 + Key 分片 + 读写分离防护
- [ ] 分布式锁使用 SET NX EX + Lua 释放，禁止 SETNX + EXPIRE 两条命令
- [ ] Cluster 模式相关 Key 使用 Hash Tag，保证同一 Slot
- [ ] 配置 maxmemory 和淘汰策略（纯缓存用 allkeys-lru），单实例 ≤ 10 GB
- [ ] 配置慢查询日志、监控关键指标、定期扫描 Big Key
