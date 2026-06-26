import DocumentTestPage from './Index.vue';
import { defineBusinessPageConfig } from '@/permissions';

export default defineBusinessPageConfig({
  page: DocumentTestPage,
  path: 'document-test',
  name: '文档管理测试',
  icon: 'Document',
  auth: true,
  order: 98,
  permCode: 'custom:ext:document:test',
  permissions: ['编辑', '添加', '删除'],
});
