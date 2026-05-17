/**
 * @fileoverview 自定义菜单编辑器类型定义
 * @description 自定义菜单节点的前端类型
 */

/** 自定义菜单节点（前端编辑使用） */
export interface CustomMenuNode {
  permCode: string;
  permName: string;
  icon?: string;
  routePath?: string;
  sortOrder?: number;
  children?: CustomMenuNode[];
  editTitle?: boolean;
  old_title?: string;
  is_change?: boolean;
  is_new?: boolean;
}

/** 权限池树节点 */
export interface PermissionTreeNode {
  id: string;
  permCode: string;
  permName: string;
  iconName?: string;
  routePath?: string;
  sortOrder?: number;
  children?: PermissionTreeNode[];
}
