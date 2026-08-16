/**
 * @fileoverview 短信验证码服务
 *
 * 基于 SmsSdkService（通用发送）+ SmsTemplateService（模板解析）+ 框架缓存（ICacheService/IRedisOnlyService），
 * 实现验证码的生成、存储、频率限制、校验。
 *
 * 这是 SMS 扩展包内置的一个高级服务，专门处理验证码场景。
 * 通知类短信请直接使用 SmsSdkService.send()。
 *
 * 依赖：
 *   - ICacheService（框架全局，验证码存储，生产环境建议 CACHE_DRIVER=redis）
 *   - IRedisOnlyService（框架全局，频率限制）
 *   - SmsSdkService（通用发送，凭证来自配置页面或环境变量）
 *   - SmsTemplateService（模板解析，模板来自配置页面或程序化注册）
 */

import { Injectable, Inject, Logger } from '@nestjs/common';
import { randomInt } from 'crypto';
import {
  BusinessException,
  CACHE_SERVICE,
  REDIS_ONLY_SERVICE,
  CacheTTL,
  RateLimit,
  type ICacheService,
  type IRedisOnlyService,
} from 'moyan-mfw-base/backend';
import { SMS_DEFAULT_CODE_SCENE } from 'moyan-mfw-extension-sms/shared';
import { SmsSdkService } from './sms-sdk.service';
import { SmsTemplateService } from './sms-template.service';

/** 验证码长度 */
const CODE_LENGTH = 6;

/** 验证码有效期（秒），与 CacheTTL.SHORT 一致 */
const CODE_TTL_SECONDS = CacheTTL.SHORT; // 180s

/** 验证码校验最大失败次数 */
const MAX_VERIFY_FAILS = 5;

/** 验证码校验失败计数窗口（秒） */
const VERIFY_FAIL_WINDOW = 300; // 5 分钟

/** 验证码默认场景（向后兼容别名，指向 shared 常量） */
export const DEFAULT_CODE_SCENE = SMS_DEFAULT_CODE_SCENE;

/**
 * dev 模式开关
 *
 * DEV_MODE=true 时跳过运营商真实发送，验证码通过接口返回，便于本地测试。
 * 频率限制、验证码生成、缓存存储、校验逻辑均保留，dev 下完整登录链路仍可走通。
 */
const DEV_MODE = process.env.DEV_MODE === 'true';

/** 验证码发送结果 */
export interface SendCodeResult {
  success: boolean;
  /** dev 模式下返回的验证码（仅 DEV_MODE=true 时有值，用于本地测试，生产环境恒为 undefined） */
  code?: string;
}

@Injectable()
export class SmsCodeService {
  private readonly logger = new Logger(SmsCodeService.name);

  constructor(
    private readonly smsSdkService: SmsSdkService,
    private readonly smsTemplateService: SmsTemplateService,
    @Inject(CACHE_SERVICE) private readonly cache: ICacheService,
    @Inject(REDIS_ONLY_SERVICE) private readonly redis: IRedisOnlyService,
  ) {}

  /**
   * 发送验证码短信
   *
   * 流程：
   *   1. 频率限制：同一手机号同一场景 60s 内只能发 1 次
   *   2. 生成 6 位随机数字验证码
   *   3. 存入缓存（180s 过期）
   *   4. 通过模板解析组装参数，调用通用发送
   *
   * @param phone 手机号（纯手机号）
   * @param scene 场景名（默认 "login_code"，需在配置页面或代码中注册模板）
   * @throws BusinessException 频率限制 / 模板未注册 / 发送失败
   */
  async sendCode(
    phone: string,
    scene: string = DEFAULT_CODE_SCENE,
  ): Promise<SendCodeResult> {
    // 1. 频率限制：同一手机号同一场景 60s 内只能发 1 次
    const rateLimitKey = `sms:rl:${scene}:${phone}`;
    const { allowed, remaining, resetIn } = await this.redis.rateLimit(
      rateLimitKey,
      RateLimit.CAPTCHA.max,
      RateLimit.CAPTCHA.window,
    );
    if (!allowed) {
      throw new BusinessException(`发送太频繁，请 ${resetIn} 秒后再试`, 429);
    }

    // 2. 生成 6 位随机数字验证码
    const code = this.generateCode();

    // 3. 存入缓存（180s 过期）
    // 缓存写入在发送之前：频率限制已消耗，若发送失败不写缓存会导致 60s 内无法重发且旧码也无法校验
    const cacheKey = `sms:code:${scene}:${phone}`;
    await this.cache.set(cacheKey, code, CODE_TTL_SECONDS);

    // 4. dev 模式：跳过运营商真实发送，验证码通过接口返回
    if (DEV_MODE) {
      this.logger.warn(
        `[DEV MODE] 跳过真实短信发送: phone=${phone} scene=${scene} code=${code.slice(0, 2)}****`,
      );
      return { success: true, code };
    }

    // 5. 生产模式：校验模板 + 调用运营商真实发送
    if (!(await this.smsTemplateService.has(scene))) {
      throw new BusinessException(`短信模板 "${scene}" 未注册，请联系管理员`, 500);
    }
    const templateParams = await this.smsTemplateService.resolve(scene, { code });
    await this.smsSdkService.send({
      phone,
      ...templateParams,
    });

    this.logger.log(
      `验证码已发送: phone=${phone} scene=${scene} remaining=${remaining}`,
    );

    return { success: true };
  }

  /**
   * 校验验证码
   *
   * @param phone 手机号
   * @param code 用户输入的验证码
   * @param scene 场景名（默认 "login_code"）
   * @throws BusinessException 验证码已过期 / 验证码错误
   * @returns true 表示校验通过
   */
  async verifyCode(
    phone: string,
    code: string,
    scene: string = DEFAULT_CODE_SCENE,
  ): Promise<boolean> {
    const cacheKey = `sms:code:${scene}:${phone}`;
    const failKey = `sms:verify:fail:${scene}:${phone}`;

    // 1. 检查失败次数限制（防止暴力猜测）
    const failCount = (await this.cache.get<number>(failKey)) || 0;
    if (failCount >= MAX_VERIFY_FAILS) {
      // 达到失败上限，删除验证码，强制重新获取
      await this.cache.del(cacheKey);
      this.logger.warn(`验证码校验失败次数超限: phone=${phone} scene=${scene}`);
      throw new BusinessException('验证码错误次数过多，请重新获取', 429);
    }

    // 2. 校验验证码
    const storedCode = await this.cache.get<string>(cacheKey);

    if (!storedCode) {
      throw new BusinessException('验证码已过期，请重新获取', 400);
    }

    // 类型转换：Redis 可能返回 number 类型，需转为 string 后比较
    if (String(storedCode) !== code) {
      // 失败计数 +1
      await this.cache.set(failKey, failCount + 1, VERIFY_FAIL_WINDOW);
      this.logger.warn(`验证码不匹配: stored=${storedCode} input=${code}`);
      throw new BusinessException('验证码错误', 400);
    }

    // 3. 校验通过：删除验证码（一次性使用）+ 清除失败计数
    await this.cache.del(cacheKey);
    await this.cache.del(failKey);

    this.logger.log(`验证码校验通过: phone=${phone} scene=${scene}`);
    return true;
  }

  /**
   * 生成 6 位随机数字验证码
   */
  private generateCode(): string {
    const min = Math.pow(10, CODE_LENGTH - 1);
    const max = Math.pow(10, CODE_LENGTH) - 1;
    return String(randomInt(min, max + 1));
  }
}
