# Integration-Test（集成测试）

## Overview

集成测试验证多个组件之间的协作是否正确，介于单元测试和端到端测试之间。它关注模块间的接口、数据流和交互逻辑，是发现接口不匹配、配置错误和环境依赖问题的关键手段。本标准定义了集成测试的范围界定、外部依赖处理、测试数据管理和 CI 集成等核心实践。

---

## Rules

### R01 — 集成测试范围

**MUST** 明确集成测试的边界：覆盖服务内部多模块协作，但不跨服务边界（跨服务由契约测试或 E2E 测试覆盖）。

**SHOULD** 优先测试高风险交互路径：数据库读写、缓存操作、消息收发。

**MAY** 对低频变更的核心流程进行完整集成测试。

✅ 正确示例：
```java
// 测试 OrderService + OrderRepository + EventPublisher 的协作
@SpringBootTest
class OrderIntegrationTest {
    @Test
    void shouldPublishEventWhenOrderCreated() {
        var order = new Order(items);
        orderService.create(order);
        assertThat(eventPublisher.publishedEvents())
            .containsExactlyInstanceOf(OrderCreatedEvent.class);
    }
}
```

❌ 错误示例：
```java
// 在集成测试中测试纯业务逻辑，应由单元测试覆盖
@SpringBootTest
class OrderServiceTest {
    @Test
    void shouldCalculateTotal() {
        var total = orderService.calculateTotal(items); // 无需 Spring 上下文
        assertThat(total).isEqualTo(99.9);
    }
}
```

---

### R02 — 数据库集成（Testcontainers）

**MUST** 使用 Testcontainers 管理测试数据库，禁止使用共享的开发数据库实例。

**SHOULD** 在 `@BeforeEach` 中初始化 schema，在 `@AfterEach` 中清理数据。

**MAY** 使用 Flyway 或 Liquibase 在容器启动时执行迁移脚本。

✅ 正确示例：
```java
@Testcontainers
class OrderRepositoryIntegrationTest {
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Test
    void shouldSaveAndFindById() {
        var saved = repository.save(new Order(items));
        var found = repository.findById(saved.getId());
        assertThat(found).isPresent();
    }
}
```

❌ 错误示例：
```java
// 连接开发数据库，测试间相互干扰
@SpringBootTest
class OrderRepositoryTest {
    @Autowired
    private OrderRepository repository; // 可能污染开发环境数据
}
```

---

### R03 — 外部服务 Mock

**MUST** 对不可控制的外部服务（支付网关、第三方 API）进行 Mock，避免测试依赖外部环境。

**SHOULD** 使用 WireMock 或 MockServer 模拟外部服务的行为和响应。

**MAY** 录制真实请求/响应作为 fixture，确保 Mock 行为与实际一致。

✅ 正确示例：
```java
@WireMockTest
class PaymentServiceIntegrationTest {
    @Test
    void shouldHandlePaymentSuccess() {
        stubFor(post(urlPathEqualTo("/api/payments"))
            .willReturn(okJson(Map.of("status", "SUCCESS", "transactionId", "TXN-001"))));

        var result = paymentService.charge(orderId, amount);
        assertThat(result.getStatus()).isEqualTo("SUCCESS");
    }
}
```

❌ 错误示例：
```java
// 直接调用真实的支付网关，测试不稳定且产生费用
@Test
void testPayment() {
    var result = paymentService.charge(orderId, amount); // 真实扣款
}
```

---

### R04 — 消息队列测试

**MUST** 使用嵌入式消息中间件（如 embedded Kafka、embedded RabbitMQ）测试消息收发逻辑。

**SHOULD** 验证消息的序列化格式、分区策略和消费确认机制。

**MAY** 使用 Testcontainers 运行完整的消息中间件实例，测试更接近生产环境。

✅ 正确示例：
```java
@EmbeddedKafka(partitions = 1, topics = {"order-created"})
class OrderEventIntegrationTest {
    @Test
    void shouldPublishAndConsumeEvent() {
        // 发布
        kafkaTemplate.send("order-created", event);

        // 消费并验证
        ConsumerRecord<String, String> record = consumeOneRecord();
        assertThat(record.value()).contains("orderId");
    }
}
```

❌ 错误示例：
```java
// 依赖外部 Kafka 集群，测试不稳定
@Test
void testEvent() {
    kafkaTemplate.send("order-created", event); // 如果集群不可用则失败
}
```

---

### R05 — 缓存集成

**MUST** 在集成测试中使用嵌入式缓存（如 embedded Redis），避免依赖外部缓存实例。

**SHOULD** 验证缓存的写入、读取、过期和淘汰策略。

**MAY** 使用 Testcontainers 运行 Redis 容器，测试更复杂的缓存场景。

✅ 正确示例：
```java
@Testcontainers
class OrderCacheIntegrationTest {
    @Container
    static GenericContainer<?> redis = new GenericContainer<>("redis:7")
        .withExposedPorts(6379);

    @Test
    void shouldCacheAndRetrieve() {
        orderService.createOrder(order);
        var fromDb = orderService.getOrder(orderId); // 首次查询写缓存
        var fromCache = orderService.getOrder(orderId); // 第二次从缓存读取
        assertThat(fromCache.getId()).isEqualTo(orderId);
    }
}
```

❌ 错误示例：
```java
// 使用开发环境的 Redis，测试间缓存数据残留
@SpringBootTest
class OrderCacheTest {
    @Autowired
    private RedisTemplate redisTemplate; // 可能包含其他测试的数据
}
```

---

### R06 — Spring Context 测试

**MUST** 使用 `@SpringBootTest` 加载完整 ApplicationContext，或使用 `@WebMvcTest` / `@DataJpaTest` 加载切片上下文。

**SHOULD** 根据测试目标选择合适的注解，避免不必要的 Bean 加载。

**MAY** 使用 `@ActiveProfiles("test")` 激活测试专用配置。

✅ 正确示例：
```java
// 仅加载 Web MVC 层，速度快
@WebMvcTest(OrderController.class)
class OrderControllerSliceTest {
    @Autowired
    private MockMvc mockMvc;

    @Test
    void shouldReturnOrder() throws Exception {
        mockMvc.perform(get("/api/orders/{id}", orderId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.orderId").value(orderId));
    }
}
```

❌ 错误示例：
```java
// 加载整个 Spring 上下文，测试启动慢
@SpringBootTest
class OrderControllerTest {
    @Autowired
    private MockMvc mockMvc; // 加载了所有 Bean，包括不需要的
}
```

---

### R07 — 集成测试数据

**MUST** 每个测试方法使用独立的测试数据集，通过 `@Sql` 或编程方式准备。

**SHOULD** 将测试数据 SQL 文件放在 `src/test/resources` 目录，按功能模块组织。

**MAY** 使用数据构建器（Builder）模式创建复杂测试对象。

✅ 正确示例：
```java
@SpringBootTest
@Sql("/test-data/orders.sql")
class OrderIntegrationTest {
    @Test
    void shouldFindActiveOrders() {
        var orders = orderService.findActiveOrders();
        assertThat(orders).hasSize(3);
    }
}
```

❌ 错误示例：
```java
// 硬编码数据，难以维护
@Test
void testOrders() {
    orderRepository.save(new Order("ORD-001", ...)); // 每次手动构造
}
```

---

### R08 — CI 集成

**MUST** 将集成测试纳入 CI 流水线，但与单元测试分阶段执行。

**SHOULD** 设置合理的超时时间（如 10 分钟），防止测试套件阻塞构建。

**MAY** 在 PR 合并后自动触发集成测试，确保主分支质量。

✅ 正确示例：
```yaml
# .github/workflows/integration-test.yml
jobs:
  integration-test:
    needs: unit-test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: mvn verify -DskipUnitTests
      timeout-minutes: 10
```

❌ 错误示例：
```yaml
# 集成测试与单元测试混在一起，无法快速反馈
jobs:
  test:
    steps:
      - run: mvn test # 耗时 30+ 分钟
```

---

## Checklist

- [ ] 是否明确了集成测试的边界？
- [ ] 是否使用了 Testcontainers 管理数据库？
- [ ] 是否对外部服务进行了 Mock？
- [ ] 是否使用了嵌入式消息中间件？
- [ ] 是否使用了嵌入式缓存？
- [ ] 是否选择了合适的 Spring 测试注解？
- [ ] 是否实现了测试数据的独立管理？
- [ ] 是否已将集成测试集成到 CI/CD？
