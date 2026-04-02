/**
 * @fileoverview 应用类型管理页面配置
 * @description 开发者模式专属页面
 */

import AppTypeList from './Index.vue';

export default {
  page: AppTypeList,
  path: 'app-type',
  name: '应用类型管理',
  icon: 'Grid',
  auth: true,
  order: 1,
};