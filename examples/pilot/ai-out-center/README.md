# Pilot：AI-Out-center（遗留项目接入）

> **性质**：真实项目接入证据，**不是** Harness 契约正文。业务细节不得写入 `contract/`。

## 目的

记录一次遗留业务仓库使用 R0 `init` / `adopt` / `validate` 的实证，供 **R0-stable** 发布核对。

## 标准库基线

| 项 | 值 |
| --- | --- |
| 仓库 | `youngshaw01/ai-engineering-standards` |
| 发布 tag（目标） | `r0-stable-20261013` |
| 含 Pilot 修补的 commit | 见 [`validation-result.json`](validation-result.json) → `standardsCommit` |

## 范围

**纳入本 Pilot 的证据**

- 空白/遗留路径下的 `adopt --dry-run` / `adopt` / `validate --project`
- 退出码与 JSON 摘要
- 模板与契约一致性（如 `project.yaml` SSOT、adopt vs validate 禁止路径边界）

**不纳入通用契约**

- 业务域迁移方案（如 `biz_no`）
- 语言工具链不可用（如 Go 环境）
- 数据库/运维操作步骤

## 使用方式

1. 在目标业务仓库按 [`validation-result.json`](validation-result.json) 中的 `commands` 复现（或更新该文件）。  
2. 将 `validate` 的 `ok` 与 `configErrors` 摘要写入 JSON。  
3. 若有 **人工修改**（合并 AGENTS、删旧目录等），列入 `manualSteps`；不得把人工后的成功记为全自动 adopt 成功。

## 相关契约

- 运行：`contract/harness-contract.md`、`contract/adoption-contract.md` §6（adopt / validate 边界）  
- 设计：`contract/harness-system-design.md`（上位，不改变 runtime）
