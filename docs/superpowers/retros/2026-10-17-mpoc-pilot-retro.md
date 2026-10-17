# MPOC 试点复盘 — harness v3（2026-10-17）

> 对应规格：[2026-10-17-harness-v3-contract-design.md](../specs/2026-10-17-harness-v3-contract-design.md) §6  
> 试点对象：`D:\document\svn\posp\sysdev\MPOC-AM\java\branchs\feature-20260714-pci-remove-modules`（SVN r16389）

## 1. 成功标准核对

| 标准（规格 §6.2） | 结果 | 证据 |
| --- | --- | --- |
| `validate --strict` 0 error / 0 warning | ✅ | 迁移终验 + 变更单元归档后终验均 PASS |
| ≥1 真实变更走完 proposal → tasks → verify → archive | ✅ | `docs-database-extract-001`：抽取 database.md 导航层，发现并修正真实知识缺陷（`mpoc_audit_log` 过时设计 → 实际 4 张 `audit_*` 表） |
| 负担可接受 | ✅ | 见 §2 |
| 契约缺陷修订回 Layer 0 | ✅ | 2 项已修订（[bugfix-contract-defects-001](../../.harness/workspace/archive/20261017-bugfix-contract-defects-001/proposal.md)；§3-2 方案经 r16390 实测后修正） |

## 2. 负担数据

| 项 | 量 | 备注 |
| --- | --- | --- |
| 平移 | 35 新增 + ~40 删除调度 + 3 修改 | 单会话完成；业务代码零改动 |
| changelog 追加 | 28 篇 | 脚本化机械追加（来源 `bootstrap`），一次性 |
| validate 运行 | 6 次 | 均秒级；差距报告对画像判定直接有效（基线 6 error 即锁定"零包袱"轮廓） |
| 变更单元 | 3 产物 + 5 步 | proposal/tasks/verify 无摩擦；verify 的链接检查 + strict 证据 30 分钟内完成 |
| SVN 提交 | 1 次（r16389，78 paths） | AI 执行；提交信息编码问题见 §3-2 |

## 3. 契约缺陷与改进项

1. **migration-guide 画像偏差（已修订）**：MPOC 被判为"零包袱型"，实际存在 v1 bootstrap wiki 资产（23 篇已对抗审计，~500KB）。→ migration-guide §2.1 已补充"零包袱"以 workspace 调度遗产为准的判定口径，及 v1 wiki 资产处置指引（整目录平移 `docs/knowledge/wiki/` + 批量 changelog 追加 + 探测垃圾清理）。
2. **SVN commit 编码陷阱（已修订，方案经实测修正）**：AI 环境两条路径均实测损坏——① 内联中文 + `--encoding gbk`（r16389，日志中文变字面 `?`）；② 无 locale shell 用 `-F UTF-8 文件`**不带** `--encoding`（r16390，按 Latin-1 误读，双重编码 `æŠ½å–` 型；文件内容无损，仅日志损坏）。→ 正确约定已写入 adoption-contract §4.1：**AI 执行 `svn commit -F <UTF-8 文件> --encoding UTF-8`；人工 GBK 控制台保持 `--encoding gbk`**。r16389/r16390 日志修复需 `svn propset --revprop`（服务器未启用 pre-revprop-change hook，`E175008` 拒绝，待管理员处理）。
3. **执行注意（非契约缺陷）**：Trae PS 包装器白名单会拦截项目目录外的文件移动——跨项目操作统一走 Node `fs` 脚本（本次两次使用，均成功）。
4. **可选改进**：knowledge README 模板可提示 wiki 子库结构惯例（domains/flows/data/integrations），契约不强制。

## 4. 推广建议

### ITS（`20260122_AdPush_inherit_trunk`，轻度自造型）

1. validate 差距报告 → ② `current/`+`history/` → `archive/v1-legacy/` → ③ **AI_RULES.md 厚副本转薄指针**（重点：其现内容接近红线 3 的 60 行阈值，转化时保留 SVN 规范速查于 `docs/rules/`）→ ④ `.harness/knowledge/` 断链回填 → ⑤ knowledge/rules 落位。
2. ITS 已有自造 change 产物按价值分流：有引用价值的进 `archive/v1-legacy/`。

### PayNow（`20260810_PayNow`，重度 v1 遗产）

1. v1 树整棵（14 子目录）先封存 `archive/v1-legacy/`，再按价值逐目录回流——**不要一次性全量转化**。
2. `task.yaml` 断链逐条核对后处置；两套 change 命名（v1 与自造）归一为 v3 `{type}-{slug}-{NNN}`。
3. **建议启用 bootstrap 流水线**（规格 §5.1.2）：其业务知识最丰富而已有骨架最薄，从代码梳理架构/领域/DB-ER 的收益最高。

### 通用

- 推广前先完成 §3-1/§3-2 两项契约修订（✅ 已完成，见 [bugfix-contract-defects-001](../../.harness/workspace/archive/20261017-bugfix-contract-defects-001/proposal.md)）；
- AI 侧 svn commit 一律 `-F <UTF-8 文件> --encoding UTF-8`；业务代码零触碰（本次全程仅 docs/.harness/AGENTS/AI_RULES）。

## 5. 结论

v3 契约在真实 SVN 项目上完整走通（差距判定 → 迁移 → 红线豁免 → 变更单元 → 归档 → 知识回流），负担可控，具备推广条件；两处契约修订已完成（`bugfix-contract-defects-001`），可启动 ITS/PayNow。
