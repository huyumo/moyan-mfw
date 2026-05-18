# 04 · 前端开发规范

## 列表页标准模板

```vue
<!--
/**
 * @fileoverview XXX 列表页面
 * @description 展示XXX列表，支持搜索、新建、编辑、删除
 */
-->
<template>
  <MfwPageWrapper>
    <template #header-extra>
      <el-button type="primary" @click="handleAdd" v-permission="{ value: ['添加'] }">
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
import { ref, h } from 'vue'
import { ElMessageBox } from 'element-plus'
import { MfwPageWrapper, MfwListPage, MfwPopup } from 'moyan-mfw-base/frontend'
import { renderActionButtons } from 'moyan-mfw-base/frontend'

defineOptions({ name: 'XxxList' })

const listPage = ref()

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除「${row.name}」吗？`, '确认删除', { type: 'warning' })
  } catch { return }
  await new ApiXxxDelete({ params: { id: row.id } }, { hintSuccess: true })
  listPage.value?.refresh()
}
</script>
```

---

## 表单组件标准模板（MfwFormCard + MfwPopup）

```vue
<!--
/**
 * @fileoverview XXX 表单组件
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
import { ref, reactive, computed } from 'vue'
import { MfwFormCard } from 'moyan-mfw-base/frontend'

const props = defineProps<{ id?: string; name?: string; status?: number }>()
defineOptions({ name: 'XxxForm' })

const formRef = ref()
const isEdit = computed(() => !!props?.id)

const form = reactive({
  name: props?.name || '',
  status: props?.status ?? 1,
})

const formTemplate = [
  {
    key: 'name', label: '名称', component: 'el-input',
    rules: [{ required: true, message: '请输入名称', trigger: 'blur' }],
    elProps: { placeholder: '请输入名称', clearable: true },
  },
]

const onConfirm = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) throw new Error('表单验证失败')

  if (isEdit.value) {
    await new ApiXxxUpdate({ params: { id: props.id }, body: form }, { hintSuccess: true })
  } else {
    await new ApiXxxCreate({ body: form }, { hintSuccess: true })
  }
}

defineExpose({ onConfirm })
</script>
```

### 表单组件核心约定

- ✅ 通过 `defineProps<DtoType>()` 接收 MfwPopup 传入的 `data`
- ✅ 编辑判断：`const isEdit = computed(() => !!props?.id)`
- ✅ 表单验证失败：`throw new Error('表单验证失败')` 阻止弹窗关闭
- ✅ 通过 `defineExpose({ onConfirm })` 暴露方法
- ✅ API 调用统一传 `{ hintSuccess: true }`
- ✅ 中文标签 `label-width` 最小 `100px`（80px 会换行）
- ✋ 禁止 `emit('confirm')` → 用 `defineExpose({ onConfirm })`
- ✋ 禁止编辑模式通过 `onMounted` 加载数据 → 用 `props` 接收

---

## MfwPopup 调用方式

```typescript
import { MfwPopup } from 'moyan-mfw-base/frontend'

// 新建
MfwPopup.open({
  title: '新建', type: 'dialog', component: XxxForm,
  popupProps: { width: 550 },
  on: { confirm: listPage.value?.refresh },
})

// 编辑（传入行数据）
MfwPopup.open({
  title: '编辑', type: 'dialog', component: XxxForm,
  data: { ...row },
  popupProps: { width: 550 },
  on: { confirm: listPage.value?.refresh },
})

// 查看详情（drawer）
MfwPopup.open({
  title: '详情', type: 'drawer', position: 'rtl',
  component: XxxDetail, data: { ...row },
  popupProps: { size: 500 },
})
```

---

## 页面配置标准

```typescript
import { definePageConfig } from 'moyan-mfw-base/frontend'
import XxxList from './Index.vue'

export default definePageConfig({
  page: XxxList,
  path: 'xxx',
  name: 'XXX管理',
  icon: 'Document',
  auth: true,
  order: 1,
  permissions: ['添加', '编辑', '删除'],
})
```

## 模块配置标准

```typescript
import { defineModuleConfig } from 'moyan-mfw-base/frontend'

export default defineModuleConfig({
  type: 'module',
  name: '模块名称',
  icon: 'Setting',
  order: 100,
})
```

---

## 业务组件目录与导出链

```
business/owner-changer/
├── index.ts    # export * from './mod'
├── mod.ts      # export { default as OwnerChanger } from './Index.vue'
└── Index.vue   # defineOptions({ name: 'OwnerChanger' })
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

---

## 必要检查项

- [ ] 删除操作有 `ElMessageBox.confirm` 二次确认，`catch` 后 `return`
- [ ] API 删除操作传 `{ hintSuccess: true }`
- [ ] 常量使用 `as const`
- [ ] 每个页面目录有 `index.ts` 配置文件
- [ ] 弹窗/面板组件放 `components/`，不放 `views/`
- [ ] 每个文件有 `@fileoverview` + `@description`
