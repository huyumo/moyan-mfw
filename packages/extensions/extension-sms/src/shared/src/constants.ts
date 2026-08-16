/**
 * @fileoverview 短信扩展包共享常量
 */

/** 已支持的短信运营商（页面配置下拉选项；新运营商接入后追加） */
export const SMS_PROVIDERS = ['aliyun'] as const;
export type SmsProviderOption = (typeof SMS_PROVIDERS)[number];

/** 运营商显示名 */
export const SMS_PROVIDER_LABELS: Record<string, string> = {
  aliyun: '阿里云短信',
  // tencent: '腾讯云短信',
  // huawei: '华为云短信',
};

/** 验证码默认场景名 */
export const SMS_DEFAULT_CODE_SCENE = 'login_code';

/** 前端路由路径 */
export const SMS_PATHS = {
  /** 短信配置页 */
  CONFIG: '/ext/sms/config',
} as const;
