import { definePageConfig } from '../../../router/routes';

export default definePageConfig({
  page: () => import('./Index.vue'),
  path: 'app',
  name: '应用管理',
  icon: 'Application',
  auth: true,
  order: 2,
  permissions: ['添加','编辑','删除'],
})