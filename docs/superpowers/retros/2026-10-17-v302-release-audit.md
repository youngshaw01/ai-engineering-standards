# 3.0.2 发布核对记录 — CHANGELOG 与 commit 链映射（2026-10-17）

> 性质：发布审计记录（release audit）· 核对对象：`CHANGELOG.md` [3.0.2] 条目 vs 3.0.1（`64e92c6`）之后的全部 commit 与归档变更单元  
> 结论：**覆盖完整，无遗漏**（逐项映射见下）

## 1. Commit 链 → CHANGELOG 条目映射

3.0.1 发布 commit `64e92c6` 之后共 **5 个 commit**，全部有归属：

| Commit | 主题 | CHANGELOG 3.0.2 覆盖位置 |
| --- | --- | --- |
| `7568850` | ITS 迁移复盘（rollout 2/3） | Docs 第 2 条（ITS 部分） |
| `eb9b57f` | detectVcs 祖先上溯修复 + 5 测试 | **Fixed** 全条 |
| `572cae7` | PayNow 迁移复盘（rollout 3/3，E155040/E200009 教训） | Docs 第 2 条（PayNow 部分） |
| `fe6295d` | adoption-contract §4.1 验证通过记录 + 两复盘遗留项闭环 | Docs 第 1 条 |
| `26b792f` | 3.0.2 发布本身（CHANGELOG / VERSION / 自举 project.yaml） | 即条目自身 |

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

复盘文档按 MPOC 惯例（`7816801`）直接 commit、不走变更单元，故 3.0.2 区间内两份复盘（`7568850`/`572cae7`）无对应单元属预期，非遗漏。

## 4. 风格差异备注（无需处理）

3.0.1 将 VERSION/CHANGELOG 并入修复 commit（`64e92c6`），3.0.2 拆为独立发布 commit（`26b792f`）——两种风格均成立；后续版本建议统一采用 3.0.2 的独立发布 commit 模式（修复与发布语义分离，发布点在历史中更醒目）。

## 5. 核对时点状态

- HEAD：`26b792f`，工作区干净
- `node src/validate.mjs --project . --strict`：0 error / 0 warning
- 全量测试：73/73（fail 0）
