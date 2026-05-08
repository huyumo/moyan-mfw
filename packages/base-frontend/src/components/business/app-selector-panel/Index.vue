<!--
/**
 * @fileoverview 应用实例选择面板（纯 UI 组件）
 * @description 展示用户可访问的应用实例列表，支持选择操作。可用于登录页内嵌、抽屉等场景。
 */
-->
<template>
  <div class="app-selector-panel">
    <!-- 头部 -->
    <div class="panel-header">
      <h3 class="panel-title">选择应用实例</h3>
      <p class="panel-subtitle">请选择要进入的应用实例，不同应用实例的权限相互隔离</p>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="4" animated />
    </div>

    <!-- 空状态 -->
    <div v-else-if="apps.length === 0" class="empty-state">
      <el-empty description="暂无可用应用实例">
        <template #image>
          <el-icon class="empty-icon" :size="48">
            <Monitor />
          </el-icon>
        </template>
      </el-empty>
      <p class="empty-text">请联系管理员为您分配应用实例</p>
    </div>

    <!-- 应用列表 -->
    <div v-else class="app-list">
      <div
        v-for="app in apps"
        :key="app.appId"
        class="app-item"
        :class="{
          selected: selectedAppId === app.appId,
          disabled: app.disabled
        }"
        @click="!app.disabled && handleClick(app)"
        data-testid="app-selector-item"
      >
        <!-- 应用图标 -->
        <div v-if="!app.appLogo" class="app-icon placeholder">
          <el-icon :size="24">
            <Monitor />
          </el-icon>
        </div>
        <img v-else class="app-icon" :src="app.appLogo" :alt="app.appName" />

        <!-- 应用信息 -->
        <div class="app-info">
          <div class="app-name">
            {{ app.appName }}
            <el-tag
              v-if="app.role"
              class="role-tag"
              size="small"
              :type="app.isOwner ? 'warning' : 'info'"
            >
              {{ app.isOwner ? '拥有者' : '成员' }}
            </el-tag>
          </div>
          <div class="app-type">
            <el-icon :size="14">
              <OfficeBuilding />
            </el-icon>
            {{ app.appTypeName }}
          </div>
          <div class="app-code">编码: {{ app.appCode }}</div>
        </div>

        <!-- 选中图标 -->
        <el-icon v-if="selectedAppId === app.appId" class="check-icon">
          <Check />
        </el-icon>
      </div>
    </div>

    <!-- 底部提示 -->
    <div v-if="!loading && apps.length > 0" class="panel-footer">
      <p class="footer-tip">切换应用实例无需重新登录，权限将自动刷新</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Monitor, OfficeBuilding, Check } from '@element-plus/icons-vue'

defineOptions({ name: 'AppSelectorPanel' })

export interface AppListItem {
  appId: string
  appName: string
  appCode: string
  appLogo?: string
  isOwner: boolean
  role?: string
  appTypeName?: string
  disabled?: boolean
}

defineProps<{
  apps: AppListItem[]
  loading?: boolean
  selectedAppId?: string
}>()

const emit = defineEmits<{
  (e: 'select', app: AppListItem): void
}>()

function handleClick(app: AppListItem) {
  emit('select', app)
}
</script>

<style scoped lang="scss">
.app-selector-panel {
  .panel-header {
    text-align: center;
    margin-bottom: 24px;

    .panel-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin: 0 0 8px;
    }

    .panel-subtitle {
      font-size: 14px;
      color: var(--el-text-color-secondary);
      margin: 0;
    }
  }

  .app-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
    max-height: 400px;
    overflow-y: auto;
    padding: 4px;

    .app-item {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 16px;
      border: 1px solid var(--el-border-color-light);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover:not(.disabled) {
        border-color: var(--el-color-primary-light-5);
        background: var(--el-fill-color-light);
      }

      &.selected {
        border-color: var(--el-color-primary);
        background: var(--el-color-primary-light-9);
      }

      &.disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .app-icon {
        width: 48px;
        height: 48px;
        border-radius: 8px;
        object-fit: cover;
        background: var(--el-fill-color-light);
        flex-shrink: 0;

        &.placeholder {
          background: var(--el-color-primary-light-8);
          color: var(--el-color-primary);
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }

      .app-info {
        flex: 1;
        min-width: 0;

        .app-name {
          font-weight: 600;
          font-size: 15px;
          color: var(--el-text-color-primary);
          margin-bottom: 4px;
          display: flex;
          align-items: center;
          gap: 8px;

          .role-tag {
            font-size: 12px;
          }
        }

        .app-type {
          font-size: 13px;
          color: var(--el-text-color-regular);
          margin-bottom: 4px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .app-code {
          font-size: 12px;
          color: var(--el-text-color-placeholder);
        }
      }

      .check-icon {
        color: var(--el-color-primary);
        font-size: 20px;
        flex-shrink: 0;
      }
    }
  }

  .empty-state {
    padding: 40px 20px;
    text-align: center;

    .empty-icon {
      font-size: 48px;
      color: var(--el-text-color-placeholder);
      margin-bottom: 16px;
    }

    .empty-text {
      font-size: 14px;
      color: var(--el-text-color-secondary);
    }
  }

  .loading-state {
    padding: 40px 20px;
  }

  .panel-footer {
    margin-top: 20px;
    text-align: center;

    .footer-tip {
      font-size: 13px;
      color: var(--el-text-color-secondary);
      margin: 0;
    }
  }
}
</style>
