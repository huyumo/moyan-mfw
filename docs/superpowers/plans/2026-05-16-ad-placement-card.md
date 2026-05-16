# 广告位卡片展示与轮播预览实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将广告位列表从表格展示改为卡片展示，支持轮播预览广告效果

**Architecture:** 创建新的卡片组件 AdPlacementCard，改造主页面 Index.vue 使用卡片网格布局，批量加载广告内容用于轮播预览

**Tech Stack:** Vue 3 + TypeScript + Element Plus + Vite

---

## 文件结构

| 文件 | 操作 | 职责 |
|------|------|------|
| `packages/extensions/extension-ad/src/frontend/src/components/ad-placement-card/Index.vue` | 创建 | 广告位卡片组件，包含轮播预览、信息展示、操作按钮 |
| `packages/extensions/extension-ad/src/frontend/src/views/placement/Index.vue` | 修改 | 主页面，从表格改为卡片网格布局 |
| `packages/extensions/extension-ad/src/frontend/src/components/ad-placement-detail/Index.vue` | 修改 | 更新权限指令为对象形式 |

---

## Task 1: 创建 AdPlacementCard 组件

**Files:**
- Create: `packages/extensions/extension-ad/src/frontend/src/components/ad-placement-card/Index.vue`

- [ ] **Step 1: 创建组件文件和基础结构**

创建文件 `packages/extensions/extension-ad/src/frontend/src/components/ad-placement-card/Index.vue`：

```vue
<!--
/**
 * @fileoverview 广告位卡片组件
 * @description 展示广告位信息，支持轮播预览广告效果
 */
-->
<template>
  <el-card class="ad-placement-card" :body-style="{ padding: '0' }">
    <!-- 轮播预览区 -->
    <div class="carousel-wrapper" :style="carouselStyle">
      <el-carousel 
        v-if="ads.length > 0"
        :height="carouselHeight"
        :autoplay="true"
        :interval="3000"
        indicator-position="none"
      >
        <el-carousel-item v-for="ad in ads" :key="ad.id">
          <img :src="ad.imageUrl" class="ad-image" />
        </el-carousel-item>
      </el-carousel>
      <div v-else class="empty-placeholder">
        <el-icon :size="48"><Picture /></el-icon>
        <span>暂无广告</span>
      </div>
    </div>
    
    <!-- 信息展示区 -->
    <div class="info-section">
      <div class="info-row">
        <span class="label">名称：</span>
        <span class="value">{{ placement.name }}</span>
      </div>
      <div class="info-row">
        <span class="label">编码：</span>
        <span class="value">{{ placement.code }}</span>
      </div>
      <div class="info-row">
        <span class="label">尺寸：</span>
        <span class="value">{{ placement.width }}x{{ placement.height }}px</span>
      </div>
      <div class="info-row">
        <span class="label">广告数：</span>
        <el-tag :type="adCount > 0 ? 'success' : 'info'" size="small">
          {{ adCount }}
        </el-tag>
      </div>
      <div class="info-row">
        <span class="label">状态：</span>
        <el-tag :type="placement.status === 1 ? 'success' : 'danger'" size="small">
          {{ placement.status === 1 ? '启用' : '禁用' }}
        </el-tag>
      </div>
    </div>
    
    <!-- 操作按钮区 -->
    <div class="action-section">
      <el-button 
        :type="placement.status === 1 ? 'warning' : 'success'"
        size="small"
        @click="handleToggleStatus"
        v-permission="{ value: ['编辑'] }"
      >
        {{ placement.status === 1 ? '禁用' : '启用' }}
      </el-button>
      <el-button type="primary" size="small" @click="handleEdit" v-permission="{ value: ['编辑'] }">
        编辑
      </el-button>
      <el-button type="danger" size="small" @click="handleDelete" v-permission="{ value: ['删除'] }">
        删除
      </el-button>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Picture } from '@element-plus/icons-vue'
import type { AdPlacementResponseDto, AdResponseDto } from '../../apis/ad/schemas'

interface Props {
  placement: AdPlacementResponseDto
  ads: AdResponseDto[]
  adCount: number
}

const props = defineProps<Props>()

interface Emits {
  (e: 'edit', placement: AdPlacementResponseDto): void
  (e: 'delete', placement: AdPlacementResponseDto): void
  (e: 'toggle-status', placement: AdPlacementResponseDto): void
}

const emit = defineEmits<Emits>()

defineOptions({ name: 'MfwAdPlacementCard' })

const carouselHeight = computed(() => {
  const ratio = props.placement.height / props.placement.width
  const calculatedHeight = 280 * ratio
  return Math.min(250, Math.max(150, calculatedHeight))
})

const carouselStyle = computed(() => ({
  height: `${carouselHeight.value}px`
}))

const handleEdit = () => {
  emit('edit', props.placement)
}

const handleDelete = () => {
  emit('delete', props.placement)
}

const handleToggleStatus = () => {
  emit('toggle-status', props.placement)
}
</script>

<style scoped>
.ad-placement-card {
  transition: transform 0.2s, box-shadow 0.2s;
}

.ad-placement-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.carousel-wrapper {
  width: 100%;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.ad-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.empty-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
  gap: 8px;
  height: 150px;
}

.info-section {
  padding: 12px 16px;
}

.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-row .label {
  color: #909399;
  min-width: 60px;
}

.info-row .value {
  color: #303133;
  flex: 1;
}

.action-section {
  padding: 12px 16px;
  border-top: 1px solid #ebeef5;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
```

- [ ] **Step 2: 验证组件文件创建成功**

Run: `ls packages/extensions/extension-ad/src/frontend/src/components/ad-placement-card/`
Expected: 显示 `Index.vue` 文件

---

## Task 2: 改造主页面 Index.vue

**Files:**
- Modify: `packages/extensions/extension-ad/src/frontend/src/views/placement/Index.vue`

- [ ] **Step 1: 备份原文件**

Run: `cp packages/extensions/extension-ad/src/frontend/src/views/placement/Index.vue packages/extensions/extension-ad/src/frontend/src/views/placement/Index.vue.bak`

- [ ] **Step 2: 重写 Index.vue 文件**

将 `packages/extensions/extension-ad/src/frontend/src/views/placement/Index.vue` 替换为：

```vue
<!--
/**
 * @fileoverview 广告位管理列表页
 * @description 卡片展示广告位，支持轮播预览广告效果
 */
-->
<template>
  <MfwPageWrapper>
    <template #header-extra>
      <el-button type="primary" @click="handleAdd" v-permission="{ value: ['添加'] }">
        <el-icon><Plus /></el-icon>新建广告位
      </el-button>
    </template>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="广告位名称">
          <el-input v-model="searchForm.name" placeholder="请输入广告位名称" clearable />
        </el-form-item>
        <el-form-item label="广告位编码">
          <el-input v-model="searchForm.code" placeholder="请输入广告位编码" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable style="width: 120px">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 卡片网格 -->
    <div v-loading="loading" class="card-grid">
      <MfwAdPlacementCard
        v-for="placement in placements"
        :key="placement.id"
        :placement="placement"
        :ads="placementAds[placement.id] || []"
        :ad-count="placementAdCounts[placement.id] || 0"
        @edit="handleEdit"
        @delete="handleDelete"
        @toggle-status="handleToggleStatus"
      />
    </div>

    <!-- 分页 -->
    <el-pagination
      v-model:current-page="pagination.page"
      v-model:page-size="pagination.pageSize"
      :total="pagination.total"
      :page-sizes="[12, 24, 48]"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="loadPlacements"
      @current-change="loadPlacements"
    />

    <MfwAdPlacementDetail ref="detailRef" />
  </MfwPageWrapper>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import { MfwPageWrapper, MfwPopup } from 'moyan-mfw-base/frontend'
import {
  ApiAdPlacementFindAll,
  ApiAdPlacementUpdate,
  ApiAdPlacementDelete,
  ApiAdFindAll,
} from '../../apis/ad'
import { StatusDict } from 'moyan-mfw-base/shared'
import MfwAdPlacementForm from '../../components/ad-placement-form/Index.vue'
import MfwAdPlacementDetail from '../../components/ad-placement-detail/Index.vue'
import MfwAdPlacementCard from '../../components/ad-placement-card/Index.vue'

const STATUS = { ENABLED: StatusDict.ENABLED, DISABLED: StatusDict.DISABLED }
defineOptions({ name: 'MfwAdPlacementList' })

const loading = ref(false)
const placements = ref<any[]>([])
const placementAds = ref<Record<string, any[]>>({})
const placementAdCounts = ref<Record<string, number>>({})

const searchForm = reactive({
  name: '',
  code: '',
  status: undefined as number | undefined,
})

const pagination = reactive({
  page: 1,
  pageSize: 12,
  total: 0,
})

const detailRef = ref<InstanceType<typeof MfwAdPlacementDetail>>()

const loadPlacements = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      pageSize: pagination.pageSize,
    }
    if (searchForm.name) params.name = searchForm.name
    if (searchForm.code) params.code = searchForm.code
    if (searchForm.status !== undefined) params.status = searchForm.status

    const res = await new ApiAdPlacementFindAll({ query: params })
    placements.value = res.list || []
    pagination.total = res.total

    await loadAdsForPlacements(placements.value.map(p => p.id))
  } finally {
    loading.value = false
  }
}

const loadAdsForPlacements = async (placementIds: string[]) => {
  const promises = placementIds.map(id =>
    new ApiAdFindAll({ query: { page: 1, pageSize: 10, placementId: id, status: STATUS.ENABLED } })
  )
  const results = await Promise.all(promises)

  placementIds.forEach((id, index) => {
    placementAds.value[id] = results[index].list || []
    placementAdCounts.value[id] = results[index].total || 0
  })
}

const handleSearch = () => {
  pagination.page = 1
  loadPlacements()
}

const handleReset = () => {
  searchForm.name = ''
  searchForm.code = ''
  searchForm.status = undefined
  pagination.page = 1
  loadPlacements()
}

const handleAdd = () => {
  MfwPopup.open({
    title: '新建广告位',
    type: 'dialog',
    component: MfwAdPlacementForm,
    popupProps: { width: 550 },
    on: { confirm: loadPlacements },
  })
}

const handleEdit = (row: any) => {
  MfwPopup.open({
    title: '编辑广告位',
    type: 'dialog',
    component: MfwAdPlacementForm,
    data: { ...row },
    popupProps: { width: 550 },
    on: { confirm: loadPlacements },
  })
}

const handleToggleStatus = async (row: any) => {
  const newStatus = row.status === STATUS.ENABLED ? STATUS.DISABLED : STATUS.ENABLED
  const actionText = newStatus === STATUS.ENABLED ? '启用' : '禁用'
  try {
    await ElMessageBox.confirm(`确定${actionText}广告位「${row.name}」？`, `确认${actionText}`, { type: 'warning' })
  } catch { return }
  await new ApiAdPlacementUpdate(
    { params: { id: row.id }, body: { status: newStatus } },
    { hintSuccess: true, successMsg: `${actionText}成功` },
  )
  loadPlacements()
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定删除广告位「${row.name}」吗？关联的广告内容也将被清除`, '确认删除', { type: 'warning' })
  } catch { return }
  await new ApiAdPlacementDelete({ params: { id: row.id } }, { hintSuccess: true })
  loadPlacements()
}

onMounted(() => {
  loadPlacements()
})
</script>

<style scoped>
.search-bar {
  margin-bottom: 20px;
  padding: 16px;
  background: #fff;
  border-radius: 4px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
  min-height: 200px;
}
</style>
```

- [ ] **Step 3: 验证文件修改成功**

Run: `head -20 packages/extensions/extension-ad/src/frontend/src/views/placement/Index.vue`
Expected: 显示新的文件内容，包含 `<MfwAdPlacementCard` 组件

---

## Task 3: 更新权限指令为对象形式

**Files:**
- Modify: `packages/extensions/extension-ad/src/frontend/src/components/ad-placement-detail/Index.vue`

- [ ] **Step 1: 更新权限指令**

将 `packages/extensions/extension-ad/src/frontend/src/components/ad-placement-detail/Index.vue` 中的权限指令从字符串形式改为对象形式：

查找：
```vue
v-permission="'添加'"
v-permission="'编辑'"
v-permission="'删除'"
```

替换为：
```vue
v-permission="{ value: ['添加'] }"
v-permission="{ value: ['编辑'] }"
v-permission="{ value: ['删除'] }"
```

- [ ] **Step 2: 验证权限指令更新**

Run: `grep -n "v-permission" packages/extensions/extension-ad/src/frontend/src/components/ad-placement-detail/Index.vue`
Expected: 显示更新后的权限指令，包含 `{ value: ['添加'] }` 等对象形式

---

## Task 4: 运行类型检查

**Files:**
- 无文件变更，仅验证

- [ ] **Step 1: 运行 TypeScript 类型检查**

Run: `pnpm typecheck:vue`
Expected: 无类型错误

- [ ] **Step 2: 如果有类型错误，修复并重新检查**

根据错误信息修复类型问题，然后重新运行 `pnpm typecheck:vue`

---

## Task 5: 测试验证

**Files:**
- 无文件变更，仅验证

- [ ] **Step 1: 启动前端开发服务器**

Run: `pnpm dev:frontend`
Expected: 前端服务启动成功，显示本地访问 URL

- [ ] **Step 2: 手动测试功能**

在浏览器中访问广告位管理页面，验证：
1. 卡片网格布局正常显示
2. 轮播预览正常工作
3. 搜索功能正常
4. 分页功能正常
5. 编辑、删除、启用/禁用功能正常

- [ ] **Step 3: 停止开发服务器**

按 `Ctrl+C` 停止开发服务器

---

## Task 6: 清理和提交

**Files:**
- 无文件变更，仅清理

- [ ] **Step 1: 删除备份文件**

Run: `rm packages/extensions/extension-ad/src/frontend/src/views/placement/Index.vue.bak`

- [ ] **Step 2: 提交代码**

Run: `git add packages/extensions/extension-ad/src/frontend/src/components/ad-placement-card/Index.vue packages/extensions/extension-ad/src/frontend/src/views/placement/Index.vue packages/extensions/extension-ad/src/frontend/src/components/ad-placement-detail/Index.vue`
Run: `git commit -m "feat(ad): 将广告位列表改为卡片展示，支持轮播预览"`
Expected: 提交成功

---

## 验收标准

- [ ] 广告位以卡片形式展示，布局整齐美观
- [ ] 卡片内轮播预览正常工作
- [ ] 所有操作功能正常（编辑、删除、启用/禁用）
- [ ] 搜索和分页功能正常
- [ ] 代码通过 TypeScript 类型检查
- [ ] 代码符合项目编码规范
