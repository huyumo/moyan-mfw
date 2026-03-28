import { Plugin } from 'vue'
import PointSelect from './pointSelect.vue'
import { config } from '@/config'

const plugin: Plugin = (app) => {
  ;((w: any) => {
    w._AMapSecurityConfig = { securityJsCode: config.alimap.securityJsCode }
  })(window)

  app.component('alimap-point-select', PointSelect)
}

export default plugin

export { PointSelect }

export interface MarkerData {
  id?: number
  name: string
  lat: number
  lng: number
  address: string
  adcode: string
  citycode: string
  city: string
  district: string
  province: string
  street: string
  street_number: string
  township: string
}

export interface PointSelectProps {
  height?: string
  width?: string
  modelValue?: MarkerData
  showPointSet?: boolean
}
