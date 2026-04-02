/**
 * @fileoverview PC 权限管理页面配置
 */

import PcPermissionList from './Index.vue';

export default {
  page: PcPermissionList,
  path: 'permission-pc',
  name: 'PC 权限管理',
  icon: 'Monitor',
  auth: true,
  order: 6,
};