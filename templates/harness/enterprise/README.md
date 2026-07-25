# Enterprise Harness Template

> 企业级 .harness 模板说明——适用于复杂系统、多 Agent 协作场景。
>
> **不提供完整骨架**——Enterprise 通常项目特定，标准库只提供说明和清单。

---

## 适用场景

- 核心业务系统（如金融、支付、交易系统）
- 多 Agent 协作开发
- 需要 MCP（Model Context Protocol）集成
- 企业治理与审计要求
- 多团队协作、可复用资源沉淀

**参考实例**：Malaysia AcqSys 项目（SVN 老项目 + 复杂业务 + 多模块）

---

## 完整结构

在 Standard 基础上增加：

```
.harness/
├── AGENTS.md                      ← AI 入口
├── harness.yaml                   ← 治理配置
│
├── rules/                         ← 项目规则
├── knowledge/                     ← 项目知识
├── workspace/                     ← AI 工作记录
│   ├── current/{task_id}/
│   └── history/{task_id}/
├── context/                       ← 上下文分层
│   └── layers.yaml
├── config/                        ← 项目配置
│   └── paths.yaml
│
├── agents/                        ← 【Enterprise】多 Agent 定义
│   ├── application-owner.md
│   └── code-reviewer.md
├── mcp/                           ← 【Enterprise】MCP Server 配置
│   └── servers.yaml
├── skills/                        ← 【Enterprise】AI 能力
│   ├── skills.yaml
│   └── public/                    ← 可复用 skill
│       └── coding-skill/
│           └── SKILL.md
├── governance/                    ← 【Enterprise】治理策略
│   └── policy.yaml
├── audit/                         ← 【Enterprise】审计记录
│   └── changes/
└── public/                        ← 【Enterprise】可复用资源
    ├── skills/
    ├── templates/
    └── tooling/
        └── gates.yaml
```

---

## 新增目录说明

| 目录 | 用途 | 示例内容 |
|------|------|---------|
| `agents/` | 多 Agent 定义 | application-owner.md、code-reviewer.md、expert-reviewer.md |
| `mcp/` | MCP Server 配置 | servers.yaml——定义项目启用的 MCP Server |
| `skills/` | AI 能力声明 | skills.yaml + public/ 下的 SKILL.md |
| `governance/` | 治理策略 | policy.yaml——规则优先级、覆盖策略、例外登记 |
| `audit/` | 审计记录 | changes/——AI 修改记录、决策追溯 |
| `public/` | 可复用资源 | skills/、templates/、tooling/gates.yaml |

---

## agents/ 详细说明

定义项目中不同角色的 AI Agent 行为：

```markdown
# agents/application-owner.md

## Role
Application Owner — 负责需求分析、架构决策

## Responsibilities
- 理解业务需求
- 评估架构影响
- 决策技术选型
- 确认实现方案

## Boundaries
- 不直接修改代码
- 不执行 commit/push
- 输出方案需人工确认
```

```markdown
# agents/code-reviewer.md

## Role
Code Reviewer — 负责代码审查

## Responsibilities
- 检查代码规范
- 验证业务逻辑
- 评估性能影响
- 标注风险点

## Output Format
- MUST fix: 必须修复
- SHOULD fix: 建议修复
- NOTE: 仅供参考
```

---

## mcp/servers.yaml 示例

```yaml
# MCP Server 配置
version: "1.0"

servers:
  - name: database
    transport: stdio
    command: mcp-server-mysql
    env:
      MYSQL_HOST: ${DB_HOST}
      MYSQL_PORT: ${DB_PORT}

  - name: filesystem
    transport: stdio
    command: mcp-server-filesystem
    args:
      - --root
      - ./src
```

---

## skills/skills.yaml 示例

```yaml
# AI 能力声明
version: "1.0"

skills:
  - id: coding-skill
    path: skills/public/coding-skill/SKILL.md
    enabled: true

  - id: code-review
    path: skills/public/code-review/SKILL.md
    enabled: true

  - id: expert-reviewer
    path: skills/public/expert-reviewer/SKILL.md
    enabled: true
    trigger: stage_2_requirements_review
```

---

## governance/policy.yaml 示例

```yaml
# 治理策略
version: "1.0"

rule_priority:
  - project_override           # 项目规则覆盖一切
  - global_standard            # 通用标准兜底
  - ai_default                 # AI 默认行为

exceptions:
  - rule_id: SEC-004
    reason: 项目需要修改 Docker 配置
    approved_by: tech_lead
    approved_at: 2026-07-24

audit:
  log_changes: true
  log_path: audit/changes/
  retention_days: 90
```

---

## public/tooling/gates.yaml 示例

```yaml
# 质量门禁
version: "1.0"

gates:
  pre_commit:
    - name: code-style
      command: checkstyle
      must_pass: true
    - name: unit-test
      command: mvn test
      must_pass: true

  pre_merge:
    - name: code-review
      command: manual
      must_pass: true
    - name: integration-test
      command: mvn verify
      must_pass: true
```

---

## 从 Standard 升级到 Enterprise

### 步骤

1. **评估必要性**——是否真的需要多 Agent / MCP / 治理审计？
2. **逐个增加目录**——不要一次性全部创建
3. **优先级**：`agents/` > `mcp/` > `skills/` > `governance/` > `audit/` > `public/`
4. **每个目录都需要人工定义内容**——标准库不提供 Enterprise 骨架

### 升级检查

- [ ] 已评估 Enterprise 必要性
- [ ] 已创建 `agents/` 并定义至少 2 个 Agent 角色
- [ ] 已创建 `mcp/servers.yaml`（如需 MCP 集成）
- [ ] 已创建 `skills/skills.yaml` 并声明启用的 skill
- [ ] 已创建 `governance/policy.yaml` 定义规则优先级
- [ ] 已创建 `audit/` 用于追溯
- [ ] 已创建 `public/` 沉淀可复用资源

---

## 参考

完整规范详见 [Harness-Bootstrap.md](../../../11-AI-DevTools/Harness-Bootstrap.md)。
