# Microservice（微服务架构）

## Overview

微服务架构将应用拆分为多个小型、独立部署的服务，每个服务围绕特定业务能力构建，拥有独立的数据存储和运行进程。服务间通过轻量级协议通信，实现技术栈异构、团队自治和独立扩展。然而，分布式系统的复杂性也带来了服务治理、数据一致性和运维成本的挑战。

---

## Rules

### R01 — 服务边界定义

**MUST** 基于领域驱动设计（DDD）的限界上下文（Bounded Context）划分服务边界，确保每个服务拥有独立的领域模型。

**SHOULD** 一个服务对应一个业务能力，避免跨领域的功能混杂在同一个服务中。

**MAY** 当两个限界上下文之间的交互频率极高且变更节奏一致时，可合并为一个服务。

✅ 正确示例：
```
order-service      → 订单全生命周期管理
inventory-service → 库存扣减与补货
payment-service   → 支付处理与对账
notification-service → 消息推送与通知
```

❌ 错误示例：
```
monolith-service → 包含订单、库存、支付、用户、报表等所有功能
```

---

### R02 — API Gateway 模式

**MUST** 在微服务集群前端部署 API Gateway，统一处理路由、认证、限流和日志。

**SHOULD** 将通用横切关注点（如认证、授权、限流）集中在 Gateway 层，避免各服务重复实现。

**MAY** 根据客户端类型（Web / Mobile / OpenAPI）部署多个 Gateway 实例。

✅ 正确示例：
```yaml
# Spring Cloud Gateway 路由配置
spring:
  cloud:
    gateway:
      routes:
        - id: order-route
          uri: http://order-service:8080
          predicates:
            - Path=/api/orders/**
          filters:
            - name: RequestRateLimiter
              args:
                redis-rate-limiter.replenishRate: 100
```

❌ 错误示例：
```java
// 每个服务各自实现认证逻辑，代码重复且策略不一致
@GetMapping("/orders")
public List<Order> getOrders(@RequestHeader("Authorization") String token) {
    authService.verify(token); // 每个服务都写一遍
    return orderRepository.findAll();
}
```

---

### R03 — 服务间通信（同步 vs 异步）

**MUST** 明确选择通信方式并说明理由：同步调用适用于强依赖的实时查询，异步消息适用于解耦和最终一致性场景。

**SHOULD** 优先使用异步通信减少服务间耦合，仅在需要即时响应时使用同步调用。

**MAY** 对于同步调用设置超时和重试策略，防止级联故障。

✅ 正确示例：
```java
// 同步调用 — 带超时控制
RestTemplate rest = new RestTemplate();
rest.setConnectTimeout(Duration.ofSeconds(3));
rest.setReadTimeout(Duration.ofSeconds(5));
InventoryStock stock = rest.getForObject(
    "http://inventory-service/api/stock/{skuId}", InventoryStock.class, skuId);

// 异步调用 — 通过消息队列解耦
kafkaTemplate.send("order-created", event);
```

❌ 错误示例：
```java
// 同步调用无超时，下游服务挂起导致线程池耗尽
InventoryStock stock = rest.getForObject(
    "http://inventory-service/api/stock/{skuId}", InventoryStock.class, skuId);
```

---

### R04 — 服务发现

**MUST** 使用服务注册中心（如 Consul、Nacos、Eureka）实现服务实例的自动注册与发现。

**SHOULD** 服务启动时自动注册，停止时自动注销，避免手动维护服务地址列表。

**MAY** 结合健康检查机制，自动剔除不健康的服务实例。

✅ 正确示例：
```yaml
# Nacos 服务注册配置
spring:
  cloud:
    nacos:
      discovery:
        server-addr: ${NACOS_SERVER:nacos:8848}
        heart-beat-interval: 5000
        health-check:
          type: TCP
```

❌ 错误示例：
```yaml
# 硬编码服务地址，无法动态扩缩容
order-service:
  url: http://192.168.1.10:8080
```

---

### R05 — 熔断器模式

**MUST** 在对外调用的外部依赖处配置熔断器（如 Resilience4j、Sentinel），防止故障扩散。

**SHOULD** 设置合理的熔断阈值（如失败率 > 50% 或慢调用比例 > 60%），并在熔断后提供降级方案。

**MAY** 配置半开状态探测，逐步恢复被熔断的依赖。

✅ 正确示例：
```java
@CircuitBreaker(name = "inventoryService", fallbackMethod = "getDefaultStock")
public InventoryStock checkStock(String skuId) {
    return inventoryClient.getStock(skuId);
}

public InventoryStock getDefaultStock(String skuId, Throwable t) {
    log.warn("库存服务不可用，返回默认值: skuId={}", skuId);
    return new InventoryStock(skuId, 0); // 降级：假设无库存
}
```

❌ 错误示例：
```java
// 无熔断保护，下游故障直接传导至上游
public InventoryStock checkStock(String skuId) {
    return inventoryClient.getStock(skuId); // 超时后阻塞整个线程池
}
```

---

### R06 — 分布式追踪

**MUST** 为每个请求分配全局唯一的 Trace ID，贯穿所有服务调用链。

**SHOULD** 使用 OpenTelemetry 或 SkyWalking 等标准框架采集 Trace 数据，集中存储于 Jaeger 或 Zipkin。

**MAY** 在日志中输出 Trace ID，便于问题排查。

✅ 正确示例：
```java
// WebFilter 注入 Trace ID
@Component
public class TraceFilter implements WebFilter {
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        String traceId = exchange.getRequest().getHeaders().getFirst("X-Trace-Id");
        if (traceId == null) traceId = UUID.randomUUID().toString();
        exchange.getResponse().getHeaders().add("X-Trace-Id", traceId);
        MDC.put("traceId", traceId);
        return chain.filter(exchange);
    }
}
```

❌ 错误示例：
```java
// 各服务独立生成日志，无法关联同一请求
log.info("处理订单请求: orderId={}", orderId);
// 缺少 traceId，无法串联完整调用链
```

---

### R07 — 数据管理（Database per Service）

**MUST** 每个微服务拥有独立的数据库实例，禁止跨服务直接访问其他服务的数据库。

**SHOULD** 通过 API 或事件获取其他服务的数据，保持数据所有权清晰。

**MAY** 对于读多写少的场景，可使用 CQRS + 事件投影复制只读副本到本地缓存。

✅ 正确示例：
```
order-service → order_db (PostgreSQL)
inventory-service → inventory_db (MySQL)
payment-service → payment_db (PostgreSQL)
```

❌ 错误示例：
```java
// 订单服务直接查询库存服务的数据库
@Query("SELECT i FROM inventory_item i WHERE i.skuId = :skuId")
InventoryItem findBySku(@Param("skuId") String skuId);
// 违反了数据库归属原则，产生跨服务紧耦合
```

---

### R08 — 部署策略

**MUST** 采用容器化部署（Docker + Kubernetes），确保环境一致性和弹性伸缩。

**SHOULD** 使用蓝绿部署或金丝雀发布降低上线风险，避免全量切换。

**MAY** 利用 Istio 或 Argo Rollouts 实现流量灰度和自动回滚。

✅ 正确示例：
```yaml
# Kubernetes Deployment + 金丝雀策略
apiVersion: argoproj.io/v1alpha1
kind: Rollout
spec:
  strategy:
    canary:
      steps:
        - setWeight: 10
        - pause: { duration: 5m }
        - setWeight: 50
        - pause: { duration: 5m }
        - setWeight: 100
```

❌ 错误示例：
```bash
# 手动停服更新，存在停机窗口
kubectl scale deployment order-service --replicas=0
kubectl apply -f order-service-deployment.yaml
kubectl scale deployment order-service --replicas=3
```

---

## Checklist

- [ ] 服务边界是否基于限界上下文划分？
- [ ] API Gateway 是否已统一处理路由和横切关注点？
- [ ] 服务间通信方式是否合理选择？
- [ ] 服务注册与发现是否已配置？
- [ ] 外部依赖是否已配置熔断器？
- [ ] 分布式追踪是否已启用？
- [ ] 每个服务是否有独立数据库？
- [ ] 部署策略是否支持零停机发布？
