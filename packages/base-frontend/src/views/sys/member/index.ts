/**
 * @fileoverview 成员管理页面配置
 */

import MemberList from './Index.vue';

export default {
  page: MemberList,
  path: 'member',
  name: '成员管理',
  icon: 'Avatar',
  auth: true,
  order: 4,
};