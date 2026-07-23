# CQRS（命令查询职责分离）

## Overview

CQRS（Command Query Responsibility Segregation）是一种将读操作（Query）与写操作（Command）分离的架构模式。在传统 CRUD 架构中，同一模型同时处理读写请求；CQRS 则将两者拆分为独立的命令侧和查询侧，各自拥有独立的数据模型、存储和逻辑。这种分离使得读写可以独立优化、扩展和演进，尤其适用于读多写少、读写负载差异显著的场景。

---

## Rules

### R01 — CQRS 模式定义

**MUST** 明确区分 Command（写操作）和 Query（读操作），禁止在同一方法中既修改状态又返回数据。

**SHOULD** 使用不同的接口或类承载 Command 和 Query，保持职责单一。

**MAY** 引入 CQRS 框架（如 AxonFramework、MediatR）来标准化 Command/Query 的分发机制。

✅ 正确示例：
```java
// Command — 仅负责写入
public class CreateOrderCommand {
    private String orderId;
    private List<String> items;
}

// Query — 仅负责读取
public class GetOrderQuery {
    private String orderId;
}
```

❌ 错误示例：
```java
// 混合读写，违反 CQRS 原则
public Order updateAndGet(String orderId, OrderUpdate update) {
    orderRepository.update(orderId, update);
    return orderRepository.findById(orderId);
}
```

---

### R02 — 命令侧设计（Write Model）

**MUST** 确保 Command 是幂等的，或通过唯一标识符实现幂等控制，防止重复提交导致数据异常。

**SHOULD** 对 Command 进行输入验证，拒绝非法参数后再进入业务逻辑层。

**MAY** 使用 Command Bus 异步分发 Command，提升吞吐量。

✅ 正确示例：
```java
@PostMapping("/orders")
public ResponseEntity<Void> createOrder(@Valid @RequestBody CreateOrderCommand command) {
    commandBus.dispatch(command);
    return ResponseEntity.accepted().build();
}
```

❌ 错误示例：
```java
// Command 未做幂等控制，重复调用会产生脏数据
@PostMapping("/orders")
public Order createOrder(@RequestBody Order order) {
    return orderService.create(order);
}
```

---

### R03 — 查询侧设计（Read Model）

**MUST** 使用独立的 Read Model（如只读数据库、物化视图），禁止直接在查询侧操作 Write Model 的表。

**SHOULD** 根据查询场景定制 Read Model 的字段和结构，避免过度冗余。

**MAY** 使用读模型专用的 API 网关或缓存层加速查询响应。

✅ 正确示例：
```sql
-- Read Model 专用表，由事件投影生成
CREATE TABLE order_summary (
    order_id VARCHAR(64) PRIMARY KEY,
    customer_name VARCHAR(128),
    total_amount DECIMAL(12,2),
    status VARCHAR(32)
);
```

❌ 错误示例：
```sql
-- 查询侧直接访问 Write Model 的宽表，包含大量不相关字段
SELECT * FROM orders WHERE id = ?;
```

---

### R04 — Event Sourcing 集成

**MUST** 当使用 Event Sourcing 时，Command Handler 仅负责追加事件到 Event Store，不直接修改当前状态。

**SHOULD** 通过重放所有事件重建 Read Model，确保一致性。

**MAY** 使用快照机制优化事件链过长时的重放性能。

✅ 正确示例：
```java
class CreateOrderHandler {
    public void handle(CreateOrderCommand cmd) {
        eventStore.append(new OrderCreatedEvent(cmd.getOrderId(), cmd.getItems()));
    }
}
```

❌ 错误示例：
```java
// 直接修改状态，绕过事件溯源
class CreateOrderHandler {
    public void handle(CreateOrderCommand cmd) {
        orderRepository.save(new Order(cmd.getOrderId(), cmd.getItems()));
    }
}
```

---

### R05 — 一致性模型（最终一致 vs 强一致）

**MUST** 明确声明每个查询的一致性级别（强一致 / 最终一致），并在 API 文档中标注。

**SHOULD** 对于跨服务查询，默认采用最终一致性，并通过版本号或时间戳检测陈旧数据。

**MAY** 对关键业务场景（如金融交易）提供强一致查询选项。

✅ 正确示例：
```yaml
# API 文档明确标注一致性级别
GET /api/v1/orders/{id}:
  description: 返回订单信息（最终一致，延迟约 1-3 秒）
  responses:
    200:
      headers:
        X-Data-Version: { description: 数据版本号 }
```

❌ 错误示例：
```yaml
# 未标注一致性级别，调用方无法判断数据时效性
GET /api/v1/orders/{id}:
  description: 返回订单信息
```

---

### R06 — 投影设计（Projection）

**MUST** 投影逻辑必须可重放，即从零开始重新消费全部事件后能重建出正确的 Read Model。

**SHOULD** 记录每个投影的消费位点（offset），支持断点续投。

**MAY** 为不同查询场景创建多个投影，各自维护独立的 Read Model。

✅ 正确示例：
```java
class OrderSummaryProjection {
    @EventHandler
    public void on(OrderCreatedEvent evt) {
        readDb.insert("order_summary", evt.orderId, evt.customerName, evt.totalAmount);
    }
    
    // 支持从头重放
    public void reset() {
        readDb.deleteAll("order_summary");
    }
}
```

❌ 错误示例：
```java
// 投影依赖外部不可重现的状态，无法安全重放
class OrderSummaryProjection {
    @EventHandler
    public void on(OrderCreatedEvent evt) {
        // 依赖外部 API 获取额外信息，重放时结果不一致
        UserInfo user = externalApi.getUser(evt.customerId);
        readDb.insert("order_summary", evt.orderId, user.getName());
    }
}
```

---

### R07 — CQRS 与 DDD 结合

**MUST** 将 Command 映射到领域聚合根的操作，Query 映射到领域服务的查询方法，保持领域模型的完整性。

**SHOULD** 在聚合根内部封装 Command 的业务规则校验，不在 Application Service 中重复校验。

**MAY** 使用领域事件作为 Command 和 Query 之间的解耦媒介。

✅ 正确示例：
```java
// 聚合根封装业务规则
class Order extends AggregateRoot {
    public Order create(List<String> items) {
        if (items == null || items.isEmpty()) {
            throw new BusinessException("订单项不能为空");
        }
        this.items = items;
        registerEvent(new OrderCreatedEvent(this.id, items));
        return this;
    }
}
```

❌ 错误示例：
```java
// 业务规则散落在 Application Service 中，聚合根退化为数据载体
class OrderApplicationService {
    public void createOrder(CreateOrderCommand cmd) {
        if (cmd.getItems() == null) throw new IllegalArgumentException(); // 重复校验
        if (cmd.getItems().isEmpty()) throw new IllegalArgumentException(); // 重复校验
        Order order = new Order();
        order.setItems(cmd.getItems());
        orderRepository.save(order);
    }
}
```

---

### R08 — 适用场景与禁忌

**MUST** 在使用 CQRS 前评估读写比例差异，仅在读写负载显著不均衡时引入。

**SHOULD** 优先在单个聚合根范围内实施 CQRS，避免过早扩展到全系统。

**MAY** 对于简单 CRUD 应用（读写比例接近 1:1），保留传统单体模型。

✅ 推荐使用场景：
- 电商平台：商品目录查询量远大于下单量
- 社交网络：用户动态展示远大于内容发布
- IoT 平台：设备数据上报远少于数据分析查询

❌ 不推荐场景：
- 简单后台管理系统（CRUD 为主，读写均衡）
- 团队规模小（增加的认知负担超过收益）
- 无分布式需求的单体应用

---

## Checklist

- [ ] Command 和 Query 是否已完全分离？
- [ ] Command 是否具备幂等控制？
- [ ] 查询是否使用独立 Read Model？
- [ ] 一致性级别是否已在 API 文档中声明？
- [ ] 投影逻辑是否支持完整重放？
- [ ] 领域规则是否封装在聚合根内？
- [ ] 是否已评估 CQRS 的必要性？
- [ ] 监控指标（读写延迟、投影延迟）是否已配置？
