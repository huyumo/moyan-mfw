<!--
/**
 * @fileoverview 广告位卡片组件
 * @description 以卡片形式展示广告位信息，含轮播预览、基本信息和操作按钮
 */
-->
<template>
  <el-card class="ad-placement-card" shadow="hover">
    <div class="ad-placement-card__media">
      <el-carousel
        v-if="mediaAds.length > 0"
        :height="CAROUSEL_HEIGHT + 'px'"
        :autoplay="true"
        :interval="3000"
        indicator-position="none"
      >
        <el-carousel-item v-for="ad in mediaAds" :key="ad.id">
          <img
            v-if="ad.mediaType === 'image'"
            :src="getAdImageSrc(ad)"
            :alt="ad.title"
            class="ad-placement-card__image"
          />
          <video
            v-else-if="ad.mediaType === 'video'"
            :src="getAdVideoSrc(ad)"
            class="ad-placement-card__video"
            muted
            preload="metadata"
          />
        </el-carousel-item>
      </el-carousel>
      <div v-else class="ad-placement-card__empty">
        <el-icon :size="36"><Picture /></el-icon>
        <span>暂无广告</span>
      </div>
    </div>

    <div class="ad-placement-card__header">
      <span class="ad-placement-card__name">{{ placement.name }}</span>
    </div>

    <div class="ad-placement-card__body">
      <div class="ad-placement-card__row">
        <span class="ad-placement-card__label">编码</span>
        <span class="ad-placement-card__value">{{ placement.code }}</span>
      </div>
      <div class="ad-placement-card__row">
        <span class="ad-placement-card__label">尺寸</span>
        <span class="ad-placement-card__value">{{ placement.width }}:{{ placement.height }}</span>
        <el-tag :type="adCount > 0 ? 'success' : 'info'" size="small">广告 {{ adCount }}</el-tag>
      </div>
    </div>

    <div class="ad-placement-card__footer">
      <el-button type="info" size="small" @click="handleManageAds" data-testid="manage-ads-btn">
        管理广告
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
  (e: 'manage-ads', placement: AdPlacementResponseDto): void
  (e: 'edit', placement: AdPlacementResponseDto): void
  (e: 'delete', placement: AdPlacementResponseDto): void
}

const emit = defineEmits<Emits>()

defineOptions({ name: 'MfwAdPlacementCard' })

const CAROUSEL_HEIGHT = 180

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
</script>

<style scoped>
.ad-placement-card {
  display: flex;
  flex-direction: column;
  min-width: 340px;
}

.ad-placement-card__media {
  width: 100%;
  height: v-bind(CAROUSEL_HEIGHT + 'px');
  background: #f5f7fa;
  overflow: hidden;
}

.ad-placement-card__image,
.ad-placement-card__video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ad-placement-card__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
  gap: 8px;
  height: 100%;
}

.ad-placement-card__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px 0;
}

.ad-placement-card__name {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.ad-placement-card__body {
  padding: 8px 16px;
}

.ad-placement-card__row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  margin-bottom: 4px;
}

.ad-placement-card__row:last-child {
  margin-bottom: 0;
}

.ad-placement-card__label {
  color: var(--el-text-color-secondary);
  min-width: 28px;
}

.ad-placement-card__value {
  color: var(--el-text-color-regular);
  flex: 1;
}

.ad-placement-card__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  margin-top: auto;
}
</style>
