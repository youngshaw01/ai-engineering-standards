# Security

## Overview

后端安全规范，涵盖认证、授权、密码安全、API 安全、注入防护、XSS/CSRF 防护、敏感数据加密、日志安全、OWASP Top 10、安全响应头、密钥管理等。适用于所有后端服务的安全设计与开发。

---

## Rules

### R01 — 认证（Authentication）

**MUST** — 认证机制必须遵循以下规则：

- JWT Access Token 有效期不超过 15 分钟
- JWT 必须使用 RS256 / ES256 非对称算法签名，禁止使用 HS256
- 必须实现 Refresh Token 机制，Refresh Token 有效期不超过 7 天
- Refresh Token 必须存储在 HttpOnly + Secure + SameSite Cookie 中
- Token 失效必须支持服务端主动吊销（黑名单 / 版本号机制）
- OAuth2 授权码模式必须使用 PKCE（Code Verifier + Code Challenge）
- 禁止将 Token 存储在 localStorage / sessionStorage

**JWT 结构规范：**

| 字段 | 必须 | 说明 |
|------|------|------|
| `iss` | 是 | 签发者（如 `https://auth.example.com`） |
| `sub` | 是 | 用户唯一标识 |
| `aud` | 是 | 接收方（如 `https://api.example.com`） |
| `exp` | 是 | 过期时间 |
| `iat` | 是 | 签发时间 |
| `jti` | 是 | Token 唯一 ID（用于吊销） |
| `scope` | 否 | 授权范围 |
| `roles` | 否 | 用户角色（仅限必要场景） |

✅ Correct:

```java
public JwtClaims buildAccessToken(User user) {
    return JwtClaims.builder()
        .iss("https://auth.example.com")
        .sub(String.valueOf(user.getId()))
        .aud("https://api.example.com")
        .exp(Duration.ofMinutes(15))
        .iat(Instant.now())
        .jti(UUID.randomUUID().toString())
        .scope("read write")
        .build();
}
```

```python
def build_access_token(user: User) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "iss": "https://auth.example.com",
        "sub": str(user.id),
        "aud": "https://api.example.com",
        "exp": now + timedelta(minutes=15),
        "iat": now,
        "jti": str(uuid4()),
        "scope": "read write",
    }
    return jwt.encode(payload, private_key, algorithm="RS256")
```

❌ Wrong:

```java
Map<String, Object> claims = new HashMap<>();
claims.put("userId", user.getId());
claims.put("role", "admin");
String token = Jwts.builder()
    .setClaims(claims)
    .setExpiration(new Date(System.currentTimeMillis() + 86400000))
    .signWith(SignatureAlgorithm.HS256, "my-secret-key-12345")
    .compact();
```

```python
payload = {
    "user_id": user.id,
    "role": "admin",
    "exp": datetime.now(timezone.utc) + timedelta(days=1),
}
token = jwt.encode(payload, "my-secret-key-12345", algorithm="HS256")
```

**Refresh Token 安全要求：**

- 每次刷新必须轮换 Refresh Token（旧 Token 立即失效）
- 检测 Refresh Token 复用必须吊销整个 Token Family
- Refresh Token 必须绑定设备指纹或客户端标识

---

### R02 — 授权（Authorization）

**MUST** — 授权机制必须遵循以下规则：

- 使用 RBAC（基于角色的访问控制）作为基础模型
- 复杂权限场景使用 ABAC（基于属性的访问控制）扩展
- 权限校验必须在服务端执行，前端控制仅为 UX 优化
- API 端点必须声明所需权限，默认拒绝所有访问
- 权限粒度至少到「资源 + 操作」级别

**RBAC 模型：**

| 概念 | 说明 | 示例 |
|------|------|------|
| User | 用户 | `user:123` |
| Role | 角色 | `admin`, `editor`, `viewer` |
| Permission | 权限 | `order:read`, `order:write`, `order:delete` |
| Resource | 资源 | `order`, `user`, `report` |

**权限字符串格式：**

```
{resource}:{action}

示例：
order:read
order:write
order:delete
user:read
user:write
report:export
```

✅ Correct:

```java
@PreAuthorize("hasPermission('order', 'read')")
@GetMapping("/api/v1/orders")
public List<Order> listOrders() { ... }

@PreAuthorize("hasPermission('order', 'write')")
@PostMapping("/api/v1/orders")
public Order createOrder() { ... }
```

```python
@router.get("/api/v1/orders")
@require_permission("order:read")
async def list_orders(current_user: User = Depends(get_current_user)):
    ...

@router.post("/api/v1/orders")
@require_permission("order:write")
async def create_order(current_user: User = Depends(get_current_user)):
    ...
```

❌ Wrong:

```java
@GetMapping("/api/v1/orders")
public List<Order> listOrders() {
    if (request.getHeader("X-Role").equals("admin")) {
        return orderService.findAll();
    }
    throw new ForbiddenException();
}
```

```python
@router.get("/api/v1/orders")
async def list_orders(role: str = Header(None, alias="X-Role")):
    if role == "admin":
        return order_service.find_all()
    raise HTTPException(status_code=403)
```

**ABAC 扩展场景：**

- 数据行级权限：用户只能访问自己部门的数据
- 时间约束：财务审批仅在工作时间允许
- 环境约束：敏感操作仅允许从内网发起

---

### R03 — 密码安全

**MUST** — 密码安全必须遵循以下规则：

- 密码哈希必须使用 Argon2id（首选）或 bcrypt（次选）
- bcrypt cost factor 不低于 10
- Argon2id 参数：内存 ≥ 64 MB，迭代 ≥ 3，并行度 ≥ 2
- 密码长度不少于 8 位，不超过 128 位
- 禁止存储明文密码或可逆加密密码
- 禁止使用 MD5 / SHA1 / SHA256 直接哈希密码
- 密码重置 Token 有效期不超过 1 小时，使用后立即失效

**密码策略：**

| 规则 | 要求 |
|------|------|
| 最小长度 | ≥ 8 字符 |
| 最大长度 | ≤ 128 字符 |
| 复杂度 | 至少包含大写、小写、数字、特殊字符中的 3 种 |
| 历史密码 | 新密码不能与最近 5 次相同 |
| 常见密码 | 禁止使用 Top 10000 常见密码（如 `123456`, `password`） |
| 首次登录 | 必须强制修改初始密码 |

✅ Correct:

```java
public String hashPassword(String password) {
    int costFactor = 12;
    return BCrypt.withDefaults().hashToString(costFactor, password.toCharArray());
}

public boolean verifyPassword(String password, String hash) {
    return BCrypt.verifyer().verify(password.toCharArray(), hash).verified;
}
```

```python
from argon2 import PasswordHasher

ph = PasswordHasher(
    time_cost=3,
    memory_cost=65536,
    parallelism=2,
    hash_len=32,
    salt_len=16,
)

hashed = ph.hash(password)
ph.verify(hashed, password)
```

❌ Wrong:

```java
String hashed = DigestUtils.md5Hex(password);
String hashed = DigestUtils.sha256Hex(password + "salt");
String encrypted = AES.encrypt(password, secretKey);
```

```python
import hashlib

hashed = hashlib.md5(password.encode()).hexdigest()
hashed = hashlib.sha256((password + "salt").encode()).hexdigest()
```

**密码传输：**

- **MUST** — 密码必须通过 HTTPS 传输
- **SHOULD** — 前端对密码做一次 SHA256 摘要后再传输（防止明文出现在网络层），服务端仍需做慢哈希
- **MUST** — 登录失败不提示"密码错误"或"用户不存在"，统一提示"用户名或密码错误"

---

### R04 — API 安全

**MUST** — API 安全必须遵循以下规则：

- 所有 API 必须实现 Rate Limiting
- 所有用户输入必须校验（类型、长度、格式、范围）
- 参数绑定必须使用白名单模式，禁止自动绑定所有字段
- 文件上传必须校验类型、大小、内容（Magic Number），禁止仅依赖扩展名
- 错误响应不得泄露内部实现细节（堆栈、SQL、路径）

**Rate Limiting 策略：**

| 场景 | 限制 | 窗口 |
|------|------|------|
| 普通 API | 100 次 | 1 分钟 |
| 登录接口 | 5 次 | 5 分钟 |
| 短信 / 邮件发送 | 1 次 | 1 分钟 |
| 文件上传 | 10 次 | 1 分钟 |
| 搜索接口 | 30 次 | 1 分钟 |

✅ Correct:

```java
@PostMapping("/api/v1/users")
public ResponseEntity<User> createUser(
    @RequestBody @Valid CreateUserRequest request
) {
    return ResponseEntity.ok(userService.create(request));
}

public class CreateUserRequest {
    @NotBlank
    @Size(min = 2, max = 50)
    @Pattern(regexp = "^[a-zA-Z0-9_]+$")
    private String userName;

    @NotBlank
    @Email
    @Size(max = 255)
    private String email;

    @NotNull
    @Min(0)
    @Max(150)
    private Integer age;
}
```

```python
class CreateUserRequest(BaseModel):
    user_name: str = Field(
        min_length=2, max_length=50,
        pattern=r"^[a-zA-Z0-9_]+$",
    )
    email: EmailStr = Field(max_length=255)
    age: int = Field(ge=0, le=150)

@router.post("/api/v1/users")
async def create_user(request: CreateUserRequest):
    return await user_service.create(request)
```

❌ Wrong:

```java
@PostMapping("/api/v1/users")
public ResponseEntity<User> createUser(@RequestBody Map<String, Object> body) {
    return ResponseEntity.ok(userService.create(body));
}
```

```python
@router.post("/api/v1/users")
async def create_user(request: Request):
    body = await request.json()
    return await user_service.create(body)
```

**文件上传安全：**

- **MUST** — 文件类型白名单校验
- **MUST** — 校验文件 Magic Number，不仅依赖扩展名
- **MUST** — 文件大小限制（默认 ≤ 10 MB）
- **MUST** — 上传文件存储到对象存储，不与应用同目录
- **MUST** — 上传文件名使用随机生成，不使用原始文件名
- **MUST** — 图片文件必须二次处理（压缩 / 转换），去除潜在恶意代码

---

### R05 — SQL 注入防护

**MUST** — SQL 注入防护必须遵循以下规则：

- 必须使用参数化查询或 ORM，禁止字符串拼接 SQL
- 动态查询必须使用 Query Builder 或条件构造器
- 存储过程调用必须使用参数绑定
- 排序字段、表名等不可参数化的部分必须使用白名单校验

✅ Correct:

```java
@Query("SELECT u FROM User u WHERE u.userName = :userName AND u.status = :status")
List<User> findByUserNameAndStatus(
    @Param("userName") String userName,
    @Param("status") Integer status
);
```

```python
stmt = select(User).where(
    User.user_name == user_name,
    User.status == status,
)
result = session.execute(stmt)
```

```java
String sql = "SELECT id, user_name, email FROM usr_user WHERE status = ? AND created_at > ?";
PreparedStatement ps = connection.prepareStatement(sql);
ps.setInt(1, status);
ps.setTimestamp(2, Timestamp.valueOf(since));
```

❌ Wrong:

```java
String sql = "SELECT * FROM usr_user WHERE user_name = '" + userName + "' AND status = " + status;
Statement stmt = connection.createStatement();
ResultSet rs = stmt.executeQuery(sql);
```

```python
sql = f"SELECT * FROM usr_user WHERE user_name = '{user_name}' AND status = {status}"
cursor.execute(sql)
```

**动态排序白名单：**

✅ Correct:

```java
private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("id", "user_name", "created_at", "updated_at");

public String sanitizeSortField(String sortField) {
    if (!ALLOWED_SORT_FIELDS.contains(sortField)) {
        throw new IllegalArgumentException("Invalid sort field: " + sortField);
    }
    return sortField;
}
```

❌ Wrong:

```java
String sql = "SELECT * FROM usr_user ORDER BY " + request.getParameter("sort");
```

---

### R06 — XSS 防护

**MUST** — XSS 防护必须遵循以下规则：

- 所有用户输入在输出时必须进行上下文相关的编码
- HTTP 响应必须设置 Content-Security-Policy 头
- Cookie 必须设置 HttpOnly + Secure + SameSite 属性
- 富文本内容必须使用白名单 HTML Sanitizer 清洗
- 禁止将用户输入直接插入 `<script>` / `style` / `href` / `src` 属性

**输出编码规则：**

| 上下文 | 编码方式 | 示例 |
|--------|---------|------|
| HTML Body | HTML Entity 编码 | `<` → `&lt;` |
| HTML Attribute | Attribute 编码 | `"` → `&quot;` |
| JavaScript | JavaScript 编码 | `</script>` → `\x3c/script\x3e` |
| URL | URL 编码 | `&` → `%26` |
| CSS | CSS 编码 | 仅允许字母数字 |

✅ Correct:

```java
@GetMapping("/api/v1/comments")
public List<Comment> listComments() {
    return commentService.findAll().stream()
        .map(this::sanitizeOutput)
        .collect(Collectors.toList());
}

private Comment sanitizeOutput(Comment comment) {
    comment.setContent(HTMLSanitizer.sanitize(comment.getContent()));
    return comment;
}
```

```python
from bleach import clean

ALLOWED_TAGS = ["b", "i", "u", "em", "strong", "a", "p", "br", "ul", "ol", "li"]
ALLOWED_ATTRIBUTES = {"a": ["href", "title"]}

def sanitize_html(content: str) -> str:
    return clean(content, tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRIBUTES, strip=True)
```

❌ Wrong:

```java
@GetMapping("/comments")
public String getComment() {
    return "<div>" + comment.getContent() + "</div>";
}
```

```python
@app.get("/comments")
async def get_comment():
    return f"<div>{comment.content}</div>"
```

**Cookie 安全属性：**

✅ Correct:

```
Set-Cookie: session_id=abc123; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=3600
```

❌ Wrong:

```
Set-Cookie: session_id=abc123; Path=/
```

---

### R07 — CSRF 防护

**MUST** — CSRF 防护必须遵循以下规则：

- 状态变更操作（POST / PUT / PATCH / DELETE）必须验证 CSRF Token
- Cookie 必须设置 SameSite 属性（Strict 或 Lax）
- CSRF Token 必须使用加密安全的随机数生成
- AJAX 请求可通过自定义请求头（如 `X-CSRF-Token`）携带 Token
- SameSite=Strict 可替代 CSRF Token（仅限全站同源场景）

**CSRF 防护方案对比：**

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|---------|
| Synchronizer Token | 安全性高 | 需服务端存储 Token | 传统表单提交 |
| Double Submit Cookie | 无状态 | Cookie 强制设置 SameSite | REST API |
| SameSite Cookie | 简单 | 旧浏览器不支持 | 全站同源 |
| 自定义请求头 | 简单有效 | 仅限 AJAX | SPA 应用 |

✅ Correct:

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig extends WebSecurityConfigurerAdapter {
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf
            .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
            .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler())
        );
    }
}
```

```python
from starlette.middleware.sessions import SessionMiddleware
from itsdangerous import TimestampSigner

csrf_signer = TimestampSigner(secret_key)

def generate_csrf_token() -> str:
    return csrf_signer.sign(secrets.token_hex(16)).decode()

def verify_csrf_token(token: str) -> bool:
    try:
        csrf_signer.unsign(token, max_age=3600)
        return True
    except Exception:
        return False
```

❌ Wrong:

```java
http.csrf().disable();
```

```python
@app.middleware("http")
async def skip_csrf(request, call_next):
    return await call_next(request)
```

**SPA 应用 CSRF 防护流程：**

1. 服务端在登录响应中通过 `Set-Cookie` 下发 CSRF Token（HttpOnly=false）
2. 前端 JavaScript 读取 Cookie 中的 CSRF Token
3. 前端在每次状态变更请求中通过 `X-CSRF-Token` 请求头携带
4. 服务端比对 Cookie 中的 Token 与请求头中的 Token

---

### R08 — 敏感数据加密

**MUST** — 敏感数据加密必须遵循以下规则：

- 传输加密：所有通信必须使用 TLS 1.2+，禁止 TLS 1.0 / 1.1
- 存储加密：数据库敏感字段必须加密存储（字段级加密）
- 对称加密使用 AES-256-GCM，禁止使用 ECB 模式
- 非对称加密使用 RSA-2048+ 或 ECC
- 哈希算法使用 SHA-256+，禁止使用 MD5 / SHA1
- 密钥与数据必须分离存储

**敏感数据分级：**

| 级别 | 数据类型 | 存储要求 | 传输要求 | 展示要求 |
|------|---------|---------|---------|---------|
| L4 极敏感 | 密码、私钥、密钥 | Argon2id / AES-256-GCM | TLS 1.2+ | 禁止展示 |
| L3 高敏感 | 身份证号、银行卡号 | AES-256-GCM 字段加密 | TLS 1.2+ | 脱敏展示 |
| L2 敏感 | 手机号、邮箱、地址 | AES-256-GCM 或透明加密 | TLS 1.2+ | 部分脱敏 |
| L1 一般 | 姓名、性别 | 可明文存储 | TLS 1.2+ | 可完整展示 |

✅ Correct:

```java
public String encryptField(String plaintext, byte[] key) {
    byte[] iv = new byte[12];
    SecureRandom.getInstanceStrong().nextBytes(iv);
    Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
    GCMParameterSpec spec = new GCMParameterSpec(128, iv);
    cipher.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(key, "AES"), spec);
    byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
    byte[] combined = new byte[iv.length + ciphertext.length];
    System.arraycopy(iv, 0, combined, 0, iv.length);
    System.arraycopy(ciphertext, 0, combined, iv.length, ciphertext.length);
    return Base64.getEncoder().encodeToString(combined);
}
```

```python
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

def encrypt_field(plaintext: str, key: bytes) -> str:
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode(), None)
    return base64.b64encode(nonce + ciphertext).decode()

def decrypt_field(encrypted: str, key: bytes) -> str:
    data = base64.b64decode(encrypted)
    nonce = data[:12]
    ciphertext = data[12:]
    aesgcm = AESGCM(key)
    return aesgcm.decrypt(nonce, ciphertext, None).decode()
```

❌ Wrong:

```java
Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5Padding");
cipher.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(key, "AES"));
byte[] encrypted = cipher.doFinal(plaintext.getBytes());
```

```python
from Crypto.Cipher import AES

cipher = AES.new(key, AES.MODE_ECB)
encrypted = cipher.encrypt(plaintext.encode().ljust(32))
```

**TLS 配置要求：**

- **MUST** — 禁止 SSLv3 / TLS 1.0 / TLS 1.1
- **MUST** — 优先使用 TLS 1.3
- **MUST** — 禁用弱密码套件（RC4、DES、3DES、MD5）
- **SHOULD** — 启用 HSTS（HTTP Strict Transport Security）

---

### R09 — 日志安全

**MUST** — 日志安全必须遵循以下规则：

- 日志中禁止输出敏感信息（密码、Token、身份证号、银行卡号、手机号）
- 敏感字段必须脱敏后输出
- 审计日志必须独立存储，不可被应用修改或删除
- 日志格式必须防止注入攻击（CRLF 注入）
- 日志必须包含请求追踪 ID（Trace ID）

**脱敏规则：**

| 数据类型 | 脱敏规则 | 示例 |
|---------|---------|------|
| 手机号 | 保留前 3 后 4 | `138****1234` |
| 身份证号 | 保留前 3 后 4 | `110***********1234` |
| 银行卡号 | 保留后 4 | `************1234` |
| 邮箱 | 保留首字符和域名 | `a***@example.com` |
| 姓名 | 保留姓 | `张**` |
| 密码 | 完全隐藏 | `******` |
| Token | 完全隐藏 | `******` |

✅ Correct:

```java
public class SensitiveDataMasker {
    public static String maskPhone(String phone) {
        if (phone == null || phone.length() < 7) return "******";
        return phone.substring(0, 3) + "****" + phone.substring(phone.length() - 4);
    }

    public static String maskIdCard(String idCard) {
        if (idCard == null || idCard.length() < 7) return "******";
        return idCard.substring(0, 3) + "***********" + idCard.substring(idCard.length() - 4);
    }

    public static String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "******";
        String[] parts = email.split("@", 2);
        return parts[0].charAt(0) + "***@" + parts[1];
    }
}
```

```python
def mask_phone(phone: str) -> str:
    if not phone or len(phone) < 7:
        return "******"
    return phone[:3] + "****" + phone[-4:]

def mask_id_card(id_card: str) -> str:
    if not id_card or len(id_card) < 7:
        return "******"
    return id_card[:3] + "***********" + id_card[-4:]
```

❌ Wrong:

```java
log.info("User login: phone={}, idCard={}, password={}", phone, idCard, password);
```

```python
logger.info(f"User login: phone={phone}, id_card={id_card}, password={password}")
```

**审计日志要求：**

| 字段 | 必须 | 说明 |
|------|------|------|
| traceId | 是 | 请求追踪 ID |
| userId | 是 | 操作人 ID |
| action | 是 | 操作类型（CREATE / UPDATE / DELETE / LOGIN） |
| resource | 是 | 操作资源（如 `order:123`） |
| timestamp | 是 | 操作时间（ISO 8601） |
| ip | 是 | 客户端 IP |
| result | 是 | 操作结果（SUCCESS / FAILURE） |
| detail | 否 | 变更详情（before / after） |

**日志注入防护：**

✅ Correct:

```java
String sanitizedInput = userInput.replace("\n", "\\n").replace("\r", "\\r");
log.info("User input: {}", sanitizedInput);
```

❌ Wrong:

```java
log.info("User input: {}", userInput);
```

---

### R10 — OWASP Top 10

**MUST** — 必须针对 OWASP Top 10（2021 版）关键风险实施防护：

| 排名 | 风险 | 对应本规范 | 关键防护措施 |
|------|------|-----------|-------------|
| A01 | Broken Access Control | R02 | 默认拒绝、服务端校验、最小权限 |
| A02 | Cryptographic Failures | R08 | TLS 1.2+、AES-256-GCM、字段级加密 |
| A03 | Injection | R05, R06 | 参数化查询、输入校验、输出编码 |
| A04 | Insecure Design | R01, R02 | 威胁建模、安全设计评审 |
| A05 | Security Misconfiguration | R11 | 安全响应头、禁用默认账户、最小暴露 |
| A06 | Vulnerable Components | — | 依赖扫描、及时升级、SBOM |
| A07 | Auth Failures | R01, R03 | 慢哈希、MFA、账户锁定 |
| A08 | Data Integrity Failures | R08, R12 | 签名验证、不可信反序列化防护 |
| A09 | Logging Failures | R09 | 审计日志、脱敏、监控告警 |
| A10 | SSRF | — | URL 白名单、禁止内网访问、禁用重定向 |

**A06 — Vulnerable Components 额外要求：**

- **MUST** — 建立依赖清单（SBOM），定期扫描已知漏洞
- **MUST** — Critical / High 级别漏洞必须在 7 天内修复
- **MUST** — 禁止使用已停止维护的依赖（最近 12 个月无更新）
- **SHOULD** — 集成自动化依赖扫描工具（Snyk / Dependabot / OWASP Dependency-Check）

**A08 — Data Integrity Failures 额外要求：**

- **MUST** — 禁止反序列化不可信数据
- **MUST** — JWT 必须验证签名算法（防止 Algorithm None 攻击）
- **MUST** — 文件上传必须校验完整性（Hash / 签名）

**A10 — SSRF 额外要求：**

✅ Correct:

```java
public URL validateUrl(String urlString) throws SSRFException {
    URL url = new URL(urlString);
    String protocol = url.getProtocol().toLowerCase();
    if (!Set.of("http", "https").contains(protocol)) {
        throw new SSRFException("Unsupported protocol: " + protocol);
    }
    InetAddress address = InetAddress.getByName(url.getHost());
    if (address.isLoopbackAddress() || address.isSiteLocalAddress()
        || address.isLinkLocalAddress() || address.isAnyLocalAddress()) {
        throw new SSRFException("Access to internal network is denied");
    }
    return url;
}
```

❌ Wrong:

```java
public String fetchUrl(String urlString) {
    URL url = new URL(urlString);
    HttpURLConnection conn = (HttpURLConnection) url.openConnection();
    return IOUtils.toString(conn.getInputStream());
}
```

---

### R11 — 安全响应头

**MUST** — 所有 HTTP 响应必须设置以下安全响应头：

| 响应头 | 必须 | 推荐值 | 说明 |
|--------|------|--------|------|
| `Content-Security-Policy` | 是 | `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'` | 防止 XSS 和内容注入 |
| `Strict-Transport-Security` | 是 | `max-age=31536000; includeSubDomains; preload` | 强制 HTTPS |
| `X-Content-Type-Options` | 是 | `nosniff` | 禁止 MIME 嗅探 |
| `X-Frame-Options` | 是 | `DENY` 或 `SAMEORIGIN` | 防止 Clickjacking |
| `X-XSS-Protection` | 否 | `0`（已废弃，依赖 CSP） | 旧浏览器兼容 |
| `Referrer-Policy` | 是 | `strict-origin-when-cross-origin` | 控制 Referrer 泄露 |
| `Permissions-Policy` | SHOULD | `camera=(), microphone=(), geolocation=()` | 限制浏览器 API |
| `Cache-Control` | 是 | `no-store`（敏感页面） | 防止缓存泄露 |

✅ Correct:

```java
@Configuration
public class SecurityHeadersConfig {
    @Bean
    public HeaderWriter httpSecurityHeaders() {
        return (request, response) -> {
            response.setHeader("Content-Security-Policy",
                "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'");
            response.setHeader("Strict-Transport-Security",
                "max-age=31536000; includeSubDomains; preload");
            response.setHeader("X-Content-Type-Options", "nosniff");
            response.setHeader("X-Frame-Options", "DENY");
            response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
            response.setHeader("Permissions-Policy",
                "camera=(), microphone=(), geolocation=()");
        };
    }
}
```

```python
@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; script-src 'self'; "
        "style-src 'self' 'unsafe-inline'; img-src 'self' data:; "
        "font-src 'self'; connect-src 'self'; frame-ancestors 'none'"
    )
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response
```

❌ Wrong:

```java
response.setHeader("X-Frame-Options", "ALLOW-FROM https://evil.com");
response.setHeader("Content-Security-Policy", "");
response.setHeader("Access-Control-Allow-Origin", "*");
```

**CSP 策略渐进式部署：**

1. 先使用 `Content-Security-Policy-Report-Only` 观察违规
2. 分析报告，调整策略
3. 确认无违规后切换为 `Content-Security-Policy` 强制模式

---

### R12 — 密钥管理

**MUST** — 密钥管理必须遵循以下规则：

- 密钥必须使用 KMS（Key Management Service）管理，禁止硬编码
- 密钥必须按环境隔离（开发 / 测试 / 预发 / 生产使用不同密钥）
- 密钥轮换周期不超过 90 天
- 密钥必须支持紧急轮换（泄露后 1 小时内完成轮换）
- 应用通过环境变量或 Secret Manager 注入密钥，不写入代码或配置文件
- 数据加密密钥（DEK）与密钥加密密钥（KEK）分离

**密钥层级架构：**

```
KMS (Master Key / KEK)
  └── Data Encryption Key (DEK) ← 加密业务数据
        └── 加密后的 DEK ← 存储在数据库中
```

**密钥类型与轮换策略：**

| 密钥类型 | 轮换周期 | 存储位置 | 示例 |
|---------|---------|---------|------|
| Master Key (KEK) | 1 年 | KMS | AWS KMS Key、阿里云 KMS Key |
| Data Encryption Key (DEK) | 90 天 | 加密后存数据库 | AES-256 密钥 |
| JWT Signing Key | 90 天 | KMS / Secret Manager | RSA Private Key |
| API Key | 90 天 | Secret Manager | 第三方服务 API Key |
| Database Password | 90 天 | Secret Manager | 数据库连接密码 |
| Internal Secret | 90 天 | 环境变量 / Secret Manager | `JWT_SECRET`、`ENCRYPTION_KEY` |

✅ Correct:

```java
public byte[] decryptDataKey(byte[] encryptedDataKey) {
    AwsKmsClient kmsClient = AwsKmsClient.create();
    DecryptRequest request = DecryptRequest.builder()
        .ciphertextBlob(SdkBytes.fromByteArray(encryptedDataKey))
        .build();
    DecryptResponse response = kmsClient.decrypt(request);
    return response.plaintext().asByteArray();
}
```

```python
import boto3

kms_client = boto3.client("kms")

def decrypt_data_key(encrypted_data_key: bytes) -> bytes:
    response = kms_client.decrypt(CiphertextBlob=encrypted_data_key)
    return response["Plaintext"]
```

❌ Wrong:

```java
private static final String SECRET_KEY = "my-super-secret-key-12345";
private static final String DB_PASSWORD = "admin123";
```

```python
SECRET_KEY = "my-super-secret-key-12345"
DB_PASSWORD = "admin123"
```

**密钥轮换流程：**

1. 生成新密钥，在 KMS 中标记为 Active
2. 旧密钥标记为 Inactive（仍可解密，不可加密新数据）
3. 应用使用新密钥加密新数据
4. 后台任务逐步使用新密钥重新加密旧数据
5. 所有旧数据重新加密完成后，归档旧密钥
6. 保留旧密钥至少 1 年（应对备份恢复场景）

**环境隔离要求：**

- **MUST** — 每个环境使用独立的 KMS 密钥
- **MUST** — 开发 / 测试环境禁止使用生产密钥
- **MUST** — 密钥命名包含环境标识（如 `prod/jwt-signing-key`、`dev/jwt-signing-key`）
- **MUST** — 生产密钥访问权限最小化（仅授权服务账户）

---

## Checklist

- [ ] JWT Access Token 有效期 ≤ 15 分钟，使用 RS256 / ES256 签名
- [ ] 实现 Refresh Token 机制，存储在 HttpOnly + Secure + SameSite Cookie
- [ ] Token 支持服务端主动吊销
- [ ] OAuth2 授权码模式使用 PKCE
- [ ] 使用 RBAC / ABAC 授权模型，权限校验在服务端执行
- [ ] 权限粒度到「资源 + 操作」级别，默认拒绝访问
- [ ] 密码使用 Argon2id / bcrypt 哈希，禁止 MD5 / SHA 直接哈希
- [ ] 密码策略：≥ 8 位、复杂度要求、禁止常见密码
- [ ] API 实现 Rate Limiting，所有用户输入校验
- [ ] 参数绑定使用白名单模式，文件上传校验类型和内容
- [ ] 使用参数化查询 / ORM，禁止字符串拼接 SQL
- [ ] 动态排序 / 表名使用白名单校验
- [ ] 输出编码防 XSS，设置 CSP 头，Cookie 设置 HttpOnly + Secure + SameSite
- [ ] 富文本使用白名单 HTML Sanitizer 清洗
- [ ] 状态变更操作验证 CSRF Token，Cookie 设置 SameSite
- [ ] 传输使用 TLS 1.2+，存储使用 AES-256-GCM，禁止 ECB 模式
- [ ] 敏感数据分级存储加密，展示脱敏
- [ ] 日志禁止输出敏感信息，脱敏规则覆盖手机号 / 身份证 / 银行卡 / 邮箱
- [ ] 审计日志独立存储，包含 Trace ID / userId / action / resource / result
- [ ] 日志防护 CRLF 注入
- [ ] 针对 OWASP Top 10 实施防护，依赖扫描、SSRF 防护、反序列化防护
- [ ] 设置安全响应头：CSP / HSTS / X-Content-Type-Options / X-Frame-Options / Referrer-Policy
- [ ] 密钥使用 KMS 管理，禁止硬编码
- [ ] 密钥按环境隔离，轮换周期 ≤ 90 天
- [ ] DEK 与 KEK 分离，支持紧急轮换