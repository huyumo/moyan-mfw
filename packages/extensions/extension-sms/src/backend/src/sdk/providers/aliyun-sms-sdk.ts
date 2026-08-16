/**
 * @fileoverview 阿里云短信 SDK（纯 SDK 层，无 NestJS 依赖）
 *
 * 实现 SmsProvider 接口，通过阿里云 Dysmsapi 发送短信。
 *
 * 配置来源（优先级从高到低）：
 *   1. 构造函数传入的凭证（来自配置页面 ext_sms_provider_settings 表，推荐）
 *   2. 环境变量专用短信凭证：SMS_ALIYUN_ACCESS_KEY_ID / SMS_ALIYUN_ACCESS_KEY_SECRET
 *   3. 环境变量 OSS 凭证（向后兼容）：OSS_ACCESS_KEY_ID / OSS_ACCESS_KEY_SECRET
 *   4. 默认签名：SMS_ALIYUN_SIGN_NAME（可被模板级签名覆盖）
 *
 * 设计要点：
 *   - 不依赖任何 NestJS / TypeORM，可直接在其他 Node.js 项目中复用
 *   - 使用原生 fetch 调用阿里云 API，零额外包依赖
 *   - 网络异常 / 超时统一抛 SmsSdkError（isTransient=true），由上层决定处理方式
 */

import { createHmac, randomUUID } from 'crypto';
import type { SmsProvider, SmsSendParams, SmsProviderCredentials } from '../types';
import { SmsSdkError } from '../types';

/** 阿里云 API 请求超时时间（毫秒） */
const ALIYUN_REQUEST_TIMEOUT_MS = 10_000;

/** 阿里云短信 API 网关 */
const ALIYUN_SMS_ENDPOINT = 'https://dysmsapi.aliyuncs.com';

/** 阿里云 API 版本 */
const ALIYUN_SMS_API_VERSION = '2017-05-25';

/**
 * 阿里云短信配置
 */
export type AliyunSmsConfig = SmsProviderCredentials;

/**
 * 阿里云短信 SDK
 *
 * 使用方式：
 *   const sdk = new AliyunSmsSdk();
 *   await sdk.send({
 *     phone: '13800138000',
 *     signName: '某某酒业',
 *     templateCode: 'SMS_509465234',
 *     templateParams: { code: '123456' },
 *   });
 */
export class AliyunSmsSdk implements SmsProvider {
  constructor(private readonly config?: AliyunSmsConfig) {}

  /**
   * 读取阿里云配置（优先用构造函数传入的，否则从环境变量读取）
   * 子类可覆盖以实现自定义配置加载
   */
  protected getConfig(): AliyunSmsConfig {
    if (this.config) {
      return this.config;
    }

    // 优先使用专用短信凭证（推荐）
    const smsAccessKeyId = process.env.SMS_ALIYUN_ACCESS_KEY_ID;
    const smsAccessKeySecret = process.env.SMS_ALIYUN_ACCESS_KEY_SECRET;

    // 降级使用 OSS 凭证（向后兼容）
    const ossAccessKeyId = process.env.OSS_ACCESS_KEY_ID;
    const ossAccessKeySecret = process.env.OSS_ACCESS_KEY_SECRET;

    const accessKeyId = smsAccessKeyId || ossAccessKeyId;
    const accessKeySecret = smsAccessKeySecret || ossAccessKeySecret;

    if (!accessKeyId || !accessKeySecret) {
      throw new SmsSdkError(
        '阿里云短信未配置凭证，请在短信配置页面设置，或配置环境变量 SMS_ALIYUN_ACCESS_KEY_ID/SECRET 或 OSS_ACCESS_KEY_ID/SECRET',
      );
    }

    return {
      accessKeyId,
      accessKeySecret,
      defaultSignName: process.env.SMS_ALIYUN_SIGN_NAME,
    };
  }

  /**
   * 发送短信
   *
   * @throws SmsSdkError 发送失败（isTransient=true 可重试）
   */
  async send(params: SmsSendParams): Promise<void> {
    const config = this.getConfig();
    const signName = params.signName || config.defaultSignName || '';
    if (!signName) {
      throw new SmsSdkError('短信签名不能为空');
    }

    const queryParams = this.buildQueryParams(
      config,
      params.phone,
      signName,
      params.templateCode,
      params.templateParams,
    );

    const url = `${ALIYUN_SMS_ENDPOINT}/?${queryParams}`;
    const data = await this.fetchJson(url);

    if (data.Code !== 'OK') {
      const isTransient = this.isTransientError(data.Code);
      throw new SmsSdkError(`阿里云短信发送失败: ${data.Message || data.Code}`, {
        isTransient,
      });
    }
  }

  /**
   * 构建阿里云 API 请求参数（含签名）
   *
   * 阿里云 RPC 风格 API 签名算法：
   *   1. 构建公共参数 + 业务参数
   *   2. 按 key 字典序排序，拼接为 key=value&key=value 格式
   *   3. 用 HMAC-SHA1(secret + "&", 拼接串) 计算，Base64 编码
   */
  private buildQueryParams(
    config: AliyunSmsConfig,
    phone: string,
    signName: string,
    templateCode: string,
    templateParams: Record<string, string>,
  ): string {
    const params: Record<string, string> = {
      SignatureMethod: 'HMAC-SHA1',
      SignatureNonce: randomUUID(),
      SignatureVersion: '1.0',
      AccessKeyId: config.accessKeyId,
      Timestamp: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
      Format: 'JSON',
      Version: ALIYUN_SMS_API_VERSION,
      Action: 'SendSms',
      RegionId: 'cn-hangzhou',
      PhoneNumbers: phone,
      SignName: signName,
      TemplateCode: templateCode,
      TemplateParam: JSON.stringify(templateParams),
    };

    // 按字典序排序
    const sortedKeys = Object.keys(params).sort();
    const canonicalQuery = sortedKeys
      .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
      .join('&');

    // 计算签名
    const stringToSign = `GET&${encodeURIComponent('/')}&${encodeURIComponent(canonicalQuery)}`;
    const signature = createHmac('sha1', config.accessKeySecret + '&')
      .update(stringToSign)
      .digest('base64');

    return `${canonicalQuery}&Signature=${encodeURIComponent(signature)}`;
  }

  /**
   * 判断阿里云错误码是否为瞬时错误（可重试）
   */
  private isTransientError(code: string): boolean {
    const transientCodes = new Set([
      'isv.BUSINESS_LIMIT_CONTROL', // 业务限流
    ]);
    return transientCodes.has(code);
  }

  /**
   * 发起 HTTP 请求并解析 JSON，带超时控制
   */
  private async fetchJson(url: string): Promise<any> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ALIYUN_REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
      });
      return await res.json();
    } catch (err) {
      if (err instanceof SmsSdkError) {
        throw err;
      }
      throw new SmsSdkError(
        `阿里云短信接口请求失败: ${err instanceof Error ? err.message : String(err)}`,
        { isTransient: true },
      );
    } finally {
      clearTimeout(timer);
    }
  }
}
