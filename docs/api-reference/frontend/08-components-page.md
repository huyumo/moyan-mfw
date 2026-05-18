# 08 · 页面类组件

## 目录

- [`MfwPageWrapper`](#mfwpagewrapper) — 页面包裹器
- [`MfwListPage`](#mfwlistpage) — 标准列表页
- [`MfwCardListPage`](#mfwcardlistpage) — 卡片列表页
- [`MfwSearchPanel`](#mfwsearchpanel) — 搜索面板

---

## `MfwPageWrapper`

标准页面包裹器，提供标题栏、操作区插槽和内容区。

```typescript
import { MfwPageWrapper } from 'moyan-mfw-base/frontend'
```

```vue
<MfwPageWrapper title="用户管理" icon="User">
  <template #actions>
    <el-button type="primary" @click="handleCreate">新建用户</el-button>
  </template>

  <template #default>
    <MfwTableList :data="list" :columns="columns" />
  </template>
</MfwPageWrapper>
```

---

## `MfwListPage`

标准列表页组件，集成搜索 + 表格 + 分页。

```typescript
import { MfwListPage } from 'moyan-mfw-base/frontend'
```

```vue
<MfwListPage
  title="用户列表"
  icon="User"
  :columns="columns"
  :search-fields="searchFields"
  :fetch-data="fetchUsers"
>
  <template #actions>
    <el-button type="primary" @click="handleCreate">新建</el-button>
  </template>
</MfwListPage>
```

---

## `MfwCardListPage`

卡片式列表页，用卡片布局展示数据。

```typescript
import { MfwCardListPage } from 'moyan-mfw-base/frontend'
```

```vue
<MfwCardListPage
  title="应用列表"
  icon="Grid"
  :data="apps"
>
  <template #card="{ item }">
    <AppCard :app="item" />
  </template>
</MfwCardListPage>
```

---

## `MfwSearchPanel`

搜索面板组件，提供标准搜索条件布局。

```typescript
import { MfwSearchPanel } from 'moyan-mfw-base/frontend'
```

```vue
<MfwSearchPanel :fields="searchFields" @search="handleSearch" @reset="handleReset">
  <el-form-item label="用户名">
    <el-input v-model="query.username" placeholder="请输入" />
  </el-form-item>
  <el-form-item label="状态">
    <el-select v-model="query.status">
      <el-option label="正常" value="1" />
      <el-option label="禁用" value="0" />
    </el-select>
  </el-form-item>
</MfwSearchPanel>
```
