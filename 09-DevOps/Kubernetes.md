# Kubernetes

## Overview

Kubernetes 容器编排工程规范，涵盖资源对象选型、资源配额、健康检查、配置管理、网络策略、存储管理、调度策略、安全加固、Helm/Kustomize 工程化及可观测性等。适用于以 Kubernetes 为部署平台的微服务项目。

---

## Rules

### R01 — 资源对象选型规范

**MUST** — 根据业务场景选择合适的 Workload 控制器：

| 控制器 | 适用场景 | 特点 |
|--------|---------|------|
| `Deployment` | 无状态应用 | ReplicaSet 滚动更新，大多数场景默认选择 |
| `StatefulSet` | 有状态应用（需要稳定网络标识、持久存储、有序部署） | 固定 Pod 名称、有序启停、Headless Service |
| `DaemonSet` | 每个 Node 运行一个 Pod（日志采集、监控 Agent、存储驱动） | 自动匹配新 Node |
| `Job` / `CronJob` | 一次性任务 / 定时任务 | 完成后自动终止 |

**MUST** — 禁止使用 `ReplicationController`（已废弃），使用 `Deployment` 替代。

**MUST** — Pod 模板必须包含以下字段：

- `replicas`：明确指定副本数（由 HPA 管理的也应设初始值）
- `labels`：至少包含 `app` 和 `version` 标签
- `selector`：必须与 `spec.template.metadata.labels` 匹配

✅ Correct:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ord-order
  labels:
    app: ord-order
    version: v1
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ord-order
      version: v1
  template:
    metadata:
      labels:
        app: ord-order
        version: v1
    spec:
      containers:
        - name: ord-order
          image: registry.example.com/ord-order:v1.0.0
          ports:
            - containerPort: 8080
```

❌ Wrong:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ord-order
spec:
  # 缺少 selector
  template:
    metadata:
      # 缺少 labels
    spec:
      containers:
        - name: ord-order
          image: registry.example.com/ord-order:latest
          # 缺少 containerPort
```

**标签规范：**

| 标签键 | 说明 | 示例 |
|--------|------|------|
| `app` | 应用名称（必填） | `ord-order` |
| `version` | 版本号 | `v1.0.0` |
| `tier` | 层级（frontend / backend / data） | `backend` |
| `env` | 环境（dev / staging / prod） | `prod` |
| `component` | 组件类型（api / worker / web） | `api` |

**注解规范：**

| 注解键 | 用途 |
|--------|------|
| `kubectl.kubernetes.io/restartedAt` | 手动重启记录 |
| `prometheus.io/scrape` | Prometheus 采集标记 |
| `prometheus.io/port` | Prometheus 采集端口 |
| `prometheus.io/path` | Prometheus 采集路径 |

---

### R02 — 资源配额管理

**MUST** — 所有 Pod 必须设置 `resources.requests` 和 `resources.limits`：

| 资源类型 | requests 含义 | limits 含义 | 建议比例 |
|----------|-------------|------------|---------|
| CPU | 最低保障 | 硬上限 | limits = 2~3 × requests |
| 内存 | 最低保障 | 硬上限 | limits = 1~2 × requests |

**MUST** — 命名空间必须配置 `ResourceQuota` 和 `LimitRange`：

✅ Correct:

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: team-a-quota
  namespace: team-a
spec:
  hard:
    requests.cpu: "8"
    requests.memory: 16Gi
    limits.cpu: "16"
    limits.memory: 32Gi
    pods: "50"
    services: "20"
---
apiVersion: v1
kind: LimitRange
metadata:
  name: team-a-limits
  namespace: team-a
spec:
  limits:
    - type: Container
      default:
        cpu: "500m"
        memory: 512Mi
      defaultRequest:
        cpu: "100m"
        memory: 128Mi
      max:
        cpu: "2"
        memory: 2Gi
```

❌ Wrong:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: ord-order
spec:
  containers:
    - name: ord-order
      resources:
        # 缺少 requests 和 limits
```

**QoS 等级说明：**

| QoS 等级 | 条件 | 驱逐优先级 |
|----------|------|-----------|
| Guaranteed | requests == limits（CPU 和内存均设置） | 最低（最不容易被驱逐） |
| Burstable | requests < limits | 中等 |
| BestEffort | requests 和 limits 均未设置 | 最高（最先被驱逐） |

**MUST** — 生产环境 Pod 必须达到 `Guaranteed` 或 `Burstable` QoS，禁止 `BestEffort`。

**内存单位换算参考：**

| 单位 | 换算 |
|------|------|
| `1Ki` | 1024 bytes |
| `1Mi` | 1024 Ki = 1,048,576 bytes |
| `1Gi` | 1024 Mi |
| `1Ti` | 1024 Gi |

---

### R03 — 健康检查配置

**MUST** — 所有工作负载必须配置存活探针（`livenessProbe`）和就绪探针（`readinessProbe`）。

**探针类型选择：**

| 探针类型 | 用途 | 失败后果 |
|----------|------|---------|
| `livenessProbe` | 检测容器是否存活 | 重启容器 |
| `readinessProbe` | 检测容器是否就绪 | 从 Service Endpoints 摘除 |
| `startupProbe` | 检测应用是否启动完成 | 在启动期间禁用 livenessProbe |

**MUST** — 启动时间较长的应用必须使用 `startupProbe`，避免 livenessProbe 误杀。

✅ Correct:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ord-order
spec:
  template:
    spec:
      containers:
        - name: ord-order
          startupProbe:
            httpGet:
              path: /actuator/health
              port: 8080
            failureThreshold: 30
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /actuator/health/liveness
              port: 8080
            initialDelaySeconds: 0
            periodSeconds: 15
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /actuator/health/readiness
              port: 8080
            initialDelaySeconds: 0
            periodSeconds: 10
            failureThreshold: 3
```

❌ Wrong:

```yaml
containers:
  - name: ord-order
    # 缺少任何探针
```

**探针参数推荐值：**

| 参数 | 推荐值 | 说明 |
|------|--------|------|
| `initialDelaySeconds` | 0（配合 startupProbe） | startupProbe 通过后才开始探测 |
| `periodSeconds` | liveness: 15 / readiness: 10 | 探测间隔 |
| `failureThreshold` | liveness: 3 / readiness: 3 | 连续失败次数阈值 |
| `timeoutSeconds` | 5 | 单次探测超时 |
| `successThreshold` | 1 | liveness 必须为 1；readiness 可为 1 |

**探针端点规范：**

**MUST** — 健康检查端点必须独立于业务接口，使用专用路径：

| 端点 | 用途 |
|------|------|
| `/actuator/health` | Spring Boot Actuator 标准端点 |
| `/healthz` | Kubernetes 约定俗成 |
| `/readyz` | 就绪检查 |
| `/livez` | 存活检查 |

---

### R04 — 配置管理规范

**MUST** — 非敏感配置使用 `ConfigMap`，敏感信息使用 `Secret`，禁止将配置硬编码到镜像中。

**MUST** — `ConfigMap` 和 `Secret` 的 Key 命名遵循 snake_case：

✅ Correct:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ord-order-config
data:
  SPRING_PROFILES_ACTIVE: "prod"
  LOG_LEVEL: "INFO"
  DB_MAX_POOL_SIZE: "20"
---
apiVersion: v1
kind: Secret
metadata:
  name: ord-order-secret
type: Opaque
data:
  DB_PASSWORD: cGFzc3dvcmQxMjM0  # base64 编码
  REDIS_PASSWORD: cnVudGltZXByb2R1Y3Rpb24=
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ord-order
spec:
  template:
    spec:
      containers:
        - name: ord-order
          envFrom:
            - configMapRef:
                name: ord-order-config
            - secretRef:
                name: ord-order-secret
          env:
            - name: DB_HOST
              valueFrom:
                configMapKeyRef:
                  name: ord-order-config
                  key: DB_HOST
```

❌ Wrong:

```yaml
# ConfigMap 中存储敏感信息
apiVersion: v1
kind: ConfigMap
metadata:
  name: ord-order-config
data:
  DB_PASSWORD: "mypassword"  # 敏感信息不应放在 ConfigMap
```

**配置热更新：**

| 方式 | 适用场景 | 是否需要重启 |
|------|---------|-------------|
| 环境变量 | 简单配置 | 是（需重建 Pod） |
| `envFrom` | 批量配置 | 是（需重建 Pod） |
| Volume 挂载文件 | 配置文件 | 否（取决于应用实现） |
| Substitution + Volume | 复杂模板渲染 | 否 |

**MUST** — 使用 Volume 挂载的配置文件，应用必须监听文件变更并自动重载（如 Spring Cloud Kubernetes Config）。

**Secret 加密：**

**MUST** — 生产环境必须启用 Secret 加密（EncryptionConfiguration）：

```yaml
apiVersion: apiserver.k8s.io/v1
kind: EncryptionConfiguration
resources:
  - resources:
      - secrets
    providers:
      - kms:
          name: gcp-kms
          endpoint: https://www.googleapis.com/compute/v1/projects/my-project/locations/global/keyRings/my-keyring/cryptoKeys/my-key
      - identity: {}
```

---

### R05 — 网络策略规范

**MUST** — 每个 Service 必须明确指定 `type`，并根据场景选择合适的类型：

| Service 类型 | 适用场景 | 特点 |
|--------------|---------|------|
| `ClusterIP` | 仅集群内部访问 | 默认类型，最安全 |
| `NodePort` | 开发测试、临时暴露 | 端口范围 30000-32767 |
| `LoadBalancer` | 云厂商生产环境 | 需要外部 LB 支持 |
| `Headless` | StatefulSet / 自定义 DNS | 不分配 ClusterIP |

**MUST** — 生产环境入口统一使用 Ingress 而非多个 NodePort / LoadBalancer。

✅ Correct:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: ord-order
  labels:
    app: ord-order
spec:
  type: ClusterIP
  selector:
    app: ord-order
  ports:
    - name: http
      port: 80
      targetPort: 8080
      protocol: TCP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ord-order-ingress
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - order.example.com
      secretName: order-tls
  rules:
    - host: order.example.com
      http:
        paths:
          - path: /api/orders
            pathType: Prefix
            backend:
              service:
                name: ord-order
                port:
                  number: 80
```

❌ Wrong:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: ord-order
spec:
  # 未指定 type，默认 ClusterIP 但缺少明确意图
  ports:
    - port: 8080  # 与 targetPort 相同，冗余
```

**NetworkPolicy 规范：**

**SHOULD** — 命名空间默认拒绝所有入站流量，按需开放：

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all-ingress
  namespace: team-a
spec:
  podSelector: {}
  policyTypes:
    - Ingress
```

**服务发现：**

| 方式 | 格式 | 说明 |
|------|------|------|
| 环境变量 | `<SERVICE_NAME>_SERVICE_HOST` | 仅同命名空间，不跨命名空间 |
| DNS | `<service>.<namespace>.svc.cluster.local` | 推荐方式，跨命名空间可用 |
| Headless Service | `<statefulset>-<ordinal>.<headless-service>` | StatefulSet Pod 间通信 |

**MUST** — 跨命名空间调用必须使用完整 DNS 名称，禁止依赖环境变量。

---

### R06 — 存储管理规范

**MUST** — 持久化数据必须使用 PVC，禁止在 Pod 内直接使用宿主机目录。

**StorageClass 选择：**

| 场景 | StorageClass | 说明 |
|------|-------------|------|
| 开发测试 | `standard` | 默认，HDD |
| 生产数据库 | `ssd` / `premium` | SSD，低延迟 |
| 高性能计算 | `nfs` / `local` | Local PV，最高性能 |
| 归档冷数据 | `cold` | 低成本大容量 |

✅ Correct:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: ord-order-pvc
  namespace: team-a
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: ssd
  resources:
    requests:
      storage: 50Gi
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: ord-order
spec:
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes:
          - ReadWriteOnce
        storageClassName: ssd
        resources:
          requests:
            storage: 50Gi
  template:
    spec:
      containers:
        - name: ord-order
          volumeMounts:
            - name: data
              mountPath: /data
```

❌ Wrong:

```yaml
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      volumes:
        - name: data
          hostPath:
            path: /data/ord-order  # 禁止使用 hostPath，数据无法迁移
```

**数据安全：**

**MUST** — 敏感数据的 PVC 必须启用静态加密或使用 CSI 加密插件。

**MUST** — 删除 PVC 前必须先备份数据：

```bash
# 创建快照
kubectl create snapshot --from-pvc ord-order-pvc --name ord-order-backup-$(date +%Y%m%d)
```

**备份策略：**

| 策略 | 频率 | 保留期 | 工具 |
|------|------|--------|------|
| 全量备份 | 每日 | 30 天 | Velero / CSI Snapshot |
| 增量备份 | 每小时 | 7 天 | Velero |
| 实时同步 | 持续 | 实时 | 数据库主从复制 |

**MUST** — 定期验证备份恢复流程（至少每季度一次）。

---

### R07 — 调度策略规范

**MUST** — 关键业务 Pod 必须配置反亲和性（`anti-affinity`），确保高可用。

**节点选择器优先级：**

| 策略 | 优先级 | 说明 |
|------|--------|------|
| `nodeSelector` | 低 | 简单键值匹配 |
| `nodeAffinity` | 中 | 灵活表达式匹配 |
| `podAntiAffinity` | 高 | 分散 Pod 到不同节点 |
| `topologySpreadConstraints` | 最高 | 跨区域均匀分布 |

✅ Correct:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ord-order
spec:
  replicas: 6
  template:
    spec:
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchExpressions:
                    - key: app
                      operator: In
                      values:
                        - ord-order
                topologyKey: kubernetes.io/hostname
      topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: topology.kubernetes.io/zone
          whenUnsatisfiable: DoNotSchedule
          labelSelector:
            matchLabels:
              app: ord-order
```

❌ Wrong:

```yaml
spec:
  replicas: 6
  template:
    spec:
      # 无反亲和性配置，6 个副本可能全部调度到同一节点
      containers:
        - name: ord-order
```

**Taint 与 Toleration：**

| 场景 | Taint 效果 | Toleration 配置 |
|------|-----------|----------------|
| 专用节点 | NoExecute | 仅特定 Pod 可容忍 |
| 维护窗口 | NoSchedule | 允许但不强求调度 |
| GPU 节点 | 含 GPU 标签 | 仅 AI 训练 Pod 容忍 |

**MUST** — 专用节点必须使用 `NoExecute` taint，防止无关 Pod 调度：

```yaml
apiVersion: v1
kind: Node
metadata:
  name: dedicated-gpu-node
spec:
  taints:
    - effect: NoExecute
      key: dedicated
      value: gpu
```

**Pod 拓扑分布约束：**

**SHOULD** — 多副本 Pod 跨可用区分布：

```yaml
topologySpreadConstraints:
  - maxSkew: 1
    topologyKey: topology.kubernetes.io/zone
    whenUnsatisfiable: DoNotSchedule
    labelSelector:
      matchLabels:
        app: ord-order
```

> `maxSkew: 1` 表示各区域副本数差不超过 1；`whenUnsatisfiable: DoNotSchedule` 表示无法满足时不调度（硬约束）。

---

### R08 — 安全规范

**MUST** — 命名空间必须配置 RBAC，遵循最小权限原则。

**RBAC 角色粒度：**

| 角色级别 | 适用场景 | 示例 |
|----------|---------|------|
| ClusterRole | 集群级资源 | 监控、日志采集 |
| Role | 命名空间级资源 | 应用日常运维 |
| ServiceAccount | Pod 身份 | Pod 访问 API Server |

✅ Correct:

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: ord-order-sa
  namespace: team-a
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: ord-order-role
  namespace: team-a
rules:
  - apiGroups: [""]
    resources: ["configmaps", "secrets"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["apps"]
    resources: ["deployments"]
    verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: ord-order-binding
  namespace: team-a
subjects:
  - kind: ServiceAccount
    name: ord-order-sa
roleRef:
  kind: Role
  name: ord-order-role
  apiGroup: rbac.authorization.k8s.io
```

❌ Wrong:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: ord-order-role
rules:
  - apiGroups: ["*"]
    resources: ["*"]
    verbs: ["*"]  # 通配符权限，违反最小权限原则
```

**Pod Security Standards：**

**MUST** — 命名空间必须绑定 Pod Security Standard 策略：

| 策略级别 | 要求 | 适用场景 |
|----------|------|---------|
| `privileged` | 无限制 | 系统级组件（如 CNI、CSI） |
| `baseline` | 禁止已知提权模式 | 大多数应用（推荐） |
| `restricted` | 严格限制（Seccomp、AppArmor、非 root） | 高安全要求场景 |

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: team-a
  labels:
    pod-security.kubernetes.io/enforce: baseline
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
```

**SecurityContext 规范：**

**MUST** — 容器必须以非 root 用户运行：

```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  fsGroup: 1000
```

**MUST** — 启用 Seccomp Profile：

```yaml
securityContext:
  seccompProfile:
    type: RuntimeDefault
```

**Secret 管理：**

**MUST** — 禁止将 Secret 以明文形式提交到代码仓库。

**MUST** — 使用 Sealed Secrets 或 External Secrets Operator 管理跨环境 Secret：

| 方案 | 适用场景 | 说明 |
|------|---------|------|
| Sealed Secrets | GitOps 场景 | Bitnami 出品，加密后可安全提交 |
| External Secrets | 对接云厂商 KMS | AWS Secrets Manager / GCP Secret Manager |
| Vault | 企业级密钥管理 | HashiCorp Vault 集成 |

---

### R09 — Helm 与 Kustomize 规范

**MUST** — 生产环境部署必须使用 Helm Chart 或 Kustomize，禁止直接提交原始 YAML。

**Helm Chart 结构规范：**

```
charts/ord-order/
├── Chart.yaml          # Chart 元信息
├── values.yaml         # 默认值
├── values-dev.yaml     # 开发环境覆盖
├── values-staging.yaml # 预发环境覆盖
├── values-prod.yaml    # 生产环境覆盖
├── templates/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── configmap.yaml
│   ├── secret.yaml
│   ├── hpa.yaml
│   └── _helpers.tpl    # 模板辅助函数
└── charts/             # 子 Chart 依赖
```

**values.yaml 设计规范：**

✅ Correct:

```yaml
# values.yaml - 默认值（开发环境友好）
replicaCount: 1
image:
  repository: registry.example.com/ord-order
  tag: latest
  pullPolicy: IfNotPresent
resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 512Mi
service:
  type: ClusterIP
  port: 80
ingress:
  enabled: false
autoscaling:
  enabled: false
```

❌ Wrong:

```yaml
# values.yaml - 生产值混入默认值
replicaCount: 3
image:
  tag: v1.0.0  # 应使用 chart 版本号或 appVersion 关联
resources:
  requests:
    cpu: "2"   # 默认值过高，影响开发环境资源利用率
    memory: 2Gi
```

**Chart 版本管理：**

**MUST** — `Chart.yaml` 中的 `version` 遵循 SemVer，每次发布递增：

```yaml
apiVersion: v2
name: ord-order
description: Order Service Helm Chart
type: application
version: 1.2.0        # Chart 版本
appVersion: "1.0.0"   # 应用版本
```

**Kustomize Overlay 规范：**

```
infra/k8s/
├── base/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── configmap.yaml
│   └── kustomization.yaml
├── overlays/
│   ├── dev/
│   │   ├── patch.yaml
│   │   └── kustomization.yaml
│   ├── staging/
│   │   ├── patch.yaml
│   │   └── kustomization.yaml
│   └── prod/
│       ├── patch.yaml
│       ├── hpa.yaml
│       └── kustomization.yaml
```

**kustomization.yaml 示例：**

```yaml
# base/kustomization.yaml
resources:
  - deployment.yaml
  - service.yaml
  - configmap.yaml
commonLabels:
  app: ord-order
```

```yaml
# overlays/prod/kustomization.yaml
bases:
  - ../base
patchesStrategicMerge:
  - patch.yaml
resources:
  - hpa.yaml
```

**MUST** — 无论 Helm 还是 Kustomize，所有环境配置必须通过 CI/CD 流水线渲染，禁止手动 `helm install`。

---

### R10 — 可观测性规范

**MUST** — 所有生产 Pod 必须暴露 Prometheus 指标端点。

**指标暴露规范：**

| 指标类型 | 命名前缀 | 示例 |
|----------|---------|------|
| JVM | `jvm_` | `jvm_gc_pause_seconds` |
| HTTP | `http_server_` | `http_server_requests_seconds_count` |
| 业务 | `{business}_` | `order_created_total` |
| 连接池 | `{pool}_` | `hikaricp_connections_active` |

**MUST** — Pod 注解声明 Prometheus 采集配置：

```yaml
metadata:
  annotations:
    prometheus.io/scrape: "true"
    prometheus.io/port: "8080"
    prometheus.io/path: "/actuator/prometheus"
```

**Prometheus Rule 规范：**

✅ Correct:

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: ord-order-alerts
  labels:
    prometheus: k8s
    role: alert-rules
spec:
  groups:
    - name: ord-order.rules
      interval: 30s
      rules:
        - alert: OrderServiceHighErrorRate
          expr: |
            sum(rate(http_server_requests_seconds_count{status=~"5.."}[5m])) by (service)
            /
            sum(rate(http_server_requests_seconds_count[5m])) by (service)
            > 0.05
          for: 5m
          labels:
            severity: critical
          annotations:
            summary: "Order service error rate exceeds 5%"
            runbook_url: "https://wiki.example.com/runbooks/order-high-error"
        - alert: OrderServiceHighLatency
          expr: |
            histogram_quantile(0.99,
              sum(rate(http_server_requests_seconds_bucket[5m])) by (le, service)
            ) > 2.0
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "Order service P99 latency exceeds 2 seconds"
```

**Grafana Dashboard 规范：**

**MUST** — Dashboard JSON 必须按以下维度组织面板：

| 面板组 | 内容 |
|--------|------|
| 概览 | QPS、错误率、P99 延迟 |
| JVM | GC、内存、线程 |
| 业务 | 核心业务指标趋势 |
| 基础设施 | CPU / 内存 / 网络 / 磁盘 |

**日志收集规范：**

**MUST** — 所有 Pod 输出结构化日志（JSON 格式）：

```json
{
  "timestamp": "2024-01-15T10:30:00.000+08:00",
  "level": "INFO",
  "service": "ord-order",
  "traceId": "abc123def456",
  "spanId": "789ghi012",
  "message": "Order created successfully",
  "userId": "10001",
  "orderId": "202401150001"
}
```

**MUST** — 日志采集使用 Fluent Bit / Filebeat DaemonSet，禁止应用直写文件：

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: fluent-bit
  namespace: logging
spec:
  template:
    spec:
      containers:
        - name: fluent-bit
          volumeMounts:
            - name: varlog
              mountPath: /var/log
            - name: config
              mountPath: /fluent-bit/etc/
      volumes:
        - name: varlog
          hostPath:
            path: /var/log
```

**Tracing 集成：**

**SHOULD** — 分布式链路追踪使用 OpenTelemetry + Jaeger / Zipkin：

| 组件 | 职责 |
|------|------|
| OpenTelemetry SDK | 应用埋点采集 |
| OTel Collector | 接收、转换、导出 |
| Jaeger / Zipkin | 链路查询与可视化 |

**MUST** — Trace ID 必须贯穿日志，便于问题排查：

```yaml
# 应用日志配置（Logback / Log4j2）
<pattern>%d{yyyy-MM-dd'T'HH:mm:ss.SSSZ} [%thread] %-5level %logger{36} [%X{traceId}/%X{spanId}] - %msg%n</pattern>
```

---

## Checklist

- [ ] 根据业务场景选择 Deployment / StatefulSet / DaemonSet，Pod 模板包含 labels、selector、replicas
- [ ] 所有 Pod 设置 requests 和 limits，命名空间配置 ResourceQuota 和 LimitRange，QoS 不低于 Burstable
- [ ] 配置 livenessProbe、readinessProbe，启动慢的应用使用 startupProbe，探针端点独立于业务接口
- [ ] 非敏感配置用 ConfigMap，敏感信息用 Secret，禁止硬编码配置，跨命名空间使用完整 DNS 名称
- [ ] Service 明确指定 type，生产入口统一使用 Ingress，命名空间默认拒绝入站流量，配置 NetworkPolicy
- [ ] 持久化数据使用 PVC + StorageClass，禁止 hostPath，敏感 PVC 启用加密，定期验证备份恢复
- [ ] 关键 Pod 配置 podAntiAffinity 和 topologySpreadConstraints，专用节点使用 NoExecute taint
- [ ] 命名空间绑定 Pod Security Standard，容器以非 root 运行，RBAC 遵循最小权限原则，Secret 使用 Sealed Secrets 或 ESO
- [ ] 生产部署使用 Helm Chart 或 Kustomize，values.yaml 区分环境，Chart 版本 SemVer 管理，CI/CD 渲染部署
- [ ] Pod 暴露 Prometheus 指标端点并添加注解，配置 PrometheusRule 告警，日志 JSON 结构化并携带 traceId，集成分布式链路追踪