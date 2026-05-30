import { definePageConfig } from '../../../router/routes';

export default definePageConfig({
  page: () => import('./Index.vue'),
  path: 'role',
  name: '角色管理',
  icon: 'UserFilled',
  auth: true,
  order: 3,
  permissions: ['添加','编辑','删除'],
});
