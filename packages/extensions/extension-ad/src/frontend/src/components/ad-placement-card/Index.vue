<!--
/**
 * @fileoverview 广告位卡片组件
 * @description 展示广告位信息，支持轮播预览广告效果，hover时显示信息和操作按钮
 */
-->
<template>
  <el-card class="ad-placement-card" :body-style="{ padding: '0' }" shadow="hover">
    <div class="carousel-wrapper" :style="carouselStyle">
      <el-carousel
        v-if="mediaAds.length > 0"
        :height="carouselHeight + 'px'"
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
        <el-button
          type="info"
          size="small"
          @click="handleManageAds"
          data-testid="manage-ads-btn"
        >
          管理广告
        </el-button>
        <el-button
          :type="placement.status === STATUS.ENABLED ? 'warning' : 'success'"
          size="small"
          @click="handleToggleStatus"
          v-permission="{ value: ['编辑'] }"
          data-testid="toggle-status-btn"
        >
          {{ placement.status === STATUS.ENABLED ? '禁用' : '启用' }}
        </el-button>
        <el-button
          type="primary"
          size="small"
          @click="handleEdit"
          v-permission="{ value: ['编辑'] }"
          data-testid="edit-btn"
        >
          编辑
        </el-button>
        <el-button
          type="danger"
          size="small"
          @click="handleDelete"
          v-permission="{ value: ['删除'] }"
          data-testid="delete-btn"
        >
          删除
        </el-button>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Picture } from '@element-plus/icons-vue'
import { StatusDict, toItems } from 'moyan-mfw-base/shared'
import { MfwDictFormat } from 'moyan-mfw-base/frontend'
import type { ImageResource, MediaResource } from 'moyan-mfw-base/frontend'
import type { AdPlacementResponseDto, AdResponseDto } from '../../apis/ad/schemas'

interface Props {
  placement: AdPlacementResponseDto
  ads: AdResponseDto[]
  adCount: number
}

const props = defineProps<Props>()

interface Emits {
  (e: 'manage-ads', placement: AdPlacementResponseDto): void
  (e: 'edit', placement: AdPlacementResponseDto): void
  (e: 'delete', placement: AdPlacementResponseDto): void
  (e: 'toggle-status', placement: AdPlacementResponseDto): void
}

const emit = defineEmits<Emits>()

defineOptions({ name: 'MfwAdPlacementCard' })

const STATUS = { ENABLED: StatusDict.ENABLED, DISABLED: StatusDict.DISABLED }

const carouselHeight = computed(() => {
  const ratio = props.placement.height / props.placement.width
  const calculatedHeight = 280 * ratio
  return Math.min(250, Math.max(150, calculatedHeight))
})

const carouselStyle = computed(() => ({
  height: `${carouselHeight.value}px`
}))

const mediaAds = computed(() => {
  return props.ads.filter(ad => {
    if (!ad.media || typeof ad.media !== 'object') return false
    const media = ad.media as Record<string, unknown>
    if (Object.keys(media).length === 0) return false
    if (ad.mediaType === 'image' && media.src) return true
    if (ad.mediaType === 'video' && media.url) return true
    return false
  })
})

const getAdImageSrc = (ad: AdResponseDto): string => {
  if (ad.mediaType === 'image' && ad.media && typeof ad.media === 'object') {
    const media = ad.media as Record<string, unknown>
    if (media.src) return media.src as string
  }
  return ''
}

const getAdVideoSrc = (ad: AdResponseDto): string => {
  if (ad.mediaType === 'video' && ad.media && typeof ad.media === 'object') {
    const media = ad.media as Record<string, unknown>
    if (media.url) return media.url as string
  }
  return ''
}

const handleManageAds = () => {
  emit('manage-ads', props.placement)
}

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
  overflow: hidden;
}

.ad-image,
.ad-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.empty-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
  gap: 8px;
  height: 100%;
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

.hover-overlay .info-row:last-child {
  margin-bottom: 0;
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
</style>
