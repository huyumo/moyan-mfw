/**
 * @fileoverview 扫码配置 API 调用类
 * @description 声明式 ApiCall 类（对齐 extension-ledger 模式），后端运行后可通过 pnpm build:api 从 Swagger 自动重新生成
 */
import { ApiCall } from 'moyan-api'
import type { MoMethod } from 'moyan-api'
import type { ScanCodeSettingItem } from 'moyan-mfw-extension-scan-code/shared'

/** 保存码生成策略参数 */
export interface SaveScanCodeSettingParams {
  groupCount: number
  groupLength: number
  separator: string
  charset: string
  scenes?: string[]
}

/** 获取码生成策略配置 */
export class ApiScanCodeGetSettings extends ApiCall<{}, ScanCodeSettingItem> {
  readonly path = '/api/ext/scan-code/config/settings'
  readonly method: MoMethod = 'GET'
  readonly auth = true
}

/** 保存码生成策略配置 */
export class ApiScanCodeSaveSettings extends ApiCall<
  { body: SaveScanCodeSettingParams },
  ScanCodeSettingItem
> {
  readonly path = '/api/ext/scan-code/config/settings'
  readonly method: MoMethod = 'PUT'
  readonly auth = true
}
