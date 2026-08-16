/**
 * @fileoverview 短信模块 SDK 层入口（纯 TS，无 NestJS 依赖）
 */
export type {
  SmsProvider,
  SmsSendParams,
  SmsProviderCredentials,
  SmsTemplateDef,
  SmsScene,
} from './types';
export { SmsSdkError } from './types';
export { AliyunSmsSdk, type AliyunSmsConfig } from './providers/aliyun-sms-sdk';
export { SMS_PROVIDER_REGISTRY, type SmsProviderName } from './providers';
