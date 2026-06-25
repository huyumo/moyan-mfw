/**
 * @fileoverview 搜索面板自定义组件测试页路由配置
 */

import { defineBusinessPageConfig } from '@/permissions';
import SearchPanelTest from './Index.vue';

export default defineBusinessPageConfig({
  page: SearchPanelTest,
  path: 'search-panel-test',
  name: '搜索面板测试',
  icon: 'Document',
  auth: false,
  order: 98,
});
