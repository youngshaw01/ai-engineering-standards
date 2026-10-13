# ai-engineering-standards

**v2 · Clean-room**：在明确契约上重建的最小 Harness 标准库，不继承 v1 目录树与旧工具链。

| 文件 | 说明 |
| --- | --- |
| [`VERSION`](VERSION) | 活动标准版本 |
| [`contract/harness-contract.md`](contract/harness-contract.md) | 目录、职责、SSOT、工具边界 |
| [`contract/adoption-contract.md`](contract/adoption-contract.md) | 既有项目接入与冲突策略 |
| [`contract/project-config.schema.json`](contract/project-config.schema.json) | `.harness/project.json` Schema |

## 原则（摘要）

- 旧版 **退出运行路径**；封板只读：`git checkout v1-sealed-20261013` 或分支 `sealed/v1-full`。  
- 新版 **不读取** v1 配置、同步脚本、生成器。  
- 先在本仓库完成 **init → validate → tests** 闭环，再推广到业务项目（如 PayNow）。

## 工具

```bash
# Layer 0 自检
node src/validate.mjs

# 初始化消费项目（空目录或既有仓库）
node src/init.mjs --project /path/to/repo --project-id my-app --display-name "My App"
node src/validate.mjs --project /path/to/repo

# 测试
node --test tests/*.test.mjs
```

## 仓库布局（活动实现）

见 `contract/harness-contract.md` §1。初始仅含 `contract/`、`templates/minimal/`、`src/init.mjs`、`src/validate.mjs`、`examples/`、`tests/`。

## 分支

- **活动实现**：`main`（仅此一条活动线）
- **v1 封板**：标签 `v1-sealed-20261013`、分支 `sealed/v1-full`（只读，不参与生成/校验）

## License

MIT — [LICENSE](LICENSE)
