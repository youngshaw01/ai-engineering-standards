# Unit-Test（单元测试）

## Overview

单元测试是验证最小可测试单元（函数、方法、类）行为正确性的基础手段。它运行速度快、隔离性强，是持续集成和快速反馈的核心保障。高质量的单元测试能够早期发现缺陷、降低重构风险并提升代码可维护性。本标准定义了单元测试的范围界定、编写模式、命名规范和质量度量等关键实践。

---

## Rules

### R01 — 单元测试定义与范围

**MUST** 每个单元测试仅验证一个行为或场景，禁止在一个测试中验证多个不相关的逻辑。

**SHOULD** 优先测试公共接口和业务规则，而非私有方法的实现细节。

**MAY** 使用反射或包可见性访问内部状态，但需在测试中明确说明原因。

✅ 正确示例：
```java
// 每个测试只验证一个行为
@Test
void shouldCalculateDiscountForVIP() {
    var price = pricingService.calculatePrice(product, CustomerType.VIP);
    assertThat(price).isEqualTo(90.0); // VIP 打 9 折
}

@Test
void shouldThrowExceptionWhenQuantityIsZero() {
    assertThatThrownBy(() -> pricingService.calculatePrice(product, null))
        .isInstanceOf(IllegalArgumentException.class);
}
```

❌ 错误示例：
```java
// 一个测试验证多个行为
@Test
void testEverything() {
    var price = pricingService.calculatePrice(product, VIP);
    assertThat(price).isEqualTo(90.0);
    var discount = pricingService.getDiscount(VIP);
    assertThat(discount).isEqualTo(0.1);
    var name = pricingService.getName();
    assertThat(name).isNotNull();
}
```

---

### R02 — AAA 模式

**MUST** 遵循 Arrange-Act-Assert 结构组织测试代码，保持逻辑清晰。

**SHOULD** 在 Arrange 阶段准备所有前置条件，Act 阶段执行被测操作，Assert 阶段验证结果。

**MAY** 当 Arrange 过长时，使用辅助方法提取数据准备逻辑。

✅ 正确示例：
```java
@Test
void shouldApplyDiscountCorrectly() {
    // Arrange
    var product = new Product("SKU-001", 100.0);
    var customer = new Customer(CustomerType.VIP);

    // Act
    var finalPrice = pricingService.calculatePrice(product, customer);

    // Assert
    assertThat(finalPrice).isEqualTo(90.0);
}
```

❌ 错误示例：
```java
// 混合各阶段，难以理解
@Test
void testPrice() {
    var product = new Product("SKU-001", 100.0);
    var customer = new Customer(CustomerType.VIP);
    var finalPrice = pricingService.calculatePrice(product, customer);
    assertThat(finalPrice).isEqualTo(90.0);
    var discount = pricingService.getDiscount(customer);
    assertThat(discount).isEqualTo(0.1);
}
```

---

### R03 — 命名约定

**MUST** 使用描述性的测试名称，清晰表达测试的意图和预期行为。

**SHOULD** 采用 `should[ExpectedBehavior]_when[Condition]` 格式命名。

**MAY** 对于异常场景使用 `shouldThrow[Exception]_when[Condition]`。

✅ 正确示例：
```java
@Test
void shouldCalculateDiscountForVIPCustomer() { ... }

@Test
void shouldThrowNullPointerException_whenProductIsNull() { ... }

@Test
void shouldReturnOriginalPrice_whenCustomerTypeIsRegular() { ... }
```

❌ 错误示例：
```java
@Test
void test1() { ... }

@Test
void testPricing() { ... }

@Test
void test() { ... }
```

---

### R04 — Mock vs Stub

**MUST** 根据测试目标选择 Mock 或 Stub：Mock 用于验证交互行为，Stub 用于提供预设响应。

**SHOULD** 优先使用 Stub 提供数据，避免过度 Mock 导致测试脆弱。

**MAY** 使用 Spy 部分模拟对象，保留真实行为的同时验证特定调用。

✅ 正确示例：
```java
// Stub — 提供预设响应
@Test
void shouldUseStubResponse() {
    var stubPaymentGateway = stub(responsesTo(
        post("/api/payments").willReturn(okJson(Map.of("status", "SUCCESS")))
    ));
    var result = paymentService.charge(orderId, amount, stubPaymentGateway);
    assertThat(result.getStatus()).isEqualTo("SUCCESS");
}

// Mock — 验证交互
@Test
void shouldCallRepositoryOnCreate() {
    var mockRepo = mock(OrderRepository.class);
    orderService.setRepository(mockRepo);
    orderService.create(order);
    verify(mockRepo).save(order); // 验证保存方法被调用
}
```

❌ 错误示例：
```java
// 过度 Mock，测试通过但无法验证真实行为
@Test
void testWithOverMocking() {
    var mockRepo = mock(OrderRepository.class);
    var mockEventBus = mock(EventBus.class);
    var mockValidator = mock(Validator.class);
    when(mockValidator.validate(any())).thenReturn(true);
    when(mockRepo.save(any())).thenReturn(order);
    // 所有依赖都被 Mock，无法验证真实协作
}
```

---

### R05 — 边界值测试

**MUST** 对输入参数的边界值进行测试，包括最小值、最大值、零值和空值。

**SHOULD** 使用等价类划分和边界值分析法系统化地生成测试用例。

**MAY** 结合参数化测试批量覆盖边界场景。

✅ 正确示例：
```java
@ParameterizedTest
@CsvSource({
    "0, true,   zero quantity should throw",
    "1, true,   minimum valid quantity",
    "999999, true, maximum valid quantity",
    "1000000, false, exceeds limit"
})
void shouldValidateQuantity(int quantity, boolean shouldPass, String description) {
    if (shouldPass) {
        assertDoesNotThrow(() -> service.processQuantity(quantity));
    } else {
        assertThrows(IllegalArgumentException.class, () -> service.processQuantity(quantity));
    }
}
```

❌ 错误示例：
```java
// 只测试正常值，忽略边界情况
@Test
void testQuantity() {
    assertDoesNotThrow(() -> service.processQuantity(50));
}
```

---

### R06 — 测试隔离

**MUST** 确保每个测试独立运行，不受其他测试的影响。

**SHOULD** 使用 `@BeforeEach` / `@AfterEach` 初始化和清理测试状态。

**MAY** 使用随机端口或临时目录避免资源冲突。

✅ 正确示例：
```java
class OrderServiceTest {
    private OrderService service;
    private List<Order> createdOrders;

    @BeforeEach
    void setUp() {
        service = new OrderService(inMemoryRepository);
        createdOrders = new ArrayList<>();
    }

    @AfterEach
    void tearDown() {
        createdOrders.clear();
    }

    @Test
    void shouldCreateOrder() {
        var order = service.create(new OrderRequest(items));
        createdOrders.add(order);
        assertThat(createdOrders).hasSize(1);
    }
}
```

❌ 错误示例：
```java
// 测试间共享状态，顺序敏感
class OrderServiceTest {
    private static List<Order> orders = new ArrayList<>();

    @Test
    void testCreate() {
        var order = service.create(request);
        orders.add(order);
    }

    @Test
    void testFindAll() {
        // 如果 testCreate 先运行，此处包含额外数据
        assertThat(service.findAll()).isEmpty();
    }
}
```

---

### R07 — 参数化测试

**MUST** 对相同逻辑的不同输入组合使用参数化测试，减少重复代码。

**SHOULD** 使用 `@ParameterizedTest` 配合 `@CsvSource`、`@MethodSource` 或 `@ValueSource`。

**MAY** 从外部文件加载复杂测试数据集。

✅ 正确示例：
```java
@ParameterizedTest
@MethodSource("pricingProvider")
void shouldCalculatePriceCorrectly(double originalPrice, double discountRate, double expected) {
    var price = pricingService.applyDiscount(originalPrice, discountRate);
    assertThat(price).isCloseTo(expected, offset(0.01));
}

static Stream<Arguments> pricingProvider() {
    return Stream.of(
        Arguments.of(100.0, 0.1, 90.0),
        Arguments.of(200.0, 0.2, 160.0),
        Arguments.of(50.0, 0.0, 50.0)
    );
}
```

❌ 错误示例：
```java
// 为每个输入写一个独立测试方法
@Test void testPrice1() { ... }
@Test void testPrice2() { ... }
@Test void testPrice3() { ... }
```

---

### R08 — 覆盖率与质量

**MUST** 设定最低行覆盖率阈值（如 80%），并在 CI 中强制执行。

**SHOULD** 关注分支覆盖率和变异测试，而非仅追求行覆盖率数字。

**MAY** 使用 JaCoCo、Istanbul 等工具生成覆盖率报告。

✅ 正确示例：
```xml
<!-- pom.xml 配置 JaCoCo -->
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <configuration>
        <rules>
            <rule>
                <element>BUNDLE</element>
                <limits>
                    <limit>
                        <counter>LINE</counter>
                        <value>COVEREDRATIO</value>
                        <minimum>0.80</minimum>
                    </limit>
                </limits>
            </rule>
        </rules>
    </configuration>
</plugin>
```

❌ 错误示例：
```java
// 低质量测试：仅检查不抛异常
@Test
void testSomething() {
    service.doSomething(); // 没有断言
}
```

---

## Checklist

- [ ] 是否每个测试只验证一个行为？
- [ ] 是否遵循 Arrange-Act-Assert 结构？
- [ ] 是否使用了描述性的测试名称？
- [ ] 是否正确区分了 Mock 和 Stub 的使用场景？
- [ ] 是否覆盖了边界值和异常情况？
- [ ] 是否确保了测试间的独立性？
- [ ] 是否使用了参数化测试减少重复？
- [ ] 是否设置了覆盖率阈值并在 CI 中强制执行？
