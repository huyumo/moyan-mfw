import { definePageConfig } from '../../../router/routes';
import NotFoundPage from './Index.vue';

export default definePageConfig({
  page: NotFoundPage,
  path: '404',
  name: '页面不存在',
  auth: false,
  hidden: true,
});
