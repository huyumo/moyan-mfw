/**
 * @fileoverview 权限管理页面配置（普通权限）
 */

import PermissionList from './Index.vue';

export default {
  page: PermissionList,
  path: 'permission',
  name: '权限管理',
  icon: 'Lock',
  auth: true,
  order: 5,
};