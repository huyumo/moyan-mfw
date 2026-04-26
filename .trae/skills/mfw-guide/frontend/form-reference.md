---
version: "1.0"
last_updated: "2026-04-26"
scope: frontend
triggers:
  - MfwPopup
  - MfwFormCard
  - FormItemConfig
  - 表单高级用法
  - SFC 结构
dependencies:
  - frontend/new-frontend-page
  - frontend/component-reference
maturity: stable
tags: [前端, MfwPopup, MfwFormCard, FormItemConfig, SFC, 表单]
---

# 表单与弹窗参考

## MfwPopup 调用方式

### dialog 模式（默认）

```typescript
MfwPopup.open({
  title: '新建',
  type: 'dialog',
  component: XxxForm,
  popupProps: { width: 550 },
  on: { confirm: listPage.value?.refresh },
});
```

### 编辑模式 — 通过 data 传递行数据

```typescript
const handleEdit = (row: XxxResponseDto) => {
  MfwPopup.open({
    title: '编辑',
    type: 'dialog',
    component: XxxForm,
    data: { ...row },
    popupProps: { width: 550 },
    on: { confirm: listPage.value?.refresh },
  });
};
```

### drawer 模式（查看详情/编辑大表单）

```typescript
MfwPopup.open({
  title: '详情',
  type: 'drawer',
  position: 'rtl',
  component: XxxDetail,
  data: { ...row },
  popupProps: { size: 500 },
});
```

### 传递自定义数据（非行数据）

```typescript
MfwPopup.open({
  title: '操作',
  type: 'dialog',
  component: XxxForm,
  data: { appId: appId.value, extraParam: 'value' },
  popupProps: { width: 500 },
  on: { confirm: listPage.value?.refresh },
});
```

## MfwFormCard 常用组件映射

| 表单项 | component 值 | 说明 |
|--------|-------------|------|
| 文本输入 | `'el-input'` | 支持 textarea |
| 下拉选择 | `'el-select'` | elProps 中传 options |
| 开关 | `'el-switch'` | elProps 中传 activeValue/inactiveValue |
| 数字输入 | `'el-input-number'` | — |
| 日期选择 | `'el-date-picker'` | — |
| 用户选择 | `MfwUserPicker` | 需 import |
| 图标选择 | `MfwIconPicker` | 需 import |
| 单选组 | `MfwRadioGroup` | 需 import，elProps 中传 options |

## FormItemConfig 条件控制

```typescript
// 条件显示
{ key: 'field', label: '字段', component: 'el-input', show: () => isEdit.value }

// 动态禁用
{ key: 'code', label: '编码', component: 'el-input', disabled: () => isEdit.value }

// 动态 options（异步加载）
const currentTemplate = computed(() =>
  baseTemplate.map(item =>
    item.key === 'appTypeId'
      ? { ...item, elProps: { ...item.elProps, options: appTypeList.value } }
      : item
  )
);
```

## SFC 文件结构标准

```vue
<!--
/**
 * @fileoverview 组件中文描述
 * @description 组件功能详述
 */
-->
<template>
  <div class="mfw-component-name">
    <slot />
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'MfwComponentName' });

const props = withDefaults(defineProps<ComponentNameProps>(), { disabled: false });
const emit = defineEmits<ComponentNameEmits>();

const loading = ref(false);
const listPage = ref<MfwListPageInstance>();

const canEdit = computed(() => !props.disabled);

const handleAdd = () => { ... };
const handleDelete = async (row: XxxResponseDto) => { ... };

onMounted(() => { ... });

defineExpose<ComponentNameInstance>({ refresh: handleRefresh });
</script>

<style scoped lang="scss">
.mfw-component-name {
  --mfw-component-bg: var(--el-bg-color);
}
</style>
```
