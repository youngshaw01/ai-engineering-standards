# 01 — Engineering

Foundational engineering practices: version control, code review, project structure, and dependency management.

## Documents

| Document | Description |
|----------|-------------|
| [Git](Git.md) | Git branching strategy, commit conventions, merge rules |
| [SVN](SVN.md) | SVN 仓库结构、分支策略、提交规范、权限、迁移、备份恢复 |
| [GitHub](GitHub.md) | PR workflow, Issue templates, branch protection, Actions |
| [Code-Review](Code-Review.md) | Review process, review checklist, review culture |
| [Project-Structure](Project-Structure.md) | Directory layout, module organization, naming conventions |
| [Dependencies](Dependencies.md) | Dependency selection, versioning, security auditing |

## Version Control Selection

根据项目实际情况选择版本控制工具：

| 场景 | 推荐工具 | 参考文档 |
|------|---------|---------|
| 新项目、开源、互联网团队 | Git | [Git.md](Git.md) + [GitHub.md](GitHub.md) |
| 老项目、金融/政务/内网 | SVN | [SVN.md](SVN.md) |
| SVN→Git 迁移过渡期 | git-svn | [SVN.md R08](SVN.md) + [Git.md](Git.md) |
