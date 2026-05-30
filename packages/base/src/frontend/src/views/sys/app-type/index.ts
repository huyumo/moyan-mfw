import { definePageConfig } from '../../../router/routes';

export default definePageConfig({
  page: () => import('./Index.vue'),
  path: 'app-type',
  name: '应用类型管理',
  icon: 'Grid',
  auth: true,
  order: 1,
  permissions: ['编辑'],
});
