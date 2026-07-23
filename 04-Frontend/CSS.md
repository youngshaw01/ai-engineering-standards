# CSS Engineering Standards

## Overview

本文档定义了项目中 CSS 编写的工程规范，涵盖命名方法论、架构组织、响应式设计、性能优化等核心实践。

---

## Rules

### R01 — BEM 命名方法论

CSS 类名必须遵循 **BEM（Block-Element-Modifier）** 命名规范，确保样式作用域清晰、避免冲突。

- **MUST** 使用 `block__element--modifier` 格式命名
- **SHOULD** 保持 block 名称与组件/模块一一对应
- **MAY** 在 modifier 中使用布尔值或状态描述（如 `is-active`、`has-error`）

✅ 示例：
```css
.card { }
.card__title { }
.card__image { }
.card--featured { }
.card__title--large { }
```

❌ 反例：
```css
.red { }
.mt-20 { }
.button_primary { }
```

---

### R02 — CSS 架构分层

项目必须采用 **ITCSS（Inverted Triangle CSS）** 或 **SMACSS** 架构组织样式文件，按优先级从低到高排列。

- **MUST** 按以下顺序组织样式：Settings → Tools → Generic → Elements → Objects → Components → Utilities
- **SHOULD** 每个层级独立为一个文件或目录
- **MAY** 使用 PostCSS / Sass 的 `@import` 统一入口引入

✅ 示例目录结构：
```
styles/
├── settings/    /* 变量、断点、色彩 */
├── tools/       /* Mixins、函数 */
├── generic/     /* reset、基础排版 */
├── elements/    /* 原生元素样式 */
├── objects/     /* 布局容器 */
├── components/  /* UI 组件 */
└── utilities/   /* 工具类 */
```

❌ 反例：将所有样式写在一个无组织的单一文件中。

---

### R03 — CSS-in-JS 与 CSS Modules 选择

根据项目规模和团队偏好选择合适的样式方案，但必须保持一致。

- **MUST** 在同一项目中只使用一种主要样式方案（CSS Modules 或 CSS-in-JS），不得混用导致混乱
- **SHOULD** 新项目优先使用 CSS Modules（框架无关、零运行时开销）
- **MAY** 复杂交互场景使用 CSS-in-JS（如 styled-components、emotion）实现动态主题

✅ 示例（CSS Modules）：
```css
/* Button.module.css */
.button {
  padding: 8px 16px;
  border-radius: 4px;
}
```

```tsx
import styles from './Button.module.css';
<button className={styles.button}>Submit</button>
```

❌ 反例：同一组件同时使用全局 CSS 和 CSS Modules。

---

### R04 — 响应式设计策略

所有面向用户的界面必须支持响应式布局。

- **MUST** 使用 `min-width` 媒体查询（Mobile First 策略）
- **SHOULD** 定义统一的断点常量，禁止硬编码媒体查询数值
- **MAY** 使用 CSS Container Queries 替代部分媒体查询（当组件需独立于视口响应时）

✅ 示例：
```css
/* settings/_breakpoints.scss */
$breakpoint-sm: 576px;
$breakpoint-md: 768px;
$breakpoint-lg: 992px;

/* 组件样式 */
.container {
  width: 100%;
  @media (min-width: $breakpoint-md) {
    max-width: 720px;
  }
  @media (min-width: $breakpoint-lg) {
    max-width: 960px;
  }
}
```

❌ 反例：
```css
.container { max-width: 960px; }
@media (min-width: 768px) { .container { max-width: 1200px; } }
```

---

### R05 — Design Tokens 管理

所有设计相关值（颜色、间距、字号、圆角）必须通过 Design Token 管理。

- **MUST** 将颜色、间距、字号、阴影等定义为 CSS Custom Property 或 SCSS 变量
- **SHOULD** 使用语义化命名而非原始值命名（如 `--color-text-primary` 而非 `--color-blue-500`）
- **MAY** 支持多主题切换时，通过切换根节点属性实现

✅ 示例：
```css
:root {
  --color-bg-primary: #ffffff;
  --color-text-primary: #1a1a1a;
  --spacing-unit: 8px;
  --radius-default: 4px;
}

[data-theme="dark"] {
  --color-bg-primary: #1a1a1a;
  --color-text-primary: #f0f0f0;
}
```

❌ 反例：
```css
.header { background: #007bff; color: white; }
```

---

### R06 — CSS 性能优化

项目必须实施关键 CSS 提取和未使用样式清理策略。

- **MUST** 对首屏关键路径提取 Inline Critical CSS，其余样式异步加载
- **SHOULD** 使用 PurgeCSS / UnusedCSS 移除未使用的样式规则
- **MAY** 对大型动画库按需导入，避免全量加载

✅ 构建配置示例：
```js
// vite.config.js
export default defineConfig({
  build: {
    cssCodeSplit: true,
    minify: 'esbuild',
  },
});
```

❌ 反例：全量引入 Ant Design / Tailwind 而未做 Tree Shaking。

---

### R07 — CSS Custom Properties 使用

合理利用 CSS Custom Properties（CSS Variables）实现可维护的样式系统。

- **MUST** 所有 Design Token 以 `--` 前缀自定义属性形式定义在 `:root`
- **SHOULD** 组件级变量在组件根节点定义，避免全局污染
- **MAY** 使用 `var()` 配合 fallback 值增强健壮性

✅ 示例：
```css
:root {
  --transition-base: 200ms ease;
}

.button {
  transition: all var(--transition-base);
}

.button--fast {
  --transition-base: 100ms ease;
}
```

❌ 反例：
```css
.button { transition: all 200ms ease; }
.button-fast { transition: all 100ms ease; }
```

---

### R08 — Tailwind / CSS Utility Framework 使用

在使用 Tailwind 或其他 utility-first CSS 框架时，必须遵守以下约束。

- **MUST** 禁止在生产代码中自定义 Tailwind 预设外的工具类（避免破坏原子化原则）
- **SHOULD** 复杂组件的核心样式仍使用传统 CSS 文件，utility class 仅用于布局和微调
- **MAY** 通过 `@layer` 指令控制 utility 与自定义样式的优先级

✅ 示例：
```html
<!-- 使用预定义的 utility class -->
<div class="flex items-center gap-4 p-4 rounded-lg">
  <span class="text-gray-700 font-medium">Status</span>
</div>
```

❌ 反例：
```html
<!-- 自定义 utility 破坏原子化原则 -->
<div class="my-custom-flex-gap">...</div>
```

---

## Checklist

- [ ] 所有 CSS 类名遵循 BEM 命名规范
- [ ] 样式文件按 ITCSS/SMACSS 架构分层组织
- [ ] 项目统一使用一种样式方案（CSS Modules 或 CSS-in-JS）
- [ ] 响应式布局采用 Mobile First + 统一断点
- [ ] 颜色、间距、字号等通过 Design Token 管理
- [ ] 首屏关键 CSS 已内联，未使用样式已清理
- [ ] CSS Custom Properties 用于主题化和组件级变量
- [ ] Tailwind 等 framework 使用时未自定义非预设工具类
