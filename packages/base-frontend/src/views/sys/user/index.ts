/**
 * @fileoverview 用户管理页面配置
 */

import UserList from './Index.vue';

export default {
  page: UserList,
  path: 'user',
  name: '用户管理',
  icon: 'User',
  auth: true,
  order: 1,
};