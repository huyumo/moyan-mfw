import { definePageConfig } from '../../../router/routes';
import RoleList from './Index.vue';

export default definePageConfig({
  page: RoleList,
  path: 'role',
  name: '角色管理',
  icon: 'UserFilled',
  auth: true,
  order: 3,
  keepAlive: true,
  permissions: ['添加','编辑','删除'],
});
