import { definePageConfig } from 'moyan-mfw-base/frontend';
import Dashboard from './Index.vue';

export default definePageConfig({
  page: Dashboard,
  path: 'dashboard',
  name: '仪表盘',
  icon: 'Odometer',
  auth: true,
  order: 1,
});
