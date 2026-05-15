<!--
/**
 * @fileoverview Ӧ�����Ϳ�Ƭ���
 * @description ����Ӧ�����͹���ҳ��Ŀ�Ƭչʾ
 */
-->
<template>
  <el-card class="app-type-card" shadow="hover">
    <div class="app-type-card__header">
      <div class="app-type-card__icon">
        <el-icon v-if="currentIcon" size="24">
          <component :is="currentIcon" />
        </el-icon>
        <span v-else class="icon-text">??</span>
      </div>
      <div class="app-type-card__title-area">
        <h3 class="app-type-card__title">{{ data.typeName }}</h3>
        <span class="app-type-card__code">{{ data.typeCode }}</span>
      </div>
    </div>

    <div class="app-type-card__body">
      <p class="app-type-card__desc">{{ data.typeDesc || '��������' }}</p>
      <div class="app-type-card__tags">
        <MfwDictFormat :value="data.typeStatus" :dict="toItems(StatusDict)" as-tag />
        <MfwDictFormat :value="data.multiAppEnabled" :dict="toItems(MultiAppEnabledDict)" as-tag />
      </div>
    </div>

    <div class="app-type-card__footer">
      <span class="app-type-card__meta">{{ data.builtinRoleCount ?? 0 }} �����ý�ɫ</span>
      <div class="app-type-card__actions">
        <el-button type="primary" size="small" data-testid="app-type-edit-btn" v-permission="{ value: ['�༭'] }" @click="$emit('edit', data)">�༭</el-button>
        <el-button size="small" data-testid="app-type-permission-btn" v-permission="{ value: ['Ȩ�޳�'] }" @click="$emit('permission', data)">Ȩ�޳�</el-button>
        <el-button size="small" data-testid="app-type-role-btn" v-permission="{ value: ['���ý�ɫ'] }" @click="$emit('role', data)">���ý�ɫ</el-button>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ElIcon } from 'element-plus';
import * as IconMap from '@element-plus/icons-vue';
import type { AppTypeResponseDto } from '../../../../apis/sys/schemas';
import { MfwDictFormat } from '../../../../components';
import { toItems, StatusDict, MultiAppEnabledDict } from '../../../../../shared/src';

defineOptions({ name: 'AppTypeCard' });

const props = defineProps<{
  data: AppTypeResponseDto;
}>();

defineEmits<{
  (e: 'edit', data: AppTypeResponseDto): void;
  (e: 'permission', data: AppTypeResponseDto): void;
  (e: 'role', data: AppTypeResponseDto): void;
}>();

const currentIcon = computed(() => {
  const iconName = props.data.icon;
  if (!iconName) return null;
  return (IconMap as any)[iconName] || null;
});
</script>

<style scoped lang="scss">
.app-type-card {
  width: 100%;
  display: flex;
  flex-direction: column;

  &__header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }

  &__icon {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #409eff, #67c23a);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex-shrink: 0;

    .icon-text {
      font-size: 20px;
      color: white;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
    }
  }

  &__title-area {
    flex: 1;
    min-width: 0;
    overflow: hidden;
  }

  &__title {
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin: 0 0 4px 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__code {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__body {
    flex: 1;
    margin-bottom: 16px;
    min-width: 0;
  }

  &__desc {
    font-size: 14px;
    color: var(--el-text-color-regular);
    line-height: 1.5;
    margin: 0 0 12px 0;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    min-height: 42px;
  }

  &__tags {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  &__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 16px;
    border-top: 1px solid var(--el-border-color-lighter);
  }

  &__meta {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    white-space: nowrap;
  }

  &__actions {
    display: flex;
    gap: 8px;
  }
}
</style>
