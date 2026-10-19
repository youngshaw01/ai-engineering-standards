# Retro — feature-harness-v31-intent-evidence-001

## 做得好的

- spec → plan → 分 Phase 流程完整走通，Phase 边界清晰（文档/模板/代码/发布），每 Phase 有可执行检查点；
- AC 编号约定第一次在真实变更中使用，verify 的"人工核查"从 checkbox 升级为可核对表格；
- `--garden` 在自举运行时立即发现 3 个存量归档的 AC/retro 缺口——**巡检价值在落地当天即被实证**。

## 踩坑

- 测试 helper `chDir/arDir` 初版少收可变参数导致 EISDIR——变参 helper 应在定义时即用 `...rel`；
- `node --test tests/`（目录参数）在 Node 24 下报 MODULE_NOT_FOUND，须用 README 既有的 `tests/*.test.mjs` 形式——文档与命令一致性再次被验证；
- garden 段初版未接入 text 报告，功能可用但不可见——"info 级"不能等于"不可见"。

## 改进项

- [x] text 报告渲染 GARDEN 段（随本变更补齐，`src/lib/report.mjs`）
- [ ] v4 候选：work package lanes 机器状态（spec-kitty 式）——本版仅文书约定
- [ ] v4 候选：`reconcile` 命令（ProductSpec 式 Agent Run 核对）——AC 体系就位后的自然延伸
- [ ] 存量 3 个归档补 AC/retro 成本高、价值低，维持 info 级观测即可，不补课

## 知识回流

| 条目 | 目标 knowledge 文档 | 状态 |
| --- | --- | --- |
| AC opt-in 校验语义（采用方受益、未采用方零误报） | 已写入契约 §4.4/§12 正文 | 已回流（契约即 SSOT） |
| garden 三码语义与退出码隔离 | 契约 §12 + CHANGELOG [3.1.0] | 已回流 |
