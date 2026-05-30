import { definePageConfig } from '../../../router/routes';
import MemberList from './Index.vue';

export default definePageConfig({
  page: MemberList,
  path: 'member',
  name: '成员管理',
  icon: 'Avatar',
  auth: true,
  order: 4,
  permissions: ['添加','编辑','删除'],
});
