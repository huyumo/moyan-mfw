import { definePageConfig } from '../../router/routes';
import LoginPage from './index.vue';

export default definePageConfig({
  page: LoginPage,
  path: 'login',
  name: '登录',
  auth: false,
  hidden: true,
});
