# 初始化（空白或新模块仓库）

1. 克隆/打开 `ai-engineering-standards`（与业务仓同级或设置 `AI_ENGINEERING_STANDARDS_ROOT`）。  
2. 将 `templates/harness/blueprint-v1/` 中文件拷贝到业务仓（`AGENTS.md` → 根；其余 → `.harness/` 对应路径）。  
3. 填写 `.harness/project.yaml`（`metadata.name`、`project.vcs`、`workspaces`）。  
4. 在 `rules/detail/` 添加至少一条项目规则，并配置 `adapters/manifest.json` + `sync.mjs`。  
5. 运行 `tooling.structure` 与 `tooling.gates_fast`（见 project.yaml）。  
6. **L0 通过**后提交。
