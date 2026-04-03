<!--
/**
 * @fileoverview 应用类型详情页面
 * @description 显示应用类型基本信息和权限池配置
 */
-->
<template>
  <div class="app-type-detail">
    <!-- 页面头部 -->
    <div class="detail-header">
      <el-page-header @back="handleBack">
        <template #content>
          <span class="header-title">{{ appTypeData?.typeName || '加载中...' }}</span>
        </template>
        <template #extra>
          <el-tag :type="appTypeData?.typeStatus === STATUS.ENABLED ? 'success' : 'danger'" size="small">
            {{ appTypeData?.typeStatus === STATUS.ENABLED ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-page-header>
    </div>

    <!-- Tab 内容 -->
    <div class="detail-content">
      <el-tabs v-model="activeTab" class="detail-tabs">
        <!-- 基本信息 Tab -->
        <el-tab-pane label="基本信息" name="basic">
          <el-card v-loading="loading" class="info-card">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="类型名称">
                {{ appTypeData?.typeName || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="类型编码">
                {{ appTypeData?.typeCode || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="类型描述">
                {{ appTypeData?.typeDesc || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="图标">
                {{ appTypeData?.icon || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="支持多应用">
                <el-tag :type="appTypeData?.multiAppEnabled === STATUS.ENABLED ? 'success' : 'info'" size="small">
                  {{ appTypeData?.multiAppEnabled === STATUS.ENABLED ? '是' : '否' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="排序">
                {{ appTypeData?.sortOrder || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="创建时间">
                {{ appTypeData?.createdAt || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="更新时间">
                {{ appTypeData?.updateAt || '-' }}
              </el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-tab-pane>

        <!-- 权限池配置 Tab -->
        <el-tab-pane label="权限池配置" name="permission">
          <el-card v-loading="loading" class="permission-card">
            <div class="permission-placeholder">
              <el-empty description="权限池配置功能开发中...">
                <el-button type="primary" @click="handleConfigPermission">
                  配置权限池
                </el-button>
              </el-empty>
            </div>
          </el-card>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ApiAppTypeFindById } from '../../../apis/sys';
import type { AppTypeResponseDto } from '../../../apis/sys/schemas';

/** 状态常量 */
const STATUS = {
  ENABLED: 1,
  DISABLED: 0,
} as const;

defineOptions({ name: 'MfwAppTypeDetail' });

const route = useRoute();
const router = useRouter();

/** 当前激活的 Tab */
const activeTab = ref('basic');

/** 加载状态 */
const loading = ref(false);

/** 应用类型数据 */
const appTypeData = ref<AppTypeResponseDto | null>(null);

/** 获取应用类型详情 */
const fetchAppTypeDetail = async () => {
  const id = route.params.id as string;
  if (!id) {
    ElMessage.error('应用类型 ID 无效');
    return;
  }

  loading.value = true;
  try {
    const result = await new ApiAppTypeFindById({
      params: { id },
    });
    appTypeData.value = result;
  } catch (error) {
    ElMessage.error('获取应用类型详情失败');
    console.error('获取应用类型详情失败:', error);
  } finally {
    loading.value = false;
  }
};

/** 返回列表页 */
const handleBack = () => {
  router.push('/sys/app-type');
};

/** 配置权限池 */
const handleConfigPermission = () => {
  ElMessage.info('权限池配置功能即将上线');
};

/** 页面加载时获取数据 */
onMounted(() => {
  fetchAppTypeDetail();
});
</script>

<style scoped lang="scss">
.app-type-detail {
  padding: 20px;
  background: var(--mfw-surface-bg, #f5f7fa);
  min-height: 100%;
}

.detail-header {
  margin-bottom: 20px;
  padding: 16px 20px;
  background: var(--mfw-surface-bg, #fff);
  border-radius: 8px;
  box-shadow: var(--mfw-card-shadow, 0 2px 12px 0 rgba(0, 0, 0, 0.1));

  .header-title {
    font-size: 16px;
    font-weight: 500;
    color: var(--mfw-text-color, #303133);
  }
}

.detail-content {
  background: var(--mfw-surface-bg, #fff);
  border-radius: 8px;
  box-shadow: var(--mfw-card-shadow, 0 2px 12px 0 rgba(0, 0, 0, 0.1));
}

.detail-tabs {
  .el-tabs__header {
    margin: 0;
    padding: 0 20px;
    background: var(--mfw-surface-bg, #fff);
  }

  .el-tabs__content {
    padding: 20px;
  }
}

.info-card,
.permission-card {
  border: none;
  box-shadow: none;
}

.permission-placeholder {
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>