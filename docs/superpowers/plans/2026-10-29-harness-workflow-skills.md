# Harness 工作流 Skill 化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在仓库内 `.trae/skills/` 落地 `harness-change` / `harness-vcs` / `harness-flow` 三个 Trae 项目级 skill，把 Layer 0 自身的变更单元生命周期、提交协议、校验门禁固化为可复用工作流，零契约改动。

**Architecture:** 三个 `SKILL.md` 为薄编排层，只写触发条件 / 步骤 / 校验点 / 对 `contract/*` 与 `templates/*` 的引用路径，不复制契约正文（契约仍是唯一 SSOT）。`harness-flow` 将三者编为单 Agent 顺序清单。依据 spec：`docs/superpowers/specs/2026-10-29-harness-workflow-skills-design.md`。

**Tech Stack:** Markdown（Trae SKILL.md，YAML frontmatter）；校验使用仓库自带 `node src/validate.mjs`（无需构建）。

---

## File Structure

| 文件 | 职责 |
|---|---|
| `.harness/workspace/changes/feature-harness-workflow-skills-001/proposal.md` | 本变更提案（引用 spec 的 AC-1..AC-6） |
| `.harness/workspace/changes/feature-harness-workflow-skills-001/tasks.md` | 任务清单 |
| `.trae/skills/harness-change/SKILL.md` | 变更单元生命周期 skill |
| `.trae/skills/harness-vcs/SKILL.md` | 提交协议 skill（按 `project.yaml → vcs` 分派） |
| `.trae/skills/harness-flow/SKILL.md` | 工作流编排 skill（单 Agent 顺序清单） |
| `.harness/workspace/changes/feature-harness-workflow-skills-001/verify.md` | 校验证据与 AC 逐条核对 |

---

### Task 1: 建立变更单元

**Files:**
- Create: `.harness/workspace/changes/feature-harness-workflow-skills-001/proposal.md`
- Create: `.harness/workspace/changes/feature-harness-workflow-skills-001/tasks.md`

- [ ] **Step 1: 创建 change 目录**

Run:
```powershell
New-Item -ItemType Directory -Force ".harness\workspace\changes\feature-harness-workflow-skills-001"
```
Expected: 目录创建成功。

- [ ] **Step 2: 写 proposal.md（引用 spec 的 AC，不复制 AC 正文之外的规则）**

Path: `.harness/workspace/changes/feature-harness-workflow-skills-001/proposal.md`
```markdown
# Proposal — feature-harness-workflow-skills-001

## Why
Layer 0 与消费项目反复执行同一批 SOP（变更单元生命周期、提交协议、校验门禁），目前散落在 AGENTS.md / contract / 人工经验中，AI 每次需重新理解，存在跑偏与重复叮嘱成本。

## What Changes
在 `.trae/skills/` 落地 3 个 Trae 项目级薄编排 skill（harness-change / harness-vcs / harness-flow），并建 flow 串联。本变更零契约改动。

## Out of Scope
契约修订；消费项目分发；多 Agent 编排；tests/ 新增引用存在性检查。

## 验收标准
- AC-1：`.trae/skills/` 下 3 个 SKILL.md 存在，frontmatter 含 name + description，description 明确写触发条件与边界。
- AC-2：三个 SKILL.md 不含契约正文副本；规则以引用路径指向 contract/* 或 templates/*。
- AC-3：harness-vcs 的 git 分支禁止 `git add -A`/`git add .`；svn 分支含 `-F UTF-8 --encoding UTF-8` 与 `svn log --xml` 校验步骤。
- AC-4：harness-flow 为单 Agent 顺序清单，含校验门禁步骤与失败回退，并显式声明非多 Agent 编排。
- AC-5：`node src/validate.mjs` 与 `node src/validate.mjs --project . --strict` 均退出码 0。
- AC-6：新会话触发验证：说"按 harness 流程走一次变更"时 harness-flow 被加载（人工记录）。

## Impact
新增 `.trae/skills/`（git 版本化）；不改动 contract/*、src/*、templates/*；不影响 validate 既有判定。

## 设计依据
docs/superpowers/specs/2026-10-29-harness-workflow-skills-design.md
```

- [ ] **Step 3: 写 tasks.md**

Path: `.harness/workspace/changes/feature-harness-workflow-skills-001/tasks.md`
```markdown
# Tasks — feature-harness-workflow-skills-001

- [ ] T1 写 `.trae/skills/harness-change/SKILL.md`
- [ ] T2 写 `.trae/skills/harness-vcs/SKILL.md`
- [ ] T3 写 `.trae/skills/harness-flow/SKILL.md`
- [ ] T4 运行校验门禁（自检 + --strict），记录证据
- [ ] T5 人工核对 skill ↔ 契约一致性，写 verify.md 并逐条引用 AC
- [ ] T6 归档 change 到 archive/，加日期前缀
- [ ] T7（可选）写 retro.md
```

---

### Task 2: 写 harness-change skill

**Files:**
- Create: `.trae/skills/harness-change/SKILL.md`

- [ ] **Step 1: 创建目录**

Run:
```powershell
New-Item -ItemType Directory -Force ".trae\skills\harness-change"
```
Expected: 目录创建成功。

- [ ] **Step 2: 写 SKILL.md（完整内容如下）**

Path: `.trae/skills/harness-change/SKILL.md`
```markdown
---
name: harness-change
description: 在实行 Harness 变更单元工作流时使用——创建（explore/proposal/tasks）、推进实现、编写 verify（逐条引用 AC）、归档到 archive/、（可选）补 retro 与知识回流。当用户要求新建变更单元、写提案/任务清单/验收证据、归档变更单元时触发。不适用于纯代码编写，也不适用于未接入 Harness 的项目。
---

# harness-change：变更单元生命周期

## 何时使用
- 用户要新建一个变更单元（change）
- 需要起草 explore / proposal / tasks / design / verify / retro
- 需要归档一个已完成的变更单元

## 何时不使用
- 只是写业务代码，不涉及变更单元
- 项目未接入 Harness（无 `.harness/workspace/`）

## 权威来源（唯一 SSOT，禁止在本文件复制其正文）
- 契约 `contract/harness-contract.md` §4（workspace 工作流契约）、§5.2（变更记录追溯）
- 模板 `templates/change/`：explore.md / proposal.md / tasks.md / design.md / verify.md / retro.md

## 步骤
1. 方向不明时：读 `templates/change/explore.md` 起草 `explore.md`（问题/选项/约束/待决问题/结论），人拍板后再继续。
2. 读 `contract/harness-contract.md` §4.1，按其命名规则创建 `.harness/workspace/changes/{change-id}/`；`type` 取值先读 `.harness/project.yaml → workflow.types`，无覆盖时用默认清单。
3. 依 `templates/change/proposal.md` 起草 `proposal.md`（验收标准条目用 `AC-<n>` 编号）；依 `templates/change/tasks.md` 起草 `tasks.md`。
4. 跨模块 / 架构级变更：依 `templates/change/design.md` 增补 `design.md`（可选）。
5. 实现并勾选 `tasks.md`。
6. **校验点**：归档前依 `templates/change/verify.md` 编写 `verify.md`——记录构建/测试证据，人工核查逐条引用 proposal 的 AC ID（契约 §4.4）。未验证不得声称通过。
7. 归档：将 change 目录移入 `.harness/workspace/archive/`，按契约 §4.1 加日期前缀（日期取变更创建日）。
8. 可选：依 `templates/change/retro.md` 补 `retro.md`。
9. 知识回流（人工动作）：把已验证认知合并进 `docs/knowledge/`，并在目标文档"变更记录"小节登记一行（契约 §5.2）。

## 失败回退
- `verify.md` 缺 AC 引用 → 回到步骤 6 补齐后再归档。
- `.harness/workspace/changes/` 根出现散落文件 → 移回所属 change 目录内。
```

- [ ] **Step 3: 自检 frontmatter**

Run:
```powershell
Select-String -Path ".trae\skills\harness-change\SKILL.md" -Pattern "^name: harness-change$","^description: .+" 
```
Expected: 两行均匹配（frontmatter 含 name 与 description）。

---

### Task 3: 写 harness-vcs skill

**Files:**
- Create: `.trae/skills/harness-vcs/SKILL.md`

- [ ] **Step 1: 创建目录**

Run:
```powershell
New-Item -ItemType Directory -Force ".trae\skills\harness-vcs"
```
Expected: 目录创建成功。

- [ ] **Step 2: 写 SKILL.md（完整内容如下）**

Path: `.trae/skills/harness-vcs/SKILL.md`
```markdown
---
name: harness-vcs
description: 在 Harness 项目中执行版本控制提交时使用——先读 .harness/project.yaml 的 vcs 字段，按 git 或 svn 分派对应提交协议。当用户要求提交变更、撰写提交信息、处理 SVN 两段式提交或中文乱码/E155040/E200009 时触发。不适用于没有 .harness/project.yaml 的项目。
---

# harness-vcs：提交协议（按 vcs 分派）

## 前置
读 `.harness/project.yaml` 的 `vcs` 字段（`git` | `svn`），据此进入对应分支。

## git 分支
- 提交信息用 Conventional Commits：`feat:` / `fix:` / `docs:` / `chore:` / `refactor:` / `test:`。
- **禁止** `git add -A` / `git add .`；必须按文件名添加。
- 用户明确指令的常规提交（commit / push / tag）直接执行，不再二次确认；AI **主动提议**的提交需先确认。
- 高危操作（`push --force` / `reset --hard` / `rebase` / `branch -D` / 删除分支）需明确确认后才执行。

## svn 分支
- 两段式提交：第一段提交主体改动 + 归档目录；第二段回填 `tasks.md` / `verify.md` 中的版本号并提交。
- 中文提交信息必须 `-F <UTF-8 文件> --encoding UTF-8`（无 locale 环境省略 `--encoding` 会按 Latin-1 误读，导致日志双重编码损坏）。
- 提交后用 `svn log --xml -r <rev>` 对中文日志做字节级校验，确认无损。
- 整树 move 必须与子路径改动放在同一提交事务（否则 E200009 路径不存在错误）。
- 混合版本工作副本批量 move 触发 E155040：先 `svn status -v` 确认无本地改动，再对目标路径局部 update，**禁止**整工作副本 update。

## 权威来源（唯一 SSOT，禁止复制正文）
- `contract/adoption-contract.md` §4.1（SVN 提交编码约定与 r16389/r16390 损坏实证）
- `docs/superpowers/retros/2026-10-17-paynow-migration-retro.md`（E155040 混合版本处置协议与 E200009 move 一致性批次教训）

## 失败回退
- `svn log --xml` 校验发现日志乱码 → 停止后续提交并报告（客户端不可自行修复，需 SVN 管理员启用 `pre-revprop-change` hook）。
```

- [ ] **Step 3: 自检关键禁令与编码步骤存在**

Run:
```powershell
Select-String -Path ".trae\skills\harness-vcs\SKILL.md" -Pattern 'git add -A','--encoding UTF-8','svn log --xml'
```
Expected: 三处均匹配。

---

### Task 4: 写 harness-flow skill

**Files:**
- Create: `.trae/skills/harness-flow/SKILL.md`

- [ ] **Step 1: 创建目录**

Run:
```powershell
New-Item -ItemType Directory -Force ".trae\skills\harness-flow"
```
Expected: 目录创建成功。

- [ ] **Step 2: 写 SKILL.md（完整内容如下）**

Path: `.trae/skills/harness-flow/SKILL.md`
```markdown
---
name: harness-flow
description: 需要"按 Harness 流程完整走一遍"时使用——把变更单元生命周期、校验门禁、提交协议编排为一条单 Agent 顺序清单。当用户说"按 harness 流程走一次变更""跑一遍 harness 工作流"时触发。
---

# harness-flow：工作流编排（单 Agent 顺序执行）

> 本 flow 是**单 Agent 顺序清单**，不是多 Agent 编排。

## 前置
读 `.harness/project.yaml` 确认 `vcs`；确认已接入 Harness（`.harness/workspace/` 存在）。

## 顺序清单
1. 加载 `harness-change`，推进变更单元至 `verify`（含 AC 逐条核对）。
   - 校验点：`verify.md` 存在，且人工核查逐条引用了 proposal 的 AC ID。
2. 校验门禁（任一命令退出码非 0 则**回退到 1**，禁止继续）：
   - `node src/validate.mjs`（Layer 0 自检）
   - `node src/validate.mjs --project . --strict`（自举校验；消费项目改为 `--project <dir>`）
3. 加载 `harness-vcs`，按 `vcs` 分派提交。
4. 归档 +（可选）retro + 知识回流登记。

## 引用
- 同级 skill：`harness-change`、`harness-vcs`
- 契约 `contract/harness-contract.md` §11（生命周期命令表）
```

- [ ] **Step 3: 自检单 Agent 声明与门禁步骤存在**

Run:
```powershell
Select-String -Path ".trae\skills\harness-flow\SKILL.md" -Pattern '单 Agent 顺序','validate.mjs --project . --strict'
```
Expected: 两处均匹配。

---

### Task 5: 校验门禁与一致性核对

**Files:**
- Create: `.harness/workspace/changes/feature-harness-workflow-skills-001/verify.md`

- [ ] **Step 1: 运行 Layer 0 自检**

Run:
```powershell
node src/validate.mjs
```
Expected: 退出码 0。

- [ ] **Step 2: 运行自举校验**

Run:
```powershell
node src/validate.mjs --project . --strict
```
Expected: 退出码 0，0 error / 0 warning（确认 `.trae/` 的引入零回归 → 支撑 AC-5）。

- [ ] **Step 3: 写 verify.md，逐条核对 AC**

Path: `.harness/workspace/changes/feature-harness-workflow-skills-001/verify.md`
```markdown
# Verify — feature-harness-workflow-skills-001

## 构建
| 命令 | 结果 | 证据 |
| --- | --- | --- |
| `node src/validate.mjs` | 通过，退出码 0 | CLI 退出码 |
| `node src/validate.mjs --project . --strict` | 通过，退出码 0，0 error / 0 warning | CLI 退出码 + text 报告 |

## 人工核查
| AC ID | 结论 | 证据 |
| --- | --- | --- |
| AC-1 | 通过 | `.trae/skills/harness-change|harness-vcs|harness-flow/SKILL.md` 均存在且 frontmatter 含 name + description |
| AC-2 | 通过 | 三个 SKILL.md 的规则均以引用路径指向 contract/* 或 templates/*，无契约正文副本 |
| AC-3 | 通过 | harness-vcs 含 `git add -A` 禁令、`--encoding UTF-8`、`svn log --xml` |
| AC-4 | 通过 | harness-flow 含单 Agent 声明、校验门禁与失败回退 |
| AC-5 | 通过 | 构建表两行均退出码 0 |
| AC-6 | 通过 | 新会话触发验证记录（触发语句 / 加载结果） |

## 结论
```

- [ ] **Step 4: 触发验证（AC-6）**

新开一个会话，输入"按 harness 流程走一次变更"。
Expected: `harness-flow` 被加载（人工记录结果，回填 verify.md 的 AC-6 行）。

---

### Task 6: 归档变更单元

**Files:**
- Move: `.harness/workspace/changes/feature-harness-workflow-skills-001/` → `.harness/workspace/archive/20261029-feature-harness-workflow-skills-001/`

- [ ] **Step 1: 归档（日期取变更创建日）**

Run:
```powershell
Move-Item ".harness\workspace\changes\feature-harness-workflow-skills-001" ".harness\workspace\archive\20261029-feature-harness-workflow-skills-001"
```
Expected: 目录移动成功，`changes/` 下无残留。

- [ ] **Step 2（可选）: 写 retro.md**

依 `templates/change/retro.md` 在归档目录内补 `retro.md`。

---

### Task 7: 提交（需用户明确指令后执行）

> 按用户规则，AI 主动提议的 commit 需先确认；以下命令在用户确认后执行。

- [ ] **Step 1: 按文件名添加并提交（git 分支）**

Run:
```powershell
git add .trae/skills/harness-change/SKILL.md .trae/skills/harness-vcs/SKILL.md .trae/skills/harness-flow/SKILL.md docs/superpowers/specs/2026-10-29-harness-workflow-skills-design.md docs/superpowers/plans/2026-10-29-harness-workflow-skills.md
git commit -m "feat: add harness workflow skills (change/vcs/flow)"
```
Expected: 提交成功；`git status` 干净。

---

## Self-Review

**1. Spec coverage:**
- spec §3.1 落位 → Task 2/3/4 创建 `.trae/skills/*/SKILL.md` ✅
- spec §3.2 三 skill 职责 → Task 2/3/4 内容 ✅
- spec §3.3 flow 编排 → Task 4 + Task 5 Step 1/2 门禁 ✅
- spec §3.4 防漂移纪律 → 各 skill「权威来源」段 + AC-2 ✅
- spec §5 验证方式 → Task 5 ✅
- AC-1..AC-6 → Task 5 Step 3 核对表逐条覆盖 ✅

**2. Placeholder scan:** 无 TBD/TODO/「类似上文」；每个文件步骤含完整内容。

**3. Type consistency:** skill 名称 `harness-change` / `harness-vcs` / `harness-flow` 与 `harness-flow` 内引用一致；`project.yaml → vcs` 字段名与契约 §9 一致；命令 `node src/validate.mjs` / `--project . --strict` 与契约 §11 一致。
