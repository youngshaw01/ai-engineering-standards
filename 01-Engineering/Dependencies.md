# Dependencies

## Overview

依赖管理规范，涵盖依赖选型、版本锁定、安全审计、许可证合规、生命周期管理、传递依赖策略、Monorepo 依赖策略和依赖文档化。适用于所有使用包管理器（Maven / Gradle / npm / pip / Cargo 等）的项目。

---

## Rules

### R01 — 依赖选型标准

**MUST** — 引入新依赖前必须评估以下维度：

| 维度 | 要求 |
|------|------|
| 活跃度 | 最近 6 个月有 Release 或 Issue 活动 |
| 社区规模 | GitHub Stars ≥ 500（通用库）或团队内部维护 |
| License | 允许商业使用（Apache 2.0 / MIT / BSD / ISC） |
| 维护状态 | 非 deprecated / unmaintained |
| 体积 | 无过度依赖链（传递依赖总数可控） |

**优先选择官方 / 主流库**，避免小众替代方案。

✅ Correct:

```
需求：JSON 序列化
选型：jackson-databind（Spring Boot 默认集成）
理由：官方维护、生态成熟、无需额外依赖
```

❌ Wrong:

```
需求：JSON 序列化
选型：fastjson（已停止维护，存在历史漏洞）
理由："之前用过"
```

---

### R02 — 版本锁定

**MUST** — 生产项目必须提交 Lockfile：

| 包管理器 | Lockfile 文件 |
|----------|--------------|
| Maven | `pom.xml`（含完整版本号） |
| Gradle | `gradle/wrapper/gradle-wrapper.properties` + `build.lock` |
| npm | `package-lock.json` |
| pip | `requirements.txt` + `pip freeze` 输出 |
| Cargo | `Cargo.lock` |

**禁止使用浮动版本：**

❌ Wrong:

```xml
<!-- Maven — 浮动版本导致不可重现构建 -->
<dependency>
    <groupId>com.example</groupId>
    <artifactId>lib</artifactId>
    <version>1.+</version>
</dependency>
```

✅ Correct:

```xml
<!-- Maven — 精确版本 -->
<dependency>
    <groupId>com.example</groupId>
    <artifactId>lib</artifactId>
    <version>1.4.2</version>
</dependency>
```

**SNAPSHOT 仅限开发环境使用**，禁止出现在生产 POM 中。

---

### R03 — 安全审计

**MUST** — CI 流水线必须集成自动化安全扫描：

| 工具 | 适用语言 | 扫描内容 |
|------|---------|---------|
| Snyk | 全语言 | CVE / License |
| Trivy | 容器 / 全语言 | CVE |
| OWASP Dependency-Check | Java | CVE |
| npm audit | Node.js | CVE |
| safety | Python | CVE |

**高危漏洞（CVSS ≥ 7.0）必须在合并前修复。**

✅ Correct:

```yaml
# .github/workflows/security.yml
- name: OWASP Dependency Check
  uses: dependency-check/Dependency-Check_Action@v1
  with:
    project: 'my-app'
    fail: true  # 高危漏洞时 CI 失败
```

**定期执行手动审计：**

- [ ] 每月检查一次已知 CVE
- [ ] 关注 Dependabot / Renovate PR
- [ ] 升级前阅读 Release Notes 中的 Breaking Changes

---

### R04 — License 合规

**MUST** — 引入依赖前确认 License 类型：

| License | 允许商用 | 允许修改 | 需源码公开 | 风险等级 |
|---------|---------|---------|-----------|---------|
| Apache 2.0 | ✅ | ✅ | ❌ | 低 |
| MIT | ✅ | ✅ | ❌ | 低 |
| BSD 2-Clause | ✅ | ✅ | ❌ | 低 |
| BSD 3-Clause | ✅ | ✅ | ❌ | 低 |
| ISC | ✅ | ✅ | ❌ | 低 |
| GPL 2.0 | ✅ | ✅ | ✅（衍生作品） | 高 |
| GPL 3.0 | ✅ | ✅ | ✅（衍生作品） | 高 |
| AGPL 3.0 | ✅ | ✅ | ✅（网络交互即分发） | 极高 |
| LGPL 2.1 | ✅ | ✅ | 仅修改库本身 | 中 |
| proprietary | 视协议 | 视协议 | 视协议 | 中 |

**禁止引入 AGPL 3.0 依赖到商业闭源项目中。**

✅ Correct:

```
依赖：commons-lang3 (Apache 2.0)
结论：可自由使用，无需开源自有代码
```

❌ Wrong:

```
依赖：agpl-library (AGPL 3.0)
用于：商业闭源产品
结论：违反 License，法律风险
```

---

### R05 — 依赖生命周期管理

**MUST** — 遵循标准化的添加 / 更新 / 移除流程：

#### 添加依赖

```
1. 评估选型（R01）
2. 确认 License（R04）
3. 指定精确版本（R02）
4. 本地测试通过
5. 提交 PR，CI 安全扫描通过
6. 合并后记录到 CHANGELOG
```

#### 更新依赖

| 更新类型 | 流程 |
|----------|------|
| Patch（1.x.z → 1.x.z+1） | 自动 PR，CI 通过即可合并 |
| Minor（1.x.z → 1.x+1.0） | 人工 Review Release Notes |
| Major（1.x.z → 2.0.0） | 架构师审批 + 完整回归测试 |

#### 移除依赖

```
1. 确认无代码直接引用
2. 检查传递依赖是否仍需要
3. 运行 clean build 验证
4. 提交 PR 说明移除原因
```

✅ Correct:

```markdown
## CHANGED
- Update spring-boot from 2.7.18 to 3.2.0
  - Breaking Changes: Jakarta EE namespace migration
  - Action required: update javax.* → jakarta.* imports
  - Rollback plan: pin to 2.7.18
```

---

### R06 — 传递依赖管理

**MUST** — 显式声明所有直接依赖，禁止隐式依赖：

✅ Correct:

```xml
<!-- pom.xml — 显式声明所有直接依赖 -->
<dependencies>
    <dependency>
        <groupId>org.apache.commons</groupId>
        <artifactId>commons-lang3</artifactId>
        <version>3.14.0</version>
    </dependency>
    <!-- commons-io 是 commons-lang3 的传递依赖，但本模块直接使用 -->
    <dependency>
        <groupId>commons-io</groupId>
        <artifactId>commons-io</artifactId>
        <version>2.15.1</version>
    </dependency>
</dependencies>
```

**排除有害传递依赖：**

✅ Correct:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <exclusions>
        <exclusion>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-tomcat</artifactId>
        </exclusion>
    </exclusions>
</dependency>
<!-- 替换为 Undertow -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-undertow</artifactId>
</dependency>
```

**禁止出现版本冲突未解决的情况。** CI 中应检测依赖树冲突。

---

### R07 — Monorepo 依赖策略

**MUST** — Monorepo 中使用统一的依赖管理机制：

| 策略 | 适用场景 | 示例 |
|------|---------|------|
| Root BOM | 多子模块共享同一组版本 | Maven `<dependencyManagement>` |
| Workspaces | 前端 Monorepo | npm / pnpm / yarn workspaces |
| DevEngine | Rust 统一工具链 | `[workspace]` dev-dependencies |

✅ Correct (Maven Monorepo):

```xml
<!-- parent/pom.xml — 统一版本管理 -->
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-dependencies</artifactId>
            <version>3.2.0</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

```xml
<!-- module/pom.xml — 子模块只需声明坐标，无需版本号 -->
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
        <!-- 版本由 parent BOM 管理 -->
    </dependency>
</dependencies>
```

**跨模块引用使用 relative path：**

✅ Correct:

```xml
<dependency>
    <groupId>com.example</groupId>
    <artifactId>shared-utils</artifactId>
    <version>${project.version}</version>
</dependency>
```

---

### R08 — 依赖文档化

**SHOULD** — 在项目根目录维护依赖说明文档：

```markdown
## 核心依赖

| 依赖 | 版本 | 用途 | License |
|------|------|------|---------|
| Spring Boot | 3.2.0 | Web 框架 | Apache 2.0 |
| Jackson | 2.15.0 | JSON 处理 | Apache 2.0 |
| MyBatis-Plus | 3.5.5 | ORM 增强 | Apache 2.0 |

## 特殊依赖说明

- `xxx-sdk` v2.0：公司内部 SDK，需申请权限后访问 Artifactory
```

**CI 生成依赖清单：**

✅ Correct:

```bash
# Maven
mvn dependency:tree -DoutputFile=dependencies.txt

# npm
npm ls --all > dependencies.txt

# pip
pip freeze > requirements.txt
```

---

## Checklist

- [ ] 新依赖经过选型评估（活跃度 / License / 体积）
- [ ] 所有依赖使用精确版本号，Lockfile 已提交
- [ ] CI 集成自动化安全扫描（CVE / License）
- [ ] 无 AGPL / GPL 依赖混入闭源项目
- [ ] 依赖添加 / 更新 / 移除遵循标准流程
- [ ] 传递依赖显式声明，无版本冲突
- [ ] Monorepo 使用统一的依赖管理机制
- [ ] 项目维护依赖说明文档
