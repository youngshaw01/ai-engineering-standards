# Spring Boot

## Overview

Spring Boot 工程规范，涵盖项目结构、配置管理、自动配置、依赖注入、Web 层、数据访问、缓存、异步调度、安全、监控、测试与打包部署。适用于基于 Spring Boot 2.7+ / 3.x 的 Java 后端项目。

---

## Rules

### R01 — 项目结构

**MUST** — 遵循分层架构，包组织清晰：

```
com.example.app
├── Application.java          # 启动类（根包）
├── config/                    # 配置类
│   ├── WebConfig.java
│   └── AsyncConfig.java
├── controller/                # Web 层
│   └── UserController.java
├── service/                   # 业务层
│   ├── UserService.java
│   └── impl/
│       └── UserServiceImpl.java
├── repository/                # 数据访问层
│   └── UserRepository.java
├── domain/                    # 领域模型
│   ├── User.java
│   └── Order.java
├── dto/                       # 数据传输对象
│   ├── request/
│   │   └── CreateUserRequest.java
│   └── response/
│       └── UserResponse.java
├── exception/                 # 异常定义
│   ├── BusinessException.java
│   └── GlobalExceptionHandler.java
└── common/                    # 公共组件
    ├── Result.java
    └── PageResult.java
```

**启动类必须位于根包**，确保 `@SpringBootApplication` 的组件扫描覆盖所有子包。

✅ Correct:

```java
// Application.java — 根包 com.example.app
@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

❌ Wrong:

```java
// 启动类放在子包中，导致组件扫描遗漏
package com.example.app.controller;

@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

---

### R02 — 配置管理

**MUST** — 使用多环境配置文件：

```
src/main/resources/
├── application.yaml           # 公共配置
├── application-dev.yaml       # 开发环境
├── application-staging.yaml   # 预发布环境
├── application-prod.yaml      # 生产环境
```

**激活方式：**

```yaml
# application.yaml
spring:
  profiles:
    active: ${SPRING_PROFILES_ACTIVE:dev}
```

**敏感配置必须外部化：**

✅ Correct:

```yaml
# application.yaml — 不包含密码
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/mydb
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
```

❌ Wrong:

```yaml
# application.yaml — 硬编码密码
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/mydb
    username: admin
    password: secret123
```

**`@Value` vs `@ConfigurationProperties`：**

| 场景 | 推荐方式 |
|------|---------|
| 单个简单值 | `@Value("${property}")` |
| 一组相关配置 | `@ConfigurationProperties` |
| 需要校验的配置 | `@ConfigurationProperties` + `@Validated` |
| 需要在代码中引用的配置类 | `@ConfigurationProperties` |

✅ Correct:

```java
@Component
@ConfigurationProperties(prefix = "app.mail")
@Validated
public class MailProperties {
    @NotBlank
    private String host;
    @Min(1)
    private int port;
    private boolean tls;

    // getters & setters
}
```

---

### R03 — 自动配置

**MUST** — 合理使用条件注解控制自动配置：

| 注解 | 作用 |
|------|------|
| `@ConditionalOnClass` | 类路径存在时生效 |
| `@ConditionalOnMissingBean` | 容器中不存在该 Bean 时生效 |
| `@ConditionalOnProperty` | 配置项满足时生效 |
| `@ConditionalOnWebApplication` | Web 应用时生效 |

**排除不需要的自动配置：**

✅ Correct:

```java
@SpringBootApplication(exclude = {
    DataSourceAutoConfiguration.class,
    HibernateJpaAutoConfiguration.class
})
public class Application {
    // ...
}
```

**自定义 Starter 结构：**

```
my-library-starter/
├── pom.xml
│   └── spring-boot-starter
├── src/main/java/
│   └── com/example/starter/
│       ├── autoconfigure/
│       │   └── MyLibraryAutoConfiguration.java
│       └── properties/
│           └── MyLibraryProperties.java
└── src/main/resources/
    └── META-INF/
        └── spring/
            └── org.springframework.boot.autoconfigure.AutoConfiguration.imports
```

✅ Correct (Spring Boot 3.x)：

```java
// MyLibraryAutoConfiguration.java
@AutoConfiguration
@EnableConfigurationProperties(MyLibraryProperties.class)
@ConditionalOnClass(MyLibraryClient.class)
public class MyLibraryAutoConfiguration {
    @Bean
    @ConditionalOnMissingBean
    public MyLibraryClient myLibraryClient(MyLibraryProperties properties) {
        return new MyLibraryClient(properties.getUrl(), properties.getToken());
    }
}
```

```text
# META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
com.example.starter.autoconfigure.MyLibraryAutoConfiguration
```

---

### R04 — 依赖注入

**MUST** — 优先使用构造器注入：

✅ Correct:

```java
@Service
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }
}
```

❌ Wrong:

```java
@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
}
```

**`@Qualifier` 解决同类型多 Bean：**

✅ Correct:

```java
@Service
public class NotificationService {
    private final EmailSender emailSender;
    private final SmsSender smsSender;

    public NotificationService(
            @Qualifier("emailSender") EmailSender emailSender,
            @Qualifier("smsSender") SmsSender smsSender) {
        this.emailSender = emailSender;
        this.smsSender = smsSender;
    }
}
```

**循环依赖：**

| 方案 | 说明 |
|------|------|
| 重构代码 | 提取公共逻辑到第三个 Service |
| `@Lazy` | 延迟初始化打破循环 |
| Field Injection | 不推荐，仅作为最后手段 |

✅ Correct:

```java
@Service
public class AService {
    private final BService bService;

    @Autowired
    public AService(@Lazy BService bService) {
        this.bService = bService;
    }
}
```

---

### R05 — Web 层规范

**MUST** — Controller 职责单一，只负责参数接收和响应封装：

✅ Correct:

```java
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "用户管理", description = "用户相关 API")
public class UserController {
    private final UserService userService;

    @GetMapping("/{id}")
    @Operation(summary = "根据 ID 查询用户")
    public Result<UserResponse> getById(@PathVariable Long id) {
        return Result.success(userService.getById(id));
    }

    @PostMapping
    @Operation(summary = "创建用户")
    public Result<UserResponse> create(@Valid @RequestBody CreateUserRequest request) {
        return Result.success(userService.create(request));
    }
}
```

**统一异常处理：**

✅ Correct:

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<Result<Void>> handleBusinessException(BusinessException ex) {
        return ResponseEntity.status(ex.getHttpStatus())
                .body(Result.fail(ex.getCode(), ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Result<List<FieldError>>> handleValidationException(
            MethodArgumentNotValidException ex) {
        List<FieldError> errors = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> new FieldError(e.getField(), e.getDefaultMessage()))
                .collect(Collectors.toList());
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                .body(Result.fail("VALIDATION_ERROR", "请求参数校验失败", errors));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Result<Void>> handleException(Exception ex) {
        log.error("Unexpected error", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Result.fail("INTERNAL_ERROR", "服务器内部错误"));
    }
}
```

**响应封装：**

✅ Correct:

```java
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Result<T> {
    private String code;
    private String message;
    private T data;

    public static <T> Result<T> success(T data) {
        return new Result<>("SUCCESS", "OK", data);
    }

    public static <T> Result<T> fail(String code, String message) {
        return new Result<>(code, message, null);
    }
}
```

---

### R06 — 数据访问

**JPA vs MyBatis 选择：**

| 场景 | 推荐 |
|------|------|
| CRUD 为主、简单查询 | JPA / Spring Data JPA |
| 复杂 SQL、报表、批量操作 | MyBatis |
| 需要精细控制 SQL | MyBatis |
| 快速原型 | JPA |

**事务管理：**

✅ Correct:

```java
@Service
@RequiredArgsConstructor
public class OrderService {
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    @Transactional
    public Order createOrder(CreateOrderRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new BusinessException("USER_NOT_FOUND", "用户不存在"));
        Order order = new Order();
        order.setUser(user);
        order.setAmount(request.getAmount());
        return orderRepository.save(order);
    }
}
```

❌ Wrong:

```java
// 在 Controller 上加事务 — 错误层级
@RestController
@Transactional
public class OrderController {
    // ...
}
```

**避免 N+1 问题：**

✅ Correct:

```java
// 使用 JOIN FETCH 或实体图
@Query("SELECT o FROM Order o JOIN FETCH o.items i WHERE o.id = :id")
Order findWithItems(@Param("id") Long id);

// 或使用 EntityGraph
@EntityGraph(attributePaths = "items")
Order findById(Long id);
```

❌ Wrong:

```java
// N+1 问题：先查订单，再逐条查 item
public List<Order> findAll() {
    List<Order> orders = orderRepository.findAll();
    orders.forEach(o -> o.getItems().size()); // 触发额外查询
    return orders;
}
```

**分页规范：**

✅ Correct:

```java
@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    @EntityGraph(attributePaths = "items")
    Page<Order> findByUserId(Long userId, Pageable pageable);
}

// Service
public PageResult<OrderResponse> listOrders(Long userId, int page, int size) {
    Pageable pageable = PageRequest.of(page - 1, size, Sort.by("createdAt").descending());
    Page<Order> orderPage = orderRepository.findByUserId(userId, pageable);
    return PageResult.from(orderPage);
}
```

---

### R07 — 缓存

**MUST** — 使用 `@Cacheable` 规范：

✅ Correct:

```java
@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;

    @Cacheable(value = "users", key = "#id")
    public User getById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new BusinessException("USER_NOT_FOUND"));
    }

    @CacheEvict(value = "users", key = "#id")
    public void deleteById(Long id) {
        userRepository.deleteById(id);
    }

    @CachePut(value = "users", key = "#user.id")
    public User update(User user) {
        return userRepository.save(user);
    }
}
```

**Key 设计原则：**

| 场景 | Key 示例 |
|------|---------|
| 单资源查询 | `"users:123"` |
| 列表查询 | `"users:list:page:1:size:20"` |
| 按条件查询 | `"users:active:true"` |
| 组合键 | `"orders:user:123:status:pending"` |

**缓存穿透防护：**

✅ Correct:

```java
@Cacheable(value = "users", key = "#id", unless = "#result == null")
public User getById(Long id) {
    User user = userRepository.findById(id).orElse(null);
    if (user == null) {
        // 缓存空值，防止穿透
        cacheNullValue(id);
    }
    return user;
}

private void cacheNullValue(Long id) {
    // 使用短过期时间（如 5 分钟）缓存空值
    redisTemplate.opsForValue().set("users:null:" + id, "NULL", 5, TimeUnit.MINUTES);
}
```

**缓存雪崩防护：**

- 为不同 Key 设置随机偏移过期时间（基础 TTL ± 10%）
- 使用多级缓存（本地 Caffeine + Redis）
- 热点数据永不过期，通过消息主动更新

**多级缓存配置：**

✅ Correct:

```java
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheOptions()
                .entryTtl(Duration.ofMinutes(30))
                .serializeValuesWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(new GenericJackson2JsonRedisSerializer()));
        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(config)
                .withInitialCacheConfigurations(Map.of(
                        "users", config.entryTtl(Duration.ofHours(1)),
                        "products", config.entryTtl(Duration.ofMinutes(15))
                ))
                .build();
    }

    @Bean
    public CaffeineCacheManager localCacheManager() {
        CaffeineCacheManager manager = new CaffeineCacheManager();
        manager.setCaffeine(Caffeine.newBuilder()
                .expireAfterWrite(Duration.ofMinutes(5))
                .maximumSize(1000));
        return manager;
    }
}
```

---

### R08 — 异步与调度

**MUST** — 异步方法必须指定线程池：

✅ Correct:

```java
@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean("taskExecutor")
    public ThreadPoolTaskExecutor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(10);
        executor.setMaxPoolSize(50);
        executor.setQueueCapacity(500);
        executor.setKeepAliveSeconds(60);
        executor.setThreadNamePrefix("async-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.initialize();
        return executor;
    }
}
```

**`@Async` 使用规范：**

✅ Correct:

```java
@Service
@RequiredArgsConstructor
public class EmailService {

    @Async("taskExecutor")
    public CompletableFuture<Void> sendWelcomeEmail(String email) {
        // 发送邮件逻辑
        return CompletableFuture.completedFuture(null);
    }
}
```

❌ Wrong:

```java
// 在同类中调用 @Async 方法 — 不会走代理
@Service
public class EmailService {
    public void process() {
        this.sendWelcomeEmail("test@example.com"); // 不走异步！
    }

    @Async("taskExecutor")
    public void sendWelcomeEmail(String email) {
        // ...
    }
}
```

**`@Scheduled` 规范：**

✅ Correct:

```java
@Configuration
@EnableScheduling
public class ScheduleConfig {
    @Bean
    public TaskScheduler taskScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(5);
        scheduler.setThreadNamePrefix("scheduled-");
        return scheduler;
    }
}

@Service
public class ReportService {
    @Scheduled(cron = "0 0 2 * * ?") // 每天凌晨 2 点
    public void generateDailyReport() {
        // 生成日报
    }
}
```

**分布式调度：**

| 方案 | 适用场景 |
|------|---------|
| Quartz + Job Store | 单机或少量节点 |
| ShedLock | Spring Boot 集群定时任务防重复执行 |
| XXL-Job | 大规模分布式任务调度平台 |

✅ Correct (ShedLock):

```java
@Component
@RequiredArgsConstructor
public class DailyReportTask {

    @Scheduled(cron = "0 0 2 * * ?")
    @SchedulerLock(name = "dailyReportTask", lockAtMostFor = "PT30M", lockAtLeastFor = "PT5M")
    public void execute() {
        // ShedLock 确保集群中只有一个节点执行
    }
}
```

---

### R09 — 安全

**MUST** — Spring Security 最小配置：

✅ Correct:

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/auth/**").permitAll()
                .requestMatchers("/actuator/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
```

**JWT 集成：**

✅ Correct:

```java
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String token = tokenProvider.resolveToken(request);
        if (token != null && tokenProvider.validateToken(token)) {
            String username = tokenProvider.getUsername(token);
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
            SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities()));
        }
        chain.doFilter(request, response);
    }
}
```

**方法级权限：**

✅ Correct:

```java
@Service
public class UserService {

    @PreAuthorize("hasRole('ADMIN')")
    public User getAdminInfo(Long id) {
        return userRepository.findById(id).orElseThrow();
    }

    @PreAuthorize("hasPermission(#request.userId, 'ORDER', 'read')")
    public Order getOrder(Long userId, GetOrderRequest request) {
        return orderRepository.findById(request.getOrderId()).orElseThrow();
    }
}
```

**CORS 配置：**

✅ Correct:

```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(List.of("https://app.example.com"));
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Idempotency-Key"));
    config.setMaxAge(86400L);
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", config);
    return source;
}
```

❌ Wrong:

```java
// 允许任意来源 — 对需要认证的 API 不安全
config.setAllowedOriginPatterns(List.of("*"));
```

---

### R10 — Actuator 与监控

**MUST** — 端点暴露策略：

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      show-details: when-authorized
    metrics:
      enabled: true
  server:
    port: 8081
```

**健康检查分组：**

✅ Correct:

```yaml
management:
  endpoint:
    health:
      group:
        readonly:
          include: diskSpace,db,redis
        detailed:
          include: "*"
```

```bash
# 只读健康检查（对外暴露）
GET /actuator/health/readonly

# 详细健康检查（仅内网）
GET /actuator/health/detailed
```

**自定义指标：**

✅ Correct:

```java
@Service
@RequiredArgsConstructor
public class OrderService {
    private final MeterRegistry meterRegistry;

    public Order createOrder(CreateOrderRequest request) {
        Counter.builder("orders.created")
                .description("Total number of orders created")
                .register(meterRegistry)
                .increment();

        Timer.builder("order.creation.duration")
                .description("Time taken to create an order")
                .register(meterRegistry)
                .record(() -> {
                    // 业务逻辑
                });
        // ...
    }
}
```

**Prometheus 集成：**

✅ Correct:

```yaml
# pom.xml
dependencies:
  - name: micrometer-registry-prometheus
    implementation: io.micrometer:micrometer-registry-prometheus
```

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'spring-boot-app'
    metrics_path: '/actuator/prometheus'
    static_configs:
      - targets: ['localhost:8081']
```

---

### R11 — 测试

**MUST** — 测试分层：

| 层级 | 注解 | 说明 |
|------|------|------|
| 单元测试 | `@ExtendWith(MockitoExtension.class)` | 纯逻辑，不启动 Spring |
| 切片测试 | `@WebMvcTest`, `@DataJpaTest`, `@Restdocs` | 测试特定层 |
| 集成测试 | `@SpringBootTest(webEnvironment = RANDOM_PORT)` | 全上下文 |
| 契约测试 | `@SpringBootTest` + Testcontainers | 真实基础设施 |

✅ Correct (单元测试)：

```java
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock private UserRepository userRepository;
    @InjectMocks private UserService userService;

    @Test
    void shouldThrowWhenUserNotFound() {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> userService.getById(1L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("USER_NOT_FOUND");
    }
}
```

✅ Correct (集成测试)：

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class UserControllerIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void shouldCreateUser() {
        CreateUserRequest request = new CreateUserRequest("Alice", "alice@example.com");
        ResponseEntity<Result<UserResponse>> response = restTemplate.postForEntity(
                "/api/v1/users", request, new ParameterizedTypeReference<>() {});
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody().getCode()).isEqualTo("SUCCESS");
    }
}
```

**Testcontainers：**

✅ Correct:

```java
@SpringBootTest
@Testcontainers
class UserRepositoryTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired private UserRepository userRepository;

    @Test
    void shouldSaveAndFind() {
        User user = new User("Alice", "alice@example.com");
        userRepository.save(user);
        assertThat(userRepository.findByEmail("alice@example.com")).isPresent();
    }
}
```

**测试配置隔离：**

✅ Correct:

```yaml
# src/test/resources/application-test.yaml
spring:
  datasource:
    url: jdbc:tc:postgresql:16-alpine://database
  flyway:
    enabled: false
  main:
    allow-circular-references: true
```

---

### R12 — 打包与部署

**MUST** — 分层 JAR 结构：

```yaml
# pom.xml
<build>
    <plugins>
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
            <configuration>
                <layers>
                    <enabled>true</enabled>
                </layers>
            </configuration>
        </plugin>
    </plugins>
</build>
```

```bash
# 查看分层
java -jar app.jar --extract-dir=extracted
ls extracted/BOOT-INF/classes/  # 应用类
ls extracted/BOOT-INF/lib/       # 依赖库
ls extracted/META-INF/           # 启动信息
```

**Docker 集成：**

✅ Correct:

```dockerfile
# 多阶段构建
FROM eclipse-temurin:17-jdk-jammy AS build
WORKDIR /app
COPY . .
RUN ./mvnw -q package -DskipTests

FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENV JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseG1GC"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```

**GraalVM Native Image：**

✅ Correct:

```yaml
<!-- pom.xml -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-aot</artifactId>
</dependency>
```

```bash
# 构建 Native Image
./mvnw -Pnative native:compile

# 运行
./target/my-app
```

**JVM 参数规范：**

| 参数 | 推荐值 | 说明 |
|------|--------|------|
| `-Xms` | 与 `-Xmx` 相同 | 避免堆动态扩展开销 |
| `-Xmx` | 容器内存的 75% | 预留给 Metaspace 和线程栈 |
| `-XX:+UseG1GC` | G1 收集器 | JDK 9+ 默认，低延迟 |
| `-XX:MaxGCPauseMillis` | 200 | G1 目标停顿时间 |
| `-XX:+HeapDumpOnOutOfMemoryError` | true | OOM 时自动 dump |
| `-XX:HeapDumpPath` | `/var/log/app/heapdump.hprof` | dump 文件路径 |
| `-Dspring.profiles.active` | `prod` | 通过环境变量传入 |

✅ Correct:

```bash
JAVA_OPTS="-Xms512m -Xmx512m -XX:+UseG1GC -XX:MaxGCPauseMillis=200 \
  -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/var/log/app/heapdump.hprof \
  -Dspring.profiles.active=prod"
```

---

## Checklist

- [ ] 项目结构遵循分层架构，启动类位于根包
- [ ] 多环境配置分离，敏感配置外部化（环境变量）
- [ ] 使用 `@ConfigurationProperties` 管理一组相关配置
- [ ] 自动配置使用条件注解，按需排除
- [ ] 依赖注入使用构造器注入，禁止字段注入
- [ ] Controller 职责单一，参数校验使用 `@Valid`
- [ ] 全局异常处理使用 `@RestControllerAdvice`
- [ ] 事务注解在 Service 层，不在 Controller
- [ ] 避免 N+1 查询，使用 JOIN FETCH 或 EntityGraph
- [ ] 集合接口支持分页，禁止返回全量数据
- [ ] 缓存操作使用 `@Cacheable` / `@CacheEvict` / `@CachePut`
- [ ] 缓存 Key 命名规范，考虑穿透和雪崩防护
- [ ] `@Async` 指定线程池，避免自调用失效
- [ ] 集群定时任务使用 ShedLock 防重复执行
- [ ] Spring Security 配置最小权限原则
- [ ] CORS 不使用通配符 `*` 用于认证 API
- [ ] Actuator 端点按需暴露，健康检查分组
- [ ] 自定义指标使用 Micrometer API
- [ ] 单元测试不启动 Spring，集成测试使用 Testcontainers
- [ ] 测试配置隔离，不污染生产配置
- [ ] Docker 多阶段构建，JRE 基础镜像
- [ ] JVM 参数合理设置，OOM 时自动 dump
