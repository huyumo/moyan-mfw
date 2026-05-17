<!--
/**
 * @fileoverview 自定义菜单编辑器
 * @description 编辑 AppType 的自定义菜单。左侧为该 AppType 权限池中的可用菜单参考，右侧为自定义编排区。
 *   「同步默认结构」按钮将可用菜单拷贝/增量合并到右侧，不覆盖已编辑的数据。
 */
-->
<template>
  <div class="custom-menu-editor" v-loading="loading" @click.self="exitAllEdit">
    <div class="custom-menu-editor__toolbar">
      <el-button type="primary" @click="handleSync">同步默认结构</el-button>
      <el-button @click="handleReset">重置为默认</el-button>
      <el-button type="danger" @click="handleClear">清空自定义</el-button>
    </div>
    <div class="custom-menu-editor__body">
      <!-- 左侧：AppType 权限池中可用的菜单（只读参考） -->
      <div class="custom-menu-editor__panel">
        <div class="custom-menu-editor__panel-title">可用菜单（权限池）</div>
        <ElScrollbar class="custom-menu-editor__tree">
          <el-tree :data="defaultMenus" node-key="permCode" :expand-on-click-node="false" :default-expand-all="true">
            <template #default="{ data }">
              <div class="tree-node tree-node--readonly">
                <el-icon v-if="data.iconName" size="16">
                  <component :is="(Icons as Record<string, any>)[data.iconName] || Icons.Menu" />
                </el-icon>
                <span class="tree-node__name">{{ data.permName }}</span>
                <span v-if="isPageSynced(data.permCode)" class="tree-node__synced" title="已在自定义菜单中">
                  <el-icon size="14"><component :is="(Icons as Record<string, any>).Check" /></el-icon>
                </span>
                <span class="tree-node__code">{{ data.permCode }}</span>
              </div>
            </template>
          </el-tree>
        </ElScrollbar>
      </div>

      <!-- 右侧：自定义菜单结构（可编辑） -->
      <div class="custom-menu-editor__panel">
        <div class="custom-menu-editor__panel-title">
          自定义菜单结构
          <el-button type="primary" link @click="showAddDirDialog">添加目录</el-button>
        </div>
        <ElScrollbar class="custom-menu-editor__tree">
          <el-tree v-if="customMenus.length > 0" :data="customMenus" node-key="permCode" draggable
            :expand-on-click-node="false" :allow-drop="allowDrop" @node-drop="handleNodeDrop">
            <template #default="{ node, data }">
              <div class="tree-node tree-node--editable" @click.stop>
                <el-icon class="tree-node__icon" size="16" @click.stop="handleEditIcon(data)">
                  <component :is="(Icons as Record<string, any>)[data.icon || 'Menu'] || Icons.Menu" />
                </el-icon>

                <span v-if="!editingId || editingId !== data.permCode" class="tree-node__name"
                  :class="nameClasses(data)" @click.stop="startEditTitle(data, $event)">{{ data.permName }}</span>
                <el-input v-else ref="editInputRef" class="tree-node__input" size="small" v-model="data.permName"
                  @blur="confirmEditTitle(data)" @keyup.enter="confirmEditTitle(data)"
                  @keyup.escape="cancelEditTitle(data)"></el-input>

                <span class="tree-node__code">{{ data.permCode }}</span>

                <el-tag v-if="isCustomDir(data)" size="small" type="warning" effect="plain">目录</el-tag>

                <el-button v-if="canDelete(data)" type="danger" link size="small"
                  class="tree-node__del" @click.stop="handleDelete(node, data)">删除</el-button>
              </div>
            </template>
          </el-tree>
          <div v-else class="custom-menu-editor__empty">
            暂无自定义菜单，请点击「同步默认结构」将可用菜单同步过来
          </div>
        </ElScrollbar>
      </div>
    </div>

    <!-- 添加目录对话框 -->
    <el-dialog v-model="addDirDialogVisible" title="添加自定义目录" width="450px" :close-on-click-modal="false">
      <el-form label-width="80px">
        <el-form-item label="目录名称">
          <el-input v-model="newDirName" placeholder="请输入目录名称" maxlength="32" show-word-limit />
        </el-form-item>
        <el-form-item label="父级目录">
          <el-tree-select v-model="newDirParent" :data="dirSelectData"
            :props="{ label: 'permName', value: 'permCode', children: 'children' }" check-strictly clearable
            placeholder="根级别（无父级）" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDirDialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!newDirName.trim()" @click="confirmAddDir">确定</el-button>
      </template>
    </el-dialog>

    <!-- 图标选择对话框 -->
    <el-dialog v-model="iconDialogVisible" title="选择图标" width="600px" :close-on-click-modal="false">
      <div class="icon-grid">
        <div v-for="name in iconNames" :key="name" class="icon-grid__item"
          :class="{ 'is-active': name === editingIcon }" @click="editingIcon = name">
          <el-icon size="20"><component :is="(Icons as Record<string, any>)[name]" /></el-icon>
          <span class="icon-grid__label">{{ name }}</span>
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
import {
  ApiAppTypeGetPermissionPool,
  ApiAppTypeGetCustomMenu,
  ApiAppTypeSaveCustomMenu,
  ApiAppTypeClearCustomMenu,
} from '../../../apis/sys';
import type { CustomMenuItemDto } from '../../../apis/sys/schemas';

defineOptions({ name: 'CustomMenuEditor' });

const props = defineProps<{
  data: { appTypeId: string };
}>();

const appTypeId = computed(() => props.data?.appTypeId);

// ====== 状态 ======
const loading = ref(false);
const defaultMenus = ref<PermissionTreeNode[]>([]);
const customMenus = ref<CustomMenuNode[]>([]);
const editInputRef = ref<any>(null);

// 编辑状态
const editingId = ref<string | null>(null);
const editingBackup = ref('');

// 添加目录
const addDirDialogVisible = ref(false);
const newDirName = ref('');
const newDirParent = ref<string | undefined>(undefined);

// 图标选择
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
  'OfficeBuilding', 'Histogram', 'Monitor', 'Notebook',
];

let dirCounter = 0;

// ====== 数据加载 ======
async function loadData() {
  loading.value = true;
  try {
    const poolResult = await new ApiAppTypeGetPermissionPool({
      params: { appTypeId: appTypeId.value },
    });
    const pool = poolResult as Record<string, any>;
    // 取权限池中已勾选的 PC 树（checked=true 的节点及其祖先目录）
    const treeData = pool?.permissionTrees?.pcTree;
    if (treeData?.length) {
      const root = treeData[0];
      const allNodes = root?.children ? root.children : treeData;
      // 过滤出 checked=true 的页面节点 + 它们的祖先目录
      defaultMenus.value = buildFilteredTree(allNodes);
    }
    const menuResult = await new ApiAppTypeGetCustomMenu({
      params: { id: appTypeId.value },
    });
    const menu = menuResult as CustomMenuItemDto[] | null;
    if (menu && Array.isArray(menu) && menu.length > 0) {
      customMenus.value = markExistingNodes(menu as unknown as CustomMenuNode[]);
    }
  } catch (e) {
    console.error('[CustomMenuEditor] loadData error:', e);
  } finally {
    loading.value = false;
  }
}

/** 从权限池原始树中过滤出 checked=true 的节点，保留祖先目录链 */
function buildFilteredTree(nodes: any[]): PermissionTreeNode[] {
  // 先收集所有 checked=true 的 permCode
  const checkedCodes = new Set<string>();
  function collectChecked(list: any[]) {
    for (const n of list) {
      if (n.checked) checkedCodes.add(n.permCode);
      if (n.children) collectChecked(n.children);
    }
  }
  collectChecked(nodes);

  // 过滤树：保留 checked 节点 + 作为 checked 节点祖先的目录节点
  function filterTree(list: any[]): PermissionTreeNode[] | undefined {
    const result: PermissionTreeNode[] = [];
    for (const n of list) {
      const hasRoutePath = !!n.routePath;
      const isChecked = checkedCodes.has(n.permCode);
      const filteredChildren = n.children ? filterTree(n.children) : undefined;

      // 页面节点：仅当 checked 时保留
      if (hasRoutePath && (!filteredChildren || filteredChildren.length === 0)) {
        if (isChecked) {
          result.push(mapToDisplay(n));
        }
        continue;
      }

      // 目录节点：自身 checked 或有 checked 的子节点时保留
      if (isChecked || (filteredChildren && filteredChildren.length > 0)) {
        result.push({
          ...mapToDisplay(n),
          children: filteredChildren,
        });
      }
    }
    return result.length > 0 ? result : undefined;
  }

  return filterTree(nodes) || [];
}

function mapToDisplay(node: any): PermissionTreeNode {
  return {
    id: node.id,
    permCode: node.permCode,
    permName: node.permName,
    iconName: node.iconName,
    routePath: node.routePath,
    sortOrder: node.sortOrder,
  };
}

function markExistingNodes(nodes: CustomMenuNode[]): CustomMenuNode[] {
  return nodes.map((n) => ({
    ...n,
    _changed: false,
    _new: false,
    children: n.children ? markExistingNodes(n.children) : undefined,
  }));
}

// ====== 节点类型判断 ======

/** 是否为叶子页面（有路由路径且无子节点） */
function isPageNode(node: CustomMenuNode): boolean {
  return !!node.routePath && (!node.children || node.children.length === 0);
}

/** 是否为用户手动添加的自定义目录 */
function isCustomDir(node: CustomMenuNode): boolean {
  return (node.permCode || '').startsWith('__dir_');
}

/** 是否允许删除：页面不可删；有子节点的不可删；仅空目录可删 */
function canDelete(node: CustomMenuNode): boolean {
  if (isPageNode(node)) return false;
  if (!isCustomDir(node) && node.children && node.children.length > 0) return false;
  return !node.children || node.children.length === 0;
}

/** 左侧树中，该页面是否已在自定义菜单中 */
function isPageSynced(permCode: string): boolean {
  return findNodeInCustom(customMenus.value, permCode) !== null;
}

function nameClasses(data: CustomMenuNode) {
  return {
    'is-change': data._changed && !data._new,
    'is-new': data._new,
  };
}

// ====== 核心：同步默认结构 ======

/** 同步默认结构 —— 初始全量拷贝，增量合并不覆盖已编辑数据 */
function handleSync() {
  if (customMenus.value.length === 0) {
    customMenus.value = copyDefaultTree(defaultMenus.value, new Set());
    ElMessage.success('已同步可用菜单结构，请自由编辑');
    return;
  }

  const existingCodes = collectAllPermCodes(customMenus.value);
  ElMessageBox.confirm(
    '同步将把可用菜单中新增的页面合并到自定义菜单中，已有的自定义数据不会丢失。确定继续？',
    '同步默认结构',
    { confirmButtonText: '确定同步', cancelButtonText: '取消', type: 'info' },
  ).then(() => {
    const { addedCount, skippedCount } = mergeDefaultIntoCustom(
      defaultMenus.value,
      customMenus.value,
      existingCodes,
    );
    if (addedCount > 0) {
      ElMessage.success(`已合并 ${addedCount} 个新增页面${skippedCount > 0 ? `，跳过 ${skippedCount} 个已存在页面` : ''}`);
    } else {
      ElMessage.info('没有发现需要同步的新增页面，全部已存在');
    }
  }).catch(() => {});
}

/** 全量拷贝默认树 → CustomMenuNode[]（目录不携带 routePath） */
function copyDefaultTree(nodes: PermissionTreeNode[], existing: Set<string>): CustomMenuNode[] {
  const result: CustomMenuNode[] = [];
  for (const node of nodes) {
    if (node.children && node.children.length > 0) {
      result.push({
        permCode: node.permCode,
        permName: node.permName,
        icon: node.iconName || 'Menu',
        sortOrder: node.sortOrder,
        children: copyDefaultTree(node.children, existing),
        _new: false,
        _changed: false,
      });
      for (const child of node.children) {
        if (child.routePath) existing.add(child.permCode);
      }
    } else {
      result.push({
        permCode: node.permCode,
        permName: node.permName,
        icon: node.iconName || 'Menu',
        routePath: node.routePath,
        sortOrder: node.sortOrder,
        _new: false,
        _changed: false,
      });
      existing.add(node.permCode);
    }
  }
  return result;
}

/** 增量合并：将默认树中不存在于自定义菜单的页面并入 */
function mergeDefaultIntoCustom(
  defaultNodes: PermissionTreeNode[],
  customNodes: CustomMenuNode[],
  existingCodes: Set<string>,
): { addedCount: number; skippedCount: number } {
  let addedCount = 0;
  let skippedCount = 0;

  function walkDefault(nodes: PermissionTreeNode[]) {
    for (const node of nodes) {
      if (node.routePath && !node.children?.length) {
        if (!existingCodes.has(node.permCode)) {
          insertNewPageIntoCustom(customNodes, node, defaultNodes);
          existingCodes.add(node.permCode);
          addedCount++;
        } else {
          skippedCount++;
        }
      }
      if (node.children) walkDefault(node.children);
    }
  }
  walkDefault(defaultNodes);
  return { addedCount, skippedCount };
}

/** 将新页面插入自定义菜单中合适的父目录下 */
function insertNewPageIntoCustom(
  customNodes: CustomMenuNode[],
  defaultPage: PermissionTreeNode,
  defaultTree: PermissionTreeNode[],
) {
  const ancestorPath = getDefaultAncestorPath(defaultTree, defaultPage.permCode, []);
  if (!ancestorPath || ancestorPath.length <= 1) {
    customNodes.push({
      permCode: defaultPage.permCode,
      permName: defaultPage.permName,
      icon: defaultPage.iconName || 'Menu',
      routePath: defaultPage.routePath,
      sortOrder: defaultPage.sortOrder,
      _new: true,
      _changed: false,
    });
    return;
  }

  const parentChain = ancestorPath.slice(0, -1);
  let currentList = customNodes;
  for (let i = 0; i < parentChain.length; i++) {
    const ancestor = parentChain[i];
    let dir = currentList.find(
      (n) => n.permCode === ancestor.permCode && (n.children || !n.routePath),
    );
    if (!dir) {
      dir = {
        permCode: ancestor.permCode,
        permName: ancestor.permName,
        icon: ancestor.iconName || 'Folder',
        sortOrder: ancestor.sortOrder,
        children: [],
        _new: true,
        _changed: false,
      };
      currentList.push(dir);
    }
    if (!dir.children) dir.children = [];
    currentList = dir.children;
  }

  currentList.push({
    permCode: defaultPage.permCode,
    permName: defaultPage.permName,
    icon: defaultPage.iconName || 'Menu',
    routePath: defaultPage.routePath,
    sortOrder: defaultPage.sortOrder,
    _new: true,
    _changed: false,
  });
}

function getDefaultAncestorPath(
  nodes: PermissionTreeNode[],
  targetCode: string,
  path: PermissionTreeNode[],
): PermissionTreeNode[] | null {
  for (const n of nodes) {
    if (n.permCode === targetCode) return [...path, n];
    if (n.children) {
      const found = getDefaultAncestorPath(n.children, targetCode, [...path, n]);
      if (found) return found;
    }
  }
  return null;
}

function collectAllPermCodes(nodes: CustomMenuNode[]): Set<string> {
  const set = new Set<string>();
  function walk(list: CustomMenuNode[]) {
    for (const n of list) {
      set.add(n.permCode);
      if (n.children) walk(n.children);
    }
  }
  walk(nodes);
  return set;
}

// ====== 查找节点 ======
function findNodeInCustom(nodes: CustomMenuNode[], code: string): CustomMenuNode | null {
  for (const n of nodes) {
    if (n.permCode === code) return n;
    if (n.children) {
      const found = findNodeInCustom(n.children, code);
      if (found) return found;
    }
  }
  return null;
}

function removeNodeFromCustom(list: CustomMenuNode[], permCode: string): boolean {
  const idx = list.findIndex((n) => n.permCode === permCode);
  if (idx > -1) {
    list.splice(idx, 1);
    return true;
  }
  for (const n of list) {
    if (n.children && removeNodeFromCustom(n.children, permCode)) return true;
  }
  return false;
}

// ====== 编辑标题 ======
function startEditTitle(data: CustomMenuNode, event: MouseEvent) {
  editingId.value = data.permCode;
  editingBackup.value = data.permName;
  nextTick(() => {
    const inputEl = editInputRef.value?.$el?.querySelector('input') as HTMLInputElement | undefined;
    inputEl?.focus();
    inputEl?.select();
  });
}

function confirmEditTitle(data: CustomMenuNode) {
  if (!editingId.value) return;
  const name = data.permName.trim();
  if (!name) {
    data.permName = editingBackup.value;
  } else {
    data.permName = name;
    if (!data._new) data._changed = editingBackup.value !== name;
  }
  editingId.value = null;
  editingBackup.value = '';
}

function cancelEditTitle(data: CustomMenuNode) {
  data.permName = editingBackup.value;
  editingId.value = null;
  editingBackup.value = '';
}

function exitAllEdit() {
  if (editingId.value) {
    const node = findNodeInCustom(customMenus.value, editingId.value);
    if (node) node.permName = editingBackup.value;
    editingId.value = null;
  }
}

// ====== 图标编辑 ======
function handleEditIcon(data: CustomMenuNode) {
  editingIconNode.value = data;
  editingIcon.value = data.icon || 'Menu';
  iconDialogVisible.value = true;
}

function confirmIcon() {
  if (editingIconNode.value) {
    editingIconNode.value.icon = editingIcon.value;
    if (!editingIconNode.value._new) editingIconNode.value._changed = true;
  }
  iconDialogVisible.value = false;
}

// ====== 添加自定义目录 ======
const dirSelectData = computed(() => {
  function filterDirs(nodes: CustomMenuNode[]): CustomMenuNode[] {
    return nodes
      .filter((n) => isDirNode(n))
      .map((n) => ({ ...n, children: n.children ? filterDirs(n.children) : undefined }));
  }
  return [{ permCode: '__root__', permName: '根级别', children: filterDirs(customMenus.value) }];
});

function isDirNode(node: CustomMenuNode): boolean {
  return !node.routePath || !!(node.children && node.children.length > 0);
}

function showAddDirDialog() {
  newDirName.value = '';
  newDirParent.value = undefined;
  addDirDialogVisible.value = true;
}

function confirmAddDir() {
  const name = newDirName.value.trim();
  if (!name) return;

  dirCounter++;
  const dirNode: CustomMenuNode = {
    permCode: `__dir_${dirCounter}_${Date.now()}`,
    permName: name,
    icon: 'Folder',
    children: [],
    _new: true,
    _changed: false,
  };

  if (newDirParent.value && newDirParent.value !== '__root__') {
    const parent = findNodeInCustom(customMenus.value, newDirParent.value);
    if (parent) {
      if (!parent.children) parent.children = [];
      parent.children.push(dirNode);
    }
  } else {
    customMenus.value.push(dirNode);
  }

  addDirDialogVisible.value = false;
}

// ====== 删除 ======
function handleDelete(_node: any, itemData: CustomMenuNode) {
  ElMessageBox.confirm(
    `确定要删除【${itemData.permName}】吗？`,
    '提示',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' },
  ).then(() => {
    removeNodeFromCustom(customMenus.value, itemData.permCode);
  }).catch(() => {});
}

// ====== 拖拽限制 ======
function allowDrop(_draggingNode: any, dropNode: any, type: 'prev' | 'inner' | 'next'): boolean {
  if (type === 'inner') {
    const dropData = dropNode.data as CustomMenuNode;
    if (isPageNode(dropData)) return false;
  }
  return true;
}

function handleNodeDrop() {
  markAllChanged(customMenus.value);
}

function markAllChanged(nodes: CustomMenuNode[]) {
  for (const n of nodes) {
    if (!n._new) n._changed = true;
    if (n.children) markAllChanged(n.children);
  }
}

// ====== 工具栏操作 ======
async function handleSave() {
  const defaultPageCodes = new Set<string>();
  function walkDefault(nodes: PermissionTreeNode[]) {
    for (const n of nodes) {
      if (n.routePath) defaultPageCodes.add(n.permCode);
      if (n.children) walkDefault(n.children);
    }
  }
  walkDefault(defaultMenus.value);

  const invalidEntries: string[] = [];
  function check(nodes: CustomMenuNode[]) {
    for (const n of nodes) {
      if (!isCustomDir(n) && n.routePath && !defaultPageCodes.has(n.permCode)) {
        invalidEntries.push(`${n.permName} (${n.permCode})`);
      }
      if (n.children) check(n.children);
    }
  }
  check(customMenus.value);

  if (invalidEntries.length > 0) {
    await ElMessageBox.alert(
      `以下页面在当前可用菜单中已不存在（可能已被移除）：\n${invalidEntries.join('\n')}\n\n请先移除这些页面后再保存。`,
      '校验失败',
      { type: 'error' },
    );
    throw new Error('校验失败：存在已删除的页面');
  }

  await new ApiAppTypeSaveCustomMenu({
    params: { id: appTypeId.value },
    body: { data: customMenus.value.map(stripEditState) },
  }, { hintSuccess: true });
  await loadData();
}

function handleReset() {
  ElMessageBox.confirm(
    '重置将用当前可用菜单完全覆盖自定义菜单，所有自定义数据将丢失。确定继续？',
    '确认重置',
    { confirmButtonText: '确定重置', cancelButtonText: '取消', type: 'warning' },
  ).then(() => {
    customMenus.value = copyDefaultTree(defaultMenus.value, new Set());
    ElMessage.success('已重置为可用菜单结构');
  }).catch(() => {});
}

function handleClear() {
  ElMessageBox.confirm(
    '清空后将删除自定义菜单数据，恢复使用可用菜单。确定继续？',
    '确认清空',
    { confirmButtonText: '确定清空', cancelButtonText: '取消', type: 'warning' },
  ).then(async () => {
    loading.value = true;
    try {
      await new ApiAppTypeClearCustomMenu({ params: { id: appTypeId.value } }, { hintSuccess: true });
      customMenus.value = [];
    } catch {} finally {
      loading.value = false;
    }
  }).catch(() => {});
}

function stripEditState(node: CustomMenuNode): CustomMenuItemDto {
  const obj: CustomMenuItemDto = {
    permCode: node.permCode,
    permName: node.permName,
    icon: node.icon,
    routePath: node.routePath,
    sortOrder: node.sortOrder,
  };
  if (node.children && node.children.length > 0) {
    obj.children = node.children.map(stripEditState);
  }
  return obj;
}

// ====== 弹窗确认 ======
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
    gap: 8px;
    padding: 10px 16px;
    border-bottom: 1px solid var(--el-border-color-light);
    background: var(--el-bg-color);
    flex-shrink: 0;
    flex-wrap: wrap;
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
    padding: 10px 16px;
    font-size: 13px;
    font-weight: 600;
    border-bottom: 1px solid var(--el-border-color-lighter);
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
  }

  &__tree {
    flex: 1;
    padding: 8px 12px;
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 160px;
    color: var(--el-text-color-placeholder);
    font-size: 13px;
    gap: 8px;
  }
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
  padding: 2px 0;

  &--readonly { cursor: default; }
  &--editable { width: 100%; }

  &__name {
    flex: 1; min-width: 0;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    &.is-change { color: #e6a23c; }
    &.is-new { color: #07b132; }
  }

  &__code {
    font-size: 10px;
    color: var(--el-text-color-placeholder);
    flex-shrink: 0;
  }

  &__synced {
    flex-shrink: 0;
    color: var(--el-color-success);
    display: flex; align-items: center;
  }

  &__icon {
    cursor: pointer; flex-shrink: 0;
    &:hover { color: var(--el-color-primary); }
  }

  &__input { width: 130px; flex-shrink: 0; }
  &__del { flex-shrink: 0; }
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;

  &__item {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 4px; height: 56px;
    border: 1px solid var(--el-border-color); border-radius: 4px; cursor: pointer;
    transition: all 0.15s;
    &:hover { border-color: var(--el-color-primary); background: var(--el-fill-color-light); }
    &.is-active { border-color: var(--el-color-primary); background: var(--el-color-primary-light-9); }
  }

  &__label {
    font-size: 10px; color: var(--el-text-color-secondary);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%;
  }
}
</style>
