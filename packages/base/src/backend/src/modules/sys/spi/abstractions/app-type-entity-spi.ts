/**
 * @fileoverview 应用类型实体 SPI 抽象类
 * @description 框架提供给业务方的应用类型查询接口（只读），入口在业务层：
 * 业务方通过应用类型编码/ID 获取应用类型信息（如"商家应用类型"），用于业务实体与框架应用实例关联。
 * 框架提供默认实现 DefaultAppTypeEntitySpi，业务方可继承并覆盖个别方法。
 */

import { AppType } from '../../app-type/entities/app-type.entity';

/**
 * 应用类型实体 SPI（抽象类，业务层入口，只读）
 */
export abstract class AppTypeEntitySpi {
  /**
   * 按 ID 查询应用类型
   */
  abstract findById(appTypeId: string): Promise<AppType | null>;

  /**
   * 按编码查询应用类型（如 'merchant'）
   */
  abstract findByCode(typeCode: string): Promise<AppType | null>;

  /**
   * 查询全部应用类型
   */
  abstract findAll(): Promise<AppType[]>;
}
