# 阶段 0 — 准备与范围锁定

角色：仓库侦察协调员。执行前先阅读根目录 `AGENTS.md` 和标准库 `templates/bootstrap/workflow/README.md`。

目标：建立可恢复的工作基线，不分析业务、不修改源码。

执行：
1. 确认仓库根目录、VCS 状态与基线（Git：分支、HEAD commit；SVN：revision）；无版本控制时说明可用的替代基线。
2. 记录工作区已有改动，绝不覆盖或清理。
3. 盘点已有 `docs/knowledge/` 文件；存在旧内容时先比较，保留有价值内容，不盲目覆盖。
4. 创建变更单元 `.harness/workspace/changes/docs-knowledge-bootstrap-{NNN}/`（NNN 取项目内下一序号）；从标准库 `templates/bootstrap/workflow/STATUS.template.md` 初始化该单元 `STATUS.md`；建立 `docs/knowledge/{domains,flows,data,integrations}`；从标准库 `templates/bootstrap/artifacts/` 实例化 README、`_pending`、`_audit`、`_manifest` 模板（见 `../workflow/README.md` 首次启动第 6 步）。
5. 明确仓库范围：主仓库、子模块、monorepo 子项目、生成代码、外部依赖、不可读目录。
6. 记录安全边界：禁止读取并复制秘密值，禁止运行未知脚本，禁止执行生产操作。

输出：更新变更单元内 `STATUS.md`。不要创建业务结论。
验收：仓库基线、已有改动、扫描边界和允许修改路径均明确。若工作区不干净或范围不明，先记录并继续只读侦察，不擅自清理。
