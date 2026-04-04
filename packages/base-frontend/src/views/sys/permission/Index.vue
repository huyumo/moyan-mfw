<!--
/**
 * @fileoverview 权限管理页面（普通权限 NORMAL）
 * @description 管理普通权限树，支持手动创建、编辑、删除
 */
-->
<template>
  <div class="permission-page">
    <div class="permission-toolbar">
      <!-- 应用类型选择器 -->
      <el-select
        v-model="selectedAppTypeId"
        placeholder="选择应用类型"
        style="width: 200px"
        clearable
        @change="handleAppTypeChange"
      >
        <el-option
          v-for="item in appTypeList"
          :key="item.id"
          :label="item.typeName"
          :value="item.id"
        />
      </el-select>
      <el-input
        v-model="keyword"
        placeholder="搜索权限名称/编码"
        style="width: 300px"
        clearable
        @keyup.enter="() => {}"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-button @click="keyword = ''">
        <el-icon><Refresh /></el-icon>
        重置
      </el-button>
      <el-button type="primary" @click="handleAddRoot">
        <el-icon><Plus /></el-icon>
        新建根节点
      </el-button>
    </div>

    <el-table
      :data="filteredPermissionTree"
      row-key="id"
      border
      default-expand-all
      :tree-props="{ children: 'children' }"
      @current-change="handleCurrentChange"
      highlight-current-row
    >
      <el-table-column prop="permName" label="权限名称" min-width="200" />
      <el-table-column prop="permCode" label="权限编码" min-width="200" />
      <el-table-column prop="nodeType" label="节点类型" width="100">
        <template #default="{ row }">
          <el-tag :type="row.nodeType === 'MENU' ? 'primary' : 'success'" size="small">
            {{ row.nodeType }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="showMode" label="显示模式" width="100">
        <template #default="{ row }">
          <el-tag :type="row.showMode === 'DEV' ? 'warning' : 'info'" size="small">
            {{ row.showMode }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="permStatus" label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.permStatus === STATUS.ENABLED ? 'success' : 'danger'" size="small">
            {{ row.permStatus === STATUS.ENABLED ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="sortOrder" label="排序" width="80" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
          <el-button type="success" link @click="handleAddChildForRow(row)">添加子节点</el-button>
          <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Plus, Refresh } from '@element-plus/icons-vue';
import { MfwPopup } from '../../../components/feedback';
import {
  ApiPermissionFindAllTree,
  ApiPermissionDelete,
  ApiAppTypeFindAllList,
} from '../../../apis/sys';
import type { PermissionTreeNodeDto, AppTypeResponseDto } from '../../../apis/sys/schemas';
import PermissionForm from './PermissionForm.vue';

/** 状态常量 */
const STATUS = {
  ENABLED: 1,
  DISABLED: 0,
} as const;

defineOptions({ name: 'MfwPermissionList' });

const keyword = ref('');
const selectedNode = ref<PermissionTreeNodeDto | null>(null);
const selectedAppTypeId = ref<string>('');
const appTypeList = ref<AppTypeResponseDto[]>([]);

/** 权限树数据 */
const permissionTree = ref<PermissionTreeNodeDto[]>([]);

/** 加载应用类型列表 */
const loadAppTypeList = async () => {
  const result = await new ApiAppTypeFindAllList({});
  appTypeList.value = result || [];
  // 默认选择第一个启用的应用类型
  const enabled = result.find((item: AppTypeResponseDto) => item.typeStatus === 1);
  if (enabled) {
    selectedAppTypeId.value = enabled.id;
    loadPermissionTree();
  }
};

/** 应用类型变化 */
const handleAppTypeChange = (appTypeId: string) => {
  selectedAppTypeId.value = appTypeId;
  loadPermissionTree();
};

/** 加载权限树 */
const loadPermissionTree = async () => {
  const result = await new ApiPermissionFindAllTree({
    params: {
      permissionType: 'NORMAL',
    },
  });
  permissionTree.value = result || [];
};

/** 过滤后的权限树 */
const filteredPermissionTree = computed(() => {
  if (!keyword.value) return permissionTree.value;
  return filterTree(permissionTree.value, keyword.value);
});

/** 递归过滤树节点
 * @param nodes - 权限树节点
 * @param keyword - 关键词
 * @returns 过滤后的树
 */
const filterTree = (nodes: PermissionTreeNodeDto[], keyword: string): PermissionTreeNodeDto[] => {
  const result: PermissionTreeNodeDto[] = [];
  const lowerKeyword = keyword.toLowerCase();

  for (const node of nodes) {
    const matchName = node.permName.toLowerCase().includes(lowerKeyword);
    const matchCode = node.permCode.toLowerCase().includes(lowerKeyword);

    let filteredChildren: PermissionTreeNodeDto[] | undefined;
    if (node.children && node.children.length > 0) {
      filteredChildren = filterTree(node.children, keyword);
    }

    if (matchName || matchCode || (filteredChildren && filteredChildren.length > 0)) {
      result.push({
        ...node,
        children: filteredChildren,
      });
    }
  }

  return result;
};

/** 选中行变化 */
const handleCurrentChange = (row: PermissionTreeNodeDto | null) => {
  selectedNode.value = row;
};

/** 新建根节点 */
const handleAddRoot = () => {
  MfwPopup.open({
    title: '新建根权限',
    type: 'dialog',
    component: PermissionForm,
    data: { parentId: '', nodeType: 'MENU', permissionType: 'NORMAL' },
    popupProps: { width: 500 },
    on: {
      confirm: () => {
        ElMessage.success('创建成功');
        loadPermissionTree();
      },
    },
  });
};

/** 添加子节点（在行上操作） */
const handleAddChildForRow = (row: PermissionTreeNodeDto) => {
  MfwPopup.open({
    title: '新建子权限',
    type: 'dialog',
    component: PermissionForm,
    data: { parentId: row.id, nodeType: 'TAG' },
    popupProps: { width: 500 },
    on: {
      confirm: () => {
        ElMessage.success('创建成功');
        loadPermissionTree();
      },
    },
  });
};

/** 编辑 */
const handleEdit = (row: PermissionTreeNodeDto) => {
  MfwPopup.open({
    title: '编辑权限',
    type: 'dialog',
    component: PermissionForm,
    data: { ...row },
    popupProps: { width: 500 },
    on: {
      confirm: () => {
        ElMessage.success('更新成功');
        loadPermissionTree();
      },
    },
  });
};

/** 删除 */
const handleDelete = async (row: PermissionTreeNodeDto) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除权限「${row.permName}」吗？将同时删除所有子节点。`,
      '确认删除',
      { type: 'warning' }
    );
    await new ApiPermissionDelete({ params: { id: row.id } });
    ElMessage.success('删除成功');
    loadPermissionTree();
  } catch {
    // 用户取消
  }
};

onMounted(() => {
  loadAppTypeList();
});
</script>

<style scoped lang="scss">
.permission-page {
  padding: 16px;
}

.permission-toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
</style>