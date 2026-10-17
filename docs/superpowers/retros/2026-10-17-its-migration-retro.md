# ITS 迁移复盘 — harness v3（2026-10-17）

> 承接：[MPOC 试点复盘](2026-10-17-mpoc-pilot-retro.md) §4 推广建议 · 三项目推广第 2 站  
> 迁移对象：`D:\document\svn\posp\sysdev\ITS\code\branches\20260122_AdPush_inherit_trunk`（SVN r16392 / r16393）  
> 画像：**轻度自造型**（current/history 自造调度遗产 + `docs/ai-governance/` v1 治理树 16 文件 + AI_RULES.md 311 行厚副本）

## 1. 结果核对

| 项 | 结果 | 证据 |
| --- | --- | --- |
| `validate --strict` 0 error / 0 warning | ✅ | 迁移前基线 7 error / 5 warning → 提交前、后终验均 0/0 |
| 厚规则红线（≤60 行） | ✅ | AI_RULES.md **311 → 40 行**（-87%）；AGENTS.md 27 行 |
| 知识追溯 | ✅ | knowledge 5 篇（api/architecture/business-flow/database/deployment）均补「变更记录」；README 索引填充 |
| v1 遗产封存 | ✅ | `current/`+`history/` → `archive/v1-legacy/`（svn move，历史回溯至 r16026）；`ai-governance/` → `docs/_legacy/`（16 文件） |
| 业务代码零触碰 | ✅ | 全程仅 docs/.harness/AGENTS/AI_RULES；28 项无关本地改动分毫未动 |
| 提交编码无损 | ✅ | r16392/r16393 日志 `svn log --xml` 字节级验证中文完整 |

## 2. 关键决策（用户确认）

| 决策点 | 选择 | 依据与结果 |
| --- | --- | --- |
| SVN 策略：ITS 原 L0.2 **全面禁止** AI svn 写操作，迁移需 move/add | **对齐 MPOC：会话授权制** | 一次性授权 add/move/commit；**永久禁清单**（merge/delete/propset/switch/checkout/update）写入 ITS 项目 `docs/rules/svn.md`；先小批量实测编码（r16392）再全量（r16393），两笔日志均无损 |
| `docs/ai-governance/`（v1 治理树，AGENTS.md 声明只读） | **svn move → `docs/_legacy/`** | 保留历史链接、目录名自证「遗产」语义；区别于 MPOC 的原位保留（该处无 vault 豁免需求，移入 `_legacy` 更彻底）；16 文件一次 move 完成 |

**经验**：两个决策点都在动手前以选项形式请用户拍板，避免了返工——PayNow 启动时同样先问授权模式与 v1 树处置。

## 3. 负担数据

| 项 | 量 | 备注 |
| --- | --- | --- |
| 现状探查 | 差距报告 1 次 + 5 轮文件读取 | AI_RULES/AGENTS/project.yaml/rules/knowledge 结构一轮摸清 |
| 文件操作 | 4 adopt 生成 + 3 svn move + 2 新建 + 5 changelog 追加 + 8 修改 | 单会话完成 |
| validate 运行 | 3 次（差距/终验/复验） | 均秒级 |
| SVN 提交 | 2 次（r16392 4 paths + r16393 24 paths） | 分批策略：首批即编码实测 |
| knowledge 内容 | **零生成** | 仅补追溯与索引；内容梳理留给后续按需变更单元（与 MPOC 的 wiki 平移不同——ITS 无既有 wiki 资产） |

## 4. 发现的缺陷与改进项

1. **`detectVcs` 祖先探测缺陷（已修，Layer 0 `bugfix-detectvcs-ancestors-001` / commit `eb9b57f`，3.0.2 Fixed）**：SVN 工作副本根在祖先目录（`D:\document\svn\posp`），项目根无 `.svn` → adopt 误判 `vcs: git`。本次以 `--vcs svn` 显式绕过。修复为沿祖先目录上溯探测（+5 测试，73/73）；PayNow 迁移（同为 posp 子目录）已免参数实证通过。
2. **adoption-contract §4.1 补实证（已补，Layer 0 `docs-svn-encoding-evidence-001`）**：r16392 为第二个项目端到端验证 `--encoding UTF-8` 约定；实证记录已入契约（含 PayNow r16394/r16395 证据，2026-10-17）。
3. **svn.md「仓库 GBK」论断修正（本项目已修，模式可复用）**：ITS 原规则断言服务端按 GBK 解析，被 MPOC r16390 实测推翻（服务端透明存储）——**存量项目的编码结论须以字节级实测为准，不轻信历史文档论断**。
4. **执行注意**：Trae PS 包装器为 PowerShell 5.1，不支持 `&&`（用 `;` 串联）；跨行 Grep glob 在该项目路径下部分失效，改目录级搜索。

## 5. 可复用经验（PayNow 直接套用）

### 5.1 编码实测协议（两批提交）

1. 批次 1：挑 3–5 个新增小文件，写 UTF-8 无 BOM message（`[IO.File]::WriteAllText` + `UTF8Encoding($false)`），`svn commit -F <file> --encoding UTF-8`
2. `svn log -r <REV> --xml` 输出重定向到文件 → UTF-8 解码 → `Contains('中文字样')` 验证（**控制台 `??` 是本机 GBK 显示假象，不作数**）
3. 通过后再提交主体；两批 message 均中文（最大化暴露编码问题）

### 5.2 提交范围纪律

- 工作副本常混有无关本地改动（ITS 有 28 项 web/target 变更）→ 提交一律 `--targets <文件>` 显式列路径，**禁止整目录提交**
- svn move 后 `svn status` 核对 `A +`（moved-from 标记 = 历史链接保留）

### 5.3 批量机械操作脚本化

- changelog 追加用 Node 脚本：EOL 自适应（CRLF/LF 检测）+ 幂等（重复运行 skip）
- 多命令串联用 `;` 不用 `&&`（PS 5.1）

### 5.4 断链排查

- 薄指针化后 grep 活动文件中的旧引用（`AI_RULES.md L*`、旧目录路径），逐条改指新位置
- 归档快照（`_legacy/`、`v1-legacy/`）内部旧路径**有意保留不改写**，README 声明即可

## 6. PayNow 启动建议（重度 v1 遗产型）

> 路径：`D:\document\svn\posp\SCom\code\branches\20260316_MalaysiaAcqSys\branches\20260810_PayNow`  
> 画像：950 行 task.yaml · 14 子目录标准树完整拷贝 · 两套 change 命名 —— 与 ITS 量级不同，**先封存、后回流，不一次性转化**

1. **预检**：`validate --report text`（**记得 `--vcs svn`**，见 §4-1）+ 差距画像确认；探查无关本地改动数量，锁定提交范围纪律。
2. **用户决策点（开场即问）**：① SVN 授权模式（建议沿用 ITS 会话授权制）；② v1 树处置（重度型默认整棵 svn move → `archive/v1-legacy/`）。
3. **v1 树封存**：14 子目录标准树拷贝整棵 svn move 进 vault（红线豁免已由 validator 支持）；**厚拷贝红线在封存后自然解除**，无需逐文件处理。
4. **task.yaml（950 行）处置**：断链逐条核对——被 v3 结构替代的记档废弃，仍有效的信息回流 `docs/knowledge/` 或 `docs/rules/`；不搬运尸体。
5. **命名归一**：v1 与自造两套 change 记录归档进 `v1-legacy/`，新变更一律 `{type}-{slug}-{NNN}`。
6. **建议启用 bootstrap 流水线**（规格 §5.1.2）：PayNow 业务知识最丰富而已有骨架最薄，从代码梳理架构/领域/DB-ER 收益最高——ITS 的「knowledge 零生成、留给变更单元」策略在 PayNow 不适用，正好用流水线补齐。
7. **编码实测照搬 §5.1**；提交前 `--strict` 0/0 终验。

## 7. 结论

轻度自造型画像在预设流程（差距 → adopt → 遗产封存 → 薄指针化 → 追溯补齐 → 双批提交）下单会话闭环，无阻塞；两处 Layer 0 小缺陷（detectVcs 祖先探测、§4.1 补实证）均已闭环（`eb9b57f` / `fe6295d`，见 §4-1/§4-2）。三项目推广 2/3 完成，PayNow 为最后一站（重度型，预算最大，建议单独会话 + bootstrap 流水线）。
