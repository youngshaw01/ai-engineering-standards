# Detail View Information Architecture (IA)

## Overview

本文档定义 **B 端管理后台「详情查看态」** 的信息架构与布局规范。适用于 Drawer / Modal / 独立详情页等只读场景。

核心原则：**查看不是「禁用的表单」**，而是按业务语义分层的只读描述视图。

**参考实现（Layer 1 试点）**：Malaysia AcqSys — `TermLimitDetail.vue`（Vue 3 + Element Plus）

---

## Rules

### R01 — 查看态与编辑态组件分离

**MUST** — 查看（view）与编辑/新增（edit/add）使用不同 UI 结构，禁止同一套 disabled 表单承担两种职责。

| 模式 | 用户目标 | 允许 | 禁止 |
|------|----------|------|------|
| **查看** | 快速读懂、对比、决策 | Description List / 分组只读布局 | disabled 输入框、placeholder、必填 `*` |
| **编辑/新增** | 填表、校验、提交 | Form / ProForm / el-form | 与查看态混用 |

⛔ **禁止** `ProForm` + `isView`、`<form disabled>` 等方式展示只读详情。

✅ 示例（Vue 3）：

```vue
<el-drawer :size="isView ? '520px' : '60%'">
  <XxxDetail v-if="isView" :data="rowData" />
  <ProForm v-else v-model="formData" />
  <template #footer>
    <el-button>{{ isView ? $t('btn.close') : $t('btn.cancel') }}</el-button>
    <el-button v-show="!isView" type="primary">{{ $t('btn.confirm') }}</el-button>
  </template>
</el-drawer>
```

---

### R02 — 信息 IA 四层模型（L0–L4）

**MUST** — 详情内容按以下层级自上而下组织；80% 场景只需 L0–L3。

| 层级 | 名称 | 典型内容 | 展示位置 |
|------|------|----------|----------|
| **L0** | 上下文摘要 | 主标识 · 次要标识 · 关键维度；**语义色状态 Tag**（见 R07） | 顶部摘要条 |
| **L1** | 主体标识 | ID、编号、名称、类型 | 第 1 分组 |
| **L2** | 业务配置 | 可编辑的配置项（规则、限额、开关） | 第 2 分组，2–3 列 |
| **L3** | 运行态 | 累计值、实时统计、进度 | 独立分组 + hint |
| **L4** | 审计元数据 | 创建/更新人、时间 | 最后一组，可折叠 |

**MUST** — 配置（L2）与运行态（L3）必须视觉分区，不可平铺在同一表单块。

---

### R03 — 容器宽度与列密度

**SHOULD** — Drawer / 侧栏宽度与字段数量匹配，避免「宽容器 + 单列长表单」。

| 字段数 | 建议列数 | Drawer 宽度 |
|--------|----------|-------------|
| ≤ 4 | 2 | 480px |
| 5–9 | 2–3 | 520px |
| ≥ 10 | 2–3 或 Tab | 560–640px |

编辑态可按复杂度使用 50%–60% 视口宽度。

**消费项目统一宽度（MAY）** — 字段较多、查看/编辑共用同一 Drawer 时，可将三种模式统一为固定视口百分比，避免模式切换布局跳动。示例：**MPOC 管理端统一 `58%`**（见项目细则 `.harness/rules/web-detail-view.md` R03，`DETAIL_DRAWER_WIDTH`）。

---

### R04 — 字段展示格式

**MUST** — 只读字段使用统一格式化，禁止裸值与表单 placeholder。

| 类型 | 格式 | 说明 |
|------|------|------|
| ID/编号 | 等宽字体，可选复制 | 禁止 disabled 下拉 |
| 金额 | 千分位 + 2 小数 | 右对齐或 tabular-nums |
| 整数/笔数 | 千分位，无小数 | — |
| 空值 | `-` | 禁止「请输入」类 placeholder |
| 枚举 | 字典 label | 禁止裸 `dictValue` / code |
| 状态 | Tag + 语义色（R07） | 优先放 L0 摘要，禁止 `plain` 灰框 |
| JSON / 报文 | 缩进格式化 + 只读文本域（R09） | 禁止单行裸 JSON 撑破布局 |
| 长 URL / 包名 | 只读文本域 `longtext`（R09） | 禁止半列挤压 |

---

### R09 — JSON / 长文本只读文本域与整行布局

**SHOULD** — 查看态中 JSON 字符串、设备报文、长 URL、升级包名等长结构化/长文本，**禁止**在 `el-descriptions` 值单元格内半列单行平铺。

#### 识别与 schema

| 类型 | schema | 识别条件 |
|------|--------|----------|
| JSON | `detailFormat: 'json'` 或 `auto` | 可解析 `{`/`[` 开头 JSON；或 `search.inputType: 'textarea'` 且内容为 JSON |
| 长文本 | `detailFormat: 'longtext'` | URL、文件名、签名串等非 JSON 长字符串 |
| 纯文本 | `detailFormat: 'text'` | 强制普通 `pre-wrap`，不走 JSON 格式化 |

#### 展示组件

| 要求 | 说明 |
|------|------|
| 组件 | `DetailJsonBlock` / 只读 `<textarea>`（`mode: 'json' \| 'longtext'`） |
| JSON 格式 | `JSON.stringify(obj, null, 2)` 缩进 |
| 高度 | `max-height: 160px`（`DETAIL_JSON_BLOCK_MAX_HEIGHT`），**内部滚动** |
| 宽度 | `width: 100%`；**须整行独占**（见下节） |
| 字体 | 等宽 `monospace` 12px |

⛔ 禁止无 `max-height` 的全量展开导致 Drawer 被单字段撑满。

#### 整行独占（多列 grid 必做）

**MUST** — 在 `:column="2"`（或更多）的 `el-descriptions` 中，JSON / `longtext` / `textarea` 字段 **不得** 仅依赖 `el-descriptions-item :span="2"` 占满一行。

**原因**：Element Plus `Descriptions` 对**分组末项**会执行 `lastSpan = column - (totalSpan % column)`；当前序字段数为奇数时，末项 `span` 会被**强制压成 1**，导致「语种 | 文件信息 JSON」并排（ITS-POSP 语音流水已验证）。

**做法**（`SchemaDetailView` 参考实现）：

1. `resolveDetailSpan()` 判定整行字段（`detailFormat` / `textarea` / 可解析 JSON）。
2. 将 section 内 columns **拆成两块**：
   - **inline**：普通字段 → 原 `:column="2"` 的 `el-descriptions`（class `schema-detail-view__desc--multi`）
   - **block**：整行字段 → 独立 `:column="1"` 的 `el-descriptions`（class `schema-detail-view__desc--single`），接在 inline 下方，视觉上合并为一张表（去重复顶边框）。

✅ 示例（Vue 3）：

```vue
<DetailJsonBlock :value="row.audioInf" aria-label="文件信息" />
<DetailJsonBlock mode="longtext" :value="row.upgradeUrl" aria-label="升级 URL" />
```

```ts
// detailDisplay.ts
export const resolveDetailSpan = (options, sectionColumn) => {
  if (options.detailFormat === 'json' || options.detailFormat === 'longtext') return sectionColumn;
  if (options.inputType === 'textarea') return sectionColumn;
  // ...
};
```

**schema**：`detailFormat?: 'auto' | 'json' | 'longtext' | 'text'`；`detailSpan?: number`（显式覆盖）。

---

### R07 — L0 状态 Tag 语义高亮

**SHOULD** — L0 摘要区 `tagProps`（或等价 slot）中的枚举/状态字段，使用 **语义色 + 浅底高亮**（如 Element Plus `effect="light"`、Ant Design `color` preset），便于一眼识别风险、启用、流程状态。

| 要求 | 说明 |
|------|------|
| 位置 | 仅 L0 `DetailSummary` 顶部 `#tags` slot；**禁止**将主状态埋在 L2/L3 表格纯文本中 |
| 数量 | 摘要条 **2–3 个** Tag；优先级：审核/流程态 > 启用态 > 渠道/勾兑等 |
| 容器 | Tag 区 **浅底 + 主色描边**（如 `primary-light-9` 背景），与正文摘要区分 |
| 样式 | 语义色 Tag；**禁止**仅 `plain` 灰边框（辨识度不足） |
| 字重 | 建议 `font-weight: 600` |
| 文案 | 字典 `label` / `{字段 label}: {字典 desc}`，禁止裸 code |
| 着色 | 字典项 `tagType` 优先；否则集中映射（如 `getDetailTagType` / `tagTypeOf`） |

**参考映射（业务字典值 → Tag 类型）**

| 字段语义 | 值（示例） | Tag 类型 |
|----------|------------|----------|
| 风险等级 | 正常 `0` | `success` |
| 风险等级 | 可疑 `1` | `warning` |
| 风险等级 | 危险/禁止 `2`/`3` | `danger` |
| 启用标志 | 正常/启用 `1` | `success` |
| 启用标志 | 停用 `0` | `danger` |
| 流程状态 | 待处理 `0` | `warning` |
| 流程状态 | 进行中 `1` | `primary` |
| 流程状态 | 已完成 `2` | `success` |

✅ 示例（Vue 3 + Element Plus）：

```vue
<DetailSummary :primary="summaryText">
  <template #tags>
    <el-tag :type="tagType" effect="light">{{ label }}</el-tag>
  </template>
</DetailSummary>
```

```scss
.detail-summary__tags {
  padding: 6px 12px;
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-5);
  border-radius: 6px;
}
```

---

### R08 — Descriptions Label 等宽与防溢出

**SHOULD** — 查看态 `el-descriptions` / `Descriptions` 的 **label 列统一宽度**（**含多列 grid 左右两列 label 竖向对齐**），并 **允许折行**，避免长短 label 参差或 value 起始线错位。

| 要求 | 说明 |
|------|------|
| 默认宽度 | **140–160px**（示例 `148px`），**右对齐** |
| 长文案分区 | **WIDE**（示例 `172px`）：EMV、报文、长 i18n 字段 |
| 多列紧凑 | **COMPACT**（示例 `112px`）：`:column="3"` 等 |
| 常量 | `DETAIL_DESCRIPTION_LABEL_WIDTH` / `_WIDE` / `_COMPACT`；`resolveSectionLabelWidth()` |
| 作用域 | `DetailSection` 内统一；通过 `labelWidth` prop 按分组覆盖 |
| 换行 | `white-space: normal` + `overflow-wrap: anywhere`；固定列宽内折行 |
| **多列对齐** | `table-layout: fixed`；`el-descriptions` 设 `label-align="right"` + `:label-width`；双列 grid 时 label 位于 `td:nth-child(4n+1)` 与 `td:nth-child(4n+3)`，**同宽** |

#### 多列 grid 对齐原理（`:column="2"` / `3`）

Element Plus `el-descriptions` 在 `border` 模式下渲染为 **table**。多列时每一行由「label + value」成对重复：

```
双列 (:column="2") 单行结构：

  ┌──────────────┬─────────────────┬──────────────┬─────────────────┐
  │ Label A      │ Value A         │ Label B      │ Value B         │
  │ (固定宽 W)   │                 │ (固定宽 W)   │                 │
  └──────────────┴─────────────────┴──────────────┴─────────────────┘
       ↑ col 1 (4n+1)                  ↑ col 3 (4n+3)

  下一行 Label C / Label D 必须与上一行 Label A / Label B **同宽 W**，
  否则会出现「设备ID SHA256」很宽、「OS版本」很窄，value 起始竖线错位。
```

| 列数 | label 单元格选择器（EP bordered table） | 建议宽度档 |
|------|----------------------------------------|------------|
| 1（meta） | 每行 `td.el-descriptions__label` | `default` |
| 2（subject/config） | `tr > td:nth-child(4n+1)`、`4n+3` | `default` |
| 3（紧凑分区） | `tr > td:nth-child(6n+1)`、`6n+3`、`6n+5` | `compact` |

**MUST（多列场景）** — 同时满足以下三点，缺一不可：

1. `el-descriptions` 设置 `:label-width`（与 CSS 变量同值）。
2. `DetailSection` 内 `:deep()` 固定 **所有 label 单元格** 宽为 `var(--detail-description-label-width)`（含 nth-child 规则）。
3. `table-layout: fixed` + `label-align="right"`，label 过长时 **折行** 而非撑宽列。

✅ 示例（Vue 3 + Element Plus）：

```vue
<DetailSection title="业务配置" label-width="default">
  <el-descriptions
    :column="2"
    border
    label-align="right"
    :label-width="resolveSectionLabelWidth('default')"
    class="schema-detail-view__desc--multi"
  >
    ...
  </el-descriptions>
</DetailSection>
```

```scss
.detail-section__body :deep(.el-descriptions__table.is-bordered) {
  table-layout: fixed;
  width: 100%;
}

.detail-section__body :deep(.schema-detail-view__desc--multi .el-descriptions__table.is-bordered tr > td:nth-child(4n + 1)),
.detail-section__body :deep(.schema-detail-view__desc--multi .el-descriptions__table.is-bordered tr > td:nth-child(4n + 3)) {
  width: var(--detail-description-label-width);
  min-width: var(--detail-description-label-width);
  max-width: var(--detail-description-label-width);
}

.detail-section__body :deep(td.el-descriptions__cell.el-descriptions__label.is-bordered-label) {
  vertical-align: top;
  text-align: right;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
  line-height: 1.5;
  box-sizing: border-box;
}
```

**禁止**

- `word-break: keep-all` / `white-space: nowrap` 导致 label 溢出。
- 为单个 `el-descriptions-item` 写 inline `width`（除 EP `label-width` 统一 prop）。
- 完全依赖浏览器 `table-layout: auto` 随文案伸缩（**会导致左右列 label 边界不齐**）。

**参考实现**：ITS-POSP `DetailSection` + `SchemaDetailView`；Malaysia AcqSys — `ICEmvParaDetail.vue`（长字段 WIDE、TAC 三列 COMPACT）

---

### R05 — 组件与目录约定（Vue 3 参考）

**SHOULD** — 消费项目在 `src/components/business/` 提供可复用详情 primitives：

```
DetailSummary/       # L0 摘要 + status tags
DetailSection/       # 分组标题 + 左侧色条 + label 列宽 CSS 变量
DetailJsonBlock/     # 只读 textarea（json | longtext）
SchemaDetailView/    # L0–L4 分组渲染 + inline/block 双 descriptions
```

配套工具（示例命名）：

```
utils/detailDisplay.ts       # formatDetailEmpty / resolveDetailSpan / resolveSectionLabelWidth
utils/detailColumnGroups.ts  # mergeDetailColumns（流水多段 columns）
composables/useDetailDictLabels.ts   # 字典 label + getTagType
composables/useDetailDrawer.ts       # DETAIL_DRAWER_WIDTH
```

schema 扩展（R06）：`detailGroup`、`detailFormat`、`detailSpan`。

---

### R06 — 推广与 schema 演进

**SHOULD** — 新详情页直接采用本规范；存量 `*Drawer` 查看态逐步迁移。

**MAY** — Form schema 增加：

- `detailGroup: 'subject' | 'config' | 'runtime' | 'meta'`
- `detailFormat: 'auto' | 'json' | 'longtext' | 'text'`
- `detailSpan?: number`（显式栅格跨度；整行 JSON 仍应用 R09 block 拆分）

一套 column 定义驱动 Form + Detail 双视图。

---

## Framework Notes

### Vue 3 + Element Plus

- 只读布局：`el-descriptions` + `DetailSection` 分组
- 状态：`el-tag` 放 L0
- 示例：`web/acquire-manage/.../TermLimitDetail.vue`

### React + Ant Design / MUI（等价映射）

| Element Plus | Ant Design | 用途 |
|--------------|------------|------|
| `el-descriptions` | `Descriptions` | 键值对 |
| `el-tag` | `Tag` | L0 状态 |
| `el-drawer` | `Drawer` | 侧栏详情 |

IA 分层（L0–L4）与 R01–R04、R07–R08 对框架无关，组件名按栈替换即可。

---

## Checklist

- [ ] 查看态零输入框（除可选「复制 ID」）
- [ ] 3 秒内能答核心业务三问（如：是谁、限额多少、今天用了多少）
- [ ] 配置 vs 运行态已分区（L2 / L3）
- [ ] 必填 `*` 仅出现在编辑态
- [ ] 空值 `-`，金额/枚举已格式化
- [ ] Drawer 宽度与字段数量匹配
- [ ] L0 状态 Tag 语义色高亮（非 plain 灰框）
- [ ] 多列 grid 左右 label 列竖向对齐（R08：`table-layout: fixed` + 统一 label 宽）
- [ ] JSON / 长文本字段整行独占（R09 block 拆分，非仅 `span=2`）
- [ ] JSON / 报文 / 长 URL 缩进 + 只读文本域，160px 限高可滚动（R09）

---

## Related

| 文档 | 说明 |
|------|------|
| [TypeScript](TypeScript.md) | 详情 props / 字典类型 |
| [CSS](CSS.md) | 间距、typography、BEM |
| `templates/harness/standard/rules/detail/web-detail-view.md` | 消费项目 Harness 细则模板 |

**Rule IDs**：`FE-DV-001` … `FE-DV-009`（见 `.harness/config/rule-id.yaml`）
