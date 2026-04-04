<!--
/**
 * @fileoverview PC 权限管理页面
 * @description 使用 PermissionManager 组件，API 调用已封装在组件内部
 */
-->
<template>
  <PermissionManager
    ref="managerRef"
    permission-type="PC"
    title="PC 权限树"
    @app-type-change="handleAppTypeChange"
  >
    <template #toolbar-extra>
      <el-button type="primary" @click="handleSync">
        <el-icon><Refresh /></el-icon>
        同步路由
      </el-button>
      <el-button @click="handleCompare">
        <el-icon><Search /></el-icon>
        检查差异
      </el-button>
    </template>
  </PermissionManager>

  <!-- 同步预览弹窗 -->
  <el-dialog
    v-model="syncDialog.visible"
    title="同步预览"
    width="700px"
    destroy-on-close
  >
    <el-table :data="syncDialog.details" border size="small">
      <el-table-column prop="type" label="类型" width="80">
        <template #default="{ row }">
          <el-tag
            :type="row.type === 'add' ? 'success' : row.type === 'update' ? 'warning' : 'info'"
            size="small"
          >
            {{ row.type === 'add' ? '新增' : row.type === 'update' ? '更新' : '跳过' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="permName" label="权限名称" min-width="150" />
      <el-table-column prop="permCode" label="权限编码" min-width="150" />
      <el-table-column prop="nodeType" label="节点类型" width="100" />
    </el-table>
    <template #footer>
      <el-button @click="syncDialog.visible = false">取消</el-button>
      <el-button type="primary" @click="confirmSync">确认同步</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Refresh, Search } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import PermissionManager from '../../../components/business/permission-manager/Index.vue';
import type { RouteNodeDto } from '../../../apis/sys/schemas';
import {
  ApiPermissionSyncPermissions,
  ApiPermissionComparePermissions,
} from '../../../apis/sys';

defineOptions({ name: 'MfwPcPermissionList' });

const router = useRouter();
const managerRef = ref<InstanceType<typeof PermissionManager>>();

// 同步弹窗状态
const syncDialog = ref({
  visible: false,
  details: [] as any[],
});

// 当前选中的应用类型
let currentAppTypeId = '';

// ========== 应用类型变化 ==========

const handleAppTypeChange = (appTypeId: string) => {
  currentAppTypeId = appTypeId;
};

// ========== PC 特有功能：路由同步 ==========

// 转换路由配置为 API 格式
const convertRoutesToApiFormat = (routes: RouteRecordRaw[]): RouteNodeDto[] => {
  const result: RouteNodeDto[] = [];

  for (const route of routes) {
    if (route.path === '' || route.path === '/' || !route.meta?.title) {
      if (route.children && route.children.length > 0) {
        result.push(...convertRoutesToApiFormat(route.children));
      }
      continue;
    }

    const node: RouteNodeDto = {
      path: route.path,
      name: route.meta.title as string,
    };

    if (route.children && route.children.length > 0) {
      node.children = convertRoutesToApiFormat(route.children);
    }

    result.push(node);
  }

  return result;
};

// 同步路由
const handleSync = async () => {
  if (!currentAppTypeId) {
    ElMessage.warning('请先选择应用类型');
    return;
  }

  const routes = convertRoutesToApiFormat(router.getRoutes());

  try {
    const result = await new ApiPermissionSyncPermissions({
      params: {
        appTypeId: currentAppTypeId,
        dryRun: true,
        routes,
      },
      option: { hintSuccess: false },
    });

    syncDialog.value = {
      visible: true,
      details: result.details || [],
    };
  } catch (error) {
    // 错误由底层处理
  }
};

// 确认同步
const confirmSync = async () => {
  const routes = convertRoutesToApiFormat(router.getRoutes());

  try {
    await new ApiPermissionSyncPermissions({
      params: {
        appTypeId: currentAppTypeId,
        dryRun: false,
        routes,
      },
    });
    ElMessage.success('同步成功');
    syncDialog.value.visible = false;
    managerRef.value?.reload();
  } catch (error) {
    // 错误由底层处理
  }
};

// 检查差异
const handleCompare = async () => {
  if (!currentAppTypeId) {
    ElMessage.warning('请先选择应用类型');
    return;
  }

  const routes = convertRoutesToApiFormat(router.getRoutes());

  try {
    const result = await new ApiPermissionComparePermissions({
      params: {
        appTypeId: currentAppTypeId,
        routes,
      },
    });

    const diffCount = result.totalDiffs || 0;
    if (diffCount === 0) {
      ElMessage.success('当前路由与权限树一致，无差异');
    } else {
      ElMessage.warning(`发现 ${diffCount} 处差异，请使用"同步路由"功能查看详情`);
    }
  } catch (error) {
    // 错误由底层处理
  }
};
</script>
