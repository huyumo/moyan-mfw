<!--
/**
 * @fileoverview PC 权限管理页面
 * @description PC 权限树展示、路由同步、permissionValue 配置
 */
-->
<template>
  <div class="pc-permission-page">
    <div class="permission-toolbar">
      <el-button type="primary" @click="handleSync">
        <el-icon>
          <Refresh />
        </el-icon>
        同步路由
      </el-button>
      <el-button @click="handleCompare">
        <el-icon>
          <Search />
        </el-icon>
        检查差异
      </el-button>
      <el-button @click="handleAddManual">
        <el-icon>
          <Plus />
        </el-icon>
        手动添加权限
      </el-button>
    </div>

    <div class="permission-content">
      <!-- 权限树 -->
      <div class="permission-tree-panel">
        <h4>PC 权限树</h4>
        <el-tree ref="treeRef" :data="permissionTree" :props="{ label: 'permName', children: 'children' }" node-key="id"
          default-expand-all highlight-current @current-change="handleNodeSelect">
          <template #default="{ node, data }">
            <span class="tree-node">
              <span>{{ data.permName }}</span>
              <el-tag v-if="data.isAutoSync === STATUS.ENABLED" type="success" size="small">同步</el-tag>
              <el-tag v-else type="info" size="small">手动</el-tag>
            </span>
          </template>
        </el-tree>
      </div>

      <!-- permissionValue 配置面板 -->
      <div class="permission-value-panel">
        <template v-if="selectedNode && selectedNode.nodeType === 'PAGE'">
          <h4>操作权限配置</h4>
          <p class="node-info">
            当前页面：{{ selectedNode.permName }}<br />
            权限编码：{{ selectedNode.permCode }}
          </p>
          <el-checkbox-group v-model="selectedActions" @change="handlePermissionValueChange">
            <el-checkbox v-for="action in permissionActions" :key="action.value" :label="action.value">
              {{ action.label }}
            </el-checkbox>
          </el-checkbox-group>
        </template>
        <template v-else>
          <el-empty description="请选择 PAGE 节点配置操作权限" />
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Refresh, Search, Plus } from '@element-plus/icons-vue';
import { MfwPopup } from '../../../components/feedback';
import {
  ApiPermissionFindAll,
  ApiPermissionUpdate,
  ApiPermissionSync,
  ApiPermissionCompare,
} from '../../../apis/sys';
import type { PermissionResponseDto } from '../../../apis/sys/schemas';
import PermissionPcForm from './PermissionPcForm.vue';
import SyncPreview from './SyncPreview.vue';

/** 状态常量 */
const STATUS = {
  ENABLED: 1,
  DISABLED: 0,
} as const;

defineOptions({ name: 'MfwPcPermissionList' });

const treeRef = ref();
const selectedNode = ref<PermissionResponseDto | null>(null);
const permissionTree = ref<PermissionResponseDto[]>([]);

// 选中的操作权限
const selectedActions = ref<number[]>([]);

// 操作权限选项
const permissionActions = [
  { label: '新增', value: 1 },
  { label: '编辑', value: 2 },
  { label: '删除', value: 4 },
  { label: '导出', value: 8 },
  { label: '导入', value: 16 },
  { label: '查看', value: 32 },
];

// 同步结果（用于预览）
const syncResult = ref<any>(null);

// 加载权限树
const loadPermissionTree = async () => {
  const result = await new ApiPermissionFindAll({
    params: {
      permissionType: 'PC' as any, // API 类型定义有误，实际应为 string 枚举
      pageSize: 1000,
    },
  });
  // TODO-TASK-2026-04-03-004: 将列表转换为树形结构
  // 预计完成：2026-04-05
  // 说明：当前显示扁平列表，需要按 parentId 构建树形结构
  permissionTree.value = result.list || [];
};

// 选择节点
const handleNodeSelect = (data: PermissionResponseDto) => {
  selectedNode.value = data;

  // 解析 permissionValue
  if (data.permissionValue !== undefined && data.permissionValue !== null) {
    const value = Number(data.permissionValue);
    selectedActions.value = permissionActions
      .filter(action => (value & action.value) !== 0)
      .map(action => action.value);
  } else {
    selectedActions.value = [];
  }
};

// 权限值变化
const handlePermissionValueChange = async () => {
  if (!selectedNode.value) return;

  // 计算新的 permissionValue
  const newValue = selectedActions.value.reduce((acc, val) => acc | val, 0);

  await new ApiPermissionUpdate({
    query: { id: selectedNode.value.id },
    params: { permissionValue: newValue as any }, // API 类型定义有误
    option: { hintSuccess: true }
  });
  // 更新本地数据
  selectedNode.value.permissionValue = newValue;
};

// 同步路由
const handleSync = async () => {
  // TODO-TASK-2026-04-03-001: 需要从路由实例提取实际路由数据
  // 预计完成：2026-04-05
  // 阻塞原因：需要获取当前应用类型的路由配置
  const routes = [
    { path: '/sys/user', name: '用户管理' },
    { path: '/sys/role', name: '角色管理' },
  ];

  try {
    const result = await new ApiPermissionSync({
      params: {
        appTypeId: 'default', // TODO-TASK-2026-04-03-002: 从应用类型选择器获取实际值
        dryRun: true,
        routes,
      },
      option: { hintSuccess: false },
    });

    MfwPopup.open({
      title: '同步预览',
      type: 'dialog',
      component: SyncPreview,
      data: { details: result.details || [] },
      popupProps: { width: 600 },
      on: {
        confirm: async () => {
          // 执行实际同步
          await new ApiPermissionSync({
            params: {
              appTypeId: 'default',
              dryRun: false,
              routes,
            },
          });
          ElMessage.success('同步成功');
          loadPermissionTree();
        },
      },
    });
  } catch (error) {
    // API 错误由底层处理
  }
};

// 检查差异
const handleCompare = async () => {
  const routes = [
    { path: '/sys/user', name: '用户管理' },
    { path: '/sys/role', name: '角色管理' },
  ];

  try {
    const result = await new ApiPermissionCompare({
      params: {
        appTypeId: 'default', // TODO-TASK-2026-04-03-002: 从应用类型选择器获取实际值
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
    // API 错误由底层处理
  }
};

// 手动添加权限
const handleAddManual = () => {
  MfwPopup.open({
    title: '手动添加权限',
    type: 'dialog',
    component: PermissionPcForm,
    data: {},
    popupProps: { width: 500 },
    on: {
      confirm: () => {
        ElMessage.success('添加成功');
        loadPermissionTree();
      },
    },
  });
};

onMounted(() => {
  loadPermissionTree();
});
</script>

<style scoped lang="scss">
.pc-permission-page {
  padding: 16px;
}

.permission-toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.permission-content {
  display: flex;
  gap: 16px;
  height: calc(100vh - 200px);
}

.permission-tree-panel {
  flex: 1;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 16px;
  overflow: auto;

  h4 {
    margin: 0 0 12px 0;
    font-size: 16px;
  }
}

.permission-value-panel {
  width: 350px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 16px;

  h4 {
    margin: 0 0 12px 0;
    font-size: 16px;
  }

  .node-info {
    margin-bottom: 16px;
    color: #606266;
    font-size: 14px;
  }
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>