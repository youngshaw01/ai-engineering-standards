# 3.0.2 发布核对记录 — CHANGELOG 与 commit 链映射（2026-10-17）

> 性质：发布审计记录（release audit）· 核对对象：`CHANGELOG.md` [3.0.2] 条目 vs 推送链全部 commit 与归档变更单元  
> 结论：**覆盖完整，无遗漏**（逐项映射见下）  
> 扩展记录（2026-10-17 第二版）：§1 由「3.0.1 之后 5 commit」扩展为**完整 13 commit 推送链**（`06827f1..40e0bc5`），3.0.0 区间 6 commit 与审计 commit 自身补入映射；SHA 以远程 `origin/main` fetch 后核验为准。

## 1. Commit 链 → CHANGELOG 条目映射（完整 13 commit 推送链）

推送 `06827f1..40e0bc5`（main → origin/main），链条 = v3 工程全程，全部有归属：

| # | Commit | 主题 | CHANGELOG 覆盖位置 |
| --- | --- | --- | --- |
| 1 | `98c098f` | v3 契约起草（workspace 工作流 + 知识落位） | [3.0.0] Added（契约/模板/迁移指南） |
| 2 | `c63459d` | 工具链升级（分级 findings + 红线检测） | [3.0.0] Added（validate 报告模式与红线） |
| 3 | `1c2c629` | 测试套件迁移 v3 + 红线覆盖 | [3.0.0] Notes（测试迁移，73 项基线） |
| 4 | `e510d18` | Layer 0 自举 v3 消费项目形态 | [3.0.0] Changed（自举 project.yaml 3.0.0） |
| 5 | `182cd3a` | 清理误入库临时文件 | 无条目（仓库卫生，见 §3.3） |
| 6 | `7816801` | MPOC 试点复盘（phase 5） | [3.0.0] 区间复盘惯例（直接 commit，不走变更单元） |
| 7 | `64e92c6` | 3.0.1 契约缺陷修复（含 VERSION/CHANGELOG 并入） | [3.0.1] 全条目 |
| 8 | `7568850` | ITS 迁移复盘（rollout 2/3） | [3.0.2] Docs 第 2 条（ITS 部分） |
| 9 | `eb9b57f` | detectVcs 祖先上溯修复 + 5 测试 | [3.0.2] **Fixed** 全条 |
| 10 | `572cae7` | PayNow 迁移复盘（rollout 3/3，E155040/E200009 教训） | [3.0.2] Docs 第 2 条（PayNow 部分） |
| 11 | `fe6295d` | adoption-contract §4.1 验证通过记录 + 两复盘遗留项闭环 | [3.0.2] Docs 第 1 条 |
| 12 | `26b792f` | 3.0.2 发布（CHANGELOG / VERSION / 自举 project.yaml） | [3.0.2] 即条目自身 |
| 13 | `40e0bc5` | 本核对记录（首版，覆盖 3.0.1 后 5 commit） | 审计留痕（本记录 §1 首版 + 本扩展版） |

### 1.1 边界锚点

- 推送起点：`06827f1`（3.0.0 发布 commit，即 v3 工程启动前的 origin/main 顶点；CHANGELOG [3.0.0] 条目所在）
- 推送终点：`40e0bc5`（本记录首版）
- 13 commit SHA 已与远程 `origin/main`（fetch 后 `git log origin/main -13`）逐一核验一致，无漂移

## 2. 归档变更单元 → 版本归属

`.harness/workspace/archive/` 共 3 个单元，归属与指针登记核对：

| 变更单元 | 版本归属 | CHANGELOG Notes 指针 |
| --- | --- | --- |
| `20261017-bugfix-contract-defects-001` | 3.0.1 | 3.0.1 Notes ✅ |
| `20261017-bugfix-detectvcs-ancestors-001` | 3.0.2 | 3.0.2 Notes ✅ |
| `20261017-docs-svn-encoding-evidence-001` | 3.0.2 | 3.0.2 Notes ✅ |

## 3. 重点条目完整性核对

### 3.1 detectVcs 修复（Fixed 条）

覆盖要素齐备：问题现象（嵌套工作副本误判 `vcs: git`）· 根因（SVN 1.7+ 仅 WC 根有 `.svn` / git 仅仓库根有 `.git`）· 修复方式（祖先上溯探测）· 行为不回归声明（`--vcs` 优先级、`AMBIGUOUS_VCS`、默认 git）· 测试证据（新增 5 测试，73/73）· 发现来源（ITS 复盘 §4-1）· 实战验证（PayNow 迁移免参数通过）。

### 3.2 §4.1 实证记录（Docs 第 1 条）

覆盖要素齐备：四个 revision（ITS r16392/r16393 + PayNow r16394/r16395）· 验证方法（`svn log --xml` 字节级核验）· 覆盖场景（多行中文消息、`--targets` 批量 22 paths、move 调度混合）· 双记录关系（与 r16389/r16390 损坏实证互补）。

### 3.3 无变更单元遗漏

复盘文档按 MPOC 惯例（`7816801`）直接 commit、不走变更单元，故推送链内三份复盘（`7816801`/`7568850`/`572cae7`）与本记录首版（`40e0bc5`）无对应单元属预期，非遗漏；`182cd3a`（临时文件清理）为仓库卫生操作，无 CHANGELOG 条目与变更单元均属预期。

## 4. 风格差异备注（无需处理）

3.0.1 将 VERSION/CHANGELOG 并入修复 commit（`64e92c6`），3.0.2 拆为独立发布 commit（`26b792f`）——两种风格均成立；后续版本建议统一采用 3.0.2 的独立发布 commit 模式（修复与发布语义分离，发布点在历史中更醒目）。

## 5. 核对时点状态

- 首版核对（HEAD `26b792f` 时点）：工作区干净 · `--strict` 0 error / 0 warning · 73/73（fail 0）
- 扩展版核对（推送后时点）：本地与 `origin/main` 同步于 `40e0bc5`（ahead 0 / behind 0，fetch 后核验）· 13 commit SHA 与远程逐一一致 · 工作区干净
