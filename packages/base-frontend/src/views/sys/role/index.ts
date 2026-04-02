/**
 * @fileoverview 角色管理页面配置
 */

import RoleList from './Index.vue';

export default {
  page: RoleList,
  path: 'role',
  name: '角色管理',
  icon: 'UserFilled',
  auth: true,
  order: 3,
};