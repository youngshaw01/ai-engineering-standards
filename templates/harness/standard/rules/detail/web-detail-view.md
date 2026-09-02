# Web 详情查看态 IA 规范

> **Layer 1 项目细则** — 继承全局标准 `ai-engineering-standards/04-Frontend/Detail-View-IA.md`  
> 三级分级：⛔ 绝对禁止 > ⚠️ 强烈建议 > 💡 推荐参考

## 场景分界

| 模式 | 用户目标 | 允许组件 | 禁止 |
|------|----------|----------|------|
| **查看（view）** | 快速读懂、对比、决策 | `DetailSummary` + `DetailSection` + `el-descriptions` | disabled 表单、placeholder、必填 `*` |
| **编辑/新增** | 填表、校验、提交 | `ProForm` / `el-form` | 与查看态混用同一套 disabled 表单 |

⛔ **查看态禁止复用 `ProForm` + `isView`** — 不得用禁用输入框展示只读信息。

⚠️ Drawer 宽度：查看态 **480–560px**；编辑态按字段复杂度 **50%–60%**。

## 信息 IA 四层（L0–L4）

| 层级 | 名称 | 展示位置 |
|------|------|----------|
| **L0** | 上下文摘要 | `DetailSummary` |
| **L1** | 主体标识 | 第 1 组 `DetailSection` |
| **L2** | 业务配置 | 第 2 组，2–3 列 |
| **L3** | 运行态 | 独立分组 + hint |
| **L4** | 审计元数据 | 最后一组 |

**原则**：配置（L2）与运行态（L3）必须视觉分区。

## 布局与字段格式

详见全局标准 [Detail-View-IA.md](../../../../../04-Frontend/Detail-View-IA.md) 的 R03、R04。

## 组件约定（Vue 3）

```
src/components/business/
├── DetailSection/
└── DetailSummary/

src/composables/useDetailDictLabels.ts
src/utils/detailDisplay.ts
```

## i18n

分组标题：`detailView.section.*`；字段 label：复用 `table.*`。

## 自检清单

- [ ] 查看态零输入框
- [ ] L2 / L3 已分区
- [ ] 必填 `*` 仅编辑态
- [ ] 空值 `-`，金额/枚举已格式化
- [ ] Drawer 宽度匹配字段数

## 项目示例

> 替换为本项目首个试点路径，例如：  
> `web/acquire-manage/src/views/.../XxxDetail.vue`
