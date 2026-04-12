---
title: 2026-04-30-002-P2-组件开发 -MfwPagination
status: draft
version: 2.0.0
created: 2026-04-12
updated: 2026-04-12T19:45:00Z

task_id: "2026-04-30-002"
task_status: pending
task_priority: P2
task_assignee: Frontend-Dev
task_reviewers: [Tech-Architect]
task_session: session-2026-04-12-009
task_hours: 1h
deadline: 2026-04-30

review_cycle: on-task-complete
---

## 任务目标

开发 `MfwPagination` 分页组件，支持页码切换、页数大小切换、跳转。

---

## WBS 工作分解

```
MfwPagination 组件开发 (1h)
├── 1. 需求分析与设计 (10min)
├── 2. 组件结构开发 (25min)
├── 3. 样式与主题开发 (5min)
└── 4. 测试与文档 (20min)
```

---

## TODO List（原子级细化）

### 1. 需求分析与设计 (10min)

#### 1.1 参考现有实现
- [ ] **1.1.1** 打开 Element Plus Pagination 文档 `https://element-plus.org/zh-CN/component/pagination.html`
- [ ] **1.1.2** 记录 Props（至少 6 个：total、pageSize、currentPage、pageSizes 等）
- [ ] **1.1.3** 记录 Events（至少 2 个：current-change、size-change）

#### 1.2 定义组件 API
- [ ] **1.2.1** 创建文件 `packages/base-frontend/src/components/MfwPagination/MfwPagination.types.ts`
- [ ] **1.2.2** 写入 Props 接口：
```typescript
export interface MfwPaginationProps {
  total: number
  pageSize?: number
  currentPage?: number
  pageSizes?: number[]
  layout?: string
  background?: boolean
}
```
- [ ] **1.2.3** 写入 Emits 接口：
```typescript
export interface MfwPaginationEmits {
  (e: 'update:currentPage', value: number): void
  (e: 'update:pageSize', value: number): void
  (e: 'current-change', value: number): void
  (e: 'size-change', value: number): void
}
```
- [ ] **1.2.4** 保存文件

**完成标志**: Props/Emits 定义清晰

---

### 2. 组件结构开发 (25min)

#### 2.1 创建组件目录
- [ ] **2.1.1** 创建目录 `packages/base-frontend/src/components/MfwPagination/`
- [ ] **2.1.2** 创建文件 `MfwPagination.vue`
- [ ] **2.1.3** 创建文件 `index.ts`

#### 2.2 编写组件模板
- [ ] **2.2.1** 在 `MfwPagination.vue` 写入 `<template>`:
```vue
<template>
  <el-pagination
    v-model:current-page="internalCurrentPage"
    v-model:page-size="internalPageSize"
    :total="total"
    :page-sizes="pageSizes"
    :layout="layout"
    :background="background"
    @current-change="handleCurrentChange"
    @size-change="handleSizeChange"
  />
</template>
```
- [ ] **2.2.2** 保存文件

#### 2.3 编写组件脚本
- [ ] **2.3.1** 在 `MfwPagination.vue` 写入 `<script setup lang="ts">`:
```typescript
import { defineOptions } from 'vue'
import type { MfwPaginationProps, MfwPaginationEmits } from './MfwPagination.types'

defineOptions({ name: 'MfwPagination' })

const props = withDefaults(defineProps<MfwPaginationProps>(), {
  pageSize: 10,
  currentPage: 1,
  pageSizes: () => [10, 20, 50, 100],
  layout: 'total, sizes, prev, pager, next, jumper',
  background: false
})

const emit = defineEmits<MfwPaginationEmits>()

const internalCurrentPage = defineModel<number>('currentPage')
const internalPageSize = defineModel<number>('pageSize')

const handleCurrentChange = (value: number) => {
  emit('current-change', value)
}

const handleSizeChange = (value: number) => {
  emit('size-change', value)
}
```
- [ ] **2.3.2** 保存文件

#### 2.4 编写组件入口
- [ ] **2.4.1** 在 `index.ts` 写入标准导出代码
- [ ] **2.4.2** 保存文件

**完成标志**: 组件可被导入和使用

---

### 3. 样式与主题开发 (5min)

#### 3.1 添加组件样式
- [ ] **3.1.1** 在 `MfwPagination.vue` 添加 `<style scoped>`
- [ ] **3.1.2** 保存文件

**完成标志**: 样式符合设计规范

---

### 4. 测试与文档 (20min)

#### 4.1 编写单元测试
- [ ] **4.1.1** 创建文件 `__tests__/MfwPagination.test.ts`
- [ ] **4.1.2** 写入测试：
```typescript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MfwPagination from '../MfwPagination'

describe('MfwPagination', () => {
  it('渲染基础结构', () => {
    const wrapper = mount(MfwPagination, {
      props: { total: 100 }
    })
    expect(wrapper.classes()).toContain('el-pagination')
  })

  it('页码切换事件', async () => {
    const wrapper = mount(MfwPagination, {
      props: { total: 100, currentPage: 1 }
    })
    await wrapper.find('.el-pager li:nth-child(2)').trigger('click')
    expect(wrapper.emitted('current-change')).toBeTruthy()
  })
})
```
- [ ] **4.1.3** 保存文件

#### 4.2 运行测试
- [ ] **4.2.1** 运行 `pnpm --filter @moyan/base-frontend vitest run MfwPagination`
- [ ] **4.2.2** 检查测试通过率

#### 4.3 编写使用文档
- [ ] **4.3.1** 创建文件 `docs/04-项目实施/04-前端开发/components/MfwPagination.md`
- [ ] **4.3.2** 写入基础用法、Props、Events

**完成标志**: 测试通过，文档完整

---

## 验收标准

| 序号 | 验收项 | 验证方法 | 通过标准 |
|------|--------|----------|----------|
| 1 | Props 定义 | 检查 types 文件 | 至少 5 个 Props |
| 2 | Emits 定义 | 检查 types 文件 | 至少 4 个 Emits |
| 3 | 组件结构 | 运行 typecheck | 无类型错误 |
| 4 | 页码切换 | 点击页码 | 触发 current-change 事件 |
| 5 | 单元测试 | `pnpm vitest run` | 2/2 测试通过 |

---

## 交付物清单

| 序号 | 交付物 | 文件路径 |
|------|--------|----------|
| 1 | 类型定义 | `src/components/MfwPagination/MfwPagination.types.ts` |
| 2 | 组件实现 | `src/components/MfwPagination/MfwPagination.vue` |
| 3 | 组件入口 | `src/components/MfwPagination/index.ts` |
| 4 | 测试文件 | `src/components/MfwPagination/__tests__/MfwPagination.test.ts` |
| 5 | 使用文档 | `docs/04-项目实施/04-前端开发/components/MfwPagination.md` |

---

**状态**: 待开始
