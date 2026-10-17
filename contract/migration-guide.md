# Migration Guide：v2 → v3

> 上位：[harness-contract.md](harness-contract.md)（v3.0.0）  
> 适用：`schemaVersion: 2.0.0` 的存量消费项目。  
> 原则：工具判合规 + **人工迁内容**（机器管结构，人管内容；工具不自动搬迁）。

## 1. 通用升级步骤

1. **基线判定**：`node <standards>/src/validate.mjs --project . --report text`  
   预期 error：`schemaVersion: 2.0.0`、缺 `workspace/changes|archive`、缺 `docs/knowledge|rules/README.md`。
2. **结构生成**：`node <standards>/src/adopt.mjs --project . --dry-run` 审阅后执行（冲突跳过，不覆盖已有文件）。
3. **配置升级**：`.harness/project.yaml` → `schemaVersion: "3.0.0"`（可选：`workflow.types` 定制变更类型）。
4. **入口对齐**：`AGENTS.md` 更新为 v3 形态（变更单元工作流 + knowledge/rules 指向），≤120 行。
5. **知识归位**：按契约 §5.1 落位标准移动文档；每个 knowledge 文档补"变更记录"小节（来源记 `bootstrap`）。
6. **迭代验收**：`validate --report text` 至 error 清零；`--strict` 至 warning 清零。

## 2. 三类项目画像

### 2.1 零包袱型（如 MPOC-AM）

- 现状：workspace 为空，AGENTS.md 为模板原文，无 v1 遗产。
- 动作：通用步骤 1–6；知识从现有位置（如 `docs/ai-knowledge/`）**平移**进 `docs/knowledge/`（changelog 记 `bootstrap`，原位置删除）；AI 规则适配层转薄指针（≤60 行）。

### 2.2 轻度自造型（如 ITS AdPush）

- 现状：自造 `current/{task_id}/` 布局 + `history/`；AI_RULES.md 为完整规则副本（已分叉）；v1 归档存在 `.harness/knowledge/` 断链。
- 动作：通用步骤 1–6 +：
  - `current/{task_id}` 未完成项 → 迁入 `changes/{type}-{slug}-{NNN}/`（按契约 §4.1 重命名）。
  - `history/*` → `archive/{YYYYMMDD}-{type}-{slug}-{NNN}/`（日期取原任务日期）。
  - AI_RULES.md 厚副本 → 薄指针；项目特化条款迁入 `docs/rules/`。
  - v1 归档断链：回填指向 `docs/knowledge/`，或整体移入 `docs/_legacy/` 只读。
  - 知识/规则平移补 changelog。

### 2.3 重度 v1 遗产型（如 PayNow）

- 现状：950 行 task.yaml 阶段机；`docs/harness/` 14 子目录 v1 标准树副本；两套 change 命名并存；产物散落（脚本写入自家规范禁止的目录）。
- 分层处置：
  - **提取转化**：项目特有知识/规则 → `docs/knowledge/`、`docs/rules/`（补 changelog）。
  - **封存**：task.yaml、v1 阶段机记录、迁移快照 → `workspace/archive/v1-legacy/`（只读）。
  - **归位**：现有变更单元 → 按契约 §4.1 命名迁入 `changes/` 或 `archive/`；散落脚本/产物 → 对应 change 的 `artifacts/`。
  - **裁决**：`docs/harness/` 14 子目录树 = 红线 1（标准树副本）→ 有价值条目提取进 `docs/rules|knowledge/` 后，整树移入 `docs/_legacy/` 只读或删除（SVN 历史可回溯）。
- 建议：在 MPOC 试点复盘后执行，吸取试点经验；可启用 bootstrap 流水线做"现有文档一致性校验 + 补缺口"。

## 3. 回滚

- SVN：`svn revert` 已改文件；删除未提交的新增文件。  
- Git：分支回退。  
- 工具不写回滚逻辑（沿袭契约 §11）。
