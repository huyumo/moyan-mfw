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
      <el-button type="primary" @click="handleReset">重置为默认</el-button>
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
                <el-icon v-if="data.iconName" size="16">
                  <component :is="data.iconName" />
                </el-icon>
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
            :expand-on-click-node="false"
          >
            <template #default="{ node, data }">
              <div class="tree-node tree-node--editable">
                <el-icon class="tree-node__icon" size="16" @click.stop="handleEditIcon(data)">
                  <component :is="data.icon" />
                </el-icon>
                <span
                  class="tree-node__name"
                  :class="{ 'is-change': data.is_change, 'is-new': data.is_new }"
                  v-if="!data.editTitle"
                  @click.stop="handleEditTitle(data, $event)"
                >{{ data.permName }}</span>
                <el-input
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
                  @click.stop="handleDelete(node, data)"
                >删除</el-button>
              </div>
            </template>
          </el-tree>
        </ElScrollbar>
      </div>
    </div>

    <el-dialog v-model="addDialogVisible" title="选择权限节点" width="500px" :close-on-click-modal="false">
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

    <el-dialog v-model="iconDialogVisible" title="选择图标" width="600px" :close-on-click-modal="false">
      <div class="icon-grid">
        <div
          v-for="name in iconNames"
          :key="name"
          class="icon-grid__item"
          :class="{ 'is-active': name === editingIcon }"
          @click="editingIcon = name"
        >
          <el-icon size="20"><component :is="(Icons as Record<string, any>)[name]" /></el-icon>
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
import { ref, computed, nextTick, onMounted } from 'vue';
import { ElMessage, ElMessageBox, ElScrollbar } from 'element-plus';
import * as Icons from '@element-plus/icons-vue';
import type { CustomMenuNode, PermissionTreeNode } from './types';
import { TOKEN_KEY } from '../../../constants/storage-keys';

defineOptions({ name: 'CustomMenuEditor' });

interface ElTreeNode {
  nodeData: Record<string, any>;
  parent: ElTreeNode;
  children?: ElTreeNode[];
}

const props = defineProps<{
  data: { appTypeId: string };
}>();

const appTypeId = computed(() => props.data?.appTypeId);

const loading = ref(false);
const defaultMenus = ref<PermissionTreeNode[]>([]);
const customMenus = ref<CustomMenuNode[]>([]);
const addDialogVisible = ref(false);
const addTreeRef = ref<any>(null);
const addTargetNode = ref<CustomMenuNode | null>(null);
const iconDialogVisible = ref(false);
const editingIcon = ref('');
const editingIconNode = ref<CustomMenuNode | null>(null);

const iconNames = [
  'HomeFilled', 'Menu', 'Grid', 'DataAnalysis', 'DataBoard', 'Sort',
  'Tools', 'UserFilled', 'Checked', 'Operation', 'Platform',
  'Fold', 'Expand', 'Collection', 'CollectionTag',
  'MarketingFilled', 'Shop', 'Coin', 'Ticket', 'Money',
  'ChatLineSquare', 'BellFilled', 'Setting', 'InfoFilled',
  'Document', 'Files', 'Folder', 'PictureFilled',
];

const token = () => localStorage.getItem(TOKEN_KEY) || '';

async function apiGet(path: string) {
  const res = await fetch('/api' + path, { headers: { Authorization: 'Bearer ' + token() } });
  const json = await res.json();
  return json?.data ?? json;
}

async function apiPut(path: string, body: any) {
  const res = await fetch('/api' + path, {
    method: 'PUT',
    headers: { Authorization: 'Bearer ' + token(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  return json?.data ?? json;
}

async function apiDelete(path: string) {
  await fetch('/api' + path, { method: 'DELETE', headers: { Authorization: 'Bearer ' + token() } });
}

async function loadData() {
  loading.value = true;
  try {
    const pool = await apiGet(`/app-types/${appTypeId.value}/permission-pool`);
    const treeData = pool?.permissionTrees?.pcTree || pool?.permissionTrees?.normalTree;
    if (treeData?.length) {
      const root = treeData[0];
      defaultMenus.value = root?.children
        ? flattenTreeForDisplay(root.children)
        : flattenTreeForDisplay(treeData);
    }
    const menu = await apiGet(`/app-types/${appTypeId.value}/custom-menu`);
    if (menu && Array.isArray(menu) && menu.length > 0) {
      customMenus.value = menu as CustomMenuNode[];
    }
  } catch (e) {
    console.error('[CustomMenuEditor] loadData error:', e);
  } finally {
    loading.value = false;
  }
}

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

  const matchedTrees = cloneSubtreeByPermCodes(defaultMenus.value, checkedKeys);
  const targetList = addTargetNode.value
    ? (addTargetNode.value.children = addTargetNode.value.children || [])
    : customMenus.value;

  for (const node of matchedTrees) {
    targetList.push(toCustomMenuNode(node));
  }

  addDialogVisible.value = false;
}

function cloneSubtreeByPermCodes(nodes: PermissionTreeNode[], codes: string[]): PermissionTreeNode[] {
  const result: PermissionTreeNode[] = [];
  for (const node of nodes) {
    if (codes.includes(node.permCode)) {
      result.push(cloneTree(node));
    } else if (node.children) {
      const matched = cloneSubtreeByPermCodes(node.children, codes);
      if (matched.length > 0) {
        result.push({ ...node, children: matched });
      }
    }
  }
  return result;
}

function cloneTree(node: PermissionTreeNode): PermissionTreeNode {
  return {
    ...node,
    children: node.children ? node.children.map(cloneTree) : [],
  };
}

function toCustomMenuNode(node: PermissionTreeNode): CustomMenuNode {
  return {
    permCode: node.permCode,
    permName: node.permName,
    icon: node.iconName || 'Menu',
    routePath: node.routePath,
    sortOrder: node.sortOrder,
    children: node.children?.map(toCustomMenuNode) || [],
    is_new: true,
  };
}

function handleDelete(node: ElTreeNode, itemData: CustomMenuNode) {
  ElMessageBox.confirm(`确定要删除【${itemData.permName}】节点吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    const parent = node.parent;
    const siblings: CustomMenuNode[] = parent.nodeData.children || (parent.nodeData as any);
    const index = siblings.findIndex((d: any) => d.permCode === itemData.permCode);
    if (index > -1) siblings.splice(index, 1);
  }).catch(() => {});
}

function handleEditTitle(data: CustomMenuNode, event: MouseEvent) {
  data.editTitle = true;
  data.old_title = data.old_title || data.permName;
  nextTick(() => {
    const container = (event.target as HTMLElement).closest('.tree-node--editable');
    const input = container?.querySelector('.tree-node__input input') as HTMLInputElement;
    input?.focus();
  });
}

function handleTitleBlur(data: CustomMenuNode) {
  data.editTitle = false;
  data.is_change = data.old_title !== data.permName && !data.is_new;
}

function handleEditIcon(data: CustomMenuNode) {
  editingIconNode.value = data;
  editingIcon.value = data.icon || 'Menu';
  iconDialogVisible.value = true;
}

function confirmIcon() {
  if (editingIconNode.value) {
    editingIconNode.value.icon = editingIcon.value;
  }
  iconDialogVisible.value = false;
}

function handleReset() {
  customMenus.value = defaultMenus.value.map(toCustomMenuNode);
}

async function handleSave() {
  loading.value = true;
  try {
    await apiPut(`/app-types/${appTypeId.value}/custom-menu`, {
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

function handleClear() {
  ElMessageBox.confirm('确定要清空自定义菜单吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    loading.value = true;
    try {
      await apiDelete(`/app-types/${appTypeId.value}/custom-menu`);
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

    &:hover { border-color: var(--el-color-primary); }
    &.is-active { border-color: var(--el-color-primary); background: var(--el-color-primary-light-9); }
  }
}
</style>
