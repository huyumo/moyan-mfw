/**
 * @fileoverview 短信配置 API 调用类
 * @description 声明式 ApiCall 类（对齐 extension-ledger 模式），后端运行后可通过 pnpm build:api 从 Swagger 自动重新生成
 */
import { ApiCall } from 'moyan-api'
import type { MoMethod } from 'moyan-api'
import type { SmsProviderSettingItem, SmsTemplateItem } from 'moyan-mfw-extension-sms/shared'

/** 保存运营商凭证参数 */
export interface SaveProviderSettingParams {
  provider: string
  accessKeyId: string
  /** 留空表示保持不变；首次配置必填 */
  accessKeySecret?: string
  defaultSignName?: string
}

/** 保存短信模板参数 */
export interface SaveSmsTemplateParams {
  id?: string
  scene: string
  signName: string
  templateCode: string
  paramKeys: string[]
  description?: string
}

/** 获取运营商配置（secret 已脱敏；DB 与环境变量均未配置时为 null） */
export class ApiSmsGetProviderSetting extends ApiCall<{}, SmsProviderSettingItem | null> {
  readonly path = '/api/ext/sms/config/provider-setting'
  readonly method: MoMethod = 'GET'
  readonly auth = true
}

/** 保存运营商配置 */
export class ApiSmsSaveProviderSetting extends ApiCall<
  { body: SaveProviderSettingParams },
  unknown
> {
  readonly path = '/api/ext/sms/config/provider-setting'
  readonly method: MoMethod = 'PUT'
  readonly auth = true
}

/** 短信模板列表 */
export class ApiSmsListTemplates extends ApiCall<{}, SmsTemplateItem[]> {
  readonly path = '/api/ext/sms/config/templates'
  readonly method: MoMethod = 'GET'
  readonly auth = true
}

/** 保存短信模板（upsert） */
export class ApiSmsSaveTemplate extends ApiCall<{ body: SaveSmsTemplateParams }, SmsTemplateItem> {
  readonly path = '/api/ext/sms/config/templates'
  readonly method: MoMethod = 'PUT'
  readonly auth = true
}

/** 删除短信模板 */
export class ApiSmsDeleteTemplate extends ApiCall<{ params: { id: string } }, unknown> {
  readonly path = '/api/ext/sms/config/templates/{id}'
  readonly method: MoMethod = 'DELETE'
  readonly auth = true
}
