import { definePageConfig } from '../../router/routes';
import Dashboard from './index.vue';

export default definePageConfig({
  page: Dashboard,
  path: 'dashboard',
  name: '首页',
  icon: 'DataBoard',
  auth: true,
  order: 1,
});
