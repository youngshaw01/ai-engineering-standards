# Docker

## Overview

Docker 工程规范，涵盖 Dockerfile 编写、镜像标签管理、安全最佳实践、docker-compose 配置、数据管理、网络配置、日志管理、资源限制、构建优化和运行时管理。适用于所有使用容器化部署的项目。

---

## Rules

### R01 — Dockerfile 规范

**MUST** — Dockerfile 必须遵循以下规则：

- 使用多阶段构建（Multi-stage Build），将构建环境与运行环境分离
- 基础镜像选择官方镜像或企业级镜像（如 `registry.cn-hangzhou.aliyuncs.com/xxx`）
- 每条指令单独成行，避免过长的单行命令
- 合理利用层缓存，变化频率低的指令放在前面
- 禁止在生产镜像中包含调试工具（curl、wget、ssh、telnet）
- 最终镜像仅包含运行所需的最小文件集

**多阶段构建原则：**

| 阶段 | 用途 | 示例 |
|------|------|------|
| builder | 编译构建 | Go / Java Maven / Node.js build |
| runtime | 运行应用 | Python / Node.js runtime only |
| test | 运行测试（可选） | pytest / JUnit |

✅ Correct:

```dockerfile
# ========== Stage 1: Build ==========
FROM golang:1.22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache git
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app/server ./cmd/server

# ========== Stage 2: Runtime ==========
FROM alpine:3.19
RUN apk add --no-cache ca-certificates tzdata
WORKDIR /app
COPY --from=builder /app/server /app/server
EXPOSE 8080
USER nobody
ENTRYPOINT ["/app/server"]
```

```dockerfile
# ========== Stage 1: Build ==========
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# ========== Stage 2: Runtime ==========
FROM node:20-alpine
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3000
USER appuser
CMD ["node", "dist/main.js"]
```

❌ Wrong:

```dockerfile
FROM golang:1.22
WORKDIR /app
COPY . .
RUN go build -o server ./cmd/server
RUN apt-get update && apt-get install -y curl
CMD ["./server"]
```

**层缓存优化顺序：**

```dockerfile
# ✅ 正确：先复制依赖文件，再复制源码
COPY go.mod go.sum ./
RUN go mod download          # 依赖不变时复用缓存
COPY . .                     # 源码变更时才重新执行
RUN go build ./cmd/server

# ❌ 错误：源码在前，依赖在后
COPY . .
RUN go mod download          # 每次源码变更都导致缓存失效
RUN go build ./cmd/server
```

---

### R02 — 镜像标签与版本

**MUST** — 镜像标签管理必须遵循以下规则：

- 禁止使用 `:latest` 标签，必须使用确定性标签
- 使用 Semantic Versioning（语义化版本）格式
- 镜像标签不可变，同一标签始终指向同一镜像内容
- 标签必须包含版本号和构建元信息

**标签命名规范：**

| 标签格式 | 适用场景 | 示例 |
|----------|---------|------|
| `{service}:{version}` | 生产环境推荐 | `myapp:1.2.3` |
| `{service}:{major}.{minor}` | 兼容性验证 | `myapp:1.2` |
| `{service}:{branch}-{sha}` | CI/CD 构建 | `myapp:main-a1b2c3d` |
| `{service}:{date}-{version}` | 发布快照 | `myapp:20240115-1.2.3` |

✅ Correct:

```bash
# 明确版本标签
docker build -t myapp:1.2.3 -t myapp:1.2 .

# CI/CD 中使用分支 + SHA 标签
docker build -t myapp:main-$(git rev-parse --short HEAD) .

# 推送到仓库
docker push registry.example.com/team/myapp:1.2.3
```

❌ Wrong:

```bash
# ❌ 使用 latest 标签
docker build -t myapp:latest .

# ❌ 无版本标签
docker build -t myapp .

# ❌ 使用日期作为唯一标识（无法追溯代码版本）
docker build -t myapp:20240115 .
```

**镜像标签策略：**

- **MUST** — 生产环境使用固定版本标签（如 `1.2.3`）
- **SHOULD** — 预发环境使用 `{version}-rc` 标签（如 `1.2.3-rc1`）
- **SHOULD** — CI/CD 自动构建使用 `{branch}-{short-sha}` 标签
- **MAY** — 开发环境可使用 `{branch}-latest` 但需在文档中说明风险

---

### R03 — 安全最佳实践

**MUST** — 容器安全必须遵循以下规则：

- 禁止以 root 用户运行应用进程
- 使用最小基础镜像（Alpine / Distroless / Scratch）
- 敏感信息通过环境变量或 Secret 注入，禁止写入镜像
- 定期扫描镜像漏洞，Critical / High 级别漏洞必须在 7 天内修复
- 禁止安装不必要的包（如 `vim`、`telnet`、`ssh`）

**非 root 用户运行方式：**

✅ Correct:

```dockerfile
# 方式一：使用 USER 指令
FROM node:20-alpine
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
# ... 后续操作 ...
USER appuser
CMD ["node", "server.js"]

# 方式二：Distroless 镜像（无需创建用户）
FROM gcr.io/distroless/nodejs20-debian12
COPY --chown=nonroot:nonroot . .
CMD ["server.js"]
```

❌ Wrong:

```dockerfile
# ❌ 默认以 root 运行
FROM node:20-alpine
COPY . .
CMD ["node", "server.js"]

# ❌ 赋予 root 权限
RUN chmod +x /usr/bin/sudo
```

**基础镜像选择对比：**

| 镜像类型 | 大小 | 安全性 | 适用场景 |
|----------|------|--------|---------|
| Alpine | ~5 MB | 高 | 通用后端服务 |
| Distroless | ~15 MB | 极高 | 安全要求极高的场景 |
| Full (Ubuntu/Debian) | ~150 MB | 低 | 需要完整系统工具的场景 |

**敏感信息处理：**

✅ Correct:

```dockerfile
# ❌ 禁止在 Dockerfile 中硬编码密钥
# ENV DB_PASSWORD=secret123

# ✅ 通过环境变量注入
ARG DB_PASSWORD
ENV DB_PASSWORD=${DB_PASSWORD}
```

```yaml
# docker-compose.yml 中使用 env_file 或 environment
services:
  app:
    env_file:
      - .env.production
    environment:
      - DB_PASSWORD=${DB_PASSWORD}
```

**镜像扫描要求：**

| 工具 | 集成方式 | 说明 |
|------|---------|------|
| Trivy | CI/CD Pipeline | 开源，支持 OS + 语言包扫描 |
| Snyk | CI/CD Pipeline | 商业工具，提供修复建议 |
| Docker Scout | Docker CLI | Docker 原生集成 |
| Grype | CI/CD Pipeline | 基于 SBOM 扫描 |

---

### R04 — docker-compose 规范

**MUST** — docker-compose 配置必须遵循以下规则：

- 服务定义必须包含健康检查（healthcheck）
- 服务间依赖使用 depends_on + healthcheck 条件
- 环境变量通过 .env 文件或 environment 注入，禁止硬编码
- 每个服务必须声明 restart 策略
- 配置文件按环境分离（docker-compose.dev.yml / docker-compose.prod.yml）

**服务定义规范：**

✅ Correct:

```yaml
version: "3.8"

services:
  app:
    image: myapp:1.2.3
    ports:
      - "8080:8080"
    environment:
      - DB_HOST=postgres
      - REDIS_HOST=redis
      - APP_ENV=production
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: "1.0"

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

❌ Wrong:

```yaml
version: "3.8"

services:
  app:
    image: myapp:latest
    ports:
      - "8080:8080"
    environment:
      DB_PASSWORD: hardcoded_password_123  # ❌ 硬编码密码
    depends_on:
      - postgres                            # ❌ 未等待数据库就绪
      - redis                               # ❌ 未等待 Redis 就绪
    # ❌ 缺少 healthcheck
    # ❌ 缺少 restart 策略
    # ❌ 缺少资源限制

  postgres:
    image: postgres:latest                  # ❌ 使用 latest 标签
    environment:
      POSTGRES_PASSWORD: secret123         # ❌ 硬编码密码
    # ❌ 缺少 healthcheck
    # ❌ 缺少 restart 策略
```

**环境变量管理：**

```bash
# .env.production
DB_USER=myapp_user
DB_PASSWORD=${VAULT_DB_PASSWORD}   # 从密钥管理系统获取
REDIS_PASSWORD=${VAULT_REDIS_PASSWORD}
APP_ENV=production
LOG_LEVEL=info
```

---

### R05 — 数据管理

**MUST** — 容器数据管理必须遵循以下规则：

- 持久化数据必须使用 Volume，禁止使用 Bind Mount（生产环境）
- Volume 必须使用命名卷（named volume），禁止匿名卷
- 临时数据使用 tmpfs 挂载
- 重要数据必须制定备份策略并定期验证恢复

**Volume vs Bind Mount 对比：**

| 特性 | Named Volume | Bind Mount | tmpfs |
|------|-------------|------------|-------|
| 数据持久化 | 是（Docker 管理） | 是（宿主机路径） | 否（内存中） |
| 可移植性 | 高 | 低（依赖宿主机路径） | 高 |
| 权限管理 | Docker 控制 | 宿主机控制 | 容器内控制 |
| 适用场景 | 数据库文件、上传目录 | 开发环境热重载 | 临时文件、敏感凭据 |

✅ Correct:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data  # ✅ 命名卷
      - backups:/backups:ro                      # ✅ 只读挂载备份目录
      - /tmp/temp_data:/tmp/temp_data:rw        # ⚠️ Bind Mount 仅限开发环境

volumes:
  postgres_data:
    driver: local
  backups:
    driver: local
```

```yaml
# 临时敏感数据使用 tmpfs
services:
  app:
    tmpfs:
      - /run/secrets:noexec,nosuid,size=64M
    secrets:
      - db_password

secrets:
  db_password:
    external: true
```

❌ Wrong:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    volumes:
      # ❌ 匿名卷（重启后数据丢失且难以管理）
      - /var/lib/postgresql/data
      # ❌ Bind Mount 到生产环境（路径依赖宿主机）
      - /data/postgres:/var/lib/postgresql/data
```

**Volume 命名规范：**

```
{service}_{purpose}

示例：
postgres_data
redis_data
app_uploads
app_logs
elasticsearch_data
```

**备份策略：**

| 数据类型 | 备份频率 | 保留策略 | 存储位置 |
|----------|---------|---------|---------|
| 数据库 | 每日全量 + 实时 WAL | 30 天 | 对象存储 + 本地 |
| 上传文件 | 每日增量 | 7 天 | 对象存储 |
| 配置文件 | 每次变更 | 永久 | Git 仓库 |

**备份命令示例：**

```bash
# PostgreSQL 备份
docker exec postgres pg_dump -U myapp_user myapp | gzip > backup_$(date +%Y%m%d).sql.gz

# Volume 备份（使用 docker run 临时容器）
docker run --rm -v postgres_data:/source -v $(pwd):/backup alpine tar czf /backup/data_$(date +%Y%m%d).tar.gz /source
```

---

### R06 — 网络配置

**MUST** — 容器网络配置必须遵循以下规则：

- 服务间通信使用内部网络，禁止暴露不必要端口
- 仅对外暴露必要的服务端口
- 使用自定义网络隔离不同服务组
- 禁止使用 `host` 网络模式（除非有明确的性能需求）

**网络模式对比：**

| 模式 | 隔离性 | 性能 | 适用场景 |
|------|--------|------|---------|
| bridge | 容器隔离 | 中等 | 单机多服务 |
| host | 无隔离 | 最高 | 性能敏感场景 |
| overlay | 跨主机隔离 | 较低 | Swarm / K8s |
| none | 完全隔离 | 最低 | 批处理任务 |

✅ Correct:

```yaml
version: "3.8"

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true           # ✅ 后端网络禁止外部访问

services:
  web:
    image: nginx:1.25-alpine
    ports:
      - "80:80"              # ✅ 仅暴露必要端口
      - "443:443"
    networks:
      - frontend
      - backend              # ✅ Web 可以访问后端

  api:
    image: myapp:1.2.3
    expose:
      - "8080"               # ✅ 仅内部暴露，不映射到宿主机
    networks:
      - backend              # ✅ API 仅在后端网络
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    expose:
      - "5432"
    networks:
      - backend
    restart: unless-stopped
```

❌ Wrong:

```yaml
services:
  api:
    image: myapp:latest
    ports:
      - "0.0.0.0:8080:8080"  # ❌ 暴露到所有接口
      - "8081:8080"           # ❌ 不必要的额外映射
    network_mode: host         # ❌ 使用 host 模式，失去隔离性

  postgres:
    image: postgres:latest
    ports:
      - "5432:5432"           # ❌ 数据库端口不应暴露到宿主机
```

**服务发现：**

Docker Compose 内置服务发现，服务名即为 DNS 名称：

```yaml
# 在 api 服务中连接 postgres，使用服务名即可
DATABASE_URL=postgresql://user:pass@postgres:5432/myapp
```

**端口暴露规范：**

| 端口范围 | 服务类型 | 说明 |
|----------|---------|------|
| 80 / 443 | Web 入口 | HTTP/HTTPS |
| 8080-8999 | 应用服务 | API 网关、应用服务 |
| 9000-9999 | 监控服务 | Prometheus、Grafana |
| 3306 / 5432 / 6379 / 9200 | 基础设施 | 仅内部网络 |

---

### R07 — 日志管理

**MUST** — 容器日志管理必须遵循以下规则：

- 配置日志驱动和日志轮转策略，防止磁盘耗尽
- 禁止在容器内持久化日志文件（使用标准输出）
- 集中收集日志到统一平台（ELK / Loki / CloudWatch）
- 日志级别必须可配置，禁止硬编码

**日志驱动配置：**

✅ Correct:

```yaml
services:
  app:
    image: myapp:1.2.3
    logging:
      driver: json-file
      options:
        max-size: "10m"          # 单个日志文件最大 10MB
        max-file: "3"             # 最多保留 3 个文件
        tag: "{{.Name}}"          # 日志标签使用服务名
        compress: "true"          # 压缩旧日志

  # 集中式日志收集
  loki:
    image: grafana/loki:2.9.0
    volumes:
      - loki_data:/loki
    command: -config.file=/etc/loki/local-config.yaml

  promtail:
    image: grafana/promtail:2.9.0
    volumes:
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
    command: -config.file=/etc/promtail/config.yaml
```

❌ Wrong:

```yaml
services:
  app:
    image: myapp:latest
    # ❌ 未配置日志轮转，可能导致磁盘耗尽
    # ❌ 日志文件可能无限增长
```

**日志级别规范：**

| 级别 | 用途 | 生产环境 |
|------|------|---------|
| ERROR | 错误事件 | ✅ 记录 |
| WARN | 警告事件 | ✅ 记录 |
| INFO | 关键业务事件 | ✅ 记录 |
| DEBUG | 调试信息 | ❌ 关闭 |
| TRACE | 详细追踪 | ❌ 关闭 |

**日志格式规范：**

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO",
  "service": "order-api",
  "traceId": "abc123def456",
  "message": "Order created successfully",
  "userId": "user_001",
  "orderId": "ORD-20240115-001"
}
```

**日志采集架构：**

```
Containers (stdout/stderr)
    ↓
Docker Log Driver (json-file / syslog / fluentd)
    ↓
Log Collector (Promtail / Fluentd / Filebeat)
    ↓
Centralized Store (Loki / Elasticsearch / CloudWatch)
    ↓
Query & Alert (Grafana / Kibana / CloudWatch Insights)
```

---

### R08 — 资源限制

**MUST** — 容器资源限制必须遵循以下规则：

- 每个服务必须设置 CPU 和内存限制（limits）
- 内存限制必须低于宿主机可用内存，预留系统资源
- OOM Kill 后必须配置重启策略
- 资源使用率必须纳入监控告警

**资源配置参数：**

| 参数 | 说明 | 示例 |
|------|------|------|
| `memory` | 内存限制 | `512M` |
| `memory-reservation` | 内存软限制 | `256M` |
| `cpus` | CPU 限制（核数） | `1.0` |
| `memory-swap` | 交换内存 | `512M`（等同 swap off） |

✅ Correct:

```yaml
services:
  app:
    image: myapp:1.2.3
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: "1.0"
        reservations:
          memory: 256M
          cpus: "0.5"
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: "2.0"
        reservations:
          memory: 512M
          cpus: "1.0"
    restart: unless-stopped
```

❌ Wrong:

```yaml
services:
  app:
    image: myapp:latest
    # ❌ 未设置资源限制，可能耗尽宿主机资源
    deploy:
      resources: {}
```

**OOM 处理策略：**

| 策略 | 说明 | 适用场景 |
|------|------|---------|
| `kill -9`（默认） | 立即终止容器 | 无状态服务 |
| `oom_score_adj` | 调整 OOM 优先级 | 多服务共存 |
| `memory-swap` | 启用交换分区 | 允许短暂内存溢出 |
| 优雅退出 | 捕获 SIGTERM，完成请求后退出 | 有状态服务 |

**资源预留计算：**

```
宿主机总内存 = 应用容器内存 + 系统预留 + 缓冲区

示例（8GB 宿主机）：
系统预留：512MB
缓冲区：512MB
可用容器内存：~7GB
```

**资源监控指标：**

| 指标 | 告警阈值 | 说明 |
|------|---------|------|
| Memory Usage | > 80% | 接近内存限制 |
| CPU Usage | > 90% | CPU 饱和 |
| Restart Count | > 3/小时 | OOM 或异常退出 |
| Memory Throttling | > 10% | 频繁限流 |

---

### R09 — 构建优化

**MUST** — Docker 构建优化必须遵循以下规则：

- 必须使用 .dockerignore 排除无关文件
- 优先使用 BuildKit（DOCKER_BUILDKIT=1）提升构建速度和缓存效率
- 合理利用缓存挂载（--mount=type=cache）加速依赖安装
- 多平台构建必须显式指定目标平台

**.dockerignore 规范：**

✅ Correct:

```
# .dockerignore

# 版本控制
.git
.gitignore
.github

# IDE
.idea
.vscode
*.swp
*.swo

# 操作系统
.DS_Store
Thumbs.db

# 构建产物
node_modules
target
__pycache__
*.pyc
dist
build
out

# 文档
README.md
CHANGELOG.md
docs/

# 环境配置
.env
.env.local
.env.*.local

# 测试
coverage
.nyc_output
tests/
```

❌ Wrong:

```
# .dockerignore - 过于宽松
*.md
!README.md
```

**BuildKit 优化：**

✅ Correct:

```dockerfile
# 启用 BuildKit 缓存挂载
FROM --platform=$BUILDPLATFORM golang:1.22-alpine AS builder
WORKDIR /app

# 使用 cache mount 加速依赖下载
RUN --mount=type=cache,target=/go/pkg/mod \
    go mod download

# 使用 cache mount 加速构建缓存
RUN --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app/server ./cmd/server
```

```bash
# 启用 BuildKit
export DOCKER_BUILDKIT=1
docker build -t myapp:1.2.3 .

# 或使用 BuildKit 专用命令
docker buildx build --progress=plain -t myapp:1.2.3 .
```

**多平台构建：**

```bash
# 创建构建器
docker buildx create --name multibuilder --use

# 构建多平台镜像
docker buildx build --platform linux/amd64,linux/arm64 \
  -t myapp:1.2.3 \
  --push .
```

**构建优化对比：**

| 优化项 | 效果 | 实施难度 |
|--------|------|---------|
| .dockerignore | 减少构建上下文大小 | 低 |
| BuildKit | 并行构建 + 细粒度缓存 | 低 |
| Cache Mount | 依赖安装加速 | 中 |
| 多阶段构建 | 减小最终镜像体积 | 低 |
| 多平台构建 | 支持不同 CPU 架构 | 中 |

---

### R10 — 运行时管理

**MUST** — 容器运行时管理必须遵循以下规则：

- 必须配置合理的重启策略
- 应用必须实现优雅停止（Graceful Shutdown）
- 信号处理必须正确（SIGTERM → 优雅退出，SIGKILL → 强制终止）
- 健康检查端点必须独立于业务逻辑

**重启策略：**

| 策略 | 行为 | 适用场景 |
|------|------|---------|
| `no` | 不自动重启 | 批处理任务 |
| `always` | 总是重启 | 开发环境 |
| `unless-stopped` | 手动停止前总是重启 | 生产环境 |
| `on-failure[:max-retries]` | 失败时重启 | 有状态服务 |

✅ Correct:

```yaml
services:
  app:
    image: myapp:1.2.3
    restart: unless-stopped   # ✅ 生产环境推荐
    stop_grace_period: 30s    # ✅ 给予 30 秒优雅退出时间
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 15s      # ✅ 启动宽限期
```

❌ Wrong:

```yaml
services:
  app:
    image: myapp:latest
    restart: always            # ❌ 生产环境应使用 unless-stopped
    # ❌ 缺少 stop_grace_period
    # ❌ 缺少 healthcheck
```

**优雅停止实现：**

```python
# Python 优雅停止示例
import signal
import sys

def graceful_shutdown(signum, frame):
    print("Received SIGTERM, shutting down gracefully...")
    # 停止接收新请求
    # 等待现有请求完成
    # 释放资源（数据库连接、锁等）
    sys.exit(0)

signal.signal(signal.SIGTERM, graceful_shutdown)
```

```java
// Spring Boot 优雅停止
@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
// application.yml
server:
  shutdown: graceful
spring:
  lifecycle:
    timeout-per-shutdown-phase: 30s
```

**信号处理流程：**

```
docker stop <container>
    → 发送 SIGTERM
    → 等待 stop_grace_period（默认 10s）
    → 如果容器仍在运行，发送 SIGKILL
    → 容器终止
```

**健康检查端点设计：**

| 检查类型 | 端点 | 说明 |
|----------|------|------|
| Liveness | `/health/live` | 进程存活（返回 200 即存活） |
| Readiness | `/health/ready` | 服务就绪（依赖是否可用） |
| Startup | `/health/startup` | 启动完成（用于 start_period） |

✅ Correct:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8080/health/ready"]
  interval: 30s
  timeout: 5s
  retries: 3
  start_period: 15s
```

---

## Checklist

- [ ] Dockerfile 使用多阶段构建，分离构建环境和运行环境
- [ ] 基础镜像选择官方或企业级镜像，优先使用 Alpine / Distroless
- [ ] Dockerfile 指令顺序优化，依赖文件在前，源码在后
- [ ] 镜像标签使用 Semantic Versioning，禁止使用 :latest
- [ ] 镜像标签不可变，CI/CD 使用 branch+SHA 标签
- [ ] 容器不以 root 用户运行，使用 USER 指令或 Distroless 镜像
- [ ] 敏感信息通过环境变量或 Secret 注入，禁止写入镜像
- [ ] 定期扫描镜像漏洞，Critical/High 级别 7 天内修复
- [ ] docker-compose 每个服务配置 healthcheck 和 restart 策略
- [ ] 服务间依赖使用 depends_on + condition: service_healthy
- [ ] 环境变量通过 .env 文件注入，禁止硬编码
- [ ] 持久化数据使用命名卷（Named Volume），禁止匿名卷
- [ ] 生产环境禁止使用 Bind Mount，临时数据使用 tmpfs
- [ ] 制定数据备份策略，定期验证备份恢复
- [ ] 服务间通信使用内部网络，仅暴露必要端口
- [ ] 后端网络标记为 internal，禁止外部访问
- [ ] 配置日志驱动和轮转策略（max-size + max-file）
- [ ] 日志输出到标准输出/标准错误，禁止持久化日志文件
- [ ] 日志集中收集到统一平台（ELK / Loki / CloudWatch）
- [ ] 每个服务设置 CPU 和内存限制（limits + reservations）
- [ ] 内存限制预留系统资源，OOM 后配置重启策略
- [ ] 资源使用率纳入监控告警
- [ ] 使用 .dockerignore 排除无关文件
- [ ] 启用 BuildKit（DOCKER_BUILDKIT=1）提升构建效率
- [ ] 使用 cache mount 加速依赖安装
- [ ] 多平台构建显式指定目标平台
- [ ] 生产环境使用 restart: unless-stopped
- [ ] 配置 stop_grace_period 实现优雅停止
- [ ] 应用正确处理 SIGTERM 信号
- [ ] 健康检查端点独立于业务逻辑，区分 liveness / readiness
