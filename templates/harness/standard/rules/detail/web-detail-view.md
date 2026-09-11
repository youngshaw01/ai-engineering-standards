# Web 详情查看态 IA 规范

> **Layer 1 项目细则** — 继承全局标准 `ai-engineering-standards/04-Frontend/Detail-View-IA.md`  
> Rule IDs：`FE-DV-001` … `FE-DV-008`（见 `.harness/config/rule-id.yaml`）  
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
| FE-DV-008 | Descriptions Label 等宽 | R08 |

---

## R03 — Drawer 宽度（项目落地，可选）

⚠️ 默认见全局 R03（按字段数 480–640px / 50%–60%）。

💡 **可选项目约定**：查看/编辑/新增统一固定视口百分比，避免模式切换布局跳动。

| 项 | 示例（MPOC） |
|----|----------------|
| 宽度值 | `58%` |
| 常量 | `DETAIL_DRAWER_WIDTH`（`useDetailDrawer.ts`） |
| Hook | `useDetailDrawer(drawerProps)` → `drawerSize` |

---

## R07 — 状态展示（高优先级）

> 状态是查看态第一视觉锚点（FE-DV-007）。`DetailSummary` `#tags` 须浅底高亮；有状态必渲染，无状态不占位。

| 规则 | 要求 |
|------|------|
| 位置 | 仅 L0 `DetailSummary` 右侧 Tag 区 |
| 数量 | 2–3 个；优先级：审核态 > 启用态 > 渠道/勾兑 |
| 组件 | `el-tag` + 字典 `tagType` / `tagTypeOf` |
| 禁止 | 裸 `dictValue`、L2/L3 纯文本主状态 |

---

## R08 — Label 同宽与防溢出（FE-DV-008）

⚠️ `el-descriptions` 放在 `DetailSection` 内，**右对齐 + 固定列宽 + 允许折行**。

| 场景 | 常量 / prop | 宽度（示例） |
|------|-------------|--------------|
| 默认 2 列 | `DETAIL_DESCRIPTION_LABEL_WIDTH` | `148px` |
| 长文案（EMV、报文） | `DetailSection` `:label-width="DETAIL_DESCRIPTION_LABEL_WIDTH_WIDE"` | `172px` |
| 3 列紧凑 | `DetailSection` `:label-width="DETAIL_DESCRIPTION_LABEL_WIDTH_COMPACT"` | `112px` |

⛔ 禁止 `keep-all` / `nowrap` 导致溢出；禁止 per-item inline `width`。

详见全局 [Detail-View-IA.md](../../../../../04-Frontend/Detail-View-IA.md) R07、R08。

---

## 信息 IA 四层（L0–L4）

| 层级 | 名称 | 组件 / 配置 |
|------|------|-------------|
| **L0** | 上下文摘要 | `DetailSummary` + `summary`（titleProp / subtitleProp / tagProps） |
| **L1** | 主体标识 | `detailGroup: 'subject'` |
| **L2** | 业务配置 | `detailGroup: 'config'` |
| **L3** | 运行态 | `detailGroup: 'runtime'` |
| **L4** | 审计元数据 | `detailGroup: 'meta'` |

**原则**：配置（L2）与运行态（L3）必须视觉分区（FE-DV-002）。

---

## 组件与工具（Vue 3 参考）

```
src/components/business/
├── DetailSummary/
├── DetailSection/
└── SchemaDetailView/

src/utils/detailDisplay.ts
src/composables/useDetailDictLabels.ts
src/composables/useDetailDrawer.ts
```

## i18n

- 分组标题：`detailView.section.*`
- 字段 label：复用 `table.*`

## 自检清单

- [ ] 查看态零输入框
- [ ] L2 / L3 已分区
- [ ] 必填 `*` 仅编辑态
- [ ] 空值 `-`，枚举已格式化
- [ ] Drawer 宽度匹配字段数或项目统一百分比
- [ ] L0 状态 Tag 语义色高亮（FE-DV-007）
- [ ] `el-descriptions` label 列等宽（FE-DV-008）

## 项目示例

> 替换为本项目首个试点路径，例如：  
> `views/termManage/components/TermDrawer.vue`
