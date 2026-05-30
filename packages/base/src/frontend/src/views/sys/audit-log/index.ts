import { definePageConfig } from '../../../router/routes';

export default definePageConfig({
  page: () => import('./Index.vue'),
  path: 'audit-log',
  name: '审计日志',
  icon: 'Document',
  auth: true,
  order: 7,
});
