/**
 * @fileoverview 菜单树配置类型定义
 *
 * 定义纯数据的菜单树结构，前后端共享使用。
 * 前端基于此配置构建 Vue Router 路由，后端基于此配置同步权限数据。
 *
 * 设计原则：
 * - 菜单节点不含 Vue 组件引用（前端通过 componentMap 单独映射）
 * - 有 children 的节点 = MENU 分组（生成重定向路由）
 * - 无 children 的节点 = PAGE 页面（生成实际路由）
 * - 每个 AppType 拥有独立的菜单树配置
 */

/**
 * 菜单节点配置（纯数据，不含 Vue 组件引用）。
 *
 * @example
 * ```typescript
 * // 简单页面节点
 * { path: 'dashboard', name: '首页', icon: 'DataBoard' }
 *
 * // 带操作权限的页面节点
 * { path: 'sys/user', name: '用户管理', permissions: ['添加', '编辑', '删除'] }
 *
 * // MENU 分组节点（含子页面）
 * { path: 'sys', name: '系统管理', icon: 'Setting', children: [
 *   { path: 'sys/user', name: '用户管理', ... },
 *   { path: 'sys/role', name: '角色管理', ... },
 * ]}
 * ```
 */
export interface MenuNode {
  /** 路由路径片段，相对于父路径，如 `'user'`、`'detail/:id'` */
  path: string;
  /** 显示名称（同时作为菜单标签和权限节点名称） */
  name: string;
  /** Element Plus 图标名称（如 `'User'`、`'Setting'`） */
  icon?: string;
  /** 是否在侧边栏菜单中隐藏，默认 false */
  hidden?: boolean;
  /** 是否需要登录认证，默认 true */
  auth?: boolean;
  /** 操作权限名称列表，如 `['添加', '编辑', '删除']`。仅对 PAGE 节点有效 */
  permissions?: string[];
  /**
   * 自定义权限编码。
   * 设置后直接使用此编码作为 `permCode`，否则由同步服务自动生成。
   * 格式示例：`'ext:ad:placement'`
   */
  permCode?: string;
  /**
   * 显示模式。
   * - `'NORMAL'`（默认）：常规模式，所有有权限的用户可见可访问
   * - `'DEV'`：开发者模式，仅开发者（`isDeveloper`）可见可访问
   *
   * 设为 `'DEV'` 的页面/菜单在同步后写入数据库 `sys_permissions.showMode`，
   * 后端 `getUserPermissions` 和前端路由守卫均会对非开发者进行过滤/拦截。
   */
  showMode?: 'NORMAL' | 'DEV';
  /**
   * 子节点列表。
   * - 有 children：该节点为 MENU 分组类型，生成重定向路由（redirect 到第一个子页面）
   * - 无 children：该节点为 PAGE 页面类型，生成实际路由
   */
  children?: MenuNode[];
}

/**
 * 应用类型菜单树配置。
 *
 * 每个 AppType 拥有独立的菜单树，当用户切换到不同 AppType 的应用时，
 * 前端侧边栏菜单自动切换为对应 AppType 的菜单树。
 *
 * @example
 * ```typescript
 * const systemMenuTree: AppTypeMenuConfig = {
 *   appTypeCode: 'system',
 *   label: '系统管理',
 *   icon: 'Setting',
 *   children: [
 *     { path: 'dashboard', name: '首页', icon: 'DataBoard' },
 *     { path: 'sys', name: '系统管理', icon: 'Setting', children: [
 *       { path: 'sys/user', name: '用户管理', permissions: ['添加', '编辑', '删除'] },
 *     ]},
 *   ],
 * };
 * ```
 */
export interface AppTypeMenuConfig {
  /** 绑定的应用类型编码（如 `'system'`、`'supplier'`） */
  appTypeCode: string;
  /** 绑定的角色编码，同步时仅同步该角色的权限数据（如 `'super_admin'`、`'supplier_admin'`） */
  roleCode: string;
  /** 菜单树分组显示标签（用于顶部导航或双栏布局的顶级菜单） */
  label: string;
  /** 菜单树分组图标 */
  icon?: string;
  /** 该应用类型下的完整菜单树（顶级节点列表） */
  children: MenuNode[];
}
