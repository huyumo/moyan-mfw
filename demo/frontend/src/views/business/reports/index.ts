import Reports from './Index.vue';
import { defineBusinessPageConfig } from '@/permissions';

export default defineBusinessPageConfig({
  page: Reports,
  path: 'reports',
  name: '报表中心',
  icon: 'PieChart',
  auth: true,
  order: 2,
});