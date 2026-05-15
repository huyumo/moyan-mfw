import { definePageConfig } from '../../../../router/routes';
import AuditLogList from './Index.vue';

export default definePageConfig({
  page: AuditLogList,
  path: 'audit-log',
  name: '审计日志',
  icon: 'Document',
  auth: true,
  order: 7,
});
