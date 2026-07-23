# DDD

## Overview

Domain-Driven Design（领域驱动设计）规范，涵盖战略设计、战术设计、分层架构及常见反模式。适用于所有采用 DDD 方法的中大型业务系统。

---

## Rules

### R01 — 战略设计与战术设计区分

**MUST** — 必须明确区分战略设计与战术设计：

| 维度 | 战略设计 | 战术设计 |
|------|---------|---------|
| 目标 | 划分问题空间与解空间 | 在限界上下文内建模 |
| 核心概念 | Bounded Context、Context Map、Ubiquitous Language | Aggregate、Entity、Value Object、Domain Event |
| 参与者 | 业务专家 + 架构师 | 开发者 + 业务专家 |
| 产出 | 上下文划分、上下文关系图 | 领域模型、代码结构 |
| 阶段 | 先行 | 后续 |

**MUST** — 战略设计必须先于战术设计。禁止在未划分 Bounded Context 的情况下直接编写领域模型代码。

✅ Correct:

```
1. 识别核心子域、支撑子域、通用子域
2. 划分 Bounded Context，定义上下文边界
3. 绘制 Context Map，明确上下文间关系
4. 在每个 Bounded Context 内建立 Ubiquitous Language
5. 再进行战术建模
```

❌ Wrong:

```
1. 直接编写 Entity、Value Object 代码
2. 全项目使用同一套领域模型
3. 先写代码再划分 Context
```

---

### R02 — 限界上下文（Bounded Context）划分原则

**MUST** — Bounded Context 的划分必须基于业务语义边界，而非技术边界：

**划分依据（按优先级）：**

1. **Ubiquitous Language 边界** — 同一术语在不同业务场景下含义不同，应分属不同 Context
2. **业务能力边界** — 独立的业务能力应独立为 Context
3. **数据所有权边界** — 同一数据仅在一个 Context 中拥有写权限

✅ Correct:

```
电商系统中 "商品" 在不同 Context 中含义不同：

Catalog Context：Product = 可展示的商品（名称、描述、图片）
Inventory Context：Product = 可库存的商品（SKU、库存数量）
Pricing Context：Product = 可定价的商品（价格、折扣规则）

三个 Context 各自维护独立的 Product 模型。
```

❌ Wrong:

```
所有 "商品" 相关逻辑放在同一个 Context 中，
共享同一个 Product Entity，通过字段区分不同场景。
```

---

### R03 — 上下文映射（Context Map）模式

**MUST** — 上下文之间的关系必须通过 Context Map 显式定义：

| 模式 | 缩写 | 含义 | 适用场景 |
|------|------|------|---------|
| Anti-Corruption Layer | ACL | 防腐层，隔离下游模型影响 | 下游模型不信任或不可控 |
| Open Host Service | OHS | 开放主机服务，提供标准化协议 | 上游被多个下游依赖 |
| Published Language | PL | 发布语言，标准化数据格式 | 跨团队、跨系统交互 |
| Conformist | CF | 遵从者，完全遵从上游模型 | 下游对上游无影响力 |
| Customer-Supplier | CS | 客户-供应商，协作协商接口 | 下游对上游有业务影响力 |
| Separate Ways | SW | 分道扬镳，各自独立 | 集成成本高于收益 |

**MUST** — 对接外部系统或不受控的上游时，必须使用 ACL。

✅ Correct:

```java
public class OrderACL {

    private final ExternalProductClient externalProductClient;

    public ProductInfo translate(String externalProductId) {
        ExternalProductDTO dto = externalProductClient.getProduct(externalProductId);
        return new ProductInfo(
            dto.getId(),
            dto.getDisplayName(),
            Money.of(dto.getPrice(), dto.getCurrency())
        );
    }
}
```

❌ Wrong:

```java
public class OrderService {

    public Order createOrder(String productId) {
        ExternalProductDTO dto = externalProductClient.getProduct(productId);
        Order order = new Order();
        order.setProductName(dto.getDisplayName());
        order.setPrice(dto.getPrice());
        return order;
    }
}
```

---

### R04 — 聚合（Aggregate）设计原则

**MUST** — 聚合设计必须遵循以下原则：

1. **一致性边界** — 聚合内必须保证强一致性
2. **小聚合** — 只包含必须保证一致性的实体和值对象
3. **通过 ID 引用** — 聚合间必须通过 ID 引用，禁止持有其他聚合的实例引用
4. **单一聚合根** — 每个聚合有且仅有一个 Aggregate Root
5. **最终一致性** — 聚合间通过领域事件保证最终一致性，禁止跨聚合事务

**SHOULD** — 一个聚合的理想大小：Root Entity + 1~3 个子实体 + 若干值对象。

✅ Correct:

```java
public class Order extends AggregateRoot {

    private OrderId id;
    private List<OrderLine> lines;
    private OrderStatus status;
    private Money totalAmount;

    public void addLine(ProductId productId, int quantity, Money unitPrice) {
        if (status != OrderStatus.DRAFT) {
            throw new DomainException("Cannot modify a non-draft order");
        }
        lines.add(new OrderLine(productId, quantity, unitPrice));
        recalculateTotal();
    }
}
```

❌ Wrong:

```java
public class Order extends AggregateRoot {

    private List<OrderLine> lines;
    private User user;
    private List<Payment> payments;
    private ShippingAddress shippingAddress;
    private TrackingInfo trackingInfo;
    private List<ReturnRequest> returnRequests;
    private Review review;
}
```

---

### R05 — 聚合根（Aggregate Root）

**MUST** — 聚合根必须满足：

1. 拥有全局唯一 ID
2. 外部只能通过聚合根访问聚合内部对象
3. 聚合根负责维护聚合内所有业务不变量
4. 聚合根负责发布领域事件

**MUST** — 禁止绕过聚合根直接修改聚合内部对象的状态。

✅ Correct:

```java
public class Order extends AggregateRoot {

    private List<OrderLine> lines;

    public void changeLineQuantity(LineId lineId, int newQuantity) {
        OrderLine line = findLine(lineId);
        line.setQuantity(newQuantity);
        recalculateTotal();
        registerEvent(new OrderLineQuantityChangedEvent(this.id, lineId, newQuantity));
    }
}
```

❌ Wrong:

```java
public class OrderService {

    public void changeLineQuantity(OrderId orderId, LineId lineId, int newQuantity) {
        Order order = orderRepository.findById(orderId);
        OrderLine line = order.findLine(lineId);
        line.setQuantity(newQuantity);
        orderRepository.save(order);
    }
}
```

---

### R06 — 值对象（Value Object）vs 实体（Entity）

**MUST** — 正确区分 Value Object 与 Entity：

| 维度 | Entity | Value Object |
|------|--------|--------------|
| 标识 | 有唯一 ID | 无独立 ID，由属性值确定身份 |
| 可变性 | 可变 | 不可变（Immutable） |
| 相等性 | 基于 ID | 基于所有属性值 |
| 生命周期 | 有独立生命周期 | 依附于 Entity |
| 示例 | User、Order、Product | Money、Address、Email |

**MUST** — Value Object 必须不可变。修改 Value Object 必须创建新实例。

**MUST** — 优先使用 Value Object。当不需要跟踪对象身份时，必须使用 Value Object。

✅ Correct:

```java
public final class Money implements ValueObject {

    private final BigDecimal amount;
    private final String currency;

    public Money add(Money other) {
        if (!this.currency.equals(other.currency)) {
            throw new DomainException("Cannot add money with different currencies");
        }
        return new Money(this.amount.add(other.amount), this.currency);
    }

    @Override
    public boolean equals(Object o) {
        if (!(o instanceof Money)) return false;
        Money money = (Money) o;
        return amount.compareTo(money.amount) == 0
            && currency.equals(money.currency);
    }
}
```

❌ Wrong:

```java
public class Money {

    private BigDecimal amount;
    private String currency;

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }
}
```

---

### R07 — 领域事件（Domain Event）

**MUST** — 领域事件必须满足：

1. **过去时态命名** — `OrderCreated`、`PaymentSucceeded`
2. **不可变** — 事件一旦产生不可修改
3. **自描述** — 事件包含足够信息，消费者无需回查源聚合
4. **业务语义** — 表达业务含义，而非技术操作

✅ Correct:

```java
public final class OrderCreatedEvent implements DomainEvent {

    private final OrderId orderId;
    private final UserId userId;
    private final Money totalAmount;
    private final List<OrderLineInfo> lines;
    private final Instant occurredAt;

    public OrderCreatedEvent(OrderId orderId, UserId userId,
                             Money totalAmount, List<OrderLineInfo> lines) {
        this.orderId = orderId;
        this.userId = userId;
        this.totalAmount = totalAmount;
        this.lines = List.copyOf(lines);
        this.occurredAt = Instant.now();
    }
}
```

❌ Wrong:

```java
public class OrderEvent {

    private String type;
    private Map<String, Object> data;
}
```

**MUST** — 当业务要求事件不丢失时，必须使用 Transactional Outbox Pattern。

---

### R08 — 领域服务（Domain Service）vs 应用服务（Application Service）

**MUST** — 严格区分 Domain Service 与 Application Service：

| 维度 | Domain Service | Application Service |
|------|---------------|-------------------|
| 位置 | 领域层 | 应用层 |
| 职责 | 表达领域逻辑，无状态 | 编排领域对象，协调基础设施 |
| 依赖 | 仅依赖领域对象 | 依赖 Domain Service、Repository、外部服务 |
| 事务 | 不管理事务 | 管理事务边界 |

**MUST** — Domain Service 不依赖基础设施层。

**MUST** — Application Service 不包含业务逻辑，仅做编排。

✅ Correct:

```java
public class TransferDomainService {

    public void transfer(Account from, Account to, Money amount) {
        from.debit(amount);
        to.credit(amount);
    }
}

public class TransferApplicationService {

    @Transactional
    public void handle(TransferCommand cmd) {
        Account from = accountRepository.findById(cmd.getFromAccountId());
        Account to = accountRepository.findById(cmd.getToAccountId());
        transferDomainService.transfer(from, to, cmd.getAmount());
        accountRepository.save(from);
        accountRepository.save(to);
    }
}
```

❌ Wrong:

```java
public class TransferService {

    @Transactional
    public void transfer(Long fromId, Long toId, BigDecimal amount) {
        Account from = accountRepository.findById(fromId);
        Account to = accountRepository.findById(toId);
        from.setBalance(from.getBalance().subtract(amount));
        to.setBalance(to.getBalance().add(amount));
    }
}
```

---

### R09 — 仓库（Repository）模式

**MUST** — Repository 必须遵循：

1. **面向聚合** — 一个 Repository 对应一个 Aggregate Root
2. **接口在领域层** — 接口定义在领域层，实现在基础设施层
3. **完整聚合** — 保存时必须持久化整个聚合
4. **语义化命名** — 方法命名表达领域意图

✅ Correct:

```java
public interface OrderRepository {

    Order findById(OrderId id);
    void save(Order order);
    void delete(Order order);
    List<Order> findByUserId(UserId userId);
    List<Order> findPendingOrders();
}
```

❌ Wrong:

```java
public interface OrderRepository {

    Order findByUserIdAndStatusAndCreatedAtBetween(
        Long userId, String status, LocalDate start, LocalDate end);
    List<Order> findBySql(String sql);
    void saveOrderLines(List<OrderLine> lines);
    void updateTotalAmount(Long orderId, BigDecimal amount);
}
```

---

### R10 — 工厂（Factory）模式

**MUST** — 当聚合的创建逻辑复杂时，必须使用 Factory 封装创建过程：

**使用场景：**

- 聚合创建涉及多个步骤或规则校验
- 创建逻辑不属于聚合根自身的职责
- 需要根据不同策略创建不同类型的聚合

**MUST** — Factory 创建的聚合必须满足所有业务不变量。

**MAY** — 简单的聚合创建可以直接使用构造函数。

---

### R11 — 分层架构

**MUST** — DDD 项目必须采用四层分层架构：

```
┌─────────────────────────────────────┐
│         Interface Layer             │  接口层
│  (Controller, DTO, Assembler)       │
├─────────────────────────────────────┤
│       Application Layer             │  应用层
│  (Application Service, Command,     │
│   Query, EventHandler)              │
├─────────────────────────────────────┤
│         Domain Layer                │  领域层
│  (Aggregate, Entity, Value Object,  │
│   Domain Service, Domain Event,     │
│   Repository Interface)             │
├─────────────────────────────────────┤
│      Infrastructure Layer           │  基础设施层
│  (Repository Impl, MQ, Cache,       │
│   External Service, Config)         │
└─────────────────────────────────────┘
```

**依赖规则：**

| 层 | 可依赖 | 禁止依赖 |
|----|--------|---------|
| Interface | Application | Domain、Infrastructure |
| Application | Domain | Infrastructure |
| Domain | 无 | Application、Infrastructure、任何外部框架 |
| Infrastructure | Domain（实现接口） | Application、Interface |

**MUST** — 领域层不依赖任何框架，保持纯粹。

---

### R12 — CQRS 与 DDD 的关系

**SHOULD** — 在读多写少或读写模型差异大的场景下，采用 CQRS 分离读写模型：

| 维度 | DDD 领域模型（写模型） | CQRS 读模型 |
|------|----------------------|-------------|
| 目标 | 保证业务一致性 | 查询性能优化 |
| 模型 | 聚合、实体、值对象 | 扁平化 DTO、视图模型 |
| 数据源 | 事务性写库 | 可使用读专用库 |

**MUST** — Command 侧必须使用 DDD 领域模型，Query 侧可以绕过领域模型直接查询。

---

### R13 — DDD 与微服务的关系

**MUST** — 正确理解 DDD 与微服务的关系：

| 维度 | DDD | 微服务 |
|------|-----|--------|
| 本质 | 设计方法论 | 架构风格 |
| 目标 | 管理业务复杂度 | 独立部署、技术异构 |
| 关系 | DDD 指导微服务边界划分 | 微服务是 DDD 的一种部署形态 |

**核心原则：**

1. **Bounded Context ≠ 微服务** — 一个 Context 可以是微服务，也可以是模块化单体中的模块
2. **先 DDD 后微服务** — 先理解业务边界，再决定是否拆分
3. **禁止为拆而拆** — 微服务引入分布式复杂度，必须有充分的业务理由

✅ Correct:

```
阶段一：模块化单体（Modular Monolith）
  - 每个 Bounded Context 对应一个模块
  - 模块间通过接口通信

阶段二：当模块需要独立扩展时
  - 将模块拆分为独立微服务
  - 已有的模块接口变为 RPC/消息接口
```

❌ Wrong:

```
项目启动即拆分为 10+ 微服务
每个 Entity 一个微服务
没有 DDD 建模，按技术层拆分服务
```

---

### R14 — 反模式

**MUST** — 严格避免以下反模式：

#### 14.1 贫血模型（Anemic Domain Model）

**MUST** — 禁止使用贫血模型。领域对象必须封装行为，而非仅作为数据载体。

✅ Correct:

```java
public class Order extends AggregateRoot {

    private OrderStatus status;

    public void confirm() {
        if (status != OrderStatus.PENDING) {
            throw new DomainException("Only pending order can be confirmed");
        }
        this.status = OrderStatus.CONFIRMED;
        registerEvent(new OrderConfirmedEvent(this.id));
    }
}
```

❌ Wrong:

```java
public class Order {

    private String status;

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
```

#### 14.2 过度设计（Over-Engineering）

**MUST** — 禁止对简单业务场景过度应用 DDD 战术模式：

| 场景 | 推荐 | 不推荐 |
|------|------|--------|
| CRUD 管理后台 | 简单三层架构 | 完整 DDD + CQRS + Event Sourcing |
| 核心业务域 | 完整 DDD 战术建模 | 贫血模型 |
| 数据看板 | CQRS 读模型 | 为读操作设计聚合 |

#### 14.3 跨聚合事务

**MUST** — 禁止使用跨聚合的强一致性事务。聚合间必须通过领域事件 + 最终一致性保证。

✅ Correct:

```java
public class OrderApplicationService {

    @Transactional
    public void createOrder(CreateOrderCommand cmd) {
        Order order = OrderFactory.create(cmd);
        orderRepository.save(order);
    }
}

public class OrderCreatedEventHandler {

    @Transactional
    public void handle(OrderCreatedEvent event) {
        Inventory inventory = inventoryRepository
            .findByProductId(event.getProductId());
        inventory.reserve(event.getOrderId(), event.getQuantity());
        inventoryRepository.save(inventory);
    }
}
```

❌ Wrong:

```java
@Transactional
public void createOrder(CreateOrderCommand cmd) {
    Order order = OrderFactory.create(cmd);
    orderRepository.save(order);

    Inventory inventory = inventoryRepository
        .findByProductId(cmd.getProductId());
    inventory.reserve(order.getId(), cmd.getQuantity());
    inventoryRepository.save(inventory);
}
```

---

## Checklist

- [ ] 战略设计先于战术设计
- [ ] 每个 Bounded Context 拥有独立的 Ubiquitous Language
- [ ] Context Map 显式定义上下文间关系
- [ ] 对接外部系统使用 ACL
- [ ] 聚合设计遵循小聚合原则
- [ ] 聚合间通过 ID 引用
- [ ] 聚合根守护不变量
- [ ] Value Object 不可变，优先使用
- [ ] 领域事件使用过去时态命名
- [ ] Domain Service 不依赖基础设施层
- [ ] Application Service 不包含业务逻辑
- [ ] Repository 面向聚合根，接口定义在领域层
- [ ] 领域层不依赖框架
- [ ] 分层架构依赖方向正确
- [ ] Command 侧使用 DDD 模型，Query 侧可绕过
- [ ] Bounded Context 不等同于微服务
- [ ] 禁止贫血模型
- [ ] 禁止跨聚合强一致性事务
- [ ] 简单场景不过度设计
