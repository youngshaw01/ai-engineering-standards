# Harness Engineering Blueprint v1

> **版本**：`blueprint@1.0.0`  
> **归属**：本仓库（`ai-engineering-standards`）Layer 0 — 与 [Harness-Bootstrap.md](Harness-Bootstrap.md) 配套  
> **模板**：[`templates/harness/blueprint-v1/`](../templates/harness/blueprint-v1/)  
> **Schema**：[`templates/harness/blueprint-v1/schema/project.schema.yaml`](../templates/harness/blueprint-v1/schema/project.schema.yaml)

---

## 1. 与三层治理的关系

本 Blueprint **不是**第四个层级，而是 Layer 0 中「如何把 `.harness` 建好、复制、升级」的**契约 + 模板 + 验收**：

| 层 | 位置 | Blueprint v1 提供什么 |
| --- | --- | --- |
| **Layer 0** | `ai-engineering-standards` | 本文、通用模板、init/adopt/upgrade 流程、通用检查约定 |
| **Layer 1** | 业务仓库 `.harness/` | `project.yaml`、rules、governance、knowledge、workspace、项目 gates |
| **Layer 2** | `.cursor/`、`.trae/` 等 | 由 `adapters/manifest.json` + sync 生成，**无规则权力** |

规则解析优先级不变：项目 `.harness` 覆盖全局标准，Adapter 只消费不定义。见 [README.md](../README.md#three-layer-governance-model)。

---

## 2. 目标与非目标

**目标**：空白项目可初始化并通过 L0 检查；既有项目可接入并产出 gap 清单；Blueprint 升级可预览且不静默覆盖 `governance/`、`knowledge/`、`specs/`、`rules/detail/` 正文。

**非目标（v1）**：独立 `harness-blueprint` 仓库；统一全公司 CI/技术栈；完整多项目升级 CLI；用 `AGENTS.md` 替代可执行 checks。

---

## 3. 项目实例目录契约（Layer 1）

### 必选

| 路径 | 职责 |
| --- | --- |
| 根 `AGENTS.md` | 短入口（§5），50–100 行 |
| `.harness/project.yaml` | 身份、blueprint 版本、验证命令引用、适配器启用 |
| `.harness/governance/exceptions.yaml` | 登记例外 |
| `.harness/rules/detail/` | 工具规则 SSOT |
| `.harness/adapters/manifest.json` | 生成物映射（无业务正文） |
| `.harness/public/tooling/gates.yaml` | **可执行**门禁列表 |
| `.harness/workspace/` | 任务与变更（非长期规范 SSOT） |

### 推荐

`knowledge/` 或 `wiki/`（**二选一**为域 SSOT）、`specs/`、`index/`、`skills/`、`.harness/checks/`（项目扩展）。

### 成熟度档位

- **bootstrap**：[`templates/harness/bootstrap/`](../templates/harness/bootstrap/)  
- **standard**：[`templates/harness/standard/`](../templates/harness/standard/)  
- **blueprint-v1 最小骨架**：[`templates/harness/blueprint-v1/`](../templates/harness/blueprint-v1/)（新项目或 adopt 目标形态）  
- **enterprise**：项目可选；**禁止**默认复制到所有仓库（见 PayNow 试点教训）

---

## 4. SSOT 优先级（冲突时）

1. 代码、迁移脚本、可重复通过的测试/门禁日志  
2. `.harness/specs/<module>.md`（已晋升合同）  
3. `.harness/governance/exceptions.yaml`  
4. `.harness/rules/detail/`  
5. `knowledge/` 或 `wiki/`（标明以代码为准）  
6. `workspace/` 过程产物  
7. Layer 2 生成物（以 detail 为准）  
8. 本仓库通用章节（引用，非项目内事实）

---

## 5. 根 `AGENTS.md` 结构（v1）

```markdown
## Project
## Rules
## Workflow
## Completion
## References
```

禁止：长规范全文、失效 CLI、与 `project.yaml` 重复的端口/环境表。详见模板 [`blueprint-v1/AGENTS.md`](../templates/harness/blueprint-v1/AGENTS.md)。

---

## 6. `project.yaml`（v1）

- **apiVersion**：`harness.blueprint/v1`  
- **kind**：`ProjectInstance`  
- 必须包含：`metadata.name`、`blueprint.version`、`blueprint.source`（指向本仓库相对路径）、`tooling.*`、`adapters.*`  

完整字段见 Schema。示例见模板 [`project.yaml`](../templates/harness/blueprint-v1/project.yaml)。

过渡期允许保留 `harness.yaml`；须在 `project.yaml` 的 `legacy_index` 中声明别名，阶段 C 后收敛。

---

## 7. 工具适配

- SSOT：`.harness/rules/detail/*.md`  
- Manifest：`.harness/adapters/manifest.json`  
- 同步脚本：项目侧实现（如 `sync.mjs`），须支持 `--check` 校验生成物  
- Manifest 中每条 `entry_files` 必须：**可被 sync 生成且 --check 覆盖**，或标 `manual` 且不在 AGENTS「常用命令」中承诺自动同步  

Cursor/Trae 约定见 [Cursor-Rules.md](Cursor-Rules.md)、[Trae-Rules.md](Trae-Rules.md)。

---

## 8. 五项能力与验收级别

| 能力 | 文档 | L0 验收 |
| --- | --- | --- |
| 初始化 | [workflows/init.md](../templates/harness/blueprint-v1/workflows/init.md) | 拷贝 blueprint-v1 + 填 project.yaml + 结构检查 |
| 接入 | [workflows/adopt.md](../templates/harness/blueprint-v1/workflows/adopt.md) | gap matrix + 无未登记双权威 |
| 知识治理 | §4 | conflicts 有决策或权威 |
| 执行治理 | 项目 changes / 可选十阶段 | 规划任务有 change_id |
| 持续验证 | gates.yaml + sync --check | fast gates 可重复 |
| 升级 | [workflows/upgrade.md](../templates/harness/blueprint-v1/workflows/upgrade.md) | 预览 diff，不覆盖 §4 保护路径 |

| 级别 | 含义 |
| --- | --- |
| **L0** | 结构检查 + fast `verify-gates` |
| **L1** | full gates + 项目声明的 smoke（可选） |

---

## 9. 版本

| 版本 | 持有方 |
| --- | --- |
| `blueprint@x.y.z` | 本仓库 `CHANGELOG.md` |
| `project.yaml` → `blueprint.version` | 各业务仓库 |
| `adapter-manifest` | `manifest.json` 内 `$schema` |

升级时禁止静默覆盖：`governance/`、`knowledge/`、`specs/`、`rules/detail/`。

---

## 10. 试点

Malaysia AcqSys（`20260810_PayNow`）为首个 enterprise 接入实例；gap 与行动清单见项目变更单元 `governance-audit-20261012`（实例内文档，非 Layer 0 SSOT）。

---

## 相关文档

- [Harness-Bootstrap.md](Harness-Bootstrap.md) — 成熟度与 workspace  
- [Better-Harness.md](Better-Harness.md) — 工作流审计  
- [Skill-Governance.md](Skill-Governance.md) — Skill 不得替代 Rule  
