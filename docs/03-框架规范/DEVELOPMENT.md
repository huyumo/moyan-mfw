# 墨焱管理后台 - 开发规范文档

> 版本：1.1.0
> 创建时间：2026-03-28
> 更新时间：2026-03-29

---

## 一、项目结构

```
moyan-mfw/
├── frontend/                    # 业务前端应用
│   └── src/
│       ├── business/            # 业务代码
│       │   ├── components/      # 业务组件
│       │   ├── views/           # 页面视图
│       │   ├── api/             # API 接口
│       │   └── routes.ts        # 路由配置
│       └── main.ts
├── packages/
│   └── base-frontend/          # 基础前端框架
│       └── src/
│           ├── components/     # 基础组件库
│           │   ├── display/    # 展示类组件
│           │   ├── popup/      # 弹窗类组件
│           │   ├── upload/     # 上传类组件
│           │   ├── form-card/  # 表单类组件
│           │   ├── table-list/ # 表格类组件
│           │   ├── picker/     # 选择器类组件
│           │   └── page/       # 页面类组件
│           ├── layouts/        # 布局组件
│           ├── router/         # 路由配置
│           ├── store/          # 状态管理
│           ├── config/         # 配置文件
│           └── types/          # 类型定义
├── docs/                       # 项目文档
└── references/                 # 参考代码（遗留代码）
```

---

## 二、组件开发规范

### 2.1 组件命名规范

- **所有通用组件必须使用 `Mfw` 前缀**（Moyan Framework 的缩写）
- 组件名使用 `PascalCase`

```typescript
// ✅ 正确
export default defineComponent({ name: 'MfwFormCard' });
export default defineComponent({ name: 'MfwTableList' });

// ❌ 错误
export default defineComponent({ name: 'FormCard' });
export default defineComponent({ name: 'form-card' });
```

### 2.2 组件目录结构

每个组件模块遵循以下结构：

```
component-name/
├── index.tsx      # 组件主文件（使用 TSX）
├── types.ts       # 类型定义
├── mod.ts         # 模块导出
└── style.scss     # 样式文件（可选）
```

### 2.3 组件技术栈

- **使用 TSX + `defineComponent`**（非 `<script setup>`）
- **类型驱动开发**：先定义类型，再实现功能

```tsx
// index.tsx 示例
import { defineComponent, type PropType } from 'vue';
import type { ComponentProps, ComponentInstance } from './types';

export default defineComponent({
  name: 'MfwComponentName',

  props: {
    prop1: {
      type: String as PropType<ComponentProps['prop1']>,
      default: ''
    }
  },

  emits: ['change', 'confirm'],

  setup(props, { emit, expose }) {
    // 组件逻辑

    // 暴露实例
    expose<ComponentInstance>({
      method1,
      method2
    });

    // 渲染函数
    return () => h('div', {}, 'content');
  }
});
```

### 2.4 类型定义规范

```typescript
// types.ts
/** 组件 Props */
export interface ComponentProps {
  /** 配置项 1 */
  prop1?: string;
  /** 配置项 2 */
  prop2?: number;
}

/** 组件事件 */
export interface ComponentEmits {
  (e: 'change', value: string): void;
  (e: 'confirm', data: any): void;
}

/** 组件实例 */
export interface ComponentInstance {
  /** 方法 1 */
  method1: () => void;
  /** 方法 2 */
  method2: (param: string) => Promise<void>;
}
```

### 2.5 模块导出规范

```typescript
// mod.ts
/**
 * @fileoverview 组件模块导出
 */

export { default as MfwComponentName } from './index';
export type * from './types';
```

```typescript
// components/index.ts
// 展示类组件
export * from './display/mod';

// 弹窗类组件
export * from './popup/mod';

// 表单类组件
export * from './form-card/mod';

// 表格类组件
export * from './table-list/mod';
```

---

## 三、代码规范

### 3.1 文件头注释

所有文件必须包含文件头注释：

```typescript
/**
 * @fileoverview 文件简要描述
 * @description 详细描述（可选）
 */
```

### 3.2 组件注释

```tsx
/**
 * @fileoverview 组件名称和功能描述
 * @description 详细描述组件的用途
 *
 * @example
 * ```vue
 * <mfw-component
 *   :prop1="value1"
 *   @change="handleChange"
 * />
 * ```
 */
```

### 3.3 JSDoc 注释

```typescript
/**
 * 函数/方法描述
 * @param param1 参数 1 说明
 * @param param2 参数 2 说明
 * @returns 返回值说明
 * @throws 异常说明
 */
const functionName = (param1: string, param2: number): void => {};
```

---

## 四、命名规范

### 4.1 文件/目录命名

| 类型 | 规则 | 示例 |
|------|------|------|
| 组件目录 | kebab-case | `components/form-card/` |
| 组件文件 | PascalCase | `MfwFormCard.tsx` |
| 类型文件 | kebab-case | `types.ts` |
| 工具文件 | camelCase | `utils.ts` |

### 4.2 代码命名

```typescript
// 变量
const userName = 'test';      // camelCase
const MAX_COUNT = 100;        // UPPER_SNAKE_CASE 常量

// 组件
defineOptions({ name: 'MfwComponent' });  // PascalCase + Mfw 前缀

// 函数
const handleSubmit = () => {};  // 普通方法
const onConfirm = (data) => {}; // 事件处理 onXxx
const handleChange = (v) => {}; // 变化处理 handleXxx
```

### 4.3 事件命名

```vue
<template>
  <!-- 组件事件用 onXxx -->
  <MfwComponent @confirm="onConfirm" @close="onClose" />

  <!-- 原生事件用 handleXxx -->
  <button @click="handleClick">按钮</button>
</template>
```

---

## 五、Git 提交规范

### 5.1 Commit 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 5.2 Type 类型

| 类型 | 说明 |
|------|------|
| feat | 新功能 |
| fix | Bug 修复 |
| docs | 文档更新 |
| style | 代码格式 |
| refactor | 重构 |
| perf | 性能优化 |
| test | 测试 |
| chore | 构建/配置 |
| ci | CI 配置 |
| revert | 回滚 |

### 5.3 示例

```
feat(components): 新增 MfwTableList 表格组件

- 实现基础表格展示
- 支持分页和排序
- 支持行操作按钮

Refs: #123
```

---

## 六、最佳实践

### 6.1 异步处理

```typescript
const fetchData = async () => {
  loading.value = true;
  try {
    const res = await api.getData();
    data.value = res;
  } catch (error) {
    ElMessage.error('加载失败');
  } finally {
    loading.value = false;
  }
};
```

### 6.2 样式规范

```scss
// 使用 BEM 和 CSS 变量
.mfw-component {
  &__element {
    color: var(--el-text-color-primary);
  }

  &--active {
    background-color: var(--el-color-primary);
  }
}
```

### 6.3 配置驱动开发

```typescript
// 使用配置驱动的表单组件
const formTemplate: FormItemConfig[] = [
  {
    key: 'name',
    label: '用户名',
    type: 'input',
    required: true,
    span: 12
  },
  {
    key: 'status',
    label: '状态',
    type: 'select',
    elProps: {
      options: [
        { label: '启用', value: 'active' },
        { label: '禁用', value: 'inactive' }
      ]
    }
  }
];
```

---

## 七、技术栈

| 项目 | 版本 |
|------|------|
| Vue | 3.4+ |
| TypeScript | 5.3+ |
| Element Plus | 2.5+ |
| Vite | 5.0+ |
| Pinia | 2.1+ |
| Vue Router | 4.2+ |
| pnpm | 10.14+ |

---

## 八、开发命令

```bash
# 安装依赖
pnpm install

# 启动前端开发服务器
pnpm run dev:frontend

# 构建
pnpm run build

# 类型检查
pnpm run typecheck

# 代码格式化
pnpm run lint:fix
```
