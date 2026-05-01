<!--
/**
 * @fileoverview 图标选择面板组件
 * @description 在弹窗中显示的图标选择界面
 */
-->
<template>
  <div class="icon-picker-panel">
    <div class="icon-picker-search">
      <el-input
        v-model="searchValue"
        placeholder="搜索图标..."
        clearable
        prefix-icon="Search"
        data-testid="icon-picker-search"
      />
    </div>
    <el-scrollbar max-height="400px" class="icon-picker-scrollbar">
      <div
        class="icon-picker-grid"
        :style="{ gridTemplateColumns: `repeat(${panelColumns}, 1fr)` }"
      >
        <div
          v-for="icon in filteredIcons"
          :key="icon.name"
          class="icon-picker-item"
          :class="{ selected: selectedIcon === icon.name }"
          @click="handleSelect(icon.name)"
          data-testid="icon-picker-item"
        >
          <el-icon :size="panelIconSize">
            <component :is="getIconComponent(icon.name)" />
          </el-icon>
          <span class="icon-picker-item-name">{{ icon.name }}</span>
        </div>
      </div>
    </el-scrollbar>
    <div v-if="selectedIcon" class="icon-picker-footer">
      <el-tag size="small" type="info" data-testid="icon-picker-clear" @click="handleClear">
        清空
      </el-tag>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import * as IconMap from '@element-plus/icons-vue';
import type { IconItem } from './types';

defineOptions({ name: 'IconPickerPanel' });

interface Props {
  modelValue?: string;
  icons?: IconItem[];
  iconSize?: number | string;
  columns?: number;
  data?: any;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  icons: () => [],
  iconSize: 20,
  columns: 8,
  data: () => ({}),
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'change', value: string): void;
}>();

const searchValue = ref('');

// 从 data 中获取配置
const panelIconSize = computed(() => {
  if (props.data && props.data.iconSize !== undefined) {
    return props.data.iconSize;
  }
  return props.iconSize;
});

const panelColumns = computed(() => {
  if (props.data && props.data.columns !== undefined) {
    return props.data.columns;
  }
  return props.columns;
});

// 从 data 中获取初始值（优先），否则使用 modelValue
const getInitialValue = () => {
  if (props.data && props.data.modelValue !== undefined) {
    return props.data.modelValue;
  }
  return props.modelValue;
};

const selectedIcon = ref(getInitialValue());

const getIconComponent = (iconName: string) => {
  return (IconMap as any)[iconName] || null;
};

const filteredIcons = computed(() => {
  if (!searchValue.value) {
    // 优先使用 data.icons，否则使用 props.icons
    if (props.data && props.data.icons) {
      return props.data.icons;
    }
    return props.icons || [];
  }
  const keyword = searchValue.value.toLowerCase();
  const iconsList = (props.data && props.data.icons) || props.icons || [];
  return iconsList.filter((icon: IconItem) => {
    return (
      icon.name.toLowerCase().includes(keyword) ||
      (icon.tags && icon.tags.some((tag: string) => tag.toLowerCase().includes(keyword)))
    );
  });
});

const handleSelect = (iconName: string) => {
  selectedIcon.value = iconName;
};

const handleClear = () => {
  selectedIcon.value = '';
};

const onConfirm = () => {
  // 不需要在这里保存值，直接通过 ref 暴露出去
};

// 暴露 onConfirm 方法和 selectedIcon 值
defineExpose({ 
  onConfirm, 
  selectedIcon
});
</script>

<style scoped lang="scss">
.icon-picker-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  overflow-x: hidden;

  .icon-picker-search {
    width: 100%;
  }

  .icon-picker-scrollbar {
    flex: 1;
    width: 100%;
    
    :deep(.el-scrollbar__wrap) {
      overflow-x: hidden;
    }
  }

  .icon-picker-grid {
    display: grid;
    gap: 8px;
    width: 100%;
    box-sizing: border-box;
  }

  .icon-picker-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px 8px;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
    box-sizing: border-box;
    min-width: 0;

    &:hover {
      background: var(--el-color-primary-light-9);
    }

    &.selected {
      background: var(--el-color-primary-light-7);
    }
  }

  .icon-picker-item-name {
    margin-top: 6px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  .icon-picker-footer {
    display: flex;
    justify-content: flex-end;
    padding-top: 8px;
    border-top: 1px solid var(--el-border-color-lighter);
    width: 100%;
    box-sizing: border-box;
  }
}
</style>
