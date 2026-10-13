# Harness Contract v2

> **版本**：`2.0.0`（与 `project.yaml` → `schemaVersion` 一致）  
> **配置 Schema**：[`project-config.schema.json`](project-config.schema.json)（校验解析后的对象）  
> **接入**：[`adoption-contract.md`](adoption-contract.md)

## 1. 目的、范围与非目标

### 1.1 目的

为消费项目提供 **可验证、可复制** 的 `.harness/` 最小工作区：机器可读配置、短入口 `AGENTS.md`、过程产物目录。

### 1.2 适用范围

- Git 或 SVN 工作副本上的应用/库仓库。  
- 通过本仓库 `src/init.mjs`、`src/adopt.mjs`、`src/validate.mjs` 生成与校验（**不得**依赖 v1 封板树内脚本）。

### 1.3 非目标

- 语言/框架规范大全、`rules/` 并列体系、`wiki/`/`knowledge/`/`context/`/`index/`/`agents/` 未经契约扩展不得出现。  
- MCP、插件自动同步、多 Agent 编排、跨仓库索引。  
- 自动搬迁业务源码或删除用户目录。

## 2. 标准库仓库（Layer 0）布局

```
ai-engineering-standards/
├── README.md
├── VERSION
├── CHANGELOG.md
├── LICENSE
├── contract/
│   ├── harness-contract.md          # 本文件（SSOT）
│   ├── project-config.schema.json
│   └── adoption-contract.md
├── templates/minimal/
├── src/init.mjs | adopt.mjs | validate.mjs
├── examples/new-project/ | existing-project/
└── tests/
```

**禁止** Layer 0 根目录出现 `.harness/` 元副本、`archive/`、v1 章节目录作为活动实现。

## 3. 消费项目（Layer 1）最小布局

### 3.1 必需

| 路径 | 必需 |
| --- | --- |
| `AGENTS.md` | 是（init/adopt 生成，可编辑） |
| `.harness/project.yaml` | 是 |
| `.harness/README.md` | 是 |
| `.harness/workspace/` | 是（目录存在即可） |

### 3.2 可选（契约 v2.0.0 未定义则不生成）

无。扩展须 bump `schemaVersion` 并修订本契约。

### 3.3 禁止（未经扩展不得作为并列 SSOT）

`harness.yaml`、v1 `apiVersion: harness.blueprint/v1` 配置、`.harness/rules/`、`.harness/skills/`、`.harness/knowledge/`、`.harness/wiki/`、`.standards/`。

## 4. 文件职责（SSOT）

| 路径 | 唯一职责 | 禁止 |
| --- | --- | --- |
| `AGENTS.md` | Agent 入口；≤120 行 | 长 SOP、重复 project.yaml 字段表 |
| `.harness/project.yaml` | 身份、`vcs`、标准库版本引用 | 业务模块表、密钥 |
| `.harness/workspace/` | 任务过程产物 | 永久规范正文 |
| `contract/*`（标准库） | 契约 SSOT | 项目内复制整份契约 |

**重复内容**：业务事实以代码/测试为准；契约只定义 Harness 形状，不定义业务规则正文。

## 5. AGENTS.md

- **长度**：目标 50–120 行。  
- **必须**：指向 `.harness/project.yaml`；说明 workspace 用途。  
- **不得**：复制 `harness-contract.md` 全文；不得定义与契约冲突的目录。

## 6. project.yaml

- **格式**：YAML。  
- **Schema**：`project-config.schema.json`（`schemaVersion` **必须**为 `2.0.0`）。  
- **必填**：`schemaVersion`、`projectId`、`vcs`（`git` | `svn`）、`standards.repository`、`standards.version`。  
- **默认**：`standards.contract` 缺省视为 `contract/harness-contract.md`（校验器按此补全后验证）。  
- **版本策略**：不兼容变更 bump `schemaVersion`；工具拒绝未知主版本。

## 7. 优先级（消费项目内）

1. 代码、迁移、可重复测试/门禁日志  
2. `.harness/project.yaml`  
3. 本仓库 `contract/`（引用，非项目内第二副本）  
4. v1 Git 封板 `v1-sealed-20261013`（**仅人工阅读**，工具 **禁止**读取）

## 8. 生命周期

| 操作 | 命令 | 失败码 |
| --- | --- | --- |
| 新项目 | `node src/init.mjs --project <dir> ...` | 2=冲突 |
| 已有项目 | `node src/adopt.mjs --project <dir> ...` | 2=冲突, 3=legacy 未确认 |
| 校验 Layer 0 | `node src/validate.mjs` | 1=失败 |
| 校验消费项目 | `node src/validate.mjs --project <dir>` | 1=失败 |
| 升级 | 修订契约后 bump VERSION；`adopt --dry-run` 预览；**无**自动覆盖用户 AGENTS.md | — |
| 回滚 | 用户 VCS 回滚；工具不写回滚逻辑 | — |
| 退出 | 删除 `.harness/` 与 AGENTS.md（人工）；工具不提供 uninstall | — |

**保守默认**：存在目标文件则 **跳过** 并报告 `CONFLICT_EXISTS`；仅 `--force` 覆盖模板列表内文件。

## 9. 校验器规则与通过标准

`validate.mjs` **独立**于 `init`/`adopt` 实现（单独模块校验路径与 Schema）。

通过当且仅当：

- Layer 0：§2 所列路径均存在；`src/**` 无 v1 运行依赖（见 `tests/legacy-deps.test.mjs`）。  
- 消费项目：§3.1 满足；`project.yaml` 解析后通过 Schema；若存在 v1 残留则 **警告** `LEGACY_V1_*` 且 `strict` 模式下失败。

`--strict`：将 LEGACY 警告视为失败。

## 10. 兼容性

- v2 **不**向后兼容 v1 `harness.yaml` / Blueprint `project.yaml`。  
- 接入 v1 项目 = **并存检测 + 人工迁移**，见 `adoption-contract.md`。
