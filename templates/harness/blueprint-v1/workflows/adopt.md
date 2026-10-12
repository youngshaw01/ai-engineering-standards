# 接入（既有项目）

1. **只读审计**：入口文件、`.harness/` 子树、同步脚本、双权威目录（如 `.standards/`）。  
2. **Gap 矩阵**：Blueprint 必选路径 vs 现状；标 P0 冲突。  
3. **禁止**：整包覆盖现有 `knowledge/`、`workspace/`。  
4. 新增 `.harness/project.yaml`，`blueprint.version` 与 `legacy_index` 指向现有 `harness.yaml` 等。  
5. 批次迁移：同步脚本 → 规则 SSOT → 清 artifacts 违规 → 压缩 AGENTS。  
6. 每批后跑 L0；全量重构前完成 P0 决策（只读路径、多 IDE sync）。

参考试点：PayNow `governance-audit-20261012`（实例内，非标准库 SSOT）。
