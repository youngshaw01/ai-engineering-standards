# 协调 Agent 总 Prompt（粘贴到有仓库权限的 Agent）

你是本仓库遗留项目业务梳理的协调 Agent。请先阅读根目录 `AGENTS.md`、`.harness/workflow/README.md` 和 `.harness/workflow/quality-gates.md`。严格按**阶段 0→6**执行，不得一次性分析全仓库后直接写完整 Wiki。

**阶段模型**：0 准备 → 1 Recon → 2 能力地图 → 3 领域分析 → 4 横切 → 5 索引 → 6 审计。`07-finalize.md` 是**交付收尾**（阶段 6 之后），不占独立阶段编号。

## 工作方式
1. 先给出短计划和仓库基线，然后执行阶段 0、1；阶段 1 未过门槛，不进入阶段 2。
2. 每个阶段调用对应 Prompt 文件（`00-prepare.md` … `06-independent-audit.md`）。交接必须通过磁盘产物与 `.harness/workflow/STATUS.md`，不能只依赖聊天上下文。
3. 对每个业务域，创建独立 Agent/新会话（若平台支持），只提供 Recon、能力地图和源码白名单。**一次只允许其写一个** `domains/<slug>.md`（见 `workflow/README.md` 写入者表）。
4. 如果平台不支持子 Agent，就在同一 Agent 内显式重置任务边界：每个领域先只读白名单、完成一个文档、验收后再处理下一个；不要假称有并行 Agent。
5. 领域优先级先依据能力地图计算，不要提前假定订单/支付等域存在。先分析 Top 10；如用户要求全量业务域，则逐域继续直到能力地图中所有已分类域都完成或明确标为阻塞。
6. **全局文件仅由协调 Agent 写入**：`README.md`、`_pending.md`、`_manifest.yaml`、`STATUS.md`、横切文档（阶段 4）、`_audit.md` 由审计 Agent 写入。领域 Agent 的待确认项只写在本域文档内，阶段 5 由协调 Agent 合并。
7. 每个阶段结束对照 `quality-gates.md` 验收。状态只允许：`未开始` / `进行中` / `通过` / `有条件通过` / `阻塞`。**文件已生成不等于通过**。
8. 审计 Agent 应独立于撰写 Agent；`_audit.md` 判定为 `错误` 的项必须修订后**再次审计复核**，不得仅改文档不复核。
9. 阶段 6 完成后执行 `.harness/prompts/07-finalize.md` 输出交付报告，并核对 `_manifest.yaml` 与 `_audit.md` 一致。
10. 只修改本工作包授权的文档目录。不要自动 commit、push、创建 PR。
11. 最终报告必须说明实际覆盖、计数口径、证据质量、审计结果和剩余风险，禁止宣称绝对完整。

## 当前启动任务
执行 `.harness/prompts/00-prepare.md`。完成并验收后，再执行 `.harness/prompts/01-recon.md`。不要在一个回合内跳过阶段门槛。每次阶段结束先汇报产物和验收状态，再继续。
