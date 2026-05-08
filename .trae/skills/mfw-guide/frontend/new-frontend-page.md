---
version: "1.0"
last_updated: "2026-04-26"
scope: frontend
triggers:
  - 新增前端页面
  - 创建组件
  - 创建表单
  - MfwListPage
  - MfwPopup
dependencies:
  - frontend/component-reference
  - frontend/form-reference
  - shared/coding-conventions
maturity: stable
tags: [前端, 页面, MfwListPage, MfwFormCard, MfwPopup, 表单]
---

# 新增前端页面

## 列表页标准模板（MfwListPage + 表格）

```vue
<template>
  <MfwPageWrapper>
    <template #header-extra>
      <el-button type="primary" @click="handleAdd" v-permission="'添加'">
        <el-icon><Plus /></el-icon>新建
      </el-button>
    </template>

    <MfwListPage
      ref="listPage"
      :search-template="searchTemplate"
      :columns="columns"
      :action-column="actionColumn"
      :load-data="loadData"
    />
  </MfwPageWrapper>
</template>

<script setup lang="ts">
import { ref, h } from 'vue';
import { Plus, Edit, Delete } from '@element-plus/icons-vue';
import { ElTag, ElMessageBox } from 'element-plus';
import { MfwPageWrapper, MfwListPage, MfwDateFormat } from '../../../components';
import type { MfwListPageInstance } from '../../../components/page/list-page/types';
import { MfwPopup } from '../../../components/feedback';
import { renderActionButtons } from '../../../components/table/action-buttons';
import { ApiXxxFindAll, ApiXxxDelete } from '../../../apis/sys';

const STATUS = { ENABLED: 1, DISABLED: 0 } as const;
defineOptions({ name: 'MfwXxxList' });
const listPage = ref<MfwListPageInstance>();

const searchTemplate = [
  { key: 'name', label: '名称', type: 'input' as const, placeholder: '请输入名称' },
  { key: 'status', label: '状态', type: 'select' as const, placeholder: '请选择状态',
    elProps: { options: [
      { label: '启用', value: STATUS.ENABLED },
      { label: '禁用', value: STATUS.DISABLED },
    ]},
  },
];

const columns = [
  { prop: 'name', label: '名称', minWidth: 150 },
  { prop: 'status', label: '状态', width: 80,
    render: ({ row }) => h(ElTag, {
      type: row.status === STATUS.ENABLED ? 'success' : 'danger', size: 'small',
    }, () => row.status === STATUS.ENABLED ? '启用' : '禁用'),
  },
  { prop: 'createdAt', label: '创建时间', width: 180,
    render: ({ row }) => h(MfwDateFormat, { value: row.createdAt }),
  },
];

const actionColumn = {
  prop: 'action', label: '操作', width: 200, fixed: 'right' as const,
  render: ({ row }) => renderActionButtons([
    { label: '编辑', type: 'primary', icon: Edit, onClick: handleEdit, permission: ['编辑'] },
    { label: '删除', type: 'danger', icon: Delete, onClick: handleDelete, permission: ['删除'] },
  ], { maxVisible: 2 }, row),
};

const loadData = async (params: Record<string, unknown>) => {
  return await new ApiXxxFindAll({ query: { ...params } as QueryXxxDto });
};

const handleAdd = () => {
  MfwPopup.open({
    title: '新建', type: 'dialog', component: XxxForm,
    popupProps: { width: 550 }, on: { confirm: listPage.value?.refresh },
  });
};

const handleEdit = (row: XxxResponseDto) => {
  MfwPopup.open({
    title: '编辑', type: 'dialog', component: XxxForm, data: { ...row },
    popupProps: { width: 550 }, on: { confirm: listPage.value?.refresh },
  });
};

const handleDelete = async (row: XxxResponseDto) => {
  try { await ElMessageBox.confirm(`确定删除「${row.name}」吗？`, '确认删除', { type: 'warning' }); }
  catch { return; }
  await new ApiXxxDelete({ params: { id: row.id } }, { hintSuccess: true });
  listPage.value?.refresh();
};
</script>
```

## 卡片列表页模板（MfwCardListPage）

```vue
<template>
  <MfwPageWrapper>
    <template #header-extra>
      <el-button type="primary" @click="handleAdd">新建</el-button>
    </template>
    <MfwCardListPage ref="cardListPage" :search-template="searchTemplate"
      :load-data="loadData" render-mode="card" empty-text="暂无数据">
      <template #card-item="{ item }">
        <XxxCard :data="item" @refresh="cardListPage?.refresh()" />
      </template>
    </MfwCardListPage>
  </MfwPageWrapper>
</template>
```

## 表单组件标准模板（MfwFormCard + MfwPopup）

```vue
<!--
/**
 * @fileoverview XXX表单组件
 * @description 新建/编辑XXX的表单
 */
-->
<template>
  <MfwFormCard
    ref="formRef"
    :form-data="form"
    :template="formTemplate"
    :form-props="{ labelWidth: '100px' }"
  />
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { MfwFormCard } from '../../../components';
import type { MfwFormCardInstance, FormItemConfig } from '../../../components/form/form-card/types';
import { ApiXxxCreate, ApiXxxUpdate } from '../../../apis/sys';
import type { XxxResponseDto } from '../../../apis/sys/schemas';

const props = defineProps<XxxResponseDto>();

defineOptions({ name: 'XxxForm' });

const formRef = ref<MfwFormCardInstance>();
const isEdit = computed(() => !!props?.id);

const form = reactive({
  name: props?.name || '',
  description: props?.description || '',
  status: props?.status ?? 1,
});

const formTemplate: FormItemConfig[] = [
  {
    key: 'name',
    label: '名称',
    component: 'el-input',
    rules: [
      { required: true, message: '请输入名称', trigger: 'blur' },
      { max: 64, message: '名称长度不能超过 64 个字符', trigger: 'blur' },
    ],
    elProps: { placeholder: '请输入名称', clearable: true },
  },
  {
    key: 'description',
    label: '描述',
    component: 'el-input',
    elProps: { placeholder: '请输入描述', type: 'textarea', rows: 3 },
  },
  {
    key: 'status',
    label: '状态',
    component: 'el-switch',
    value: 1,
    elProps: { activeValue: 1, inactiveValue: 0, activeText: '启用', inactiveText: '禁用' },
  },
];

const onConfirm = async () => {
  const valid = await formRef.value?.validate();
  if (!valid) throw new Error('表单验证失败');

  if (isEdit.value) {
    await new ApiXxxUpdate({ params: { id: props.id }, body: form }, { hintSuccess: true });
  } else {
    await new ApiXxxCreate({ body: form }, { hintSuccess: true });
  }
};

defineExpose({ onConfirm });
</script>
```

### 表单组件核心约定

- **数据接收**：通过 `defineProps<DtoType>()` 接收 MfwPopup 传入的 data
- **编辑判断**：`const isEdit = computed(() => !!props?.id)`
- **表单验证**：`const valid = await formRef.value?.validate(); if (!valid) throw new Error('表单验证失败');`
- **提交后回调**：通过 `defineExpose({ onConfirm })` 暴露方法，MfwPopup 点击确认时调用
- **验证失败阻止关闭**：`onConfirm` 内 `throw new Error()` 可阻止弹窗关闭
- **API 调用**：统一传 `{ hintSuccess: true }` 参数
- **FormItemConfig**：表单项配置使用 `FormItemConfig[]`，支持 `component: 'el-input'` 字符串或 `component: MfwUserPicker` 组件引用

> MfwPopup 调用方式（dialog/drawer/自定义数据）、MfwFormCard 组件映射、FormItemConfig 条件控制、SFC 文件结构详见 {{ref:frontend/form-reference}} — 表单与弹窗参考

## 页面配置标准

```typescript
import { definePageConfig } from '../../../router/routes';
import XxxList from './Index.vue';

export default definePageConfig({
  page: XxxList,
  path: 'xxx',
  name: 'XXX管理',
  icon: 'Document',
  auth: true,
  order: 1,
  permissions: ['添加', '编辑', '删除'],
});
```

## 模块配置标准

```typescript
import { defineModuleConfig } from '../../router/routes';

export default defineModuleConfig({
  type: 'module',
  name: '模块名称',
  icon: 'Setting',
  order: 100,
});
```

## 业务组件目录与导出链

可复用的业务弹窗/面板组件放在 `components/business/<name>/`：

```
business/owner-changer/
├── index.ts    # export * from './mod'
├── mod.ts      # export { default as OwnerChanger } from './Index.vue'
└── Index.vue   # 组件主体（defineOptions({ name: 'OwnerChanger' })）
```

**导出链路**：

```
外部 import { OwnerChanger } from '@/components/business'
  → business/index.ts         export * from './owner-changer'
    → owner-changer/index.ts   export * from './mod'
      → owner-changer/mod.ts   export { default as OwnerChanger } from './Index.vue'
```

**规则**：
- `mod.ts` 负责 `default → 具名` 重导出
- `index.ts` 只做 `export * from './mod'` 透传
- `business/index.ts` 按字母序添加 `export * from './<name>'`
- 视图层页面（`views/`）**不可**直接引用 `.vue`，统一从 `@/components/business` 导入

## 组件导出规范

每个组件目录必须有 `index.ts` 统一导出：

```typescript
// ✅ 通用组件（components/form/、components/picker/ 等）
export { default as MfwXxx } from './Xxx.vue';
export type * from './types';
```

业务组件使用 `mod.ts` 中转模式（见上节「业务组件目录与导出链」）。

## 新增前端页面清单

详见 {{ref:resources/frontend-checklist}} — 前端页面 4 项清单

## 反模式（Red Flags）— 立即停止

- ✋ 删除操作没有 `ElMessageBox.confirm` 二次确认 → 必须二次确认，`catch` 后 `return`（例外：批量操作中逐条确认体验极差时，可在批量操作入口做一次确认，但单个删除入口仍需确认）
- ✋ API 删除操作没传 `{ hintSuccess: true }` → 删除成功需提示用户
- ✋ 表单组件用 `emit('confirm')` 通知父组件 → 使用 `defineExpose({ onConfirm })`，MfwPopup 自动调用
- ✋ 表单验证失败时静默返回 → `throw new Error('表单验证失败')` 阻止弹窗关闭
- ✋ 编辑模式通过 `onMounted` 加载数据 → MfwPopup 通过 `data` prop 直接传入，用 `defineProps` 接收
- ✋ 常量未使用 `as const` → `const STATUS = { ENABLED: 1, DISABLED: 0 } as const`
- ✋ API 类型定义从 `apis/` 手动编写 → 禁止修改 apis 目录，使用自动生成的类型
- ✋ 新增页面后忘记在模块目录放 `index.ts` → 路由自动扫描依赖 `index.ts`
- ✋ 组件缺少 `@fileoverview` + `@description` → 每个文件必须有
