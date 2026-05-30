import { definePageConfig } from '../../../router/routes';

export default definePageConfig({
  page: () => import('./Index.vue'),
  path: 'permission',
  name: '权限管理',
  icon: 'Lock',
  auth: true,
  order: 5,
  permissions: ['编辑'],
});
