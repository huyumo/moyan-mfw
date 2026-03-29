# Mfw 组件库

> Moyan Framework 通用组件库 | 版本：1.0.0

基于 Vue 3 + TypeScript + Element Plus 的企业级组件库，提供通用的业务 UI 组件。

## 快速开始

### 安装

```bash
pnpm add moyan-mfw-base-frontend
```

### 使用方式

#### 方式一：按需导入（推荐）

```vue
<script setup lang="ts">
import { MfwDateFormat, MfwTableList, MfwFormCard } from 'moyan-mfw-base-frontend';
</script>

<template>
  <MfwDateFormat :value="new Date()" />
  <MfwTableList :data="tableData" :columns="columns" />
  <MfwFormCard :form-data="formData" :template="formTemplate" />
</template>
```

#### 方式二：全局注册

```typescript
// main.ts
import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import { MfwFormat } from 'moyan-mfw-base-frontend';
import 'element-plus/dist/index.css';

const app = createApp(App);
app.use(ElementPlus);
app.use(MfwFormat); // 注册格式化组件
app.mount('#app');
```

## 组件列表

### 展示类组件

| 组件名 | 说明 | 示例 |
|--------|------|------|
| MfwDateFormat | 日期格式化 | `<mfw-date-format :value="new Date()" fmt="YYYY-MM-DD" />` |
| MfwImageFormat | 图片格式化 | `<mfw-image-format value="https://..." :width="100" />` |
| MfwDictFormat | 字典格式化 | `<mfw-dict-format value="1" :dict="dictData" as-tag />` |
| MfwTagFormat | 标签格式化 | `<mfw-tag-format value="已完成" type="success" />` |

### 表单类组件

| 组件名 | 说明 | 示例 |
|--------|------|------|
| MfwFormCard | 配置驱动表单 | `<mfw-form-card :form-data="data" :template="template" />` |
| MfwIconPicker | 图标选择器 | `<mfw-icon-picker v-model="icon" />` |
| MfwJsonEditor | JSON 编辑器 | `<mfw-json-editor v-model="json" />` |

### 表格类组件

| 组件名 | 说明 | 示例 |
|--------|------|------|
| MfwTableList | 动态表格 | `<mfw-table-list :data="data" :columns="cols" />` |

### 弹窗类组件

| 组件名 | 说明 | 示例 |
|--------|------|------|
| MfwPopup | 命令式弹窗 | `MfwPopup.open({ title: '标题', component: Comp })` |
| MfwPopupManager | 弹窗管理器 | `<mfw-popup-manager />` |

### 上传类组件

| 组件名 | 说明 | 示例 |
|--------|------|------|
| MfwUpload | 文件上传 | `<mfw-upload v-model="url" />` |

## 组件详细用法

### MfwDateFormat - 日期格式化

```vue
<template>
  <!-- 基本用法 -->
  <mfw-date-format :value="new Date()" />

  <!-- 自定义格式 -->
  <mfw-date-format :value="new Date()" fmt="YYYY 年 MM 月 DD 日 HH:mm:ss" />

  <!-- 空值处理 -->
  <mfw-date-format :value="null" default-value="-" />
</template>
```

**Props:**
- `value`: Date | string | number | null - 日期值
- `fmt`: string - 格式化模板，默认 'YYYY-MM-DD HH:mm:ss'
- `defaultValue`: string - 空值时的默认显示

### MfwFormCard - 配置驱动表单

```vue
<template>
  <mfw-form-card
    :form-data="formData"
    :template="formTemplate"
    @change="handleChange"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElInput, ElSelect } from 'element-plus';

const formData = ref({
  username: '',
  email: '',
  status: '1'
});

const formTemplate = ref([
  {
    key: 'username',
    label: '用户名',
    type: 'input',
    component: ElInput,
    required: true,
    span: 12
  },
  {
    key: 'email',
    label: '邮箱',
    type: 'input',
    component: ElInput,
    required: true,
    span: 12
  },
  {
    key: 'status',
    label: '状态',
    type: 'select',
    component: ElSelect,
    elProps: {
      options: [
        { label: '启用', value: '1' },
        { label: '禁用', value: '0' }
      ]
    },
    span: 12
  }
]);

const handleChange = (scope: any) => {
  console.log('表单变化:', scope);
};
</script>
```

### MfwPopup - 命令式弹窗

```vue
<template>
  <el-button type="primary" @click="openDialog">打开对话框</el-button>
  <el-button type="success" @click="openDrawer">打开抽屉</el-button>

  <!-- 必须添加弹窗管理器 -->
  <mfw-popup-manager />
</template>

<script setup lang="ts">
import { h } from 'vue';
import { ElMessage } from 'element-plus';
import { MfwPopup, MfwPopupManager } from 'moyan-mfw-base-frontend';

// 打开对话框
const openDialog = () => {
  const instance = MfwPopup.open({
    title: '编辑用户',
    component: {
      setup() {
        return () => h('div', { style: 'padding: 20px' }, '用户编辑表单');
      }
    },
    on: {
      confirm: (data) => {
        ElMessage.success('保存成功');
      },
      close: () => {
        console.log('弹窗关闭');
      }
    }
  });
};

// 打开抽屉
const openDrawer = () => {
  MfwPopup.open({
    title: '详情',
    type: 'drawer',
    position: 'rtl',
    component: {
      setup() {
        return () => h('div', { style: 'padding: 20px' }, '详细信息');
      }
    }
  });
};
</script>
```

**API:**
- `MfwPopup.open(options)`: 打开弹窗，返回实例
- `MfwPopup.close(uuid)`: 关闭指定弹窗
- `MfwPopup.closeAll()`: 关闭所有弹窗

**OpenPopupOptions:**
- `title`: string - 弹窗标题
- `type`: 'dialog' | 'drawer' - 弹窗类型
- `component`: Component - 弹窗内容组件
- `position`: 'ltr' | 'rtl' | 'ttb' | 'btt' - Drawer 位置
- `footer`: boolean | PopupFooter - 页脚配置
- `on`: PopupListeners - 事件监听

### MfwTableList - 动态表格

```vue
<template>
  <mfw-table-list
    :data="tableData"
    :columns="columns"
    :action-column="{
      label: '操作',
      width: 150,
      render: (scope) => renderActions(scope)
    }"
    @selection-change="handleSelectionChange"
  />
</template>

<script setup lang="ts">
import { h } from 'vue';
import { ElButton, ElMessage } from 'element-plus';

const tableData = ref([
  { id: 1, name: '项目 1', status: 'active' },
  { id: 2, name: '项目 2', status: 'pending' }
]);

const columns = ref([
  { prop: 'id', label: 'ID', width: 80 },
  { prop: 'name', label: '名称' },
  { prop: 'status', label: '状态' }
]);

const renderActions = (scope: any) => {
  return h('div', { style: 'display: flex; gap: 8px' }, [
    h(ElButton, {
      size: 'small',
      onClick: () => ElMessage.info(`编辑 ${scope.row.name}`)
    }, { default: () => '编辑' }),
    h(ElButton, {
      size: 'small',
      type: 'danger',
      onClick: () => ElMessage.warning(`删除 ${scope.row.name}`)
    }, { default: () => '删除' })
  ]);
};
</script>
```

### MfwUpload - 文件上传

```vue
<template>
  <!-- 单图上传 -->
  <mfw-upload v-model="imageUrl" />

  <!-- 多图上传 -->
  <mfw-upload v-model="imageUrls" :multiple="true" :limit="9" />

  <!-- 文件上传 -->
  <mfw-upload v-model="fileUrl" list-type="text" />
</template>

<script setup lang="ts">
const imageUrl = ref('');
const imageUrls = ref<string[]>([]);
</script>
```

## 主题定制

组件库使用 Element Plus 的 CSS 变量，可以通过覆盖 CSS 变量来定制主题：

```scss
:root {
  --el-color-primary: #your-color;
  --el-border-radius-base: 4px;
  // ...
}
```

## 开发指南

### 组件命名规范

| 项目 | 规范 | 示例 | 等级 |
|------|------|------|------|
| 组件目录 | `kebab-case`（小写 + 连字符） | `form-card/`, `table-list/` | 🔴 强制 |
| 主组件文件 | `PascalCase` | `Index.vue` | 🔴 强制 |
| 子组件文件 | `kebab-case` | `column-control.vue` | 🟢 推荐 |
| 组件名（defineOptions） | `PascalCase` + `Mfw` 前缀 | `MfwFormCard` | 🔴 强制 |
| 导出模块 | `mod.ts` | `mod.ts` | 🔴 强制 |
| 类型定义 | `types.ts` | `types.ts` | 🔴 强制 |
| 样式文件 | `style.scss` | `style.scss` | 🔴 强制 |
| Composable | `kebab-case` + `use` 前缀 | `use-draft-box.ts` | 🔴 强制 |

### 目录结构

```
packages/base-frontend/src/components/
├── README.md                    # 组件库说明文档
├── index.ts                     # 统一导出入口
│
├── form/                        # ========== 表单类组件 ==========
│   ├── form-card/               # 配置驱动表单
│   │   ├── Index.vue            # 主组件（PascalCase）
│   │   ├── mod.ts               # 导出文件
│   │   ├── types.ts             # 类型定义
│   │   ├── style.scss           # 样式文件
│   │   └── use-draft-box.ts     # Composable（草稿箱）
│   └── index.ts                 # 表单类组件统一导出
│
├── table/                       # ========== 表格类组件 ==========
│   ├── table-list/              # 动态表格列表
│   │   ├── Index.vue
│   │   ├── mod.ts
│   │   ├── types.ts
│   │   └── style.scss
│   └── index.ts                 # 表格类组件统一导出
│
├── feedback/                    # ========== 反馈类组件 ==========
│   ├── popup/                   # 命令式弹窗
│   │   ├── Index.vue
│   │   ├── mod.ts
│   │   ├── types.ts
│   │   └── style.scss
│   └── index.ts                 # 反馈类组件统一导出
│
├── upload/                      # ========== 上传类组件 ==========
│   ├── upload/                  # 文件上传组件
│   │   ├── Index.vue
│   │   ├── mod.ts
│   │   ├── types.ts
│   │   ├── style.scss
│   │   └── uploader.ts
│   └── index.ts                 # 上传类组件统一导出
│
├── display/                     # ========== 展示类组件 ==========
│   ├── mfw-format/              # 格式化组件组
│   │   ├── index.ts             # 插件注册
│   │   ├── base.ts              # 基础类型定义
│   │   ├── types.ts             # 类型定义
│   │   ├── date-format.tsx      # 日期格式化
│   │   ├── image-format.tsx     # 图片格式化
│   │   ├── dict-format.tsx      # 字典格式化
│   │   └── tag-format.tsx       # 标签格式化
│   └── index.ts                 # 展示类组件统一导出
│
├── editor/                      # ========== 编辑器类组件 ==========
│   ├── json-editor/             # JSON 编辑器
│   │   ├── Index.vue
│   │   ├── mod.ts
│   ├── quill-editor/            # 富文本编辑器
│   │   ├── Index.vue
│   │   ├── mod.ts
│   └── index.ts                 # 编辑器类组件统一导出
│
├── picker/                      # ========== 选择器类组件 ==========
│   ├── icon-picker/             # 图标选择器
│   ├── user-picker/             # 用户选择器
│   └── index.ts                 # 选择器类组件统一导出
│
├── page/                        # ========== 页面类组件 ==========
│   ├── page-scene/              # 标准列表页面（搜索 + 表格）
│   ├── tabs-page/               # 多标签页
│   └── index.ts                 # 页面类组件统一导出
│
├── layout/                      # ========== 布局类组件 ==========
│   ├── mo-div/                  # 分割面板
│   └── index.ts                 # 布局类组件统一导出
│
├── map/                         # ========== 地图类组件 ==========
│   ├── ali-map/                 # 高德地图
│   └── index.ts                 # 地图类组件统一导出
│
├── permission/                  # ========== 权限类组件 ==========
│   ├── auth-button/             # 权限按钮
│   └── index.ts                 # 权限类组件统一导出
│
└── business/                    # ========== 业务类组件 ==========
    ├── import-xlsx/             # Excel 导入
    ├── count-to/                # 数字滚动
    └── index.ts                 # 业务类组件统一导出
```

## 许可证

MIT
