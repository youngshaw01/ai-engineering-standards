# 工作流验证清单（封版前 / 冷启动测试）

> 供**未参与工作包编写**的 Agent 或人工审查员使用。  
> 目标：证明另一个 Agent 仅凭 `COORDINATOR.md` 与磁盘规程即可执行，并在中断后恢复。

---

## A. 一致性检查（修改工作包后必做）

| 检查项 | 位置 | 通过标准 |
|--------|------|----------|
| 阶段编号 | `COORDINATOR.md`、`workflow/README.md`、`STATUS.template.md`、各 `0x-*.md` 标题 | 主流程为**阶段 0–6**；`07-finalize.md` 标注为**交付收尾**，不占阶段编号 |
| 路径引用 | `workflow/README.md`、各 Prompt | 无 `templates/STATUS` 等仅适用于标准库的路径；一律使用 `.harness/...` |
| 状态命名 | `STATUS.template.md`、`quality-gates.md`、`07-finalize.md`、`_audit.template.md` | 阶段状态：`未开始` / `进行中` / `通过` / `有条件通过` / `阻塞`；审计结论：`通过` / `有条件通过` / `不通过` |
| 交叉引用 | Skill、`Skill-Governance.md`、kit `README.md` | 均指向 `legacy-project-wiki-kit` 为可执行主版本，Skill 为概览 |

---

## B. 冷启动测试（复制到测试仓库后）

1. 仅向 Agent 提供：根目录 `AGENTS.md`、`.harness/prompts/COORDINATOR.md`（不要求阅读 Skill 或外部文档）。
2. Agent 应能自行找到 `workflow/README.md`、`quality-gates.md`，并完成模板复制（`STATUS.md`、`_manifest.yaml`、wiki 模板）。
3. 中断测试：在阶段 1 中途停止，换新会话，仅提供 `STATUS.md` + 已有产物，应能从阶段 1 或 2 续跑。
4. 记录：Agent 是否误改源码、是否跳过门槛、是否混淆阶段编号。

---

## C. 阶段 0–2 实测（推荐首个封版门槛）

| 阶段 | 验证点 |
|------|--------|
| 0 | `STATUS.md` 含基线 commit、允许修改范围、工作区状态 |
| 1 | `00-recon.md` 含**分类入口清单**（非仅 HTTP）；每类有扫描范围；`source_commit` 已写入 |
| 2 | `01-capability-map.md` 中 `N_unique = M + U` 可复核；非 HTTP 入口**独立表**与 HTTP 分开计数 |
| 2 | `_manifest.yaml` 的 `entry_counts` 与能力地图数字一致 |

抽查：随机 5 条 HTTP 注册点 + 2 条非 HTTP 入口，证据行号可定位。

---

## D. 多 Agent 并行（阶段 3 前确认规程）

- [ ] 领域 Agent 任务说明中写明**唯一可写文件**（单个 `domains/<slug>.md`）
- [ ] 并行运行时不写 `README.md`、`_pending.md`、`_manifest.yaml`、`STATUS.md`
- [ ] 协调 Agent 在阶段 5 统一合并待确认项与 manifest

---

## E. 完成判定（禁止“文件已生成即完成”）

Wiki 整体可交付仅当同时满足：

- [ ] 阶段 0–6 在 `STATUS.md` 中为 `通过` 或 `有条件通过`（无未解决的 `阻塞`）
- [ ] `_audit.md` 最终结论为 `通过` 或 `有条件通过`，且**错误项已修订并复核**
- [ ] `_manifest.yaml` 中 `audit_status` 与 `_audit.md` 一致
- [ ] `07-finalize.md` 交付报告已输出，且明确剩余风险

---

## F. 源码变更后的重审

当 `git rev-parse HEAD` ≠ `_manifest.yaml` 的 `source_commit`：

1. 比较 `git diff source_commit..HEAD --name-only`，识别受影响路径。
2. 更新 `domains_needing_reanalysis` 与各领域 `stale` 标记。
3. 仅重跑受影响域及相关横切文档；全库重扫仅在入口注册机制变更时进行。
