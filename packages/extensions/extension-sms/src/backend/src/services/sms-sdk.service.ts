/**
 * @fileoverview 短信通用发送服务（NestJS 封装）
 *
 * 职责：
 *   1. 每次发送时解析运营商凭证：DB 配置（页面管理）优先，降级读环境变量
 *   2. 用解析出的凭证构造运营商 SDK 实例并代理调用 send
 *
 * 不绑定任何具体业务（验证码/通知/订单都可以用）。
 * 验证码场景请使用 SmsCodeService，通知场景直接用本服务。
 *
 * 配置页面修改凭证后即时生效（每次发送重新解析，读取走缓存）。
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  SMS_PROVIDER_REGISTRY,
  SmsSdkError,
  type SmsProvider,
  type SmsSendParams,
  type SmsProviderCredentials,
} from '../sdk';
import { SmsConfigService } from '../config/sms-config.service';

@Injectable()
export class SmsSdkService {
  private readonly logger = new Logger(SmsSdkService.name);

  constructor(private readonly smsConfigService: SmsConfigService) {}

  /**
   * 发送短信（通用方法，不绑定具体业务）
   *
   * @param params 手机号 / 签名 / 模板Code / 模板参数
   * @throws SmsSdkError 发送失败 / 凭证未配置
   */
  async send(params: SmsSendParams): Promise<void> {
    const provider = await this.resolveProvider();
    try {
      await provider.send(params);
    } catch (err) {
      if (err instanceof SmsSdkError) {
        throw err;
      }
      throw new SmsSdkError(`短信发送失败: ${err instanceof Error ? err.message : String(err)}`, {
        isTransient: true,
      });
    }
  }

  /**
   * 解析运营商 SDK 实例
   *
   * 优先级：
   *   1. DB 配置（ext_sms_provider_settings，配置页面管理）
   *   2. 环境变量（SMS_PROVIDER 选择运营商，SDK 自行读取 SMS_ALIYUN_* 或 OSS_* 凭证）
   */
  private async resolveProvider(): Promise<SmsProvider> {
    // 1. DB 配置优先
    const setting = await this.smsConfigService.getProviderSetting();
    if (setting) {
      const ProviderClass = SMS_PROVIDER_REGISTRY[setting.provider];
      if (!ProviderClass) {
        this.logger.error(
          `未知的短信运营商: ${setting.provider}，已注册: ${Object.keys(SMS_PROVIDER_REGISTRY).join(', ')}`,
        );
      } else {
        const credentials: SmsProviderCredentials = {
          accessKeyId: setting.accessKeyId,
          accessKeySecret: setting.accessKeySecret,
          defaultSignName: setting.defaultSignName ?? undefined,
        };
        return new ProviderClass(credentials);
      }
    }

    // 2. 环境变量降级
    const providerName = process.env.SMS_PROVIDER || 'aliyun';
    const ProviderClass = SMS_PROVIDER_REGISTRY[providerName];
    if (!ProviderClass) {
      throw new SmsSdkError(
        `短信服务未初始化：请在短信配置页面设置运营商凭证，或检查 SMS_PROVIDER 配置（当前: ${providerName}，已注册: ${Object.keys(SMS_PROVIDER_REGISTRY).join(', ')}）`,
      );
    }
    return new ProviderClass();
  }
}
