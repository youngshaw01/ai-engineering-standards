# Harness Contract v3.0.0 实现计划

> 日期：2026-10-17
> 规格：`docs/superpowers/specs/2026-10-17-harness-v3-contract-design.md`（已批准）
> 执行方式：分 Phase 推进，每个 Phase 结束设检查点（验证 + 用户确认）

## 完成标准（全部满足才算完成）

1. `node --test tests/*.test.mjs` 全绿
2. `node src/validate.mjs`（Layer 0 自检）退出码 0
3. `node src/validate.mjs --project . --strict`（Layer 0 自举）退出码 0
4. MPOC：`validate --project <mpoc> --strict` 退出码 0
5. MPOC：至少 1 个真实变更走完 proposal → tasks → 实现 → verify → archive 全流程
6. 试点复盘输出，契约缺陷已修订回 Layer 0

## 规模披露（用户 L1 规则要求）

Phase 1–4 涉及约 35 个文件（新增约 25 个模板/测试文件，约 2000+ 行），远超"≤5 文件/≤300 行"默认预算。**本计划获批即视为对该规模的确认**；每个 Phase 结束暂停供用户检查。

---

## Phase 1：契约与模板资产（纯文档/模板，无代码）

### 1.1 版本与 Schema

| 文件 | 变更 |
|---|---|
| `VERSION` | `2.0.0` → `3.0.0` |
| `CHANGELOG.md` | 新增 `[3.0.0]` 段（Added/Changed/Notes） |
| `contract/project-config.schema.json` | `title` → `HarnessProjectConfigV3`；`schemaVersion.const` → `"3.0.0"`；新增可选 `workflow` 对象（`additionalProperties: false`，`properties.types`: string 数组，`items.pattern: ^[a-z]+$`，`minItems: 1`，`uniqueItems: true`） |

### 1.2 契约文档

| 文件 | 变更 |
|---|---|
| `contract/harness-contract.md` | 升级 v3.0.0：§3 消费项目布局加入 `workspace/changes/`、`workspace/archive/`、`docs/knowledge/`、`docs/rules/`；新增 §workspace 工作流契约（change-id 命名、产物分级、生命周期、changelog 回流）；新增 §知识/规则落位标准（含 5.1.1 changelog 约定、5.1.2 bootstrap 可选阶段）；红线四条；§9 校验规则改为 error/warning 分级表；§8 生命周期表加 v2→v3 升级行 |
| `contract/adoption-contract.md` | §3 v1 残留表后追加一行指引：v2 → v3 升级见 `migration-guide.md` |
| `contract/migration-guide.md`（新增） | v2→v3 升级手册：通用步骤（adopt --dry-run → 人工升级 project.yaml schemaVersion → validate --report 迭代）；三类项目画像（MPOC 零包袱型 / ITS 轻度自造型 / PayNow 重度 v1 遗产型）各自的分层处置清单 |

### 1.3 模板升级（templates/minimal/）

| 文件 | 变更 |
|---|---|
| `templates/minimal/.harness/project.yaml` | `schemaVersion: "3.0.0"`；追加注释示例 `workflow.types` |
| `templates/minimal/AGENTS.md` | v3 入口：Workflow 段改为变更单元流程（proposal → tasks → 实现 → verify → archive），指向 `docs/knowledge/`、`docs/rules/`，创建 change 时引用标准库 `templates/change/` |
| `templates/minimal/.harness/README.md` | v3 结构说明 |
| `templates/minimal/.harness/workspace/changes/README.md`（新增） | 变更单元模型 + 命名规范说明 |
| `templates/minimal/.harness/workspace/archive/README.md`（新增） | 归档规则（日期前缀、只读） |
| `templates/minimal/docs/knowledge/README.md`（新增） | 知识索引模板（含变更记录小节约定示例） |
| `templates/minimal/docs/rules/README.md`（新增） | 项目特化规则说明（薄指针原则） |
| `templates/minimal/.harness/workspace/.gitkeep` | 删除（被 changes/archive READMEs 取代） |

### 1.4 变更产物模板（templates/change/，新增 4 文件）

`proposal.md`（Why / What Changes / Out of Scope / 验收标准 / Impact）、`tasks.md`（checkbox 清单）、`design.md`（跨模块/架构变更用）、`verify.md`（构建/测试/验证记录，含"未验证不得声称通过"）。

### 1.5 bootstrap 流水线 re-home（templates/bootstrap/，新增）

从 `sealed/v1-full:templates/harness/legacy-project-wiki-kit/` 提取（`git show sealed/v1-full:<path>`），机械改写后落位：

- `prompts/00-prepare.md` … `07-finalize.md`、`COORDINATOR.md` ← 原 `.harness/prompts/*`
- `artifacts/README.template.md`、`_audit.template.md`、`_manifest.template.yaml`、`_pending.template.md` ← 原 `wiki/*.template.*`
- `workflow/README.md`、`STATUS.template.md`、`agent-handoff.md` ← 原 `workflow/*`

改写规则：产物落点 `.harness/wiki/` → `docs/knowledge/`；删除对禁止路径的一切引用；SKILL 描述中的 catalog 引用删除。6 阶段顺序保持：recon → capability-map → domain-analysis → cross-cutting → index → audit。

### Phase 1 检查点

- 人工 review 契约与模板文本
- 无代码变更，无测试可跑
- **建议 git commit #1**（用户确认后执行）

---

## Phase 2：工具链代码升级

### 2.1 `src/lib/paths.mjs`

```text
TEMPLATE_FILES → v3 七文件清单（AGENTS.md / .harness/project.yaml / .harness/README.md /
  .harness/workspace/changes/README.md / .harness/workspace/archive/README.md /
  docs/knowledge/README.md / docs/rules/README.md）
CONSUMER_REQUIRED → 追加 .harness/workspace/changes、.harness/workspace/archive
LAYER0_LAYOUT → 追加 contract/migration-guide.md、templates/change、templates/bootstrap
新增常量：
  DEFAULT_CHANGE_TYPES = ["feature", "bugfix", "refactor", "docs", "ops"]
  ARCHIVE_PREFIX_RE = /^\d{8}-/
  STANDARDS_TREE_SIGNATURE = ["rules","skills","checks","workflows","governance","specs","adapters","mcp"]（命中≥3 → 红线1信号）
  THICK_RULE_MAX_LINES = 60
  THICK_RULE_PATTERNS = [/L0\s*-\s*Safety/i, /L1\s*-\s*Confirmation/i, /L4\s*-\s*Output/i]
  KNOWLEDGE_CHANGELOG_HEADING = "## 变更记录"
```

### 2.2 `src/lib/cli.mjs`

`--report` 加入 `FLAG_VALUE` / `KNOWN_FLAGS`（值 `text|json`，非法值报错；默认 `json`）。init/adopt 忽略该 flag（仅 validate 消费）。

### 2.3 `src/lib/report.mjs`（新增）

`formatReport(report, format)`：`json` 输出现有结构 + `findings: [{level, code, path, message}]`；`text` 渲染人类可读分级报告（ERROR/WARNING 分组 + 汇总行 + 下一步指引）。

### 2.4 `src/validate.mjs`

`validateConsumer` 重构为结构化 findings：

**error 级**：缺必备结构；schema 校验失败（`schemaVersion` 为 `2.0.0` 时输出定向指引"按 contract/migration-guide.md 升级"）；禁止路径；红线 1（标准树副本签名，扫描 `docs/` 排除 `docs/_legacy/`）；红线 2（AI_RULES.md >60 行或命中 L0-L5 模式）。

**warning 级**：`changes/` 与 `archive/` 下目录命名不合规（type 来自 project.yaml `workflow.types`，缺省用 DEFAULT_CHANGE_TYPES）；`workspace/changes/` 根散落文件；`docs/knowledge/*.md` 缺"## 变更记录"小节；进行中 change 缺 proposal.md 或 tasks.md。

**通过标准**：`ok = errors.length === 0 && (!strict || warnings.length === 0)`；退出码沿袭 1。

### 2.5 `src/init.mjs` / `src/adopt.mjs` / `src/lib/template.mjs`

预期零改动（TEMPLATE_FILES 驱动生成，`mkdirSync recursive` 已支持嵌套路径）——仅验证。

### Phase 2 检查点

- `node src/validate.mjs`（layer0 模式此时会因 Phase 3 未更新 LAYER0_LAYOUT 校验的新路径已存在而通过——Phase 1 已创建全部文件）
- **建议 git commit #2**（用户确认后执行）

---

## Phase 3：测试更新与新增

### 3.1 更新现有测试（断言 v2 → v3）

`greenfield` / `cold-start` / `init-idempotent` / `adopt-legacy`（文件清单断言）；`schema-validation`（3.0.0 + workflow.types 合法/非法用例）；`contract`（契约文本关键断言）；`layer0-layout`（新路径）；`forbidden-paths`（红线 1/2 用例并入或拆分）；`cli-args`（--report 解析）。

### 3.2 新增测试

| 测试文件 | 覆盖 |
|---|---|
| `tests/v3-workflow-structure.test.mjs` | init 生成完整 v3 树；change-id 命名校验（合法/非法/自定义 types）；archive 日期前缀 |
| `tests/knowledge-changelog.test.mjs` | knowledge 文档缺/含"## 变更记录"→ warning/通过 |
| `tests/thick-copy.test.mjs` | AI_RULES.md 61 行 / 含 L0-L5 标题 → error；60 行薄指针 → 通过 |
| `tests/standards-tree-copy.test.mjs` | docs/ 下含 ≥3 签名子目录 → error；docs/_legacy/ 豁免 |
| `tests/report-mode.test.mjs` | --report text 渲染；--report json 向后兼容；--strict 下 warning 失败 |
| `tests/v2-to-v3.test.mjs` | schemaVersion 2.0.0 项目 → error + migration 指引文案 |
| `tests/bootstrap-templates.test.mjs` | templates/bootstrap 文件齐全；内容不引用禁止路径（grep `.harness/wiki` 等） |

### Phase 3 检查点

- `node --test tests/*.test.mjs` 全绿
- **建议 git commit #3**（用户确认后执行）

---

## Phase 4：Layer 0 自举 v3

1. 本仓库 `.harness/project.yaml`：`schemaVersion` → `3.0.0`（本仓库自身是消费项目）
2. 生成自身 `workspace/changes/`、`workspace/archive/`、`docs/knowledge/`、`docs/rules/`（adopt 或手工，docs/ 已有 superpowers/ 不冲突）
3. 根 `AGENTS.md` 对齐 v3 入口形态
4. 验证：`node src/validate.mjs` && `node src/validate.mjs --project . --strict` 双通过
5. **建议 git commit #4**（用户确认后执行）

---

## Phase 5：MPOC 试点（SVN 项目，全程本地、不自动 svn commit）

目标：`D:\document\svn\posp\sysdev\MPOC-AM\java\branchs\feature-20260714-pci-remove-modules`

| 步骤 | 操作 | 验证 | 保护点 |
|---|---|---|---|
| 5.1 | `validate --project <mpoc> --report text` 基线差距 | 输出含 schemaVersion 2.0.0 error + 缺结构 error | 只读 |
| 5.2 | `adopt --dry-run` 审阅后执行（生成 v3 骨架；project.yaml/README/AGENTS 冲突跳过） | 生成清单 = dry-run | 新增文件本地可回退 |
| 5.3 | `project.yaml` 手工升级 `schemaVersion: 3.0.0` | `validate --report` schema error 消失 | 单文件编辑 |
| 5.4 | `AGENTS.md` 定制（MPOC 构建命令、PCI 引用、knowledge/rules 指向）；`AI_RULES.md` 转薄指针 | ≤120 行、无厚副本特征 | ⚠️ **AI_RULES.md 属用户保护文件（L0 0.5），修改前需用户逐项确认** |
| 5.5 | 知识平移：`mpoc/docs/ai-knowledge/*` → `docs/knowledge/`（changelog 登记来源 `bootstrap`、README 索引）；原位置删除 | 索引可导航、原位置无残留 | ⚠️ **删除操作需用户确认（L1）**；SVN 历史可回溯 |
| 5.6 | `validate --project <mpoc> --strict` | 退出码 0 | — |
| 5.7 | 选真实小变更走全流程（proposal → tasks → 实现 → verify → archive） | 产物齐全、结构合规、负担可接受 | ⚠️ **svn commit 由用户执行**（`--encoding gbk`），AI 只准备提交清单 |
| 5.8 | 试点复盘：负担数据、契约缺陷清单、ITS/PayNow 推广建议 | 复盘文档 | — |

---

## Phase 6：复盘与推广（后续会话，本计划不执行）

试点缺陷修订回 Layer 0 → ITS（含 `.harness/knowledge/` 断链回填、自造布局迁移、AI_RULES.md 厚副本转化）→ PayNow（v1 遗产分层处置 + bootstrap 校验补缺）。

---

## 风险与回滚

| 风险 | 缓解 |
|---|---|
| schemaVersion const 升 3.0.0 后三个 v2 项目 validate 立即变红 | 预期行为（差距报告）；migration-guide 提供升级路径；error 文案含指引 |
| 现有 CI/脚本依赖 validate 的 JSON 输出结构 | `--report` 默认 json 保持结构兼容，仅追加 `findings` 字段 |
| 测试大面积更新引入回归 | Phase 3 一次性跑全套件；现有 10 个测试文件逐一迁移而非重写 |
| MPOC 操作失误 | SVN 工作副本全部本地操作，`svn revert` / 删新增文件即回滚；不自动提交 |
| Layer 0 git 误操作 | 所有 commit 点均先征求用户确认 |

## 验证命令汇总

```bash
# Phase 3/4
node --test tests/*.test.mjs
node src/validate.mjs
node src/validate.mjs --project . --strict

# Phase 5（MPOC）
node <standards>/src/validate.mjs --project <mpoc> --report text
node <standards>/src/adopt.mjs --project <mpoc> --dry-run
node <standards>/src/validate.mjs --project <mpoc> --strict
```
