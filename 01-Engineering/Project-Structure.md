# Project Structure

## Overview

项目结构规范，涵盖目录布局、包命名、模块组织、资源文件放置、配置文件层级、构建产物管理、Monorepo 结构和跨项目共享库策略。适用于 Java / Python / Node.js / Go 等多语言项目。

---

## Rules

### R01 — 标准目录布局

**MUST** — 遵循各语言的标准目录约定：

#### Java (Maven)

```
my-app/
├── pom.xml
├── src/
│   ├── main/
│   │   ├── java/com/example/app/
│   │   └── resources/
│   └── test/
│       ├── java/com/example/app/
│       └── resources/
└── target/                    # 构建产物（gitignore）
```

#### Python

```
my-project/
├── pyproject.toml
├── src/my_project/            # 或直接用 my_project/
│   ├── __init__.py
│   ├── core/
│   └── api/
├── tests/
├── scripts/
├── docs/
└── .gitignore
```

#### Node.js

```
my-app/
├── package.json
├── src/
│   ├── index.ts
│   ├── modules/
│   └── shared/
├── public/
├── tests/
└── dist/                      # 构建产物（gitignore）
```

✅ Correct:

```
src/main/java/com/example/app/Application.java
src/main/resources/application.yaml
src/test/java/com/example/app/UserServiceTest.java
```

❌ Wrong:

```
code/Application.java          # 非标准路径
src/main/java/com/example/app/controller/Controller.java  # 缺少 domain 层
```

---

### R02 — 包命名规范

**MUST** — 包名遵循以下规则：

| 规则 | 说明 |
|------|------|
| 全小写 | `user`, `order`, `payment` |
| 无下划线 | `user_service` ❌ → `userservice` ✅ |
| 无驼峰 | `userService` ❌ → `userservice` ✅ |
| 反向域名 | `com.example.app` |
| 层次化 | 按功能域分包，不超过 5 层 |

**Java 推荐分层：**

```
com.example.app
├── Application.java
├── config/              # 配置类
├── controller/          # Web 层
├── service/             # 业务逻辑
├── repository/          # 数据访问
├── domain/              # 领域模型
├── dto/                 # 数据传输对象
├── exception/           # 异常定义
└── common/              # 公共工具
```

✅ Correct:

```java
package com.example.app.service;

public class UserService { }
```

❌ Wrong:

```java
package com.example.app.services;    // 复数形式不必要
package com.example.app.the_service; // 下划线不允许
```

---

### R03 — 模块组织

**MUST** — 根据项目规模选择单模块或多模块：

#### 单模块（≤50 万行代码）

```
my-app/
├── pom.xml
└── src/
    ├── main/java/com/example/app/
    │   ├── user/
    │   ├── order/
    │   └── payment/
    └── test/java/com/example/app/
```

#### 多模块（>50 万行或多团队协作）

```
my-app/
├── pom.xml                          # parent POM
├── user-service/
│   ├── pom.xml
│   └── src/main/java/com/example/user/
├── order-service/
│   ├── pom.xml
│   └── src/main/java/com/example/order/
├── shared-lib/
│   ├── pom.xml
│   └── src/main/java/com/example/shared/
└── gateway/
    ├── pom.xml
    └── src/main/java/com/example/gateway/
```

**模块划分原则：**

| 原则 | 说明 |
|------|------|
| 高内聚 | 同一模块内的代码高度相关 |
| 低耦合 | 模块间通过接口通信 |
| 单一职责 | 每个模块只负责一个业务域 |
| 可独立部署 | 微服务模块可单独打包 |

✅ Correct:

```
user-service/         → 用户管理（独立部署）
order-service/        → 订单管理（独立部署）
shared-lib/           → 公共工具库（被其他模块依赖）
```

❌ Wrong:

```
common/               → 过于宽泛，包含所有"公共"代码
utils/                → 无明确边界，持续膨胀
```

---

### R04 — 资源文件放置

**MUST** — 资源文件按类型分类存放：

```
src/main/resources/
├── application.yaml              # 主配置
├── application-dev.yaml          # 环境配置
├── db/
│   ├── migration/                # Flyway 迁移脚本
│   │   ├── V1__create_user.sql
│   │   └── V2__create_order.sql
│   └── seed/                     # 种子数据
│       └── dev-seed.sql
├── i18n/
│   ├── messages.properties
│   └── messages_zh_CN.properties
├── templates/                    # 模板文件（如 Thymeleaf）
└── static/                       # 静态资源
    ├── css/
    ├── js/
    └── images/
```

✅ Correct:

```
src/main/resources/db/migration/V1__create_user.sql
src/main/resources/i18n/messages_zh_CN.properties
```

❌ Wrong:

```
src/main/resources/sql/V1__create_user.sql     # 应放在 db/migration/
src/main/resources/locale/zh_CN.properties     # 应使用 i18n/ 目录
```

---

### R05 — 配置文件层级

**MUST** — 使用多环境配置分离：

```
src/main/resources/
├── application.yaml              # 公共配置
├── application-dev.yaml          # 开发环境
├── application-staging.yaml      # 预发布环境
├── application-prod.yaml         # 生产环境
```

**激活方式：**

```yaml
# application.yaml
spring:
  profiles:
    active: ${SPRING_PROFILES_ACTIVE:dev}
```

**敏感配置外部化：**

✅ Correct:

```yaml
# application.yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/mydb
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
```

❌ Wrong:

```yaml
# application.yaml
spring:
  datasource:
    username: admin
    password: secret123
```

**配置优先级（从高到低）：**

1. 命令行参数
2. 环境变量
3. `application-{profile}.yaml`
4. `application.yaml`

---

### R06 — 构建产物管理

**MUST** — 构建产物不纳入版本控制：

```gitignore
# Java
target/
*.class
*.jar
*.war

# Python
__pycache__/
*.pyc
build/
dist/
*.egg-info/

# Node.js
node_modules/
dist/
*.tgz

# 通用
.idea/
.vscode/
*.log
```

✅ Correct:

```bash
# 本地构建
mvn clean package -DskipTests

# CI 中构建并归档
mvn clean package
artifacts:
  paths: target/*.jar
```

❌ Wrong:

```bash
# 提交构建产物到 Git
git add target/app.jar
```

---

### R07 — Monorepo 结构

**SHOULD** — Monorepo 使用统一根目录结构：

```
my-repo/
├── .github/                      # CI/CD 配置
├── apps/
│   ├── web-app/                  # 前端应用
│   ├── mobile-app/               # 移动端应用
│   └── admin-panel/              # 管理后台
├── packages/
│   ├── shared-ui/                # 共享 UI 组件
│   ├── shared-utils/             # 共享工具函数
│   └── config-eslint/            # ESLint 配置包
├── services/
│   ├── user-service/             # 后端服务
│   └── order-service/
├── tools/
│   ├── codegen/                  # 代码生成工具
│   └── deploy/                   # 部署脚本
├── turbo.json                    # Turborepo 配置
├── package.json                  # root package.json
└── pnpm-workspace.yaml           # pnpm workspace 配置
```

**Monorepo 工具选择：**

| 工具 | 适用场景 |
|------|---------|
| Turborepo | 前端优先的 Monorepo |
| Nx | 全栈 Monorepo |
| Lerna | 传统 JavaScript Monorepo |
| Gradle Composite Build | Java Multi-project |

✅ Correct:

```yaml
# turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"] },
    "test": { "dependsOn": ["build"] },
    "lint": {}
  }
}
```

---

### R08 — 跨项目共享库

**SHOULD** — 共享库使用独立仓库或 Monorepo Package：

#### 方案一：独立仓库 + Artifactory

```
shared-lib/                       # 独立 Git 仓库
├── pom.xml
└── src/main/java/com/example/shared/
```

```xml
<!-- 消费方 pom.xml -->
<dependency>
    <groupId>com.example</groupId>
    <artifactId>shared-lib</artifactId>
    <version>1.4.2</version>
</dependency>
```

#### 方案二：Monorepo Package

```
packages/shared-utils/
├── package.json
└── src/
    ├── format.ts
    └── validate.ts
```

```typescript
// apps/web-app/package.json
{
  "dependencies": {
    "@my-repo/shared-utils": "workspace:*"
  }
}
```

**共享库设计原则：**

| 原则 | 说明 |
|------|------|
| 稳定 API | 共享库变更需 SemVer 版本号 |
| 向后兼容 | Major 版本升级需提供迁移指南 |
| 文档完善 | README + API Docs + Changelog |
| 独立测试 | 共享库必须有完整的单元测试 |

✅ Correct:

```
shared-lib v1.4.2 → v1.5.0 (Minor, 向后兼容)
shared-lib v1.5.0 → v2.0.0 (Major, Breaking Changes)
```

❌ Wrong:

```
shared-lib v1.4.2 → v1.4.3 (Patch, 但包含 Breaking Changes)
```

---

## Checklist

- [ ] 目录布局遵循语言标准（Maven / Python / Node.js）
- [ ] 包名全小写，无下划线，无驼峰
- [ ] 模块划分遵循高内聚低耦合原则
- [ ] 资源文件按类型分类存放
- [ ] 配置文件多环境分离，敏感信息外部化
- [ ] 构建产物不纳入版本控制
- [ ] Monorepo 使用统一工具链（Turborepo / Nx）
- [ ] 共享库有独立版本号和完整文档
