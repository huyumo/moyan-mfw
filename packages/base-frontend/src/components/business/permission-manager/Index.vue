<!--
/**
 * @fileoverview 权限管理通用组件
 * @description 统一管理 PC 和普通权限，包含拖拽排序、permissionValue 弹窗配置
 * 内部封装所有 API 调用，页面只需传入 permissionType 和基础配置
 */
-->
<template>
  <div class="permission-manager">
    <!-- 工具栏 -->
    <div class="permission-toolbar">
      <!-- 页面自定义工具栏 -->
      <slot name="toolbar-extra" />

      <!-- 关键词搜索 -->
      <el-input v-model="keyword" placeholder="搜索权限名称/编码" style="width: 200px" clearable @input="handleSearch">
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <!-- 主体内容 -->
    <div class="permission-content">
      <!-- 权限树 -->
      <div class="permission-tree-panel">
        <div class="panel-header">
          <h4>{{ title }}</h4>
          <el-tag size="small" type="info">拖拽可排序</el-tag>
        </div>

        <el-tree
          ref="treeRef"
          :data="permissionTree"
          :props="treeProps"
          node-key="id"
          default-expand-all
          highlight-current
          draggable
          :allow-drag="allowDrag"
          :allow-drop="allowDrop"
          @node-drop="handleNodeDrop"
          @node-click="handleNodeClick"
        >
          <template #default="{ data }">
            <div class="tree-node" :class="`node-type-${data.nodeType?.toLowerCase()}`">
              <div class="node-info">
                <el-icon class="node-icon">
                  <FolderOpened v-if="data.nodeType === 'MENU'" />
                  <Document v-else-if="data.nodeType === 'PAGE'" />
                  <CollectionTag v-else />
                </el-icon>
                <span class="node-name">{{ data.permName }}</span>
                <el-tag :type="getNodeTypeTagType(data.nodeType)" size="small" class="node-type-tag">
                  {{ data.nodeType }}
                </el-tag>
              </div>

              <div class="node-actions">
                <!-- permissionValue 配置按钮 - 只有 PAGE/TAG 显示 -->
                <el-button
                  v-if="canSetPermissionValue(data.nodeType)"
                  type="primary"
                  link
                  size="small"
                  title="配置操作权限"
                  @click.stop="handleConfigPermissionValue(data)"
                >
                  <el-icon><Key /></el-icon>
                </el-button>

                <!-- 添加子节点 - 只有 MENU 显示，且仅 NORMAL 类型 -->
                <el-button
                  v-if="data.nodeType === 'MENU' && props.permissionType === 'NORMAL'"
                  type="success"
                  link
                  size="small"
                  title="添加子节点"
                  @click.stop="handleAddChild(data)"
                >
                  <el-icon><Plus /></el-icon>
                </el-button>

                <!-- 编辑/删除 - 仅 NORMAL 类型，且非根节点 -->
                <el-button
                  v-if="props.permissionType === 'NORMAL' && !isRootNode(data)"
                  type="primary"
                  link
                  size="small"
                  title="编辑"
                  @click.stop="handleEdit(data)"
                >
                  <el-icon><Edit /></el-icon>
                </el-button>

                <el-button
                  v-if="props.permissionType === 'NORMAL' && !isRootNode(data)"
                  type="danger"
                  link
                  size="small"
                  title="删除"
                  @click.stop="handleDelete(data)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
          </template>
        </el-tree>
      </div>

      <!-- 说明面板 -->
      <div class="permission-help-panel">
        <h4>操作说明</h4>
        <div class="help-content">
          <div class="help-item">
            <el-icon><FolderOpened /></el-icon>
            <span><strong>MENU</strong>：目录节点，可包含子节点</span>
          </div>
          <div class="help-item">
            <el-icon><Document /></el-icon>
            <span><strong>PAGE</strong>：页面节点，可配置操作权限</span>
          </div>
          <div class="help-item">
            <el-icon><CollectionTag /></el-icon>
            <span><strong>TAG</strong>：标签节点，可配置操作权限</span>
          </div>
          <el-divider />
          <div class="help-tips">
            <p>💡 <strong>拖拽排序</strong>：拖拽节点可调整顺序</p>
            <p>💡 <strong>权限配置</strong>：点击 🔑 配置操作权限</p>
            <p>⚠️ <strong>限制</strong>：只能拖拽同级节点，不可跨层级</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Edit, Delete, Key, FolderOpened, Document, CollectionTag, Search } from '@element-plus/icons-vue';
import { MfwPopup } from '../../feedback';
import PermissionNodeForm from './PermissionNodeForm.vue';
import type { PermissionTreeNodeDto } from '../../../apis/sys/schemas';
import { ApiPermissionFindAllTree, ApiPermissionUpdate, ApiPermissionDelete } from '../../../apis/sys';
import { MfwPermissionValuePanel } from '../permission-value-panel';

// ========== Props & Emits ==========

export interface PermissionManagerProps {
  /** 权限类型：PC / NORMAL */
  permissionType: 'PC' | 'NORMAL';
  /** 页面标题 */
  title: string;
}

const props = defineProps<PermissionManagerProps>();

// ========== 状态 ==========

const permissionTree = ref<PermissionTreeNodeDto[]>([]);
const keyword = ref('');
const originalTree = ref<PermissionTreeNodeDto[]>([]);

// Tree 配置
const treeProps = {
  children: 'children',
  label: 'permName',
};

// ========== 计算属性 ==========

/** 节点类型选项 */
const nodeTypeOptions = computed(() => {
  if (props.permissionType === 'PC') {
    return [
      { label: '目录 (MENU)', value: 'MENU' },
      { label: '页面 (PAGE)', value: 'PAGE' },
    ];
  }
  return [
    { label: '目录 (MENU)', value: 'MENU' },
    { label: '标签 (TAG)', value: 'TAG' },
  ];
});

const getNodeTypeTagType = (nodeType?: string) => {
  switch (nodeType) {
    case 'MENU':
      return 'primary';
    case 'PAGE':
      return 'success';
    case 'TAG':
      return 'warning';
    default:
      return 'info';
  }
};

const canSetPermissionValue = (nodeType?: string) => {
  return nodeType === 'PAGE' || nodeType === 'TAG';
};

/** 判断是否为根节点 */
const isRootNode = (data: PermissionTreeNodeDto) => {
  return data.permCode === 'pc_root' || data.permCode === 'normal_root';
};

// ========== API 方法 ==========

// 树形数据过滤函数
const filterTree = (nodes: PermissionTreeNodeDto[], keyword: string): PermissionTreeNodeDto[] => {
  if (!keyword.trim()) return nodes;

  const lowerKeyword = keyword.toLowerCase();
  const result: PermissionTreeNodeDto[] = [];

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

// 搜索处理
const handleSearch = () => {
  if (!keyword.value.trim()) {
    permissionTree.value = originalTree.value;
  } else {
    permissionTree.value = filterTree(originalTree.value, keyword.value);
  }
};

/** 加载权限树 */
const loadPermissionTree = async () => {
  try {
    // 统一使用树接口，后端构建树，通过 permissionType 区分
    const result = await new ApiPermissionFindAllTree({
      query: {
        permissionType: props.permissionType,
      },
    });
    originalTree.value = result || [];
    permissionTree.value = keyword.value ? filterTree(originalTree.value, keyword.value) : originalTree.value;
  } catch (error) {
    permissionTree.value = [];
  }
};

// ========== 拖拽排序 ==========

/** 判断能否拖拽 */
const allowDrag = (node: any) => {
  const nodeType = node.data?.nodeType;
  // 只能拖拽 PAGE 和 TAG 节点
  return nodeType === 'PAGE' || nodeType === 'TAG';
};

/** 判断能否放置 */
const allowDrop = (draggingNode: any, dropNode: any, type: 'inner' | 'prev' | 'next') => {
  // 不允许跨层级拖拽（不能拖入内部）
  if (type === 'inner') {
    return false;
  }

  // 检查是否同一父节点（同级）
  const draggingParentId = draggingNode.data?.parentId;
  const dropParentId = dropNode.data?.parentId;

  // 只能在同一父节点下排序
  return draggingParentId === dropParentId;
};

/** 拖拽完成处理 */
const handleNodeDrop = async (
  draggingNode: any,
  _dropNode: any,
  dropType: 'before' | 'after' | 'inner',
  _ev: DragEvent,
) => {
  if (dropType === 'inner') return;

  // 获取父节点ID
  const parentId = draggingNode.data?.parentId || null;

  // 收集该父节点下的所有子节点ID（按当前顺序）
  const findParent = (nodes: any[], targetId: string): any => {
    for (const node of nodes) {
      if (node.id === targetId) return node;
      if (node.children) {
        const found = findParent(node.children, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  let siblingIds: string[] = [];
  if (parentId) {
    const parent = findParent(permissionTree.value, parentId);
    siblingIds = parent?.children?.map((c: any) => c.id) || [];
  } else {
    // 根节点级别
    siblingIds = permissionTree.value.map((n) => n.id);
  }

  try {
    // 批量更新排序
    for (let i = 0; i < siblingIds.length; i++) {
      await new ApiPermissionUpdate({
        params: { id: siblingIds[i] },
        body: { sortOrder: i }
      });
    }
    ElMessage.success('排序已保存');
  } catch (error) {
    // 失败时重新加载
    loadPermissionTree();
  }
};

/** 节点点击 */
const handleNodeClick = (_data: PermissionTreeNodeDto) => {
  // 可以在这里处理节点选中逻辑
};

// ========== permissionValue 配置 ==========

/** 配置 permissionValue */
const handleConfigPermissionValue = (data: PermissionTreeNodeDto) => {
  MfwPopup.open({
    title: `配置操作权限 - ${data.permName}`,
    type: 'dialog',
    component: MfwPermissionValuePanel,
    data: {
      permissiondData: {
        nodeId: data.id,
        nodeName: data.permName,
        nodeCode: data.permCode,
        permissionValue: data.permissionValue,
      },
    },
    popupProps: { width: 500 },
    on: {
      confirm: () => {
        loadPermissionTree();
      },
    },
  });
};

// ========== 节点操作 ==========

/** 打开节点表单 */
const openNodeForm = (options: {
  isEdit: boolean;
  title: string;
  parentId?: string;
  parentPermCode?: string;
  initialData?: Partial<PermissionTreeNodeDto>;
}) => {
  const defaultNodeType = props.permissionType === 'PC' ? 'PAGE' : 'TAG';

  MfwPopup.open({
    title: options.title,
    type: 'dialog',
    component: PermissionNodeForm,
    data: {
      isEdit: options.isEdit,
      permissionType: props.permissionType,
      parentId: options.parentId,
      parentPermCode: options.parentPermCode,
      nodeTypeOptions: nodeTypeOptions.value,
      defaultNodeType: options.parentId ? defaultNodeType : 'MENU',
      initialData: options.initialData,
    },
    popupProps: { width: 500 },
    on: {
      confirm: () => {
        loadPermissionTree();
      },
    },
  });
};

/** 添加子节点 */
const handleAddChild = (data: PermissionTreeNodeDto) => {
  openNodeForm({
    isEdit: false,
    title: '新建子节点',
    parentId: data.id,
    parentPermCode: data.permCode,
  });
};

/** 编辑节点 */
const handleEdit = (data: PermissionTreeNodeDto) => {
  openNodeForm({
    isEdit: true,
    title: '编辑节点',
    initialData: data,
  });
};

/** 删除节点 */
const handleDelete = async (data: PermissionTreeNodeDto) => {
  try {
    await ElMessageBox.confirm(`确定要删除权限「${data.permName}」吗？将同时删除所有子节点。`, '确认删除', {
      type: 'warning',
    });
    await new ApiPermissionDelete({ params: { id: data.id } });
    ElMessage.success('删除成功');
    loadPermissionTree();
  } catch {
    // 用户取消
  }
};

// ========== 生命周期 ==========

onMounted(() => {
  loadPermissionTree();
});

// ========== 暴露方法 ==========

defineExpose({
  reload: loadPermissionTree,
});
</script>

<style scoped lang="scss">
.permission-manager {
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.permission-toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.permission-content {
  display: flex;
  gap: 16px;
  flex: 1;
  overflow: hidden;
}

.permission-tree-panel {
  flex: 1;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  padding: 16px;
  overflow: auto;
  background: var(--el-bg-color);

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;

    h4 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }
}

.permission-help-panel {
  width: 280px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  padding: 16px;
  background: var(--el-bg-color);
  flex-shrink: 0;

  h4 {
    margin: 0 0 16px 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .help-content {
    .help-item {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      color: var(--el-text-color-regular);
      font-size: 13px;
      .el-icon {
        font-size: 14px;
        color: var(--el-color-primary);
      }
    }

    .help-tips {
      p {
        margin: 8px 0;
        font-size: 13px;
        color: var(--el-text-color-secondary);
        line-height: 1.6;
      }
    }
  }
}

// Tree 节点样式
.tree-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex: 1;
  padding: 6px 12px 6px 0; // 增加右侧边距

  .node-info {
    display: flex;
    align-items: center;
    gap: 8px;

    .node-icon {
      font-size: 16px;
      color: var(--el-text-color-secondary);
    }

    .node-name {
      font-size: 14px;
      color: var(--el-text-color-primary);
    }

    .node-type-tag {
      font-size: 11px;
    }
  }

  .node-actions {
    display: flex;
    align-items: center;
    gap: 0;
    opacity: 0;
    transition: opacity 0.2s;
    margin-right: 4px;

    :deep(.el-button) {
      padding: 5px;
      font-size: 14px;

      &:hover {
        background-color: var(--el-fill-color-light);
      }
    }
  }

  &:hover .node-actions {
    opacity: 1;
  }

  // 不同类型节点的颜色
  &.node-type-menu {
    .node-icon {
      color: var(--el-color-primary);
    }
  }

  &.node-type-page {
    .node-icon {
      color: var(--el-color-success);
    }
  }

  &.node-type-tag {
    .node-icon {
      color: var(--el-color-warning);
    }
  }
}

// PermissionValue 弹窗样式
.permission-value-dialog-content {
  .node-code {
    color: var(--el-text-color-secondary);
    font-size: 13px;
    margin: 0 0 16px;
  }

  .permission-actions {
    .el-checkbox-group {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    .permission-checkbox {
      margin-right: 0;

      .checkbox-content {
        display: flex;
        align-items: center;
        gap: 4px;

        .el-icon {
          font-size: 14px;
        }
      }
    }
  }
}

// Tree 全局样式覆盖
:deep(.el-tree) {
  background: transparent;

  .el-tree-node__content {
    height: 40px;
    border-radius: 4px;
    transition: background-color 0.2s;

    &:hover {
      background-color: var(--el-fill-color-light);
    }
  }

  .el-tree-node.is-current > .el-tree-node__content {
    background-color: var(--el-color-primary-light-9);
  }
}

// 拖拽时的样式
:deep(.el-tree-node.is-drop-inner > .el-tree-node__content) {
  background-color: var(--el-color-success-light-9);
  border: 1px dashed var(--el-color-success);
}
</style>
