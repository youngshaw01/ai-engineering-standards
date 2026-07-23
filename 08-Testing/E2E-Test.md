# E2E-Test（端到端测试）

## Overview

端到端测试（End-to-End Testing）模拟真实用户操作流程，从前端界面到后端服务再到数据库，验证整个系统的行为是否符合预期。E2E 测试是发现集成缺陷的最后一道防线，但由于其依赖完整的运行环境，执行成本较高且容易产生脆弱测试。本标准定义了 E2E 框架选型、页面对象模型、场景设计和 CI 集成等关键实践。

---

## Rules

### R01 — E2E 框架选型

**MUST** 根据项目技术栈和团队能力选择合适的 E2E 框架，禁止盲目追新。

**SHOULD** 优先选择支持并行执行、自动等待和截图对比的现代框架。

**MAY** 对于复杂交互场景搭配视觉回归测试工具。

| 框架 | 适用场景 | 优势 |
|------|----------|------|
| Playwright | Web 应用（跨浏览器） | 速度快、API 现代、内置自动等待 |
| Cypress | React/Vue 前端项目 | 调试友好、时间旅行 |
| Selenium | 遗留系统兼容 | 生态成熟、语言支持广 |

✅ 正确示例：
```javascript
// Playwright — 推荐用于大多数 Web 项目
const { test, expect } = require('@playwright/test');

test('用户登录并查看订单', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'user@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
});
```

❌ 错误示例：
```javascript
// Selenium + 过时 API，无自动等待
WebDriver driver = new ChromeDriver();
driver.get("http://localhost:8080/login");
driver.findElement(By.name("email")).sendKeys("user@example.com");
Thread.sleep(1000); // 硬编码等待，不稳定
```

---

### R02 — 页面对象模型（Page Object Model）

**MUST** 使用页面对象模型封装页面元素和操作，避免在测试脚本中直接操作 DOM。

**SHOULD** 每个页面或组件对应一个 Page Object 类，提供语义化的访问方法。

**MAY** 结合工厂模式创建不同状态的页面对象。

✅ 正确示例：
```java
public class LoginPage {
    private final WebDriver driver;
    private final TextField email = new TextField(driver, By.name("email"));
    private final TextField password = new TextField(driver, By.name("password"));
    private final Button submitBtn = new Button(driver, By.cssSelector("button[type='submit']"));

    public LoginPage(WebDriver driver) { this.driver = driver; }

    public DashboardPage login(String user, String pass) {
        email.fill(user);
        password.fill(pass);
        submitBtn.click();
        return new DashboardPage(driver);
    }
}

// 测试中使用
@Test
void shouldLoginSuccessfully() {
    var dashboard = new LoginPage(driver).login("user", "pass");
    assertThat(dashboard.isDisplayed()).isTrue();
}
```

❌ 错误示例：
```java
// 测试代码直接操作 DOM，难以维护
@Test
void shouldLogin() {
    driver.findElement(By.name("email")).sendKeys("user");
    driver.findElement(By.name("password")).sendKeys("pass");
    driver.findElement(By.cssSelector("button")).click();
}
```

---

### R03 — 测试场景设计

**MUST** 聚焦核心业务流程编写 E2E 测试，避免覆盖所有边缘情况。

**SHOULD** 每个测试场景描述一个完整的用户旅程，包含前置条件、操作步骤和预期结果。

**MAY** 使用 BDD 语法增强可读性。

✅ 正确示例：
```gherkin
Feature: 购物车结算
  Scenario: 用户添加商品并完成支付
    Given 用户已登录
    And 商品列表页有库存为 10 的商品 SKU-001
    When 用户点击"加入购物车"
    And 用户进入购物车页面
    And 用户点击"去结算"
    And 用户选择支付方式并确认
    Then 显示订单成功页面
    And 订单状态为"已支付"
```

❌ 错误示例：
```java
// 测试过于琐碎，包含大量无关步骤
@Test
void testEverything() {
    goToHomePage();
    clickLogo();
    verifyColor();
    checkTitle();
    scrollDown();
    clickFooterLink();
    // ... 无限延伸
}
```

---

### R04 — 测试数据管理

**MUST** 使用独立的测试数据集，与生产数据隔离。

**SHOULD** 通过 API 或数据库快照准备测试数据，而非依赖 UI 手动创建。

**MAY** 使用数据工厂批量生成符合业务规则的测试数据。

✅ 正确示例：
```java
class OrderCheckoutE2E {
    @BeforeEach
    void setup() {
        // 通过 API 准备测试数据
        orderApi.createTestOrder(OrderDataBuilder.defaultOrder().build());
    }

    @AfterEach
    void cleanup() {
        orderApi.cleanupTestData();
    }
}
```

❌ 错误示例：
```java
// 依赖 UI 创建数据，测试变慢且脆弱
@Test
void checkout() {
    goToProductPage();
    addToCart();
    // 如果前面的步骤失败，后续全部失败
}
```

---

### R05 — 环境处理

**MUST** 在稳定的专用环境中运行 E2E 测试，禁止在开发环境或共享环境中执行。

**SHOULD** 使用容器化环境（Docker）确保环境一致性。

**MAY** 对外部依赖（支付网关、第三方 API）进行 Mock 或 Stub。

✅ 正确示例：
```yaml
# .github/workflows/e2e.yml
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker-compose up -d
      - run: npm run test:e2e
      - run: docker-compose down -v
```

❌ 错误示例：
```java
// 在本地开发环境运行，依赖特定配置
@Test
void checkout() {
    // 假设本地环境已启动且配置正确
    browser.navigateTo("http://localhost:8080");
}
```

---

### R06 — 视觉回归测试

**MAY** 对关键页面引入视觉回归测试，检测意外 UI 变更。

**SHOULD** 仅在核心页面（如首页、结算页）启用视觉对比，避免过度敏感。

**MUST** 当视觉差异超过阈值时，必须人工审查后才能标记为通过。

✅ 正确示例：
```javascript
// Playwright 视觉对比
await expect(page.locator('.order-summary')).toHaveScreenshot('order-summary.png', {
    maxDiffPixelRatio: 0.01
});
```

❌ 错误示例：
```javascript
// 对所有页面进行像素级对比，每次微小调整都导致测试失败
await page.screenshot({ path: 'full-page.png', fullPage: true });
expect(fs.readFileSync('full-page.png')).toEqual(expectedImage);
```

---

### R07 — E2E 测试在 CI 中的集成

**MUST** 将 E2E 测试纳入 CI/CD 流水线，但仅在合并到主分支或发布前触发。

**SHOULD** 设置超时限制（如 15 分钟），防止测试套件阻塞构建。

**MAY** 在 PR 预览环境中运行 E2E 测试，提前发现问题。

✅ 正确示例：
```yaml
# 仅在 main 分支运行完整 E2E
if: github.ref == 'refs/heads/main'
steps:
  - run: npx playwright test --timeout=900000
```

❌ 错误示例：
```yaml
# 每次 PR 都运行完整 E2E，拖慢开发节奏
steps:
  - run: npx playwright test  # 耗时 20+ 分钟
```

---

### R08 — 脆弱测试处理

**MUST** 识别并修复脆弱测试（Flaky Test），不得长期容忍。

**SHOULD** 使用自动等待策略替代固定延时，减少对时序的依赖。

**MAY** 建立脆弱测试看板，跟踪修复进度。

✅ 正确示例：
```javascript
// 使用自动等待，不依赖固定延时
await page.waitForSelector('.order-success');
await expect(page.locator('.status')).toHaveText('COMPLETED');
```

❌ 错误示例：
```javascript
// 使用 sleep，网络波动时测试失败
await page.waitForTimeout(2000);
const text = await page.textContent('.status');
expect(text).toBe('COMPLETED');
```

---

## Checklist

- [ ] 是否选择了适合项目的 E2E 框架？
- [ ] 是否使用了页面对象模型封装页面操作？
- [ ] 是否聚焦核心业务流程而非边缘场景？
- [ ] 是否实现了测试数据的独立管理？
- [ ] 是否在稳定环境中运行测试？
- [ ] 是否合理控制了视觉回归测试的范围？
- [ ] 是否已将 E2E 测试集成到 CI/CD？
- [ ] 是否建立了脆弱测试的修复机制？
