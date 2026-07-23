# API-Test（API 测试）

## Overview

API 测试是验证后端接口功能正确性的核心手段，覆盖请求参数校验、响应结构、业务逻辑和异常处理。与 UI 测试相比，API 测试执行更快、更稳定，且能更早发现缺陷。本标准定义了 API 测试的策略、契约测试、数据管理和自动化集成等关键实践。

---

## Rules

### R01 — API 测试策略

**MUST** 为每个 API 端点编写测试用例，覆盖正常路径、边界条件和异常场景。

**SHOULD** 按优先级分层：核心业务 API > 通用 CRUD API > 辅助功能 API。

**MAY** 使用 BDD（行为驱动开发）风格描述测试用例，提升可读性。

✅ 正确示例：
```gherkin
Feature: 创建订单
  Scenario: 用户提交有效订单
    Given 用户已登录
    When POST /api/orders { "items": ["SKU-001"], "amount": 99.9 }
    Then 响应状态码 = 201
    And 响应体包含 { "orderId": "ORD-xxx", "status": "CREATED" }

  Scenario: 订单项为空
    When POST /api/orders { "items": [] }
    Then 响应状态码 = 400
    And 错误消息 = "订单项不能为空"
```

❌ 错误示例：
```java
// 只测成功路径，不测异常情况
@Test
void shouldCreateOrder() {
    var response = given().post("/api/orders", validOrder);
    response.then().statusCode(201);
}
```

---

### R02 — 契约测试（Contract Testing）

**MUST** 在服务提供方和消费方之间建立契约测试，确保接口变更不会破坏现有调用方。

**SHOULD** 使用 Pact 框架定义消费者期望的接口格式，提供方基于契约进行验证。

**MAY** 在 CI 中自动运行契约测试，阻断不兼容的接口变更。

✅ 正确示例：
```java
// 消费者侧定义契约
@PactTestFor(providerName = "order-service")
@Test
void shouldReturnOrder(PactVerificationContext context) {
    context.verifyInteraction();
}

// 提供方侧验证契约
@PactVerifyProvider("order-service")
@Test
void verifyAgainstPact(PactVerificationContext context) {
    context.verifyInteraction();
}
```

❌ 错误示例：
```java
// 无契约保护，接口变更直接导致下游服务崩溃
@Test
void createOrder() {
    orderService.create(order); // 如果返回结构变了，此处静默失败
}
```

---

### R03 — 请求/响应校验

**MUST** 对 API 的输入参数和输出结构进行完整校验，包括类型、范围、必填字段和格式。

**SHOULD** 使用 JSON Schema 或自定义断言器统一校验规则。

**MAY** 生成 OpenAPI Spec 并自动派生校验代码。

✅ 正确示例：
```java
@Test
void validateRequestFields() {
    given().body(request)
        .when().post("/api/orders")
        .then()
        .body("errorMessage", equalTo("amount 必须大于 0"))
        .body("errorCode", equalTo("INVALID_AMOUNT"));
}
```

❌ 错误示例：
```java
// 只检查 HTTP 状态码，忽略响应体内容
@Test
void testCreateOrder() {
    given().post("/api/orders", request).then().statusCode(201);
}
```

---

### R04 — 认证测试

**MUST** 测试所有受保护的 API 在未认证、权限不足和过期令牌场景下的行为。

**SHOULD** 模拟不同角色的用户访问，验证权限控制的正确性。

**MAY** 使用 JWT Decoder 工具解析和构造测试令牌。

✅ 正确示例：
```java
@Test
void shouldRejectUnauthorizedAccess() {
    given().post("/api/orders")
        .then().statusCode(401)
        .and().header("WWW-Authenticate", containsString("Bearer"));
}

@Test
void shouldRejectInsufficientPermission() {
    given().header("Authorization", "Bearer " + viewerToken)
        .delete("/api/orders/{id}", orderId)
        .then().statusCode(403);
}
```

❌ 错误示例：
```java
// 跳过认证测试，认为框架会自动处理
@Test
void testSecurity() {
    // 未测试
}
```

---

### R05 — 参数化 API 测试

**MUST** 对同一 API 的不同参数组合使用参数化测试，减少重复代码。

**SHOULD** 将测试数据与测试逻辑分离，便于维护。

**MAY** 从外部文件（CSV、JSON、YAML）加载测试数据集。

✅ 正确示例：
```java
@ParameterizedTest
@CsvSource({
    "0, 400, INVALID_AMOUNT",
    "-1, 400, INVALID_AMOUNT",
    "999999999, 400, AMOUNT_EXCEEDS_LIMIT"
})
void shouldValidateAmount(double amount, int expectedStatus, String expectedCode) {
    given().body(Map.of("amount", amount))
        .when().post("/api/orders")
        .then().statusCode(expectedStatus)
        .and().body("errorCode", equalTo(expectedCode));
}
```

❌ 错误示例：
```java
// 为每个参数值写一个独立测试方法
@Test void testZeroAmount() { ... }
@Test void testNegativeAmount() { ... }
@Test void testExceedLimit() { ... }
```

---

### R06 — API 测试数据管理

**MUST** 每个测试用例使用独立的测试数据，避免测试间相互干扰。

**SHOULD** 在测试结束后清理产生的数据，保持环境干净。

**MAY** 使用 Builder 模式或工厂方法构造测试数据。

✅ 正确示例：
```java
class OrderApiTest {
    private String createdOrderId;

    @AfterEach
    void cleanup() {
        if (createdOrderId != null) {
            orderApi.delete(createdOrderId);
        }
    }

    @Test
    void shouldCreateOrder() {
        var order = OrderDataBuilder.defaultOrder().build();
        var response = orderApi.create(order);
        createdOrderId = response.getOrderId();
        assertThat(response.getStatus()).isEqualTo("CREATED");
    }
}
```

❌ 错误示例：
```java
// 硬编码 ID，可能与其他测试冲突
@Test
void testOrder() {
    given().body("{\"orderId\": \"TEST-001\"}").when().post("/api/orders");
}
```

---

### R07 — API 性能测试

**MUST** 对高流量 API 进行性能基准测试，记录响应时间和吞吐量基线。

**SHOULD** 使用 JMeter、k6 或 Gatling 进行负载测试，验证系统在目标 QPS 下的表现。

**MAY** 设置性能阈值并在 CI 中自动拦截退化。

✅ 正确示例：
```javascript
// k6 脚本
export default function () {
    http.post('http://localhost:8080/api/orders', JSON.stringify({
        items: ['SKU-001'], amount: 99.9
    }, { headers: { 'Content-Type': 'application/json' } }));
}

// 阈值配置
const thresholds = {
    'http_req_duration': ['p(95)<500ms']
};
```

❌ 错误示例：
```java
// 仅做功能测试，从未验证性能
@Test
void testPerformance() {
    // 没有实际测量延迟
}
```

---

### R08 — API 测试自动化集成

**MUST** 将 API 测试纳入 CI/CD 流水线，每次代码变更自动执行。

**SHOULD** 区分快速冒烟测试（< 2 分钟）和完整回归测试（< 10 分钟），分别在不同阶段触发。

**MAY** 在 PR 合并前阻止失败的测试，强制修复后才能合入。

✅ 正确示例：
```yaml
# .github/workflows/api-test.yml
jobs:
  api-smoke-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: mvn test -Dtest=*SmokeTest
  api-regression-test:
    needs: api-smoke-test
    runs-on: ubuntu-latest
    steps:
      - run: mvn verify
```

❌ 错误示例：
```bash
# 手动运行测试，容易遗漏
mvn test
```

---

## Checklist

- [ ] 是否覆盖了正常路径、边界条件和异常场景？
- [ ] 是否建立了消费者与提供方的契约测试？
- [ ] 是否对请求和响应进行了完整校验？
- [ ] 是否测试了认证和权限控制？
- [ ] 是否使用了参数化测试减少重复？
- [ ] 是否实现了测试数据的隔离与清理？
- [ ] 是否对高流量 API 进行了性能测试？
- [ ] 是否已将 API 测试集成到 CI/CD？
