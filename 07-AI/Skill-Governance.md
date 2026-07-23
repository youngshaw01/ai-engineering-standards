# Skill Governance

> AI Skill 治理标准，定义 Skill 的定义、分类、生命周期、权限模型和安全管理。

---

## Overview

AI Skill 是扩展 AI 开发工具能力的模块化组件，类似于软件依赖但具有更高的权限敏感性。本规范定义了 Skill 的治理框架，确保：

- **可控性**：每个 Skill 的来源、用途、权限清晰可追溯
- **安全性**：权限最小化，高风险操作需审批
- **可审计**：启用、变更、废弃全程记录
- **可回滚**：问题 Skill 可快速禁用或降级

适用对象：superpowers-zh、自定义 Skill、MCP Tool、第三方 Agent 等所有扩展 AI 能力的组件。

---

## Rules

### R01 — Skill 定义与分类

**MUST** — 每个 Skill 必须明确声明其类型，不同类型对应不同的适用场景和权限范围：

| 类型 | 核心职责 | 典型示例 | 默认权限级别 |
|------|---------|---------|------------|
| development | 辅助编码、调试、测试 | superpowers-zh、TDD Skill | medium |
| review | 代码审查、质量检查 | java-review、security-audit | read-only |
| deployment | 部署、发布、运维 | kubernetes-admin、docker-deploy | high |
| analysis | 分析、诊断、优化 | performance-analyzer、db-tuner | read-only |
| governance | 合规、审计、策略执行 | compliance-checker、policy-enforcer | high |

**选择原则：**

- 能用 development 解决的，不引入 review
- 能用 read-only 类型解决的，不引入 write 权限
- 任务涉及生产环境时，必须使用 deployment 类型并启用 Human-in-the-Loop
- 合规要求严格时，优先使用 governance 类型

✅ Correct:

```yaml
# skill-registry.yaml
skills:
  - name: superpowers-zh
    type: development
    description: "AI 软件开发工作流，包含 TDD、调试、代码审查"
    scope: [coding, debugging, testing]
    permissions:
      read: [project-code, project-docs]
      write: [code-files, test-files]
      execute: none
```

❌ Wrong:

```yaml
# skill-registry.yaml
skills:
  - name: some-tool
    type: unknown
    description: "做一些事情"
    permissions:
      read: all
      write: all
      execute: all
```

> 未声明类型、描述模糊、权限过度授予。

---

### R02 — Skill 生命周期

**MUST** — Skill 必须遵循完整的生命周期管理，类似软件依赖的版本管理：

```
发现 → 评估 → 登记 → 批准 → 启用 → 升级 → 废弃
```

| 阶段 | 责任方 | 关键动作 | 产出物 |
|------|--------|---------|--------|
| 发现 | 用户/团队 | 识别需求、搜索候选 Skill | 候选列表 |
| 评估 | 技术负责人 | 安全审查、权限评估、风险评级 | 评估报告 |
| 登记 | 管理员 | 写入 skill-registry.yaml | 注册表条目 |
| 批准 | 项目负责人 | 审批启用申请 | 审批记录 |
| 启用 | 开发者 | 在 .standards/skills.yaml 中声明 | 配置文件 |
| 升级 | 维护者 | 版本更新、变更通知 | CHANGELOG |
| 废弃 | 管理员 | 标记 deprecated、移除引用 | 废弃记录 |

**状态流转规则：**

- 新 Skill 必须经过「评估」和「登记」才能进入「启用」
- 状态变更必须记录原因和影响范围
- 废弃 Skill 不得直接删除，必须先标记 deprecated 并等待一个过渡期（建议 30 天）

✅ Correct:

```yaml
# skill-registry.yaml
skills:
  - name: java-review
    status: approved          # 已批准
    version: 1.2.0
    lifecycle:
      discovered_at: "2024-01-15"
      evaluated_by: "tech-lead"
      approved_at: "2024-01-20"
      deprecated_at: null
```

❌ Wrong:

```yaml
# skill-registry.yaml
skills:
  - name: some-unknown-skill
    status: active             # 未经批准直接启用
    version: latest            # 无具体版本号
```

> 跳过评估和批准流程，版本管理混乱。

---

### R03 — Skill 引入评估

**MUST** — 引入新 Skill 前必须完成以下评估项，形成书面评估报告：

| 评估项 | 必填 | 说明 |
|--------|------|------|
| 名称 | 是 | 唯一标识符，kebab-case |
| 来源 | 是 | community / internal / team / vendor |
| 用途 | 是 | 功能描述、适用场景 |
| 维护者 | 是 | 个人或团队，联系方式 |
| 权限声明 | 是 | read / write / execute 的具体范围 |
| 风险等级 | 是 | low / medium / high |
| 版本 | 是 | 语义化版本号 |
| License | 是 | 开源协议或商业授权 |
| 替代方案 | 否 | 是否存在更轻量的替代 |

**风险评级标准：**

| 等级 | 判定条件 | 处理要求 |
|------|---------|---------|
| low | 仅读取项目代码/文档，无写权限，无执行权限 | 团队内部审批即可 |
| medium | 可写入代码文件或测试文件，有有限执行权限 | 技术负责人审批 |
| high | 可访问生产环境、执行危险命令、修改系统配置 | 项目负责人 + 安全负责人联合审批 |

✅ Correct:

```markdown
# Skill 评估报告

## 基本信息
- **名称**: security-auditor
- **来源**: community (GitHub)
- **维护者**: security-team@company.com
- **版本**: 2.1.0
- **License**: MIT

## 功能描述
自动化安全漏洞扫描，支持 OWASP Top 10 检测。

## 权限声明
- read: [project-code, config-files]
- write: [report-files]
- execute: [npm-audit, safety-check]

## 风险评估
- **等级**: medium
- **理由**: 可读取配置文件（可能含敏感信息），但输出为报告文件
- **缓解措施**: 配置文件中的敏感字段自动脱敏

## 替代方案
- 手动 Code Review（耗时，覆盖率低）
- SonarQube（需额外部署，成本高）
```

❌ Wrong:

```markdown
# Skill 评估报告

## 基本信息
- **名称**: some-tool
- **来源**: unknown
- **版本**: latest

## 功能描述
做一些有用的事。

## 权限
全部权限。
```

> 信息缺失、来源不明、权限过度、无风险评估。

---

### R04 — Skill 权限模型

**MUST** — Skill 必须遵循最小权限原则，仅声明完成任务所需的最小权限集：

| 权限类型 | 允许范围 | 禁止范围 |
|---------|---------|---------|
| read | 项目代码、项目文档、配置文件 | 系统文件、其他项目、环境变量 |
| write | 代码文件、测试文件、文档 | 配置文件、构建产物、系统目录 |
| execute | 预定义命令白名单 | rm、sudo、pip install、任何破坏性命令 |

**权限声明规范：**

```yaml
permissions:
  read:
    - project-code          # 项目源代码
    - project-docs          # 项目文档
    - config-files          # 配置文件（不含敏感字段）
  write:
    - code-files            # 源代码文件
    - test-files            # 测试文件
    - report-files          # 报告文件
  execute:
    - npm-test              # 测试命令
    - npm-lint              # 代码检查
    - git-status            # Git 状态查询
```

**权限校验规则：**

- Skill 运行时不得调用超出声明范围的工具或 API
- 每次权限使用必须记录到审计日志
- 尝试越权操作必须触发告警并中断执行

✅ Correct:

```yaml
# skills.yaml
enabled:
  - superpowers-zh

registry:
  - name: superpowers-zh
    permissions:
      read: [project-code, project-docs]
      write: [code-files]
      execute: [git-status, git-diff]
```

❌ Wrong:

```yaml
# skills.yaml
enabled:
  - some-skill

registry:
  - name: some-skill
    permissions:
      read: all
      write: all
      execute: all
```

> 权限过度授予，违反最小权限原则。

---

### R05 — Skill Registry 管理

**MUST** — 所有 Skill 必须在 skill-registry.yaml 中登记，保持单一事实来源：

```yaml
# skill-registry.yaml — 全局 Skill 注册表
version: "1.0"
updated_at: "2024-01-20"

skills:
  - name: superpowers-zh
    type: development
    source: community
    status: approved
    version: "2.4.1"
    maintainer: dev-tools@company.com
    scope: [coding, review, debugging, testing]
    risk: medium
    license: MIT
    permissions:
      read: [project-code, project-docs]
      write: [code-files]
      execute: [git-status, git-diff]
    lifecycle:
      discovered_at: "2023-06-01"
      evaluated_by: tech-lead
      approved_at: "2023-06-10"
      deprecated_at: null

  - name: java-review
    type: review
    source: team
    status: approved
    version: "1.2.0"
    maintainer: java-team@company.com
    scope: [java, spring-boot, mybatis]
    risk: low
    license: internal
    permissions:
      read: [project-code]
      write: none
      execute: none
```

**审批流程：**

```
开发者提交申请
    ↓
技术负责人评估（安全 + 权限 + 风险）
    ↓
项目负责人审批（高风险需安全负责人联审）
    ↓
写入 skill-registry.yaml
    ↓
通知相关团队
```

**版本追踪规则：**

- Major Version 变更必须重新评估
- Minor Version 变更只需技术负责人审批
- Patch Version 变更自动通过
- 所有变更必须记录 CHANGELOG

✅ Correct:

```yaml
# CHANGELOG.md
## [2.4.1] - 2024-01-15
### Added
- 新增 TypeScript 代码检查支持

## [2.4.0] - 2023-12-20
### Breaking Changes
- 重构权限模型，需重新审批
```

❌ Wrong:

```yaml
# skill-registry.yaml
skills:
  - name: some-skill
    version: latest        # 无具体版本号
    status: active         # 状态枚举错误
```

> 版本管理混乱，状态枚举不规范。

---

### R06 — 项目级 Skill 配置

**MUST** — 每个项目必须在 .standards/skills.yaml 中声明启用的 Skill：

```yaml
# .standards/skills.yaml — 项目级 Skill 配置
# Copy from templates/skills.yaml and customize for your project

# Enabled skills — AI will load these capabilities
enabled:
  - superpowers-zh       # AI 软件开发工作流（TDD、调试、代码审查）
  # - java-review        # Java 专用代码审查 Skill
  # - database-expert    # 数据库设计和优化 Skill
  # - security-audit     # 安全漏洞扫描 Skill

# Disabled skills — available but not active for this project
disabled:
  # - kubernetes-admin   # K8S 运维（tar.gz 部署不需要）
  # - frontend-design    # UI/UX 设计 Skill（后端项目不需要）

# Skill overrides — 针对特定 Skill 的配置调整
overrides:
  superpowers-zh:
    options:
      tdd_mode: strict    # 强制 TDD 模式
      max_file_changes: 5  # 单次最多修改 5 个文件
```

**配置规则：**

- enabled 列表中的 Skill 必须在 skill-registry.yaml 中存在且状态为 approved
- disabled 列表用于临时禁用，便于快速回滚
- overrides 用于调整 Skill 行为，不得降低安全级别

**启用/禁用流程：**

```bash
# 启用新 Skill
1. 确认 skill-registry.yaml 中已登记且状态为 approved
2. 编辑 .standards/skills.yaml，添加到 enabled 列表
3. 提交 PR，请求团队成员 Review
4. 合并后生效

# 禁用问题 Skill
1. 编辑 .standards/skills.yaml，移至 disabled 列表
2. 提交 PR，说明禁用原因
3. 合并后立即生效
```

✅ Correct:

```yaml
# .standards/skills.yaml
enabled:
  - superpowers-zh

disabled: []

overrides:
  superpowers-zh:
    options:
      tdd_mode: strict
```

❌ Wrong:

```yaml
# .standards/skills.yaml
enabled:
  - some-unregistered-skill  # 未在注册表中登记
  - another-skill:latest      # 语法错误
```

> 引用未登记的 Skill，配置语法错误。

---

### R07 — Skill 与 Rules 的边界

**MUST** — Rules、Skills、Knowledge 三者职责清晰分离，不得混用：

| 维度 | Rules（规则） | Skills（技能） | Knowledge（知识） |
|------|-------------|---------------|-----------------|
| 本质 | 约束行为边界 | 扩展能力边界 | 提供背景知识 |
| 表达 | "不能做" | "会做" | "知道" |
| 示例 | 禁止删除文件 | 执行 TDD 流程 | Spring Boot 最佳实践 |
| 存储位置 | .rules/ 或项目根目录 | .standards/skills.yaml | knowledge.yaml |
| 优先级 | 最高（L0） | 中等 | 最低 |

**边界规则：**

- Rules 不得包含具体实现逻辑（那是 Skill 的职责）
- Skill 不得违反 Rules（如 L0 安全护栏）
- Knowledge 不得强制执行（仅供 AI 参考）
- 三者不得互相嵌套或引用

✅ Correct:

```yaml
# .rules/AI_RULES.md
# Rules — 约束行为
## L0 Safety Guardrails
- 禁止执行 rm -rf 等不可恢复操作
- 禁止修改系统配置

# .standards/skills.yaml
# Skills — 扩展能力
enabled:
  - superpowers-zh  # 会执行 TDD、调试、代码审查

# knowledge.yaml
# Knowledge — 提供知识
spring_boot:
  best_practices:
    - 使用构造函数注入
    - 避免循环依赖
```

❌ Wrong:

```yaml
# .rules/AI_RULES.md
## 错误示范：Rules 包含实现逻辑
- 当需要测试时，运行 pytest --cov
- 当需要重构时，先写测试再改代码

# .standards/skills.yaml
## 错误示范：Skill 违反 Rules
enabled:
  - dangerous-skill  # 该 Skill 可执行 rm -rf
```

> Rules 不应规定具体实现步骤，Skill 不应违反安全规则。

---

### R08 — Skill 安全与风险控制

**MUST** — Skill 必须遵循以下安全原则：

**不可修改 Rules：**

- Skill 运行时不得修改 .rules/ 目录下的任何文件
- Skill 不得绕过 L0 安全护栏（即使被授权）
- Skill 不得降低现有安全级别

**不可绕过 L0 安全护栏：**

| L0 护栏 | Skill 行为限制 |
|---------|---------------|
| 不可恢复操作 | Skill 不得执行 rm -rf、覆盖非空目录等 |
| 版本控制高危操作 | Skill 不得执行 git push --force、git rebase 等 |
| 系统状态修改 | Skill 不得修改环境变量、安装系统软件等 |
| 敏感信息泄露 | Skill 输出不得包含密钥、Token、密码等 |

**风险分级与响应：**

| 风险等级 | 触发条件 | 响应措施 |
|---------|---------|---------|
| low | 仅读取，无副作用 | 正常执行，记录日志 |
| medium | 可写入代码文件，有有限执行权限 | 执行前提示，记录详细日志 |
| high | 可访问生产环境、执行危险命令 | 必须人工审批，执行后审计 |

**审计日志规范：**

```yaml
# audit-log.yaml
entries:
  - timestamp: "2024-01-20T10:30:00Z"
    skill: superpowers-zh
    action: write_file
    target: src/main.py
    user: developer@company.com
    result: success
    risk_level: medium

  - timestamp: "2024-01-20T10:31:00Z"
    skill: superpowers-zh
    action: execute_command
    command: git status
    user: developer@company.com
    result: success
    risk_level: low
```

✅ Correct:

```python
# Skill 安全检查示例
class SecureSkillExecutor:
    def execute(self, skill: Skill, action: Action):
        # 1. 检查是否违反 Rules
        if self.violates_rules(action):
            raise SecurityViolation("Skill 试图违反安全规则")

        # 2. 检查权限范围
        if not self.has_permission(skill, action):
            raise PermissionDenied("权限不足")

        # 3. 高风险操作需审批
        if action.risk_level == "high":
            approval = self.request_approval(action)
            if not approval.granted:
                raise ApprovalDenied("高风险操作未获批准")

        # 4. 记录审计日志
        self.audit_log.record(skill, action)

        # 5. 执行操作
        return action.execute()
```

❌ Wrong:

```python
# Skill 无安全检查
def execute_skill(skill: Skill, action: Action):
    return action.execute()  # 直接执行，无任何检查
```

> 缺少安全检查、权限校验、审计日志。

---

## Checklist

### Skill 引入检查清单

- [ ] 已在 skill-registry.yaml 中登记
- [ ] 已完成安全评估报告
- [ ] 已明确声明类型（development / review / deployment / analysis / governance）
- [ ] 已按最小权限原则声明权限范围
- [ ] 已评估风险等级（low / medium / high）
- [ ] 高风险 Skill 已获得项目负责人和安全负责人联合审批
- [ ] 已在 .standards/skills.yaml 中声明启用

### Skill 使用检查清单

- [ ] Skill 状态为 approved（非 deprecated）
- [ ] Skill 版本与项目兼容
- [ ] 操作符合声明的权限范围
- [ ] 高风险操作已获得人工审批
- [ ] 审计日志已记录

### Skill 废弃检查清单

- [ ] 已在 skill-registry.yaml 中标记 deprecated
- [ ] 已从 .standards/skills.yaml 的 enabled 列表移除
- [ ] 已通知相关团队
- [ ] 已保留废弃记录至少 30 天
- [ ] 已评估对现有工作流的影响
