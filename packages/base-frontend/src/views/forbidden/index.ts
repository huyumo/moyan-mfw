import ForbiddenPage from './Index.vue';

export default {
  page: ForbiddenPage,
  path: '403',
  name: '权限不足',
  auth: true,
  hidden: true,
};
