# CI/CD

## Overview

CI/CD（持续集成 / 持续交付 / 持续部署）工程规范，涵盖 Pipeline 设计、构建规范、测试集成、代码质量门禁、部署策略、环境管理、制品管理和监控通知。适用于所有使用自动化流水线的项目。

---

## Rules

### R01 — Pipeline 设计原则

**MUST** — Pipeline 必须遵循以下设计原则：

#### 阶段划分

| 阶段 | 顺序 | 说明 |
|------|------|------|
| Checkout | 1 | 拉取代码 |
| Lint / Static Analysis | 2 | 静态分析 |
| Unit Test | 3 | 单元测试 |
| Build | 4 | 构建 |
| Integration Test | 5 | 集成测试 |
| Deploy (Staging) | 6 | 部署到预发布环境 |
| Smoke Test | 7 | 冒烟测试 |
| Deploy (Production) | 8 | 部署到生产环境 |

#### 快速反馈

- 最快失败的阶段放在最前面
- 每个阶段的耗时不应超过 10 分钟（大型构建除外）
- 关键路径上禁止长时间阻塞

#### 失败即停

任何阶段失败后，后续阶段不再执行。

✅ Correct:

```yaml
name: CI Pipeline
on: [push, pull_request]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Lint
        run: make lint

  test:
    needs: lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Unit Test
        run: make test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build
        run: make build

  deploy-staging:
    needs: build
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Staging
        run: make deploy-staging
```

❌ Wrong:

```yaml
name: CI Pipeline
on: [push, pull_request]
jobs:
  everything:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Lint
        run: make lint
      - name: Build
        run: make build
      - name: Test
        run: make test
      - name: Deploy
        run: make deploy
        # 问题：lint 失败后仍会执行 build 和 deploy
        # 问题：无法并行化，总耗时 = 各步骤之和
```

#### 幂等性

- 同一代码多次执行结果一致
- 不依赖外部状态（如网络时间、随机数）
- 清理操作可安全重复执行

---

### R02 — GitHub Actions 规范

**MUST** — GitHub Actions Workflow 必须遵循以下规范：

#### Workflow 结构

```yaml
name: <workflow-name>            # 清晰描述用途
on:                              # 触发条件明确
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
env:                              # 全局变量
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}
jobs:                             # Job 定义
  job-a:
    runs-on: ubuntu-latest
    steps: []
  job-b:
    needs: job-a
    runs-on: ubuntu-latest
    steps: []
```

#### 触发条件

| 场景 | 推荐触发 |
|------|---------|
| 主分支合并 | `push: branches: [main]` |
| PR 检查 | `pull_request: branches: [main]` |
| 定时任务 | `schedule: - cron: '0 2 * * 1-5'` |
| 手动触发 | `workflow_dispatch:` |
| Release 发布 | `release: types: [published]` |

#### Job 设计

- 同类任务合并为一个 Job
- 独立任务拆分为多个 Job（可并行）
- 使用 `needs` 表达依赖关系

✅ Correct:

```yaml
name: Build and Test
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: '17'
      - run: mvn test -pl '!integration-test'

  integration-test:
    needs: unit-test
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: testdb
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports: ['5432:5432']
    steps:
      - uses: actions/checkout@v4
      - run: mvn verify -pl integration-test

  build:
    needs: [unit-test, integration-test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: '17'
      - run: mvn package -DskipTests
      - uses: actions/upload-artifact@v4
        with:
          name: app-jar
          path: target/*.jar
```

❌ Wrong:

```yaml
name: Build
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Java
        run: echo "setup"
      - name: Install deps
        run: echo "install"
      - name: Run tests
        run: echo "test"
      - name: Build jar
        run: echo "build"
      - name: Upload artifact
        uses: actions/upload-artifact@v4
      # 问题：所有步骤串行，无法利用并行 Job
      # 问题：没有使用 needs 表达依赖
      # 问题：缺少服务容器（如数据库）
```

#### 矩阵构建

多版本 / 多操作系统测试时使用 matrix：

```yaml
test:
  strategy:
    matrix:
      os: [ubuntu-latest, macos-latest, windows-latest]
      jdk: [17, 21]
    fail-fast: false  # 某个组合失败不影响其他组合
  runs-on: ${{ matrix.os }}
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-java@v4
      with:
        java-version: ${{ matrix.jdk }}
    - run: mvn test
```

---

### R03 — GitLab CI 规范

**MUST** — GitLab CI 配置必须遵循以下规范：

#### .gitlab-ci.yml 结构

```yaml
stages:
  - check
  - test
  - build
  - deploy

variables:
  DOCKER_REGISTRY: registry.example.com
  IMAGE_NAME: $CI_REGISTRY_IMAGE

# 缓存配置
cache:
  key: ${CI_COMMIT_REF_SLUG}
  paths:
    - .m2/repository
    - node_modules/
```

#### Stage 与 Job 设计

| 阶段 | 说明 | 典型 Job |
|------|------|---------|
| check | 静态检查 | lint, static-analysis |
| test | 测试 | unit-test, integration-test |
| build | 构建 | build, docker-build |
| deploy | 部署 | deploy-staging, deploy-production |

✅ Correct:

```yaml
stages:
  - check
  - test
  - build
  - deploy

variables:
  MAVEN_OPTS: "-Dmaven.repo.local=$CI_PROJECT_DIR/.m2/repository"

cache:
  key: "$CI_COMMIT_REF_SLUG"
  paths:
    - .m2/repository

lint:
  stage: check
  image: maven:3.9-eclipse-temurin-17
  script:
    - mvn checkstyle:check
  rules:
    - changes:
        - src/**/*

unit-test:
  stage: test
  image: maven:3.9-eclipse-temurin-17
  script:
    - mvn test -pl '!integration-test'
  coverage: '/Total.*?([0-9]{1,3})%/'
  artifacts:
    reports:
      cobertura: target/site/cobertura/coverage.xml

docker-build:
  stage: build
  image: docker:24
  services:
    - docker:24-dind
  script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
    - docker build -t $IMAGE_NAME:$CI_COMMIT_SHORT_SHA .
    - docker push $IMAGE_NAME:$CI_COMMIT_SHORT_SHA
  only:
    - main
    - develop

deploy-staging:
  stage: deploy
  image: bitnami/kubectl:latest
  script:
    - kubectl set image deployment/app app=$IMAGE_NAME:$CI_COMMIT_SHORT_SHA -n staging
  environment:
    name: staging
    url: https://staging.example.com
  only:
    - develop
```

❌ Wrong:

```yaml
stages:
  - build-and-test-and-deploy

everything:
  stage: build-and-test-and-deploy
  script:
    - mvn clean install
    - docker build -t app .
    - kubectl apply -f k8s/
  # 问题：单阶段包含所有操作，无法并行
  # 问题：无缓存配置
  # 问题：无环境定义
  # 问题：无失败隔离
```

#### Artifact 规则

- 使用 `when: on_failure` 仅在失败时收集诊断信息
- 使用 `expire_in` 控制保留时间
- 跨 Job 传递使用 `dependencies`

```yaml
test:
  stage: test
  artifacts:
    when: always
    expire_in: 7 days
    paths:
      - target/surefire-reports/
      - target/failsafe-reports/

deploy:
  stage: deploy
  needs: [test]  # 自动获取 test 的 artifacts
```

---

### R04 — 构建规范

**MUST** — 构建流程必须遵循以下规范：

#### 依赖缓存

| 语言 | 缓存目录 | 示例 |
|------|---------|------|
| Java (Maven) | `~/.m2/repository` | `${MAVEN_USER_HOME}/repository` |
| Java (Gradle) | `~/.gradle/caches` | `GRADLE_USER_HOME` |
| Node.js | `node_modules/` | 使用 `actions/cache` |
| Python | `__pycache__/`, `.venv/` | 使用 `pip cache` |
| Go | `~/go/pkg/mod` | 使用 `actions/cache` |

✅ Correct:

```yaml
# GitHub Actions 缓存示例
- name: Cache Maven packages
  uses: actions/cache@v4
  with:
    path: ~/.m2/repository
    key: ${{ runner.os }}-maven-${{ hashFiles('**/pom.xml') }}
    restore-keys: ${{ runner.os }}-maven-

- name: Cache Gradle files
  uses: actions/cache@v4
  with:
    path: |
      ~/.gradle/caches
      ~/.gradle/wrapper
    key: ${{ runner.os }}-gradle-${{ hashFiles('**/*.gradle*', '**/gradle-wrapper.properties') }}
    restore-keys: ${{ runner.os }}-gradle-
```

#### 版本号管理

| 策略 | 适用场景 | 示例 |
|------|---------|------|
| Semantic Versioning | 正式发布产品 | `1.2.3` |
| Commit SHA | 内部服务 / 容器镜像 | `a1b2c3d` |
| 日期+序号 | 每日构建 | `20240115-01` |
| 分支名+短SHA | 开发分支快照 | `develop-a1b2c3d` |

✅ Correct:

```bash
# Semantic Versioning 从 Git Tag 推断
VERSION=$(git describe --tags --abbrev=0 2>/dev/null || echo "0.0.0")
echo "Building version: $VERSION"

# 容器镜像标签
docker build -t app:$VERSION -t app:latest .

# Commit SHA 用于不可变产物
docker build -t app:sha-$(git rev-parse --short HEAD) .
```

❌ Wrong:

```bash
# 硬编码版本号
VERSION="1.0.0"
# 问题：每次发版需要手动修改

# 使用 latest 标签推送生产
docker tag app:sha-abc123 app:latest
# 问题：latest 不可追溯，不利于回滚
```

#### 构建产物管理

- 构建产物通过 Artifact 存储，不提交到 Git
- 产物命名包含版本号或 SHA
- 保留策略：最近 N 个版本 + 指定标签

#### 构建可重现性

- 使用固定的基础镜像（标注 digest）
- 锁定依赖版本（lockfile）
- 禁用动态版本解析
- 构建日志中记录完整版本信息

```dockerfile
# ✅ 使用 digest 锁定基础镜像
FROM eclipse-temurin:17.0.9@sha256:abc123def456...

# ❌ 使用浮动标签
FROM eclipse-temurin:17
```

---

### R05 — 测试集成

**MUST** — Pipeline 中的测试集成必须遵循以下规范：

#### 单元测试门禁

- PR 合入前单元测试必须全部通过
- 覆盖率不得低于项目设定的基线
- 新增代码必须补充对应测试

#### 集成测试

- 使用 Service Container 或 Testcontainers 提供依赖服务
- 集成测试在独立 Job 中运行
- 测试数据使用 fixtures 或 seed 脚本

✅ Correct:

```yaml
# GitHub Actions + Testcontainers
unit-test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-java@v4
      with:
        java-version: '17'
    - name: Run Unit Tests
      run: mvn test -pl '!integration-test'
    - name: Check Coverage
      run: |
        COVERAGE=$(mvn jacoco:report -q && grep -oP '\d+(?=%)' target/site/jacoco/index.html | head -1)
        if [ "$COVERAGE" -lt 80 ]; then
          echo "Coverage $COVERAGE% is below threshold 80%"
          exit 1
        fi

integration-test:
  needs: unit-test
  runs-on: ubuntu-latest
  services:
    postgres:
      image: postgres:16-alpine
      env:
        POSTGRES_DB: testdb
        POSTGRES_USER: test
        POSTGRES_PASSWORD: test
      ports: ['5432:5432']
      options: >-
        --health-cmd "pg_isready -U test"
        --health-interval 10s
        --health-timeout 5s
        --health-retries 5
    redis:
      image: redis:7-alpine
      ports: ['6379:6379']
  steps:
    - uses: actions/checkout@v4
    - run: mvn verify -pl integration-test
```

❌ Wrong:

```yaml
# 无覆盖率检查
test:
  runs-on: ubuntu-latest
  steps:
    - run: mvn test
    # 问题：没有覆盖率门槛
    # 问题：没有集成测试环境

# 无服务依赖
integration-test:
  runs-on: ubuntu-latest
  steps:
    - run: mvn verify -pl integration-test
    # 问题：缺少 PostgreSQL / Redis 等服务
```

#### 覆盖率要求

| 级别 | 最低覆盖率 | 适用范围 |
|------|-----------|---------|
| P0（核心模块） | 90% | 支付、认证、权限 |
| P1（业务模块） | 80% | 订单、用户、商品 |
| P2（工具模块） | 70% | 工具类、适配器 |
| P3（UI 组件） | 60% | 前端组件 |

#### 测试报告

- 生成标准格式报告（JUnit XML / Cobertura / Istanbul）
- 上传为 Artifact 供下载
- 集成到 CI Dashboard 可视化

```yaml
# 测试报告收集
- name: Publish Test Report
  uses: dorny/test-reporter@v1
  if: always()
  with:
    name: Unit Test Results
    path: target/surefire-reports/*.xml
    reporter: java-junit
    fail-on-error: true
```

---

### R06 — 代码质量门禁

**MUST** — Pipeline 必须集成代码质量门禁：

#### SonarQube 集成

- 每次构建执行 SonarQube 扫描
- 新代码质量门禁阻断合并
- 定期全量扫描（夜间）

✅ Correct:

```yaml
# SonarQube 扫描
sonar-scan:
  needs: [unit-test]
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: 0  # SonarQube 需要完整历史
    - name: SonarQube Scan
      uses: SonarSource/sonarqube-scan-action@v4
      with:
        args: >
          -Dsonar.projectKey=my-app
          -Dsonar.qualitygate.wait=true
          -Dsonar.qualitygate.timeout=300
        token: ${{ secrets.SONAR_TOKEN }}
        server_url: ${{ secrets.SONAR_SERVER_URL }}
```

❌ Wrong:

```yaml
# 跳过质量门禁
sonar-scan:
  steps:
    - run: mvn sonar:sonar -Dsonar.qualitygate.wait=false
    # 问题：不等待质量门禁结果
    # 问题：质量差也允许合并
```

#### SonarQube 质量门禁指标

| 指标 | 阈值 | 说明 |
|------|------|------|
| 新增覆盖率 | ≥80% | 新增代码必须有足够测试 |
| 新增重复行密度 | ≤3% | 避免复制粘贴 |
| 漏洞数 | 0 | 不允许新增安全漏洞 |
| 异味数 | ≤5 | 控制代码复杂度 |
| 技术债务比率 | ≤5% | 维护成本可控 |

#### Lint 与风格检查

- Lint 失败阻断 Pipeline
- 风格问题由 linter 自动修复，不阻塞合并
- 配置文件统一管理（ESLint / Checkstyle / ruff）

#### 安全扫描

| 扫描类型 | 工具 | 时机 |
|---------|------|------|
| 依赖漏洞 | Snyk / Trivy / OWASP Dependency-Check | 每次构建 |
| 代码安全 | SonarQube Security | 每次构建 |
| 容器镜像 | Trivy / Grype | 构建镜像时 |
| Secret 泄露 | TruffleHog / gitleaks | PR 提交时 |

```yaml
# Secret 扫描
secret-scan:
  stage: check
  image: trufflesecurity/trufflehog:latest
  script:
    - trufflehog git file://$CI_PROJECT_DIR --no-update --fail --json | tee trufflehog-report.json
    - if [ $(cat trufflehog-report.json | grep -c '"Found"' ) -gt 0 ]; then exit 1; fi
  allow_failure: false
```

---

### R07 — 部署策略

**MUST** — 根据业务场景选择合适的部署策略：

#### 策略对比

| 策略 | 复杂度 | 风险 | 适用场景 |
|------|--------|------|---------|
| 蓝绿部署 | 高 | 低 | 对可用性要求极高的系统 |
| 金丝雀发布 | 中 | 低 | 需要灰度验证的系统 |
| 滚动更新 | 中 | 中 | K8s 原生支持，适合大多数场景 |
| 重建部署 | 低 | 高 | 非关键内部服务 |

#### 蓝绿部署

✅ Correct:

```yaml
# K8s 蓝绿部署（使用两个 Deployment）
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-blue
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
      version: blue
  template:
    metadata:
      labels:
        app: myapp
        version: blue
    spec:
      containers:
        - name: app
          image: myapp:v1.0.0
          ports:
            - containerPort: 8080
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-green
spec:
  replicas: 0  # 初始无流量
  selector:
    matchLabels:
      app: myapp
      version: green
  template:
    metadata:
      labels:
        app: myapp
        version: green
    spec:
      containers:
        - name: app
          image: myapp:v1.1.0
          ports:
            - containerPort: 8080
---
apiVersion: v1
kind: Service
metadata:
  name: app-service
spec:
  selector:
    app: myapp
    version: blue  # 切换流量只需改这里
  ports:
    - port: 80
      targetPort: 8080
```

#### 金丝雀发布

✅ Correct:

```yaml
# Argo Rollouts 金丝雀发布
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: app-canary
spec:
  replicas: 10
  strategy:
    canary:
      steps:
        - setWeight: 10
        - pause: { duration: 5m }
        - setWeight: 25
        - pause: { duration: 5m }
        - setWeight: 50
        - pause: { duration: 10m }
        - setWeight: 100
      canaryService: app-canary
      stableService: app-stable
      analysis:
        templates:
          - templateName: success-rate
        startingStep: 2  # 从 25% 开始分析
      rollbackWindow:
        revisions: 3  # 保留最近 3 个版本用于回滚
```

#### 回滚策略

- 每次部署自动保存回滚点
- 回滚操作必须在 5 分钟内完成
- 回滚决策权归属值班工程师

```bash
# K8s 回滚
kubectl rollout undo deployment/app -n production

# 查看回滚历史
kubectl rollout history deployment/app -n production

# 回滚到指定版本
kubectl rollout undo deployment/app --to-revision=3 -n production
```

❌ Wrong:

```yaml
# 直接删除旧版本重建
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
spec:
  replicas: 3
  template:
    spec:
      containers:
        - name: app
          image: myapp:latest  # 使用 latest 标签
    # 问题：使用 latest 无法回滚到特定版本
    # 问题：滚动更新期间可能短暂中断
```

---

### R08 — 环境管理

**MUST** — 环境管理必须遵循以下规范：

#### 环境定义

| 环境 | 用途 | 数据来源 | 访问权限 |
|------|------|---------|---------|
| dev | 开发联调 | Mock / 本地 | 全体开发 |
| staging | 预发布验证 | 生产脱敏副本 | 开发 + QA |
| production | 正式生产 | 生产数据 | 运维 + 值班 |

#### 配置隔离

- 每个环境独立的配置文件或配置中心
- 环境变量通过 Secrets / Vault 管理
- 禁止在代码中硬编码环境相关配置

✅ Correct:

```yaml
# GitHub Actions 环境配置
environment:
  name: staging
  url: https://staging.example.com

deploy-production:
  environment:
    name: production
    url: https://www.example.com
  # production 环境需要额外审批
```

```yaml
# Spring Boot 多环境配置
spring:
  profiles:
    active: ${SPRING_PROFILES_ACTIVE:dev}
---
spring:
  config:
    activate:
      on-profile: dev
  datasource:
    url: jdbc:postgresql://localhost:5432/devdb
---
spring:
  config:
    activate:
      on-profile: staging
  datasource:
    url: jdbc:postgresql://staging-db.internal:5432/stagingdb
---
spring:
  config:
    activate:
      on-profile: production
  datasource:
    url: jdbc:postgresql://prod-db.internal:5432/proddb
```

❌ Wrong:

```yaml
# 硬编码环境配置
spring:
  datasource:
    url: jdbc:postgresql://prod-db.internal:5432/proddb
    username: admin
    password: hardcoded_password
# 问题：密码硬编码
# 问题：无法区分环境
# 问题：敏感信息泄露风险
```

#### Promotion 流程

制品从低环境晋升到高环境必须经过验证：

```
dev → staging → production

每个阶段晋升条件：
├── 代码审查通过
├── CI Pipeline 全绿
├── 功能测试通过
└── 性能基准达标
```

#### 环境漂移防护

- 基础设施即代码（IaC），所有环境使用同一套模板
- 定期比对环境差异（drift detection）
- 禁止手动修改生产环境配置

```yaml
# Terraform 统一管理多环境
terraform:
  plan:
    staging:
      working_dir: terraform/staging
      environment_vars:
        ENV: staging
    production:
      working_dir: terraform/production
      environment_vars:
        ENV: production
```

---

### R09 — 制品管理

**MUST** — 制品管理必须遵循以下规范：

#### Docker Registry

- 使用组织级私有 Registry（Harbor / AWS ECR / GitHub Container Registry）
- 镜像标签包含版本号和 SHA
- 禁止使用 `latest` 标签部署生产环境

✅ Correct:

```yaml
# Harbor Registry 推送
docker-build:
  stage: build
  script:
    - docker login harbor.example.com -u $HARBOR_USER -p $HARBOR_PASSWORD
    - IMAGE_TAG=$(echo $CI_COMMIT_TAG | sed 's/^v//')
    - docker build -t harbor.example.com/team/app:$IMAGE_TAG .
    - docker build -t harbor.example.com/team/app:sha-${CI_COMMIT_SHORT_SHA} .
    - docker push harbor.example.com/team/app:$IMAGE_TAG
    - docker push harbor.example.com/team/app:sha-${CI_COMMIT_SHORT_SHA}
  only:
    - tags
    - main
```

❌ Wrong:

```bash
# 使用 latest 标签
docker tag app:abc123 harbor.example.com/team/app:latest
docker push harbor.example.com/team/app:latest
# 问题：无法追溯具体版本
# 问题：多人同时推送会覆盖
# 问题：不利于回滚
```

#### 制品版本规则

| 规则 | 说明 |
|------|------|
| 语义化版本 | `major.minor.patch`（如 `2.1.0`） |
| 不可变标签 | 一旦推送，不可覆盖 |
| 附加元数据 | 构建时间、Git SHA、构建者 |
| 保留策略 | 按版本数量或时间保留 |

#### 制品签名

- 所有生产制品必须签名（Cosign / Notary）
- 部署前验证签名完整性
- 签名密钥使用 HSM 或 KMS 管理

```bash
# 使用 Cosign 签名
cosign sign --key cosign.key harbor.example.com/team/app:v1.0.0

# 部署时验证签名
cosign verify --key cosign.pub harbor.example.com/team/app:v1.0.0
```

#### 制品保留策略

| 制品类型 | 保留策略 | 说明 |
|---------|---------|------|
| 生产镜像 | 最近 10 个版本 + 所有 patch 版本 | 确保可回滚 |
| 预发布镜像 | 最近 5 个版本 | 节省存储空间 |
| 调试符号 | 最近 3 个版本 | 用于线上问题排查 |
| 构建日志 | 30 天 | 审计与故障排查 |

---

### R10 — 监控与通知

**MUST** — Pipeline 监控与通知必须遵循以下规范：

#### Pipeline 状态监控

- 每次 Pipeline 运行结果实时可见
- 失败 Pipeline 自动关联最近的变更
- 关键指标纳入团队仪表盘

#### 失败通知

| 严重级别 | 通知方式 | 响应时间 |
|---------|---------|---------|
| P0（生产部署失败） | 电话 + 短信 + IM | 15 分钟内 |
| P1（预发布失败） | IM @相关人员 | 1 小时内 |
| P2（PR 检查失败） | IM 评论 | 下一个工作日 |
| P3（定时任务异常） | 邮件汇总 | 24 小时内 |

✅ Correct:

```yaml
# GitHub Actions 失败通知
notify-failure:
  needs: [deploy-production]
  if: failure()
  runs-on: ubuntu-latest
  steps:
    - name: Send Alert
      uses: slackapi/slack-github-action@v1.26.0
      with:
        webhook-url: ${{ secrets.SLACK_WEBHOOK }}
        webhook-type: incoming-webhook
        payload: |
          {
            "text": "🔴 Pipeline Failed",
            "blocks": [
              {
                "type": "section",
                "text": {
                  "type": "mrkdwn",
                  "text": "*Pipeline Failed*\nRepo: `${{ github.repository }}`\nBranch: `${{ github.ref }}`\nRun: <${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}|View Run>"
                }
              },
              {
                "type": "context",
                "elements": [
                  {
                    "type": "mrkdwn",
                    "text": "Triggered by: ${{ github.actor }} at ${{ github.event.head_commit.timestamp }}"
                  }
                ]
              }
            ]
          }
```

❌ Wrong:

```yaml
# 无通知机制
deploy-production:
  runs-on: ubuntu-latest
  steps:
    - run: ./deploy.sh production
    # 问题：部署失败无人知晓
    # 问题：无法及时响应
```

#### 部署通知

每次部署必须发送通知，包含：

- 部署版本与时间
- 部署人与触发方式
- 部署前后的版本差异
- 健康检查结果

```yaml
# 部署成功通知
notify-success:
  needs: [deploy-production]
  if: success()
  runs-on: ubuntu-latest
  steps:
    - name: Deploy Notification
      uses: slackapi/slack-github-action@v1.26.0
      with:
        webhook-url: ${{ secrets.SLACK_WEBHOOK }}
        payload: |
          {
            "text": "🟢 Deployment Successful",
            "blocks": [
              {
                "type": "section",
                "text": {
                  "type": "mrkdwn",
                  "text": "*Deployment Successful*\nVersion: `${{ github.sha }}`\nEnvironment: Production\nTime: $(date -u +'%Y-%m-%d %H:%M:%S UTC')"
                }
              }
            ]
          }
```

#### 指标收集

| 指标 | 采集方式 | 用途 |
|------|---------|------|
| Pipeline 成功率 | CI 平台 API | 团队效率趋势 |
| 平均构建时长 | 计时器 | 性能优化依据 |
| 部署频率 | 部署日志 | 交付能力评估 |
| 变更前置时间 | 提交到部署的时间 | DevOps 成熟度 |
| 回滚率 | 部署事件统计 | 质量稳定性 |

---

## Checklist

- [ ] Pipeline 阶段划分合理，失败即停
- [ ] 最快失败阶段排在最前面
- [ ] Pipeline 具有幂等性
- [ ] GitHub Actions Workflow 结构规范（触发条件、Job 依赖、矩阵构建）
- [ ] GitLab CI 使用多阶段、缓存、Artifact 规则正确
- [ ] 依赖缓存已配置（Maven / Gradle / Node / pip）
- [ ] 版本号管理策略明确（Semantic Versioning / SHA）
- [ ] 构建产物不提交到 Git
- [ ] 基础镜像使用 digest 锁定
- [ ] 单元测试覆盖率达到基线要求
- [ ] 集成测试使用 Service Container / Testcontainers
- [ ] 测试报告以标准格式收集并可视化
- [ ] SonarQube 质量门禁已配置且阻断合并
- [ ] 依赖漏洞扫描已集成（Snyk / Trivy）
- [ ] Secret 泄露扫描已集成（TruffleHog / gitleaks）
- [ ] 部署策略选择合适（蓝绿 / 金丝雀 / 滚动更新）
- [ ] 回滚策略已定义且可在 5 分钟内完成
- [ ] 环境之间配置隔离（Secrets / Vault）
- [ ] 制品使用语义化版本标签，禁止 latest 部署生产
- [ ] 生产制品已签名（Cosign / Notary）
- [ ] 制品保留策略已配置
- [ ] Pipeline 失败通知已配置（分级通知）
- [ ] 部署通知已配置（版本、时间、结果）
- [ ] Pipeline 指标已采集（成功率、时长、频率）
