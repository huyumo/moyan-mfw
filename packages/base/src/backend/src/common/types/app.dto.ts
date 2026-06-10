/**
 * @fileoverview 应用信息 DTO
 * @description 定义从请求中提取的应用信息结构
 */

/**
 * 应用信息 DTO
 * @description 通过 @App 装饰器注入到控制器方法参数的应用信息
 */
export class AppDto {
  /**
   * 应用实例 ID
   */
  id: string;

  /**
   * 应用名称
   */
  appName: string;

  /**
   * 应用编码
   */
  appCode: string;

  /**
   * 应用类型 ID
   */
  appTypeId: string;

  /**
   * 负责人 ID
   */
  ownerId: string;

  /**
   * 应用状态
   */
  appStatus: number;

  /**
   * 应用类型编码
   */
  appTypeCode: string;

  /**
   * 是否支持多应用
   */
  multiAppEnabled: number;
}
