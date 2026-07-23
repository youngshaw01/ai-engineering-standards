# Monitoring

## Overview

监控工程规范，涵盖监控理念（Golden Signals）、指标设计、告警规则、仪表盘设计、日志聚合、分布式追踪、SLI/SLO/SLA 定义、On-Call 与事件管理。适用于所有需要可观测性的生产系统。

---

## Rules

### R01 — 监控理念（Golden Signals）

**MUST** — 监控系统必须覆盖 Google SRE 定义的四大 Golden Signals：

- **Latency（延迟）**：服务请求的响应时间分布
- **Traffic（流量）**：系统收到的请求量
- **Errors（错误）**：请求失败率或错误码分布
- **Saturation（饱和度）**：资源利用率（CPU、内存、磁盘、网络）

**信号优先级：**

| 信号 | 核心指标 | 告警敏感度 |
|------|---------|-----------|
| Latency | p50 / p95 / p99 | 高 |
| Traffic | QPS / TPS | 中 |
| Errors | 5xx 比例 / 4xx 比例 | 高 |
| Saturation | CPU% / Mem% / Disk% | 中 |

✅ Correct:

```yaml
# Prometheus 指标定义
- name: http_request_duration_seconds
  help: HTTP request latency in seconds
  labels: [method, path, status]
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]

- name: http_requests_total
  help: Total number of HTTP requests
  labels: [method, path, status]

- name: http_errors_total
  help: Total number of HTTP errors
  labels: [method, path, status]

- name: node_cpu_usage_percent
  help: CPU usage percentage
  labels: [instance, job]
```

❌ Wrong:

```yaml
# ❌ 仅监控 CPU 和内存，缺少业务指标
- name: system_cpu_usage
  help: CPU usage

- name: system_memory_usage
  help: Memory usage
```

**指标选择原则：**

- **MUST** — 每个服务至少暴露 Latency + Errors + Saturation 三类指标
- **SHOULD** — 流量指标通过计数器自动计算
- **MAY** — 业务特定指标（如订单量、支付成功率）按需添加

---

### R02 — 指标设计规范

**MUST** — 指标命名必须遵循以下规则：

- 使用小写字母、数字和下划线
- 格式：`{prefix}_{suffix}` 或 `{name}_{unit}`
- Counter 类型使用 `_total` 后缀
- Histogram 类型使用 `_bucket`、`_sum`、`_count` 后缀
- Gauge 类型直接描述当前状态

**命名规范表：**

| 指标类型 | 命名模式 | 示例 |
|---------|---------|------|
| Counter | `{name}_total` | `http_requests_total` |
| Histogram | `{name}_bucket` / `{name}_sum` / `{name}_count` | `http_duration_bucket` |
| Gauge | `{name}` | `node_memory_available_bytes` |
| Summary | `{name}` | `rpc_latency` |

✅ Correct:

```promql
# ✅ 正确的指标命名
http_requests_total{method="GET", path="/api/users"}
http_request_duration_seconds_bucket{le="0.5"}
node_cpu_usage_percent{instance="web-01"}

# ✅ Labels 使用小写，避免动态值
http_requests_total{method="get", status="200"}

# ❌ Labels 包含动态值（用户 ID、IP）
http_requests_total{userId="12345"}  # ❌ 高基数标签
http_requests_total{ip="192.168.1.1"}  # ❌ 高基数标签
```

❌ Wrong:

```promql
# ❌ 驼峰命名
HttpRequestsTotal

# ❌ 缺少单位
http_request_duration

# ❌ Counter 缺少 _total 后缀
http_requests

# ❌ Labels 大写
http_requests_total{Method="GET"}
```

**Histogram Bucket 设计：**

| 场景 | 推荐 Bucket |
|------|-------------|
| API 响应时间 | 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10 |
| 数据库查询 | 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1 |
| 消息处理 | 0.01, 0.05, 0.1, 0.5, 1, 5, 10, 30 |

**Label 基数控制：**

| Label 类型 | 基数上限 | 示例 |
|-----------|---------|------|
| 静态枚举 | < 10 | method, status, endpoint |
| 实例标识 | < 100 | instance, pod |
| 业务维度 | < 1000 | tenant_id, region |
| 禁止使用 | 无限 | user_id, session_id, ip |

---

### R03 — 告警规则设计

**MUST** — 告警规则必须遵循以下规则：

- 告警必须分级：P0（紧急）、P1（严重）、P2（警告）、P3（通知）
- 告警阈值必须基于历史数据设定，禁止拍脑袋
- 告警必须设置抑制关系，避免告警风暴
- 告警必须有明确的 Runbook 链接

**告警级别定义：**

| 级别 | 响应时间 | 升级策略 | 示例 |
|------|---------|---------|------|
| P0 | 5 分钟 | 立即电话通知 | 服务不可用、数据丢失 |
| P1 | 15 分钟 | 短信 + 电话 | 错误率 > 5%、p99 > 10s |
| P2 | 1 小时 | 短信 | CPU > 80%、磁盘 > 85% |
| P3 | 工作日 | 邮件 | 备份失败、证书即将过期 |

✅ Correct:

```yaml
# Prometheus AlertManager 配置
groups:
  - name: service-alerts
    rules:
      # P0: 服务不可用
      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
          runbook: "https://wiki.example.com/runbooks/service-down"
        annotations:
          summary: "Service {{ $labels.job }} is down"
          description: "{{ $labels.instance }} has been unreachable for more than 1 minute."

      # P1: 错误率过高
      - alert: HighErrorRate
        expr: rate(http_errors_total[5m]) / rate(http_requests_total[5m]) > 0.05
        for: 2m
        labels:
          severity: warning
          runbook: "https://wiki.example.com/runbooks/high-error-rate"
        annotations:
          summary: "High error rate on {{ $labels.job }}"
          description: "Error rate is {{ $value | humanizePercentage }} (threshold: 5%)"

      # P2: CPU 使用率过高
      - alert: HighCPUUsage
        expr: node_cpu_usage_percent > 80
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage on {{ $labels.instance }}"
          description: "CPU usage is {{ $value }}%"

# 抑制规则
inhibit_rules:
  - source_match:
      severity: critical
    target_match:
      severity: warning
    equal: ["alertname", "job"]
```

❌ Wrong:

```yaml
# ❌ 缺少告警级别
- alert: SomethingWrong
  expr: some_metric > threshold

# ❌ 没有抑制规则，可能产生大量重复告警
# ❌ 没有 Runbook 链接
```

**告警阈值设定方法：**

| 方法 | 适用场景 | 说明 |
|------|---------|------|
| 基线法 | 稳定服务 | 基于过去 7 天平均值 ± 2σ |
| 趋势法 | 增长型服务 | 基于过去 7 天增长率预测 |
| 容量法 | 资源类指标 | 基于容量规划预留 20% 缓冲 |

---

### R04 — 仪表盘设计

**MUST** — 仪表盘设计必须遵循以下规则：

- 每个服务必须有统一的 Service Overview Dashboard
- 仪表盘按层级组织：Service → Dependency → Capacity
- 关键指标必须一目了然，无需深入探索
- 仪表盘必须标注更新时间和责任人

**仪表盘层级结构：**

```
Service Overview Dashboard
├── Golden Signals（四大信号）
│   ├── Latency: p50 / p95 / p99
│   ├── Traffic: QPS / TPS
│   ├── Errors: 5xx / 4xx rates
│   └── Saturation: CPU / Mem / Disk
├── Business Metrics（业务指标）
│   ├── Active Users
│   ├── Revenue
│   └── Conversion Rate
└── Dependencies（依赖状态）
    ├── Database Connection Pool
    ├── Redis Hit Rate
    └── External API Health
```

✅ Correct:

```yaml
# Grafana Dashboard JSON 结构示例
{
  "dashboard": {
    "title": "Order Service Overview",
    "tags": ["order", "production"],
    "timezone": "browser",
    "panels": [
      {
        "title": "Golden Signals",
        "type": "row",
        "collapsed": false
      },
      {
        "title": "Request Latency (p95)",
        "type": "stat",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "p95"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "thresholds": {
              "steps": [
                {"color": "green", "value": null},
                {"color": "yellow", "value": 0.5},
                {"color": "red", "value": 1}
              ]
            }
          }
        }
      }
    ],
    "annotations": {
      "list": [
        {
          "builtIn": 1,
          "datasource": { "type": "grafana", "uid": "-- Grafana --" },
          "enable": true,
          "hide": true,
          "iconColor": "rgba(0, 211, 255, 1)",
          "name": "Annotations & Alerts",
          "type": "dashboard"
        }
      ]
    }
  }
}
```

❌ Wrong:

```yaml
# ❌ 仪表盘缺少组织结构，所有指标堆在一起
# ❌ 没有区分 Golden Signals 和业务指标
# ❌ 缺少颜色阈值，无法快速判断健康状态
```

**仪表盘配色规范：**

| 状态 | 颜色 | 含义 |
|------|------|------|
| Healthy | Green | 指标正常 |
| Warning | Yellow | 接近阈值 |
| Critical | Red | 超过阈值 |
| Neutral | Gray | 无数据或未知 |

---

### R05 — 日志聚合规范

**MUST** — 日志聚合系统必须遵循以下规则：

- 所有服务日志必须集中收集到统一平台
- 日志格式必须结构化（JSON），便于检索和分析
- 日志必须包含 traceId 用于关联分布式调用链
- 日志保留策略根据重要性分级

**日志架构：**

```
Application Logs (stdout/stderr)
    ↓
Log Collector (Fluentd / Filebeat / Promtail)
    ↓
Centralized Store (Elasticsearch / Loki / CloudWatch)
    ↓
Query & Analysis (Kibana / Grafana / CloudWatch Insights)
```

✅ Correct:

```json
// ✅ 结构化日志格式
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "INFO",
  "service": "order-api",
  "traceId": "abc123def456",
  "spanId": "xyz789",
  "message": "Order created successfully",
  "userId": "user_001",
  "orderId": "ORD-20240115-001",
  "duration": 150,
  "status": "success"
}
```

❌ Wrong:

```
// ❌ 非结构化日志
2024-01-15 10:30:00 INFO Order created for user_001 orderId=ORD-20240115-001

// ❌ 缺少 traceId，无法关联分布式调用
```

**日志级别规范：**

| 级别 | 用途 | 生产环境 | 保留期 |
|------|------|---------|--------|
| ERROR | 错误事件 | ✅ 记录 | 90 天 |
| WARN | 警告事件 | ✅ 记录 | 30 天 |
| INFO | 关键业务事件 | ✅ 记录 | 30 天 |
| DEBUG | 调试信息 | ❌ 关闭 | N/A |
| TRACE | 详细追踪 | ❌ 关闭 | N/A |

**日志采集工具对比：**

| 工具 | 特点 | 适用场景 |
|------|------|---------|
| Fluentd | 插件丰富，统一日志层 | 复杂日志源 |
| Filebeat | 轻量级，资源占用低 | 边缘节点 |
| Promtail | 与 Loki 深度集成 | Grafana 生态 |
| Vector | 高性能，Rust 编写 | 大规模日志 |

---

### R06 — 分布式追踪规范

**MUST** — 分布式追踪系统必须遵循以下规则：

- 必须使用 OpenTelemetry 作为标准采集框架
- 追踪数据必须上报到 Jaeger / Tempo / Zipin 等后端
- 每个请求必须生成唯一 traceId 并贯穿整个调用链
- Span 命名必须遵循 `{operation}` 格式

**OpenTelemetry 配置：**

✅ Correct:

```yaml
# OpenTelemetry Collector 配置
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:
    send_batch_size: 1024
    timeout: 5s
  memory_limiter:
    check_interval: 1s
    limit_percentage: 50

exporters:
  jaeger:
    endpoint: jaeger-collector:14250
    tls:
      insecure: true
  logging:
    loglevel: debug

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [jaeger]
```

❌ Wrong:

```yaml
# ❌ 未配置批处理，可能导致性能问题
# ❌ 未配置内存限制，可能导致 OOM
# ❌ 缺少错误处理机制
```

**Span 命名规范：**

| 操作类型 | 命名格式 | 示例 |
|---------|---------|------|
| HTTP 请求 | `HTTP {METHOD} {path}` | `HTTP GET /api/users` |
| 数据库查询 | `{DB} {operation}` | `postgresql SELECT` |
| 缓存操作 | `{Cache} {operation}` | `redis GET` |
| RPC 调用 | `{RPC} {method}` | `grpc UserService.GetUser` |
| 消息发送 | `{Queue} publish` | `kafka publish` |

**Trace 传播：**

```python
# Python Flask 应用注入追踪
from opentelemetry import trace
from opentelemetry.instrumentation.flask import FlaskInstrumentor

tracer = trace.get_tracer(__name__)
FlaskInstrumentor().instrument_app(app)

@app.route('/api/users')
def get_users():
    with tracer.start_as_current_span("get_users") as span:
        span.set_attribute("user.id", current_user.id)
        return jsonify(users)
```

---

### R07 — SLI/SLO/SLA 定义

**MUST** — 服务可靠性目标必须明确定义 SLI、SLO、SLA：

- **SLI（Service Level Indicator）**：衡量服务质量的具体指标
- **SLO（Service Level Objective）**：SLI 的目标值
- **SLA（Service Level Agreement）**：对用户的正式承诺

**定义流程：**

```
用户需求分析
    ↓
识别关键用户体验指标
    ↓
定义 SLI（可量化指标）
    ↓
设定 SLO（内部目标）
    ↓
制定 SLA（对外承诺）
```

✅ Correct:

```yaml
# 电商订单服务 SLI/SLO/SLA 定义
service: order-service
description: 订单创建与查询服务

sli:
  - name: availability
    description: 服务可用性
    indicator: "uptime_percentage"
    calculation: "(total_time - downtime) / total_time"

  - name: latency
    description: 请求响应延迟
    indicator: "p95_latency_seconds"
    calculation: "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"

  - name: error_rate
    description: 请求错误率
    indicator: "5xx_rate"
    calculation: "rate(http_errors_total{status=~'5..'}[5m]) / rate(http_requests_total[5m])"

slo:
  availability:
    objective: 99.95%
    measurement_period: "30d"
    budget: 0.05%  # 允许的停机时间

  latency:
    objective: "p95 < 500ms"
    measurement_period: "5m"
    budget: "当 p95 >= 500ms 时消耗预算"

  error_rate:
    objective: "< 0.1%"
    measurement_period: "5m"
    budget: 0.1%

sla:
  availability: 99.9%  # 对外承诺略低于内部 SLO
  compensation: "服务不可用时长 × 10 倍 SLA 违约赔偿"
```

❌ Wrong:

```yaml
# ❌ SLI 定义模糊，无法量化
sli:
  - name: performance
    description: "性能好"

# ❌ SLO 没有测量周期
slo:
  latency:
    objective: "fast"

# ❌ SLA 没有赔偿条款
sla:
  availability: 99.9%
```

**Error Budget 计算：**

| SLO 目标 | 月度允许停机时间 | 年度允许停机时间 |
|---------|----------------|----------------|
| 99.9% | 43.8 分钟 | 8.76 小时 |
| 99.95% | 21.9 分钟 | 4.38 小时 |
| 99.99% | 4.38 分钟 | 52.6 分钟 |
| 99.999% | 0.438 分钟 | 5.26 分钟 |

---

### R08 — On-Call 与事件管理

**MUST** — On-Call 与事件管理必须遵循以下规则：

- 必须建立轮值 On-Call 制度，确保 7×24 响应能力
- 必须制定 Incident Response Playbook
- 必须进行事后复盘（Postmortem），产出改进项
- 必须维护 Runbook 文档库

**事件响应流程：**

```
告警触发
    ↓
On-Call 工程师响应（P0: 5min, P1: 15min, P2: 1h）
    ↓
初步诊断（查看监控、日志、追踪）
    ↓
执行 Runbook 或手动修复
    ↓
验证恢复（观察指标恢复正常）
    ↓
通知相关人员
    ↓
事后复盘（48h 内完成）
```

✅ Correct:

```markdown
# Incident Response Playbook

## P0: 服务完全不可用

**症状：**
- 健康检查连续失败超过 3 次
- 所有接口返回 5xx

**响应步骤：**
1. 确认影响范围（哪些服务、多少用户）
2. 检查最近的部署变更
3. 检查基础设施状态（CPU、内存、磁盘）
4. 尝试回滚最近部署
5. 如果无法回滚，尝试扩容或重启
6. 每 5 分钟更新一次状态

**升级条件：**
- 15 分钟内未恢复 → 升级至技术负责人
- 30 分钟内未恢复 → 升级至 CTO

**Runbook 链接：** https://wiki.example.com/runbooks/service-down
```

❌ Wrong:

```markdown
# ❌ 缺少具体响应步骤
# ❌ 没有升级条件
# ❌ 没有 Runbook 链接
```

**Postmortem 模板：**

```markdown
# Postmortem: {incident_title}

## 基本信息
- **日期**: YYYY-MM-DD
- **持续时间**: X 小时 Y 分钟
- **影响范围**: Z 个用户，W 笔交易
- **严重程度**: P0 / P1 / P2

## 时间线
| 时间 | 事件 |
|------|------|
| HH:MM | 告警触发 |
| HH:MM | On-Call 响应 |
| HH:MM | 根因定位 |
| HH:MM | 问题修复 |
| HH:MM | 服务恢复 |

## 根因分析
### 直接原因
...

### 根本原因
...

## 改进措施
| 编号 | 行动项 | 责任人 | 截止日期 | 状态 |
|------|--------|--------|---------|------|
| 1 | ... | ... | ... | 待办 |

## 经验教训
...
```

**On-Call 轮值要求：**

| 项目 | 要求 |
|------|------|
| 轮值周期 | 每周轮换 |
| 交接时间 | 周一上午 10:00 |
| 交接内容 | 未解决问题、待处理告警、特殊注意事项 |
| 休息保障 | 连续值班不超过 2 周，值班后至少休息 1 周 |

---

## Checklist

- [ ] 监控系统覆盖四大 Golden Signals（Latency、Traffic、Errors、Saturation）
- [ ] 指标命名遵循 Prometheus 规范，Counter 使用 _total 后缀
- [ ] Labels 基数可控，禁止使用 user_id、session_id 等高基数标签
- [ ] Histogram Bucket 设计合理，覆盖典型延迟分布
- [ ] 告警规则分级（P0-P3），每条告警有 Runbook 链接
- [ ] 告警阈值基于历史数据设定，设置抑制规则避免告警风暴
- [ ] 仪表盘按层级组织：Service → Dependency → Capacity
- [ ] 仪表盘关键指标一目了然，配有颜色阈值
- [ ] 日志格式结构化（JSON），包含 traceId
- [ ] 日志集中收集到统一平台，保留策略分级
- [ ] 使用 OpenTelemetry 采集追踪数据，上报到 Jaeger/Tempo
- [ ] Span 命名遵循 `{operation}` 格式，traceId 贯穿调用链
- [ ] 明确定义 SLI、SLO、SLA，Error Budget 可计算
- [ ] SLO 目标与业务需求匹配，SLA 承诺略低于内部 SLO
- [ ] 建立 On-Call 轮值制度，确保 7×24 响应能力
- [ ] 制定 Incident Response Playbook，明确响应步骤和升级条件
- [ ] 每次 P0/P1 事件在 48 小时内完成 Postmortem
- [ ] 维护 Runbook 文档库，定期更新
