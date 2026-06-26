import ConfigTestPage from './Index.vue';
import { defineBusinessPageConfig } from '@/permissions';
export default defineBusinessPageConfig({
  page: ConfigTestPage,
  path: 'config-test',
  name: '配置测试',
  icon: 'Setting',
  auth: true,
  order: 99,
  permCode:'custom:ext:config:test',
  permissions: ['编辑'],
});
