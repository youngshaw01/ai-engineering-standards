# Harness Contract（v2 · Clean-room）

> **标准版本**：见根目录 `VERSION`  
> **配置 Schema**：[`project-config.schema.json`](project-config.schema.json)  
> **接入规则**：[`adoption-contract.md`](adoption-contract.md)

## 0. 重建原则（非协商）

1. **不继承** v1 目录树、生成器、同步脚本、目录校验逻辑。  
2. **不保留** 旧路径兼容层；v1 仅通过 Git 封板（`v1-sealed-20261013`）只读参考。  
3. **新版工具**（`src/init`、`src/validate`）不得读取 v1 配置、脚本或索引。  
4. **扩展** 须先修订本契约与 Schema，再改模板与校验器；禁止「边跑边发明目录」。  
5. **先闭环本仓库**，再推广到 PayNow 等业务仓库。

## 1. 标准库仓库布局（Layer 0 · 活动实现）

本仓库 **活动路径** 仅包含下列树；未列出的目录不得作为生成或校验依赖。

```
ai-engineering-standards/
├── README.md
├── VERSION
├── CHANGELOG.md
├── LICENSE
├── contract/                 # 契约 SSOT（本文件 + schema + adoption）
├── templates/minimal/        # 唯一官方初始化母版
├── src/init.mjs              # 初始化（Node，无 v1 依赖）
├── src/validate.mjs          # 校验（Node，无 v1 依赖）
├── examples/                 # 用法说明与夹具路径约定
└── tests/                    # 独立验收测试
```

**明确不在 v2 初始范围内**：`wiki/`、`context/`、`index/`、`agents/`、`rules/` 并列体系、语言章节规范、MCP、插件自动同步、`.harness/` 元副本于标准库根。

## 2. 消费项目布局（Layer 1 · 由 init 生成）

`init` 从 `templates/minimal/` 生成；**不得**追加 v1 的 `harness.yaml`、Blueprint v1 `project.yaml` 等字段。

```
<consumer-repo>/
├── AGENTS.md                 # 短入口（模板提供，可编辑）
└── .harness/
    ├── project.json          # 机器 SSOT，符合 project-config.schema.json
    ├── README.md
    └── workspace/
        └── .gitkeep
```

### 职责

| 路径 | 职责 |
| --- | --- |
| `AGENTS.md` | Agent 入口；不堆业务知识 |
| `.harness/project.json` | 项目身份、契约版本、校验声明 |
| `.harness/workspace/` | 过程产物；非长期规范 SSOT |

## 3. SSOT 优先级（消费项目内）

1. 代码、迁移、可重复通过的测试/门禁日志  
2. `.harness/project.json`（契约版本与工具声明）  
3. 本仓库 `contract/`（引用，非项目内事实）  
4. v1 封板内容（**仅人工参考**，不参与生成与 validate）

## 4. 工具行为边界

| 工具 | 允许 | 禁止 |
| --- | --- | --- |
| `src/init` | 从 `templates/minimal` 复制；`--dry-run`；跳过已存在文件（除非 `--force` 显式） | 读 v1 路径；调用旧 sync/verify；静默覆盖业务目录 |
| `src/validate` | 校验 Layer 0 自检或 `--project <path>` 消费项目结构 + `project.json` | 依赖 v1 脚本；修改目标仓库 |

## 5. 验收顺序（发布门禁）

1. **Contract 评审**：目录、职责、配置、SSOT、扩展边界无歧义。  
2. **空目录生成**：`init` 在空目录结果与契约一致。  
3. **幂等**：重复 `init` 不重复创建、不静默覆盖。  
4. **旧项目接入**：见 `adoption-contract.md`（只报告冲突，不擅自搬迁）。  
5. **独立校验**：`validate` 不依赖 v1。  
6. **切换活动版本**：`main` 为唯一活动实现；v1 退出运行路径；不保留平行活动分支（如已废弃的 `v2` 线）。

## 6. v1 封板（历史，非运行依赖）

| 引用 | 用途 |
| --- | --- |
| Git tag `v1-sealed-20261013` | 只读全量 v1 树 |
| Branch `sealed/v1-full` | 同快照维护 |

新版 **不得** 在运行时 `import`、读取或 `exec` v1 树内脚本。
