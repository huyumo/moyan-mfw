import { definePageConfig } from '../../../router/routes';
import RouteGroup from './Index.vue';

export default definePageConfig({
  page: RouteGroup,
  path: 'route-group',
  name: '路由组',
  icon: 'Folder',
  auth: true,
  order: 2,
});
