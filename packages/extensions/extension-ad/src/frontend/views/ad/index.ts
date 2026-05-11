import { definePageConfig } from 'moyan-mfw-base/frontend'
import AdList from './Index.vue'

export default definePageConfig({
  page: AdList,
  path: 'content',
  name: '广告内容管理',
  icon: 'Files',
  auth: true,
  order: 3,
  permissionValue: 0x0100_0100n,
})
