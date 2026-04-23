import { definePageConfig } from '../../router/routes';
import Dashboard from './Index.vue';

export default definePageConfig({
  page: Dashboard,
  path: 'dashboard',
  name: '首页',
  icon: 'DataBoard',
  auth: true,
  order: 1,
});
