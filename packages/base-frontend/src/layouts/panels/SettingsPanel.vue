<!--
 * @fileoverview 偏好设置面板组件
-->
<template>
  <el-drawer
    v-model="drawerVisible"
    :title="text.title"
    :size="isMobile ? '92%' : 460"
    direction="rtl"
    destroy-on-close
    :modal-class="'mfw-admin-settings-modal'"
    class="mfw-admin-settings-drawer"
  >
    <div class="mfw-admin-settings-body">
      <div class="mfw-admin-settings-subtitle">{{ text.subtitle }}</div>
      <el-scrollbar class="mfw-admin-settings-scroll">
        <el-tabs v-model="activeTab" class="mfw-admin-settings-tabs">
          <el-tab-pane :label="text.layout" name="layout">
            <div class="mfw-admin-settings-group">
              <div class="mfw-admin-settings-group-title">
                <el-icon><Menu /></el-icon><span>{{ text.layoutMode }}</span>
              </div>
              <div class="mfw-admin-layout-mode-grid">
                <button
                  v-for="option in layoutModeOptions"
                  :key="option.value"
                  class="mfw-admin-layout-mode-card"
                  :class="{ 'is-active': draftStyleConfig.layoutMode === option.value }"
                  type="button"
                  @click="draftStyleConfig.layoutMode = option.value"
                >
                  <div class="mfw-admin-layout-mode-icon"><LayoutModeIcon :mode="option.value" /></div>
                  <div class="mfw-admin-layout-mode-label">{{ option.label }}</div>
                </button>
              </div>
            </div>
            <div class="mfw-admin-settings-group">
              <div class="mfw-admin-settings-group-title">
                <el-icon><Expand /></el-icon><span>{{ text.dimensions }}</span>
              </div>
              <el-form-item v-if="showSidebarInDraft" :label="text.sidebarWidth"
                ><el-slider v-model="draftStyleConfig.sidebarWidth" :min="200" :max="320" show-input
              /></el-form-item>
              <el-form-item :label="text.headerHeight"
                ><el-slider v-model="draftStyleConfig.headerHeight" :min="56" :max="96" show-input
              /></el-form-item>
              <el-form-item :label="text.contentMaxWidth"
                ><el-slider v-model="draftStyleConfig.contentMaxWidth" :min="1080" :max="1720" show-input
              /></el-form-item>
              <el-form-item :label="text.cardRadius"
                ><el-slider v-model="draftStyleConfig.cardRadius" :min="6" :max="24" show-input
              /></el-form-item>
            </div>
          </el-tab-pane>
          <el-tab-pane :label="text.general" name="general">
            <div class="mfw-admin-settings-group">
              <div class="mfw-admin-settings-group-title">
                <el-icon><Setting /></el-icon><span>{{ text.featureToggle }}</span>
              </div>
              <div class="mfw-admin-switch-list">
                <div class="mfw-admin-switch-item">
                  <span class="mfw-admin-switch-label">{{ text.showTabs }}</span
                  ><el-switch v-model="draftStyleConfig.showTabs" />
                </div>
                <div class="mfw-admin-switch-item">
                  <span class="mfw-admin-switch-label">{{ text.showBreadcrumb }}</span
                  ><el-switch v-model="draftStyleConfig.showBreadcrumb" />
                </div>
                <div v-if="showSidebarInDraft" class="mfw-admin-switch-item">
                  <span class="mfw-admin-switch-label">{{ text.compactSidebar }}</span
                  ><el-switch v-model="draftStyleConfig.compact" />
                </div>
                <div class="mfw-admin-switch-item">
                  <span class="mfw-admin-switch-label">{{ text.fixedHeader }}</span
                  ><el-switch v-model="draftStyleConfig.fixedHeader" />
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-scrollbar>
      <div class="mfw-admin-settings-actions">
        <el-button class="mfw-admin-settings-cancel" @click="drawerVisible = false">{{ text.cancel }}</el-button>
        <el-button
          class="mfw-admin-settings-save"
          type="primary"
          @click="handleSaveSettings"
          :disabled="!hasUnsavedChanges"
          ><el-icon><Check /></el-icon>{{ text.save }}</el-button
        >
        <el-button class="mfw-admin-settings-reset" type="danger" plain @click="emit('reset-defaults')"
          ><el-icon><RefreshLeft /></el-icon>{{ text.reset }}</el-button
        >
      </div>
    </div>
  </el-drawer>
</template>
<script setup lang="ts">
import {
  Check,
  Expand,
  Menu,
  RefreshLeft,
  Setting,
} from '@element-plus/icons-vue';
import { computed, reactive, ref, watch, type PropType } from 'vue';
import LayoutModeIcon from '../components/layout/LayoutModeIcon.vue';
import type { LayoutMode, LayoutStyleConfig } from '../../types/layout-types';
import { settingsPanelText as text } from './settings-panel-text';
const props = defineProps({
  modelValue: { type: Boolean, required: true },
  isMobile: { type: Boolean, required: true },
  layoutModeOptions: { type: Array as PropType<Array<{ label: string; value: LayoutMode }>>, required: true },
  styleConfig: { type: Object as PropType<LayoutStyleConfig>, required: true },
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'preview-change', payload: Partial<LayoutStyleConfig>): void;
  (e: 'save-settings', payload: LayoutStyleConfig): void;
  (e: 'reset-defaults'): void;
}>();
const activeTab = ref('layout');
const syncingDraft = ref(false);
const openingSnapshot = ref<LayoutStyleConfig | null>(null);
const draftStyleConfig = reactive<LayoutStyleConfig>({ ...props.styleConfig });
const showSidebarInDraft = computed(() => draftStyleConfig.layoutMode !== 'top');
const hasUnsavedChanges = computed(() =>
  openingSnapshot.value ? JSON.stringify(draftStyleConfig) !== JSON.stringify(openingSnapshot.value) : false,
);
const drawerVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) {
      return;
    }
    activeTab.value = 'layout';
    openingSnapshot.value = { ...props.styleConfig };
    syncingDraft.value = true;
    Object.assign(draftStyleConfig, props.styleConfig);
    queueMicrotask(() => {
      syncingDraft.value = false;
    });
  },
  { immediate: true },
);

watch(
  draftStyleConfig,
  () => {
    if (!props.modelValue || syncingDraft.value) {
      return;
    }
    emit('preview-change', { ...draftStyleConfig });
  },
  { deep: true },
);

function handleSaveSettings() {
  emit('save-settings', { ...draftStyleConfig });
}
</script>
