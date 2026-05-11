import { definePageConfig } from '../../router/routes';
import ForbiddenPage from './Index.vue';

export default definePageConfig({
  page: ForbiddenPage,
  path: '403',
  name: '权限不足',
  auth: true,
  hidden: true,
});
