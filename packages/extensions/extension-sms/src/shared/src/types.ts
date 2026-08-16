/**
 * @fileoverview 短信扩展包前后端共享类型（配置管理页面用）
 */

/**
 * 运营商配置（API 返回视图，secret 已脱敏）
 */
export interface SmsProviderSettingItem {
  /** 配置来源：db=页面配置生效 / env=降级读环境变量 */
  source: 'db' | 'env';
  /** 运营商 */
  provider: string;
  /** AccessKey ID */
  accessKeyId: string;
  /** 脱敏后的 Secret（仅尾 4 位） */
  accessKeySecretMasked: string;
  /** 默认签名 */
  defaultSignName: string | null;
}

/**
 * 短信模板（配置页面表格行）
 */
export interface SmsTemplateItem {
  id: string;
  /** 业务场景名 */
  scene: string;
  /** 短信签名 */
  signName: string;
  /** 模板 Code */
  templateCode: string;
  /** 模板参数 key 列表 */
  paramKeys: string[];
  /** 模板描述 */
  description: string | null;
}
