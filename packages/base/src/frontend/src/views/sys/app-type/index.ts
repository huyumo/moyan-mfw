import { definePageConfig } from '../../../router/routes';
import AppTypeList from './Index.vue';

export default definePageConfig({
  page: AppTypeList,
  path: 'app-type',
  name: '应用类型管理',
  icon: 'Grid',
  auth: true,
  order: 1,
  permissions: ['编辑'],
});
