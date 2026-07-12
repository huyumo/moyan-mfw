/**
 * @fileoverview MfwAlimapPicker 高德地图选点组件
 * @description 基于高德地图 JS API 的地图选点组件，支持地点搜索、拖拽选点、手动输入经纬度、逆地理编码
 * @example
 * ```vue
 * <MfwAlimapPicker v-model="location" :height="'400px'" @change="onLocationChange" />
 * ```
 */

import './style.scss';

import {
  defineComponent,
  ref,
  watch,
  onMounted,
  onBeforeUnmount,
  useId,
  type PropType,
} from 'vue';
import {
  ElForm,
  ElFormItem,
  ElAutocomplete,
  ElInput,
  ElButton,
  type FormInstance,
} from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import { loadAmapSdk } from './amap-config';
import type {
  AlimapMarkerData,
  MfwAlimapPickerProps,
  MfwAlimapPickerInstance,
} from './types';

/** 纬度正则 */
const LAT_REGEX = /^(\-|\+)?([0-8]?\d{1}\.\d{0,9}|90\.0{0,9}|[0-8]?\d{1}|90)$/;
/** 经度正则 */
const LNG_REGEX =
  /^(\-|\+)?(((\d|[1-9]\d|1[0-7]\d|0{1,3})\.\d{0,9})|(\d|[1-9]\d|1[0-7]\d|0{1,3})|180\.0{0,9}|180)$/;

/** 搜索建议项类型 */
interface SearchSuggestion {
  name: string;
  address: string;
  location: any;
}

export default defineComponent({
  name: 'MfwAlimapPicker',

  props: {
    /** 绑定值（选中的地点数据） */
    modelValue: {
      type: Object as PropType<MfwAlimapPickerProps['modelValue']>,
      default: undefined,
    },
    /** 是否禁用 */
    disabled: {
      type: Boolean as PropType<MfwAlimapPickerProps['disabled']>,
      default: false,
    },
    /** 地图高度 */
    height: {
      type: String as PropType<MfwAlimapPickerProps['height']>,
      default: '300px',
    },
    /** 地图宽度 */
    width: {
      type: String as PropType<MfwAlimapPickerProps['width']>,
      default: '100%',
    },
    /** 是否显示手动经纬度输入框 */
    showPointSet: {
      type: Boolean as PropType<MfwAlimapPickerProps['showPointSet']>,
      default: true,
    },
    /** 地图缩放级别 */
    zoom: {
      type: Number as PropType<MfwAlimapPickerProps['zoom']>,
      default: 12,
    },
    /** 经纬度输入框占位文本 */
    placeholder: {
      type: String as PropType<MfwAlimapPickerProps['placeholder']>,
      default: '经纬度',
    },
    /** 地点搜索占位文本 */
    searchPlaceholder: {
      type: String as PropType<MfwAlimapPickerProps['searchPlaceholder']>,
      default: '地点名称',
    },
  },

  emits: {
    'update:modelValue': (value: AlimapMarkerData | undefined) => true,
    change: (value: AlimapMarkerData | undefined) => true,
  },

  setup(props, ctx) {
    const { emit, expose } = ctx;
    /** 地图容器 DOM ID（Vue 3.5 useId 保证唯一） */
    const mapId = `mfw-alimap-${useId()}`;

    /** AMap 实例（非响应式） */
    let map: any = null;
    /** Marker 实例（非响应式） */
    let marker: any = null;

    /** 搜索关键字 */
    const keyword = ref('');
    /** 经纬度输入值 */
    const pointStr = ref('');
    /** 当前选点数据 */
    const markerData = ref<AlimapMarkerData | undefined>(props.modelValue);
    /** 表单引用 */
    const mapFormRef = ref<FormInstance>();
    /** 本地城市信息 */
    let localCity = { city: '', bounds: '' };

    /** 表单数据 */
    const form = ref({ pointStr: '' });

    /** 经纬度验证规则 */
    const rules = {
      pointStr: [
        {
          validator: (_rule: any, value: string, cb: any) => {
            const pointArr = value.split(',').map((item) => item.trim());

            if (value && props.showPointSet) {
              if (!LAT_REGEX.test(pointArr[1] || '')) {
                return cb(new Error('输入的经纬度不合法'));
              }
              if (!LNG_REGEX.test(pointArr[0] || '')) {
                return cb(new Error('输入的经纬度不合法'));
              }
            }
            return cb();
          },
        },
      ],
    };

    /**
     * 逆地理编码并更新选点数据
     *
     * @param lnglat - 高德经纬度对象（含 getLng/getLat 或 lng/lat 属性）
     */
    const setMarkerData = (lnglat: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AMap = (window as any).AMap;
      if (!AMap) return;

      const geocoder = new AMap.Geocoder();
      const lng = lnglat.lng ?? lnglat.getLng();
      const lat = lnglat.lat ?? lnglat.getLat();

      geocoder.getAddress([lng, lat], (status: string, result: any) => {
        if (status === 'complete' && result.info === 'OK') {
          const {
            adcode,
            citycode,
            city,
            district,
            province,
            street,
            streetNumber,
            township,
          } = result.regeocode.addressComponent;

          markerData.value = {
            ...markerData.value,
            lat,
            lng,
            address: result.regeocode.formattedAddress,
            name: `${province || ''}${city || ''}${district || ''}${street || ''}${streetNumber || ''}${township || ''}`,
            adcode,
            citycode,
            city,
            district,
            province,
            street,
            streetNumber,
            township,
          };
          form.value.pointStr = `${lng},${lat}`;
          emit('update:modelValue', markerData.value);
          emit('change', markerData.value);
        }
      });
    };

    /**
     * 搜索建议回调
     *
     * @param queryString - 搜索关键字
     * @param cb - 回调函数
     */
    const querySearchAsync = (
      queryString: string,
      cb: (arg: SearchSuggestion[]) => void,
    ) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AMap = (window as any).AMap;
      if (!AMap) {
        cb([]);
        return;
      }

      const autoOptions = {
        city:
          markerData.value && markerData.value.city
            ? markerData.value.city
            : localCity.city,
      };
      const placeSearch = new AMap.PlaceSearch(autoOptions);
      placeSearch.search(queryString, (status: string, result: any) => {
        if (status === 'complete' && result.info === 'OK') {
          cb(result.poiList.pois);
        } else {
          cb([]);
        }
      });
    };

    /**
     * 选中搜索建议项
     *
     * @param item - 选中的建议项
     */
    const handleSelect = (item: SearchSuggestion) => {
      if (!map || !item.location) return;
      map.panTo(item.location);
      marker && marker.setPosition(item.location);
      setMarkerData(item.location);
    };

    /**
     * 设置手动输入的经纬度
     */
    const setPoint = () => {
      mapFormRef.value?.validate().then(() => {
        form.value.pointStr = form.value.pointStr.trim();
        const pointArr = form.value.pointStr
          .split(',')
          .map((item) => Number(item.trim()));
        if (pointArr[0] && pointArr[1]) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const AMap = (window as any).AMap;
          const location = new AMap.LngLat(pointArr[0], pointArr[1]);
          marker && marker.setPosition(location);
          setMarkerData(location);
          map.panTo(location);
        }
      });
    };

    /**
     * 获取当前城市信息（IP 定位）
     */
    const showCityInfo = (): Promise<boolean> => {
      return new Promise((resolve) => {
        if (markerData.value?.city) {
          localCity.city = markerData.value.city;
          return resolve(true);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const AMap = (window as any).AMap;
        const citysearch = new AMap.CitySearch();
        citysearch.getLocalCity((status: string, result: any) => {
          if (status === 'complete' && result.info === 'OK') {
            if (result && result.city && result.bounds) {
              localCity = result;
              map.setBounds(result.bounds);
            }
          }
          resolve(true);
        });
      });
    };

    /**
     * 初始化地图
     */
    const initMap = async () => {
      try {
        const AMap = await loadAmapSdk();

        map = new AMap.Map(mapId, {
          resizeEnable: true,
          zoom: props.zoom,
        });

        await showCityInfo();

        let location = map.getCenter();

        if (markerData.value && markerData.value.lng && markerData.value.lat) {
          location = new AMap.LngLat(
            markerData.value.lng,
            markerData.value.lat,
          );
        }

        marker = new AMap.Marker({
          position: location,
          icon: '//a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-default.png',
          offset: new AMap.Pixel(-13, -30),
          draggable: !props.disabled,
          cursor: 'move',
        });

        marker.setMap(map);
        setMarkerData(location);

        marker.on('dragend', (e: any) => {
          setMarkerData(e.lnglat);
        });

        map.panTo(location);
      } catch (err) {
        console.error('[MfwAlimapPicker] 地图初始化失败:', err);
      }
    };

    /**
     * 销毁地图实例
     */
    const destroyMap = () => {
      if (marker) {
        marker.setMap(null);
        marker = null;
      }
      if (map) {
        map.destroy();
        map = null;
      }
    };

    // 监听外部 modelValue 变化
    watch(
      () => props.modelValue,
      (newVal) => {
        if (
          newVal &&
          newVal.lng !== markerData.value?.lng &&
          newVal.lat !== markerData.value?.lat
        ) {
          markerData.value = newVal;
          form.value.pointStr = `${newVal.lng},${newVal.lat}`;
          if (map && marker) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const AMap = (window as any).AMap;
            const location = new AMap.LngLat(newVal.lng, newVal.lat);
            marker.setPosition(location);
            map.panTo(location);
          }
        }
      },
      { deep: true },
    );

    // 监听 disabled 变化，动态更新 marker 拖拽状态
    watch(
      () => props.disabled,
      (isDisabled) => {
        if (marker) {
          marker.setDraggable(!isDisabled);
        }
      },
    );

    onMounted(() => {
      initMap();
    });

    onBeforeUnmount(() => {
      destroyMap();
    });

    // 暴露实例方法
    expose({
      getMarkerData: () => markerData.value,
      setMarkerData: (data: AlimapMarkerData) => {
        markerData.value = data;
        form.value.pointStr = `${data.lng},${data.lat}`;
        if (map && marker) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const AMap = (window as any).AMap;
          const location = new AMap.LngLat(data.lng, data.lat);
          marker.setPosition(location);
          map.panTo(location);
          emit('update:modelValue', data);
          emit('change', data);
        }
      },
      clear: () => {
        markerData.value = undefined;
        form.value.pointStr = '';
        keyword.value = '';
        emit('update:modelValue', undefined);
        emit('change', undefined);
      },
      focus: () => {
        if (map) {
          map.getContainer()?.focus?.();
        }
      },
    });

    // 渲染函数
    return () => (
      <div class="mfw-alimap">
        {/* 地址展示面板 */}
        <div class="mfw-alimap__panel">
          <div class="mfw-alimap__name">{markerData.value?.name}</div>
          <div class="mfw-alimap__address">
            {markerData.value?.address}
          </div>
        </div>

        {/* 地图区域 */}
        <div class="mfw-alimap__box">
          {!props.disabled && (
            <ElForm model={form.value} ref={mapFormRef} class="mfw-alimap__search">
              <ElFormItem style="width: 49%;" label-width="0">
                <ElAutocomplete
                  modelValue={keyword.value}
                  onUpdate:modelValue={(val: string | number) => {
                    keyword.value = String(val);
                  }}
                  value-key="name"
                  fetch-suggestions={querySearchAsync}
                  placeholder={props.searchPlaceholder}
                  onSelect={(item: Record<string, any>) => handleSelect(item as unknown as SearchSuggestion)}
                  prefix-icon={Search}
                >
                  {{
                    default: (scope: { item: SearchSuggestion }) => (
                      <div class="mfw-alimap-suggestion">
                        <div class="mfw-alimap-suggestion__title">
                          {scope.item.name}
                        </div>
                        <div class="mfw-alimap-suggestion__label">
                          {scope.item.address}
                        </div>
                      </div>
                    ),
                  }}
                </ElAutocomplete>
              </ElFormItem>

              <ElFormItem
                style="width: 49%;"
                label-width="0"
                prop="pointStr"
                rules={rules.pointStr}
              >
                <ElInput
                  modelValue={form.value.pointStr}
                  onUpdate:modelValue={(val: string) => {
                    form.value.pointStr = val;
                  }}
                  placeholder={props.placeholder}
                  disabled={!props.showPointSet}
                >
                  {props.showPointSet && {
                    append: () => (
                      <ElButton type="primary" onClick={setPoint}>
                        设置
                      </ElButton>
                    ),
                  }}
                </ElInput>
              </ElFormItem>
            </ElForm>
          )}

          <div id={mapId} style={{ height: props.height, width: props.width }} />
        </div>
      </div>
    );
  },
});
