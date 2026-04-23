import { definePageConfig } from '../../../router/routes';
import PermissionList from './Index.vue';

export default definePageConfig({
  page: PermissionList,
  path: 'permission',
  name: '权限管理',
  icon: 'Lock',
  auth: true,
  order: 5,
  permissions: ['编辑'],
});
