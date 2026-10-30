---
name: java-code-review
description: Java 代码专项审核入口，在通用代码审核骨架上补充 Java 六维检查（职责/事务/异常/并发/可测试性/兼容性）、规则编号引用与行号级证据要求。触发词：Java 代码审核、专项 review、代码质量审查、合并前检查。
---

# Java Code Review

## 与 TRAE-code-review 的边界（单向引用）

| 能力 | TRAE-code-review | 本 skill |
|---|---|---|
| 范围确定 / 意图推断 / Mermaid 摘要 | 提供 | 复用，不重写 |
| 问题扫描清单 | 通用 10 条 Tips | 用 ST/TX 规则集**替代**通用 Tips |
| 双路交叉验证（Step 5.5） | 提供机制 | 复用同一机制 |
| 输出表格 | 通用列 | 扩展为 6 字段契约 |
| 修复选择交互 | 提供 | 复用 |

- 同一范围内不得同时独立触发两个 skill 做重复审核
- 用户显式指定 `TRAE-code-review` 且对象是 Java 时：由它执行流程并加载 ST/TX 规则集，不另出一份本 skill 报告
- 用户显式指定本 skill 时：本 skill 主导，`TRAE-code-review` 仅作流程来源

## 三个 Skill 的加载关系

本 skill 是**唯一审核入口**；加载专项 skill 的 references **不等于**再次启动专项审核流程。

| Skill | 唯一职责 | 本 skill 如何用它 |
|---|---|---|
| `java-code-review` | 审核入口、流程编排、六维覆盖、证据与报告质量（RV） | 自身提供 RV，也只输出一份报告 |
| `java-code-structure` | ST-01～ST-10 结构规则 | 读取其 `references/structure-rules.md` 规则正文，不另跑其流程 |
| `java-transaction-management` | TX-01～TX-10 事务规则 | 读取其 `references/transaction-rules.md` 规则正文，不另跑其流程 |

同一审核范围只生成一份审核报告，不得出现主 skill 与专项 skill 各自审核、各出一份报告的情况。

## 规则优先级

1. `docs/rules/charter.md`
2. 项目覆盖层 `docs/rules/detail/java-structure.md`、`docs/rules/detail/java-transaction.md`
3. `references/review-rules.md`（RV）与两个专项 references（ST/TX）

## 生效规则集

`生效规则集 = 母版全集 − 被覆盖规则 + 覆盖层新增条款`

- 覆盖层明确替代：母版条款不再作为独立判定依据，改用项目条款
- 覆盖层新增条款：与母版同时生效
- 覆盖层未声明：继续使用母版
- 模糊描述不构成豁免

报告首部必须打印：已启用必检规则、已启用选检规则、被覆盖规则（母版 ID + 项目条款位置 + 替代关系）、覆盖层缺失情况。

## 执行步骤

1. 声明审核范围（单方法 / 单文件 / 模块 / change）与可识别基线，未声明不得开始
2. 判定对象所属模块（svc / dao / ctl / lsn），加载三层规则，计算并打印生效规则集
3. 上下文取证：读目标方法、DAO 实现、事务模板、事件监听器、调用方；不得凭命名推断
4. 六维扫描：
   - 职责与结构 → ST-01～ST-05、ST-08～ST-10
   - 事务与一致性 → TX-01～TX-04、TX-08、TX-10
   - 异常语义 → TX-07 + 项目 `java-exception.md`
   - 并发幂等 → TX-05 / TX-06 / TX-09
   - 可测试性 → ST-07 + 依赖隔离与现有测试条件
   - 兼容性 → 接口签名、返回值结构、数据库语义、调用方兼容性
5. 双路交叉验证：派 2 个独立子代理复核全部候选项；结果作为**置信度**（2/2 高置信、1/2 标注需人工确认、0/2 复核证据后决定是否保留），不作为严重级别唯一依据
6. 输出问题表 + 涉及事务边界时附 Mermaid 时序图；每条问题标注「确认问题 / 待确认 / 误报」
7. 询问修复选择；未运行构建/测试不得声称通过

## 输出契约

每条问题必含，缺一项即不合格：

| 字段 | 内容 |
|---|---|
| 规则 ID | 一个主要规则 ID（ST-xx / TX-xx / RV-xx），可另列关联规则，避免重复统计 |
| 状态 | 确认问题 / 待确认 / 误报 |
| 分级 | Blocker / Critical / Major / Minor / Info（见 references/review-rules.md） |
| 证据 | `文件:行号`（审核时实际读取版本）+ 触发条件 + 复现路径 |
| 建议 | 最小改动方案 |
| 回退 | 实际变更文件的 SVN revert 粒度；未修改文件时写「无需回退」 |
| 验证 | 需区分编译 / 单测 / 集成测试 / 静态审核 |

## 约束

- 不得把既有合理范式判为缺陷（如编程式事务本身、构造器注入、统一日志格式）
- 不得跨范围重构；范围外问题只记录影响当前审核结论的内容，纯优化想法不进正式报告
- 事实与推断必须区分标注；证据不足标「待确认」，不得标「误报」或直接定缺陷
- 不得仅凭「事务外 `publishEvent`」就判定 AFTER_COMMIT 监听器丢事件，必须结合监听器 `phase`、`fallbackExecution` 与发布时机判定
