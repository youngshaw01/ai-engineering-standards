# Changelog

## [3.1.0] - 2026-10-19

### Added

- 契约 additive 增强（`schemaVersion` 保持 `3.0.0`，消费项目零改动）：
  - §4.2 产物分级新增 `explore.md`（可选，意图前置）与 `retro.md`（可选，归档复盘）
  - §4.3 生命周期补 explore 前置态与 retro 后置态
  - 新增 §4.4 验收证据 ID（AC）约定：proposal 验收标准 `AC-<n>` 编号，verify 逐条引用，校验 opt-in
  - 新增 §5.4 项目宪法（charter）：落位 `docs/rules/charter.md`，一次定义的不可协商原则
- `templates/change/explore.md`、`templates/change/retro.md`（新增）；`proposal.md` 验收标准改 AC 编号；`verify.md` 人工核查改 AC 逐条核对表
- `templates/minimal/` 四文件同步（AGENTS.md / changes/README.md / archive/README.md / docs/rules/README.md）
- `validate.mjs` 新增 `--garden` 巡检（info 级：`GARDEN_AC_NOT_ADOPTED` / `GARDEN_VERIFY_AC_GAP` / `GARDEN_RETRO_MISSING`，不影响退出码）与 warning `VERIFY_AC_UNCOVERED`（opt-in：仅对已采用 AC 编号的 change 生效，存量项目零误报）
- 测试：`tests/v31-intent-evidence.test.mjs`（AC opt-in 语义 + garden 行为）

### Notes

- 设计依据：开源生态调研（OpenSpec / spec-kit / spec-kitty / gsd-core / lattice / ProductSpec 等 Top 20），spec 与 plan 见 `docs/superpowers/`
- 变更单元：`.harness/workspace/archive/20261019-feature-harness-v31-intent-evidence-001/`

## [3.0.2] - 2026-10-17

### Fixed

- `detectVcs` 祖先上溯探测：项目根无 `.svn`/`.git` 标记时沿祖先目录上溯（SVN 1.7+ 仅 WC 根有 `.svn`，git 仅仓库根有 `.git`），修复嵌套工作副本项目被误判 `vcs: git`（ITS 复盘 §4-1 发现，PayNow 迁移实战免参数验证通过）。`--vcs` 显式参数优先级不变；根双标记 `AMBIGUOUS_VCS` 与无标记默认 git 行为不回归（新增 5 测试，73/73）

### Docs

- adoption-contract §4.1 补「验证通过记录」：ITS r16392/r16393 + PayNow r16394/r16395 跨项目端到端验证 AI 提交 `-F <UTF-8 文件> --encoding UTF-8` 约定（`svn log --xml` 字节级核验无损，覆盖 `--targets` 批量与 move 调度场景）；与 r16389/r16390 损坏实证构成失败 + 通过双记录
- 三项目推广复盘归档：[ITS](docs/superpowers/retros/2026-10-17-its-migration-retro.md)（轻度自造型，r16392/16393）、[PayNow](docs/superpowers/retros/2026-10-17-paynow-migration-retro.md)（重度 v1 遗产型，r16394/16395，含 E155040 混合版本处置协议与 E200009 move 一致性批次教训）；MPOC/ITS/PayNow 三画像全部走通，v3 推广收官

### Notes

- detectVcs 为向后兼容的工具行为修复；消费项目无需升级 `schemaVersion`
- 变更单元：`.harness/workspace/archive/20261017-bugfix-detectvcs-ancestors-001/`、`20261017-docs-svn-encoding-evidence-001/`

## [3.0.1] - 2026-10-17

### Fixed

- migration-guide §2.1：修正"零包袱型"判定口径（以 workspace 调度遗产为准，知识资产另判），补充 v1 bootstrap wiki 资产处置指引（整目录平移 `docs/knowledge/wiki/` + 批量 changelog + 探测垃圾清理）（MPOC 试点复盘 §3-1）
- adoption-contract 新增 §4.1 SVN 提交编码约定：AI 用 `-F <UTF-8 文件> --encoding UTF-8`（无 locale 环境省略 `--encoding` 会按 Latin-1 误读），人工 GBK 控制台保持 `--encoding gbk`；记载 r16389/r16390 两种实测损坏模式与 `propset --revprop` 修复路径（MPOC 试点复盘 §3-2）
- `templates/minimal/docs/rules/README.md` svn.md 示例同步编码约定

### Notes

- 文档/模板修订，无工具行为变更；消费项目无需升级 `schemaVersion`
- 变更单元：`.harness/workspace/archive/20261017-bugfix-contract-defects-001/`

## [3.0.0] - 2026-10-17

### Added

- workspace 工作流契约：变更单元模型（`{type}-{slug}-{NNN}/`）、产物分级（proposal/tasks 必备、design 可选、verify 归档前必备）、归档规则（`{YYYYMMDD}-` 前缀）
- 知识/规则落位标准：`docs/knowledge/`（含变更记录追溯约定）、`docs/rules/`（薄指针原则）
- `templates/change/`：变更单元四产物模板
- `templates/bootstrap/`：v1 封板 legacy-project-wiki 6 阶段梳理流水线 re-home（产物落点改为 `docs/knowledge/`）
- `contract/migration-guide.md`：v2 → v3 升级指南（三类项目画像）
- `validate.mjs` 差距报告模式（`--report text|json`，error/warning 分级）与红线检测（标准树副本、AI 规则厚副本）

### Changed

- `schemaVersion` 升级为 `3.0.0`（不兼容：新增 workspace 与 docs 必备结构）；新增可选 `workflow.types`
- 消费项目必备结构：新增 `workspace/changes/`、`workspace/archive/`、`docs/knowledge/README.md`、`docs/rules/README.md`

### Notes

- v2 项目升级路径见 `contract/migration-guide.md`；工具不自动搬迁内容

## [2.0.0] - 2026-10-13

### Added

- Harness Contract v2：`contract/harness-contract.md`、`adoption-contract.md`、`project-config.schema.json`
- `src/init.mjs`、`src/adopt.mjs`、`src/validate.mjs`（无第三方依赖）
- `templates/minimal/` 与 `.harness/project.yaml`（`schemaVersion: 2.0.0`，支持 `git`/`svn`）
- 自动化测试：`tests/*.test.mjs`（契约、绿场、幂等、接入、SVN 模拟、v1 依赖扫描）

### Removed

- `contract/rebuild-checklist.md`、过渡性 `project.json` 模板

### Notes

- v1 只读封板：`v1-sealed-20261013` / `sealed/v1-full`
