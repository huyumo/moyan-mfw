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
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-button type="primary" @click="handleAddRoot">
        <el-icon><Plus /></el-icon>
        新建根节点
      </el-button>
      <el-button @click="handleAddChild" :disabled="!selectedNode">
        <el-icon><Plus /></el-icon>
        新建子节点
      </el-button>
    </div>

    <el-table
      :data="permissionTree"
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
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
          <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Plus } from '@element-plus/icons-vue';
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
  const result = await new ApiPermissionFindAllTree({});
  permissionTree.value = result || [];
};

/** 将扁平列表转换为树形结构
 * @param list - 权限列表
 * @returns 树形结构
 */
const buildTree = (list: PermissionTreeNodeDto[]): PermissionTreeNodeDto[] => {
  const map = new Map<string, PermissionTreeNodeDto & { children?: PermissionTreeNodeDto[] }>();
  const roots: PermissionTreeNodeDto[] = [];

  // 先创建所有节点的映射
  list.forEach(item => {
    map.set(item.id, { ...item, children: [] });
  });

  // 构建树形结构
  list.forEach(item => {
    const node = map.get(item.id)!;
    if (item.parentId && map.has(item.parentId)) {
      const parent = map.get(item.parentId)!;
      if (!parent.children) {
        parent.children = [];
      }
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
};

/** 选中行变化 */
const handleCurrentChange = (row: PermissionTreeNodeDto | null) => {
  selectedNode.value = row;
};

/** 新建根节点 */
const handleAddRoot = () => {
  MfwPopup.open({
    title: '新建权限',
    type: 'dialog',
    component: PermissionForm,
    data: { parentId: '' },
    popupProps: { width: 500 },
    on: {
      confirm: () => {
        ElMessage.success('创建成功');
        loadPermissionTree();
      },
    },
  });
};

/** 新建子节点 */
const handleAddChild = () => {
  if (!selectedNode.value) {
    ElMessage.warning('请先选择父节点');
    return;
  }
  MfwPopup.open({
    title: '新建权限',
    type: 'dialog',
    component: PermissionForm,
    data: { parentId: selectedNode.value.id, nodeType: 'TAG' },
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