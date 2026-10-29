# Harness 工作流 Skill 化设计规格（自举试点）

> 日期：2026-10-29
> 状态：已批准（待随变更单元实施）
> 上位契约：`contract/harness-contract.md`（v3.1.0，本设计**不改动契约**）
> 范围：Layer 0 标准库自身工作流的模块化 skill 试点（零契约改动、可回滚）

## 1. 背景与问题

### 1.1 动机

Layer 0 与消费项目在变更推进中反复执行同一批 SOP：变更单元生命周期（explore → proposal/tasks → 实现 → verify → archive → retro → 知识回流）、提交协议（git / SVN 两段式）、校验门禁（`validate` 自检 + `--strict` 自举）。这些步骤目前散落在 `AGENTS.md`、`contract/*` 与人工经验中，AI 每次需重新理解，存在跑偏与重复叮嘱成本。

### 1.2 已有先例

`templates/bootstrap/` 已是"模块 + flow 串联"的原型：`prompts/00~07` + `COORDINATOR.md` + `workflow/quality-gates.md` + `STATUS.md` 状态机。本设计将同一模式推广到工作流主链路。

### 1.3 目标

把最高频、最易出错的两块流程固化为可复用的 Trae 项目级 skill，并用一个编排 skill 串联，形成"一次触发、按清单执行、每步有校验点"的工作流。

## 2. 已确认的决策记录

| 决策点 | 结论 |
|---|---|
| 核心目标 | **固化执行流程**（非可移植性、非架构演进、非降低人工） |
| 落地归属 | **先做自举试点**：只服务本仓库 Layer 0 自身工作流，零契约改动 |
| 试点范围 | 先切 **2 个核心模块**（提交协议 + 变更单元生命周期），含校验门禁子步骤，用 flow 串联 |
| VCS 口径 | **参数化两者**：按 `project.yaml → vcs`（`git` \| `svn`）分派；本仓库为 git 分支实例 |
| 方案选型 | **方案 A**：仓库内薄编排 skill，随 git 版本化，内容全部引用契约与模板 |
| 落位与机制 | Trae **项目级** skill：`<项目>/.trae/skills/{name}/SKILL.md`；优先级 项目 > 用户 > 全局 |

### 2.1 事实核验

- 本仓库版本控制为 **git**（`origin/main`，提交风格为 Conventional Commits：`feat:` / `fix:` / `docs:` / `chore:` / `refactor:` / `test:`）；SVN 两段式提交与 GBK 编码实践属**消费项目**（ITS/PayNow/MPOC）。
- Trae 官方支持项目级 skill，路径 `<项目>/.trae/skills/`（来源：Trae 官方文档 `docs.trae.ai/ide/skills`）。
- `.gitignore` 未忽略 `.trae/`，skill 可随 git 版本化评审。
- 契约 §3.3 禁止路径为 `.harness/skills/` 等，**不含** `.trae/`；红线 1 扫描面为 `docs/` 下标准树签名子目录，**不含** `.trae/`（实施时以实测复核）。

## 3. 设计明细

### 3.1 落位

```
d:\project_ai\person\ai-engineering-standards\
└── .trae/skills/
    ├── harness-change/SKILL.md
    ├── harness-vcs/SKILL.md
    └── harness-flow/SKILL.md
```

`SKILL.md` 主体 ≤ 200 行；详细材料按需拆入同级 `references/`（渐进式披露），单层引用、不做链式引用。

### 3.2 skill 职责边界

| skill | 触发时机 | 步骤骨架 | 引用（SSOT，不抄正文） |
|---|---|---|---|
| `harness-change` | 创建 / 推进 / 归档一个变更单元 | explore → 建 `{type}-{slug}-{NNN}` → proposal（`AC-<n>` 编号）+ tasks → 实现勾选 → verify（逐条引用 AC ID）→ archive（`{YYYYMMDD}-` 前缀，日期取创建日）→ retro → 知识回流登记"变更记录" | 契约 §4.1/§4.2/§4.3/§4.4/§5.2；`templates/change/*` |
| `harness-vcs` | 提交前 | 读 `project.yaml → vcs` 分派：<br>**git**：Conventional Commits；禁 `git add -A`/`git add .`，按文件名 add；高危操作（force/reset/rebase/delete/merge）需确认；用户明确提交指令后直接执行不二次确认<br>**svn**：两段式提交（第一段主体+归档，第二段回填版本号）；`-F <UTF-8 文件> --encoding UTF-8`；`svn log --xml` 字节级校验中文日志；E155040 混合版本处置、E200009 move 一致性批次；禁止整工作副本 update | `contract/adoption-contract.md` §4.1；`docs/superpowers/retros/2026-10-17-paynow-migration-retro.md` |
| `harness-flow` | 想"按 harness 流程走一遍" | 见 §3.3 编排 | `harness-change` + `harness-vcs` + 契约 §11 命令表 |

### 3.3 flow 编排逻辑（单 Agent 顺序执行）

```
1) harness-change：推进到 verify（含 AC 逐条核对）
2) 校验门禁：
     node src/validate.mjs                          # Layer 0 自检
     node src/validate.mjs --project . --strict     # 自举（消费项目改 --project <dir>）
   → 非 0 则回退到 1)，禁止继续
3) harness-vcs：按 vcs 分派提交
4) 归档 +（可选）retro + 知识回流登记
```

- 每步含**校验点 + 失败回退动作**。
- 明确声明：本 flow 为**单 Agent 顺序清单**，非多 Agent 编排，对齐契约 §1.3 非目标。

### 3.4 防漂移纪律

`SKILL.md` 内**只允许**出现：触发条件、步骤、校验点、对契约节/模板文件的**引用路径**。禁止复制契约正文。契约是唯一 SSOT，skill 为薄指针（对齐红线 1 与分层模型）。

## 4. 验收标准（AC）

| AC ID | 验收标准 |
|---|---|
| AC-1 | `.trae/skills/` 下存在 `harness-change`、`harness-vcs`、`harness-flow` 三个 `SKILL.md`，frontmatter 含 `name` + `description`，description 明确写触发条件与边界 |
| AC-2 | 三个 `SKILL.md` 均不含契约正文副本；所有规则/流程以引用路径指向 `contract/*` 或 `templates/*` |
| AC-3 | `harness-vcs` 的 git 分支禁止 `git add -A`/`git add .`；svn 分支含 `-F UTF-8 --encoding UTF-8` 与 `svn log --xml` 校验步骤 |
| AC-4 | `harness-flow` 的编排为单 Agent 顺序清单，含校验门禁步骤与失败回退动作，并显式声明非多 Agent 编排 |
| AC-5 | `node src/validate.mjs` 与 `node src/validate.mjs --project . --strict` 均退出码 0（`.trae/` 引入零回归） |
| AC-6 | 新会话触发验证：说"按 harness 流程走一次变更"时 `harness-flow` 被加载（人工记录） |

## 5. 验证方式

| 项 | 方法 |
|---|---|
| 触发有效 | 新会话说"按 harness 流程走一次变更"，确认 skill 被加载 |
| 一致性 | 人工核对 skill 步骤 ↔ 契约 §4/§5，结论写入变更单元 verify.md |
| 零回归 | `validate.mjs` 自检与 `--strict` 自举均退出码 0 |

## 6. 非目标（YAGNI）

- 契约修订（本试点零契约改动）。
- 消费项目分发 / 标准库内分发。
- 多 Agent 编排。
- `tests/` 新增"skill 引用存在性"检查（列为可选加固，非本期）。

## 7. 风险与缓解

| 风险 | 缓解 |
|---|---|
| skill 与契约漂移 | 只引用不抄写；verify 阶段人工核对一致性 |
| 项目级 skill 未被加载 | 已用官方文档核实路径；AC-6 以实测确认 |
| `.trae/` 引入 validate 误报 | AC-5 实测退出码；§3.3/红线 1 扫描面不含 `.trae/` |
| flow 被误解为多 Agent 编排 | `harness-flow` 内显式声明单 Agent 顺序执行 |

## 8. 变更单元映射

- 建议单元：`feature-harness-workflow-skills-001`（type = `feature`）。
- 产物：proposal（引用本 spec 的 AC-1..AC-6）+ tasks + verify +（可选）retro。
- 本 spec 为设计依据；proposal 不得与本 spec 冲突。
