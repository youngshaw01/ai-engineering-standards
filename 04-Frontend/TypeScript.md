# TypeScript Engineering Standards

## Overview

本文档定义了项目中 TypeScript 开发的工程规范，涵盖类型系统使用、接口与类型、泛型、工具类型等核心实践。

---

## Rules

### R01 — 严格模式与 no any

项目必须启用 TypeScript 严格模式，禁止使用 `any` 类型。

- **MUST** 在 `tsconfig.json` 中设置 `"strict": true`
- **MUST** 禁止显式或隐式使用 `any`（包括 `noImplicitAny`）
- **SHOULD** 确实无法推断类型时使用 `unknown` 替代 `any`，并在使用时进行类型收窄

✅ 示例：
```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}

// 代码中使用 unknown
function processValue(value: unknown) {
  if (typeof value === 'string') {
    return value.toUpperCase();
  }
  throw new Error('Unsupported type');
}
```

❌ 反例：
```typescript
function processValue(value: any) {
  return value.toUpperCase(); // 运行时可能出错
}
```

---

### R02 — interface vs type 选择

根据场景合理选择 `interface` 和 `type` 关键字定义类型。

- **MUST** 对象形状（Object Shape）优先使用 `interface`，支持扩展和合并
- **SHOULD** 联合类型、交叉类型、映射类型等使用 `type`
- **MAY** 需要声明合并（Declaration Merging）的场景必须使用 `interface`

✅ 示例：
```typescript
// 对象形状 → interface
interface User {
  id: string;
  name: string;
  email: string;
}

// 联合类型 → type
type Status = 'active' | 'inactive' | 'pending';

// 交叉类型 → type
type UserWithTimestamp = User & { createdAt: Date };
```

❌ 反例：
```typescript
// 不需要扩展的简单对象也用 type
type User = {
  id: string;
  name: string;
};
```

---

### R03 — 泛型使用

泛型用于编写可复用的类型安全代码，但不得过度抽象。

- **MUST** 泛型函数/组件必须有明确的约束（Constraint），避免裸泛型
- **SHOULD** 泛型参数命名遵循约定：`T`（Type）、`U`（Union）、`K`（Key）、`V`（Value）
- **MAY** 复杂泛型场景使用 `extends` 约束和条件类型

✅ 示例：
```typescript
// 有约束的泛型
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

// 泛型组件
interface GenericListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}

function GenericList<T>({ items, renderItem }: GenericListProps<T>) {
  return <div>{items.map(renderItem)}</div>;
}
```

❌ 反例：
```typescript
// 无约束的泛型，失去类型安全
function identity<T>(arg: T): T {
  return arg;
}
```

---

### R04 — Utility Types 使用

充分利用 TypeScript 内置工具类型，减少重复定义。

- **MUST** 优先使用内置工具类型（`Partial`、`Pick`、`Omit`、`Record` 等）而非自定义
- **SHOULD** 项目级通用类型提取到 `types/utils.ts` 统一管理
- **MAY** 使用模板字面量类型处理字符串模式匹配

✅ 示例：
```typescript
import { Partial, Pick, Omit, Record } from 'type-fest';

// 使用内置工具类型
type UserUpdate = Partial<User>;
type UserPreview = Pick<User, 'id' | 'name' | 'avatar'>;
type UserInput = Omit<User, 'id' | 'createdAt'>;

// 项目级工具类型
type ApiResponse<T> = {
  data: T;
  error?: string;
  status: number;
};
```

❌ 反例：
```typescript
// 手动实现已有工具类型的功能
type MyPartial<T> = {
  [K in keyof T]?: T[K];
};
```

---

### R05 — 声明文件管理

第三方库的类型声明必须正确管理，避免全局污染。

- **MUST** 使用 `@types/xxx` 包获取第三方库的类型声明
- **SHOULD** 项目内自定义类型通过 `declare module` 扩展，不创建全局 `.d.ts` 文件
- **MAY** 为无类型的私有模块创建局部声明文件

✅ 示例：
```typescript
// types/image.d.ts — 局部声明
declare module '*.png' {
  const src: string;
  export default src;
}

// 扩展第三方模块
declare module 'axios' {
  interface AxiosInstance {
    get<T = any>(url: string): Promise<T>;
  }
}
```

❌ 反例：
```typescript
// 全局声明文件，污染全局命名空间
global.d.ts:
interface Window {
  myCustomAPI: any;
}
```

---

### R06 — Enum 替代方案

避免使用 TypeScript `enum`，采用更灵活的类型安全替代方案。

- **MUST** 禁止使用 `enum` 关键字（编译产物体积大、运行时开销高）
- **SHOULD** 使用 `const` 对象 + `as const` 断言替代 enum
- **MAY** 需要反向映射时使用字符串字面量联合类型

✅ 示例：
```typescript
// const 对象替代 enum
const OrderStatus = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

type OrderStatus = typeof OrderStatus[keyof typeof OrderStatus];

// 使用
function updateStatus(status: OrderStatus) { }
updateStatus(OrderStatus.PENDING);
```

❌ 反例：
```typescript
enum OrderStatus {
  Pending,
  Completed,
  Cancelled,
}
```

---

### R07 — 类型收窄

所有类型收窄操作必须穷尽所有分支，避免运行时错误。

- **MUST** 使用 `never` 类型在 switch/if 中兜底未处理分支
- **SHOULD** 窄化后立即赋值，不在窄化范围外访问属性
- **MAY** 使用用户自定义类型守卫（Type Guard）函数

✅ 示例：
```typescript
type Dog = { bark(): void };
type Cat = { meow(): void };
type Pet = Dog | Cat;

function handlePet(pet: Pet) {
  if ('bark' in pet) {
    pet.bark();
  } else if ('meow' in pet) {
    pet.meow();
  } else {
    const exhaustiveCheck: never = pet;
    throw new Error(`Unhandled pet type: ${exhaustiveCheck}`);
  }
}
```

❌ 反例：
```typescript
function handlePet(pet: Pet) {
  if ('bark' in pet) {
    pet.bark();
  }
  // 缺少 else 分支，TypeScript 不会报错但不安全
}
```

---

### R08 — tsconfig 配置规范

项目必须维护统一的 `tsconfig.json` 配置，确保团队一致。

- **MUST** 使用 `tsconfig.json` 作为根配置，`tsconfig.base.json` 作为共享基础配置
- **SHOULD** 禁用 `allowJs`（除非明确需要 JS/TS 混编），启用 `declaration` 生成类型声明
- **MAY** 使用 `paths` 和 `baseUrl` 配置路径别名，简化导入

✅ 示例：
```json
// tsconfig.base.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "exclude": ["node_modules", "dist"]
}

// tsconfig.json
{
  "extends": "./tsconfig.base.json",
  "include": ["src"],
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

❌ 反例：
```json
{
  "compilerOptions": {
    "strict": false,
    "allowJs": true,
    "noImplicitAny": false
  }
}
```

---

## Checklist

- [ ] `tsconfig.json` 已启用 `strict: true`
- [ ] 代码中未使用 `any`，必要时使用 `unknown`
- [ ] 对象形状使用 `interface`，联合/交叉类型使用 `type`
- [ ] 泛型函数有明确约束
- [ ] 优先使用内置工具类型，项目级类型统一管理
- [ ] 未使用 `enum`，改用 `const` 对象 + `as const`
- [ ] 类型收窄使用 `never` 兜底未处理分支
- [ ] `tsconfig` 配置继承自基础配置，路径别名统一
