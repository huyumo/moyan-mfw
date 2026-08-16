/**
 * @fileoverview 短信模板注册表服务
 * @description 业务场景 → 签名 + 模板Code + 参数key 的解析
 *
 * 模板来源（优先级从高到低）：
 *   1. 程序化 register() 注册（保留原 lib 能力，适用于代码内固定模板）
 *   2. DB 模板表（ext_sms_templates，配置页面管理）
 *
 * 注意：has()/resolve() 为异步方法（DB 模板需查库，读取走缓存）。
 */

import { Injectable, Logger } from '@nestjs/common';
import type { SmsSendParams, SmsTemplateDef } from '../sdk';
import { SmsConfigService } from '../config/sms-config.service';

@Injectable()
export class SmsTemplateService {
  private readonly logger = new Logger(SmsTemplateService.name);
  /** 程序化注册的模板（优先于 DB） */
  private readonly templates = new Map<string, SmsTemplateDef>();

  constructor(private readonly smsConfigService: SmsConfigService) {}

  /**
   * 程序化注册短信模板（优先级高于配置页面）
   *
   * 使用方式：
   *   // 在项目 onModuleInit 中注册固定模板
   *   smsTemplate.register('login_code', {
   *     signName: '某某酒业',
   *     templateCode: 'SMS_509465234',
   *     paramKeys: ['code'],
   *   });
   *
   * @param scene 场景名（如 "login_code"、"order_notify"）
   * @param def 模板定义（签名 + 模板Code + 参数key列表）
   */
  register(scene: string, def: SmsTemplateDef): void {
    if (this.templates.has(scene)) {
      this.logger.warn(`短信模板 "${scene}" 已存在，将被覆盖`);
    }
    this.templates.set(scene, def);
    this.logger.log(`短信模板已注册（程序化）: ${scene} -> ${def.templateCode}`);
  }

  /**
   * 检查场景是否已注册（程序化注册或 DB 模板表）
   */
  async has(scene: string): Promise<boolean> {
    if (this.templates.has(scene)) {
      return true;
    }
    const dbTemplate = await this.smsConfigService.findTemplateByScene(scene);
    return !!dbTemplate;
  }

  /**
   * 组装发送参数
   *
   * @param scene 场景名
   * @param params 模板参数值（需包含模板定义的全部 paramKeys）
   * @returns Omit<SmsSendParams, "phone">（phone 由调用方补充）
   * @throws Error 场景未注册或参数缺失
   */
  async resolve(
    scene: string,
    params: Record<string, string>,
  ): Promise<Omit<SmsSendParams, 'phone'>> {
    const def = await this.getTemplateDef(scene);
    if (!def) {
      throw new Error(`短信模板 "${scene}" 未注册`);
    }

    // 校验参数完整性
    for (const key of def.paramKeys) {
      if (!(key in params)) {
        throw new Error(
          `短信模板 "${scene}" 缺少参数: ${key}（需要: ${def.paramKeys.join(', ')}）`,
        );
      }
    }

    // 只提取 paramKeys 对应的参数，避免多余字段
    const templateParams: Record<string, string> = {};
    for (const key of def.paramKeys) {
      templateParams[key] = String(params[key]);
    }

    return {
      signName: def.signName,
      templateCode: def.templateCode,
      templateParams,
    };
  }

  /**
   * 获取模板定义：程序化注册优先，miss 则查 DB 模板表
   */
  private async getTemplateDef(scene: string): Promise<SmsTemplateDef | null> {
    const inMemory = this.templates.get(scene);
    if (inMemory) {
      return inMemory;
    }
    const dbTemplate = await this.smsConfigService.findTemplateByScene(scene);
    if (!dbTemplate) {
      return null;
    }
    return {
      signName: dbTemplate.signName,
      templateCode: dbTemplate.templateCode,
      paramKeys: dbTemplate.paramKeys ?? [],
    };
  }
}
