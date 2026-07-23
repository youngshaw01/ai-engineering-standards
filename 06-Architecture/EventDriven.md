# EventDriven（事件驱动架构）

## Overview

事件驱动架构（Event-Driven Architecture, EDA）是一种以事件为核心驱动力的架构模式。系统通过生产、消费和处理事件来实现松耦合的异步通信。事件作为事实的记录，描述了领域中已发生的业务状态变化，使得生产者与消费者之间无需直接依赖，从而提升系统的可扩展性、容错性和演进能力。

---

## Rules

### R01 — 事件定义与分类

**MUST** 将事件按职责分为三类：领域事件（Domain Event）、集成事件（Integration Event）、通知事件（Notification Event），并明确标注类型。

**SHOULD** 在事件命名中体现动作语义，使用过去时态（如 `OrderCreated`、`PaymentCompleted`）。

**MAY** 为不同类别的事件建立独立的 Topic / Channel，避免混用。

✅ 正确示例：
```java
// 领域事件 — 表达领域内状态变更
public class OrderCreatedEvent {
    private String orderId;
    private List<String> items;
    private Instant createdAt;
}

// 集成事件 — 跨服务边界传递
public class OrderSyncToInventoryEvent {
    private String orderId;
    private Map<String, Integer> itemQuantities;
}

// 通知事件 — 触发外部通知
public class OrderConfirmationEmailEvent {
    private String customerEmail;
    private String orderId;
}
```

❌ 错误示例：
```java
// 所有事件混在一起，无法区分用途
public class GenericEvent {
    private String type; // "domain" | "integration" | "notification"
    private String data; // JSON 字符串，不可读
}
```

---

### R02 — 事件 Schema 设计

**MUST** 为每个事件定义明确的 Schema（字段、类型、约束），禁止使用无结构的 `Map<String, Object>`。

**SHOULD** 使用 JSON Schema、Avro 或 Protobuf 等强类型 Schema 定义工具，确保事件结构可验证。

**MAY** 在事件头部包含元数据（如 `eventId`、`source`、`timestamp`、`version`）。

✅ 正确示例：
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "OrderCreatedEvent",
  "properties": {
    "eventId":    { "type": "string", "format": "uuid" },
    "orderId":    { "type": "string" },
    "items":      { "type": "array", "items": { "type": "string" } },
    "createdAt":  { "type": "string", "format": "date-time" },
    "version":    { "type": "integer", "minimum": 1 }
  },
  "required": ["eventId", "orderId", "items", "createdAt", "version"]
}
```

❌ 错误示例：
```json
{
  "data": "{\"orderId\":\"xxx\"}"
}
```

---

### R03 — 事件总线选型

**MUST** 根据团队规模、部署环境和运维能力选择事件总线，禁止盲目引入重量级方案。

**SHOULD** 优先选择与现有技术栈一致的消息中间件（如已有 Kafka 则复用 Kafka）。

**MAY** 评估托管服务（如 AWS SNS/SQS、Azure Service Bus）以降低运维负担。

| 方案 | 适用场景 | 复杂度 |
|------|----------|--------|
| Kafka | 高吞吐、持久化日志、多消费者 | 高 |
| RabbitMQ | 中等吞吐、路由灵活、易运维 | 中 |
| RocketMQ | 国内生态、事务消息支持 | 中 |
| AWS SNS/SQS | 云原生、免运维 | 低 |

✅ 正确示例：
```yaml
# 选择 Kafka 作为事件总线，因需要事件回溯和多消费者组
spring:
  kafka:
    bootstrap-servers: ${KAFKA_BOOTSTRAP_SERVERS}
    consumer:
      group-id: order-service
      auto-offset-reset: earliest
```

❌ 错误示例：
```yaml
# 小团队选用 Kafka + 自建集群，运维成本远超收益
spring:
  kafka:
    bootstrap-servers: kafka-0:9092,kafka-1:9092,kafka-2:9092
```

---

### R04 — Saga 模式实现分布式事务

**MUST** 当跨多个服务的写操作需要保证最终一致性时，必须使用 Saga 模式编排补偿流程。

**SHOULD** 明确定义每个步骤的正向操作和补偿操作，确保任一步骤失败均可回滚。

**MAY** 使用编排式（Orchestration）或协同式（Choreography）Saga，根据业务复杂度选择。

✅ 正确示例：
```java
// 编排式 Saga — 由中心协调器控制流程
class OrderSaga {
    @Transactional
    public void execute(CreateOrderCommand cmd) {
        try {
            // Step 1: 创建订单
            orderService.create(cmd);
            // Step 2: 扣减库存
            inventoryService.reserve(cmd.getItems());
            // Step 3: 发起支付
            paymentService.charge(cmd.getOrderId(), cmd.getAmount());
        } catch (Exception e) {
            // 补偿：反向执行已完成步骤
            paymentService.cancel(cmd.getOrderId());
            inventoryService.release(cmd.getItems());
            orderService.cancel(cmd.getOrderId());
        }
    }
}
```

❌ 错误示例：
```java
// 无补偿机制，中间步骤失败导致数据不一致
public void createOrderWithPayment(Order order) {
    orderService.create(order);
    inventoryService.reserve(order.getItems());
    paymentService.charge(order.getId(), order.getAmount());
    // 如果 paymentService.charge() 抛出异常，前两步已提交，无法回滚
}
```

---

### R05 — Outbox 模式

**MUST** 当事件产生于数据库事务内部时，必须使用 Outbox 模式确保事件可靠投递。

**SHOULD** 将 Outbox 表与业务表放在同一数据库事务中，保证原子性。

**MAY** 使用 CDC（Change Data Capture）工具（如 Debezium）自动监听 Outbox 表变更并推送到消息队列。

✅ 正确示例：
```sql
-- Outbox 表与业务表同库同事务
BEGIN TRANSACTION;
INSERT INTO orders (id, status, total) VALUES ('ORD-001', 'CREATED', 99.9);
INSERT INTO outbox (aggregate_type, aggregate_id, event_type, event_payload, created_at)
VALUES ('Order', 'ORD-001', 'OrderCreated', '{"orderId":"ORD-001","total":99.9}', NOW());
COMMIT;
```

❌ 错误示例：
```java
// 先写数据库再发消息，非原子操作，可能丢消息
orderRepository.save(order);
eventBus.publish(new OrderCreatedEvent(order.getId())); // 如果此处崩溃，消息丢失
```

---

### R06 — 事件版本管理与演进

**MUST** 每次修改事件 Schema 时递增版本号（`version` 字段），禁止破坏性变更。

**SHOULD** 保留旧版本事件的消费者至少两个大版本周期，确保平滑升级。

**MAY** 提供事件转换层（Event Translator），将旧版本事件转换为新版本后再投递给新消费者。

✅ 正确示例：
```java
// V1 → V2：新增字段，旧消费者忽略未知字段
public class OrderCreatedEventV2 extends OrderCreatedEventV1 {
    private String couponCode; // 新增字段
}

// 消费者兼容处理
public void on(Object event) {
    if (event instanceof OrderCreatedEventV2 evt) {
        // 使用新字段
    } else if (event instanceof OrderCreatedEventV1 evt) {
        // 兼容旧版本
    }
}
```

❌ 错误示例：
```java
// 删除字段，导致旧消费者反序列化失败
public class OrderCreatedEventV2 {
    private String orderId;
    // items 字段被删除，旧消费者报错
}
```

---

### R07 — 事件监控与追踪

**MUST** 为每个事件分配全局唯一的 `eventId`，并在整个生命周期中保持追踪链路。

**SHOULD** 采集以下指标：事件发布量、消费延迟、消费失败率、死信队列深度。

**MAY** 集成分布式追踪系统（如 OpenTelemetry），将事件传播纳入 Trace 上下文。

✅ 正确示例：
```java
// 发布事件时注入追踪信息
public void publish(DomainEvent event) {
    event.setEventId(UUID.randomUUID().toString());
    event.setTraceId(MDC.get("traceId"));
    kafkaTemplate.send(topic, event.getEventId(), serialize(event));
}
```

❌ 错误示例：
```java
// 无追踪 ID，出现问题时无法定位事件来源
kafkaTemplate.send(topic, serialize(event));
```

---

### R08 — 最终一致性处理

**MUST** 对最终一致性窗口内的临时不一致状态进行明确说明，并在 UI 或 API 中给出提示。

**SHOULD** 设置合理的超时和重试策略，避免无限等待。

**MAY** 提供手动触发补偿的运维接口，用于修复长时间未达成一致的数据。

✅ 正确示例：
```java
// 带超时的补偿检查
@Scheduled(fixedDelay = 60_000)
public void reconcileStaleOrders() {
    List<Order> stale = orderRepository.findByStatusAndCreatedBefore(
        "PENDING_CONFIRMATION", Instant.now().minus(5, ChronoUnit.MINUTES)
    );
    stale.forEach(order -> compensationService.checkAndResolve(order));
}
```

❌ 错误示例：
```java
// 无超时、无监控，不一致数据永久滞留
public void processEvent(OrderCreatedEvent evt) {
    // 如果下游服务一直不响应，此订单永远处于 PENDING 状态
    inventoryService.reserve(evt.getItems()); // 无超时控制
}
```

---

## Checklist

- [ ] 事件是否已按领域/集成/通知分类？
- [ ] 每个事件是否有明确的 Schema 定义？
- [ ] 事件总线选型是否匹配团队能力？
- [ ] 跨服务事务是否使用了 Saga 模式？
- [ ] 数据库内产生的事件是否使用了 Outbox 模式？
- [ ] 事件 Schema 变更是否递增版本号？
- [ ] 事件是否具备全链路追踪能力？
- [ ] 最终一致性是否有超时和补偿机制？
