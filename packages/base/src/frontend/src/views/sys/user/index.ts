import { definePageConfig } from '../../../../router/routes';
import UserList from './Index.vue';

export default definePageConfig({
  page: UserList,
  path: 'user',
  name: '用户管理',
  icon: 'User',
  auth: true,
  order: 1,
  permissions:['添加','删除','编辑']
});
