---
title: 2026-04-22-002-P0-组件开发 -MfwTableList
status: draft
version: 2.0.0
created: 2026-04-12
updated: 2026-04-12T19:00:00Z

task_id: "2026-04-22-002"
task_status: pending
task_priority: P0
task_assignee: Frontend-Dev
task_reviewers: [Tech-Architect, QA-Agent]
task_session: session-2026-04-12-009
task_hours: 3h
deadline: 2026-04-22

review_cycle: on-task-complete
---

## 任务目标

开发 `MfwTableList` 表格列表组件，支持表格列表、分页、排序、筛选。

---

## WBS 工作分解

```
MfwTableList 组件开发 (3h)
├── 1. 需求分析与设计 (30min)
├── 2. 组件结构开发 (1h)
├── 3. 分页排序筛选开发 (45min)
├── 4. 样式与主题开发 (15min)
└── 5. 测试与文档 (30min)
```

---

## TODO List（原子级细化）

### 1. 需求分析与设计 (30min)

#### 1.1 参考现有实现
- [ ] **1.1.1** 打开 Element Plus 文档 `https://element-plus.org/zh-CN/component/table.html`
- [ ] **1.1.2** 记录 Table 组件的 Props 列表（至少 8 个：data、columns、border、stripe 等）
- [ ] **1.1.3** 记录 Table 组件的 Events 列表（至少 5 个：sort-change、filter-change、row-click 等）
- [ ] **1.1.4** 打开 Element Plus 分页文档 `https://element-plus.org/zh-CN/component/pagination.html`
- [ ] **1.1.5** 记录 Pagination 组件的 Props（至少 5 个：total、pageSize、currentPage 等）
- [ ] **1.1.6** 截图保存到 `docs/04-项目实施/05-任务追踪/input/mfw-tablelist-reference.png`

#### 1.2 定义组件 API
- [ ] **1.2.1** 创建文件 `packages/base-frontend/src/components/MfwTableList/MfwTableList.types.ts`
- [ ] **1.2.2** 写入 Props 接口定义：
```typescript
export interface MfwTableListProps {
  data: any[]                              // 表格数据
  columns: TableColumn[]                   // 列配置
  border?: boolean                         // 边框
  stripe?: boolean                         // 斑马纹
  pageSize?: number                        // 每页条数
  pageSizes?: number[]                     // 每页条数选项
  total?: number                           // 总条数
  currentPage?: number                     // 当前页码
  loading?: boolean                        // 加载状态
  rowKey?: string                          // 行数据的 Key
}

export interface TableColumn {
  prop: string
  label: string
  width?: string | number
  sortable?: boolean
  formatter?: (row: any, column: any, cellValue: any) => any
}
```
- [ ] **1.2.3** 写入 Emits 接口定义：
```typescript
export interface MfwTableListEmits {
  (e: 'sort-change', { prop: string, order: string }): void
  (e: 'filter-change', filters: Record<string, any>): void
  (e: 'page-change', page: number): void
  (e: 'size-change', size: number): void
  (e: 'row-click', row: any, event: Event): void
  (e: 'selection-change', selection: any[]): void
}
```
- [ ] **1.2.4** 保存文件

#### 1.3 设计组件结构
- [ ] **1.3.1** 创建文件 `packages/base-frontend/src/components/MfwTableList/design.md`
- [ ] **1.3.2** 写入组件结构：
```markdown
# MfwTableList 组件结构

## 外层结构
- div.mfw-table-list
  - div.mfw-table-list__toolbar (可选工具栏)
    - slot: toolbar
  - el-table
    - el-table-column (动态生成)
    - slot: 自定义列
  - div.mfw-table-list__pagination
    - el-pagination
      - slot: pagination

## 插槽
- toolbar: 顶部工具栏
- [column-prop]: 自定义列内容
- pagination: 自定义分页区域

## 依赖组件
- ElTable (element-plus)
- ElTableColumn (element-plus)
- ElPagination (element-plus)
```
- [ ] **1.3.3** 保存文件

**完成标志**: 设计文档完成，Props/Emits/Column 定义清晰

---

### 2. 组件结构开发 (1h)

#### 2.1 创建组件目录
- [ ] **2.1.1** 创建目录 `packages/base-frontend/src/components/MfwTableList/`
- [ ] **2.1.2** 创建文件 `packages/base-frontend/src/components/MfwTableList/MfwTableList.vue`
- [ ] **2.1.3** 创建文件 `packages/base-frontend/src/components/MfwTableList/index.ts`

#### 2.2 编写组件模板
- [ ] **2.2.1** 在 `MfwTableList.vue` 写入 `<template>`:
```vue
<template>
  <div class="mfw-table-list">
    <div v-if="$slots.toolbar" class="mfw-table-list__toolbar">
      <slot name="toolbar"></slot>
    </div>
    
    <el-table
      :data="data"
      :border="border"
      :stripe="stripe"
      :row-key="rowKey"
      @sort-change="handleSortChange"
      @selection-change="handleSelectionChange"
      @row-click="handleRowClick"
    >
      <el-table-column
        v-for="column in columns"
        :key="column.prop"
        :prop="column.prop"
        :label="column.label"
        :width="column.width"
        :sortable="column.sortable"
      >
        <template #default="scope">
          <slot :name="column.prop" v-bind="scope">
            {{ column.formatter?.(scope.row, column, scope.row[column.prop]) ?? scope.row[column.prop] }}
          </slot>
        </template>
      </el-table-column>
    </el-table>
    
    <div v-if="showPagination" class="mfw-table-list__pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="pageSizes"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>
```
- [ ] **2.2.2** 保存文件

#### 2.3 编写组件脚本
- [ ] **2.3.1** 在 `MfwTableList.vue` 写入 `<script setup lang="ts">`:
```typescript
import { defineOptions } from 'vue'
import type { MfwTableListProps, MfwTableListEmits } from './MfwTableList.types'

defineOptions({
  name: 'MfwTableList',
  inheritAttrs: true
})

const props = withDefaults(defineProps<MfwTableListProps>(), {
  border: false,
  stripe: false,
  pageSize: 10,
  pageSizes: () => [10, 20, 50, 100],
  currentPage: 1,
  rowKey: 'id'
})

const emit = defineEmits<MfwTableListEmits>()

const showPagination = computed(() => {
  return props.total !== undefined
})

const handleSortChange = ({ prop, order }: any) => {
  emit('sort-change', { prop, order })
}

const handleSelectionChange = (selection: any[]) => {
  emit('selection-change', selection)
}

const handleRowClick = (row: any, event: Event) => {
  emit('row-click', row, event)
}

const handlePageChange = (page: number) => {
  emit('page-change', page)
}

const handleSizeChange = (size: number) => {
  emit('size-change', size)
}
```
- [ ] **2.3.2** 保存文件

#### 2.4 编写组件入口
- [ ] **2.4.1** 在 `index.ts` 写入：
```typescript
import MfwTableList from './MfwTableList.vue'
import type { MfwTableListProps, MfwTableListEmits, TableColumn } from './MfwTableList.types'

export { MfwTableList }
export type { MfwTableListProps, MfwTableListEmits, TableColumn }

export default MfwTableList
```
- [ ] **2.4.2** 保存文件

#### 2.5 更新组件总入口
- [ ] **2.5.1** 打开 `packages/base-frontend/src/index.ts`
- [ ] **2.5.2** 添加导出：`export { MfwTableList } from './components/MfwTableList'`
- [ ] **2.5.3** 保存文件

**完成标志**: 组件可被导入和使用

---

### 3. 分页排序筛选开发 (45min)

#### 3.1 实现排序功能
- [ ] **3.1.1** 确保 `handleSortChange` 方法已定义
- [ ] **3.1.2** 验证 `sort-change` 事件回调参数包含 `{ prop, order }`
- [ ] **3.1.3** 在父组件测试：监听事件后调用后端接口

#### 3.2 实现分页功能
- [ ] **3.2.1** 确保 `handlePageChange` 和 `handleSizeChange` 方法已定义
- [ ] **3.2.2** 验证 `page-change` 和 `size-change` 事件正确触发
- [ ] **3.2.3** 添加内部状态管理：
```typescript
const internalPageChange = (page: number) => {
  emit('page-change', page)
}
```

#### 3.3 实现筛选功能（可选）
- [ ] **3.3.1** 在 `MfwTableList.types.ts` 添加筛选 Props:
```typescript
filters?: Record<string, any[]>  // 筛选配置
filterMethod?: (value: any, row: any) => boolean  // 筛选方法
```
- [ ] **3.3.2** 在组件中添加筛选列支持
- [ ] **3.3.3** 添加 `filter-change` 事件

#### 3.4 添加加载状态
- [ ] **3.4.1** 在 `<el-table>` 上添加 `v-loading="loading"`
- [ ] **3.4.2** 添加 loading-text 属性支持

**完成标志**: 分页、排序、筛选功能正常

---

### 4. 样式与主题开发 (15min)

#### 4.1 编写组件样式
- [ ] **4.1.1** 在 `MfwTableList.vue` 添加 `<style scoped>`:
```vue
<style scoped>
.mfw-table-list {
  width: 100%;
}

.mfw-table-list__toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 0;
}

.mfw-table-list__pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
```
- [ ] **4.1.2** 保存文件

#### 4.2 添加 CSS 变量支持
- [ ] **4.2.1** 检查 `packages/base-frontend/src/styles/variables.css`
- [ ] **4.2.2** 添加表格相关变量：
```css
:root {
  --mfw-table-toolbar-padding: 12px;
  --mfw-table-pagination-margin: 16px;
}
```

**完成标志**: 组件样式符合设计规范

---

### 5. 测试与文档 (30min)

#### 5.1 编写单元测试
- [ ] **5.1.1** 创建文件 `packages/base-frontend/src/components/MfwTableList/__tests__/MfwTableList.test.ts`
- [ ] **5.1.2** 写入测试：
```typescript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MfwTableList from '../MfwTableList.vue'

describe('MfwTableList', () => {
  const mockData = [
    { id: 1, name: '张三', age: 25 },
    { id: 2, name: '李四', age: 30 }
  ]
  
  const mockColumns = [
    { prop: 'name', label: '姓名' },
    { prop: 'age', label: '年龄' }
  ]

  it('渲染基础表格', () => {
    const wrapper = mount(MfwTableList, {
      props: {
        data: mockData,
        columns: mockColumns
      }
    })
    expect(wrapper.classes()).toContain('mfw-table-list')
    expect(wrapper.findAll('tr').length).toBe(3) // 2 行数据 + 1 行表头
  })

  it('分页事件触发', async () => {
    const wrapper = mount(MfwTableList, {
      props: {
        data: mockData,
        columns: mockColumns,
        total: 100,
        pageSize: 10
      }
    })
    await wrapper.find('.el-pager li:nth-child(2)').trigger('click')
    expect(wrapper.emitted('page-change')).toBeTruthy()
  })
})
```
- [ ] **5.1.3** 保存文件

#### 5.2 运行测试
- [ ] **5.2.1** 运行 `pnpm --filter @moyan/base-frontend vitest run MfwTableList`
- [ ] **5.2.2** 检查测试通过率
- [ ] **5.2.3** 如失败，修复后重试

#### 5.3 编写使用文档
- [ ] **5.3.1** 创建文件 `docs/04-项目实施/04-前端开发/components/MfwTableList.md`
- [ ] **5.3.2** 写入文档：
```markdown
# MfwTableList 组件

## 基础用法

```vue
<template>
  <MfwTableList
    :data="tableData"
    :columns="columns"
    :total="total"
    @page-change="handlePageChange"
    @sort-change="handleSortChange"
  />
</template>

<script setup lang="ts">
const tableData = ref([
  { id: 1, name: '张三', age: 25 }
])

const columns = [
  { prop: 'name', label: '姓名' },
  { prop: 'age', label: '年龄', sortable: true }
]

const total = ref(100)
</script>
```

## Props

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| data | array | - | 表格数据 |
| columns | array | - | 列配置 |
| border | boolean | false | 边框 |
| stripe | boolean | false | 斑马纹 |
| pageSize | number | 10 | 每页条数 |
| total | number | - | 总条数 |
| loading | boolean | false | 加载状态 |

## Events

| 事件名 | 回调参数 | 说明 |
|--------|----------|------|
| sort-change | { prop, order } | 排序变化 |
| page-change | page | 页码变化 |
| size-change | size | 每页条数变化 |
| row-click | row, event | 行点击 |

## 插槽

| 名称 | 说明 |
|------|------|
| toolbar | 顶部工具栏 |
| [column-prop] | 自定义列内容 |
```
- [ ] **5.3.3** 保存文件

#### 5.4 更新组件索引
- [ ] **5.4.1** 打开 `packages/base-frontend/src/components/index.ts`
- [ ] **5.4.2** 添加 `export * from './MfwTableList'`
- [ ] **5.4.3** 保存文件

**完成标志**: 测试通过，文档完整

---

## 验收标准（可量化）

| 序号 | 验收项 | 验证方法 | 通过标准 |
|------|--------|----------|----------|
| 1 | Props 定义 | 检查 types 文件 | 至少 8 个 Props |
| 2 | Emits 定义 | 检查 types 文件 | 至少 5 个 Emits |
| 3 | 组件结构 | 运行 typecheck | 无类型错误 |
| 4 | 分页功能 | 点击分页按钮 | 触发 page-change 事件 |
| 5 | 排序功能 | 点击列头 | 触发 sort-change 事件 |
| 6 | 单元测试 | `pnpm vitest run` | 2/2 测试通过 |
| 7 | 文档完整 | 检查文档目录 | 至少包含 Props/Events/插槽 |

---

## 交付物清单

| 序号 | 交付物 | 文件路径 | 验收项 |
|------|--------|----------|--------|
| 1 | 类型定义 | `src/components/MfwTableList/MfwTableList.types.ts` | 1,2 |
| 2 | 组件实现 | `src/components/MfwTableList/MfwTableList.vue` | 3 |
| 3 | 组件入口 | `src/components/MfwTableList/index.ts` | 3 |
| 4 | 测试文件 | `src/components/MfwTableList/__tests__/MfwTableList.test.ts` | 6 |
| 5 | 使用文档 | `docs/04-项目实施/04-前端开发/components/MfwTableList.md` | 7 |
| 6 | 设计文档 | `src/components/MfwTableList/design.md` | - |

---

## 审查记录

| 审查人 | 审查日期 | 结果 | 意见 |
|--------|----------|------|------|
| Tech-Architect | | 待审查 | |
| QA-Agent | | 待审查 | |

---

## 相关文件

- [Vue 组件规范](../../../03-框架规范/01-前端规范/02-Vue-组件规范.md)
- [Element Plus 文档](https://element-plus.org/zh-CN/component/table.html)
- [任务模板](../../../02-团队/01-团队规范/03-任务模板.md)

---

**状态**: 待开始  
**依赖**: `2026-04-12-008-前端项目第一阶段 - 核心问题修复` 完成后开始
