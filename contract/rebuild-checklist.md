# v2 Clean-room 重建清单

> 执行状态：活动实现已切换为本清单「保留」列；旧实现 **不删除 Git 历史**，仅退出运行路径。

## 旧版：退出活动版本（冻结参考）

| 内容 | 处置 | 恢复方式 |
| --- | --- | --- |
| 根目录 `00-`…`11-` 章节 | 不在 v2 工作区 | `git checkout v1-sealed-20261013` |
| `templates/harness/*`（standard/bootstrap/wiki-kit） | 不在 v2 工作区 | 同上 |
| v1 `.harness/harness.yaml` 体系 | 不在 v2 工作区 | 同上 |
| `harness/` transitional 布局 | **已删除**（活动树） | 仅 git 历史 / 封板 |
| 根 `.harness/` 元副本 | **已删除**（活动树） | 仅 git 历史 / 封板 |
| 旧 sync / verify-structure 脚本 | **不复用** | 封板只读 |

## 新版：从零编写（当前保留）

| 路径 | 状态 |
| --- | --- |
| `contract/harness-contract.md` | ✅ |
| `contract/adoption-contract.md` | ✅ |
| `contract/project-config.schema.json` | ✅ |
| `templates/minimal/` | ✅ |
| `src/init.mjs` | ✅ |
| `src/validate.mjs` | ✅ |
| `examples/new-project/` | ✅ |
| `examples/existing-project/` | ✅ |
| `tests/*.test.mjs` | ✅ |
| `VERSION` | ✅ |

## 明确暂不创建

`wiki/`、`context/`、`index/`、`agents/`、`rules/` 并列体系、语言规范章节、MCP、插件自动同步、skills catalog、legacy-project-wiki 流水线 — **待契约修订后再加**。

## 验收顺序（与 harness-contract §5 一致）

- [x] Contract 首版落盘  
- [x] `node src/validate.mjs` Layer 0 通过  
- [x] `init` 空目录 + 幂等测试  
- [ ] 旧项目接入夹具（真实仓库 dry-run 记录）  
- [x] 校验器无 v1 依赖（代码审查）  
- [x] `main` 单提交活动线（无 `v2` 过渡分支）  
- [x] 删除远程 `v2`、`feat/harness-init-and-unify` 活动分支  

## 推广边界

**禁止** 与 PayNow 等同时改；本仓库 tests 全绿后再开业务仓库试点。
