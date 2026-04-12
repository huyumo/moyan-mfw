---
title: 2026-04-30-001-P2-组件开发 -MfwBreadcrumb
status: draft
version: 2.0.0
created: 2026-04-12
updated: 2026-04-12T19:45:00Z

task_id: "2026-04-30-001"
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

开发 `MfwBreadcrumb` 面包屑导航组件，支持层级导航、图标、分隔符自定义。

---

## WBS 工作分解

```
MfwBreadcrumb 组件开发 (1h)
├── 1. 需求分析与设计 (10min)
├── 2. 组件结构开发 (25min)
├── 3. 样式与主题开发 (5min)
└── 4. 测试与文档 (20min)
```

---

## TODO List（原子级细化）

### 1. 需求分析与设计 (10min)

#### 1.1 参考现有实现
- [ ] **1.1.1** 打开 Element Plus Breadcrumb 文档 `https://element-plus.org/zh-CN/component/breadcrumb.html`
- [ ] **1.1.2** 记录 Props（至少 3 个：separator、separatorClass 等）
- [ ] **1.1.3** 记录 Events（至少 1 个：item-click）

#### 1.2 定义组件 API
- [ ] **1.2.1** 创建文件 `packages/base-frontend/src/components/MfwBreadcrumb/MfwBreadcrumb.types.ts`
- [ ] **1.2.2** 写入 Props 接口：
```typescript
export interface MfwBreadcrumbProps {
  items: Array<{ name: string; path?: string; icon?: string }>
  separator?: string
  separatorClass?: string
}

export interface MfwBreadcrumbEmits {
  (e: 'item-click', item: any, index: number): void
}
```
- [ ] **1.2.3** 保存文件

**完成标志**: Props/Emits 定义清晰

---

### 2. 组件结构开发 (25min)

#### 2.1 创建组件目录
- [ ] **2.1.1** 创建目录 `packages/base-frontend/src/components/MfwBreadcrumb/`
- [ ] **2.1.2** 创建文件 `MfwBreadcrumb.vue`
- [ ] **2.1.3** 创建文件 `index.ts`

#### 2.2 编写组件模板
- [ ] **2.2.1** 在 `MfwBreadcrumb.vue` 写入 `<template>`:
```vue
<template>
  <el-breadcrumb :separator="separator">
    <el-breadcrumb-item
      v-for="(item, index) in items"
      :key="index"
      @click="handleItemClick(item, index)"
    >
      <el-icon v-if="item.icon"><component :is="item.icon" /></el-icon>
      {{ item.name }}
    </el-breadcrumb-item>
  </el-breadcrumb>
</template>
```
- [ ] **2.2.2** 保存文件

#### 2.3 编写组件脚本
- [ ] **2.3.1** 在 `MfwBreadcrumb.vue` 写入 `<script setup lang="ts">`:
```typescript
import { defineOptions } from 'vue'
import type { MfwBreadcrumbProps, MfwBreadcrumbEmits } from './MfwBreadcrumb.types'

defineOptions({ name: 'MfwBreadcrumb' })

const props = withDefaults(defineProps<MfwBreadcrumbProps>(), {
  separator: '/'
})

const emit = defineEmits<MfwBreadcrumbEmits>()

const handleItemClick = (item: any, index: number) => {
  if (item.path) {
    emit('item-click', item, index)
  }
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
- [ ] **3.1.1** 在 `MfwBreadcrumb.vue` 添加 `<style scoped>`
- [ ] **3.1.2** 设置 `.el-breadcrumb-item` 光标为 pointer

**完成标志**: 样式符合设计规范

---

### 4. 测试与文档 (20min)

#### 4.1 编写单元测试
- [ ] **4.1.1** 创建文件 `__tests__/MfwBreadcrumb.test.ts`
- [ ] **4.1.2** 写入测试：
```typescript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MfwBreadcrumb from '../MfwBreadcrumb'

describe('MfwBreadcrumb', () => {
  const mockItems = [
    { name: '首页', path: '/' },
    { name: '用户管理', path: '/user' }
  ]

  it('渲染基础结构', () => {
    const wrapper = mount(MfwBreadcrumb, {
      props: { items: mockItems }
    })
    expect(wrapper.classes()).toContain('el-breadcrumb')
  })

  it('渲染正确数量的项目', () => {
    const wrapper = mount(MfwBreadcrumb, {
      props: { items: mockItems }
    })
    expect(wrapper.findAll('.el-breadcrumb__item').length).toBe(2)
  })
})
```
- [ ] **4.1.3** 保存文件

#### 4.2 运行测试
- [ ] **4.2.1** 运行 `pnpm --filter @moyan/base-frontend vitest run MfwBreadcrumb`
- [ ] **4.2.2** 检查测试通过率

#### 4.3 编写使用文档
- [ ] **4.3.1** 创建文件 `docs/04-项目实施/04-前端开发/components/MfwBreadcrumb.md`
- [ ] **4.3.2** 写入基础用法、Props、Events

**完成标志**: 测试通过，文档完整

---

## 验收标准

| 序号 | 验收项 | 验证方法 | 通过标准 |
|------|--------|----------|----------|
| 1 | Props 定义 | 检查 types 文件 | 至少 3 个 Props |
| 2 | Emits 定义 | 检查 types 文件 | 至少 1 个 Emit |
| 3 | 组件结构 | 运行 typecheck | 无类型错误 |
| 4 | 点击事件 | 点击项目 | 触发 item-click 事件 |
| 5 | 单元测试 | `pnpm vitest run` | 2/2 测试通过 |

---

## 交付物清单

| 序号 | 交付物 | 文件路径 |
|------|--------|----------|
| 1 | 类型定义 | `src/components/MfwBreadcrumb/MfwBreadcrumb.types.ts` |
| 2 | 组件实现 | `src/components/MfwBreadcrumb/MfwBreadcrumb.vue` |
| 3 | 组件入口 | `src/components/MfwBreadcrumb/index.ts` |
| 4 | 测试文件 | `src/components/MfwBreadcrumb/__tests__/MfwBreadcrumb.test.ts` |
| 5 | 使用文档 | `docs/04-项目实施/04-前端开发/components/MfwBreadcrumb.md` |

---

**状态**: 待开始
