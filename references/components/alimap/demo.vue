<template>
  <div id="mymap" style="height:500px;width:100%"></div>
</template>
<script lang="ts">
import { MoRules } from '@/lib/async-validator'
import { ElMessage, ElMessageBox } from 'element-plus'
import { defineComponent, toRef, PropType, ref, computed } from 'vue'
import AMapLoader from '@amap/amap-jsapi-loader'

export default defineComponent({
  setup() {
    let map: any = null

    AMapLoader.load({
      key: '3d31cda3f5387b71269af66a9279b18b', // 申请好的Web端开发者Key，首次调用 load 时必填
      version: '2.0', // 指定要加载的 JSAPI 的版本，缺省时默认为 1.4.15
      plugins: ['AMap.DistrictSearch', 'AMap.Geocoder', 'AMap.PlaceSearch'] //插件列表
    })
      .then(async (AMap) => {
        map = new AMap.Map('mymap', {
          resizeEnable: true,
          zoom: 12
        })
      })
      .catch((e) => {})

    return {}
  }
})
</script>
