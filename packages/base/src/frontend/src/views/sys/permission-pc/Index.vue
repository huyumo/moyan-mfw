<!--
/**
 * @fileoverview PC 权限管理页面
 * @description 使用 PermissionManager 组件，API 调用已封装在组件内部
 * 注意：同步路由 API 不需要 appTypeId 参数
 *       Permission 实体是全局定义，同步路由只是将路由转换为 Permission 实体数据（全局）
 *       应用类型绑定是在"应用类型管理页面"的"权限池配置"中完成的
 */
-->
<template>
  <PermissionManager
    ref="managerRef"
    permission-type="PC"
    title="PC 权限树"
  >
    <template #toolbar-extra>
      <el-button type="primary" data-testid="permission-sync-btn" @click="handleSync">
        <el-icon><Refresh /></el-icon>
        同步路由
      </el-button>
    </template>
  </PermissionManager>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Refresh } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import PermissionManager from '../../../../components/business/permission-manager/Index.vue';
import type { RouteNodeDto } from '../../../../apis/sys/schemas';
import { ApiPermissionSyncPermissions } from '../../../../apis/sys';
import { buildPerValue } from '../../../../utils/permissions';

defineOptions({ name: 'MfwPcPermissionList' });

const router = useRouter();
const managerRef = ref<InstanceType<typeof PermissionManager>>();

// ========== PC 特有功能：路由同步 ==========

/**
 * 收集路由信息（扁平化处理）
 * 从 router.getRoutes() 返回的扁平数组中提取有效路由
 */
const collectRouteInfos = (
  routes: RouteRecordRaw[],
  processedPaths: Set<string> = new Set(),
): Array<{ path: string; name: string; permissionValue?: string }> => {
  const result: Array<{ path: string; name: string; permissionValue?: string }> = [];

  for (const route of routes) {
    const meta = route.meta as any;

    // 过滤条件：
    // 1. 空路径或根路径 - 跳过但处理其子路由
    if (route.path === '' || route.path === '/') {
      continue;
    }

    // 2. 无标题 - 跳过
    if (!meta?.title) {
      continue;
    }

    // 3. 公开页面（无需权限控制）- 跳过
    const isPublic = meta.auth === false || meta.requiresAuth === false;
    const isHiddenMenu = meta.hidden === true || meta.menu === false;
    if (isPublic || isHiddenMenu) {
      continue;
    }

    // 构建完整路径（router.getRoutes() 返回的都是绝对路径）
    const fullPath = route.path.startsWith('/') ? route.path : `/${route.path}`;

    // 去重
    if (processedPaths.has(fullPath)) {
      continue;
    }
    processedPaths.add(fullPath);

    result.push({
      path: fullPath,
      name: meta.title as string,
      permissionValue: (meta.permissionValue
        || (meta.permissions?.length ? buildPerValue(meta.permissions).toString() : undefined)
      ) as string | undefined,
    });
  }

  return result;
};

/**
 * 根据路径关系构建树形结构
 * router.getRoutes() 返回扁平数组，需要根据路径推导父子关系
 */
const buildRouteTree = (flatRoutes: Array<{ path: string; name: string; permissionValue?: string }>): RouteNodeDto[] => {
  // 按路径深度排序（先处理父节点）
  flatRoutes.sort((a, b) => {
    const depthA = a.path.split('/').filter(Boolean).length;
    const depthB = b.path.split('/').filter(Boolean).length;
    return depthA - depthB;
  });

  // 创建路径到节点的映射
  const nodeMap = new Map<string, RouteNodeDto & { children?: RouteNodeDto[] }>();
  const rootNodes: RouteNodeDto[] = [];

  // 先创建所有节点
  for (const route of flatRoutes) {
    const node: RouteNodeDto & { children?: RouteNodeDto[] } = {
      path: route.path,
      name: route.name,
      permissionValue: route.permissionValue,
      children: [],
    };
    nodeMap.set(route.path, node);
  }

  // 构建树形结构（根据路径关系）
  for (const route of flatRoutes) {
    const node = nodeMap.get(route.path)!;
    const pathSegments = route.path.split('/').filter(Boolean);
    const depth = pathSegments.length;

    if (depth === 1) {
      // 顶级路由，作为根节点
      rootNodes.push(node);
    } else {
      // 查找父节点路径
      const parentPath = '/' + pathSegments.slice(0, -1).join('/');
      const parent = nodeMap.get(parentPath);

      if (parent) {
        // 父节点存在，挂载到父节点下
        parent.children!.push(node);
      } else {
        // 父节点不存在，作为根节点（可能是路径不连续）
        rootNodes.push(node);
      }
    }
  }

  // 清理空的 children 数组
  const cleanEmptyChildren = (nodes: RouteNodeDto[]) => {
    nodes.forEach(node => {
      if (node.children && node.children.length === 0) {
        delete node.children;
      } else if (node.children) {
        cleanEmptyChildren(node.children);
      }
    });
  };
  cleanEmptyChildren(rootNodes);

  return rootNodes;
};

/**
 * 转换路由配置为 API 格式（树形结构）
 * router.getRoutes() 返回扁平数组，需要构建树形结构
 */
const convertRoutesToApiFormat = (routes: RouteRecordRaw[]): RouteNodeDto[] => {
  // 1. 收集所有有效路由（扁平）
  const processedPaths = new Set<string>();
  const flatRoutes = collectRouteInfos(routes, processedPaths);

  // 2. 根据路径关系构建树形结构
  return buildRouteTree(flatRoutes);
};

// 同步路由（直接同步，无需预览）
const handleSync = async () => {
  const routes = convertRoutesToApiFormat(router.getRoutes());

  try {
    await new ApiPermissionSyncPermissions({
      body: {
        routes,
      },
    }, { hintSuccess: true });
    managerRef.value?.reload();
  } catch (error) {
  }
};
</script>
