# 组件 · 表单（form）

## `MfwFormCard` — 配置化表单

基于 template 配置驱动的表单组件，支持**点分路径 key**（自动映射嵌套 formData）、分组（折叠/标签页）、动态显隐/禁用、事件监听。

### 基本用法

```vue
<template>
  <MfwFormCard
    ref="formRef"
    :form-data="form"
    :template="template"
    mode="add"
    @change="onFormChange"
  />
  <el-button @click="submit">提交</el-button>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { MfwFormCard, type FormItemConfig } from 'moyan-mfw-base/frontend';

const form = ref({});
const formRef = ref();

const template: FormItemConfig[] = [
  { key: 'companyName', label: '公司名称', component: 'el-input', rules: [{ required: true, message: '请输入' }] },
  { key: 'contactPhone', label: '联系电话', component: 'el-input', elProps: { maxlength: 11 } },
  {
    key: 'status',
    label: '状态',
    component: 'el-select',
    elProps: { options: [{ label: '启用', value: 1 }, { label: '禁用', value: 0 }] },
  },
  {
    key: 'a.b.c',           // 点分路径：自动读写 form.a.b.c
    label: '嵌套字段',
    component: 'el-input',
  },
];

async function submit() {
  const valid = await formRef.value.validate();
  if (valid) {
    // 提交 form.value
  }
}
</script>
```

### `FormItemConfig` 常用字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `key` | `string` | 字段名，支持点分路径（`'a.b.c'` 自动映射嵌套结构） |
| `label` | `string` | 标签 |
| `component` | `string / Component` | 组件：内置 `el-input` `el-select` `el-date-picker` 等或任意组件 |
| `elProps` | `Record` | 组件属性（如 `options`、`maxlength`） |
| `itemProps` | `Record` | el-form-item 属性 |
| `rules` | `FormRules` | 校验规则 |
| `value` | `any` | 默认值 |
| `placeholder` | `string` | 占位符 |
| `show` | `boolean / (formData) => boolean` | 动态显隐 |
| `disabled` | `boolean / (formData) => boolean` | 动态禁用 |
| `span` | `number` | 栅格跨度 |
| `change` | `({ value, key, formData }) => void` | 值变化回调 |
| `afterText` / `helper` | `string` | 后置文本 / 帮助文本 |
| `on` | `Record<string, fn>` | 事件监听（focus/blur 等） |
| `testId` | `string` | 测试标识 |

### 分组表单 `formGroup`

```typescript
const formGroup: FormGroupConfig = {
  type: 'el-collapse',   // 'el-collapse' | 'el-tabs'
  groups: [
    { key: 'base', title: '基本信息', template: [/* FormItemConfig[] */] },
    { key: 'ext', title: '扩展信息', template: [/* ... */] },
  ],
};
```

### Props / Emits / 实例

| 类型 | 内容 |
|------|------|
| Props | `formData` / `template` / `formGroup` / `mode`（add/edit/view）/ `disabled` / `rules` / `formProps` / `pChange` |
| Emits | `change`（`{ value, key, formData }`）/ `loads` / `loadRefs` |
| 实例 | `validate(): Promise<boolean>` / `resetForm()` / `curdForm` |

## 使用规范

1. 复杂表单优先用 `MfwFormCard` 配置化实现，避免手写大量重复 el-form 模板。
2. 嵌套数据结构用点分 key，无需手动展开/合并。
3. 动态显隐用 `show` 函数（入参为当前 formData）。
4. 表单校验统一走 `validate()`，不要在提交函数里手写判断。