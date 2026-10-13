# ai-engineering-standards

**Harness Runtime Contract（R0）** 标准库：定义 Agent 接入项目的可验证最小形状（`contract/`），提供 `init` / `adopt` / `validate` 生成与**独立**校验消费项目 `.harness/`。

本仓库**不是**语言/框架规范百科；领域规范若未来出现，应独立于 Layer 0 契约扩展（见 `contract/harness-contract.md`）。

v1 全量实现已退出运行路径；只读封板：`git checkout v1-sealed-20261013` 或分支 `sealed/v1-full`。

**R0 非目标**：不生成 `governance/`、`knowledge/`、`workflows/`、`checks/` 等 Runtime Layout 目录；不维护多工具适配器树。

## 解决什么问题

- 为新仓库生成最小 `.harness/project.yaml` + `AGENTS.md` + `workspace/`  
- 为已有仓库 **保守接入**（冲突则跳过，不覆盖业务目录）  
- 用 **独立校验器** 验证结构，不依赖生成器自证  

## 要求

- Node.js 18+（仅标准库工具链；消费项目无运行时依赖）  
- Git 或 SVN 工作副本（`vcs` 字段；存在 `.svn/` 时默认 `svn`，**无** `.git`/`.svn` 时默认 `git`——仅为字段默认值，**不表示**工具已确认目录是 Git 工作副本）

## 新项目

```bash
git clone https://github.com/youngshaw01/ai-engineering-standards.git
cd your-empty-repo
node /path/to/ai-engineering-standards/src/init.mjs \
  --project . \
  --project-id my-app \
  --display-name "My App"
node /path/to/ai-engineering-standards/src/validate.mjs --project .
```

## 已有项目（接入）

```bash
# 预览
node /path/to/ai-engineering-standards/src/adopt.mjs --project . --dry-run

# 执行（遇冲突退出码 2；遇 v1 残留退出码 3，需 --acknowledge-legacy）
node /path/to/ai-engineering-standards/src/adopt.mjs --project .
```

## 校验

```bash
# 标准库自检
node src/validate.mjs

# 消费项目（可选 --strict 将 v1 残留视为失败）
node src/validate.mjs --project /path/to/repo
```

## 升级

1. 拉取新版本 `ai-engineering-standards`，阅读 `CHANGELOG.md` 与 `contract/harness-contract.md`。  
2. `adopt --dry-run` 查看将写入的文件。  
3. 不自动覆盖已有 `AGENTS.md` / `project.yaml`；人工合并后 `validate --strict`。

## 测试

```bash
node --test tests/*.test.mjs
```

## 仓库布局

见 [`contract/harness-contract.md`](contract/harness-contract.md) §2。

## License

MIT — [LICENSE](LICENSE)
