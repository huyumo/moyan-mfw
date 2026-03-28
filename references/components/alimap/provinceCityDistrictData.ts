import AMapLoader from '@amap/amap-jsapi-loader'
import { config } from '@/config'
import { DB } from '@/lib/uilt.db'

const db = new DB(0)
let provinceCityDistrict: ProvinceCityDistrict
export type SimplyDataItem = {
  value: string
  label: string
  level: string
  children: Array<SimplyDataItem>
}

export class ProvinceCityDistrict {
  private _originalData!: Array<any>
  private _simplyData!: Array<SimplyDataItem>
  private _level = 3
  private keyword = '中国'
  private key = 'province_city_district'

  get original(): Promise<Array<any>> {
    return new Promise(async (r) => {
      if (!this._originalData) await this._getData()
      r(this._originalData)
    })
  }

  get simply(): Promise<Array<SimplyDataItem>> {
    return new Promise(async (r) => {
      this._simplyData = db.get(`${this.key}_${this.keyword}_${this._level}`)
      if (!this._simplyData) {
        await this.original
        this._simplyData = this._originalDataTosimplyData()
      } else {
        this.original.then(() => {
          this._simplyData = this._originalDataTosimplyData()
          db.set(`${this.key}_${this.keyword}_${this._level}`, this._simplyData)
        })
      }
      try {
        r(this._simplyData)
      } catch (e) {
        console.log(e)
      }
    })
  }

  /**
   * 获取已经过滤掉的省市区数据
   */
  get simplyFiltered() {
    return this._filterSimplyData()
  }

  private _filterSimplyData() {
    let mapData = db.get(`${this.key}_${this.keyword}_${this._level}`)
    if (!mapData) {
      mapData = this.simply.then((data) => {
        db.set(`${this.key}_${this.keyword}_${this._level}`, data)
        return data
      })
      return []
    }
    const checkedKeys = db.get(`${this.key}_checkedKeys`, [])
    const handler = (arr: Array<any>) => {
      const newArr: Array<SimplyDataItem> = []
      arr.forEach((item) => {
        const newItem: any = { value: item.value, label: item.label, level: item.level, center: item.center }
        if (item.children) newItem.children = handler(item.children)
        if (checkedKeys.includes(item.value) || (newItem.children && newItem.children.length > 0)) newArr.push(newItem)
      })
      return newArr
    }
    return handler(mapData)
  }

  _originalDataTosimplyData() {
    const handler = (arr: Array<any>) => {
      const newArr: Array<SimplyDataItem> = []
      arr.forEach((item) => {
        const newItem: any = {
          value: item.adcode,
          label: item.name,
          level: item.level,
          center: `${item.center.lng},${item.center.lat}`
        }
        if (item.districtList) newItem.children = handler(item.districtList)
        newArr.push(newItem)
      })
      return newArr
    }
    return handler(this._originalData)
  }

  constructor(level = 3, key = 'province_city_district', keyword: string = '中国') {
    this.keyword = keyword
    this.key = key
    if (!provinceCityDistrict) {
      provinceCityDistrict = this
    }
    provinceCityDistrict._level = level
    return provinceCityDistrict
  }

  private _getData() {
    return new Promise((resolve, reject) => {
      AMapLoader.load({
        key: config.alimap.key, // 申请好的Web端开发者Key，首次调用 load 时必填
        version: '2.0', // 指定要加载的 JSAPI 的版本，缺省时默认为 1.4.15
        plugins: ['AMap.DistrictSearch', 'AMap.Geocoder', 'AMap.PlaceSearch', 'AMap.CitySearch'] //插件列表
      })
        .then(async (AMap) => {
          const district = new AMap.DistrictSearch({
            subdistrict: this._level, //返回下一级行政区
            showbiz: false //最后一级返回街道信息
          })

          district.search(this.keyword, (status: any, result: any) => {
            if (status == 'complete') {
              console.log(result)

              this._originalData = result.districtList[0].districtList
              resolve(this._originalData)
            } else {
              reject('获取数据失败')
            }
          })
        })
        .catch((e) => { })
    })
  }
}
