/**
 * @fileoverview 应用类型详情页配置
 * @description 配置应用类型详情页路由
 */

import AppTypeDetail from './Index.vue';

export default {
  page: AppTypeDetail,
  path: 'app-type-detail/:id',
  name: '应用类型详情',
  icon: 'Grid',
  auth: true,
  hidden: true, // 不在菜单中显示
};