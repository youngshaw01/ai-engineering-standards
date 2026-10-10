# Wiki 工作状态

- 仓库根目录：
- 仓库类型 / 主语言：
- 基线 commit：
- 开始时间：
- 当前协调 Agent：
- 允许修改范围：`.harness/wiki/`、`.harness/workflow/`、`.harness/prompts/`
- 源码修改：禁止（除非用户另行授权）

## 阶段状态

状态取值：`未开始` | `进行中` | `通过` | `有条件通过` | `阻塞`（**文件已生成 ≠ 通过**）

| 阶段 | 状态 | 输出 | 验收证据 | 阻塞/下一步 |
|---|---|---|---|---|
| 0 准备 | 未开始 | 本文件、仓库基线记录 | G0 |  |
| 1 Recon | 未开始 | `.harness/wiki/00-recon.md` | G1 |  |
| 2 能力地图 | 未开始 | `.harness/wiki/01-capability-map.md` | G2 |  |
| 3 领域分析 | 未开始 | `.harness/wiki/domains/*.md` | G3 |  |
| 4 横切分析 | 未开始 | 架构、ER、状态机、流程、集成 | G4 |  |
| 5 索引 | 未开始 | `README.md`、`_pending.md`、`_manifest.yaml` | G5 |  |
| 6 审计 | 未开始 | `.harness/wiki/_audit.md` | G6 |  |
| 交付收尾 | 未开始 | `07-finalize.md` 交付报告 | Final | 非独立阶段编号 |

## 范围与排除项
- 已检查：
- 未检查：
- 排除原因：
- 动态/生成/外部代码盲区：

## 变更记录
| 时间 | 阶段 | 变更 | 验收人/Agent |
|---|---|---|---|
