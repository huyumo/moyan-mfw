/**
 * @fileoverview 短信扩展包共享层入口
 * @description 前后端通信的常量、类型与权限定义
 */

export {
  SMS_PROVIDERS,
  SMS_PROVIDER_LABELS,
  SMS_DEFAULT_CODE_SCENE,
  SMS_PATHS,
} from './constants';
export type { SmsProviderOption } from './constants';
export type { SmsProviderSettingItem, SmsTemplateItem } from './types';
export { SMS_EXTENSION_PERMISSION_VALUES } from './permission-values';
export type { SmsExtensionPermissionName } from './permission-values';
