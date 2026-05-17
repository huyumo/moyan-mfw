# 广告卡片与广告位卡片UI优化实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 优化广告卡片和广告位卡片的UI展示，包括：按广告位比例显示、正确渲染媒体资源、信息hover显示、拖拽动画增强

**Architecture:** 
- 修改 `ad-card` 组件：基于广告位比例计算预览区高度，移除广告位名称/类型显示，添加hover显示信息效果
- 修改 `ad-placement-card` 组件：修复轮播预览区的图片/视频渲染，添加hover显示信息效果
- 修改 `ad-placement-detail` 组件：增强拖拽动画效果，调整卡片布局为1行1张

**Tech Stack:** Vue 3 + TypeScript + Element Plus + CSS3 Transitions

---

## 文件结构

| 文件 | 操作 | 职责 |
|------|------|------|
| `packages/extensions/extension-ad/src/frontend/src/components/ad-card/Index.vue` | 修改 | 广告卡片组件 - 修复媒体渲染、hover显示信息、按广告位比例 |
| `packages/extensions/extension-ad/src/frontend/src/components/ad-placement-card/Index.vue` | 修改 | 广告位卡片组件 - 修复轮播渲染、hover显示信息 |
| `packages/extensions/extension-ad/src/frontend/src/components/ad-placement-detail/Index.vue` | 修改 | 广告位详情抽屉 - 增强拖拽动画、1行1张布局 |

---

## Task 1: 修改广告卡片组件 (ad-card)

**Files:**
- Modify: `packages/extensions/extension-ad/src/frontend/src/components/ad-card/Index.vue`

### 需求分析

1. **按广告位比例显示**：需要接收广告位宽高作为props，计算预览区高度
2. **正确渲染媒体**：检查 `ImageResource` 和 `MediaResource` 的渲染逻辑
3. **移除广告位名称、类型**：删除信息区的广告位名称和媒体类型标签
4. **hover显示信息**：信息区默认隐藏，鼠标hover时显示

- [ ] **Step 1: 修改Props接口，添加广告位尺寸参数**

在 `ad-card/Index.vue` 中修改 Props 接口：

```typescript
interface Props {
  ad: AdResponseDto
  placementWidth?: number
  placementHeight?: number
}
```

- [ ] **Step 2: 修改预览区高度计算逻辑**

修改 `previewStyle` 计算属性，基于广告位比例而非图片比例：

```typescript
const previewStyle = computed(() => {
  if (props.placementWidth && props.placementHeight && props.placementHeight > 0) {
    const ratio = props.placementHeight / props.placementWidth
    const height = Math.min(280, Math.max(120, 320 * ratio))
    return { height: `${height}px` }
  }
  if (props.ad.mediaType === 'image' && imageMedia.value) {
    const ratio = imageMedia.value.height / imageMedia.value.width
    const height = Math.min(200, Math.max(120, 280 * ratio))
    return { height: `${height}px` }
  }
  return { height: '150px' }
})
```

- [ ] **Step 3: 修复媒体渲染逻辑**

确保图片使用 `object-fit: cover` 铺满预览区，视频显示视频封面或图标：

```vue
<template v-if="hasMedia">
  <img
    v-if="ad.mediaType === 'image' && imageMedia"
    :src="imageMedia.src"
    :alt="ad.title"
    class="media-image"
    data-testid="ad-media-image"
  />
  <video
    v-else-if="ad.mediaType === 'video' && videoMedia"
    :src="videoMedia.url"
    class="media-video"
    data-testid="ad-media-video"
    muted
    preload="metadata"
  />
</template>
```

- [ ] **Step 4: 移除广告位名称和媒体类型标签**

删除信息区中的广告位名称行和媒体类型标签：

```vue
<div class="info-section">
  <div class="info-row title-row">
    <span class="title-text">{{ ad.title }}</span>
  </div>
  <div class="info-row">
    <span class="label">状态：</span>
    <MfwDictFormat :value="ad.status" :dict="toItems(StatusDict)" as-tag />
  </div>
  <div v-if="ad.startTime || ad.endTime" class="info-row">
    <span class="label">有效期：</span>
    <span class="value time-range">{{ formatTimeRange }}</span>
  </div>
</div>
```

删除媒体类型标签：

```vue
<!-- 删除这段代码 -->
<el-tag
  :type="ad.mediaType === 'image' ? 'success' : 'warning'"
  size="small"
  class="media-type-tag"
>
  {{ ad.mediaType === 'image' ? '图片' : '视频' }}
</el-tag>
```

- [ ] **Step 5: 添加hover显示信息效果**

修改模板结构，将信息区和操作区包装在hover层：

```vue
<el-card class="ad-card" :body-style="{ padding: '0' }" shadow="hover">
  <div class="media-preview" :style="previewStyle">
    <template v-if="hasMedia">
      <img
        v-if="ad.mediaType === 'image' && imageMedia"
        :src="imageMedia.src"
        :alt="ad.title"
        class="media-image"
        data-testid="ad-media-image"
      />
      <video
        v-else-if="ad.mediaType === 'video' && videoMedia"
        :src="videoMedia.url"
        class="media-video"
        data-testid="ad-media-video"
        muted
        preload="metadata"
      />
    </template>
    <div v-else class="empty-media" data-testid="ad-media-empty">
      <el-icon :size="48"><Picture /></el-icon>
      <span>暂无媒体</span>
    </div>
  </div>
  
  <div class="hover-overlay">
    <div class="info-section">
      <div class="info-row title-row">
        <span class="title-text">{{ ad.title }}</span>
      </div>
      <div class="info-row">
        <span class="label">状态：</span>
        <MfwDictFormat :value="ad.status" :dict="toItems(StatusDict)" as-tag />
      </div>
      <div v-if="ad.startTime || ad.endTime" class="info-row">
        <span class="label">有效期：</span>
        <span class="value time-range">{{ formatTimeRange }}</span>
      </div>
    </div>
    <div class="action-section">
      <el-button
        :type="ad.status === STATUS.ENABLED ? 'warning' : 'success'"
        size="small"
        @click="handleToggleStatus"
        v-permission="{ value: ['编辑'] }"
      >
        {{ ad.status === STATUS.ENABLED ? '禁用' : '启用' }}
      </el-button>
      <el-button type="primary" size="small" @click="handleEdit" v-permission="{ value: ['编辑'] }">
        编辑
      </el-button>
      <el-button type="danger" size="small" @click="handleDelete" v-permission="{ value: ['删除'] }">
        删除
      </el-button>
    </div>
  </div>
</el-card>
```

- [ ] **Step 6: 添加hover样式**

```css
.ad-card {
  position: relative;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}

.ad-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.media-preview {
  width: 100%;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.media-image,
.media-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hover-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.4));
  color: #fff;
  transform: translateY(100%);
  transition: transform 0.3s ease;
}

.ad-card:hover .hover-overlay {
  transform: translateY(0);
}

.hover-overlay .info-section {
  padding: 12px 16px;
}

.hover-overlay .info-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
}

.hover-overlay .info-row:last-child {
  margin-bottom: 0;
}

.hover-overlay .title-row {
  margin-bottom: 12px;
}

.hover-overlay .title-text {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hover-overlay .label {
  color: rgba(255, 255, 255, 0.7);
  min-width: 60px;
  flex-shrink: 0;
}

.hover-overlay .value {
  color: #fff;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hover-overlay .time-range {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
}

.hover-overlay .action-section {
  padding: 12px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
```

- [ ] **Step 7: 验证类型检查通过**

Run: `pnpm typecheck:vue`
Expected: 无类型错误

---

## Task 2: 修改广告位卡片组件 (ad-placement-card)

**Files:**
- Modify: `packages/extensions/extension-ad/src/frontend/src/components/ad-placement-card/Index.vue`

### 需求分析

1. **修复轮播渲染**：确保图片正确显示，支持视频预览
2. **hover显示信息**：信息区默认隐藏，鼠标hover时显示
3. **图片铺满卡片**：使用 `object-fit: cover`

- [ ] **Step 1: 修复轮播预览区的媒体渲染**

修改轮播区域，支持图片和视频：

```vue
<div class="carousel-wrapper" :style="carouselStyle">
  <el-carousel
    v-if="mediaAds.length > 0"
    :height="carouselHeight"
    :autoplay="true"
    :interval="3000"
    indicator-position="none"
  >
    <el-carousel-item v-for="ad in mediaAds" :key="ad.id">
      <img
        v-if="ad.mediaType === 'image'"
        :src="getAdImageSrc(ad)"
        :alt="ad.title"
        class="ad-image"
      />
      <video
        v-else-if="ad.mediaType === 'video'"
        :src="getAdVideoSrc(ad)"
        class="ad-video"
        muted
        preload="metadata"
      />
    </el-carousel-item>
  </el-carousel>
  <div v-else class="empty-placeholder">
    <el-icon :size="48"><Picture /></el-icon>
    <span>暂无广告</span>
  </div>
</div>
```

- [ ] **Step 2: 添加视频资源获取函数**

```typescript
const mediaAds = computed(() => {
  return props.ads.filter(ad => ad.media && (ad.mediaType === 'image' || ad.mediaType === 'video'))
})

const getAdVideoSrc = (ad: AdResponseDto): string => {
  if (ad.mediaType === 'video' && ad.media) {
    return (ad.media as MediaResource).url
  }
  return ''
}
```

- [ ] **Step 3: 添加 MediaResource 类型导入**

```typescript
import type { AdPlacementResponseDto, AdResponseDto, ImageResource, MediaResource } from '../../apis/ad/schemas'
```

- [ ] **Step 4: 修改为hover显示信息**

将信息区和操作区包装在hover层：

```vue
<el-card class="ad-placement-card" :body-style="{ padding: '0' }" shadow="hover">
  <div class="carousel-wrapper" :style="carouselStyle">
    <!-- 轮播内容 -->
  </div>
  
  <div class="hover-overlay">
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
        <MfwDictFormat :value="placement.status" :dict="toItems(StatusDict)" as-tag />
      </div>
    </div>
    <div class="action-section">
      <!-- 操作按钮 -->
    </div>
  </div>
</el-card>
```

- [ ] **Step 5: 添加hover样式**

```css
.ad-placement-card {
  position: relative;
  overflow: hidden;
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

.ad-image,
.ad-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hover-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.4));
  color: #fff;
  transform: translateY(100%);
  transition: transform 0.3s ease;
}

.ad-placement-card:hover .hover-overlay {
  transform: translateY(0);
}

.hover-overlay .info-section {
  padding: 12px 16px;
}

.hover-overlay .info-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
}

.hover-overlay .label {
  color: rgba(255, 255, 255, 0.7);
  min-width: 60px;
}

.hover-overlay .value {
  color: #fff;
  flex: 1;
}

.hover-overlay .action-section {
  padding: 12px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
```

- [ ] **Step 6: 验证类型检查通过**

Run: `pnpm typecheck:vue`
Expected: 无类型错误

---

## Task 3: 修改广告位详情抽屉组件 (ad-placement-detail)

**Files:**
- Modify: `packages/extensions/extension-ad/src/frontend/src/components/ad-placement-detail/Index.vue`

### 需求分析

1. **1行1张布局**：修改卡片网格为单列布局
2. **增强拖拽动画**：增加动画时长和效果
3. **传递广告位尺寸给卡片**：让卡片按比例显示

- [ ] **Step 1: 修改卡片网格布局为1行1张**

```css
.ad-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 100px;
}

.ad-grid > * {
  width: 100%;
  max-width: 400px;
}
```

- [ ] **Step 2: 增强拖拽动画效果**

修改 `vuedraggable` 配置：

```vue
<draggable
  v-model="ads"
  class="ad-grid"
  item-key="id"
  animation="300"
  ghost-class="ghost-card"
  chosen-class="chosen-card"
  drag-class="drag-card"
  @end="handleDragEnd"
>
```

添加动画样式：

```css
.ghost-card {
  opacity: 0.5;
  background: #c8ebfb;
  border-radius: 8px;
}

.chosen-card {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transform: scale(1.02);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.drag-card {
  opacity: 0.9;
  transform: rotate(2deg);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
}
```

- [ ] **Step 3: 传递广告位尺寸给广告卡片**

```vue
<template #item="{ element }">
  <MfwAdCard
    :ad="element"
    :placement-width="placementInfoRef.width"
    :placement-height="placementInfoRef.height"
    @edit="handleEditAd"
    @delete="handleDeleteAd"
    @toggle-status="handleToggleAdStatus"
  />
</template>
```

- [ ] **Step 4: 验证类型检查通过**

Run: `pnpm typecheck:vue`
Expected: 无类型错误

---

## Task 4: 修改广告位列表页面传递尺寸

**Files:**
- Modify: `packages/extensions/extension-ad/src/frontend/src/views/placement/Index.vue`

### 需求分析

广告位列表页面的卡片也需要传递尺寸给 `MfwAdPlacementCard`，但由于广告位卡片本身就知道自己的尺寸，所以不需要额外修改。

- [ ] **Step 1: 验证现有代码是否正确传递尺寸**

检查 `Index.vue` 中 `MfwAdPlacementCard` 的使用：

```vue
<MfwAdPlacementCard
  v-for="placement in placements"
  :key="placement.id"
  :placement="placement"
  :ads="placementAds[placement.id] || []"
  :ad-count="placementAdCounts[placement.id] || 0"
  @manage-ads="handleManageAds"
  @edit="handleEdit"
  @delete="handleDelete"
  @toggle-status="handleToggleStatus"
/>
```

`placement` 对象已包含 `width` 和 `height`，组件内部可直接使用。

---

## Task 5: 最终验证

- [ ] **Step 1: 运行类型检查**

Run: `pnpm typecheck:vue`
Expected: 无类型错误

- [ ] **Step 2: 启动前端开发服务器验证效果**

Run: `pnpm dev:frontend`
Expected: 前端服务正常启动

- [ ] **Step 3: 手动验证功能**

1. 访问广告位管理页面，验证卡片展示效果
2. 验证图片/视频正确渲染
3. 验证hover显示信息效果
4. 进入广告位详情，验证拖拽动画效果

---

## 验收标准

1. 广告卡片按广告位比例显示，图片铺满预览区
2. 图片和视频正确渲染
3. 卡片信息默认隐藏，hover时显示
4. 拖拽动画流畅美观
5. 广告位卡片轮播正确显示图片/视频
6. 代码通过 TypeScript 类型检查
7. 代码符合项目编码规范
