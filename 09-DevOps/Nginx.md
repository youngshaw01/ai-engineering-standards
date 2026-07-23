# Nginx

## Overview

Nginx 工程规范，涵盖配置文件结构、反向代理配置、SSL/TLS 安全配置、安全头设置、限流策略、缓存策略、性能调优、健康检查与故障转移。适用于所有使用 Nginx 作为 Web 服务器或反向代理的场景。

---

## Rules

### R01 — 配置文件结构

**MUST** — Nginx 配置文件必须遵循以下规则：

- 主配置文件仅包含全局指令和 include 引用
- 按功能拆分配置文件：`conf.d/`、`sites-available/`、`snippets/`
- 每个 server 块独立文件，便于管理
- 敏感配置（密码、密钥）通过变量注入，禁止硬编码

**目录结构：**

```
/etc/nginx/
├── nginx.conf                    # 主配置文件
├── conf.d/                       # 通用配置片段
│   ├── upstreams.conf            # 上游服务定义
│   ├── rate_limits.conf          # 限流配置
│   └── security_headers.conf     # 安全头配置
├── sites-available/              # 站点配置
│   ├── example.com.conf
│   └── api.example.com.conf
├── snippets/                     # 可复用片段
│   ├── ssl.conf                  # SSL 配置
│   ├── gzip.conf                 # Gzip 压缩
│   └── logging.conf              # 日志格式
└── ssl/                          # SSL 证书
    ├── example.com.crt
    └── example.com.key
```

✅ Correct:

```nginx
# /etc/nginx/nginx.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # 引入通用配置
    include /etc/nginx/conf.d/rate_limits.conf;
    include /etc/nginx/conf.d/security_headers.conf;
    include /etc/nginx/snippets/gzip.conf;
    include /etc/nginx/snippets/logging.conf;

    # 引入上游定义
    include /etc/nginx/conf.d/upstreams.conf;

    # 引入站点配置
    include /etc/nginx/sites-enabled/*.conf;
}
```

❌ Wrong:

```nginx
# ❌ 所有配置写在单一文件中
# ❌ 没有模块化拆分
# ❌ 缺少 include 引用
```

**Include 优先级：**

| 位置 | 优先级 | 用途 |
|------|--------|------|
| main config | 最高 | 全局指令 |
| http block | 高 | HTTP 相关配置 |
| server block | 中 | 站点配置 |
| location block | 低 | 路径匹配 |

---

### R02 — 反向代理配置

**MUST** — 反向代理配置必须遵循以下规则：

- 必须定义 upstream 块实现负载均衡
- 必须配置健康检查（proxy_next_upstream）
- 必须设置合理的超时参数
- 必须传递客户端真实 IP（X-Forwarded-For）

**Upstream 配置：**

✅ Correct:

```nginx
# /etc/nginx/conf.d/upstreams.conf
upstream api_backend {
    least_conn;                    # 最少连接数算法
    server 10.0.1.101:8080 weight=5 max_fails=3 fail_timeout=30s;
    server 10.0.1.102:8080 weight=5 max_fails=3 fail_timeout=30s;
    server 10.0.1.103:8080 backup; # 备份服务器

    keepalive 32;                  # 保持连接池
}

upstream web_backend {
    ip_hash;                       # 会话保持（IP 哈希）
    server 10.0.2.101:3000;
    server 10.0.2.102:3000;
}
```

❌ Wrong:

```nginx
# ❌ 直接在 proxy_pass 中使用 IP，无法负载均衡
location /api/ {
    proxy_pass http://10.0.1.101:8080;
}

# ❌ 没有健康检查配置
upstream api_backend {
    server 10.0.1.101:8080;
    server 10.0.1.102:8080;
}
```

**负载均衡算法对比：**

| 算法 | 指令 | 适用场景 |
|------|------|---------|
| 轮询 | 默认 | 无状态服务 |
| 加权轮询 | weight | 服务器性能不均 |
| 最少连接 | least_conn | 长连接服务 |
| IP 哈希 | ip_hash | 需要会话保持 |
| 一致性哈希 | hash $key | 缓存服务 |

**Proxy 配置模板：**

```nginx
# /etc/nginx/sites-available/api.example.com.conf
server {
    listen 80;
    server_name api.example.com;

    location /api/ {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;

        # 传递真实 IP
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # 失败重试
        proxy_next_upstream error timeout http_502 http_503 http_504;
        proxy_next_upstream_tries 2;

        # 缓冲设置
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 16k;
    }
}
```

---

### R03 — SSL/TLS 配置

**MUST** — SSL/TLS 配置必须遵循以下规则：

- 必须使用 TLS 1.2 或更高版本
- 必须禁用弱加密套件
- 必须启用 HSTS（HTTP Strict Transport Security）
- 证书必须来自可信 CA，禁止自签名证书（生产环境）

**SSL 配置片段：**

✅ Correct:

```nginx
# /etc/nginx/snippets/ssl.conf
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
ssl_session_tickets off;

# OCSP Stapling
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;

# HSTS（严格模式，一年有效期）
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

❌ Wrong:

```nginx
# ❌ 支持旧版协议
ssl_protocols SSLv3 TLSv1 TLSv1.1 TLSv1.2;

# ❌ 使用弱加密套件
ssl_ciphers ALL:!aNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!aNULL;

# ❌ 未启用 HSTS
```

**SSL 配置检查清单：**

| 项目 | 要求 | 检查命令 |
|------|------|---------|
| 协议版本 | TLS 1.2+ | `openssl s_client -connect host:443 -tls1_2` |
| 证书有效性 | 未过期 | `openssl x509 -checkend 86400` |
| 证书链 | 完整 | `openssl s_client -showcerts` |
| HSTS | 已启用 | 浏览器 DevTools |
| OCSP Stapling | 已启用 | `openssl s_client -status` |

**Let's Encrypt 自动续期：**

```bash
# 安装 Certbot
yum install certbot python3-certbot-nginx

# 获取证书
certbot --nginx -d example.com -d www.example.com

# 测试自动续期
certbot renew --dry-run

# 添加定时任务（crontab）
0 2 * * * certbot renew --quiet --post-hook "systemctl reload nginx"
```

---

### R04 — 安全头配置

**MUST** — 安全响应头必须配置以下内容：

- **X-Content-Type-Options: nosniff** — 防止 MIME 类型嗅探
- **X-Frame-Options: DENY** — 防止点击劫持
- **X-XSS-Protection: 1; mode=block** — XSS 过滤（现代浏览器已弃用）
- **Referrer-Policy: strict-origin-when-cross-origin** — 控制 Referrer 信息
- **Permissions-Policy: geolocation=(), microphone=(), camera=()** — 限制浏览器功能

✅ Correct:

```nginx
# /etc/nginx/conf.d/security_headers.conf
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=(), payment=()" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.example.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https://cdn.example.com;" always;
```

❌ Wrong:

```nginx
# ❌ 缺少安全头配置
# ❌ CSP 过于宽松
add_header Content-Security-Policy "* 'unsafe-inline' 'unsafe-eval'";
```

**CSP 指令详解：**

| 指令 | 说明 | 推荐值 |
|------|------|--------|
| default-src | 默认资源来源 | `'self'` |
| script-src | JavaScript 来源 | `'self'` + CDN |
| style-src | CSS 来源 | `'self'` + CDN |
| img-src | 图片来源 | `'self'` data: https: |
| font-src | 字体来源 | `'self'` + CDN |
| connect-src | AJAX/WebSocket 来源 | `'self'` API 域名 |
| frame-ancestors | 嵌入来源 | `'none'` |

---

### R05 — 限流策略

**MUST** — 限流配置必须遵循以下规则：

- 必须限制请求速率（requests per second）
- 必须限制并发连接数
- 必须限制请求体大小
- 必须返回合适的错误码（429 Too Many Requests）

**限流配置：**

✅ Correct:

```nginx
# /etc/nginx/conf.d/rate_limits.conf

# 定义限流区域（基于 IP）
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/s;
limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

# 针对登录接口更严格的限制
limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;

server {
    listen 80;
    server_name api.example.com;

    # API 限流
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        limit_conn conn_limit 10;

        # 请求体大小限制
        client_max_body_size 10m;

        proxy_pass http://api_backend;
    }

    # 登录接口特殊限流
    location /api/auth/login {
        limit_req zone=login_limit burst=1 nodelay;
        limit_conn conn_limit 3;

        proxy_pass http://api_backend;
    }

    # 限流错误页面
    error_page 429 /429.html;
    location = /429.html {
        default_type text/html;
        return 429 '{"error": "Too Many Requests"}';
    }
}
```

❌ Wrong:

```nginx
# ❌ 没有限流配置
# ❌ 可能被恶意请求耗尽资源
location /api/ {
    proxy_pass http://api_backend;
}
```

**限流参数说明：**

| 参数 | 说明 | 示例 |
|------|------|------|
| rate | 每秒/每分钟请求数 | `100r/s`、`5r/m` |
| burst | 突发请求允许的队列长度 | `burst=20` |
| nodelay | 立即处理突发请求 | `nodelay` |
| limit_conn | 最大并发连接数 | `limit_conn 10` |

**不同场景限流建议：**

| 场景 | 速率限制 | 并发限制 | 原因 |
|------|---------|---------|------|
| 普通 API | 100 r/s | 10 | 正常业务流量 |
| 登录接口 | 5 r/m | 3 | 防止暴力破解 |
| 文件上传 | 10 r/s | 5 | 大文件消耗资源 |
| 搜索接口 | 50 r/s | 20 | 计算密集型 |

---

### R06 — 缓存策略

**MUST** — 缓存配置必须遵循以下规则：

- 静态资源必须设置长期缓存（Cache-Control: max-age）
- 动态内容必须设置短期缓存或禁止缓存
- 必须配置缓存清除机制
- 必须区分私有缓存和共享缓存

**缓存配置：**

✅ Correct:

```nginx
# /etc/nginx/conf.d/caching.conf

# 静态资源缓存（长期）
location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    access_log off;
}

# HTML 文件缓存（短期）
location ~* \.html$ {
    expires 1h;
    add_header Cache-Control "public";
}

# API 响应缓存（条件性）
location /api/products/ {
    proxy_cache product_cache;
    proxy_cache_valid 200 10m;
    proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
    proxy_cache_lock on;
    proxy_cache_lock_timeout 5s;

    # 添加缓存状态头
    add_header X-Cache-Status $upstream_cache_status;

    proxy_pass http://api_backend;
}

# 缓存区定义
proxy_cache_path /var/cache/nginx/products
    levels=1:2
    keys_zone=product_cache:10m
    max_size=100m
    inactive=60m;
```

❌ Wrong:

```nginx
# ❌ 静态资源没有缓存
location /static/ {
    proxy_pass http://backend;
}

# ❌ 动态内容设置了过长缓存
location /api/ {
    expires 1d;  # ❌ API 不应长时间缓存
    proxy_pass http://backend;
}
```

**Cache-Control 指令：**

| 指令 | 含义 | 适用场景 |
|------|------|---------|
| `public` | 可被任何缓存存储 | CDN、代理缓存 |
| `private` | 仅浏览器缓存 | 用户特定内容 |
| `no-cache` | 每次使用前验证 | 动态内容 |
| `no-store` | 完全不缓存 | 敏感数据 |
| `immutable` | 资源永不变化 | 带哈希的文件名 |

**缓存状态码：**

| 状态 | 含义 | 说明 |
|------|------|------|
| HIT | 缓存命中 | 直接返回缓存内容 |
| MISS | 缓存未命中 | 从源站获取并缓存 |
| BYPASS | 绕过缓存 | 不满足缓存条件 |
| EXPIRED | 缓存过期 | 重新获取并更新缓存 |
| STALE | 使用过期缓存 | 源站不可用时 |
| UPDATING | 正在更新 | 缓存正在刷新 |

---

### R07 — 性能调优

**MUST** — Nginx 性能调优必须遵循以下规则：

- 根据 CPU 核心数配置 worker_processes
- 启用 keepalive 减少连接开销
- 启用 gzip 压缩减小传输体积
- 配置合适的 buffer 大小

**Worker 配置：**

✅ Correct:

```nginx
# /etc/nginx/snippets/performance.conf

# Worker 进程数（auto 自动匹配 CPU 核心数）
worker_processes auto;

# Worker 连接数
events {
    worker_connections 4096;
    multi_accept on;
    use epoll;
}

# Keepalive 配置
keepalive_timeout 65;
keepalive_requests 1000;

# Gzip 压缩
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

# Buffer 配置
client_body_buffer_size 16k;
client_header_buffer_size 1k;
large_client_header_buffers 4 8k;
output_buffers 4 32k;

# 文件描述符限制
worker_rlimit_nofile 65535;
```

❌ Wrong:

```nginx
# ❌ Worker 进程数固定为 1
worker_processes 1;

# ❌ 连接数过低
events {
    worker_connections 128;
}

# ❌ 未启用 gzip
gzip off;
```

**性能调优参数表：**

| 参数 | 推荐值 | 说明 |
|------|--------|------|
| worker_processes | auto | 自动匹配 CPU 核心数 |
| worker_connections | 4096 | 单 worker 最大连接数 |
| keepalive_timeout | 65s | 长连接超时时间 |
| keepalive_requests | 1000 | 单连接最大请求数 |
| gzip_comp_level | 6 | 压缩级别（1-9） |
| gzip_min_length | 1024 | 最小压缩字节数 |
| client_max_body_size | 10m | 最大请求体大小 |

**TCP 优化（系统层面）：**

```bash
# /etc/sysctl.conf
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.ip_local_port_range = 1024 65535
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_fin_timeout = 30
net.ipv4.tcp_keepalive_time = 600
net.ipv4.tcp_keepalive_intvl = 30
net.ipv4.tcp_keepalive_probes = 3
```

---

### R08 — 健康检查与故障转移

**MUST** — 健康检查配置必须遵循以下规则：

- 必须配置主动健康检查（ngx_http_healthcheck_module）
- 必须配置被动健康检查（proxy_next_upstream）
- 必须定义降级策略
- 必须监控后端服务状态

**健康检查配置：**

✅ Correct:

```nginx
# /etc/nginx/conf.d/healthcheck.conf

upstream api_backend {
    zone api_backend 64k;
    server 10.0.1.101:8080 max_fails=3 fail_timeout=30s;
    server 10.0.1.102:8080 max_fails=3 fail_timeout=30s;
    server 10.0.1.103:8080 backup;

    # 被动健康检查
    proxy_next_upstream error timeout http_502 http_503 http_504;
    proxy_next_upstream_tries 2;
    proxy_next_upstream_timeout 10s;
}

# 主动健康检查（需要 ngx_http_healthcheck_module）
# 或使用第三方模块如 ngx_upstream_check_module

server {
    listen 80;
    server_name health.example.com;

    # 健康检查端点
    location /health {
        access_log off;
        return 200 '{"status":"ok"}';
        add_header Content-Type application/json;
    }

    # 就绪检查端点（用于容器编排）
    location /ready {
        access_log off;
        # 检查后端服务是否可用
        if ($upstream_status != 200) {
            return 503 '{"status":"not ready"}';
        }
        return 200 '{"status":"ready"}';
    }
}
```

❌ Wrong:

```nginx
# ❌ 没有健康检查配置
upstream api_backend {
    server 10.0.1.101:8080;
    server 10.0.1.102:8080;
}

# ❌ 没有故障转移配置
location /api/ {
    proxy_pass http://api_backend;
}
```

**健康检查参数：**

| 参数 | 说明 | 推荐值 |
|------|------|--------|
| max_fails | 最大失败次数 | 3 |
| fail_timeout | 失败后等待时间 | 30s |
| backup | 备份服务器标记 | 按需配置 |
| down | 永久下线标记 | 维护时使用 |

**故障转移策略：**

```nginx
# 多级故障转移
proxy_next_upstream error timeout invalid_header http_500 http_502 http_503 http_504 http_404;

# 各状态码说明：
# error - 连接错误
# timeout - 超时
# invalid_header - 无效响应头
# http_xxx - 特定 HTTP 状态码
```

**监控指标：**

| 指标 | 告警阈值 | 说明 |
|------|---------|------|
| upstream_response_time | p99 > 1s | 后端响应慢 |
| upstream_connect_time | > 500ms | 连接建立慢 |
| 5xx_rate | > 1% | 后端错误率高 |
| active_connections | > 10000 | 连接数过高 |

---

## Checklist

- [ ] 配置文件按功能拆分，使用 include 组织
- [ ] 主配置文件仅包含全局指令和 include 引用
- [ ] Upstream 定义分离到独立文件
- [ ] 反向代理配置 upstream + proxy_pass
- [ ] 配置健康检查和故障转移
- [ ] 传递客户端真实 IP（X-Forwarded-For）
- [ ] 合理设置超时参数
- [ ] SSL 使用 TLS 1.2+，禁用弱加密套件
- [ ] 启用 HSTS，配置 OCSP Stapling
- [ ] 证书来自可信 CA，配置自动续期
- [ ] 配置安全响应头（X-Frame-Options、CSP 等）
- [ ] CSP 策略根据实际需求设置，避免过于宽松
- [ ] 配置请求速率限制和并发限制
- [ ] 不同接口设置不同的限流策略
- [ ] 静态资源设置长期缓存，API 设置短期缓存
- [ ] 配置缓存清除机制
- [ ] worker_processes 设置为 auto
- [ ] 启用 keepalive 和 gzip 压缩
- [ ] 配置合适的 buffer 大小
- [ ] 配置主动和被动健康检查
- [ ] 定义降级策略和故障转移规则
