/**
 * @fileoverview 短信扩展包后端入口
 * @description 导出 SmsModule、SDK 层、配置管理层、服务层与 DTO
 */

export { SmsModule, SmsModule as default } from './sms.module';

// SDK 层（纯 TS，可脱离 NestJS 复用）
export type {
  SmsSendParams,
  SmsProvider,
  SmsProviderCredentials,
  SmsTemplateDef,
  SmsScene,
} from './sdk';
export { SmsSdkError, AliyunSmsSdk, SMS_PROVIDER_REGISTRY } from './sdk';
export type { AliyunSmsConfig, SmsProviderName } from './sdk';

// 配置管理层（配置页面用）
export { SmsProviderSetting, SmsTemplate } from './config/entities';
export { SmsConfigService } from './config/sms-config.service';
export { SmsConfigController } from './config/controller/sms-config.controller';
export { SaveSmsProviderSettingDto, SaveSmsTemplateDto } from './config/dto';

// 服务层（业务方注入调用）
export { SmsSdkService } from './services/sms-sdk.service';
export { SmsTemplateService } from './services/sms-template.service';
export { SmsCodeService, type SendCodeResult, DEFAULT_CODE_SCENE } from './services/sms-code.service';

// 业务方复用 DTO
export { SendSmsCodeDto } from './dto';

// 权限与常量（shared 透出）
export { SMS_EXTENSION_PERMISSION_VALUES, SMS_DEFAULT_CODE_SCENE } from 'moyan-mfw-extension-sms/shared';
