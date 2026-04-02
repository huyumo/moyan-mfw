/**
 * @fileoverview 审计日志页面配置
 */

import AuditLogList from './Index.vue';

export default {
  page: AuditLogList,
  path: 'audit-log',
  name: '审计日志',
  icon: 'Document',
  auth: true,
  order: 7,
};