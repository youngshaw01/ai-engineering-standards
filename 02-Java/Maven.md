# Maven

## Overview

Maven 构建规范，涵盖 POM 结构、依赖管理、Profile 配置、插件配置、多模块构建顺序、仓库配置、版本属性管理和构建优化。适用于基于 Maven 的 Java 项目。

---

## Rules

### R01 — POM 结构

**MUST** — POM 文件遵循标准结构：

```xml
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <!-- 基本信息 -->
    <groupId>com.example</groupId>
    <artifactId>my-app</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    <name>My Application</name>
    <description>Application description</description>

    <!-- 继承（可选） -->
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version>
    </parent>

    <!-- 属性定义 -->
    <properties>
        <java.version>17</java.version>
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>

    <!-- 依赖管理 -->
    <dependencies>
        <!-- 依赖项 -->
    </dependencies>

    <!-- 构建配置 -->
    <build>
        <plugins>
            <!-- 插件配置 -->
        </plugins>
    </build>
</project>
```

✅ Correct:

```xml
<groupId>com.example</groupId>
<artifactId>my-app</artifactId>
<version>1.0.0</version>
```

❌ Wrong:

```xml
<!-- 缺少 modelVersion -->
<project>
    <groupId>com.example</groupId>
    ...
</project>
```

---

### R02 — 依赖管理

**MUST** — 使用 `dependencyManagement` 统一版本：

```xml
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

<dependencies>
    <!-- 子模块只需声明坐标，版本由 BOM 管理 -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
</dependencies>
```

**`dependencyManagement` vs 直接依赖：**

| 场景 | 使用方式 |
|------|---------|
| Parent POM 统一版本 | `dependencyManagement` |
| 子模块实际使用 | `dependencies`（直接依赖） |
| 仅传递不直接使用 | `dependencyManagement` + `<scope>import</scope>` |

✅ Correct:

```xml
<!-- Parent POM -->
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>com.example</groupId>
            <artifactId>shared-lib</artifactId>
            <version>${project.version}</version>
        </dependency>
    </dependencies>
</dependencyManagement>

<!-- Child POM -->
<dependencies>
    <dependency>
        <groupId>com.example</groupId>
        <artifactId>shared-lib</artifactId>
        <!-- 版本由 parent 管理 -->
    </dependency>
</dependencies>
```

❌ Wrong:

```xml
<!-- 每个子模块重复声明版本号 -->
<dependency>
    <groupId>com.example</groupId>
    <artifactId>shared-lib</artifactId>
    <version>1.0.0</version>
</dependency>
```

---

### R03 — Profile 配置

**SHOULD** — 使用 Profile 管理环境差异：

```xml
<profiles>
    <profile>
        <id>dev</id>
        <activation>
            <activeByDefault>true</activeByDefault>
        </activation>
        <properties>
            <env>dev</env>
        </properties>
        <dependencies>
            <dependency>
                <groupId>com.h2database</groupId>
                <artifactId>h2</artifactId>
                <scope>runtime</scope>
            </dependency>
        </dependencies>
    </profile>

    <profile>
        <id>prod</id>
        <properties>
            <env>prod</env>
        </properties>
        <dependencies>
            <dependency>
                <groupId>org.postgresql</groupId>
                <artifactId>postgresql</artifactId>
                <scope>runtime</scope>
            </dependency>
        </dependencies>
    </profile>
</profiles>
```

**激活方式：**

```bash
# 命令行激活
mvn clean package -Pprod

# 环境变量激活
export MAVEN_PROFILE=prod
mvn clean package
```

✅ Correct:

```xml
<activation>
    <property>
        <name>env</name>
        <value>prod</value>
    </property>
</activation>
```

---

### R04 — 插件配置

**MUST** — 关键插件必须配置：

#### Compiler Plugin

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-compiler-plugin</artifactId>
    <version>3.11.0</version>
    <configuration>
        <source>17</source>
        <target>17</target>
        <encoding>UTF-8</encoding>
        <parameters>true</parameters>
    </configuration>
</plugin>
```

#### Surefire Plugin

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-surefire-plugin</artifactId>
    <version>3.1.2</version>
    <configuration>
        <includes>
            <include>**/*Test.java</include>
        </includes>
        <excludes>
            <exclude>**/*IntegrationTest.java</exclude>
        </excludes>
        <argLine>-Xmx512m</argLine>
    </configuration>
</plugin>
```

#### Javadoc Plugin

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-javadoc-plugin</artifactId>
    <version>3.5.0</version>
    <configuration>
        <charset>UTF-8</charset>
        <encoding>UTF-8</encoding>
        <docencoding>UTF-8</docencoding>
    </configuration>
</plugin>
```

✅ Correct:

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-compiler-plugin</artifactId>
    <configuration>
        <source>17</source>
        <target>17</target>
    </configuration>
</plugin>
```

❌ Wrong:

```xml
<!-- 未指定 source/target，依赖父 POM 默认值 -->
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-compiler-plugin</artifactId>
</plugin>
```

---

### R05 — 多模块构建顺序

**MUST** — 多模块项目正确配置模块顺序：

```xml
<!-- Parent POM -->
<modules>
    <module>shared-lib</module>
    <module>user-service</module>
    <module>order-service</module>
</modules>
```

**模块依赖关系：**

```
shared-lib (无依赖)
    ↓
user-service (依赖 shared-lib)
    ↓
order-service (依赖 shared-lib, user-service)
```

**构建命令：**

```bash
# 从根目录构建所有模块
mvn clean install

# 构建特定模块及其依赖
mvn clean install -pl order-service -am

# 跳过测试构建
mvn clean package -DskipTests
```

✅ Correct:

```xml
<!-- order-service/pom.xml -->
<dependencies>
    <dependency>
        <groupId>com.example</groupId>
        <artifactId>shared-lib</artifactId>
        <version>${project.version}</version>
    </dependency>
    <dependency>
        <groupId>com.example</groupId>
        <artifactId>user-service</artifactId>
        <version>${project.version}</version>
        <type>jar</type>
    </dependency>
</dependencies>
```

❌ Wrong:

```xml
<!-- 循环依赖 -->
<!-- shared-lib 依赖 user-service，user-service 依赖 shared-lib -->
```

---

### R06 — 仓库配置

**MUST** — 配置私有仓库和镜像：

```xml
<repositories>
    <repository>
        <id>company-artifactory</id>
        <url>https://artifactory.company.com/repo</url>
        <releases>
            <enabled>true</enabled>
        </releases>
        <snapshots>
            <enabled>false</enabled>
        </snapshots>
    </repository>
</repositories>

<pluginRepositories>
    <pluginRepository>
        <id>company-plugin-repo</id>
        <url>https://artifactory.company.com/plugin-repo</url>
        <releases>
            <enabled>true</enabled>
        </releases>
    </pluginRepository>
</pluginRepositories>
```

**阿里云镜像（中国区）：**

```xml
<mirrors>
    <mirror>
        <id>aliyun</id>
        <mirrorOf>central</mirrorOf>
        <name>Aliyun Public Repository</name>
        <url>https://maven.aliyun.com/repository/public</url>
    </mirror>
</mirrors>
```

✅ Correct:

```xml
<repository>
    <id>internal</id>
    <url>https://artifactory.company.com/repo</url>
    <releases><enabled>true</enabled></releases>
    <snapshots><enabled>false</enabled></snapshots>
</repository>
```

❌ Wrong:

```xml
<!-- 允许 SNAPSHOT 在生产环境 -->
<repository>
    <id>internal</id>
    <url>https://artifactory.company.com/repo</url>
    <releases><enabled>true</enabled></releases>
    <snapshots><enabled>true</enabled></snapshots>
</repository>
```

---

### R07 — 版本属性管理

**MUST** — 使用属性统一管理版本号：

```xml
<properties>
    <!-- Spring Boot 版本 -->
    <spring-boot.version>3.2.0</spring-boot.version>

    <!-- 第三方库版本 -->
    <jackson.version>2.15.0</jackson.version>
    <lombok.version>1.18.28</lombok.version>
    <mybatis-plus.version>3.5.5</mybatis-plus.version>

    <!-- 插件版本 -->
    <maven-compiler-plugin.version>3.11.0</maven-compiler-plugin.version>
    <maven-surefire-plugin.version>3.1.2</maven-surefire-plugin.version>
</properties>

<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>com.fasterxml.jackson.core</groupId>
            <artifactId>jackson-databind</artifactId>
            <version>${jackson.version}</version>
        </dependency>
    </dependencies>
</dependencyManagement>
```

✅ Correct:

```xml
<properties>
    <mybatis-plus.version>3.5.5</mybatis-plus.version>
</properties>

<dependency>
    <groupId>com.baomidou</groupId>
    <artifactId>mybatis-plus-boot-starter</artifactId>
    <version>${mybatis-plus.version}</version>
</dependency>
```

❌ Wrong:

```xml
<!-- 硬编码版本号，难以维护 -->
<dependency>
    <groupId>com.baomidou</groupId>
    <artifactId>mybatis-plus-boot-starter</artifactId>
    <version>3.5.5</version>
</dependency>
```

---

### R08 — 构建优化

**SHOULD** — 启用并行构建和缓存：

#### 并行构建

```bash
# 多线程构建
mvn clean install -T 4

# 根据 CPU 核心数自动选择
mvn clean install -T C
```

#### 离线模式

```bash
# 使用本地缓存
mvn clean install -o
```

#### 增量编译

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-compiler-plugin</artifactId>
    <configuration>
        <useIncrementalCompilation>true</useIncrementalCompilation>
    </configuration>
</plugin>
```

#### 构建缓存工具

| 工具 | 说明 |
|------|------|
| Maven Daemon | JDK 9+ 内置，减少 JVM 启动开销 |
| Bazel | Google 开源，支持远程缓存 |
| Gradle Build Cache | Gradle 原生缓存机制 |

✅ Correct:

```bash
# CI 中启用并行构建
mvn clean install -T 4 -DskipTests
```

❌ Wrong:

```bash
# 单线程构建大型项目
mvn clean install
```

---

## Checklist

- [ ] POM 包含完整的 modelVersion 和基本信息
- [ ] 使用 `dependencyManagement` 统一版本管理
- [ ] Profile 配置区分开发 / 生产环境
- [ ] Compiler / Surefire / Javadoc 插件正确配置
- [ ] 多模块依赖关系正确，无循环依赖
- [ ] 配置私有仓库，SNAPSHOT 仅限开发环境
- [ ] 版本号使用属性统一管理
- [ ] 启用并行构建和增量编译
