# Message Queue

## Overview

消息队列规范，涵盖队列选型、消息设计、Producer 最佳实践、Consumer 最佳实践、顺序保证、监控告警、死信队列处理和消息 Schema 演进。适用于使用 Kafka / RabbitMQ / RocketMQ 的后端系统。

---

## Rules

### R01 — 队列选型

**MUST** — 根据业务场景选择合适的消息队列：

| 维度 | Kafka | RabbitMQ | RocketMQ |
|------|-------|----------|----------|
| 定位 | 分布式流处理平台 | 传统消息代理 | 分布式消息中间件 |
| 吞吐量 | 极高（百万级/s） | 中（万级/s） | 高（十万级/s） |
| 延迟 | ms 级 | μs 级 | ms 级 |
| 顺序保证 | Partition 内有序 | 单 Queue 有序 | Queue 有序 |
| 事务消息 | 支持（Exactly-Once） | 不支持 | 支持 |
| 消息回溯 | 支持（按 Offset） | 不支持 | 支持（按时间） |
| 生态 | 大数据生态丰富 | AMQP 生态 | 阿里云生态 |
| 运维复杂度 | 高 | 中 | 中 |

**选型建议：**

| 场景 | 推荐 |
|------|------|
| 日志收集 / 大数据管道 | Kafka |
| 业务解耦 / 异步任务 | RabbitMQ / RocketMQ |
| 事务消息 / 金融场景 | RocketMQ |
| 流处理 / 实时分析 | Kafka |
| 低延迟 RPC 替代 | RabbitMQ |
| 国内部署 + 阿里云 | RocketMQ |

✅ Correct:

```
场景：订单支付成功后异步通知库存服务
选型：RocketMQ（事务消息保证一致性）
```

❌ Wrong:

```
场景：日志收集（每秒百万条）
选型：RabbitMQ（吞吐量不足）
```

---

### R02 — 消息设计

**MUST** — 消息结构遵循以下规范：

**消息头：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `message_id` | String | 全局唯一 ID（UUID / Snowflake） |
| `idempotency_key` | String | 幂等键（业务唯一标识） |
| `timestamp` | Long | 消息创建时间戳 |
| `source` | String | 消息来源服务 |
| `trace_id` | String | 链路追踪 ID |
| `content_type` | String | 消息体格式（JSON / Avro / Protobuf） |
| `version` | String | Schema 版本 |

**消息体：**

✅ Correct:

```json
{
    "header": {
        "message_id": "msg_550e8400e29b",
        "idempotency_key": "order_123_pay_success",
        "timestamp": 1705312200000,
        "source": "payment-service",
        "trace_id": "trace_abc123",
        "content_type": "application/json",
        "version": "v2"
    },
    "body": {
        "order_id": "123",
        "amount": 99.9,
        "currency": "CNY",
        "status": "PAID"
    }
}
```

❌ Wrong:

```json
{
    "order_id": 123,
    "paid": true
}
```

**Topic / Queue 命名规范：**

```
<domain>.<event>.<version>

示例：
order.created.v1
order.status_changed.v1
payment.succeeded.v1
user.registered.v1
```

---

### R03 — Producer 最佳实践

**MUST** — 生产者遵循以下规范：

**发送确认：**

| 可靠级别 | 配置 | 适用场景 |
|----------|------|---------|
| 最多一次 | `acks=0` | 日志采集（允许丢消息） |
| 至少一次 | `acks=1` | 普通业务消息 |
| 精确一次 | `acks=all` + 事务 | 金融 / 支付 |

✅ Correct (Kafka):

```java
Properties props = new Properties();
props.put("bootstrap.servers", "kafka:9092");
props.put("acks", "all");
props.put("retries", 3);
props.put("retry.backoff.ms", 100);
props.put("max.in.flight.requests.per.connection", 1);
props.put("enable.idempotence", true);

Producer<String, String> producer = new KafkaProducer<>(props);
```

**发送失败处理：**

✅ Correct:

```java
producer.send(record, (metadata, exception) -> {
    if (exception != null) {
        log.error("Failed to send message: {}", record.key(), exception);
        deadLetterService.save(record, exception);
    } else {
        log.info("Message sent to {}-{}", metadata.topic(), metadata.partition());
    }
});
```

❌ Wrong:

```java
producer.send(record);  // 无回调，消息丢失无感知
```

**禁止同步发送阻塞业务线程。**

---

### R04 — Consumer 最佳实践

**MUST** — 消费者遵循以下规范：

**幂等消费：**

✅ Correct:

```java
@RabbitListener(queues = "order.created")
public void handleOrderCreated(OrderCreatedEvent event) {
    String idempotencyKey = event.getHeader().getIdempotencyKey();
    if (processedMessageRepository.existsById(idempotencyKey)) {
        log.info("Duplicate message ignored: {}", idempotencyKey);
        return;
    }
    orderService.processOrder(event.getBody());
    processedMessageRepository.save(new ProcessedMessage(idempotencyKey));
}
```

❌ Wrong:

```java
@RabbitListener(queues = "order.created")
public void handleOrderCreated(OrderCreatedEvent event) {
    orderService.processOrder(event.getBody());  // 无幂等检查，重复消费
}
```

**重试策略：**

| 策略 | 配置 | 适用场景 |
|------|------|---------|
| 固定间隔 | `retry: 3, interval: 1s` | 网络抖动 |
| 指数退避 | `retry: 5, base: 1s, multiplier: 2` | 下游限流 |
| 延迟队列 | 死信 → 延迟队列 → 重投 | 长时间恢复 |

✅ Correct (RabbitMQ):

```yaml
spring:
  rabbitmq:
    listener:
      simple:
        retry:
          enabled: true
          max-attempts: 3
          initial-interval: 1000
          multiplier: 2.0
          max-interval: 10000
```

**禁止无限重试，必须设置最大重试次数。**

---

### R05 — 顺序保证

**SHOULD** — 根据业务需求选择顺序级别：

| 顺序级别 | 实现方式 | 适用场景 |
|----------|---------|---------|
| 全局有序 | 单 Partition / 单 Queue | 极少使用 |
| 分区有序 | 相同 Key 路由到同一 Partition | 订单状态变更 |
| 无序 | 随机分配 | 日志采集 |

✅ Correct (Kafka):

```java
// 同一订单的事件路由到同一 Partition，保证顺序
ProducerRecord<String, String> record = new ProducerRecord<>(
    "order.events",
    orderId,     // Key = orderId → 同一订单进入同一 Partition
    eventJson
);
producer.send(record);
```

❌ Wrong:

```java
// 无 Key，事件随机分配，顺序无法保证
ProducerRecord<String, String> record = new ProducerRecord<>(
    "order.events",
    eventJson    // 无 Key → 乱序
);
```

**顺序消息注意事项：**

- 消费者必须单线程消费同一 Key 的消息
- 消费失败不跳过，阻塞后续消息
- 部署多消费者实例时，同一 Key 始终路由到同一消费者

---

### R06 — 监控与告警

**MUST** — 消息队列必须配置监控和告警：

**核心指标：**

| 指标 | 说明 | 告警阈值 |
|------|------|---------|
| 消息堆积量 | Consumer Lag | > 10000 条 |
| 生产发送失败率 | Send Error Rate | > 0.1% |
| 消费处理延迟 | Consumer Latency | > 5s |
| 消费失败率 | Consumer Error Rate | > 1% |
| 死信队列消息数 | DLQ Size | > 0 |

✅ Correct (Kafka + Prometheus):

```yaml
# Prometheus alert rules
groups:
  - name: kafka-alerts
    rules:
      - alert: KafkaConsumerLag
        expr: kafka_consumer_lag_records > 10000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Consumer lag too high"

      - alert: KafkaDLQMessages
        expr: kafka_topic_partition_current_offset{topic=~".*DLQ"} > 0
        labels:
          severity: critical
        annotations:
          summary: "Dead letter queue has messages"
```

**监控仪表盘：**

- 生产速率 / 消费速率
- 消息堆积趋势
- 各 Consumer Group Lag
- 端到端延迟分布

---

### R07 — 死信队列处理

**MUST** — 消费失败的消息必须进入死信队列（DLQ）：

**DLQ 处理流程：**

```
原始消息
  ↓
消费失败（重试 3 次后仍失败）
  ↓
进入 DLQ（Dead Letter Queue）
  ↓
人工排查 / 自动修复
  ↓
重新投递或丢弃
```

✅ Correct (RabbitMQ):

```java
@Bean
public Queue orderQueue() {
    return QueueBuilder.durable("order.created")
            .withArgument("x-dead-letter-exchange", "order.dlx")
            .withArgument("x-dead-letter-routing-key", "order.created.dlq")
            .build();
}

@Bean
public Queue orderDLQ() {
    return QueueBuilder.durable("order.created.dlq").build();
}
```

**DLQ 消息处理策略：**

| 策略 | 说明 |
|------|------|
| 人工处理 | 运维查看 DLQ 消息，修复后重新投递 |
| 自动重试 | 定时任务扫描 DLQ，修复后重新投递 |
| 告警通知 | DLQ 有新消息时发送告警 |
| 记录归档 | 超过保留期限的 DLQ 消息归档 |

**DLQ 消息保留：**

- 保留期限至少 30 天
- 存储到数据库或对象存储做长期归档
- 禁止自动丢弃 DLQ 消息

---

### R08 — 消息 Schema 演进

**MUST** — 消息格式变更必须向后兼容：

**兼容性规则：**

| 变更类型 | 兼容性 | 说明 |
|----------|--------|------|
| 新增可选字段 | 向后兼容 | 旧 Consumer 忽略新字段 |
| 新增必填字段 | 不兼容 | 旧 Consumer 无法处理 |
| 删除字段 | 向前兼容 | 旧 Producer 不再发送该字段 |
| 修改字段类型 | 不兼容 | 必须新版本 |
| 重命名字段 | 不兼容 | 必须新版本 |

✅ Correct:

```json
// v1
{ "order_id": "123", "amount": 99.9 }

// v2 — 新增可选字段，向后兼容
{ "order_id": "123", "amount": 99.9, "currency": "CNY" }
```

❌ Wrong:

```json
// v1
{ "order_id": "123", "amount": 99.9 }

// v2 — 修改字段名，不兼容
{ "orderId": "123", "totalAmount": 99.9 }
```

**Schema 演进策略：**

| 策略 | 说明 |
|------|------|
| Topic 版本化 | `order.created.v1` → `order.created.v2` |
| Schema Registry | Confluent Schema Registry 管理 Schema 版本 |
| 双写期 | 新旧格式同时写入，Consumer 逐步迁移 |

**推荐使用 Schema Registry + Avro / Protobuf**，自动管理兼容性检查。

---

## Checklist

- [ ] 队列选型与业务场景匹配
- [ ] 消息包含完整 Header（message_id / idempotency_key / trace_id）
- [ ] Topic / Queue 命名遵循 `<domain>.<event>.<version>` 规范
- [ ] Producer 配置发送确认和失败回调
- [ ] Consumer 实现幂等消费
- [ ] 重试策略设置最大次数和指数退避
- [ ] 顺序消息使用 Key 路由到同一分区
- [ ] 监控堆积量、延迟、失败率，配置告警
- [ ] DLQ 配置完善，消息不自动丢弃
- [ ] Schema 变更向后兼容，使用版本化 Topic
