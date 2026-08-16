/**
 * @fileoverview 短信模块通用类型定义（纯 TS，无 NestJS 依赖）
 *
 * 设计要点：
 *   - SmsProvider 接口只管"发短信"，不绑定任何具体业务（验证码/通知/订单都可以用）
 *   - 各短信运营商实现此接口，通过 Registry 注册，配置（DB/环境变量）决定激活哪个
 *   - 模板管理由上层 SmsTemplateService 负责，SDK 层不关心模板
 */

/**
 * 通用短信发送参数（不绑定具体业务）
 */
export interface SmsSendParams {
  /** 接收手机号（纯手机号，不含区号） */
  phone: string;
  /** 短信签名名称（如 "某某酒业"） */
  signName: string;
  /** 短信模板 Code（如 "SMS_509465234"） */
  templateCode: string;
  /** 模板参数（键值对，如 { code: "123456" }） */
  templateParams: Record<string, string>;
}

/**
 * 运营商凭证配置
 *
 * 来源：配置页面（ext_sms_provider_settings 表）或环境变量，
 * 由 SmsSdkService 解析后下发给运营商 SDK 实例。
 */
export interface SmsProviderCredentials {
  accessKeyId: string;
  accessKeySecret: string;
  /** 默认签名（可被模板级签名覆盖） */
  defaultSignName?: string;
}

/**
 * 短信运营商 SDK 接口
 *
 * 各运营商实现此接口，通过 SMS_PROVIDER_REGISTRY 注册。
 * SDK 只负责调用运营商 API 发送短信，不关心业务逻辑。
 */
export interface SmsProvider {
  /**
   * 发送短信
   *
   * @param params 通用发送参数（手机号 / 签名 / 模板Code / 模板参数）
   * @throws SmsSdkError 发送失败
   */
  send(params: SmsSendParams): Promise<void>;
}

/**
 * 短信模板定义
 *
 * 模板来源：配置页面（ext_sms_templates 表）或程序化 register() 注册，
 * 将业务场景映射到具体的签名 + 模板Code + 参数key。
 */
export interface SmsTemplateDef {
  /** 短信签名名称 */
  signName: string;
  /** 短信模板 Code */
  templateCode: string;
  /** 模板参数 key 列表（用于校验调用方是否提供了全部参数） */
  paramKeys: string[];
}

/**
 * 短信场景名（字符串，各项目自定义，如 "login_code"、"order_notify"）
 */
export type SmsScene = string;

/**
 * 短信 SDK 错误
 *
 * @property isTransient - 是否为瞬时错误（网络超时/服务繁忙），调用方可重试
 */
export class SmsSdkError extends Error {
  readonly isTransient: boolean;

  constructor(message: string, options?: { isTransient?: boolean }) {
    super(message);
    this.name = 'SmsSdkError';
    this.isTransient = options?.isTransient ?? false;
  }
}
