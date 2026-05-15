import { definePageConfig } from '@internal/base-frontend'
import TypeList from './Index.vue'

export default definePageConfig({
  page: TypeList,
  path: 'type',
  name: '类型配置',
  icon: 'Setting',
  auth: true,
  order: 1,
  permissions: ['添加', '编辑', '删除'],
})
