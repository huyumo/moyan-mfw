<!--
/**
 * @fileoverview 广告卡片组件
 * @description 展示广告信息，支持图片/视频预览和操作按钮
 */
-->
<template>
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
        <div v-else class="video-preview" data-testid="ad-media-video">
          <el-icon :size="48"><VideoPlay /></el-icon>
          <span class="video-name">{{ videoMedia?.name || '视频' }}</span>
        </div>
      </template>
      <div v-else class="empty-media" data-testid="ad-media-empty">
        <el-icon :size="48"><Picture /></el-icon>
        <span>暂无媒体</span>
      </div>
      <el-tag
        :type="ad.mediaType === 'image' ? 'success' : 'warning'"
        size="small"
        class="media-type-tag"
        data-testid="ad-media-type"
      >
        {{ ad.mediaType === 'image' ? '图片' : '视频' }}
      </el-tag>
    </div>

    <div class="info-section">
      <div class="info-row title-row">
        <span class="title-text">{{ ad.title }}</span>
      </div>
      <div class="info-row">
        <span class="label">广告位：</span>
        <span class="value">{{ ad.placement?.name || '-' }}</span>
      </div>
      <div class="info-row">
        <span class="label">状态：</span>
        <MfwDictFormat :value="ad.status" :dict="toItems(StatusDict)" as-tag />
      </div>
      <div v-if="ad.startTime || ad.endTime" class="info-row">
        <span class="label">有效期：</span>
        <span class="value time-range">
          {{ formatTimeRange }}
        </span>
      </div>
    </div>

    <div class="action-section">
      <el-button
        :type="ad.status === STATUS.ENABLED ? 'warning' : 'success'"
        size="small"
        @click="handleToggleStatus"
        v-permission="{ value: ['编辑'] }"
        data-testid="ad-toggle-status-btn"
      >
        {{ ad.status === STATUS.ENABLED ? '禁用' : '启用' }}
      </el-button>
      <el-button
        type="primary"
        size="small"
        @click="handleEdit"
        v-permission="{ value: ['编辑'] }"
        data-testid="ad-edit-btn"
      >
        编辑
      </el-button>
      <el-button
        type="danger"
        size="small"
        @click="handleDelete"
        v-permission="{ value: ['删除'] }"
        data-testid="ad-delete-btn"
      >
        删除
      </el-button>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Picture, VideoPlay } from '@element-plus/icons-vue'
import { StatusDict, toItems } from 'moyan-mfw-base/shared'
import { MfwDictFormat } from 'moyan-mfw-base/frontend'
import type { AdResponseDto, ImageResource, MediaResource } from '../../apis/ad/schemas'

interface Props {
  ad: AdResponseDto
}

const props = defineProps<Props>()

interface Emits {
  (e: 'edit', ad: AdResponseDto): void
  (e: 'delete', ad: AdResponseDto): void
  (e: 'toggle-status', ad: AdResponseDto): void
}

const emit = defineEmits<Emits>()

defineOptions({ name: 'MfwAdCard' })

const STATUS = { ENABLED: StatusDict.ENABLED, DISABLED: StatusDict.DISABLED }

const hasMedia = computed(() => {
  return props.ad.media && (
    (props.ad.mediaType === 'image' && (props.ad.media as ImageResource).src) ||
    (props.ad.mediaType === 'video' && (props.ad.media as MediaResource).url)
  )
})

const imageMedia = computed(() => {
  if (props.ad.mediaType === 'image') {
    return props.ad.media as ImageResource
  }
  return null
})

const videoMedia = computed(() => {
  if (props.ad.mediaType === 'video') {
    return props.ad.media as MediaResource
  }
  return null
})

const previewStyle = computed(() => {
  if (props.ad.mediaType === 'image' && imageMedia.value) {
    const ratio = imageMedia.value.height / imageMedia.value.width
    const height = Math.min(200, Math.max(120, 280 * ratio))
    return { height: `${height}px` }
  }
  return { height: '150px' }
})

const formatTimeRange = computed(() => {
  const start = props.ad.startTime ? new Date(props.ad.startTime).toLocaleDateString() : ''
  const end = props.ad.endTime ? new Date(props.ad.endTime).toLocaleDateString() : ''
  if (start && end) return `${start} ~ ${end}`
  if (start) return `${start} 起`
  if (end) return `至 ${end}`
  return ''
})

const handleToggleStatus = () => {
  emit('toggle-status', props.ad)
}

const handleEdit = () => {
  emit('edit', props.ad)
}

const handleDelete = () => {
  emit('delete', props.ad)
}
</script>

<style scoped>
.ad-card {
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
  position: relative;
}

.media-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.video-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
  gap: 8px;
}

.video-name {
  font-size: 12px;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-media {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
  gap: 8px;
}

.media-type-tag {
  position: absolute;
  top: 8px;
  right: 8px;
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

.title-row {
  margin-bottom: 12px;
}

.title-text {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.info-row .label {
  color: #909399;
  min-width: 60px;
  flex-shrink: 0;
}

.info-row .value {
  color: #303133;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.time-range {
  font-size: 12px;
  color: #606266;
}

.action-section {
  padding: 12px 16px;
  border-top: 1px solid #ebeef5;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
