import { definePageConfig } from 'moyan-mfw-base/frontend'
import AdList from './Index.vue'

export default definePageConfig({
  page: AdList,
  path: 'content',
  name: '广告内容管理',
  icon: 'Files',
  auth: true,
  order: 3,
  permissions: ['添加', '编辑', '删除'],
})
