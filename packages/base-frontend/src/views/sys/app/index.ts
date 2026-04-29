import { definePageConfig } from '../../../router/routes';
import AppList from './Index.vue';

export default definePageConfig({
  page: AppList,
  path: 'app',
  name: '应用管理',
  icon: 'Application',
  auth: true,
  order: 2,
  keepAlive: true,
  permissions: ['添加','编辑','删除'],
})