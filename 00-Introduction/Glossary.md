# Glossary

## Overview

本术语表收录各标准文档中使用的核心术语，按领域分类，提供中英文对照和定义。技术专有名词保留英文，不翻译。

---

## Version Control

| Term | Definition |
|------|-----------|
| Branch | 从主线开发历史分叉出的独立开发线，用于功能开发或修复 |
| Commit | 代码仓库中的一次原子变更记录，包含变更内容和元信息 |
| Merge | 将一个 Branch 的变更合并到另一个 Branch |
| Rebase | 将当前 Branch 的 Commit 重新应用到目标 Branch 的顶端，保持线性历史 |
| Cherry-pick | 从一个 Branch 中选取特定 Commit 应用到另一个 Branch |
| Tag | 对特定 Commit 的命名引用，通常用于标记 Release 版本 |
| Stash | 临时保存未提交的变更，以便切换 Branch 后恢复 |
| Detached HEAD | HEAD 指向特定 Commit 而非 Branch 引用的状态 |

---

## Architecture

| Term | Definition |
|------|-----------|
| Monolith | 所有功能模块打包在一个部署单元中的架构风格 |
| Microservice | 将应用拆分为多个独立部署的小型服务的架构风格 |
| DDD | Domain-Driven Design，以业务领域为核心驱动软件设计的方法论 |
| Bounded Context | DDD 中定义业务模型边界的概念，同一领域在不同上下文中有不同含义 |
| Aggregate | DDD 中一组关联对象的集合，作为数据修改的最小单元 |
| CQRS | Command Query Responsibility Segregation，命令与查询职责分离的架构模式 |
| Event Sourcing | 以事件序列持久化状态变更，通过回放事件重建当前状态的模式 |
| API Gateway | 统一入口，负责请求路由、认证、限流等横切关注点 |
| Service Mesh | 基础设施层，处理服务间通信、负载均衡、熔断等 |
| Sidecar | Service Mesh 中与业务服务同部署的代理进程 |

---

## Backend

| Term | Definition |
|------|-----------|
| RBAC | Role-Based Access Control，基于角色的访问控制模型 |
| ABAC | Attribute-Based Access Control，基于属性的访问控制模型 |
| Idempotency | 同一操作执行一次与多次产生相同结果的特性 |
| DLQ | Dead Letter Queue，存储无法正常消费的消息的队列 |
| ORM | Object-Relational Mapping，对象关系映射框架 |
| DTO | Data Transfer Object，用于层间数据传输的对象 |
| DAO | Data Access Object，封装数据访问逻辑的对象 |
| N+1 Query | 查询 N 条主记录后逐条查询关联数据导致的性能问题 |
| Connection Pool | 预创建一组数据库连接供应用复用，减少连接创建开销 |
| Rate Limiting | 限制单位时间内的请求次数，保护系统免受过载影响 |
| Circuit Breaker | 当下游服务异常时自动切断请求，防止级联故障 |
| Graceful Shutdown | 服务停止时先完成进行中的请求再关闭，避免请求丢失 |
| Health Check | 检测服务是否正常运行的状态检查机制 |
| Audit Log | 记录系统操作和数据变更的日志，用于追溯和合规 |

---

## AI / ML

| Term | Definition |
|------|-----------|
| LLM | Large Language Model，大规模语言模型 |
| RAG | Retrieval-Augmented Generation，检索增强生成，结合外部知识提升回答质量 |
| Prompt | 输入给 AI 模型的指令文本，引导模型生成期望的输出 |
| Fine-tuning | 在预训练模型基础上使用特定领域数据进一步训练 |
| Embedding | 将文本等数据映射为高维向量表示的技术 |
| Token | LLM 处理文本的最小单元，约 0.75 个英文单词或 0.5 个中文字 |
| Hallucination | LLM 生成看似合理但实际不正确或虚构内容的现象 |
| Agent | 能够自主规划、调用工具并执行任务的 AI 系统 |
| MCP | Model Context Protocol，AI 模型与外部工具交互的标准协议 |
| Chain-of-Thought | 提示 LLM 逐步推理的技巧，提升复杂问题的回答质量 |
| Temperature | 控制 LLM 输出随机性的参数，值越高输出越多样 |
| Vector Database | 专门存储和检索向量嵌入的数据库，支持相似性搜索 |

---

## Testing

| Term | Definition |
|------|-----------|
| Unit Test | 验证单个函数或类行为的测试，不依赖外部系统 |
| Integration Test | 验证多个模块或服务协作行为的测试 |
| E2E Test | End-to-End Test，模拟用户操作验证完整系统流程的测试 |
| Mock | 用模拟对象替代真实依赖，隔离被测单元 |
| Fixture | 测试执行前的预置条件和测试数据 |
| Coverage | 测试覆盖代码行 / 分支 / 函数的百分比 |
| TDD | Test-Driven Development，先写测试再写实现代码的开发方式 |
| Parameterized Test | 使用多组输入数据运行同一测试逻辑 |
| Smoke Test | 快速验证系统基本功能是否正常的少量测试 |
| Regression Test | 验证代码变更未引入新缺陷的测试 |

---

## DevOps

| Term | Definition |
|------|-----------|
| CI | Continuous Integration，持续集成，频繁合并代码并自动构建测试 |
| CD | Continuous Delivery / Deployment，持续交付 / 部署，自动化发布流程 |
| Pipeline | CI/CD 中从代码提交到部署的自动化执行流程 |
| Artifact | 构建产物，如 JAR / Docker Image / npm Package |
| IaC | Infrastructure as Code，用代码定义和管理基础设施 |
| Container | 轻量级虚拟化技术，将应用及其依赖打包为可移植单元 |
| Orchestration | 容器编排，自动管理容器的部署、扩缩和运维 |
| Helm | Kubernetes 的包管理工具，使用 Chart 定义和部署应用 |
| Blue-Green Deployment | 同时维护两套环境，切换流量实现零停机部署 |
| Canary Release | 将新版本逐步推送给少量用户，验证后再全量发布 |
| Observability | 通过 Metrics / Logs / Traces 理解系统内部状态的能力 |
| SLO | Service Level Objective，服务等级目标，如 99.9% 可用性 |
| SLA | Service Level Agreement，服务等级协议，包含 SLO 和违约责任 |

---

## Security

| Term | Definition |
|------|-----------|
| CVE | Common Vulnerabilities and Exposures，公开已知安全漏洞的标识系统 |
| CVSS | Common Vulnerability Scoring System，漏洞严重程度评分标准 |
| OWASP | Open Web Application Security Project，Web 应用安全组织 |
| JWT | JSON Web Token，用于身份认证的令牌标准 |
| OAuth 2.0 | 开放授权标准，允许第三方应用访问用户资源 |
| CORS | Cross-Origin Resource Sharing，跨域资源共享机制 |
| XSS | Cross-Site Scripting，跨站脚本攻击 |
| CSRF | Cross-Site Request Forgery，跨站请求伪造攻击 |
| SQL Injection | 通过构造恶意 SQL 语句攻击数据库的注入攻击 |
| MFA | Multi-Factor Authentication，多因素认证 |
| Secret | 需要保护的敏感信息，如密码、Token、密钥 |
| Encryption at Rest | 静态数据加密，保护存储中的数据 |
| Encryption in Transit | 传输中数据加密，保护网络传输中的数据 |
