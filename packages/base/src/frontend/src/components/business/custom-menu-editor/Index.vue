<!--
/**
 * @fileoverview 自定义菜单编辑器
 * @description 编辑 AppType 的自定义菜单，支持拖拽排序、增删节点、编辑名称/图标
 */
-->
<template>
  <div class="custom-menu-editor" v-loading="loading">
    <div class="custom-menu-editor__toolbar">
      <el-button type="success" @click="handleSave">保存</el-button>
      <el-button type="primary" @click="handleReset">恢复到默认</el-button>
      <el-button type="danger" @click="handleClear">清空自定义</el-button>
    </div>
    <div class="custom-menu-editor__body">
      <div class="custom-menu-editor__panel">
        <div class="custom-menu-editor__panel-title">默认菜单结构</div>
        <ElScrollbar class="custom-menu-editor__tree">
          <el-tree
            :data="defaultMenus"
            node-key="permCode"
            :expand-on-click-node="false"
          >
            <template #default="{ data }">
              <div class="tree-node">
                <i :class="data.iconName" v-if="data.iconName"></i>
                <span class="tree-node__name">{{ data.permName }}</span>
                <span class="tree-node__code">{{ data.permCode }}</span>
              </div>
            </template>
          </el-tree>
        </ElScrollbar>
      </div>
      <div class="custom-menu-editor__panel">
        <div class="custom-menu-editor__panel-title">
          自定义菜单结构
          <el-button type="primary" link @click="handleAdd(null)">添加</el-button>
        </div>
        <ElScrollbar class="custom-menu-editor__tree">
          <el-tree
            :data="customMenus"
            node-key="permCode"
            draggable
            :allow-drop="allowDrop"
            :allow-drag="allowDrag"
            :expand-on-click-node="false"
          >
            <template #default="{ node, data }">
              <div class="tree-node tree-node--editable">
                <i
                  :class="data.icon"
                  class="tree-node__icon"
                  @click.stop="handleEditIcon(data)"
                ></i>
                <span
                  class="tree-node__name"
                  :class="{ 'is-change': data.is_change, 'is-new': data.is_new }"
                  v-if="!data.editTitle"
                  @click.stop="handleEditTitle(data)"
                >{{ data.permName }}</span>
                <el-input
                  ref="titleInputRef"
                  class="tree-node__input"
                  size="small"
                  v-model="data.permName"
                  v-if="data.editTitle"
                  @blur="handleTitleBlur(data)"
                  @keyup.enter="handleTitleBlur(data)"
                ></el-input>
                <span class="tree-node__code">{{ data.permCode }}</span>
                <el-button
                  type="danger"
                  link
                  size="small"
                  class="tree-node__del"
                  @click.stop="handleDelete(node, data)"
                >删除</el-button>
              </div>
            </template>
          </el-tree>
        </ElScrollbar>
      </div>
    </div>

    <!-- 添加节点弹窗 -->
    <el-dialog
      v-model="addDialogVisible"
      title="选择权限节点"
      width="500px"
    >
      <el-tree
        :data="defaultMenus"
        node-key="permCode"
        :props="{ label: 'permName', children: 'children' }"
        show-checkbox
        :check-strictly="true"
        ref="addTreeRef"
      ></el-tree>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAdd">确定</el-button>
      </template>
    </el-dialog>

    <!-- 图标选择弹窗 -->
    <el-dialog
      v-model="iconDialogVisible"
      title="选择图标"
      width="500px"
    >
      <div class="icon-grid">
        <div
          v-for="icon in iconList"
          :key="icon"
          class="icon-grid__item"
          :class="{ 'is-active': icon === editingIcon }"
          @click="editingIcon = icon"
        >
          <i :class="icon"></i>
        </div>
      </div>
      <template #footer>
        <el-button @click="iconDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmIcon">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue';
import { ElMessage, ElMessageBox, ElScrollbar } from 'element-plus';
import type { AllowDropType } from 'element-plus/es/components/tree/src/tree.type';
import { TOKEN_KEY } from '../../../constants/storage-keys';
import type { CustomMenuNode, PermissionTreeNode } from './types';

interface TreeNode {
  data: Record<string, any>;
  parent: TreeNode;
  children?: TreeNode[];
}

const props = defineProps<{
  appTypeId: string;
}>();

const loading = ref(false);
const defaultMenus = ref<PermissionTreeNode[]>([]);
const customMenus = ref<CustomMenuNode[]>([]);
const titleInputRef = ref<any>(null);
const addDialogVisible = ref(false);
const addTreeRef = ref<any>(null);
const addTargetNode = ref<CustomMenuNode | null>(null);
const iconDialogVisible = ref(false);
const editingIcon = ref('');
const editingIconNode = ref<CustomMenuNode | null>(null);

const iconList = [
  'el-icon-s-home', 'el-icon-s-grid', 'el-icon-s-data', 'el-icon-s-order',
  'el-icon-s-tools', 'el-icon-s-custom', 'el-icon-s-check', 'el-icon-s-operation',
  'el-icon-s-platform', 'el-icon-s-fold', 'el-icon-s-unfold', 'el-icon-s-release',
  'el-icon-s-marketing', 'el-icon-s-shop', 'el-icon-s-finance', 'el-icon-s-claim',
];

const TOKEN = () => localStorage.getItem(TOKEN_KEY) || '';

async function apiGet(path: string) {
  const res = await fetch(path, { headers: { Authorization: `Bearer ${TOKEN()}` } });
  const json = await res.json();
  return json?.data ?? json;
}

async function apiPut(path: string, body: any) {
  const res = await fetch(path, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${TOKEN()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  return json?.data ?? json;
}

async function apiDelete(path: string) {
  await fetch(path, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${TOKEN()}` },
  });
}

async function loadData() {
  loading.value = true;
  try {
    const pool = await apiGet(`/api/app-types/${props.appTypeId}/permission-pool`);
    if (pool?.permissionTrees?.normalTree) {
      defaultMenus.value = flattenTreeForDisplay(pool.permissionTrees.normalTree);
    }
    const menu = await apiGet(`/api/app-types/${props.appTypeId}/custom-menu`);
    customMenus.value = menu && menu.length > 0 ? menu : [];
  } finally {
    loading.value = false;
  }
}

/** 为左侧只读展示做扁平化：去掉不需要的字段，保留 tree 结构 */
function flattenTreeForDisplay(nodes: any[]): PermissionTreeNode[] {
  return nodes.map((node: any) => ({
    id: node.id,
    permCode: node.permCode,
    permName: node.permName,
    iconName: node.iconName,
    routePath: node.routePath,
    sortOrder: node.sortOrder,
    children: node.children ? flattenTreeForDisplay(node.children) : [],
  }));
}

/** 拖拽限制：PAGE 节点不允许作为容器 */
function allowDrop(_draggingNode: TreeNode, dropNode: TreeNode, type: AllowDropType) {
  if (['PAGE', 'TAG'].includes(dropNode.data.nodeType)) {
    return type !== 'inner';
  }
  return true;
}

function allowDrag() {
  return true;
}

/** 添加节点：弹出权限选择器 */
function handleAdd(parent: CustomMenuNode | null) {
  addTargetNode.value = parent;
  addDialogVisible.value = true;
}

function confirmAdd() {
  const checkedKeys = addTreeRef.value?.getCheckedKeys() || [];
  if (checkedKeys.length === 0) {
    ElMessage.warning('请选择至少一个权限节点');
    return;
  }

  const newNodes = findNodesByPermCodes(defaultMenus.value, checkedKeys);
  const targetList = addTargetNode.value
    ? (addTargetNode.value.children = addTargetNode.value.children || [])
    : customMenus.value;

  for (const node of newNodes) {
    targetList.push({
      permCode: node.permCode,
      permName: node.permName,
      icon: node.iconName || 'el-icon-s-grid',
      routePath: node.routePath,
      sortOrder: node.sortOrder,
      children: [],
      is_new: true,
    });
  }

  addDialogVisible.value = false;
}

function findNodesByPermCodes(nodes: PermissionTreeNode[], codes: string[]): PermissionTreeNode[] {
  const result: PermissionTreeNode[] = [];
  for (const node of nodes) {
    if (codes.includes(node.permCode)) {
      result.push(node);
    }
    if (node.children) {
      result.push(...findNodesByPermCodes(node.children, codes));
    }
  }
  return result;
}

/** 删除节点 */
function handleDelete(node: TreeNode, data: CustomMenuNode) {
  ElMessageBox.confirm(`确定要删除【${data.permName}】节点吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    const parent = node.parent;
    const children: CustomMenuNode[] = parent.data.children || parent.data;
    const index = children.findIndex((d: any) => d.permCode === data.permCode);
    if (index > -1) children.splice(index, 1);
  }).catch(() => {});
}

/** 编辑名称 */
function handleEditTitle(data: CustomMenuNode) {
  data.editTitle = true;
  data.old_title = data.old_title || data.permName;
  nextTick(() => {
    const inputs = document.querySelectorAll('.tree-node__input input');
    const last = inputs[inputs.length - 1] as HTMLInputElement;
    last?.focus();
  });
}

function handleTitleBlur(data: CustomMenuNode) {
  data.editTitle = false;
  data.is_change = data.old_title !== data.permName && !data.is_new;
}

/** 编辑图标 */
function handleEditIcon(data: CustomMenuNode) {
  editingIconNode.value = data;
  editingIcon.value = data.icon || '';
  iconDialogVisible.value = true;
}

function confirmIcon() {
  if (editingIconNode.value) {
    editingIconNode.value.icon = editingIcon.value;
  }
  iconDialogVisible.value = false;
}

/** 重置为默认菜单 */
function handleReset() {
  customMenus.value = defaultMenus.value.map(mapToCustomNode);
}

function mapToCustomNode(node: PermissionTreeNode): CustomMenuNode {
  return {
    permCode: node.permCode,
    permName: node.permName,
    icon: node.iconName || 'el-icon-s-grid',
    routePath: node.routePath,
    sortOrder: node.sortOrder,
    children: node.children?.map(mapToCustomNode) || [],
  };
}

/** 保存 */
async function handleSave() {
  loading.value = true;
  try {
    await apiPut(`/api/app-types/${props.appTypeId}/custom-menu`, {
      data: customMenus.value.map(stripEditState),
    });
    ElMessage.success('保存成功');
    await loadData();
  } catch {
    ElMessage.error('保存失败');
  } finally {
    loading.value = false;
  }
}

function stripEditState(node: CustomMenuNode): any {
  return {
    permCode: node.permCode,
    permName: node.permName,
    icon: node.icon,
    routePath: node.routePath,
    sortOrder: node.sortOrder,
    children: node.children?.map(stripEditState),
  };
}

/** 清空 */
function handleClear() {
  ElMessageBox.confirm('确定要清空自定义菜单吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    loading.value = true;
    try {
      await apiDelete(`/api/app-types/${props.appTypeId}/custom-menu`);
      customMenus.value = [];
      ElMessage.success('已清空');
    } catch {
      ElMessage.error('清空失败');
    } finally {
      loading.value = false;
    }
  }).catch(() => {});
}

const onConfirm = async () => {
  await handleSave();
  return true;
};

defineExpose({ onConfirm });

onMounted(() => {
  loadData();
});
</script>

<style scoped lang="scss">
.custom-menu-editor {
  display: flex;
  flex-direction: column;
  height: 100%;

  &__toolbar {
    display: flex;
    gap: 12px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--el-border-color-light);
    background: var(--el-bg-color);
  }

  &__body {
    display: flex;
    flex: 1;
    gap: 1px;
    background: var(--el-border-color-lighter);
    overflow: hidden;
  }

  &__panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: var(--el-bg-color);
    min-width: 0;
  }

  &__panel-title {
    padding: 12px 16px;
    font-size: 14px;
    font-weight: 600;
    border-bottom: 1px solid var(--el-border-color-lighter);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__tree {
    flex: 1;
    padding: 8px 16px;
  }
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;

  &--editable {
    width: 100%;
  }

  &__name {
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &.is-change { color: sandybrown; }
    &.is-new { color: #07b132; }
  }

  &__code {
    font-size: 11px;
    color: var(--el-text-color-placeholder);
    flex-shrink: 0;
  }

  &__icon {
    cursor: pointer;
    flex-shrink: 0;
  }

  &__input {
    width: 120px;
  }

  &__del {
    flex-shrink: 0;
  }
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;

  &__item {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 48px;
    border: 1px solid var(--el-border-color);
    border-radius: 4px;
    cursor: pointer;
    font-size: 20px;

    &:hover { border-color: var(--el-color-primary); }
    &.is-active { border-color: var(--el-color-primary); background: var(--el-color-primary-light-9); }
  }
}
</style>
