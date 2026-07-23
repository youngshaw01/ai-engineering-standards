# Java 17

## Overview

Java 17 是继 Java 8 和 Java 11 之后的第三个长期支持（LTS）版本，也是 Java 平台新特性发布节奏下的基石版本。本标准聚焦于 Java 17 引入的语言特性（Records、Sealed Classes、Pattern Matching for instanceof、Text Blocks、Switch Expressions）以及现代 Java 编程的核心规范（Optional、Stream API、异常处理、并发、日志、代码组织）。所有规则适用于基于 Java 17 LTS 的项目开发。

---

## Rules

### R01 — 版本与兼容性

**MUST** — 编译时必须使用 `--release 17` 参数，确保生成的 class 文件兼容 Java 17 运行时：

```xml
<properties>
    <maven.compiler.source>17</maven.compiler.source>
    <maven.compiler.target>17</maven.compiler.target>
    <java.version>17</java.version>
</properties>
```

✅ Correct:

```bash
mvn clean package -Dmaven.compiler.release=17
```

❌ Wrong:

```bash
mvn clean package -Dmaven.compiler.source=1.8 -Dmaven.compiler.target=1.8
```

**SHOULD** — 废弃 API 必须在迁移计划中明确标注替代方案和截止日期：

```java
/**
 * @deprecated 使用 {@link OrderService#createOrder(CreateOrderRequest)} 替代。
 *             迁移截止日期：2026-Q3。
 */
@Deprecated(forRemoval = true, since = "1.8")
public void createOrder(String productId, int quantity) {
    // ...
}
```

**MAY** — 使用 `--enable-preview` 启用预览特性（如 Virtual Threads），但不得在生产代码中使用未最终化的 API。

| 特性 | 状态 | 可用性 |
|------|------|--------|
| Records | Final | ✅ 可放心使用 |
| Sealed Classes | Final | ✅ 可放心使用 |
| Pattern Matching for instanceof | Final | ✅ 可放心使用 |
| Text Blocks | Final | ✅ 可放心使用 |
| Switch Expressions | Final | ✅ 可放心使用 |
| Virtual Threads | Preview | ⚠️ 仅测试环境 |

---

### R02 — Records

**MUST** — 当类仅作为不可变数据载体且无需业务逻辑时，优先使用 Record：

```java
record OrderSummary(
    Long orderId,
    String customerName,
    BigDecimal totalAmount,
    LocalDateTime createdAt
) {}
```

**MUST** — Record 不得包含可变状态或可变字段：

✅ Correct:

```java
record Point(int x, int y) {
    public double distance() {
        return Math.sqrt(x * x + y * y);
    }
}
```

❌ Wrong:

```java
record MutablePoint(int x, int y) {
    private List<Integer> history = new ArrayList<>(); // 禁止可变字段

    public void addHistory(int value) {
        history.add(value); // 违反不可变性
    }
}
```

**SHOULD** — 使用紧凑构造器进行参数校验：

```java
record Money(BigDecimal amount, String currency) {
    public Money {
        if (amount == null || currency == null) {
            throw new IllegalArgumentException("amount 和 currency 不能为 null");
        }
        if (amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("金额不能为负数: " + amount);
        }
    }
}
```

**SHOULD** — 适用场景判断：

| 场景 | 推荐类型 | 原因 |
|------|----------|------|
| DTO / VO / 请求体 | Record | 天然不可变、自动 equals/hashCode/toString |
| 领域实体（有行为） | Class | 需要业务方法和状态变更 |
| 配置对象 | Record | 纯数据、不可变 |
| Builder 模式返回值 | Record | 简化 Builder 链式调用 |

**MAY** — 避免对 Record 使用 Lombok。Record 已提供 `equals`、`hashCode`、`toString`、getter、全参构造器，Lombok 的 `@Data` / `@AllArgsConstructor` 会造成冗余。

---

### R03 — Sealed Classes

**MUST** — 当父类已知所有子类型且不允许外部扩展时，使用 sealed 声明受限继承层次：

```java
public sealed interface PaymentResult
    permits PaymentSuccess, PaymentFailure, PaymentPending {

    boolean isSuccess();
}

public record PaymentSuccess(String transactionId, BigDecimal amount)
    implements PaymentResult {
    @Override
    public boolean isSuccess() { return true; }
}

public record PaymentFailure(String errorCode, String message)
    implements PaymentResult {
    @Override
    public boolean isSuccess() { return false; }
}

public record PaymentPending(String trackingId)
    implements PaymentResult {
    @Override
    public boolean isSuccess() { return false; }
}
```

**MUST** — sealed 类的 permits 列表必须覆盖所有实现类，且所有实现类必须与 sealed 类在同一包（或同一模块）：

✅ Correct:

```java
sealed interface Expr permits AddExpr, MulExpr, ConstExpr {
    int evaluate();
}

final class AddExpr implements Expr { /* ... */ }
final class MulExpr implements Expr { /* ... */ }
final class ConstExpr implements Expr { /* ... */ }
```

❌ Wrong:

```java
sealed interface Expr permits AddExpr, MulExpr {
    int evaluate();
}

final class ConstExpr implements Expr { /* ... */ } // 编译错误：ConstExpr 未被 permits
```

**SHOULD** — 配合 Pattern Matching 使用时，将实现类声明为 final：

```java
sealed interface Shape permits Circle, Rectangle, Triangle {
    double area();
}

record Circle(double radius) implements Shape {
    @Override public double area() { return Math.PI * radius * radius; }
}

record Rectangle(double width, double height) implements Shape {
    @Override public double area() { return width * height; }
}

record Triangle(double base, double height) implements Shape {
    @Override public double area() { return base * height / 2; }
}
```

**MAY** — 使用 `permits` 省略语法（Java 17+ 允许省略 permits，当实现类与 sealed 类在同一包时）：

```java
sealed interface PaymentResult {
    boolean isSuccess();
}

// PaymentResult 的实现类在同一包下，无需显式 permits
```

---

### R04 — Pattern Matching for instanceof

**MUST** — 使用 Pattern Matching 消除 instanceof 后的强制转换：

✅ Correct:

```java
if (shape instanceof Circle c) {
    return Math.PI * c.radius() * c.radius();
} else if (shape instanceof Rectangle r) {
    return r.width() * r.height();
}
```

❌ Wrong:

```java
if (shape instanceof Circle) {
    Circle circle = (Circle) shape; // 冗余的强制转换
    return Math.PI * circle.radius() * circle.radius();
}
```

**MUST** — 当使用 sealed 接口时，else 分支可省略穷举检查：

```java
public String describe(Shape shape) {
    return switch (shape) {
        case Circle c -> "圆形，半径=" + c.radius();
        case Rectangle r -> "矩形，面积=" + r.area();
        case Triangle t -> "三角形，底=" + t.base();
        // sealed 保证不会有其他情况，无需 default
    };
}
```

**SHOULD** — 变量绑定名应与上下文语义一致，避免无意义命名：

✅ Correct:

```java
if (event instanceof OrderCreatedEvent oce) {
    processOrderCreated(oce);
}
```

❌ Wrong:

```java
if (event instanceof OrderCreatedEvent e) {
    processOrderCreated(e); // e 含义不明确
}
```

**MAY** — 在条件分支中嵌套 pattern matching：

```java
if (obj instanceof Map<?, ?> map
        && map.size() > 0
        && map.containsKey("userId")
        && map.get("userId") instanceof Long userId) {
    return userId;
}
```

---

### R05 — Text Blocks

**MUST** — 多行字符串常量必须使用 Text Block（三引号 `"""`）：

✅ Correct:

```java
String json = """
    {
        "name": "John",
        "age": 30,
        "active": true
    }
    """;

String sql = """
    SELECT id, name, email
    FROM users
    WHERE status = ?
      AND created_at >= ?
    """;
```

❌ Wrong:

```java
String json = "{\n" +
    "    \"name\": \"John\",\n" +
    "    \"age\": 30,\n" +
    "    \"active\": true\n" +
    "}\n";
```

**MUST** — 使用 `String.indent()` 管理缩进，而非手动添加空格：

✅ Correct:

```java
String html = """
    <div>
        <span>Hello</span>
    </div>
    """.indent(4);
```

❌ Wrong:

```java
String html = "    <div>\n" +
    "        <span>Hello</span>\n" +
    "    </div>\n";
```

**SHOULD** — SQL / JSON / HTML / XML 模板统一使用 Text Block，避免字符串拼接带来的转义问题：

```java
String template = """
    <user>
        <id>%d</id>
        <name>%s</name>
        <email>%s</email>
    </user>
    """;

String result = String.format(template, userId, name, email);
```

**MAY** — 使用 `stripIndent()` 去除公共前导空白：

```java
String message = """
    第一行内容
      第二行有缩进
    第三行回到原位
    """.stripIndent();
```

| 方法 | 作用 |
|------|------|
| `indent(int n)` | 每行增加 n 个空格 |
| `stripIndent()` | 移除公共前导空白 |
| `translateEscapes()` | 执行转义字符（如 `\n`、`\t`） |

---

### R06 — Switch Expressions

**MUST** — 使用箭头语法（`->`）替代冒号语法（`:`）：

✅ Correct:

```java
String label = switch (status) {
    case ACTIVE, PENDING -> "激活";
    case INACTIVE         -> "停用";
    case BANNED           -> "封禁";
};
```

❌ Wrong:

```java
String label;
switch (status) {
    case ACTIVE:
    case PENDING:
        label = "激活";
        break;
    case INACTIVE:
        label = "停用";
        break;
    case BANNED:
        label = "封禁";
        break;
    default:
        label = "未知";
}
```

**MUST** — 当 switch 表达式产生值时，必须使用 `yield` 返回：

✅ Correct:

```java
int priority = switch (level) {
    case HIGH   -> 3;
    case MEDIUM -> 2;
    case LOW    -> 1;
    default     -> throw new IllegalArgumentException("未知级别: " + level);
};
```

❌ Wrong:

```java
int priority = switch (level) {
    case HIGH   -> 3;
    case MEDIUM -> 2;
    case LOW    -> 1;
}; // 缺少 default 分支，可能返回 null（int 不允许）
```

**SHOULD** — 利用 exhaustiveness check 确保枚举 / sealed 类型全覆盖：

✅ Correct:

```java
public String handle(PaymentResult result) {
    return switch (result) {
        case PaymentSuccess s -> "成功: " + s.transactionId();
        case PaymentFailure f -> "失败: " + f.errorCode();
        case PaymentPending p -> "处理中: " + p.trackingId();
        // sealed 接口保证不会遗漏
    };
}
```

**MAY** — 使用 `when` 条件守卫增强表达能力：

```java
String grade = switch (score) {
    case int s when s >= 90 -> "A";
    case int s when s >= 80 -> "B";
    case int s when s >= 70 -> "C";
    case int s when s >= 60 -> "D";
    default                 -> "F";
};
```

---

### R07 — Optional 规范

**MUST** — 禁止直接调用 `Optional.get()` 而不先检查值是否存在：

✅ Correct:

```java
Optional<User> user = userRepository.findById(id);
return user.map(u -> u.getName()).orElse("匿名");
```

❌ Wrong:

```java
Optional<User> user = userRepository.findById(id);
return user.get().getName(); // NoSuchElementException 如果 user 为 empty
```

**MUST** — 禁止将 `Optional` 用作字段类型或方法参数类型：

✅ Correct:

```java
// 返回值可以使用 Optional
public Optional<User> findById(Long id) {
    // ...
}

// 参数使用 nullable 或 Collection
public void updateUser(Long id, UserUpdateDTO dto) {
    // ...
}
```

❌ Wrong:

```java
// 禁止 Optional 作为参数
public void process(Optional<User> user) {
    // ...
}

// 禁止 Optional 作为字段
public class Order {
    private Optional<ShippingAddress> address; // 反模式
}
```

**SHOULD** — 区分 `orElse()` 和 `orElseGet()` 的使用场景：

| 场景 | 推荐方法 | 原因 |
|------|----------|------|
| 简单字面量默认值 | `orElse()` | 简洁明了 |
| 计算开销大的默认值 | `orElseGet()` | 延迟求值，避免不必要的计算 |
| 抛异常 | `orElseThrow()` | 明确表达意图 |

✅ Correct:

```java
// 简单默认值 → orElse
String name = optionalName.orElse("default");

// 计算开销大 → orElseGet
BigDecimal price = optionalPrice.orElseGet(() -> calculateDefaultPrice());

// 需要异常信息 → orElseThrow
User user = userRepository.findById(id)
    .orElseThrow(() -> new UserNotFoundException("用户不存在: " + id));
```

❌ Wrong:

```java
// 不必要的延迟求值
String name = optionalName.orElseGet(() -> "default");

// 吞掉异常
try {
    return optionalValue.get();
} catch (NoSuchElementException e) {
    return null; // 反模式
}
```

---

### R08 — Stream API 规范

**MUST** — Stream 操作中禁止有副作用（side effects）：

✅ Correct:

```java
List<String> names = users.stream()
    .filter(u -> u.isActive())
    .map(User::getName)
    .collect(Collectors.toList());
```

❌ Wrong:

```java
users.stream()
    .forEach(u -> {
        // 副作用：修改外部状态
        u.setStatus(INACTIVE);
        log.info("用户已禁用: " + u.getName());
    });
```

**MUST** — 合理选择短路操作与终止操作：

| 操作类型 | 用途 | 示例 |
|----------|------|------|
| 短路 | 满足条件即停止 | `findFirst()`, `anyMatch()`, `limit()` |
| 终止 | 遍历全部元素 | `collect()`, `count()`, `forEach()` |

✅ Correct:

```java
// 查找第一个符合条件的元素 → 短路
Optional<User> firstActive = users.stream()
    .filter(User::isActive)
    .findFirst();

// 收集所有结果 → 终止
List<String> names = users.stream()
    .map(User::getName)
    .collect(Collectors.toList());
```

**SHOULD** — 根据场景选择合适的 Collector：

| 场景 | Collector | 说明 |
|------|-----------|------|
| 收集为 List | `Collectors.toList()` | 不需要指定大小 |
| 收集为 Set | `Collectors.toSet()` | 去重 |
| 收集为 Map | `Collectors.toMap()` | 需处理 key 冲突 |
| 分组 | `Collectors.groupingBy()` | 按分类字段分组 |
| 分区 | `Collectors.partitioningBy()` | 布尔条件分区 |
| 聚合 | `Collectors.summingInt()` | 数值求和 |
| 连接 | `Collectors.joining()` | 字符串拼接 |

✅ Correct:

```java
Map<Department, List<User>> deptUsers = users.stream()
    .collect(Collectors.groupingBy(User::getDepartment));

Map<Long, String> idToName = users.stream()
    .collect(Collectors.toMap(
        User::getId,
        User::getName,
        (existing, replacement) -> existing // 解决 key 冲突
    ));
```

**MUST** — Stream 中的异常必须通过包装或旁路方式处理：

✅ Correct:

```java
// 方式一：包装为非受检异常
List<String> results = items.stream()
    .map(item -> {
        try {
            return parse(item);
        } catch (ParseException e) {
            throw new UncheckedParseException(e);
        }
    })
    .collect(Collectors.toList());

// 方式二：使用 if-else 过滤
List<String> results = items.stream()
    .map(item -> parseSafely(item))
    .filter(Objects::nonNull)
    .collect(Collectors.toList());
```

❌ Wrong:

```java
// 受检异常无法在 lambda 中抛出
items.stream()
    .map(item -> parse(item)) // 编译错误：unhandled exception
    .collect(Collectors.toList());
```

---

### R09 — 异常处理规范

**MUST** — 正确选择受检异常（Checked Exception）与非受检异常（Unchecked Exception）：

| 类型 | 适用场景 | 示例 |
|------|----------|------|
| 受检异常 | 可预期的、可恢复的错误 | 文件不存在、网络超时、SQL 异常 |
| 非受检异常 | 程序逻辑错误、不可恢复 | 空指针、数组越界、非法参数 |

✅ Correct:

```java
// 受检异常：调用方必须处理
public void saveToFile(Path path, String content) throws IOException {
    Files.writeString(path, content);
}

// 非受检异常：程序 bug
public void processOrder(Order order) {
    if (order == null) {
        throw new IllegalArgumentException("订单不能为 null");
    }
    // ...
}
```

❌ Wrong:

```java
// 不应使用受检异常表示程序逻辑错误
public void setAge(int age) throws Exception {
    if (age < 0) {
        throw new Exception("年龄不能为负数"); // 应使用 IllegalArgumentException
    }
}
```

**MUST** — 异常链必须保留原始异常：

✅ Correct:

```java
public void transferMoney(Account from, Account to, BigDecimal amount) {
    try {
        from.withdraw(amount);
        to.deposit(amount);
    } catch (AccountException e) {
        throw new TransferException("转账失败", e); // 保留异常链
    }
}
```

❌ Wrong:

```java
public void transferMoney(Account from, Account to, BigDecimal amount) {
    try {
        from.withdraw(amount);
        to.deposit(amount);
    } catch (AccountException e) {
        throw new TransferException("转账失败"); // 丢失原始异常
    }
}
```

**MUST** — 自定义异常设计遵循以下原则：

```java
// 基础业务异常
public class BusinessException extends RuntimeException {
    private final String errorCode;

    public BusinessException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public BusinessException(String errorCode, String message, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}

// 具体业务异常
public class InsufficientBalanceException extends BusinessException {
    public InsufficientBalanceException(BigDecimal required, BigDecimal actual) {
        super("INSUFFICIENT_BALANCE",
              "余额不足: 需要 " + required + ", 实际 " + actual);
    }
}
```

**MUST** — 禁止空 catch 块：

✅ Correct:

```java
// 明确忽略并记录
try {
    cleanupResources();
} catch (IOException e) {
    log.warn("清理资源时发生异常，可忽略", e);
}

// 或者重新抛出
try {
    processData();
} catch (IOException e) {
    throw new ServiceException("数据处理失败", e);
}
```

❌ Wrong:

```java
try {
    cleanupResources();
} catch (IOException e) {
    // 空 catch：隐藏问题
}

try {
    processData();
} catch (Exception e) {
    System.out.println(e.getMessage()); // 吞掉异常，只打印不传播
}
```

---

### R10 — 并发编程

**MUST** — 异步任务优先使用 `CompletableFuture`，禁止直接 `new Thread()`：

✅ Correct:

```java
CompletableFuture<String> future = CompletableFuture
    .supplyAsync(() -> fetchFromRemote(), executor)
    .thenApply(data -> transform(data))
    .thenAccept(result -> saveToDB(result))
    .exceptionally(ex -> {
        log.error("异步任务失败", ex);
        return "DEFAULT_VALUE";
    });
```

❌ Wrong:

```java
new Thread(() -> {
    String data = fetchFromRemote();
    String result = transform(data);
    saveToDB(result);
}).start(); // 不受控的线程创建
```

**SHOULD** — 使用自定义 `ExecutorService` 控制线程池：

✅ Correct:

```java
ExecutorService executor = Executors.newFixedThreadPool(
    Runtime.getRuntime().availableProcessors(),
    Thread.ofVirtual().name("async-", 0).factory()
);

CompletableFuture<String> future = CompletableFuture
    .supplyAsync(task, executor);
```

**MAY** — Virtual Threads（预览特性）可用于高并发 I/O 密集型场景：

```java
// 需要在 JVM 启动时添加 --enable-preview
Thread virtualThread = Thread.startVirtualThread(() -> {
    // I/O 密集型任务
    fetchFromDatabase();
    callExternalApi();
});
```

**MUST** — 线程安全集合选择：

| 场景 | 推荐集合 | 原因 |
|------|----------|------|
| 高并发读低并发写 | `ConcurrentHashMap` | 分段锁，读无阻塞 |
| 计数 | `LongAdder` | 分散热点，优于 `AtomicLong` |
| 累加 | `DoubleAccumulator` | 单线程写入多线程读取 |
| 队列 | `LinkedBlockingQueue` | 生产者-消费者模型 |
| 跳过表 | `ConcurrentSkipListMap` | 有序并发访问 |

✅ Correct:

```java
ConcurrentMap<String, AtomicLong> counters = new ConcurrentHashMap<>();

counters.computeIfAbsent("requests", k -> new AtomicLong(0))
    .incrementAndGet();
```

❌ Wrong:

```java
Map<String, Long> counters = new HashMap<>(); // 非线程安全

// 在多线程环境下使用同步包装
Map<String, Long> syncCounters = Collections.synchronizedMap(new HashMap<>());
// 仍需外部同步迭代操作
```

---

### R11 — 日志规范

**MUST** — 使用 SLF4J + Logback 作为日志门面和实现：

✅ Correct:

```java
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class OrderService {
    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    public void createOrder(Order order) {
        log.info("创建订单: orderId={}, customerId={}", order.getId(), order.getCustomerId());
        // ...
    }
}
```

❌ Wrong:

```java
// 禁止使用 System.out
System.out.println("创建订单: " + order.getId());

// 禁止使用原生 java.util.logging
java.util.logging.Logger logger = java.util.logging.Logger.getLogger("OrderService");
```

**MUST** — 使用参数化日志，禁止字符串拼接：

✅ Correct:

```java
log.debug("查询用户: userId={},耗时={}ms", userId, duration);
log.info("订单创建成功: orderId={}", orderId);
log.warn("库存不足: skuId={}, required={}, available={}", skuId, required, available);
log.error("支付失败: orderId={}, error={}", orderId, errorMessage, exception);
```

❌ Wrong:

```java
// 即使日志级别不匹配也会执行字符串拼接
log.debug("查询用户: userId=" + userId + ",耗时=" + duration + "ms");

// 暴露敏感信息
log.info("用户登录成功: password=" + password); // 禁止日志密码
```

**SHOULD** — 使用 MDC（Mapped Diagnostic Context）追踪请求链路：

✅ Correct:

```java
// Filter 中设置
MDC.put("traceId", traceId);
MDC.put("userId", userId);
MDC.put("requestPath", requestURI);

try {
    // 业务逻辑
} finally {
    MDC.clear(); // 必须清理，防止线程复用导致 MDC 污染
}
```

**SHOULD** — 日志级别选择：

| 级别 | 用途 | 示例 |
|------|------|------|
| `ERROR` | 系统故障、不可恢复错误 | 数据库连接失败、外部服务不可用 |
| `WARN` | 潜在风险、可恢复异常 | 降级触发、缓存穿透、接近阈值 |
| `INFO` | 关键业务流程 | 订单创建、用户登录、定时任务启动 |
| `DEBUG` | 调试信息 | 中间变量、方法入参出参 |
| `TRACE` | 详细追踪 | 逐行日志、SQL 执行详情 |

**MUST** — 日志中禁止输出敏感信息：

```java
// ❌ 禁止
log.info("用户登录: phone={}, password={}", phone, password);
log.info("API Key: {}", apiKey);
log.info("数据库连接串: {}", connectionString);

// ✅ 脱敏处理
log.info("用户登录: phone={}", maskPhone(phone));
log.info("API Key: {}****{}", apiKey.substring(0, 4), apiKey.substring(apiKey.length() - 4));
```

---

### R12 — 代码组织

**MUST** — 包结构遵循分层架构：

```
com.example.project
├── config          # 配置类
├── controller      # 控制器层
├── service         # 业务逻辑层
│   └── impl        # 服务实现
├── repository      # 数据访问层
├── domain          # 领域模型
│   ├── entity      # 实体
│   ├── dto         # 数据传输对象
│   ├── vo          # 视图对象
│   └── enum        # 枚举
├── exception       # 异常定义
├── handler         # 全局异常处理器
├── util           # 工具类
└── constant       # 常量定义
```

**SHOULD** — 工具类设计规范：

- 工具类必须声明为 `final` 且含私有构造器
- 禁止实例化工具类
- 方法必须为 `static`

✅ Correct:

```java
public final class JsonUtils {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private JsonUtils() {
        // 禁止实例化
    }

    public static String toJson(Object obj) {
        try {
            return MAPPER.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            throw new JsonConvertException("JSON 序列化失败", e);
        }
    }

    public static <T> T fromJson(String json, Class<T> clazz) {
        try {
            return MAPPER.readValue(json, clazz);
        } catch (JsonProcessingException e) {
            throw new JsonConvertException("JSON 反序列化失败", e);
        }
    }
}
```

❌ Wrong:

```java
public class JsonUtils {
    public JsonUtils() {} // 允许实例化

    public String toJson(Object obj) { // 非静态方法
        // ...
    }
}
```

**SHOULD** — 常量管理规范：

✅ Correct:

```java
public final class OrderStatus {
    public static final String PENDING = "PENDING";
    public static final String PAID = "PAID";
    public static final String SHIPPED = "SHIPPED";
    public static final String DELIVERED = "DELIVERED";
    public static final String CANCELLED = "CANCELLED";

    private OrderStatus() {
        // 禁止实例化
    }
}
```

**MAY** — 复杂对象构建使用 Builder 模式：

✅ Correct:

```java
public class Order {
    private final Long id;
    private final String customerId;
    private final BigDecimal totalAmount;
    private final LocalDateTime createdAt;
    private final ShippingAddress address;

    private Order(Builder builder) {
        this.id = builder.id;
        this.customerId = builder.customerId;
        this.totalAmount = builder.totalAmount;
        this.createdAt = builder.createdAt;
        this.address = builder.address;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private String customerId;
        private BigDecimal totalAmount;
        private LocalDateTime createdAt = LocalDateTime.now();
        private ShippingAddress address;

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder customerId(String customerId) {
            this.customerId = customerId;
            return this;
        }

        public Builder totalAmount(BigDecimal totalAmount) {
            this.totalAmount = totalAmount;
            return this;
        }

        public Builder address(ShippingAddress address) {
            this.address = address;
            return this;
        }

        public Order build() {
            Objects.requireNonNull(customerId, "customerId 不能为 null");
            Objects.requireNonNull(totalAmount, "totalAmount 不能为 null");
            return new Order(this);
        }
    }
}

// 使用
Order order = Order.builder()
    .id(1L)
    .customerId("C001")
    .totalAmount(new BigDecimal("99.99"))
    .address(new ShippingAddress("北京市", "朝阳区", "100000"))
    .build();
```

---

## Checklist

- [ ] 编译参数使用 `--release 17`，Maven 配置 `maven.compiler.release=17`
- [ ] 废弃 API 标注 `@Deprecated(forRemoval = true)` 并提供替代方案
- [ ] 纯数据载体使用 Record，不使用 Lombok `@Data`
- [ ] Record 不含可变状态，必要时使用紧凑构造器校验参数
- [ ] sealed 类明确列出 permits，实现类与 sealed 类同包
- [ ] sealed 类配合 Pattern Matching 实现穷举检查
- [ ] 使用 Pattern Matching 消除 instanceof 后强制转换
- [ ] 多行字符串使用 Text Block，缩进使用 `indent()` / `stripIndent()`
- [ ] Switch 使用箭头语法，表达式使用 yield，枚举/sealed 类型确保穷举
- [ ] 禁止 `Optional.get()` 无存在性检查
- [ ] 禁止 Optional 作为字段类型或方法参数类型
- [ ] 区分 `orElse()`（简单值）和 `orElseGet()`（计算开销大的值）
- [ ] Stream 操作无副作用，受检异常通过包装或旁路处理
- [ ] 受检异常用于可恢复错误，非受检异常用于程序逻辑错误
- [ ] 异常链保留原始异常，自定义异常继承合适基类
- [ ] 禁止空 catch 块，异常必须记录或传播
- [ ] 异步任务使用 CompletableFuture + 自定义线程池
- [ ] 禁止 `new Thread()` 创建不受控线程
- [ ] 使用 SLF4J + Logback，参数化日志禁止字符串拼接
- [ ] MDC 追踪请求链路，结束后必须 clear
- [ ] 日志禁止输出敏感信息，必要时脱敏
- [ ] 工具类声明为 final + 私有构造器 + static 方法
- [ ] 常量类声明为 final + 私有构造器
- [ ] 复杂对象使用 Builder 模式，build() 中校验必填参数
