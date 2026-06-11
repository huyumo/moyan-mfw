/**
 * @fileoverview 路由配置工具模块。
 *
 * 提供路由扫描和构建的工具函数，业务项目可结合自身 views 目录结构使用。
 *
 * 路由页面加载规则：
 * 1. 页面组件必须存放在 src/views/ 目录下
 * 2. 每个页面是一个独立目录，目录内必须包含 index.ts 或 index.tsx 配置文件
 * 3. 配置文件必须导出：page 组件、path 路径、name 名称
 * 4. 如果找不到配置文件，则自动显示 404 页面
 *
 * 扁平路由架构：
 * - 所有页面路由直接作为 / 的子路由注册，不使用嵌套路由
 * - 模块配置（defineModuleConfig）仅作为菜单分组元数据，注入到页面路由的 meta.moduleInfo 中
 * - 模块路径前缀保留在路由 path 中（如 sys/user），保持 URL 语义清晰
 * - 模块自动生成纯重定向路由（如 /sys → /sys/user），不需要 EmptyLayout 中间层
 *
 * 配置文件示例 (index.ts):
 * ```typescript
 * import Dashboard from './dashboard.vue';
 * export default { page: Dashboard, path: 'dashboard', name: '看板', icon: 'DataBoard', auth: true };
 * ```
 *
 * 模块配置示例 (sys/index.ts):
 * ```typescript
 * export default { type: 'module', name: '系统管理', icon: 'Setting', order: 10 };
 * ```
 */

import type { RouteRecordRaw } from 'vue-router';
import { registerPermissionValues, type PermissionName } from '../utils/permissions';
export { registerPermissionValues, createBusinessPageConfigFn } from '../utils/permissions';

/**
 * 模块配置接口（用于菜单分组，不生成嵌套路由）
 */
export interface ModuleConfig {
  /** 类型：module 表示模块分组 */
  type?: 'module';
  /** 模块/菜单名称 */
  name: string;
  /** 菜单图标 */
  icon?: string;
  /** 菜单顺序 */
  order?: number;
}

/**
 * 页面配置接口（支持泛型扩展权限类型）
 */
export interface PageConfig<T extends string = PermissionName> {
  /** 页面组件 */
  page: unknown;
  /** 路由路径（相对路径，如 'user' 或 'detail/:id'） */
  path: string;
  /** 页面/菜单名称 */
  name: string;
  /** 菜单图标 */
  icon?: string;
  /** 是否需要认证 */
  auth?: boolean;
  /** 菜单顺序 */
  order?: number;
  /** 菜单隐藏 */
  hidden?: boolean;
  /** 页面权限名称列表（definePageConfig 内部自动转为 permissionValue） */
  permissions?: T[];
  /** 权限值（由 definePageConfig 根据 permissions 自动计算，请勿手动设置） */
  permissionValue?: bigint;
  /** 权限编码（如 'ext:ad:placement'），定义后直接使用，否则由后端生成 */
  permCode?: string;
  /** 子页面配置 */
  children?: PageConfig<T>[];
}

/**
 * 判断是否为模块配置
 */
export function isModuleConfig(config: unknown): config is ModuleConfig {
  return typeof config === 'object' && config !== null && (config as ModuleConfig).type === 'module';
}

/**
 * 判断是否为页面配置
 */
export function isPageConfig(config: unknown): config is PageConfig<string> {
  return typeof config === 'object' && config !== null && 'page' in config && 'path' in config && 'name' in config;
}

/**
 * 定义模块配置（提供类型推断和标准化）
 * 模块仅用于菜单分组，不生成 EmptyLayout 嵌套路由
 */
export function defineModuleConfig(config: ModuleConfig): ModuleConfig {
  return config;
}

/**
 * 定义页面配置（提供类型推断和标准化）
 * 内部自动将 permissions 名称列表转为 permissionValue 位运算值
 * @template T - 权限名称类型，默认为 PermissionName
 */
export function definePageConfig<T extends string = PermissionName>(
  config: PageConfig<T>
): PageConfig<T> & { permissionValue?: bigint } {
  return { ...config };
}

/**
 * 从扫描结果构建扁平路由配置。
 *
 * 处理流程：
 * 1. 分离模块配置和页面配置
 * 2. 为每个页面生成扁平路由，将所属模块信息注入 meta.moduleInfo
 * 3. 为有子页面的模块生成纯重定向路由（如 /sys → /sys/user）
 *
 * @param allConfigs - import.meta.glob 扫描结果
 * @param options.skipPaths - 需要跳过的路径（如 '/not-found/', '/forbidden/'）
 * @param options.minSegments - 页面配置所需的最小路径段数（默认 2，跳过只有 1 层的路径）
 * @param options.routePrefix - 路由路径前缀（如 '/ext/ad'），用于扩展包区分路由命名空间
 */
export function buildRoutesFromConfigs(
  allConfigs: Record<string, unknown>,
  options: {
    skipPaths?: string[];
    minSegments?: number;
    routePrefix?: string;
  } = {}
): RouteRecordRaw[] {
  const { skipPaths = ['/not-found/', '/forbidden/', '/login/', '/install/', '/route-group/'], minSegments = 2, routePrefix } = options;
  const prefixPath = routePrefix ? routePrefix.replace(/^\/+|\/+$/g, '') : '';
  const prefixName = prefixPath ? prefixPath.replace(/[^a-zA-Z0-9]+/g, '_') : '';

  // 步骤 1：分离模块配置和页面配置
  const moduleMap = new Map<string, ModuleConfig>();
  const pageConfigs = new Map<string, PageConfig<string>>();

  for (const [path, config] of Object.entries(allConfigs)) {
    if (skipPaths.some(skipPath => path.includes(skipPath))) {
      continue;
    }

    // 从绝对路径提取相对路径（如 '../views/sys/user/index.ts' → 'sys/user'）
    const relativePath = path
      .replace('../views/', '')
      .replace('./views/', '')
      .replace('/index.ts', '')
      .replace('/index.tsx', '');

    if (isModuleConfig(config)) {
      // 模块配置存储在模块目录（如 sys/index.ts）
      moduleMap.set(relativePath, config);
    } else if (isPageConfig(config)) {
      // 页面配置存储在页面目录（如 sys/user/index.ts）
      // 跳过路径段数不足的配置（如只有 1 层的模块 index.ts）
      const segments = relativePath.split('/');
      if (segments.length >= minSegments) {
        pageConfigs.set(relativePath, config);
      }
    }
  }

  // 步骤 2：生成扁平路由，注入模块信息到 meta.moduleInfo
  const routes: RouteRecordRaw[] = [];

  for (const [relativePath, config] of pageConfigs.entries()) {
    const segments = relativePath.split('/').filter(Boolean);

    // 查找所属模块：从最深路径开始匹配，找到页面路径能匹配的最深模块
    // 例如：test/test01/demo01 → 先尝试 test/test01，再尝试 test
    let modulePath = '';
    let moduleConfig: ModuleConfig | undefined;
    for (let i = segments.length - 1; i >= 0; i--) {
      const candidatePath = segments.slice(0, i).join('/');
      if (candidatePath && moduleMap.has(candidatePath)) {
        modulePath = candidatePath;
        moduleConfig = moduleMap.get(candidatePath);
        break;
      }
    }

    // 路由路径：relativePath 的所有目录段 + 页面路径
    // sys/user/index.ts → relativePath='sys/user', path='user' → routePath='sys/user'
    // test/test01/demo01/index.ts → relativePath='test/test01/demo01', path='overview' → routePath='test/test01/demo01/overview'
    const pagePath = config.path || segments[segments.length - 1] || '';
    const dirPath = segments.slice(0, -1).join('/');
    const routePath = dirPath ? `${dirPath}/${pagePath}` : pagePath;
    const fullPath = prefixPath ? `${prefixPath}/${routePath}` : routePath;
    const fullName = `Route_${prefixName ? prefixName + '_' : ''}${segments.join('_')}`;

    const route: RouteRecordRaw = {
      path: fullPath,
      name: fullName || 'Root',
      component: config.page as RouteRecordRaw['component'],
      meta: {
        title: config.name,
        menuLabel: config.name,
        menuIcon: config.icon,
        menuOrder: config.order ?? 50,
        requiresAuth: config.auth ?? true,
        hidden: config.hidden,
        permissions: config.permissions,
        permissionValue: config.permissionValue?.toString(),
        permCode: config.permCode,
        // 将模块信息注入 meta，供菜单构建时按模块分组
        ...(moduleConfig
          ? {
              moduleInfo: {
                modulePath,
                moduleName: moduleConfig.name,
                moduleIcon: moduleConfig.icon,
                moduleOrder: moduleConfig.order ?? 50,
              },
            }
          : {}),
      },
    } as RouteRecordRaw;

    routes.push(route);
  }

  // 步骤 3：为有子页面的模块生成纯重定向路由
  // 当用户访问模块路径（如 /sys）时，自动重定向到该模块下的第一个子路由
  // 不需要 EmptyLayout，仅作 redirect 用途
  for (const [modulePath, moduleConfig] of moduleMap.entries()) {
    const hasChildRoutes = modulePath
      ? routes.some(r => {
          const meta = (r.meta ?? {}) as Record<string, unknown>;
          const info = meta.moduleInfo as { modulePath: string } | undefined;
          if (!info) return false;
          // 支持嵌套模块：匹配直接子路由或更深层的后代路由
          return info.modulePath === modulePath || info.modulePath.startsWith(`${modulePath}/`);
        })
      : routes.length > 0;

    if (hasChildRoutes) {
      const firstChildRoute = modulePath
        ? routes.find(r => {
            const meta = (r.meta ?? {}) as Record<string, unknown>;
            const info = meta.moduleInfo as { modulePath: string } | undefined;
            if (!info) return false;
            return info.modulePath === modulePath || info.modulePath.startsWith(`${modulePath}/`);
          })
        : routes.find(r => {
            const meta = (r.meta ?? {}) as Record<string, unknown>;
            return meta?.title && meta?.menu !== false;
          });

      const moduleRedirectPath = prefixPath
        ? (modulePath ? `${prefixPath}/${modulePath}` : prefixPath)
        : modulePath;

      routes.push({
        path: moduleRedirectPath,
        name: `Module_${prefixName ? prefixName + '_' : ''}${modulePath || 'root'}`,
        redirect: firstChildRoute?.name
          ? { name: firstChildRoute.name as string }
          : `/${moduleRedirectPath}`,
        meta: {
          title: moduleConfig.name,
          menuLabel: moduleConfig.name,
          menuIcon: moduleConfig.icon,
          menuOrder: moduleConfig.order ?? 50,
          menu: true,
        },
      } as RouteRecordRaw);
    }
  }

  return routes;
}

/**
 * 从模块配置树构建扩展包路由（替代 import.meta.glob 扫描方案）。
 *
 * 模块配置通过 `children` 字段直接引用子页面配置，构成显式依赖树，
 * 避免运行时文件扫描，享受完整的 TypeScript 类型检查和 tree-shaking。
 *
 * @param moduleConfig - 模块配置（含 children 子页面列表）
 * @param moduleName   - 扩展模块名（如 'ad'），自动拼接为 `/ext/${moduleName}` 前缀
 * @param options.namespaceName - 命名空间显示名称（如 '广告管理'），
 *   存在时生成 `ext` 命名空间重定向路由，否则生成 `ext/{moduleName}` 模块重定向路由
 *
 * @example
 * ```typescript
 * // src/views/index.ts
 * import placementPage from './placement/index'
 * const config = defineModuleConfig({ type: 'module', name: '广告管理', icon: 'Notification', order: 60 })
 * export default { ...config, children: [placementPage] }
 *
 * // src/index.ts
 * import { buildRoutesFromModuleTree } from 'moyan-mfw-base/frontend'
 * import adModuleConfig from './views/index'
 * export const adRoutes = buildRoutesFromModuleTree(adModuleConfig, 'ad', { namespaceName: '广告管理' })
 * ```
 */
export function buildRoutesFromModuleTree(
  moduleConfig: ModuleConfig & { children?: unknown[] },
  moduleName: string,
  options?: {
    namespaceName?: string;
  }
): RouteRecordRaw[] {
  const prefixPath = `ext/${moduleName}`;
  const children = moduleConfig.children ?? [];

  const pageRoutes: RouteRecordRaw[] = [];

  for (const child of children) {
    if (!isPageConfig(child)) continue;

    pageRoutes.push({
      path: `${prefixPath}/${child.path}`,
      name: `Route_ext_${moduleName}_${child.path.replace(/\//g, '_')}`,
      component: child.page as RouteRecordRaw['component'],
      meta: {
        title: child.name,
        menuLabel: child.name,
        menuIcon: child.icon,
        menuOrder: child.order ?? 50,
        requiresAuth: child.auth ?? true,
        hidden: child.hidden,
        permissions: child.permissions,
        permissionValue: child.permissionValue?.toString(),
        permCode: child.permCode,
        moduleInfo: {
          modulePath: undefined,
          moduleName: moduleConfig.name,
          moduleIcon: moduleConfig.icon,
          moduleOrder: moduleConfig.order ?? 50,
        },
      },
    } as unknown as RouteRecordRaw);
  }

  if (!options?.namespaceName) {
    if (pageRoutes.length > 0) {
      const firstChildPath = pageRoutes[0].path?.toString().replace(`${prefixPath}/`, '');

      pageRoutes.unshift({
        path: prefixPath,
        name: `Module_ext_${moduleName}`,
        redirect: `/${prefixPath}/${firstChildPath}`,
        meta: {
          title: moduleConfig.name,
          menuLabel: moduleConfig.name,
          menuIcon: moduleConfig.icon,
          menuOrder: moduleConfig.order ?? 50,
          menu: true,
        },
      } as RouteRecordRaw);
    }
  }

  if (options?.namespaceName) {
    const firstChildPath = pageRoutes[0]?.path?.toString().replace(`${prefixPath}/`, '');

    pageRoutes.push({
      path: 'ext',
      name: 'Namespace_ext',
      redirect: `/${prefixPath}/${firstChildPath}`,
      meta: {
        title: options.namespaceName,
        menuLabel: options.namespaceName,
        menuIcon: moduleConfig.icon,
        menuOrder: moduleConfig.order ?? 50,
        menu: true,
      },
    } as RouteRecordRaw);
  }

  return pageRoutes;
}

/**
 * 基包内部使用：扫描基包自己的 views 目录构建路由。
 * minSegments 设为 1 以允许单层路由（如 dashboard）被创建。
 */
export function buildBasePackageRoutes(): RouteRecordRaw[] {
  const allConfigs = import.meta.glob('../views/**/index.{ts,tsx}', {
    eager: true,
    import: 'default',
  });
  return buildRoutesFromConfigs(allConfigs, { minSegments: 1 });
}

/**
 * 扩展包路由构建器：自动拼接 `ext/模块名/页面` 前缀。
 *
 * 生成的路径结构：
 *   无 namespaceName → 三层：ext/ad（模块重定向）→ ext/ad/placement（页面）
 *   有 namespaceName → 两层：ext（作为模块入口，title=namespaceName）→ ext/ad/placement（页面）
 *
 * @param allConfigs - `import.meta.glob('./views/.../index.{ts,tsx}')` 的扫描结果
 * @param moduleName  - 扩展模块名（如 'ad'），自动拼接为 `/ext/${moduleName}` 前缀
 * @param options.minSegments   - 页面最小路径段数（默认 1，允许单层路由）
 * @param options.skipPaths     - 需要跳过的路径
 * @param options.namespaceName - 命名空间显示名称（如 '广告管理'），存在时 ext 路由作为模块入口，不再生成 ext/moduleName 中间层
 */
export function buildExtensionRoutes(
  allConfigs: Record<string, unknown>,
  moduleName: string,
  options?: {
    minSegments?: number;
    skipPaths?: string[];
    namespaceName?: string;
  }
): RouteRecordRaw[] {
  const routes = buildRoutesFromConfigs(allConfigs, {
    ...options,
    minSegments: options?.minSegments ?? 1,
    routePrefix: `/ext/${moduleName}`,
  });

  const prefixPath = `ext/${moduleName}`;

  if (!options?.namespaceName) {
    const moduleConfigEntry = Object.entries(allConfigs).find(([, config]) =>
      isModuleConfig(config)
    );
    const moduleDisplayName =
      (moduleConfigEntry?.[1] as ModuleConfig | undefined)?.name || moduleName;

    const moduleRedirectRoute: RouteRecordRaw = {
      path: prefixPath,
      name: `Module_ext_${moduleName}`,
      redirect: `/${prefixPath}/${routes[0]?.path?.replace(`${prefixPath}/`, '')}`,
      meta: {
        title: moduleDisplayName,
        menuLabel: moduleDisplayName,
        menuIcon: (moduleConfigEntry?.[1] as ModuleConfig | undefined)?.icon,
        menuOrder: (moduleConfigEntry?.[1] as ModuleConfig | undefined)?.order ?? 50,
        menu: true,
      },
    } as RouteRecordRaw;

    if (!routes.some(r => r.path === prefixPath)) {
      routes.unshift(moduleRedirectRoute);
    }
  }

  if (options?.namespaceName) {
    const moduleConfigEntry = Object.entries(allConfigs).find(([, config]) =>
      isModuleConfig(config)
    );

    routes.push({
      path: 'ext',
      name: 'Namespace_ext',
      redirect: `/${prefixPath}/${routes[0]?.path?.replace(`${prefixPath}/`, '')}`,
      meta: {
        title: options.namespaceName,
        menuLabel: options.namespaceName,
        menuIcon: (moduleConfigEntry?.[1] as ModuleConfig | undefined)?.icon,
        menuOrder: (moduleConfigEntry?.[1] as ModuleConfig | undefined)?.order ?? 50,
        menu: true,
      },
    } as RouteRecordRaw);
  }

  return routes;
}
