# Proposal — docs-java-engineering-skills-001

> 状态：accepted · 创建日期：2026-10-30

## Why

三个 Java 专项 skill（`java-code-structure` / `java-transaction-management` / `java-code-review`）已在消费项目 Malaysia AcqSys 落地，并经 `recheck()` 只读验收、两轮规则评审修订后冻结 v1.0。当前规则正文只存在于本机全局目录 `C:\Users\B29\.trae-cn\skills\`，属于个人环境产物：换机即失效、无法版本追溯、无法在团队间分发，也无法被其他消费项目引用。

标准库（Layer 0）本就是「可验证、可复制」的分发源，规则正文应迁入本仓库成为唯一源头，消费项目只保留薄覆盖层。

## What Changes

- 新增 `contract/harness-contract.md` §2.1「技能分发（skill）」：`.trae/skills/` 定为 Layer 0 分发目录，区分流程型（薄指针）与规则型（规则正文在自身 `references/`）
- 修订契约 §1.3 非目标：为经 §2.1 登记的规则型 skill 包开口，仍不收框架用法大全
- 修订契约 §2 布局树、§7 文件职责表：补 `.trae/skills/` 两行职责
- 迁入 3 个规则型 skill（各含 `SKILL.md` + `references/*-rules.md`，共 6 文件）：ST-01～ST-10、TX-01～TX-10、RV-01～RV-08
- `README.md` 明确领域规范只以规则型 skill 包进入，不构成并列契约体系
- `VERSION` 3.1.0 → 3.2.0；`CHANGELOG.md` 增 3.2.0 条目
- 新增本变更单元（proposal / tasks / verify）

## Out of Scope

- 不修改 `src/`（init / adopt / validate 逻辑零改动）
- 不新增配置字段，`schemaVersion` 保持 `3.0.0`
- 不新增 Spring / MyBatis / 单元测试等其他语言或框架 skill 包
- 不修改任何消费项目代码、不改 ST/TX/RV 规则判定口径
- 不做全局目录到仓库的自动同步脚本（本地全局目录降为人工安装副本）

## 验收标准

> 条目用 `AC-<n>` 稳定编号（契约 §4.4）；verify.md 的人工核查与测试证据逐条引用本编号。

- [ ] AC-1：`.trae/skills/` 下存在 3 个 java-* skill 包，各含 `SKILL.md` 与 `references/` 规则文件共 6 个文件，内容与迁入来源逐字节一致
- [ ] AC-2：契约四处修订齐备——§2.1 新增登记、§1.3 非目标例外、§2 布局树含 `.trae/skills/`、§7 职责表含流程型与规则型两行
- [ ] AC-3：`VERSION` 为 `3.2.0`；`CHANGELOG.md` 含 `[3.2.0] - 2026-10-30` 条目，Added / Changed / Notes 三段齐备
- [ ] AC-4：`node src/validate.mjs` 与 `node src/validate.mjs --project . --strict` 均退出码 0
- [ ] AC-5：消费项目零改动——`project-config.schema.json` 未修改，`schemaVersion` 仍为 `3.0.0`

## Impact

- 受影响：Layer 0 契约（additive）、标准库分发内容、README、VERSION、CHANGELOG
- 不受影响：消费项目目录结构、`src/` 工具链、消费项目 `project.yaml`
- 风险：契约 §1.3 非目标首次为语言专项规范开口，须以「仅登记包 + 不收框架大全」约束防止范围蔓延
