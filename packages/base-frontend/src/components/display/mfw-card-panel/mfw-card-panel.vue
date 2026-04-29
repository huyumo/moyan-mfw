<template>
  <div class="mfw-card-panel" :class="{ bordered: bordered }">
    <div class="card-header">
      <div 
        class="card-avatar" 
        :style="{ width: avatarSizePx, height: avatarSizePx }"
      >
        <img 
          v-if="imageSrc" 
          :src="imageSrc" 
          :alt="header.title"
        />
        <span v-else>{{ header.title?.charAt(0) }}</span>
      </div>
      <div class="card-header-info">
        <div>
          <span class="card-title">{{ header.title }}</span>
          <span v-if="header.subtitle" class="card-subtitle">{{ header.subtitle }}</span>
        </div>
        <div class="card-status">
          <el-tag 
            v-if="header.status" 
            :type="header.status.type || 'success'" 
            size="small"
          >
            {{ header.status.text || header.status.value }}
          </el-tag>
        </div>
      </div>
    </div>

    <div class="info-list">
      <div 
        v-for="item in items" 
        :key="item.key" 
        class="info-row"
      >
        <el-icon v-if="item.icon" class="row-icon">
          <component :is="item.icon" />
        </el-icon>
        <span class="row-label">{{ item.label }}</span>
        <span class="row-value">
          <slot 
            :name="item.key" 
            :value="getValue(item.key)" 
            :item="item" 
            :data="data"
          >
            {{ formatValue(item) }}
          </slot>
        </span>
      </div>
    </div>

    <slot name="extra" :data="data" />

    <div v-if="$slots.actions" class="card-actions">
      <slot name="actions" :data="data" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { CardPanelProps, CardPanelItem } from './types';

const props = withDefaults(defineProps<CardPanelProps>(), {
  bordered: false,
  loading: false,
  emptyText: '--',
});

defineOptions({ name: 'MfwCardPanel' });

const avatarSizePx = computed(() => {
  const size = props.header.avatarSize || 48;
  return `${size}px`;
});

const imageSrc = computed(() => {
  const image = props.header.image;
  if (!image) return undefined;
  return typeof image === 'string' ? image : image.src;
});

const getValue = (key: string): any => {
  return props.data?.[key];
};

const formatValue = (item: CardPanelItem): string => {
  const value = getValue(item.key);
  if (value === null || value === undefined || value === '') {
    return props.emptyText;
  }

  switch (item.format) {
    case 'date':
      if (!value) return props.emptyText;
      const d = new Date(value);
      if (isNaN(d.getTime())) return value;
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    case 'dict':
      const dict = item.formatOptions?.dict || [];
      const found = dict.find((d: any) => d.value === value);
      return found?.label || props.emptyText;
    case 'tag':
      return value;
    case 'image':
      return typeof value === 'string' ? value : value?.src || props.emptyText;
    case 'custom':
      return String(value);
    default:
      if (typeof value === 'object') {
        return value?.name || value?.typeName || value?.nickname || value?.username || props.emptyText;
      }
      return String(value);
  }
};
</script>

<style scoped lang="scss">
@import './style.scss';
</style>