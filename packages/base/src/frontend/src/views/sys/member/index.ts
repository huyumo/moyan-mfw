import { definePageConfig } from '../../../router/routes';

export default definePageConfig({
  page: () => import('./Index.vue'),
  path: 'member',
  name: '成员管理',
  icon: 'Avatar',
  auth: true,
  order: 4,
  permissions: ['添加','编辑','删除'],
});
