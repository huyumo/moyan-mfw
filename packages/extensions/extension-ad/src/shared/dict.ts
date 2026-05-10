/**
 * @fileoverview 广告管理扩展包字典定义
 * @description 使用 moyan-shared-dict 装饰器定义扩展包专属字典，供前后端共用
 */
import { DictMeta, DictEntry } from 'moyan-shared-dict'

@DictMeta({ key: 'ad_link_type', label: '广告跳转类型', module: '广告管理' })
export class AdLinkTypeDict {
  @DictEntry({ label: '小程序跳转',   type: 'primary' })  static MINIAPP  = 'miniapp'
  @DictEntry({ label: 'App内部跳转',  type: 'success' })  static INTERNAL = 'internal'
  @DictEntry({ label: '外部链接跳转',  type: 'warning' })  static EXTERNAL = 'external'
}
