# 广告位卡片展示与轮播预览设计文档

## 概述

本文档描述广告位管理功能的 UI 改造设计，将原有的表格展示改为卡片展示，并支持在卡片内直接轮播预览广告效果。

## 背景

当前广告位管理使用表格展示，无法直观预览广告位效果。用户需要：

* 直观查看广告位的前端呈现效果

* 快速预览广告位下的广告内容（轮播）

* 在卡片上直接进行操作

## 设计目标

1. **卡片展示**：将广告位列表从表格改为卡片网格布局
2. **轮播预览**：卡片内直接展示广告位下的广告图片轮播效果
3. **信息完整**：卡片展示尺寸、状态、广告数量、编码等关键信息
4. **操作便捷**：卡片上直接提供编辑、删除、启用/禁用等操作按钮

## 架构设计

### 组件结构

```
views/placement/Index.vue (主页面)
├── MfwPageWrapper (页面容器)
│   ├── 搜索栏 (保留现有)
│   ├── 新建按钮 (保留现有)
│   └── 卡片网格区域 (新增)
│       └── AdPlacementCard (新组件)
│           ├── 轮播预览区 (el-carousel)
│           ├── 信息展示区 (尺寸、状态、广告数量、编码)
│           └── 操作按钮区 (编辑、删除、启用/禁用)
└── MfwAdPlacementDetail (详情抽屉，保留)
```

### 文件变更

| 文件                                       | 操作 | 说明        |
| ---------------------------------------- | -- | --------- |
| `views/placement/Index.vue`              | 修改 | 从表格改为卡片网格 |
| `components/ad-placement-card/Index.vue` | 新增 | 广告位卡片组件   |

## 详细设计

### 1. 卡片组件 (AdPlacementCard)

#### 1.1 组件结构

```vue
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
```

#### 1.2 Props 定义

```typescript
import type { AdPlacementResponseDto, AdResponseDto } from '../../apis/ad/schemas'

interface Props {
  placement: AdPlacementResponseDto
  ads: AdResponseDto[]
  adCount: number
}
```

#### 1.3 事件定义

```typescript
import type { AdPlacementResponseDto } from '../../apis/ad/schemas'

interface Emits {
  (e: 'edit', placement: AdPlacementResponseDto): void
  (e: 'delete', placement: AdPlacementResponseDto): void
  (e: 'toggle-status', placement: AdPlacementResponseDto): void
}
```

#### 1.4 权限控制

项目使用 **BigInt 位运算权限系统**，前端权限指令支持两种用法：

**推荐用法（权限值检查）：**

```vue
<el-button v-permission="{ value: ['添加'] }">新建</el-button>
<el-button v-permission="{ value: ['编辑'] }">编辑</el-button>
<el-button v-permission="{ value: ['删除'] }">删除</el-button>
```

**权限值说明：**

* `['添加']` - 对应后端 `permissionValue: ['添加']`

* `['编辑']` - 对应后端 `permissionValue: ['编辑']`

* `['删除']` - 对应后端 `permissionValue: ['删除']`

**后端权限定义（参考）：**

```typescript
@RequirePermission({ permCode: 'ext:ad:*', permissionValue: ['添加'] })
```

**注意：** 现有代码使用字符串形式 `v-permission="'添加'"`，本次改造将统一使用推荐的对象形式。

#### 1.5 轮播预览区设计

**高度计算逻辑：**

* 根据广告位实际尺寸比例计算轮播高度

* 最小高度：150px

* 最大高度：250px

* 默认高度：200px（当无法计算时）

**Computed 实现：**

```typescript
const carouselHeight = computed(() => {
  const ratio = props.placement.height / props.placement.width
  const calculatedHeight = 280 * ratio // 基于卡片宽度 280px
  return Math.min(250, Math.max(150, calculatedHeight))
})

const carouselStyle = computed(() => ({
  height: `${carouselHeight.value}px`
}))
```

**样式设计：**

```css
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
}
```

### 2. 主页面改造 (Index.vue)

#### 2.1 数据加载改造

**原有逻辑：**

* 使用 `MfwListPage` 组件加载广告位列表

* 点击行打开详情抽屉

**改造后：**

* 直接调用 API 加载广告位列表

* 为每个广告位加载广告内容（用于轮播预览）

* 使用分页组件控制数据量

#### 2.2 卡片网格布局

```vue
<template>
  <MfwPageWrapper>
    <template #header-extra>
      <el-button type="primary" @click="handleAdd" v-permission="'添加'">
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
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
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
      <AdPlacementCard
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
```

#### 2.3 样式设计

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.search-bar {
  margin-bottom: 20px;
  padding: 16px;
  background: #fff;
  border-radius: 4px;
}
```

### 3. 数据加载优化

#### 3.1 批量加载广告内容

为避免 N+1 查询问题，采用批量加载策略：

```typescript
const loadPlacements = async () => {
  loading.value = true
  try {
    const res = await new ApiAdPlacementFindAll({ 
      query: { 
        page: pagination.page, 
        pageSize: pagination.pageSize,
        ...searchForm 
      } 
    })
    placements.value = res.list || []
    pagination.total = res.total
    
    // 批量加载广告内容
    await loadAdsForPlacements(placements.value.map(p => p.id))
  } finally {
    loading.value = false
  }
}

const loadAdsForPlacements = async (placementIds: string[]) => {
  const promises = placementIds.map(id => 
    new ApiAdFindAll({ query: { page: 1, pageSize: 10, placementId: id, status: 1 } })
  )
  const results = await Promise.all(promises)
  
  placementIds.forEach((id, index) => {
    placementAds.value[id] = results[index].list || []
    placementAdCounts.value[id] = results[index].total || 0
  })
}
```

## 技术要点

### 1. 轮播预览实现

* 使用 Element Plus 的 `el-carousel` 组件

* 自动播放间隔：3秒

* 不显示指示器（indicator-position="none"）

* 图片使用 `object-fit: contain` 保持比例

### 2. 响应式布局

* 使用 CSS Grid 实现响应式卡片布局

* 最小卡片宽度：280px

* 自动填充列数

### 3. 性能优化

* 分页加载广告位（默认每页 12 个）

* 批量加载广告内容（使用 Promise.all）

* 限制每个广告位加载的广告数量（最多 10 个用于预览）

## 测试要点

### 功能测试

1. **卡片展示**

   * 验证卡片正确显示广告位信息

   * 验证状态标签正确显示

   * 验证广告数量正确显示

2. **轮播预览**

   * 验证有广告时轮播正常工作

   * 验证无广告时显示占位符

   * 验证图片比例正确

3. **操作功能**

   * 验证编辑功能正常

   * 验证删除功能正常

   * 验证启用/禁用功能正常

4. **搜索和分页**

   * 验证搜索功能正常

   * 验证分页功能正常

### 性能测试

1. 加载 12 个广告位（每页默认）的性能
2. 批量加载广告内容的性能
3. 轮播动画的流畅性

## 风险与缓解

### 风险 1：广告位尺寸差异大导致卡片高度不一致

**缓解措施：**

* 设置轮播区域最小/最大高度

* 使用 `object-fit: contain` 保持图片比例

### 风险 2：大量广告内容加载影响性能

**缓解措施：**

* 分页加载广告位

* 限制每个广告位预览的广告数量（最多 10 个）

* 使用懒加载技术（可选）

## 实施计划

1. 创建 `AdPlacementCard` 组件
2. 改造 `Index.vue` 主页面
3. 实现数据加载逻辑
4. 添加样式
5. 测试验证

## 验收标准

1. 广告位以卡片形式展示，布局整齐美观
2. 卡片内轮播预览正常工作
3. 所有操作功能正常
4. 搜索和分页功能正常
5. 代码通过 TypeScript 类型检查
6. 代码符合项目编码规范

