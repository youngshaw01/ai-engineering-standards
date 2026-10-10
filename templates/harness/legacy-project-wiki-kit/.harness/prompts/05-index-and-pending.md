# 阶段 5 — 索引、交叉链接、待确认汇总

输入：`.harness/wiki/` 下所有阶段产物和 `.harness/workflow/STATUS.md`。
输出：完善 `.harness/wiki/README.md`、`.harness/wiki/_pending.md`、`.harness/wiki/_manifest.yaml`，并修复允许范围内的文档链接。

README 必须包含：
1. Wiki 用途、证据标记解释；页头与 `_manifest.yaml` 同步：`source_commit`、`analyzed_at`、`coverage_status`、`audit_status`、`pending_count`。
2. 新人阅读顺序：全局侦察 → 能力地图 → 架构 → 核心业务域 → 跨域流程 → ER/状态机 → 外部集成 → 待确认与审计。
3. 每个文件一句话摘要。
4. 业务域 → 代码路径反查表。
5. 业务域 → 入口 ID/API/消息/定时任务映射。
6. 明确本 Wiki 不是产品需求真相源；产品语义待业务确认。

`_pending.md`：
- 合并所有领域文档的待确认问题，去重但保留来源链接。
- 表格：ID、问题、领域、已查证范围、缺失证据、建议确认人、影响/优先级、来源文档、状态。
- 不得把未解决项删掉；只有得到新证据或明确的人类确认才可关闭，并记录关闭依据。

交叉链接检查：
- 每个领域提及其他领域时，能映射则链接到对应文档。
- 检查所有相对链接是否存在，修复路径错误。
- 列出孤立文件（未被 README 或其他文档引用）。
- 检查标题、文件名、slug 一致性。
- 检查每个文档是否标明核对 commit/日期/覆盖状态。

验收：索引中的每个文件都存在；每个业务域都有代码路径反查；pending 问题有唯一 ID 和来源；链接检查结果可复现。更新 `STATUS.md`。
