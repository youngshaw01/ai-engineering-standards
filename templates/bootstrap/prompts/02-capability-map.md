# 阶段 2 — 业务能力地图与入口盘点

输入：通过验收的 `docs/knowledge/00-recon.md`。

输出：`docs/knowledge/01-capability-map.md`

角色：业务能力分析师。只根据实际入口和调用链聚类，不根据目录名猜业务。

执行步骤：
1. 重扫并核对所有 HTTP/API 注册源，包括框架注解、生成路由、版本路由、管理/内部路由。逐条记录 method、path、handler、注册文件行号、handler 文件行号。
2. 统计其他可触发业务的入口：消费者、定时任务、CLI、webhook、事件处理器。它们不是 HTTP endpoint，单独建表，不混入 HTTP endpoint 数。
3. 根据 URL 语义、handler 行为、读写实体和调用关系形成业务能力域。相近 endpoint 可以归组，但每条必须保留原始入口记录。
4. 每个能力域说明“系统实际做什么”，并列出主要 endpoint、其他入口、核心代码路径、涉及实体与证据。
5. 无法归类项进入“未分类”，说明缺少何种证据；不要强行归类。
6. 对重复注册、版本别名、参数化路径、自动生成路由，说明计数口径并保留来源。

HTTP 表格：
| ID | Method | Path | Handler | 能力域 | 注册位置 | Handler 位置 | 分类依据/状态 |
所有路径都必须可点击定位到代码行。

非 HTTP 入口表：
| ID | 类型 | 名称/Topic/Job | Handler | 能力域 | 注册位置 | 处理位置 | 状态 |

必须报告（并同步到 `_manifest.yaml` 的 `entry_counts`）：
- HTTP：`http_raw`（N）、`http_unique`（N_unique，说明去重规则）、`http_classified`（M）、`http_unclassified`（U）；**必须满足** `http_unique = M + U`
- 非 HTTP：`non_http` 合计及 `non_http_by_type` 分项（mq_consumer / cron / cli / webhook / event 等）
- 每类非 HTTP 入口的扫描范围与可能盲区
- 仍可能遗漏的动态路由/生成路由
- 深入分析 Top 10 能力域及排序理由（入口数量、核心业务影响、数据/资金/权限风险；未知影响标待确认）

重要：不能将“归类数”按 endpoint 行重复计数。若一个 endpoint 映射多个能力域，主分类只能有一个，其他关联另列。非 HTTP 入口不得并入 HTTP 表或 HTTP 计数。
结束时更新 `STATUS.md` 与 `_manifest.yaml` 的 `entry_counts`。文档尾部加 `## 变更记录` 小节，初始行来源记 `bootstrap`。
验收：抽查 endpoint 注册点与 handler；计数公式成立；每条 endpoint 有 handler 与证据；未分类和盲区透明。失败时先修正，不进入领域分析。
