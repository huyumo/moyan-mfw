import { definePageConfig } from 'moyan-mfw-base/frontend';

export default definePageConfig({
  page: () => import('./Index.vue'),
  path: 'placement',
  name: '广告位管理',
  icon: 'CollectionTag',
  auth: true,
  order: 1,
  permCode:'ext:ad:placement',
  permissions: ['添加', '编辑', '删除'],
})
