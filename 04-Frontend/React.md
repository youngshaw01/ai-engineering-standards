# React Engineering Standards

## Overview

本文档定义了项目中 React 开发的工程规范，涵盖组件设计、Hooks 使用、状态管理、性能优化等核心实践。

---

## Rules

### R01 — 函数式组件与组合优先

所有 React 组件必须使用函数式组件（Function Component）配合 Hooks，禁止使用 Class Component。

- **MUST** 所有组件定义为函数式组件，使用 `const Xxx = () => <div />` 形式
- **SHOULD** 通过 Composition（组合）而非 Inheritance（继承）实现逻辑复用
- **MAY** 使用 Children Render Props 或插槽模式替代条件渲染

✅ 示例：
```tsx
function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content">{children}</div>
    </div>
  );
}

// 组合使用
<Modal onClose={handleClose}>
  <Form />
</Modal>
```

❌ 反例：
```tsx
class MyComponent extends React.Component {
  render() { return <div />; }
}
```

---

### R02 — Hooks 使用规范

Hooks 的调用必须遵循规则，确保依赖数组正确、自定义 Hook 命名规范。

- **MUST** 所有 `useEffect`、`useMemo`、`useCallback` 的依赖数组必须完整且准确
- **SHOULD** 自定义 Hook 以 `use` 开头命名（如 `useUser`、`useDebounce`）
- **MAY** 使用 ESLint `react-hooks/exhaustive-deps` 规则自动检查依赖完整性

✅ 示例：
```tsx
function useUser(userId: string) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]); // 依赖数组完整

  return user;
}
```

❌ 反例：
```tsx
useEffect(() => {
  fetchUser(userId).then(setUser);
}, []); // 缺少 userId 依赖
```

---

### R03 — 状态管理策略

根据状态的范围和复杂度选择合适的状态管理方案。

- **MUST** 局部 UI 状态（如表单输入、弹窗开关）使用 `useState` 或 `useReducer`
- **SHOULD** 全局共享状态优先使用 Zustand；复杂单向数据流场景使用 Redux Toolkit
- **MAY** 服务端状态使用 TanStack Query / SWR 管理，不放入全局 Store

✅ 示例：
```tsx
// 局部状态
const [isOpen, setIsOpen] = useState(false);

// 全局状态（Zustand）
const useStore = create<Store>((set) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 })),
}));

// 服务端状态（TanStack Query）
const { data, isLoading } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId),
});
```

❌ 反例：将所有状态（包括表单输入值）都放入 Redux Store。

---

### R04 — 性能优化

合理使用 React.memo、懒加载和 Suspense 优化应用性能。

- **MUST** 路由级代码分割使用 `React.lazy` + `Suspense`
- **SHOULD** 仅在重渲染开销显著时使用 `React.memo` 包裹组件
- **MAY** 使用 `useDeferredValue` 或 `useTransition` 处理非紧急状态更新

✅ 示例：
```tsx
const LazyPage = lazy(() => import('./Page'));

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <LazyPage />
    </Suspense>
  );
}
```

❌ 反例：对每个小组件都包裹 `React.memo`，增加不必要的比较开销。

---

### R05 — Error Boundary

组件树必须包含 Error Boundary，防止单个组件错误导致整页崩溃。

- **MUST** 在路由层级至少设置一个 Error Boundary 组件
- **SHOULD** Error Boundary 提供用户友好的错误提示和重试机制
- **MAY** 上报错误日志到监控系统（如 Sentry）

✅ 示例：
```tsx
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [error, setError] = useState<Error | null>(null);

  if (error) {
    return (
      <div>
        <p>页面出错了，请刷新重试</p>
        <button onClick={() => window.location.reload()}>刷新</button>
      </div>
    );
  }

  return children;
}
```

❌ 反例：未设置任何 Error Boundary，白屏后无任何提示。

---

### R06 — 测试策略

React 组件测试必须覆盖关键路径，Mock 策略需符合实际场景。

- **MUST** 使用 React Testing Library（RTL）进行组件功能测试
- **SHOULD** API 请求使用 MSW（Mock Service Worker）拦截，模拟真实网络行为
- **MAY** 对纯工具函数补充单元测试

✅ 示例：
```tsx
import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  http.get('/api/user', () => {
    return new HttpResponse(JSON.stringify({ name: 'Alice' }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('renders user name', async () => {
  render(<UserProfile />);
  expect(await screen.findByText('Alice')).toBeInTheDocument();
});
```

❌ 反例：直接测试组件内部 state 或 mock DOM 方法。

---

### R07 — 无障碍性（Accessibility）

所有交互组件必须满足 WCAG 2.1 AA 标准的无障碍要求。

- **MUST** 可交互元素添加正确的 ARIA 属性和键盘支持
- **SHOULD** 使用语义化 HTML 标签（如 `<button>` 而非 `<div onClick>`）
- **MAY** 集成 axe-core 自动化无障碍检测到 CI 流程

✅ 示例：
```tsx
<button aria-label="关闭弹窗" onClick={handleClose}>✕</button>

<nav aria-label="主导航">
  <ul role="list">
    <li><a href="/home" tabIndex={0}>首页</a></li>
  </ul>
</nav>
```

❌ 反例：
```tsx
<div onClick={handleSubmit}>提交</div>
```

---

### R08 — Server Components

在使用 React Server Components（RSC）架构时，必须明确区分 Server Component 与 Client Component。

- **MUST** Server Component 文件以 `.server.tsx` 后缀命名，不得使用 `useState`、`useEffect` 等客户端 Hooks
- **SHOULD** 默认使用 Server Component，仅在需要交互或浏览器 API 时降级为 Client Component
- **MAY** 使用 `"use client"` 指令显式声明 Client Component

✅ 示例：
```tsx
// .server.tsx — Server Component
async function UserList() {
  const users = await db.users.findMany();
  return (
    <ul>
      {users.map((u) => <li key={u.id}>{u.name}</li>)}
    </ul>
  );
}

// .tsx — Client Component
'use client';
function ToggleButton({ onToggle }: { onToggle: () => void }) {
  const [open, setOpen] = useState(false);
  return <button onClick={() => { setOpen(!open); onToggle(); }}>Toggle</button>;
}
```

❌ 反例：在 Server Component 中直接调用 `useState`。

---

## Checklist

- [ ] 所有组件使用函数式组件，未使用 Class Component
- [ ] Hooks 依赖数组完整准确
- [ ] 状态管理按范围选择合适方案（local → Zustand/Redux → TanStack Query）
- [ ] 路由级代码分割已配置 lazy + Suspense
- [ ] Error Boundary 已设置在路由层级
- [ ] 组件测试使用 RTL + MSW
- [ ] 交互组件满足无障碍标准
- [ ] Server/Client Component 边界清晰
