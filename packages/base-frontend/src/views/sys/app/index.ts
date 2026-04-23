/**
 * @fileoverview 应用实例管理页面配置
 */
import { buildPerValue } from '@/utils/permissions';
import AppList from './Index.vue';

export default {
  page: AppList,
  path: 'app',
  name: '应用管理',
  icon: 'Application',
  auth: true,
  order: 2,
  permissionValue: buildPerValue(['编辑']),
};