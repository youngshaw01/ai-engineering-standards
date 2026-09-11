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

**SHOULD** — 查看态 `el-descriptions` / `Descriptions` 的 **label 列统一宽度**（同组对齐），并 **允许折行**，避免长短 label 参差或溢出单元格。

| 要求 | 说明 |
|------|------|
| 默认宽度 | **140–160px**（示例 `148px`），右对齐 |
| 长文案分区 | **WIDE**（示例 `172px`）：EMV、报文、长 i18n 字段 |
| 多列紧凑 | **COMPACT**（示例 `112px`）：`:column="3"` 等 |
| 常量 | 导出 `DETAIL_DESCRIPTION_LABEL_WIDTH` / `_WIDE` / `_COMPACT` |
| 作用域 | `DetailSection` 内统一；通过 `labelWidth` prop 按分组覆盖 |
| 换行 | `white-space: normal` + `overflow-wrap: anywhere`；固定列宽内折行 |

✅ 示例（Vue 3）：

```vue
<DetailSection title="..." :label-width="DETAIL_DESCRIPTION_LABEL_WIDTH_WIDE">
  <el-descriptions :column="2" border>...</el-descriptions>
</DetailSection>
```

```scss
.detail-section__body :deep(.el-descriptions__label) {
  width: var(--detail-description-label-width);
  min-width: var(--detail-description-label-width);
  max-width: var(--detail-description-label-width);
  text-align: right;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
  box-sizing: border-box;
}
```

**禁止**

- `word-break: keep-all` / `white-space: nowrap` 导致 label 溢出。
- 为单个 `el-descriptions-item` 写 inline `width`。
- 完全依赖浏览器 `auto` 宽度随文案伸缩。

**参考实现**：Malaysia AcqSys — `ICEmvParaDetail.vue`（长字段 WIDE、TAC 三列 COMPACT）

---

### R05 — 组件与目录约定（Vue 3 参考）

**SHOULD** — 消费项目在 `src/components/business/` 提供可复用详情 primitives：

```
DetailSummary/    # L0 摘要 + status tags slot
DetailSection/    # 分组标题 + 左侧色条 + default slot
```

配套工具（示例命名）：

```
utils/detailDisplay.ts       # formatDetailEmpty / DETAIL_DESCRIPTION_LABEL_WIDTH
composables/useDetailDictLabels.ts   # 字典 label + getDetailTagType，与列表 enum 一致
composables/useDetailDrawer.ts       # 可选：DETAIL_DRAWER_WIDTH 统一 Drawer 宽度
```

i18n：分组标题使用 `detailView.section.*`，字段 label 复用 `table.*`。

---

### R06 — 推广与 schema 演进

**SHOULD** — 新详情页直接采用本规范；存量 `*Drawer` 查看态逐步迁移。

**MAY** — Form schema 增加 `detailGroup: 'subject' | 'config' | 'runtime' | 'meta'`，一套 column 定义驱动 Form + Detail 双视图。

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
- [ ] `el-descriptions` label 列等宽

---

## Related

| 文档 | 说明 |
|------|------|
| [TypeScript](TypeScript.md) | 详情 props / 字典类型 |
| [CSS](CSS.md) | 间距、typography、BEM |
| `templates/harness/standard/rules/detail/web-detail-view.md` | 消费项目 Harness 细则模板 |

**Rule IDs**：`FE-DV-001` … `FE-DV-008`（见 `.harness/config/rule-id.yaml`）
