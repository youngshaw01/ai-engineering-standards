# Web 详情查看态 IA 规范

> **Layer 1 项目细则** — 继承全局标准 `ai-engineering-standards/04-Frontend/Detail-View-IA.md`  
> Rule IDs：`FE-DV-001` … `FE-DV-009`（见 `.harness/config/rule-id.yaml`）  
> 三级分级：⛔ 绝对禁止 > ⚠️ 强烈建议 > 💡 推荐参考

## 场景分界

| 模式 | 用户目标 | 允许组件 | 禁止 |
|------|----------|----------|------|
| **查看（view）** | 快速读懂、对比、决策 | `SchemaDetailView` / `DetailSummary` + `DetailSection` + `el-descriptions` | disabled 表单、placeholder、必填 `*` |
| **编辑/新增** | 填表、校验、提交 | `ProForm` / `el-form` | 与查看态混用同一套 disabled 表单 |

⛔ **查看态禁止复用 `ProForm` + `isView`**（FE-DV-001）

---

## 全局规则索引

| 规则 | 主题 | 全局章节 |
|------|------|----------|
| FE-DV-001 | 查看/编辑分离 | R01 |
| FE-DV-002 | L0–L4 分层 | R02 |
| FE-DV-003 | Drawer 宽度与列密度 | R03 |
| FE-DV-004 | 字段格式（空值、枚举、金额） | R04 |
| FE-DV-005 | 组件与目录约定 | R05 |
| FE-DV-006 | 迁移与 schema 演进 | R06 |
| FE-DV-007 | L0 状态 Tag 语义高亮 | R07 |
| FE-DV-008 | Descriptions Label 等宽（含多列对齐） | R08 |
| FE-DV-009 | JSON / 长文本只读文本域 + 整行 block | R09 |

---

## R03 — Drawer 宽度（项目落地，可选）

⚠️ 默认见全局 R03（按字段数 480–640px / 50%–60%）。

💡 **可选项目约定**：查看/编辑/新增统一固定视口百分比，避免模式切换布局跳动。

| 项 | 示例 |
|----|------|
| 宽度值 | `58%` ~ `60%` |
| 常量 | `DETAIL_DRAWER_WIDTH`（`useDetailDrawer.ts`） |

---

## R07 — 状态展示（高优先级）

> 状态是查看态第一视觉锚点（FE-DV-007）。`DetailSummary` Tag 区须浅底高亮；有状态必渲染，无状态不占位。

| 规则 | 要求 |
|------|------|
| 位置 | 仅 L0 `DetailSummary` 右侧 Tag 区 |
| 数量 | 2–3 个 |
| 组件 | `el-tag` + 字典 `tagType` |
| 禁止 | 裸 `dictValue`、L2/L3 纯文本主状态 |

---

## R08 — Label 同宽与多列对齐（FE-DV-008）

⚠️ `el-descriptions` 放在 `DetailSection` 内：**右对齐 + 固定列宽 + 允许折行 + 多列 grid 左右 label 竖向对齐**。

| 场景 | 常量 / prop | 宽度（示例） |
|------|-------------|--------------|
| 默认 2 列 | `DETAIL_DESCRIPTION_LABEL_WIDTH` | `148px` |
| 长文案 | `DetailSection` `label-width="wide"` | `172px` |
| 3 列紧凑 | `label-width="compact"` | `112px` |

**多列对齐 MUST**：

- `table-layout: fixed` on `.el-descriptions__table.is-bordered`
- `el-descriptions` 设 `label-align="right"` + `:label-width="resolveSectionLabelWidth(...)"`
- 双列 class `schema-detail-view__desc--multi`：`td:nth-child(4n+1)` 与 `td:nth-child(4n+3)` 同宽

⛔ 禁止 `nowrap` 溢出；禁止 per-item inline `width`；禁止仅靠 `table-layout: auto`。

---

## R09 — JSON / 长文本 + 整行 block（FE-DV-009）

⚠️ JSON、流水 `fileInf`/`audioInf`、升级 URL/包名等 **禁止半列平铺**。

| 项 | 要求 |
|----|------|
| 组件 | `DetailJsonBlock`（`mode: json \| longtext`） |
| 限高 | `160px` 内部滚动 |
| schema | `detailFormat: 'json' \| 'longtext' \| 'text' \| 'auto'` |
| 整行 | `SchemaDetailView` 拆 **inline**（`:column="2"`）+ **block**（`:column="1"`）；禁止仅依赖 EP `span=2`（末项会被压扁） |

---

## 信息 IA 四层（L0–L4）

| 层级 | 名称 | 配置 |
|------|------|------|
| **L0** | 上下文摘要 | `DetailSummary` + `summary` |
| **L1** | 主体标识 | `detailGroup: 'subject'` |
| **L2** | 业务配置 | `detailGroup: 'config'` |
| **L3** | 运行态 | `detailGroup: 'runtime'` |
| **L4** | 审计元数据 | `detailGroup: 'meta'` |

---

## 组件与工具（Vue 3 参考）

```
src/components/business/
├── DetailSummary/
├── DetailSection/
├── DetailJsonBlock/
└── SchemaDetailView/

src/utils/detailDisplay.ts
src/utils/detailColumnGroups.ts
src/composables/useDetailDictLabels.ts
src/composables/useDetailDrawer.ts
```

## 自检清单

- [ ] 查看态零输入框
- [ ] L2 / L3 已分区
- [ ] L0 状态 Tag 语义色（FE-DV-007）
- [ ] 多列 label 竖向对齐（FE-DV-008）
- [ ] JSON / 长文本整行 + 160px 限高（FE-DV-009）
- [ ] 查看态 Footer 为「关闭」非「取消」

## 项目示例

> 替换为本项目首个试点路径，例如：  
> `views/termManage/components/TermDrawer.vue`
