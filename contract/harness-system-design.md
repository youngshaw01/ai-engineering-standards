# Harness 工程标准设计与契约

> **版本**：设计稿 v0.3.1（上位文档）  
> **状态**：已落库；与 **运行契约** 不一致时，以 [`harness-contract.md`](harness-contract.md)（R0 可执行 SSOT）为准，直至 backlog 中的契约修订完成  
> **范围**：概念、职责、演进路径、能力与实现的分层说明  
> **非目标**：本文不自动触发 R1 目录、新运行功能或 `schemaVersion` 升版  

## 0. 文档关系

| 文档 | 角色 |
| --- | --- |
| **本文** | Harness **体系**总纲：五部分逻辑职责、标准库 vs 项目实例、接入与 Agent 工作方式、能力分层 |
| [`harness-contract.md`](harness-contract.md) | **Runtime Contract R0**：当前可执行、可测试的最小形状与工具语义 |
| [`adoption-contract.md`](adoption-contract.md) | `init` / `adopt` 接入细则 |
| [`project-config.schema.json`](project-config.schema.json) | `project.yaml` 机器可读约束 |

三层模型：

- **Harness Standard** — 「合格的 Harness」是什么（标准库 `contract/` + 工具）  
- **Harness Project** — 业务仓中的实例（`AGENTS.md` + `.harness/`）  
- **Harness Runtime / Tooling** — `init` / `adopt` / `validate`（R0：`src/*.mjs`）

**Harness 工作定义**：面向 AI 辅助软件工程的项目级 **运行契约与治理机制**，使 Agent 行为可引导、可验证、可追溯。

逻辑五部分（**不等于五个目录**）：Project Context、Standards、Workflows、Quality Gates、Agent Interface。

---

## 1. 标准库与业务项目

### 1.1 `ai-engineering-standards`（标准库）

定义契约、模板、初始化/接入/校验工具与验收测试。回答：「什么才是合规的 Harness？」

**非目标**：语言/领域规范百科、跨 Agent sync 平台、在 Layer 0 堆叠 `standards/java/` 等。

### 1.2 业务仓库 `.harness/`（项目实例）

保存该项目的事实、流程与检查配置。回答：「这个项目应该怎样开发？」  
**不是**标准库的完整复制。

### 1.3 阶段（目录按需启用）

| 阶段 | 业务项目最小集 | 说明 |
| --- | --- | --- |
| **R0（当前）** | `AGENTS.md`、`.harness/project.yaml`、`.harness/README.md`、`.harness/workspace/` | 不预建空目录 |
| **R1（规划）** | 可选 `.harness/docs/`（有内容才建） | 唯一候选能力开关；见 §4 |
| **R2+** | `workflows/`、`checks/`、`templates/` 等 | 每目录须职责 + 可验证规则 |

目标结构草图（R2 全貌，**非 R0 交付**）见评审记录；R0 冻结，不为目标结构提前 mkdir。

---

## 2. 消费项目合规：两类「禁止/旧版」信号（规范拆分）

运行契约 §3.3 自然语言将 **路径** 与 **配置内容特征** 写在同一段；设计与工具输出须 **拆开**，避免 `forbiddenPathsPresent: string[]` 无法表达文件内容。

### 2.1 禁止路径（并列 SSOT）

**规范权威（SSOT）**：[`harness-contract.md`](harness-contract.md) §3.3 中的 **路径与文件** 列表（实现侧当前为六项，与 `FORBIDDEN_LEGACY_PATHS` 一致）：

| 规范路径 |
| --- |
| `.harness/harness.yaml` |
| `.harness/rules/` |
| `.harness/skills/` |
| `.harness/knowledge/` |
| `.harness/wiki/` |
| `.standards/` |

> **说明**：`.harness/harness.yaml` 为 **文件路径**；其余为目录。规范叙述中的「`harness.yaml`」与此路径等价。

| 环节 | 行为 |
| --- | --- |
| **运行实现** | `src/lib/paths.mjs` → `FORBIDDEN_LEGACY_PATHS`（**实现** §3.3 路径表，非第二份规范） |
| **adopt（发现，规划）** | JSON 字段 `forbiddenPathsPresent: string[]`（**未来**；R0 未输出） |
| **validate（判定）** | 存在则 `configErrors`，整体不合规 |

### 2.2 旧版配置特征（非路径）

**规范权威**：§3.3 中的 **配置形态** + [`adoption-contract.md`](adoption-contract.md) §3 + `scanLegacy()` 语义。

| 信号 | 检测 | adopt | validate |
| --- | --- | --- | --- |
| `.harness/harness.yaml` 存在 | 路径（亦属 §2.1） | 阻断 exit **3**（除非 `--acknowledge-legacy`） | legacy 标志 |
| `project.yaml` 含 Blueprint `apiVersion: harness.blueprint/v1` | **内容**（`legacy.mjs`） | 阻断 exit **3**（除非 `--acknowledge-legacy`） | legacy 标志 |
| `.harness/project.json` | 路径 + 格式 | 警告，不阻断 | 警告 |

**工具输出字段**：使用既有 `legacy: string[]`（如 `LEGACY_V1_*`），**不**放入 `forbiddenPathsPresent`。

### 2.3 规范与实现一致性（测试边界）

| | 说明 |
| --- | --- |
| **当前状态（R0 @ f19636c）** | `forbidden-paths.test.mjs` 将 `FORBIDDEN_LEGACY_PATHS` 与测试内 **硬编码数组** 对齐；**不**解析 `harness-contract.md` 正文。契约单独被改时，该测试 **不一定**失败。 |
| **目标状态** | 建立能验证「契约路径表 ↔ 实现列表」一致性的检查（例如从契约抽取或维护单一机器可读清单）；达成前 **不宣称**已具备契约↔实现的自动一致性保障。 |
| **设计原则** | SSOT 在契约 §3.3 **路径表**（及 adoption 对 legacy **内容** 的约定）；代码为实现；测试描述须诚实反映覆盖范围。 |

---

## 3. 标准库版本与校验能力（V-1～V-4）

**设计原则**：项目 **必须声明** `standards.repository` + `standards.version`（及 `schemaVersion`）；禁止无声明地隐含跟随某分支。

**运行能力**（仅当实现与测试覆盖后可标为「已实现」）：

| ID | 能力 | R0（f19636c） |
| --- | --- | --- |
| **V-1** | 字段存在与 `project-config.schema.json` 校验 | ✅ |
| **V-2** | 使用 **当前标准库检出树**中的 Schema 校验 `project.yaml`，并结合代码中的 **最小结构规则**（必需路径、禁止路径表、`LAYER0_LAYOUT` 等）执行 `validate` | ✅（分项实现） |
| **V-3** | 按 `standards.version` **定位并加载**对应发布版本的契约/Schema 再校验 | ❌ 未实现 |
| **V-4** | 版本钉扎：`standards.revision`（commit SHA）或契约内容摘要，防 tag 漂移 | ❌ 未实现（设计建议） |

**V-2 说明（准确表述）**：

- `validate` **不会**将 `harness-contract.md` 全文解析为可执行规则。  
- 可执行逻辑来自：**Schema 文件**、**路径常量**、**Layer 0 布局列表**、**legacy 扫描** 等 **各自实现**；它们与契约正文的一致性是 **需独立保障** 的事项（见 §2.3）。  
- 表述为「validate 读取本地 contract/」易高估能力；应理解为「V-2：当前检出下的 Schema + 已实现的结构/路径/legacy 规则」。

**V-4 设计建议（非 R0）**：优先不可变 Git 引用；可选字段记录 SHA 或 `contract/` 摘要。

---

## 4. `capabilities`（R1 前）

仅定义三态语义，**不**称通用模块系统：

| 状态 | 含义 |
| --- | --- |
| 未声明 | 不启用可选模块；不检查可选路径 |
| 显式关闭 | 声明不用某能力；契约修订后定义与目录冲突时的行为 |
| 显式启用 | 仅当该能力在契约中有路径 + 职责 + 测试时才允许 |

R1 唯一候选：**`docs`**（有内容才建 `.harness/docs/`）。R0 `project.yaml` **无** capabilities 字段。

---

## 5. 接入：init / adopt / validate

### 5.1 共同底线

- adopt 不覆盖业务关键文件（除非 `--force` 且限于模板列表）  
- 不机械搬迁全部历史文档  
- 旧 `AGENTS.md` 不预设正确  
- 未知结构保守报告，不擅自删除  
- 接入后须可说明哪些规则已生效、哪些未迁移  

### 5.2 adopt 与 validate：同定义、异策略

- **路径与 legacy 定义**：§2.1、§2.2；adopt 与 validate 共用同一实现源（路径表、`scanLegacy`），**不**共用同一退出策略。  
- **阻断型 legacy**（§2.2）：未 `--acknowledge-legacy` 时 adopt **先** exit **3**，**不会**继续模板写入。  
- **非阻断型禁止路径**（§2.1 中除已作为阻断项处理的 `harness.yaml` 文件外，指 **并列 SSOT 目录** 等）：**规划上** adopt 仅报告 `forbiddenPathsPresent`，**不单独**因此阻断 adopt；**但** validate 仍失败。  
- **限定表述**：「禁止路径存在时 adopt 仍可完成模板写入」仅适用于 **未触发 §2.2 阻断型 legacy** 的情形；存在 `harness.yaml` 或 Blueprint `project.yaml` 且未 acknowledge 时，**不得**写入。

### 5.3 新项目 / 旧项目路径

- **init**：最小模板 → validate → 开发  
- **adopt**：扫描 → 报告（含未来 `forbiddenPathsPresent`）→ adopt → validate  

---

## 6. 优先级、冲突与 v1 封板

### 6.1 权威与冲突（设计层）

优先级用于 **查阅顺序**，非自动判赢。不可调和冲突时 Agent **停步并报告** `CONFLICT_UNRESOLVED`。

| 层级 | 来源 |
| --- | --- |
| L0 | 标准库 **Runtime Contract**（项目不得否定其禁止项） |
| L1 | `.harness/project.yaml` |
| L2 | 已启用的项目 SSOT（如 `docs/`） |
| L3 | `AGENTS.md`（路由） |
| L4 | 代码、测试、配置、门禁日志（**证据**；与已批准需求冲突时不自动以代码为准） |

### 6.2 v1 封板（两条规则）

| 规则 | 内容 |
| --- | --- |
| **R-A 自动运行** | `init` / `adopt` / `validate` **不得**依赖 v1 封板树为默认实现或静默 SSOT |
| **R-B 人工/迁移** | 维护者可 **只读**对照封板 tag 或项目内 v1 残留；**不属于**工具默认路径 |

---

## 7. `AGENTS.md`（设计目标）

**契约级（目标）**：可验证入口——存在、指向 `project.yaml`、验证命令或 README 指针、不与 L0 目录约定冲突。  
**行数**：SHOULD 简短（常见 50–120 行），**非**合规判据。

---

## 8. 文档治理与 Agent 生命周期（方向）

文档闭环：发现缺口 → 验证事实 → 归入层级 → 审查 → SSOT → 可被 AGENTS 发现。  
正式文档归属 `.harness/docs/`（R1 起，有内容才建）；不用 `wiki/` + `knowledge/` 双轨 SSOT。

Agent 生命周期（设计）：需求澄清 → 方案设计 → 任务拆解 → 编码与验证 → 审查与交付 → 有选择地回写文档。  
跨 Agent sync **暂不建设**；先证明简洁入口可驱动真实开发。

---

## 9. 定案（R0 冻结期）

| 事项 | 定案 |
| --- | --- |
| R0 | 保持 f19636c 范围；不预建目标目录 |
| R1 | 优先验证可选 `docs`；无通用 capabilities 框架 |
| adopt / validate | 同定义、异策略；`forbiddenPathsPresent` 为后续字段 |
| 设计落库 | 本文 |
| 运行契约修订 | 独立 backlog（§10） |

---

## 10. 运行契约差异 backlog（独立 PR，本文落库不自动完成）

以下与 **本文 v0.3.1** 不一致，**不**因本文落库而视为已修复：

1. **§3.3 行文**：拆分为「禁止路径表」与「旧版配置特征」，与 §2 对齐  
2. **§7 优先级** → §6.1 + 冲突停步  
3. **§4 业务事实** → 与冲突规则一致  
4. **§4/§5 AGENTS.md** → MUST 清单 + 行数 SHOULD  
5. **§7 v1 封板** → R-A / R-B  
6. **`adoption-contract.md`**：扫描分层、`forbiddenPathsPresent`（拟定）、B3 阻断例外明文  
7. **§2.3 目标一致性检查**（契约↔实现）— 实现与测试另 PR  
8. **V-3 / V-4** — 实现另 PR  

---

## 11. 设计条款 × R0（f19636c）映射（校准）

| 条款 | f19636c |
| --- | --- |
| R0 四项必需产物 | 契约 §3.1；工具 + 测试 ✅ |
| 禁止路径六项（实现） | validate ✅；§3.3 行文含 Blueprint 特征 ⚠️ 待 backlog 拆分 |
| Blueprint / legacy 内容 | `scanLegacy` ✅；非 `forbiddenPathsPresent` |
| V-1 | ✅ |
| V-2（Schema + 分项结构规则） | ✅；非整份契约 NLP 执行 |
| V-3 / V-4 | ❌ 未实现 |
| adopt 阻断 legacy + acknowledge | ✅ |
| `forbiddenPathsPresent` | ❌ 未实现（设计 §2.1） |
| validate 禁止路径失败 | ✅ |
| 测试：实现列表锁定 | ✅ 当前；契约正文自动对齐 ❌（§2.3） |
| CLI / summary / CI 配置 | 源码 ✅；CI 运行需远端确认 |
| 优先级 / AGENTS 行数 / v1 表述 | ⚠️ 契约 backlog |
| capabilities / docs / workflows 树 | 未来 |

---

## 12. 验收（体系级，非单测）

- 读本文 + `harness-contract` + README 可理解 R0 边界  
- 空项目 init → validate  
- 旧项目 adopt --dry-run → validate；报告与判定语义符合 §2、§5  
- 新目录进入模板前：本文有职责 + SSOT + 验证说明三行  

**R0 正确性加固**在 `f19636c` 已完成实现侧闭环；**体系设计**由本文承接；**运行契约措辞与契约↔实现自动对齐**留在 §10 backlog。
