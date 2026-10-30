---
name: java-transaction-management
description: Java 事务边界与跨服务一致性专项检查，覆盖编程式/声明式事务、事务内远程调用与事件、影响行数校验、状态 CAS、异常语义、提交后动作补偿与幂等。触发词：事务、一致性、事件丢失、并发重复、幂等、AFTER_COMMIT、回滚。
---

# Java Transaction Management

## 适用

- 新增或修改含数据库写操作的 service 方法
- 出现编程式事务（`TransactionTemplate`）或 `@Transactional`
- 事务内/外需要调用远程接口、发布事件、发送 MQ
- 涉及状态流转（审核、复核、迁移）与并发提交

## 不适用

- 纯查询方法且无副作用
- 只读报表与看板统计
- 代码结构问题（用 `java-code-structure`）

## 规则优先级

1. `docs/rules/charter.md`
2. 项目覆盖层 `docs/rules/detail/java-transaction.md`
3. 本 skill 的 `references/transaction-rules.md`

## 执行步骤

1. 读取项目覆盖层 `docs/rules/detail/java-transaction.md`
2. 按 `references/transaction-rules.md` 的「模块识别」表判定对象所属模块（svc / dao / ctl / lsn），跨模块时分别启用并在报告中分组
3. 构建本次启用规则集：该模块的必检规则 + 显式点名的选检规则，**在报告首部逐条列出启用的 TX 规则 ID 与未启用的选检规则**
4. 画出事务边界：哪些操作在事务内、哪些在提交后（必须列出操作清单）
5. 检查事务内是否包含远程调用、非事务副作用与长耗时逻辑
6. 检查关键状态更新是否校验影响行数、是否具备前置状态条件，并按业务语义解释 0 行
7. 检查事件：发布时机与监听器 `phase`、`fallbackExecution` 是否匹配，并判断是否可能丢失、提前执行或重复执行
8. 检查异常路径：是否吞异常、是否保留可诊断信息、是否区分业务/数据/基础设施异常
9. 检查提交后动作失败时的恢复语义：重试、幂等、补偿记录或明确待处理状态
10. 逐条判定启用规则，只报命中项并给 `文件:行号` 证据

## 输出格式

报告首部：

```
审核对象：<文件:行号>
模块：svc + lsn（跨模块）
启用规则：TX-01..TX-08（必检）+ TX-09（选检，已点名）
未启用的选检规则：TX-10
```

问题表：

| 规则 ID | 分级 | 证据（文件:行号） | 失效场景 | 建议 |
|---|---|---|---|---|
| TX-04 | Critical | `XxxListener.java:28` | 事务外发布事件 → 无活动事务 → AFTER_COMMIT 监听器不执行，Airwallex 流程丢失 | 明确发布场景：改为事务内发布或启用 fallbackExecution，并说明丢失/提前/重复风险 |

## 约束

- 不得把事务拆小作为唯一解法；先判断一致性要求
- 不得在事务内新增远程调用
- 建议必须说明回滚范围与数据可见性影响
- 事务已提交后的动作失败，不得描述为「数据库事务回滚」，必须区分提交结果与后置动作结果
- `fallbackExecution = true` 不是事件的通用修复方案，须结合发布时机判断
- 本 skill 只判断事务边界与一致性，不判断代码结构（由 `java-code-structure` 负责），不产出完整分级审核报告（由 `java-code-review` 汇总两者结果）
