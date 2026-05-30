import { definePageConfig } from '../../router/routes';

export default definePageConfig({
  page: () => import('./Index.vue'),
  path: 'route-group',
  name: '路由组',
  icon: 'Folder',
  auth: true,
  order: 2,
});
