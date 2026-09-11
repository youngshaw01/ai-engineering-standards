# Project Lifecycle Governance

> **项目全生命周期治理规范** — 从需求到交付、从环境晋升到反向回归、从老项目业务梳理到渐进改造。
>
> 本规范是 Layer 0 **编排层**：串联各章节垂直规范，不重复定义细节。

---

## Overview

### 为什么需要生命周期治理？

优秀工程实践（Harness Platform、Production Readiness、Multi-Environment Pipeline）的共同点：

1. **阶段化** — 需求、开发、测试、部署、交付各有入口/出口条件
2. **环境隔离** — Local/Dev → Test → Staging → Production 逐级晋升
3. **门禁化** — 每阶段有质量门禁，失败即停（Fail Fast）
4. **证据化** — 发布决策基于可追溯证据，而非「感觉可以上了」
5. **反向回归** — 每节点验证上游能力未被破坏
6. **治理即代码** — 策略可声明、可审计（Policy-as-Code 思想）

本规范将这些实践适配到 **ai-engineering-standards** 体系，并与 `.harness/` 成熟度对齐。

### 参考来源（学习摘要）

| 来源 | 核心借鉴 |
|------|---------|
| [Harness Platform](https://developer.harness.io/) | Pipeline 阶段编排、Approval Gate、OPA Policy-as-Code、Audit Trail、Canary/Blue-Green + Continuous Verification |
| [Production Readiness Checklist](https://playcode.io/blog/production-readiness-checklist) | 候选版本 × 目标环境的证据账本、Go/Limited-Go/No-Go 决策 |
| [Multi-Environment Pipeline](https://alamrafiul.com/posts/multi-environment-pipeline/) | Dev→Staging→Prod 渐进晋升、环境配置隔离、生产人工审批 |
| [Environment Strategy](https://github.com/archman-dev/website/blob/main/docs/delivery-engineering/environments-and-releases/environment-strategy-dev-test-stage-prod.mdx) | 各环境目的、数据安全、Staging 与 Prod parity |
| [Better Harness](https://github.com/QoderAI/better-harness) | Agent Work Loop 五维审计、证据化 Findings、工作流持续改进（见 11-AI-DevTools/Better-Harness.md） |
| 本仓库现有规范 | CI/CD、TestStrategy、Harness-Bootstrap、How-To-Use 老项目路径 |

### 生命周期总览

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│ 1.需求   │ → │ 2.设计   │ → │ 3.开发   │ → │ 4.测试   │ → │ 5.部署   │ → │ 6.交付   │ → │ 7.运营   │
│ Require  │   │ Design   │   │ Develop  │   │ Test     │   │ Deploy   │   │ Deliver  │   │ Operate  │
└──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
     │              │              │              │              │              │              │
     └──────────────┴──────────────┴──────────────┴──────────────┴──────────────┴──────────────┘
                                    每阶段：入口条件 → 活动 → 出口门禁 → 反向回归
```

### 与环境晋升的关系

```
Local/Dev  ──►  Test/CI  ──►  Staging/UAT  ──►  Production
  (开发)        (自动化)       (预生产验证)        (生产交付)
```

详见 [环境策略](#环境策略-environment-strategy)。

---

## Lifecycle Phases

### Phase 1 — 需求（Requirements）

**目标**：明确做什么、不做什么、验收标准是什么。

| 项 | 说明 |
|----|------|
| **入口** | 业务诉求 / 缺陷报告 / 技术债项 |
| **活动** | PRD 编写、范围界定、优先级、风险识别 |
| **产物** | PRD、验收标准（Acceptance Criteria）、非目标清单 |
| **Harness 归属** | `.harness/workspace/current/{task_id}/spec.md` |
| **引用** | [10-Product/PRD.md](../10-Product/PRD.md) |

**出口门禁（Gate R1）**：

- [ ] 需求范围已明确（含 Out of Scope）
- [ ] 验收标准可测试、可度量
- [ ] 安全/合规风险已识别
- [ ] 老项目：已评估与现有业务规则的冲突（见 [老项目路径](#老项目渐进改造路径)）

**反向回归**：无（首阶段）。

---

### Phase 2 — 设计（Design）

**目标**：确定怎么做，评估架构影响。

| 项 | 说明 |
|----|------|
| **入口** | Gate R1 通过 |
| **活动** | 架构设计、接口设计、数据模型、技术选型 |
| **产物** | 设计文档、API 契约、ADR（架构决策记录） |
| **Harness 归属** | `spec.md`、`.harness/knowledge/` 更新（如涉及架构变更） |
| **引用** | [06-Architecture/](../06-Architecture/)、[05-Backend/API.md](../05-Backend/API.md) |

**出口门禁（Gate D1）**：

- [ ] 架构影响已评估（新项目 MUST，老项目 SHOULD）
- [ ] API/数据库变更已文档化
- [ ] 安全设计已审查（认证、授权、敏感数据）
- [ ] AI 辅助设计已人工确认（HARNESS-006）

**反向回归（Gate D-R）**：

- [ ] 设计不违反已有项目规则（`.harness/rules/`）
- [ ] 不破坏已文档化的业务流程（`.harness/knowledge/业务流程.md`）
- [ ] 与全局标准无冲突（Rule ID 检查）

---

### Phase 3 — 开发（Development）

**目标**：按设计实现，遵循编码规范。

| 项 | 说明 |
|----|------|
| **入口** | Gate D1 通过 |
| **活动** | 编码、单元测试、Code Review |
| **环境** | Local / Dev |
| **Harness 归属** | `plan.md`、`tasks.md`、代码变更 |
| **引用** | 语言章节、`11-AI-DevTools/AI-Workflow.md` |

**出口门禁（Gate DEV1）**：

- [ ] 单元测试通过（或老项目：新代码有测试）
- [ ] Lint / 静态分析通过
- [ ] Code Review 完成（至少 1 人）
- [ ] AI 修改 ≤300 行 / ≤5 文件（ENG-003），超限已确认

**反向回归（Gate DEV-R）**：

- [ ] 已有单元测试仍通过（不可因新功能破坏旧测试）
- [ ] 核心 API 契约未非兼容性变更（或已版本化）
- [ ] 老项目：Boy Scout — 仅改动必要范围，不顺手重构

---

### Phase 4 — 测试（Test）

**目标**：在隔离环境验证功能、集成、回归。

| 项 | 说明 |
|----|------|
| **入口** | Gate DEV1 通过 |
| **活动** | 集成测试、API 测试、E2E、回归测试、安全扫描 |
| **环境** | Test / CI |
| **引用** | [08-Testing/](../08-Testing/) |

**出口门禁（Gate T1）**：

- [ ] 集成测试通过
- [ ] 回归测试套件通过（见 [反向回归策略](#反向回归策略-reverse-regression)）
- [ ] 覆盖率达标（新项目 SHOULD ≥80% 核心模块）
- [ ] 安全扫描无 Critical/High 未处理项

**反向回归（Gate T-R）**：

- [ ] **全量回归**：核心业务流程用例全部通过
- [ ] **冒烟回归**：主路径 15 分钟内可验证
- [ ] **数据回归**：Migration 可回滚或已验证
- [ ] 缺陷修复：原 Bug 用例 + 关联模块用例通过

---

### Phase 5 — 部署（Deploy）

**目标**：将已验证制品晋升到 Staging / Production。

| 项 | 说明 |
|----|------|
| **入口** | Gate T1 通过 |
| **活动** | 构建制品、部署 Staging、Staging 验证、部署 Production |
| **环境** | Staging → Production |
| **引用** | [09-DevOps/CI-CD.md](../09-DevOps/CI-CD.md)、[09-DevOps/Kubernetes.md](../09-DevOps/Kubernetes.md) |

**出口门禁（Gate DEP-S，Staging）**：

- [ ] Staging 部署成功
- [ ] Staging 冒烟测试通过
- [ ] Staging 与 Production 配置 parity 已确认
- [ ] 数据库 Migration 在 Staging 已验证

**出口门禁（Gate DEP-P，Production）**：

- [ ] **人工审批**（MUST — 生产禁止全自动）
- [ ] Production Readiness 证据齐全（见下表）
- [ ] 回滚方案已就绪且可执行
- [ ] 变更窗口 / Freeze Window 无冲突

**Production Readiness 最小证据集**：

| 证据 | 负责人 | 说明 |
|------|--------|------|
| 测试报告 | QA / 开发 | Gate T1 通过记录 |
| 安全扫描 | 安全 / 开发 | 无未处理 Critical |
| 回滚步骤 | 运维 / 开发 | 文档化，Staging 已演练 |
| 监控告警 | SRE / 运维 | 关键指标 Dashboard 就绪 |
| 变更说明 | Release Owner | Changelog / Release Note |

**反向回归（Gate DEP-R）**：

- [ ] Staging 全量回归通过后再晋升 Production
- [ ] Production 部署后 **15 分钟内冒烟**
- [ ] 部署后 **24 小时内** 核心指标无异常（错误率、延迟）
- [ ] Canary/Blue-Green（如适用）：自动回滚条件已配置

---

### Phase 6 — 交付（Deliver）

**目标**：完成发布闭环，交付可运维系统。

| 项 | 说明 |
|----|------|
| **入口** | Gate DEP-P 通过 |
| **活动** | Release Note、文档更新、Knowledge 同步、任务归档 |
| **Harness 归属** | `validation.md` → `workspace/history/{task_id}/` |

**出口门禁（Gate DL1）**：

- [ ] Release Note 已发布
- [ ] `.harness/knowledge/` 已同步（架构/API/数据模型变更时）
- [ ] 用户/运维文档已更新
- [ ] workspace 任务已归档至 `history/`

**反向回归（Gate DL-R）**：

- [ ] 生产核心业务流程人工抽测通过
- [ ] 回滚演练记录（季度 SHOULD 一次）

---

### Phase 7 — 运营（Operate）

**目标**：持续监控、Incident 响应、技术债治理。

| 项 | 说明 |
|----|------|
| **活动** | 监控、告警、Incident、容量规划、退役 |
| **引用** | [09-DevOps/Monitoring.md](../09-DevOps/Monitoring.md) |

**持续门禁**：

- [ ] SLO/SLI 定期审查
- [ ] 安全补丁 ≤30 天修复（Critical）
- [ ] 技术债 backlog 季度回顾

---

## Environment Strategy

### 环境定义与注意事项

| 环境 | 目的 | 数据 | 部署方式 | 注意事项 |
|------|------|------|---------|---------|
| **Local** | 个人开发 | Mock / 本地 DB | 手动 | 禁止连接生产 DB；禁止生产密钥 |
| **Dev** | 联调、快速反馈 | 合成 / Seed | 自动（每次 commit） | 允许失败；日志 DEBUG |
| **Test/CI** | 自动化测试 | 隔离、可重置 | CI 触发 | 每次 Pipeline 重建；禁止外部依赖不稳定 |
| **Staging** | 预生产验证 | 脱敏 / 匿名化副本 | 自动（main/develop） | **MUST** 与 Prod 基础设施 parity |
| **Production** | 真实用户 | 真实数据 | **人工审批** | 最高安全栏；完整监控告警 |

### 环境配置原则

**MUST**：

1. 环境间 **密钥隔离** — 生产凭证不得出现在非生产
2. Staging **镜像 Production** — 同部署方式、同实例规格（可缩容）
3. 非生产数据 **脱敏** — 禁止真实 PII 进入 Dev/Test
4. 晋升路径 **单向** — Dev → Test → Staging → Prod，禁止跳级

**SHOULD**：

- 使用 Infrastructure as Code 保持一致性
- Feature Flag 控制渐进发布
- 各环境独立数据库 / Schema

### 环境 × 阶段映射

| 阶段 | Local/Dev | Test/CI | Staging | Production |
|------|-----------|---------|---------|------------|
| 开发 | ✅ 主战场 | — | — | ❌ 禁止 |
| 测试 | 单元测试 | ✅ 集成/回归 | UAT | — |
| 部署 | — | — | ✅ 预发布 | ✅ 交付 |
| 运营 | — | — | 演练 | ✅ 监控 |

---

## Reverse Regression Strategy

> **反向回归**：在每个节点，验证 **上游阶段成果未被破坏**，而非仅验证当前变更。

### 回归层次

| 层次 | 时机 | 范围 | 耗时目标 |
|------|------|------|---------|
| **L1 单元回归** | 开发提交 | 变更模块 + 关联模块单测 | < 5 min |
| **L2 集成回归** | CI Test 环境 | API 契约 + 服务间集成 | < 15 min |
| **L3 业务回归** | Staging | 核心业务流程 E2E | < 30 min |
| **L4 全量回归** | 重大发布前 | 全量用例 + 性能基线 | 按项目 |
| **L5 生产冒烟** | 部署后 15 min | 主路径 + 关键 API | < 15 min |

### 各节点反向回归清单

```
需求 ──► 设计
         └─ D-R: 设计不违反已有规则与业务知识

设计 ──► 开发
         └─ DEV-R: 已有单测仍过；API 兼容性

开发 ──► 测试
         └─ T-R: 全量/冒烟回归；Migration 可回滚

测试 ──► Staging 部署
         └─ DEP-S-R: Staging 全量回归

Staging ──► Production
         └─ DEP-P-R: 生产冒烟 + 24h 指标

交付 ──► 运营
         └─ DL-R: 核心流程人工抽测
```

### 选择性测试（借鉴 Harness Test Intelligence 思想）

**MAY** — 大型项目可引入变更影响分析，仅运行相关测试子集加速反馈：

- 代码变更 → 映射影响模块 → 运行关联合集 + **核心冒烟集（永远运行）**
- 核心冒烟集 MUST 在任何晋升路径上全量执行

---

## New vs Legacy Project Paths

### 新项目（type: new）

```
Day 1:  .harness Bootstrap + harness.yaml
        ↓
Phase 1-7 全生命周期按标准门禁执行
        ↓
成熟后:  Standard Harness + CI 门禁模板
```

**特点**：从第一天建立规范，无历史包袱。

### 老项目（type: legacy）

**核心原则**（HARNESS-006）：接入不改业务代码，渐进治理。

详见 [老项目渐进改造路径](#老项目渐进改造路径)。

---

## Legacy Migration Roadmap

> 老项目：**业务梳理 → Harness 接入 → 知识沉淀 → 渐进改造 → 可选升级**。

### Stage 0 — 业务梳理（1-2 周）

**目标**：建立可信业务视图，不修改代码。

| 活动 | 产物 | Harness 归属 |
|------|------|-------------|
| 模块/目录 inventory | 模块清单 | `knowledge/架构.md` |
| 核心业务流程梳理 | 流程图、状态机 | `knowledge/业务流程.md` |
| 数据模型梳理 | ER、核心表说明 | `knowledge/数据模型.md` |
| 领域术语整理 | 术语表 | `knowledge/领域术语.md` |
| 痛点/风险登记 | 差距清单 | `.harness/governance/exceptions.yaml` |

**出口**：业务文档 **人工确认** 后标记 `extraction.completed: true`。

**引用**：[07-AI/Knowledge-Management.md](../07-AI/Knowledge-Management.md)、[00-Introduction/How-To-Use.md](../00-Introduction/How-To-Use.md)

### Stage 1 — Harness Bootstrap（1 天）

```
cp templates/harness/bootstrap/. .harness/
编辑 AGENTS.md
创建 rules/README.md（占位）
```

**禁止**：此阶段不修改业务代码、不重构、不升级依赖。

### Stage 2 — 规则与知识推断（1-2 周）

| 活动 | 说明 |
|------|------|
| AI 扫描代码推断约定 | 命名、分层、VCS 规范 → `rules/` 草稿 |
| 生成 knowledge/ 初稿 | 人工确认后启用 |
| 配置 context/layers.yaml | 按项目结构调整 |
| 登记 exceptions | 已知偏差与负责人 | `.harness/governance/exceptions.yaml` |

**出口**：升级到 **Standard** Harness。

### Stage 3 — Boy Scout 渐进治理（持续）

> 每次经过营地，让它比你离开时更干净。

| 优先级 | 类型 | 行动 |
|--------|------|------|
| P0 | 安全 | SQL 注入、硬编码密钥 — **立即修复** |
| P1 | 稳定性 | 无测试的核心路径 — 补测试 |
| P2 | 规范 | 新代码强制遵守标准 |
| P3 | 历史债 | 每次迭代修复 1-2 项 |

**新代码 MUST 符合标准；旧代码 SHOULD 渐进改进。**

### Stage 4 — 质量门禁接入（2-4 周）

- 引入 CI：Lint → Unit Test → Build（先 Dev/Test 环境）
- 配置 `governance/gates.yaml`（见模板）
- Staging 环境建立后接入集成/回归

### Stage 5 — 可选升级（按决策）

| 升级项 | 触发条件 | 引用 |
|--------|---------|------|
| SVN → Git | 组织决策，非标准强制 | [01-Engineering/SVN.md R08](SVN.md) |
| Enterprise Harness | 多 Agent / MCP / 审计需求 | [Harness-Bootstrap.md](../11-AI-DevTools/Harness-Bootstrap.md) |
| 架构重构 | 业务梳理发现结构性问题 | 独立项目，走完整 Phase 1-7 |

### 老项目改造时间线（参考）

```
Week 1-2:  Stage 0 业务梳理
Week 2:    Stage 1 Bootstrap
Week 3-4:  Stage 2 知识/规则 + Standard 升级
Month 2+:  Stage 3 Boy Scout + Stage 4 门禁
按需:      Stage 5 可选升级
```

---

## Harness Maturity Alignment

| Harness 成熟度 | 适用阶段 | 生命周期能力 |
|---------------|---------|-------------|
| **Bootstrap** | Stage 0-1、POC | AGENTS + rules + workspace |
| **Standard** | Stage 2-4、80% 企业项目 | + knowledge + context + gates 模板 |
| **Enterprise** | 核心业务、金融、多 Agent | + governance/ + audit/ + agents/ |

模板位置：

- Bootstrap: `templates/harness/bootstrap/`
- Standard: `templates/harness/standard/`
- Enterprise: `templates/harness/enterprise/`
- 门禁配置: `templates/harness/standard/governance/gates.yaml`
- 生命周期配置: `templates/harness/standard/governance/lifecycle.yaml`

---

## AI Workflow Boundaries by Phase

| 阶段 | AI 可做 | AI 禁止 / 需确认 |
|------|---------|-----------------|
| 需求 | 起草 PRD、生成验收标准 | 最终范围决策 |
| 设计 | 方案对比、ADR 草稿 | 架构最终决策、生产配置 |
| 开发 | 编码、单测、小步修改 | 超 300 行/5 文件、自动 commit |
| 测试 | 生成测试用例、分析失败 | 跳过回归、修改测试凑通过 |
| 部署 | 生成部署脚本、Pipeline 草稿 | **执行生产部署**、修改生产配置 |
| 交付 | Release Note 草稿 | 未经审批的发布 |
| 运营 | 日志分析、Incident 摘要 | 生产数据导出、自动修复生产 |

产物统一归入：`.harness/workspace/current/{task_id}/`

---

## Rules

### R01 — 阶段门禁

**MUST** — 每个生命周期阶段 MUST 满足出口门禁（Gate）后才能进入下一阶段。

**MUST NOT** — 跳过门禁直接部署生产。

---

### R02 — 环境晋升单向

**MUST** — 制品晋升路径为 Dev → Test → Staging → Production，禁止跳级。

**MUST** — Production 部署 MUST 经人工审批。

---

### R03 — 反向回归

**MUST** — 测试阶段执行 L2+ 回归；Staging 晋升前执行 L3；Production 部署后执行 L5 冒烟。

**SHOULD** — 重大发布前执行 L4 全量回归。

---

### R04 — 环境数据隔离

**MUST** — 生产凭证、真实 PII 不得出现在 Local/Dev/Test 环境。

**MUST** — Staging 使用脱敏数据。

---

### R05 — 老项目非侵入接入

**MUST** — 老项目 Stage 0-2 不修改业务代码（HARNESS-006）。

**SHOULD** — 新代码符合标准，旧代码 Boy Scout 渐进治理。

---

### R06 — 证据化发布决策

**MUST** — Production 发布 MUST 有 Gate DEP-P 证据集（测试报告、回滚方案、监控就绪）。

**SHOULD** — 采用 Go / Limited-Go / No-Go 明确决策。

---

### R07 — Harness 产物归属

**MUST** — 各阶段产物归入 `.harness/workspace/{task_id}/`，完成后归档 history（HARNESS-002）。

---

### R08 — 治理配置声明

**SHOULD** — Standard 及以上项目 SHOULD 在 `.harness/governance/` 声明 `lifecycle.yaml` 和 `gates.yaml`。

---

### R09 — 选择性测试

**MAY** — 大型项目可用变更影响分析缩小测试范围，但核心冒烟集 MUST 全量执行。

---

### R10 — 审计与追溯

**SHOULD** — Enterprise 项目 SHOULD 启用 `audit/` 记录 AI 修改与发布决策。

---

## Checklist

### 新项目启动

- [ ] 已创建 `.harness/`（Bootstrap 最低）
- [ ] 已配置 `.harness/harness.yaml`（type: new）
- [ ] 已明确 Phase 1-7 负责人
- [ ] 已规划 Dev/Test/Staging/Prod 环境

### 单次需求交付（Phase 1-6）

- [ ] Gate R1：需求与验收标准明确
- [ ] Gate D1：设计已审查
- [ ] Gate DEV1：开发 + CR + 单测通过
- [ ] Gate T1：集成 + 回归通过
- [ ] Gate DEP-S：Staging 验证通过
- [ ] Gate DEP-P：生产审批 + 证据齐全
- [ ] Gate DL1：文档 + Knowledge 同步 + 任务归档

### 老项目接入

- [ ] Stage 0：业务梳理文档已人工确认
- [ ] Stage 1：Bootstrap `.harness/` 已建立
- [ ] Stage 2：knowledge/ + rules/ 已补充，升级 Standard
- [ ] 登记 exceptions：`.harness/governance/exceptions.yaml`
- [ ] Stage 4：CI 门禁已接入（至少 Lint + Unit Test）

### 发布后（24h 内）

- [ ] L5 生产冒烟通过
- [ ] 核心指标无异常
- [ ] Incident 渠道就绪
- [ ] 回滚方案可执行

---

## References

| 文档 | 关系 |
|------|------|
| [Harness-Bootstrap.md](../11-AI-DevTools/Harness-Bootstrap.md) | .harness 结构与成熟度 |
| [CI-CD.md](../09-DevOps/CI-CD.md) | Pipeline 与部署策略 |
| [TestStrategy.md](../08-Testing/TestStrategy.md) | 测试金字塔与覆盖率 |
| [How-To-Use.md](../00-Introduction/How-To-Use.md) | 标准接入指南 |
| [AI-Workflow.md](../11-AI-DevTools/AI-Workflow.md) | AI 辅助开发边界 |
| [templates/harness/standard/governance/](../templates/harness/standard/governance/) | 生命周期与门禁模板 |
