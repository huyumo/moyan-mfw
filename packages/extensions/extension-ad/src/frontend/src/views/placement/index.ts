import { definePageConfig } from 'moyan-mfw-base/frontend'
import PlacementList from './Index.vue'

export default definePageConfig({
  page: PlacementList,
  path: 'placement',
  name: '广告位管理',
  icon: 'CollectionTag',
  auth: true,
  order: 1,
  permissions: ['添加', '编辑', '删除'],
})
