import { definePageConfig } from 'moyan-mfw-base/frontend'
import TypeList from './Index.vue'

export default definePageConfig({
  page: TypeList,
  path: 'type',
  name: '类型配置',
  icon: 'Setting',
  auth: true,
  order: 1,
  permissionValue: 0x0100_0010n,
})
