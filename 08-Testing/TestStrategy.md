# Test Strategy

## Overview

测试策略规范，涵盖测试金字塔、单元测试、集成测试、E2E 测试、测试数据管理、Mock 与 Stub、性能测试、安全测试、测试自动化和测试文化。适用于所有项目建立系统化、可维护的测试体系。

---

## Rules

### R01 — 测试金字塔（Test Pyramid）

**MUST** — 测试层次分布必须遵循金字塔模型，确保各层级测试比例合理：

| 层级 | 占比目标 | 执行速度 | 成本 | 职责 |
|------|---------|---------|------|------|
| 单元测试 | 70% | 毫秒级 | 低 | 验证单个函数 / 方法逻辑 |
| 集成测试 | 20% | 秒级 | 中 | 验证模块间协作与数据流 |
| E2E 测试 | 10% | 分钟级 | 高 | 验证完整业务流程 |

**覆盖率目标：**

| 指标 | 最低要求 | 推荐值 |
|------|---------|--------|
| 行覆盖率（Line Coverage） | ≥ 80% | ≥ 90% |
| 分支覆盖率（Branch Coverage） | ≥ 70% | ≥ 85% |
| 变更覆盖率（Mutation Coverage） | ≥ 60% | ≥ 70% |

**投资回报原则：**

- 单元测试投入产出比最高，应作为测试基础
- E2E 测试覆盖关键路径即可，避免过度依赖
- 每新增一行业务代码，至少新增一行测试代码

✅ Correct:

```java
// 单元测试：快速、隔离、覆盖核心逻辑
@Test
void shouldCalculateDiscount_whenOrderAmountExceedsThreshold() {
    Order order = new Order(BigDecimal.valueOf(120));
    DiscountCalculator calculator = new DiscountCalculator();
    assertThat(calculator.calculate(order)).isEqualByComparingTo(BigDecimal.valueOf(12));
}

// 集成测试：验证数据库交互
@SpringBootTest
@Transactional
class OrderRepositoryIntegrationTest {
    @Autowired
    private OrderRepository repository;

    @Test
    void shouldSaveAndRetrieveOrder() {
        Order saved = repository.save(new Order("ORD-001", BigDecimal.TEN));
        Order found = repository.findById(saved.getId()).orElseThrow();
        assertThat(found.getOrderNo()).isEqualTo("ORD-001");
    }
}

// E2E 测试：验证关键用户流程
@Test
void userShouldCompletePurchaseFlow() {
    page.goTo("/products");
    page.addToCart("product-123");
    page.checkout();
    page.fillShippingInfo();
    page.submitPayment();
    assertThat(page.orderConfirmationIsDisplayed()).isTrue();
}
```

```python
# pytest 配置：按金字塔分层组织测试
# conftest.py
def pytest_configure(config):
    config.addinivalue_line("markers", "unit: Unit tests")
    config.addinivalue_line("markers", "integration: Integration tests")
    config.addinivalue_line("markers", "e2e: End-to-end tests")

# pyproject.toml
# [tool.pytest.ini_options]
# markers = ["unit", "integration", "e2e"]
# testpaths = ["tests"]
# addopts = "-m unit"  # CI 默认只跑单元测试
```

❌ Wrong:

```java
// 反模式：大量 E2E 测试，少量单元测试（倒金字塔）
@Test
void shouldHandleEveryPossibleUserInteraction() {
    // 一个包含 200+ 步骤的巨型 E2E 测试
    // 脆弱、缓慢、难以维护
}

// 反模式：跳过单元测试，直接在集成测试中验证一切
@SpringBootTest
class OrderServiceTest {
    @Test
    void shouldCalculateDiscount() {
        // 本应是纯逻辑单元测试，却启动了整个 Spring 上下文
    }
}
```

**CI 门禁配置建议：**

| 阶段 | 触发条件 | 执行内容 | 通过标准 |
|------|---------|---------|---------|
| PR 提交 | push / PR | 单元测试 + 静态分析 | 全部通过 |
| 合并后 | merge to main | 集成测试 | 全部通过 |
| 发布前 | release tag | E2E 测试 + 性能基线 | 全部通过 |

---

### R02 — 单元测试规范（Unit Test）

**MUST** — 单元测试必须遵循以下规范：

**AAA 模式（Arrange-Act-Assert）：**

每个测试方法必须包含三个清晰阶段：

1. Arrange：准备测试数据和前置条件
2. Act：执行被测操作
3. Assert：验证结果

**命名规范：**

```
should[ExpectedBehavior]_when[Condition]
```

或使用自然语言描述：

```
[MethodName]_[Scenario]_[ExpectedResult]
```

✅ Correct:

```java
@Test
void shouldApplyTenPercentDiscount_whenOrderAmountIsOverOneHundred() {
    // Arrange
    Order order = new Order(BigDecimal.valueOf(150));
    DiscountCalculator calculator = new DiscountCalculator(0.10);

    // Act
    BigDecimal discount = calculator.calculate(order);

    // Assert
    assertThat(discount).isEqualByComparingTo(BigDecimal.valueOf(15));
}

@Test
void shouldThrowIllegalArgumentException_whenOrderAmountIsNegative() {
    assertThatThrownBy(() -> new Order(BigDecimal.valueOf(-1)))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("amount must be positive");
}
```

```python
def test_should_apply_ten_percent_discount_when_order_amount_over_one_hundred():
    # Arrange
    order = Order(amount=Decimal("150"))
    calculator = DiscountCalculator(rate=Decimal("0.10"))

    # Act
    discount = calculator.calculate(order)

    # Assert
    assert discount == Decimal("15")

def test_should_raise_validation_error_when_order_amount_is_negative():
    with pytest.raises(ValueError, match="amount must be positive"):
        Order(amount=Decimal("-1"))
```

❌ Wrong:

```java
@Test
void test1() {
    Order o = new Order(new BigDecimal("150"));
    BigDecimal d = new DiscountCalculator().calculate(o);
    assertTrue(d.compareTo(new BigDecimal("15")) == 0);
}

@Test
void testDiscount() {
    // 缺少 Arrange 阶段，测试意图不清晰
    var result = service.doSomething(input);
    assertEquals(expected, result);
}
```

**边界值测试：**

| 场景 | 测试值 | 说明 |
|------|--------|------|
| 正常值 | 100 | 典型输入 |
| 边界值 | 99, 100, 101 | 阈值附近 |
| 极端值 | 0, -1, Integer.MAX_VALUE | 超出范围 |
| 空值 | null | 可选参数 |
| 空集合 | empty list | 集合参数 |

**测试隔离原则：**

- 每个测试必须独立运行，不依赖其他测试的执行顺序
- 测试之间不得共享可变状态
- 使用 @BeforeEach / setup 重置状态
- 外部依赖必须 Mock（见 R06）

---

### R03 — 集成测试规范（Integration Test）

**MUST** — 集成测试必须遵循以下规范：

**数据库测试：**

- 使用内存数据库（H2 / SQLite）或 Testcontainers
- 每个测试后必须清理数据（@Transactional 回滚或 TRUNCATE）
- 禁止连接生产数据库或开发共享数据库

**API 测试：**

- 使用 MockMvc / TestRestTemplate / httpx.TestClient
- 验证 HTTP 状态码、响应体结构、校验逻辑
- 不依赖真实外部服务

**Testcontainers 优先：**

对于需要真实中间件的场景（Kafka、Redis、PostgreSQL），必须使用 Testcontainers。

✅ Correct:

```java
// Java：使用 H2 内存数据库 + @Transactional 自动回滚
@SpringBootTest
@Transactional
class OrderServiceIntegrationTest {
    @Autowired
    private OrderService orderService;

    @Autowired
    private OrderRepository orderRepository;

    @Test
    void shouldCreateOrderAndPersistToDatabase() {
        CreateOrderRequest request = new CreateOrderRequest("ORD-001", BigDecimal.valueOf(100));
        Order order = orderService.create(request);

        assertThat(orderRepository.findById(order.getId())).isPresent();
        assertThat(order.getStatus()).isEqualTo(OrderStatus.CREATED);
    }
}

// Java：使用 Testcontainers 启动真实 PostgreSQL
@SpringBootTest
@Testcontainers
class OrderRepositoryWithRealDbTest {
    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Test
    void shouldUseRealPostgresFeatures() {
        // 可以测试 PostgreSQL 特有的 JSONB、全文搜索等特性
    }
}

// Python：使用 SQLite 内存数据库进行集成测试
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()

def test_should_persist_order_to_database(db_session):
    order = Order(order_no="ORD-001", amount=Decimal("100"))
    db_session.add(order)
    db_session.commit()

    found = db_session.query(Order).filter_by(order_no="ORD-001").first()
    assert found is not None
    assert found.status == OrderStatus.CREATED
```

```python
# Python：使用 Testcontainers 启动真实 PostgreSQL
import pytest
from testcontainers.postgres import PostgresContainer

@pytest.fixture(scope="session")
def postgres_db():
    with PostgresContainer("postgres:16-alpine") as postgres:
        yield postgres.get_connection_url()

def test_with_real_postgres(postgres_db):
    # 测试 PostgreSQL 特有功能
    engine = create_engine(postgres_db)
    ...
```

❌ Wrong:

```java
// 反模式：连接开发共享数据库
@SpringBootTest
class OrderRepositoryTest {
    @Autowired
    private OrderRepository repository;

    @Test
    void shouldSaveOrder() {
        // 污染开发数据库，测试不隔离
        repository.save(new Order());
    }
}

// 反模式：硬编码数据库连接信息
@Test
void shouldConnectToDatabase() {
    Connection conn = DriverManager.getConnection(
        "jdbc:postgresql://prod-db.internal:5432/mydb", "admin", "password");
}
```

**外部服务 Mock 策略：**

| 场景 | 策略 | 工具 |
|------|------|------|
| 支付网关 | Mock 响应 | WireMock / MockServer |
| 邮件服务 | Stub 行为 | Mockito / unittest.mock |
| 第三方 API | Record & Replay | VCR / WireMock |
| 消息队列 | Embedded Broker | embedded-kafka / RedisDocker |

---

### R04 — E2E 测试规范（End-to-End Test）

**MUST** — E2E 测试必须遵循以下规范：

**框架选择：**

| 框架 | 适用场景 | 优势 |
|------|---------|------|
| Playwright | Web 应用首选 | 跨浏览器、自动等待、网络拦截 |
| Cypress | 前端团队主导 | 开发者体验好、时间旅行调试 |
| Selenium | 遗留项目兼容 | 生态成熟、语言支持广 |

**Page Object Model（POM）：**

- 每个页面封装为一个类
- 页面元素定位集中管理
- 页面操作语义化
- 减少测试脚本中的 CSS 选择器散落

✅ Correct:

```typescript
// Page Object：登录页
export class LoginPage {
  readonly emailInput = page.locator('#email');
  readonly passwordInput = page.locator('#password');
  readonly submitButton = page.locator('button[type="submit"]');
  readonly errorMessage = page.locator('.error-message');

  async navigate() {
    await page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async getErrorMessage(): Promise<string> {
    return await this.errorMessage.textContent();
  }
}

// E2E 测试使用 POM
import { LoginPage } from './pages/login-page';

test('user should see error on invalid login', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.navigate();
  await loginPage.login('invalid@example.com', 'wrong-password');
  await expect(loginPage.errorMessage).toBeVisible();
});
```

```python
# Python：使用 Playwright Page Object
from playwright.sync_api import Page

class LoginPage:
    def __init__(self, page: Page):
        self.page = page
        self.email_input = page.locator("#email")
        self.password_input = page.locator("#password")
        self.submit_button = page.locator("button[type='submit']")
        self.error_message = page.locator(".error-message")

    def navigate(self):
        self.page.goto("/login")

    def login(self, email: str, password: str):
        self.email_input.fill(email)
        self.password_input.fill(password)
        self.submit_button.click()

    def get_error_message(self) -> str:
        return self.error_message.text_content()

# 测试
def test_invalid_login(page: Page):
    login_page = LoginPage(page)
    login_page.navigate()
    login_page.login("invalid@example.com", "wrong-password")
    assert login_page.error_message.is_visible()
```

❌ Wrong:

```typescript
// 反模式：测试脚本中散落 CSS 选择器
test('login test', async ({ page }) => {
  await page.goto('/login');
  await page.fill('#email', 'user@example.com');
  await page.fill('#password', 'secret');
  await page.click('button[type="submit"]');
  await expect(page.locator('.error')).toBeVisible();
});

// 反模式：硬编码环境 URL
await page.goto('https://staging.example.com/login');
```

**测试数据管理：**

- 使用 Fixture 创建初始数据（见 R05）
- 测试结束后清理数据
- 避免硬编码测试账号和密码

**环境管理：**

| 环境 | 用途 | 数据来源 |
|------|------|---------|
| Dev | 开发自测 | 本地种子数据 |
| Staging | 预发验证 | 生产脱敏数据镜像 |
| E2E Cloud | 并行执行 | 专用测试租户 |

---

### R05 — 测试数据管理（Test Data Management）

**MUST** — 测试数据管理必须遵循以下规范：

**Factory 模式：**

使用 Factory 创建测试对象，避免重复的构造逻辑。

✅ Correct:

```java
// Java：使用 Factory 模式
public class OrderFactory {
    public static Order createDefaultOrder() {
        return new Order("ORD-001", BigDecimal.valueOf(100), OrderStatus.CREATED);
    }

    public static Order createOrder(String orderNo, BigDecimal amount) {
        return new Order(orderNo, amount, OrderStatus.CREATED);
    }

    public static Order createOrderWithStatus(OrderStatus status) {
        return new Order("ORD-001", BigDecimal.valueOf(100), status);
    }
}

// 测试中使用
@Test
void shouldProcessPaidOrder() {
    Order order = OrderFactory.createOrderWithStatus(OrderStatus.PAID);
    // ...
}
```

```python
# Python：使用 Factory 模式
from dataclasses import dataclass
from typing import Optional

@dataclass
class OrderFactory:
    order_no: str = "ORD-001"
    amount: Decimal = Decimal("100")
    status: OrderStatus = OrderStatus.CREATED

    def create(self) -> Order:
        return Order(
            order_no=self.order_no,
            amount=self.amount,
            status=self.status,
        )

    @classmethod
    def paid_order(cls) -> "OrderFactory":
        return cls(status=OrderStatus.PAID)

# 测试中使用
def test_should_process_paid_order():
    order = OrderFactory.paid_order().create()
    ...
```

❌ Wrong:

```java
// 反模式：每次手动构造测试对象
@Test
void shouldProcessOrder() {
    Order order = new Order();
    order.setOrderNo("ORD-001");
    order.setAmount(new BigDecimal("100"));
    order.setStatus(OrderStatus.PAID);
    // 如果 Order 有 10 个字段，每次都要写一遍
}
```

**Fixture 设计：**

| 类型 | 用途 | 生命周期 |
|------|------|---------|
| Session Fixture | 全局共享数据（如管理员账号） | 整个测试套件 |
| Class Fixture | 类级别共享数据 | 每个测试类 |
| Method Fixture | 方法级别数据 | 每个测试方法 |

✅ Correct:

```python
# pytest Fixture 示例
import pytest

@pytest.fixture(scope="session")
def admin_user():
    return User(id=1, role="admin", name="Admin User")

@pytest.fixture(scope="class")
def sample_orders():
    return [
        OrderFactory.create_order("ORD-001", Decimal("100")),
        OrderFactory.create_order("ORD-002", Decimal("200")),
    ]

@pytest.fixture
def fresh_order():
    return OrderFactory.create_default_order()

def test_admin_can_view_orders(admin_user, sample_orders):
    assert admin_user.role == "admin"
    assert len(sample_orders) == 2

def test_order_has_default_status(fresh_order):
    assert fresh_order.status == OrderStatus.CREATED
```

**数据清理策略：**

| 策略 | 适用场景 | 实现方式 |
|------|---------|---------|
| 事务回滚 | 单元测试 / 集成测试 | @Transactional |
| TRUNCATE | 集成测试 | @AfterEach 执行 TRUNCATE |
| Docker 容器 | Testcontainers | 容器销毁即清理 |
| 唯一标识 | E2E 测试 | 使用 UUID 避免冲突 |

**数据隔离原则：**

- 每个测试使用独立的数据集
- 并发测试时使用唯一标识（UUID / 时间戳）
- 禁止多个测试共享同一条记录并修改它

---

### R06 — Mock 与 Stub 规范（Mock vs Stub）

**MUST** — Mock 与 Stub 的使用必须遵循以下规范：

**何时使用 Mock：**

- 验证某个交互是否发生（方法是否被调用、调用次数、调用参数）
- 验证系统间的协作关系
- 隔离外部依赖以加速测试

**何时使用 Stub：**

- 提供预设的返回值，不关心是否被调用
- 替代不可用的外部服务
- 模拟异常场景

**Mock 滥用检测：**

| 信号 | 问题 | 解决 |
|------|------|------|
| Mock 数量超过 3 个 | 测试过于复杂 | 重构为集成测试 |
| Mock 内部方法 | 测试粒度过细 | 改为测试公共接口 |
| Mock 私有方法 | 破坏封装 | 重新设计测试策略 |
| 断言 Mock 调用而非业务结果 | 测试无意义 | 关注最终输出 |

✅ Correct:

```java
// Mock：验证交互行为
@Test
void shouldSendNotification_whenOrderIsCreated() {
    // Arrange
    Order order = OrderFactory.createDefaultOrder();
    when(notificationService.send(any(Notification.class))).thenReturn(true);

    // Act
    orderService.create(order);

    // Assert：验证通知服务被调用
    verify(notificationService, times(1)).send(argThat(
        n -> n.getType() == NotificationType.ORDER_CREATED
    ));
}

// Stub：提供预设返回值
@Test
void shouldReturnDiscount_whenPaymentServiceReturnsSuccess() {
    // Arrange
    stub(paymentService.process(any())).toReturn(PaymentResult.success());

    // Act
    PaymentResult result = paymentService.process(new PaymentRequest());

    // Assert
    assertThat(result.isSuccess()).isTrue();
}
```

```python
# Python：使用 unittest.mock
from unittest.mock import MagicMock, patch

def test_should_send_notification_when_order_created():
    # Arrange
    notification_service = MagicMock()
    notification_service.send.return_value = True

    order = OrderFactory.create_default_order()

    # Act
    order_service.create(order, notification_service=notification_service)

    # Assert：验证通知服务被调用
    notification_service.send.assert_called_once()
    call_args = notification_service.send.call_args[0][0]
    assert call_args.type == NotificationType.ORDER_CREATED

def test_should_return_discount_when_payment_succeeds():
    # Stub：提供预设返回值
    payment_service = MagicMock()
    payment_service.process.return_value = PaymentResult.success()

    result = payment_service.process(PaymentRequest())
    assert result.is_success()
```

❌ Wrong:

```java
// 反模式：Mock 过多，测试失去意义
@Test
void shouldCreateOrder() {
    when(repository.save(any())).thenReturn(order);
    when(eventPublisher.publishEvent(any())).thenReturn(true);
    when(logger.log(any())).thenReturn(null);
    when(cache.put(any(), any())).thenReturn(null);

    orderService.create(request);

    verify(repository).save(any());
    verify(eventPublisher).publishEvent(any());
    verify(logger).log(any());
    verify(cache).put(any(), any());
}

// 反模式：Mock 私有方法
@Test
void shouldProcessOrder() {
    spyOrderService = spy(orderService);
    doReturn(true).when(spyOrderService).validateInternal(any()); // 不应 Mock 私有方法
    spyOrderService.process(order);
}
```

**契约测试（Contract Testing）：**

当服务间存在 API 依赖时，使用 Pact 进行消费者驱动的契约测试：

```java
// 消费者端：定义期望
@PactTestFor(providerName = "order-service")
@Test
void shouldGetOrder(PactVerificationContext context) {
    context.verifyInteraction();
}

// Provider端：验证实际服务是否符合契约
// 确保 API 变更不会意外破坏消费者
```

---

### R07 — 性能测试（Performance Testing）

**MUST** — 性能测试必须遵循以下规范：

**测试类型：**

| 类型 | 目的 | 工具 | 触发时机 |
|------|------|------|---------|
| 基准测试（Benchmark） | 测量单次操作耗时 | JMH / benchmark | 开发阶段 |
| 负载测试（Load Test） | 验证目标并发下的性能 | k6 / JMeter | 发布前 |
| 压力测试（Stress Test） | 找到系统崩溃点 | k6 / Gatling | 容量规划 |
| 耐久测试（Soak Test） | 检测内存泄漏 | JMeter | 长时间运行 |

**性能基线管理：**

- 每次发布必须更新性能基线
- 基线存储在版本控制中（JSON / YAML）
- CI 中对比当前指标与基线，偏差超过阈值则告警

✅ Correct:

```yaml
# performance-baseline.yaml
version: "1.0"
lastUpdated: "2025-01-15"
endpoints:
  - path: "/api/v1/orders"
    metrics:
      p50LatencyMs: 50
      p95LatencyMs: 150
      p99LatencyMs: 300
      throughputRps: 1000
      errorRatePercent: 0.1
  - path: "/api/v1/users/search"
    metrics:
      p50LatencyMs: 80
      p95LatencyMs: 250
      p99LatencyMs: 500
      throughputRps: 500
      errorRatePercent: 0.5
```

```javascript
// k6 负载测试脚本
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 100 },   // 逐步增加到 100 并发
    { duration: '1m', target: 100 },    // 保持 100 并发
    { duration: '30s', target: 200 },   // 增加到 200 并发
    { duration: '1m', target: 200 },    // 保持 200 并发
    { duration: '30s', rampTo: 0 },     // 逐步降载
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],   // 95% 请求 < 500ms
    http_req_failed: ['rate<0.01'],     // 错误率 < 1%
  },
};

export default function () {
  const res = http.get(`${__ENV.BASE_URL}/api/v1/orders?page=1&size=20`, {
    headers: { 'Authorization': `Bearer ${__ENV.TOKEN}` },
  });
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
```

```java
// JMH 微基准测试
@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.MILLISECONDS)
@State(Scope.Thread)
public class DiscountCalculatorBenchmark {
    private DiscountCalculator calculator;
    private Order order;

    @Setup
    public void setup() {
        calculator = new DiscountCalculator(0.10);
        order = new Order(BigDecimal.valueOf(100));
    }

    @Benchmark
    public BigDecimal calculateDiscount() {
        return calculator.calculate(order);
    }
}
```

❌ Wrong:

```javascript
// 反模式：没有性能基线，无法判断是否退化
// 反模式：阈值设置不合理（过松或过紧）
export const options = {
  thresholds: {
    http_req_duration: ['p(95)<10000'], // 过于宽松，无意义
  },
};
```

**CI 集成：**

- **MUST** — 每次发布前执行负载测试并与基线对比
- **SHOULD** — 夜间定时执行全量性能回归
- **MAY** — 使用 Grafana + Prometheus 实时监控性能趋势

---

### R08 — 安全测试（Security Testing）

**MUST** — 安全测试必须遵循以下规范：

**测试类型矩阵：**

| 类型 | 缩写 | 发现什么 | 执行时机 | 工具 |
|------|------|---------|---------|------|
| 静态应用安全测试 | SAST | 代码漏洞 | CI / PR | SonarQube / Semgrep |
| 动态应用安全测试 | DAST | 运行时漏洞 | 发布前 | OWASP ZAP / Burp Suite |
| 依赖扫描 | SCA | 第三方库漏洞 | CI / 每日 | Snyk / Trivy |
| 渗透测试 | Pentest | 组合攻击面 | 季度 / 上线前 | 人工 + 工具 |

**安全基线检查项：**

| 类别 | 检查项 | 严重级别 |
|------|--------|---------|
| 认证 | 弱密码策略、Token 过期、MFA | Critical |
| 授权 | IDOR、越权访问、水平越权 | High |
| 注入 | SQL 注入、XSS、命令注入 | Critical |
| 加密 | 明文传输、弱算法、密钥泄露 | High |
| 配置 | 调试模式开启、目录遍历、CORS 过宽 | Medium |
| 依赖 | 已知 CVE、未维护组件 | High |

✅ Correct:

```yaml
# .github/workflows/security-scan.yml
name: Security Scan
on: [push, pull_request]
jobs:
  sast:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/owasp-top-ten
            p/java
            p/sql-injection

  sca:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Snyk
        uses: snyk/actions/java@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        continue-on-error: true  # 仅告警，不阻断构建

  trivy-image:
    runs-on: ubuntu-latest
    steps:
      - name: Scan container image
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ env.REGISTRY }}/myapp:${{ github.sha }}
          severity: CRITICAL,HIGH
          exit-code: 1  # Critical/High 漏洞阻断构建
```

```bash
# Semgrep 规则示例：检测 SQL 注入
rules:
  - id: java-sql-injection
    patterns:
      - pattern: $STMT.executeQuery($QUERY)
      - pattern-not: $STMT.prepareStatement($QUERY)
    message: "Potential SQL injection: use PreparedStatement instead"
    languages: [java]
    severity: ERROR
```

❌ Wrong:

```yaml
# 反模式：安全扫描仅在手动触发时执行
# 反模式：忽略 Critical 漏洞继续部署
# 反模式：将安全扫描 token 硬编码在代码中
jobs:
  security-scan:
    if: false  # 永远不执行
```

**安全测试频率：**

| 频率 | 活动 | 负责人 |
|------|------|--------|
| 每次 PR | SAST + 依赖扫描 | CI 自动 |
| 每周 | DAST 扫描 staging | 安全团队 |
| 每月 | 依赖升级 + SBOM 更新 | 开发团队 |
| 每季度 | 外部渗透测试 | 第三方 |
| 上线前 | 全面安全评审 | 安全委员会 |

---

### R09 — 测试自动化（Test Automation）

**MUST** — 测试自动化必须遵循以下规范：

**CI 门禁：**

- PR 合并前必须通过所有单元测试和静态分析
- 集成测试在合并后自动触发
- E2E 测试在 Release Tag 时触发

**失败重试策略：**

| 策略 | 适用场景 | 最大重试次数 |
|------|---------|------------|
| 指数退避 | Flaky 测试 | 3 次 |
| 立即重试 | 网络超时 | 2 次 |
| 不重稳 | 业务逻辑断言 | 0 次 |

**Flaky 测试处理流程：**

1. 识别：CI 中标记不稳定测试（连续失败但单独运行成功）
2. 隔离：将 Flaky 测试移至独立 Job，不阻塞主流程
3. 修复：分析根因（竞态条件、时序依赖、数据污染）
4. 验证：确认修复后恢复至主流程
5. 预防：添加资源隔离、显式等待、固定随机种子

✅ Correct:

```yaml
# .github/workflows/ci.yml
name: CI
on: [pull_request]
jobs:
  unit-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run unit tests
        run: ./mvnw test -pl src/main/java -Dtest="*UnitTest"
      - name: Check coverage
        run: ./mvnw jacoco:check  # 覆盖率不达标则失败

  integration-test:
    needs: unit-test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run integration tests
        run: ./mvnw verify -DskipUnitTests -Dit.test="*IntegrationTest"

  e2e-test:
    needs: integration-test
    if: startsWith(github.ref, 'refs/tags/')  # 仅在发布标签时执行
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run E2E tests
        run: npx playwright test --project=chromium
```

```python
# pytest 配置：重试与 Flaky 标记
# pyproject.toml
# [tool.pytest.ini_options]
# markers = [
#     "flaky: marks tests that are known to be flaky (deselect with '-m \"not flaky\"')",
# ]
# addopts = "-m flaky --reruns 2 --reruns-delay 1"

import pytest

@pytest.mark.flaky(reruns=3, reruns_delay=2)
def test_may_be_flaky_due_to_timing():
    # 显式等待替代固定延迟
    element = page.locator(".dynamic-content")
    element.wait_for(state="visible", timeout=5000)
    assert element.is_visible()
```

❌ Wrong:

```yaml
# 反模式：CI 中没有测试门禁
# 反模式：所有测试串行执行，耗时过长
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build only
        run: ./mvnw package  # 没有测试步骤
```

**测试报告：**

- **MUST** — 测试结果必须生成结构化报告（JUnit XML / Allure）
- **SHOULD** — 报告包含截图、视频、Trace 信息（E2E 测试）
- **MAY** — 集成 Allure / ReportPortal 展示趋势图

---

### R10 — 测试文化（Test Culture）

**MUST** — 团队测试文化必须遵循以下规范：

**TDD 实践：**

- **RED**：先写失败的测试，确认测试能捕获缺陷
- **GREED**：编写最小代码使测试通过
- **REFACTOR**：重构代码，保持测试通过

**Code Review 测试检查清单：**

| 检查项 | 必须 | 说明 |
|--------|------|------|
| 新代码是否有对应测试 | 是 | 无测试不合并 |
| 测试是否覆盖边界条件 | 是 | 正常路径 + 异常路径 |
| 测试是否独立可运行 | 是 | 不依赖执行顺序 |
| Mock 是否合理 | 是 | 不超过 3 个 Mock |
| 测试命名是否清晰 | 是 | 读名称可知预期行为 |
| 覆盖率是否达标 | 是 | 行覆盖 ≥ 80%，分支 ≥ 70% |

**测试覆盖率 vs 测试质量：**

| 误区 | 真相 |
|------|------|
| 覆盖率越高越好 | 覆盖率是必要条件，非充分条件 |
| 100% 覆盖率保证无 bug | 高覆盖率可能只是测试了显而易见的逻辑 |
| 测试数量代表质量 | 10 个有价值的测试胜过 100 个空洞测试 |
| 测试拖慢开发速度 | 测试减少调试时间，长期提升效率 |

✅ Correct:

```java
// TDD 示例：先写测试，再写实现
// Step 1: RED — 测试失败
@Test
void shouldValidateEmailFormat() {
    assertThatThrownBy(() -> User.create("invalid-email", "password"))
        .isInstanceOf(ValidationException.class);
}

// Step 2: GREED — 最小实现让测试通过
public static User create(String email, String password) {
    if (!email.contains("@")) {
        throw new ValidationException("Invalid email");
    }
    return new User(email, password);
}

// Step 3: REFACTOR — 提取验证逻辑
private static boolean isValidEmail(String email) {
    return email != null && email.contains("@");
}
```

```python
# TDD 示例：Python
def test_should_validate_email_format():
    """Step 1: RED — 测试应该失败"""
    with pytest.raises(ValidationException, match="Invalid email"):
        User.create("invalid-email", "password")

# Step 2: GREED — 最小实现
class User:
    @staticmethod
    def create(email: str, password: str) -> "User":
        if "@" not in email:
            raise ValidationException("Invalid email")
        return User(email, password)

# Step 3: REFACTOR — 提取验证逻辑
class EmailValidator:
    @staticmethod
    def validate(email: str) -> bool:
        return "@" in email
```

❌ Wrong:

```java
// 反模式：先写代码再补测试（且只测正常路径）
public class OrderService {
    public Order create(CreateOrderRequest request) {
        return repository.save(new Order(request.getOrderNo(), request.getAmount()));
    }
}

// 事后补的测试，只测了 happy path
@Test
void shouldCreateOrder() {
    Order order = service.create(new CreateOrderRequest("ORD-001", BigDecimal.TEN));
    assertThat(order.getOrderNo()).isEqualTo("ORD-001");
}
```

**测试左移（Shift-Left Testing）：**

| 阶段 | 活动 | 参与方 |
|------|------|--------|
| 需求评审 | 验收标准转化为测试用例 | QA + 产品 |
| 设计评审 | 架构风险评估、测试策略制定 | QA + 架构师 |
| 编码阶段 | TDD、单元测试、代码审查 | 开发 |
| 集成阶段 | 自动化集成测试、API 契约测试 | 开发 + QA |
| 发布阶段 | E2E 测试、性能基线、安全扫描 | QA + 运维 |

---

## Checklist

- [ ] 测试金字塔比例合理：单元 70%、集成 20%、E2E 10%
- [ ] 行覆盖率 ≥ 80%，分支覆盖率 ≥ 70%
- [ ] 单元测试遵循 AAA 模式，命名清晰表达意图
- [ ] 单元测试覆盖边界值、空值、异常路径
- [ ] 集成测试使用内存数据库或 Testcontainers，禁止连接生产库
- [ ] 外部服务通过 Mock / Stub 隔离，不依赖真实环境
- [ ] E2E 测试使用 Page Object Model，避免选择器散落
- [ ] 测试数据使用 Factory 模式创建，测试后清理
- [ ] Mock 不超过 3 个，不 Mock 私有方法，不断言 Mock 调用代替业务结果
- [ ] 性能测试有基线文件，CI 中对比基线偏差
- [ ] CI 集成 SAST + 依赖扫描，Critical/High 漏洞阻断构建
- [ ] PR 合并前必须通过单元测试和静态分析门禁
- [ ] Flaky 测试标记隔离，不阻塞主流程
- [ ] Code Review 检查测试覆盖率和测试质量
- [ ] 新代码必须有对应测试，无测试不合并
