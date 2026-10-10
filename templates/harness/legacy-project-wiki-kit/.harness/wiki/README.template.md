# 项目业务 Wiki

> `source_commit`：待填写 · `analyzed_at`：待填写 · `coverage_status`：blocked · `audit_status`：not_audited · `pending_count`：0  
> 权威版本字段见 [`_manifest.yaml`](_manifest.yaml)。阶段 5 由协调 Agent 与本文件同步更新。

## 这套 Wiki 是什么
本文档集以业务能力组织项目知识，结论尽可能追溯到源码位置。它描述当前可观察到的实现，不自动等同于产品需求、合同或业务方认可的规则。

## 证据标记
- `[事实]`：有直接源码/配置/DDL证据。
- `[推断]`：根据多个证据推导，必须写出依据和局限。
- `[待确认]`：仓库证据不足，需要维护者、业务方或运维确认。

## 新人阅读顺序
1. [全局侦察](00-recon.md)
2. [业务能力地图](01-capability-map.md)
3. [架构与部署](02-architecture.md)
4. 按能力地图选择 `domains/` 中的核心业务域
5. 阅读 `flows/` 中的跨域流程
6. 阅读 [实体关系](data/er.md) 与 [状态机汇总](data/state-machines.md)
7. 阅读 [第三方集成](integrations/third-party.md)
8. 阅读 [待确认问题](_pending.md) 与 [独立审计](_audit.md)

## 文件索引
| 文件 | 摘要 | 状态 |
|---|---|---|
| `00-recon.md` | 技术、入口、配置、部署与扫描范围事实清单 | 待生成 |
| `01-capability-map.md` | API 和其他入口到业务能力域的映射 | 待生成 |
| `02-architecture.md` | 认证、错误、事务、缓存、可观测性和部署等横切关注点 | 待生成 |
| `domains/*.md` | 各业务域的调用链、规则、数据、状态机和待确认项 | 待生成 |
| `flows/*.md` | 有源码证据的跨域端到端流程 | 待生成 |
| `data/er.md` | 物理与逻辑实体关系汇总 | 待生成 |
| `data/state-machines.md` | 已发现状态机的统一索引 | 待生成 |
| `integrations/third-party.md` | 外部服务依赖、初始化和实际调用位置 | 待生成 |
| `_pending.md` | 需要人类确认的问题总表 | 待生成 |
| `_audit.md` | 独立源码反证审计结果 | 待生成 |

## 业务域 → 代码路径反查表
阶段 2 通过后填充。每行都链接到领域文档和代码证据。

| 业务域 | 领域文档 | 主要入口 | 关键代码路径 | 覆盖状态 |
|---|---|---|---|---|
| 待发现 | — | — | — | 未分析 |

## 范围与局限
待阶段 1、6 根据真实扫描记录填充。不得在 `audit_status` 为 `passed` 或 `conditional` 之前声称 Wiki 可交付。

## 链接规则
- Wiki 内互链：相对本目录，如 `domains/order.md`
- 指向源码：相对仓库根并带行号，如 `../../src/api/router.go#L10-L20`
