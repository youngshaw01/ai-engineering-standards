# PayNow 迁移复盘 — harness v3（2026-10-17）

> 承接：[ITS 迁移复盘](2026-10-17-its-migration-retro.md) §6 启动建议 · 三项目推广**收官站**  
> 迁移对象：`D:\document\svn\posp\SCom\code\branches\20260316_MalaysiaAcqSys\branches\20260810_PayNow`（SVN r16394 / r16395）  
> 画像：**重度 v1 遗产型**（task.yaml 951 行 · `docs/harness` 标准树 14 子目录 208 文件 ~1.6MB · 两套 change 命名 · current 内含**今日在途生产部署变更**）

## 1. 结果核对

| 项 | 结果 | 证据 |
| --- | --- | --- |
| `validate --strict` 0 error / 0 warning | ✅ | 基线 7 error（v2 schema ×2 · v3 结构缺失 ×4 · 厚拷贝红线）→ 提交前、提交后复验均 0/0 |
| 厚拷贝红线整改 | ✅ | `docs/harness` → 活规则提取（rules 28 + workflows 7 文件 svn move 至 `docs/rules/`），余 12 子目录封存 `docs/_legacy/harness/` |
| 知识追溯 | ✅ | `docs/knowledge`（原 ai-knowledge）51 篇全纳入：49 篇脚本追加 + airwallex/README 补漏 + 主 README 重写 |
| v1 遗产封存 | ✅ | `current`（task.yaml 951 行 + 13 change + artifacts）+ `history`（18 项）→ `archive/v1-legacy/`（svn move 保历史） |
| 在途变更保留 | ✅ | `prod-deploy-20261017` → `changes/ops-prod-deploy-001`（v3 命名归一 + 薄 proposal/tasks；SQL manifest / 只读审计 / 预检脚本原样未动） |
| 业务代码零触碰 | ✅ | 迁移前工作副本 **0 本地改动**（比 ITS 的 28 项更干净）；提交前总账 93 项全在 docs/.harness/AGENTS 范围 |
| 提交编码无损 | ✅ | r16394 / r16395 日志 `--xml` 字节级验证中文完整；move 历史链接保留（knowledge/README 可溯源至平移前） |

## 2. 关键决策（用户确认）

| 决策点 | 选择 | 依据与结果 |
| --- | --- | --- |
| SVN 策略 | 对齐 MPOC/ITS 会话授权制 | 永久禁清单不变；本会话额外两次授权**局部 svn update**（E155040 解阻，见 §4.1） |
| `docs/harness` 处置 | **先提取后封存** | rules/workflows 是活规则体（AGENTS.md 引用链活跃）→ 提取至 `docs/rules/`；余 12 子目录（governance/specs/checks…）为 v1 治理遗产 → `_legacy/harness/` |
| `prod-deploy-20261017`（今日日期，在途） | **单独保留** | v3 命名归一移入新 `workspace/changes/`；验收标准（SQL manifest 执行 + 部署冒烟）保持开放，交真实生产流程推进——**封存遗产与保留在途是两类操作，不可混同** |
| task.yaml（951 行） | 封存 + 价值挖掘 | validation_hints（mvnd/npm 构建命令）回流进新 AGENTS.md「构建与检查」节；其余整树封存，不搬运尸体 |

**经验**：与 MPOC/ITS 一致，四个决策点全部在动手前以选项形式拍板；额外多出「在途变更」维度——重度遗产项目迁移前必须逐个确认 current/ 内 change 的状态。

## 3. 负担数据

| 项 | 量 | 备注 |
| --- | --- | --- |
| 现状探查 | 差距报告 1 次 + ~6 轮结构读取 | 画像确认：无 AI_RULES.md（省去薄指针化）；knowledge 已有高质量骨架（evidence 三件套 + 16 域 + 6 流程 + ER） |
| SVN 调度 | 5 组 svn move + 2 次局部 update + 2 次 add | E155040 两次解阻（§4.1） |
| 文件操作 | adopt 2 create / 5 skip + ~8 篇重写 + 49 篇脚本追加 changelog | 单会话完成 |
| validate 运行 | 5 次（差距 / 中间 / 提交前 / 提交后复验） | 中间 3 warning 精准定位 airwallex/README 漏记 + ops-prod-deploy 薄产物缺失 |
| SVN 提交 | 2 次（r16394 结构 22 paths · r16395 入口 3 files） | 批次划分经历一次失败重排（§4.2） |
| knowledge 内容 | **零生成** | 仅导航 / 追溯补齐；`_pending` 待确认条目留给后续变更单元 |

## 4. 发现的缺陷与教训

### 4.1 E155040 混合版本子树（两遇两解）

- **现象**：`svn move` 要求整树同版本；本项目按文件零散提交的历史导致 `docs/harness` 内 [16321:16372] 混杂、`current` [16321:16388] / `history` [16321:16323] 混杂，move 两度被拒。
- **处置**：局部 `svn update` 受影响子树拉齐 HEAD。**安全前提**：工作副本 0 本地改动（迁移前已核验），无冲突风险。
- **授权模式**：第一次走 AskUserQuestion 明确授权；第二次用户判定同类同险跳过确认直接执行——同类操作的重复请示会打断节奏，一次授权 + 同险沿用是可接受模式。
- **教训**：① svn move 前先查 `svn status -v` 版本混杂；② ITS 继承的「update 永久禁」条款在迁移场景需预留**局部 update 例外**；③ 零散提交习惯的项目（按文件而非按树提交）几乎必然踩中。

### 4.2 E200009 move 一致性提交（批次划分教训）

- **现象**：按 ITS 复盘 §5.1 协议先提交小编码实测批（ops-prod-deploy 的 2 个新文件）被拒——新文件位于 move 调度目录之下，SVN 要求 **move 目录与其子路径同事务提交**。
- **处置**：批次按 move 边界重划——批次 1 = 全部结构调度（22 paths：4 组 move 两端 + 结构 add + move 树内 M 一致性传输），批次 2 = 纯内容 M（3 个入口文件）；编码验证依附批次 1 提交后执行。
- **教训**：**ITS 两批协议不能照搬**——当迁移以 move 为主体时，不存在"独立小批"可言；协议应改写为「首个可提交批次兼任编码实测」（r16394 模式）。

### 4.3 changelog 脚本排除域误伤

- **现象**：批量脚本按文件名排除全部 README.md，但 `airwallex/README.md` 是子目录知识主文档（非索引），validator 报 warning。
- **教训**：排除域应为「手工处理的主 README」而非「全部 README」；本次由 validator warning 兜底发现——**红线检测的兜底价值得到实证**。

### 4.4 detectVcs 修复闭环

- ITS 复盘 §4-1 缺陷已修（Layer 0 `eb9b57f`，5 新测试，73/73）；PayNow 预检**免参数**自动识别 `vcs: svn`，实战验证通过，该缺陷正式关闭。

## 5. 可复用经验

### 5.1 E155040 处置协议（move 前置检查）

1. move 前对源树核版本混杂（`svn status -v` 或 move 报错即回退检查）
2. 若混杂：确认该树无本地改动 → 请示局部 update 授权（同险第二次可沿用）→ 拉齐后重试 move
3. update 范围严格限定受影响子树，**禁止整工作副本 update**

### 5.2 move 一致性批次划分

- 批次 1 = 全部结构调度（move 两端 + 结构新增 + move 树内既有修改，SVN 自动一致性传输）
- 批次 2 = 纯内容修改（入口 / 配置 / README）
- 编码验证依附批次 1：提交后 `svn log -r <REV> --xml` 字节级核验中文

### 5.3 在途变更保留模式（prod-deploy 样板）

- v1 命名 → v3 命名归一（`prod-deploy-20261017` → `ops-prod-deploy-001`，type 取 `ops`）
- 只补薄 proposal（状态 `accepted` + 迁入注记）与 tasks；**制品原样不动**
- 验收标准保持开放，tasks 勾选交真实流程推进；proposal 的 Out of Scope 注明「迁移本身已完成」划清边界

### 5.4 封存前价值挖掘

- 大体量遗产（951 行 task.yaml）不整体转化：先提取仍有效信息（构建命令 / 校验 hints）回流新入口 AGENTS.md，其余整树封存
- 判据：回流「未来仍会被问到的」，封存「只在历史语境有意义的」
- ITS 复盘 §5.1–5.4（编码实测、`--targets` 范围纪律、脚本幂等 + EOL 自适应、PS 5.1 无 `&&`）在本站全部沿用有效

## 6. 三项目推广总结

| 项目 | 画像 | Revision | 迁移特色 |
| --- | --- | --- | --- |
| MPOC | 零包袱（wiki 资产丰富） | r16389 / r16390 | wiki 平移 + bootstrap 梳理 + 首个真实变更单元闭环 |
| ITS | 轻度自造（current/history + 311 行厚 AI_RULES） | r16392 / r16393 | 薄指针化 311→40 + 会话授权制确立 |
| PayNow | 重度 v1 遗产（14 子目录树 + 951 行 task.yaml + 在途变更） | r16394 / r16395 | 先提取后封存 + 在途保留 + 价值挖掘 |

**共性验证**：三站 `--strict` 均 0 error / 0 warning · 提交编码字节级无损 · 业务代码零触碰 · svn move 历史链接全部保留 · 单会话闭环。

## 7. 结论与遗留

三种画像（零包袱 / 轻度自造 / 重度遗产）全部走通，v3 契约与迁移指南经受住差异化考验，**三项目推广收官**。

遗留（均低优先级）：

1. **adoption-contract §4.1 补实证**：r16392（ITS）+ r16394/16395（PayNow）已三站验证 `-F UTF-8 --encoding UTF-8` 约定，证据齐备，可补入契约实证记录（ITS 复盘 §4-2 遗留项）。
2. **PayNow `_pending` 条目消化**：`docs/knowledge/evidence/_pending.md` 的 `[待确认]` 风险条目按需开变更单元逐个核实，无需全量 bootstrap（知识骨架质量已高）。
3. **ops-prod-deploy-001 生产推进**：SQL manifest 执行与部署冒烟由真实流程完成后归档。
