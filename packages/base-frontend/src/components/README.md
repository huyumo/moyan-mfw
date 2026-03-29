# 通用组件库

> 版本：1.0.0 | 最后更新：2026-03-29

存放业务通用的 UI 组件，这些组件可以在多个业务场景中复用。

## 目录结构

```
components/
├── README.md                    # 本规范文档
├── index.ts                     # 统一导出
├── form/                        # 表单类组件
│   ├── mfw-form-card/           # 动态表单卡片
│   │   ├── Index.vue            # 主组件（PascalCase）
│   │   ├── types.ts             # 类型定义
│   │   └── use-draft-dox.ts     # 草稿箱 composable
│   └── index.ts
├── table/                       # 表格类组件
│   ├── mfw-table-list/          # 动态表格列表
│   └── index.ts
├── page/                        # 页面类组件
│   ├── mfw-page-scene/          # 标准列表页面
│   └── index.ts
├── popup/                       # 弹窗类组件
│   ├── mfw-popup/               # 命令式弹窗
│   └── index.ts
├── upload/                      # 上传类组件
│   ├── mfw-upload/              # 上传组件
│   └── index.ts
├── display/                     # 展示类组件
│   ├── mfw-format/              # 格式化组件
│   │   ├── index.ts             # 插件注册
│   │   ├── date-format.tsx      # 日期格式化
│   │   ├── image-format.tsx     # 图片格式化
│   │   ├── dict-format.tsx      # 字典格式化
│   │   ├── tag-format.tsx       # 标签格式化
│   │   ├── base.ts              # 基础类型
│   │   └── types.ts             # 类型定义
│   └── index.ts
└── business/                    # 业务类组件
    ├── mfw-icon-picker/         # 图标选择器
    ├── mfw-user-picker/         # 用户选择器
    └── index.ts
```

## 命名规范

| 项目 | 规范 | 示例 | 等级 |
|------|------|------|------|
| 组件目录 | `camel-case`（小写 + 连字符） | `mfw-form-card/` | 🔴 强制 |
| 主组件文件 | `PascalCase` | `Index.vue` | 🔴 强制 |
| 子组件文件 | `kebab-case` | `column-control.vue` | 🟢 推荐 |
| 组件名（defineOptions） | `PascalCase` + `Mfw` 前缀 | `MfwFormCard` | 🔴 强制 |
| composable 文件 | `camel-case` + `use` | `use-draft-dox.ts` | 🔴 强制 |
| 类型定义文件 | `types.ts` 或 `xxx-types.ts` | `types.ts` | 🟢 推荐 |

## 组件开发模板

### 标准组件结构

```vue
<template>
  <div class="mfw-component-name">
    <!-- 模板内容 -->
  </div>
</template>

<script setup lang="ts">
// ========== 1. 组件配置 ==========
defineOptions({ name: 'MfwComponentName' });

// ========== 2. Props（带类型）==========
const props = withDefaults(defineProps<ComponentNameProps>(), {
  disabled: false
});

// ========== 3. Emits（带类型）==========
const emit = defineEmits<ComponentNameEmits>();

// ========== 4. 导入的 Hooks ==========
// const { xxx } = useXxx();

// ========== 5. 响应式数据 ==========
const loading = ref(false);

// ========== 6. 计算属性 ==========
const data = computed(() => props.xxx);

// ========== 7. 方法（按功能分组）==========
const handleClick = () => {
  // ...
};

// ========== 8. 生命周期 ==========
onMounted(() => {
  // ...
});

// ========== 9. 暴露实例 ==========
defineExpose<ComponentNameInstance>({
  // 公开方法
});
</script>

<style scoped lang="scss">
.mfw-component-name {
  // 使用 CSS 变量
  --mfw-component-bg: var(--el-bg-color);
}
</style>
```

### 类型定义模板

```typescript
// types.ts
/** Props 接口 */
export interface ComponentNameProps {
  /** 属性说明 */
  value?: string;
  /** 是否禁用 */
  disabled?: boolean;
}

/** Emits 接口 */
export interface ComponentNameEmits {
  (e: 'update:modelValue', value: string): void;
  (e: 'change', value: string): void;
}

/** 暴露实例接口 */
export interface ComponentNameInstance {
  /** 方法说明 */
  doSomething: () => void;
}
```

## 开发流程

```
1. 创建组件目录
   ↓
2. 编写 types.ts（类型定义）
   ↓
3. 编写 Index.vue（主组件）
   ↓
4. 编写 use-xxx.ts（组合式函数，可选）
   ↓
5. 编写单元测试
   ↓
6. 更新 index.ts（导出）
   ↓
7. 编写文档（API 文档）
```

## 验收清单

### 代码质量

- [ ] 文件行数 ≤ 500 行
- [ ] 函数行数 ≤ 50 行
- [ ] 嵌套层级 ≤ 4 层
- [ ] TypeScript 覆盖率 ≥ 95%
- [ ] ESLint 无 Error/Warning

### 功能完整性

- [ ] Props 类型完整
- [ ] Emits 类型完整
- [ ] 暴露实例完整
- [ ] 错误处理完整
- [ ] 边界情况处理

### 文档完整性

- [ ] API 文档（Props/Emits/Slots/Exposed）
- [ ] 使用示例（基础 + 高级）
- [ ] 类型导出

## 与布局组件的区别

- `src/components/` - 通用业务组件（`Mfw` 前缀），可复用的 UI 组件
- `src/layouts/components/` - 框架布局组件（`Base`/`Layout`/`Menu` 前缀），布局相关的内部组件
