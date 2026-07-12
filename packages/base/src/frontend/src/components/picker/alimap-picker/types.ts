/**
 * @fileoverview MfwAlimapPicker 高德地图选点组件类型定义
 * @description 包含选点数据模型、组件 Props/Emits/Instance 类型，以及省市区数据工具相关类型
 */

// ========== 数据模型类型 ==========

/** 高德地图选点数据 */
export interface AlimapMarkerData {
  /** 纬度 */
  lat: number;
  /** 经度 */
  lng: number;
  /** 地点名称（由行政区划片段拼接） */
  name: string;
  /** 完整格式化地址 */
  address: string;
  /** 行政区划代码 */
  adcode: string;
  /** 城市代码 */
  citycode: string;
  /** 城市 */
  city: string;
  /** 区/县 */
  district: string;
  /** 省份 */
  province: string;
  /** 街道 */
  street: string;
  /** 门牌号 */
  streetNumber: string;
  /** 乡镇 */
  township: string;
}

// ========== 全局配置类型 ==========

/** AMap JS API 全局配置 */
export interface AmapConfig {
  /** 高德 Web 端开发者 Key */
  key: string;
  /** 安全密钥 */
  securityJsCode: string;
  /** JS API 版本，默认 '2.0' */
  version?: string;
  /** 需要加载的插件列表 */
  plugins?: string[];
}

// ========== 组件接口 ==========

/** MfwAlimapPicker Props */
export interface MfwAlimapPickerProps {
  /** 绑定值（选中的地点数据） */
  modelValue?: AlimapMarkerData;
  /** 是否禁用 */
  disabled?: boolean;
  /** 地图高度（CSS 值） */
  height?: string;
  /** 地图宽度（CSS 值） */
  width?: string;
  /** 是否显示手动经纬度输入框 */
  showPointSet?: boolean;
  /** 地图缩放级别 */
  zoom?: number;
  /** 经纬度输入框占位文本 */
  placeholder?: string;
  /** 地点搜索占位文本 */
  searchPlaceholder?: string;
}

/** MfwAlimapPicker Emits */
export interface MfwAlimapPickerEmits {
  /** 值变化事件 */
  (e: 'update:modelValue', value: AlimapMarkerData | undefined): void;
  /** 选点变化事件 */
  (e: 'change', value: AlimapMarkerData | undefined): void;
}

/** MfwAlimapPicker 暴露实例接口 */
export interface MfwAlimapPickerInstance {
  /** 获取当前选点数据 */
  getMarkerData: () => AlimapMarkerData | undefined;
  /** 设置选点数据 */
  setMarkerData: (data: AlimapMarkerData) => void;
  /** 清空选点 */
  clear: () => void;
  /** 聚焦地图 */
  focus: () => void;
}

// ========== 省市区数据工具类型 ==========

/** 省市区简化数据项 */
export interface SimplyDataItem {
  /** 行政区划代码 */
  value: string;
  /** 名称 */
  label: string;
  /** 行政级别 */
  level: string;
  /** 中心点坐标 "lng,lat" */
  center?: string;
  /** 下级区域 */
  children?: SimplyDataItem[];
}

/** ProvinceCityDistrict 配置选项 */
export interface ProvinceCityDistrictOptions {
  /** 行政区层级，默认 3 */
  level?: number;
  /** 搜索关键词，默认 '中国' */
  keyword?: string;
}
