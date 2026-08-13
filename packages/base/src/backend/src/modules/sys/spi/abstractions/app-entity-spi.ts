/**
 * @fileoverview 应用实体 SPI 抽象类
 * @description 框架提供给业务方的应用实体管理接口，入口在业务层：
 * 业务方在自有业务实体（如商家）管理接口中调用本 SPI，同步维护框架内部应用实例状态。
 * 框架提供默认实现 DefaultAppEntitySpi，业务方可继承并覆盖个别方法。
 */

/** 创建应用实体入参 */
export interface CreateAppSpiInput {
  /** 应用名称（业务实体名称，如店铺名称） */
  appName: string;
  /** 应用编码（业务唯一，如商家编码） */
  appCode: string;
  /** 应用类型 ID，与 appTypeCode 二选一，同时提供时优先 appTypeId */
  appTypeId?: string;
  /** 应用类型编码（如 'merchant'），未传 appTypeId 时按编码解析 */
  appTypeCode?: string;
  /** 应用描述 */
  appDesc?: string;
  /** 应用 logo（JSON） */
  logo?: any;
  /** 创建时绑定拥有者：内部完成成员记录 + owner 角色分配 */
  ownerId?: string;
  /** 排序号 */
  sortOrder?: number;
}

/** 更新应用实体入参 */
export interface UpdateAppSpiInput {
  appName?: string;
  appDesc?: string;
  logo?: any;
  sortOrder?: number;
}

/** 应用实体 SPI 返回结果 */
export interface AppSpiResult {
  id: string;
  appName: string;
  appCode: string;
  appTypeId: string | null;
  appDesc?: string | null;
  logo?: any;
  ownerId?: string | null;
  appStatus?: number;
  sortOrder?: number;
  [key: string]: any;
}

/**
 * 应用实体 SPI（抽象类，业务层入口）
 * @description 业务方通过依赖注入获取本抽象类的框架默认实现，
 * 在业务实体管理接口（添加/编辑/禁用/删除）中调用，同步维护框架内部应用状态。
 */
export abstract class AppEntitySpi {
  /**
   * 创建应用实体
   * @description 一步完成：解析应用类型 → 创建应用实例 →（传了 ownerId 时）绑定拥有者
   * @returns 创建后的应用实体信息
   */
  abstract createApp(input: CreateAppSpiInput): Promise<AppSpiResult>;

  /**
   * 更新应用实体基础信息
   */
  abstract updateApp(appId: string, input: UpdateAppSpiInput): Promise<AppSpiResult>;

  /**
   * 禁用应用实体（业务实体下架时同步）
   */
  abstract disableApp(appId: string): Promise<AppSpiResult>;

  /**
   * 启用应用实体（业务实体恢复上架时同步）
   */
  abstract enableApp(appId: string): Promise<AppSpiResult>;

  /**
   * 删除应用实体（软删除，系统内置应用受保护）
   */
  abstract deleteApp(appId: string): Promise<void>;

  /**
   * 变更应用拥有者（内部同步成员记录与 owner 角色分配）
   */
  abstract changeAppOwner(appId: string, ownerId: string): Promise<AppSpiResult>;

  /**
   * 查询应用实体详情（含拥有者与应用类型信息）
   */
  abstract getApp(appId: string): Promise<AppSpiResult>;

  /**
   * 按业务唯一编码查询应用实体
   */
  abstract findAppByCode(appCode: string): Promise<AppSpiResult | null>;
}
