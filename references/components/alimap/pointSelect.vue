<template>
  <div class="map-data-show-panel">
    <div>{{ markerData?.name }}</div>
    <div class="address-label">{{ markerData?.address }}</div>
  </div>
  <div class="map-box">
    <el-form :model="form" ref="mapFormRef" v-if="!disabled">
      <div class="map-search-row">
        <el-form-item style="width: 49%;" lable-width="0">
          <el-autocomplete v-model="keyword" value-key="name" :disabled="disabled" :fetch-suggestions="querySearchAsync"
            placeholder="地点名称" @select="handleSelect" :prefix-icon="Search">
            <template #default="scope">
              <div class="map-search-autocomplete-item">
                <div class="autocomplete-item_title">{{ scope.item.name }}</div>
                <div class="autocomplete-item_label">{{ scope.item.address }}</div>
              </div>
            </template>
          </el-autocomplete>
        </el-form-item>

        <el-form-item style="width: 49%;" prop="pointStr" lable-width="0" :rules="rules.pointStr">
          <el-input placeholder="经纬度" :disabled="!showPointSet || disabled" v-model="form.pointStr">
            <template #append v-if="showPointSet">
              <el-button @click="setPoint" type="primary">设置</el-button>
            </template>
          </el-input>
        </el-form-item>
      </div>
    </el-form>
    <div :id="mapId" :style="`height:${height};width:${width}`"></div>
  </div>
</template>
<script lang="ts">
import { defineComponent, toRef, PropType, ref, computed } from 'vue'
import AMapLoader from '@amap/amap-jsapi-loader'
import { config } from '@/config'
import { MoUitls } from '@/lib/uilt.mo'
import index from '../formCard/index.vue'
import type { FormInstance } from 'element-plus'
import { Search } from "@element-plus/icons-vue";
import { ElForm } from "element-plus";
import { MarkerData } from '.'


// AMapLoader.load({
//   key: config.alimap.key, // 申请好的Web端开发者Key，首次调用 load 时必填
//   version: '2.0', // 指定要加载的 JSAPI 的版本，缺省时默认为 1.4.15
//   plugins: ['AMap.DistrictSearch', 'AMap.Geocoder', 'AMap.PlaceSearch', 'AMap.CitySearch'] //插件列表
// })

export default defineComponent({
  components: { index, ElForm },
  emits: ['update:modelValue', 'change'],
  props: {
    disabled: Boolean,
    height: String,
    width: String,
    modelValue: Object as PropType<MarkerData>,
    showPointSet: { type: Boolean, default: true }
  },

  setup(props, ctx) {
    let map: any = null
    const height = toRef(props, 'height', '300px')
    const width = toRef(props, 'width', '100%')
    const modelValue = toRef(props, 'modelValue')
    const form = ref({
      pointStr: ''
    })

    const mapFormRef = ref<FormInstance>()

    const mapId = ref(MoUitls.$mo.randomString())

    const markerData = ref<MarkerData | undefined>(modelValue.value)

    let localCity = { city: '', bounds: '' }

    const keyword = ref('') // 关键字

    const marker = ref<any>()
    const showPointSet = toRef(props, 'showPointSet')

    const querySearchAsync = (queryString: string, cb: (arg: any) => void) => {
      const autoOptions = {
        city: markerData.value && markerData.value.city ? markerData.value.city : localCity.city
      }
      const placeSearch = new AMap.PlaceSearch(autoOptions)
      placeSearch.search(queryString, function (status, result) {
        // 搜索成功时，result即是对应的匹配数据
        if (status === 'complete' && result.info === 'OK') {
          cb(result.poiList.pois)
        }
      })
    }

    const handleSelect = (item: any) => {
      map.panTo(item.location)
      marker.value && marker.value.setPosition(item.location)
      setMarkerData(item.location)
    }

    const rules = {
      //验证手动输入的经纬度是否合法
      pointStr: [
        {
          validator: (rule: any, value: string, cb: any) => {
            const latR = /^(\-|\+)?([0-8]?\d{1}\.\d{0,9}|90\.0{0,9}|[0-8]?\d{1}|90)$/
            const lngR = /^(\-|\+)?(((\d|[1-9]\d|1[0-7]\d|0{1,3})\.\d{0,9})|(\d|[1-9]\d|1[0-7]\d|0{1,3})|180\.0{0,9}|180)$/
            const pointArr = form.value.pointStr.split(',').map((item) => item.trim())

            if (value && showPointSet.value) {
              if (!latR.test(pointArr[1])) {
                return cb('输入的经纬度不合法')
              }

              if (!lngR.test(pointArr[0])) {
                return cb('输入的经纬度不合法')
              }
            }
            return cb()
          }
        }
      ]
    }

    const setPoint = () => {
      mapFormRef.value?.validate().then(() => {
        form.value.pointStr = form.value.pointStr.trim()
        const pointArr = form.value.pointStr.split(',').map((item) => Number(item))
        if (pointArr[0] && pointArr[1]) {
          const location = new AMap.LngLat(pointArr[0], pointArr[1])
          marker.value && marker.value.setPosition(location)
          setMarkerData(location)
          map.panTo(location)
        }
      })
    }

    const setMarkerData = (lnglat: any) => {
      const geocoder = new AMap.Geocoder()
      // var lnglat = [point.lng, point.lat]
      geocoder.getAddress(lnglat, (status: any, result: any) => {
        if (status === 'complete' && result.info === 'OK') {
          const {
            adcode,
            citycode,
            city,
            district,
            province,
            street,
            street_number,
            township
          } = result.regeocode.addressComponent

          markerData.value = Object.assign({}, markerData.value, {
            lat: lnglat.lat,
            lng: lnglat.lng,
            address: result.regeocode.formattedAddress,
            adcode,
            citycode,
            city,
            district,
            province,
            street,
            street_number,
            township
          })
          form.value.pointStr = `${lnglat.lng},${lnglat.lat}`
          ctx.emit('update:modelValue', markerData.value)
          ctx.emit('change', markerData.value)
        }
      })
    }

    const showCityInfo = () => {
      return new Promise((r) => {
        if (markerData.value?.city) {
          localCity.city = markerData.value?.city
          return r(true)
        }

        //实例化城市查询类
        const citysearch = new AMap.CitySearch()
        //自动获取用户IP，返回当前城市
        citysearch.getLocalCity(function (status, result) {
          if (status === 'complete' && result.info === 'OK') {
            if (result && result.city && result.bounds) {
              localCity = result
              //地图显示当前城市
              map.setBounds(result.bounds)
            }
          }
        })
        r(true)
      })
    }

    AMapLoader.load({
      key: config.alimap.key, // 申请好的Web端开发者Key，首次调用 load 时必填
      version: '2.0', // 指定要加载的 JSAPI 的版本，缺省时默认为 1.4.15
      plugins: ['AMap.DistrictSearch', 'AMap.Geocoder', 'AMap.PlaceSearch', 'AMap.CitySearch'] //插件列表
    })
      .then(async (AMap) => {
        map = new AMap.Map(mapId.value, {
          resizeEnable: true,
          zoom: 12
        })
        await showCityInfo()

        let location = map.getCenter()

        if (markerData.value && markerData.value.lng && markerData.value.lat) {
          location = new AMap.LngLat(markerData.value.lng, markerData.value.lat)
        }

        marker.value = new AMap.Marker({
          position: location,
          icon: '//a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-default.png',
          offset: new AMap.Pixel(-13, -30),
          // 设置是否可以拖拽
          draggable: !props.disabled,
          cursor: 'move'
        })

        marker.value.setMap(map)

        setMarkerData(location)
        marker.value.on('dragend', (e: any) => {
          setMarkerData(e.lnglat)
        })

        map.panTo(location)
      })
      .catch((e) => { })

    return {
      height,
      width,
      keyword,
      querySearchAsync,
      handleSelect,
      markerData,
      mapId,
      form,
      setPoint,
      rules,
      mapFormRef,
      showPointSet,
      Search
    }
  }
})
</script>

<style lang="scss" scoped>
.map-data-show-panel {
  width: 100%;
  line-height: 32px;
  color: #666;
  font-size: 14px;

  .address-label {
    font-size: 12px;
    color: #999;
  }
}

.map-box {
  padding-top: 10px;
  width: 100%;
  position: relative;

  .map-search-row {
    width: 100%;
    padding: 4px 10px;
    position: absolute;
    left: 0;
    top: 10px;
    z-index: +1;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .el-form-item {
      margin-bottom: 0;
      height: 43px;
    }
  }
}
</style>

<style lang="scss">
.amap-marker:first-child .amap-icon img {
  width: 40px;
  height: 50px;
}

.map-search-autocomplete-item {
  padding: 5px 0px;
  border-bottom: 1px solid #eee;

  .autocomplete-item_title {
    width: 100%;
    line-height: normal;
    font-weight: bold;
    padding: 2px 0;
  }

  .autocomplete-item_label {
    width: 100%;
    line-height: normal;
    color: #999;
    padding-bottom: 2px;
  }
}
</style>
