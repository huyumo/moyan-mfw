/**
 * @fileoverview 短信运营商注册表
 *
 * 接入新运营商只需：
 *   1. 新建 providers/xxx-sms-sdk.ts，implements SmsProvider
 *   2. 在此注册表中添加一行：xxx: XxxSmsSdk
 *   3. 配置页面选择该运营商（ext_sms_provider_settings.provider）或 .env 设 SMS_PROVIDER=xxx
 */

import { AliyunSmsSdk } from './aliyun-sms-sdk';
import type { SmsProvider, SmsProviderCredentials } from '../types';

/**
 * 短信运营商注册表
 *
 * key 为运营商标识（配置页面的 provider 值 / 环境变量 SMS_PROVIDER），value 为运营商 SDK 类。
 * 构造函数可传入凭证（来自配置页面），不传则由 SDK 自行从环境变量读取。
 */
export const SMS_PROVIDER_REGISTRY: Record<
  string,
  new (config?: SmsProviderCredentials) => SmsProvider
> = {
  aliyun: AliyunSmsSdk,
  // 未来扩展：
  // tencent: TencentSmsSdk,
  // huawei: HuaweiSmsSdk,
};

/** 已注册的运营商名称 */
export type SmsProviderName = keyof typeof SMS_PROVIDER_REGISTRY;
