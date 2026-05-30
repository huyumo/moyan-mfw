import { definePageConfig } from '../../../router/routes';

export default definePageConfig({
  page: () => import('./Index.vue'),
  path: 'permission-pc',
  name: 'PC 权限管理',
  icon: 'Monitor',
  auth: true,
  order: 6,
  permissions: ['编辑'],
});
