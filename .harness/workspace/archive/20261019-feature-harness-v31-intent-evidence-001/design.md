# Design — feature-harness-v31-intent-evidence-001

> 跨契约修订，需要本文件。

## 方案

additive 约定层升级（schemaVersion 不变），四层落地：

1. **契约层**：`harness-contract.md` v3.1.0——explore/retro 产物、§4.4 AC 约定、§5.4 charter、§11/§12 garden 与 VERIFY_AC_UNCOVERED；
2. **模板层**：change 模板 +2（explore/retro）、改 2（proposal/verify AC 化）；minimal 四文件同步；
3. **工具层**：`validate.mjs` 增 `--garden`（info 级，不影响退出码）与 opt-in AC 覆盖 warning；
4. **发布层**：VERSION 3.1.0 + CHANGELOG。

关键设计：**AC 校验 opt-in 语义**——只有 proposal 自身采用 `AC-\d+` 编号后才要求 verify 引用。这保证存量项目（未采用方）零误报，strict 0 warning 状态不回归。

## 备选方案

| 方案 | 优点 | 缺点 | 结论 |
| --- | --- | --- | --- |
| A：schemaVersion bump 4.0.0 | 语义干净 | 破坏性；三个存量项目需迁移；本版无破坏变更 | 否 |
| B：AC 校验强制（所有 change） | 覆盖率高 | 存量项目 strict 0 warning 立即回归，违反保守默认 | 否 |
| C：additive + opt-in（本方案） | 零破坏；采用方受益；可用 garden 观测采用率 | 需要两套语义（采用/未采用） | **采用** |

## 影响面

- 接口：`validate.mjs` 新增 `--garden` flag 与 report.garden 字段（向后兼容：无 flag 时输出结构不变）；
- 兼容性：存量消费项目无需改动；v2→v3 迁移指南不受影响；
- 回滚：纯 additive，`git revert` 单次提交即可（工具输出结构在不传 --garden 时不变）。
