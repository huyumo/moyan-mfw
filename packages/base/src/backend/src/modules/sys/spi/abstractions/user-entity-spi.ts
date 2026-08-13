/**
 * @fileoverview 用户实体 SPI 抽象类
 * @description 框架提供给业务方的用户管理接口，入口在业务层：
 * 业务方可通过 createUser 扩展注册方式（如三方注册），在业务侧创建用户时同步框架 sys_users。
 * 框架提供默认实现 DefaultUserEntitySpi，业务方可继承并覆盖个别方法。
 */

import { User } from '../../user/entities/user.entity';

/** 创建用户入参（业务方扩展注册方式时使用） */
export interface CreateUserSpiInput {
  username: string;
  password: string;
  nickname?: string;
  phone?: string;
  email?: string;
  avatar?: any;
  gender?: number;
  userStatus?: number;
  /** 业务方扩展属性（如三方平台标识、来源渠道等） */
  [key: string]: any;
}

/**
 * 用户实体 SPI（抽象类，业务层入口）
 * @description 业务方通过依赖注入获取本抽象类的框架默认实现，
 * 在业务侧（如三方注册、导入用户）调用，框架默认实现保证唯一性校验与密码加密。
 */
export abstract class UserEntitySpi {
  /**
   * 创建用户
   * @description 唯一性校验（用户名/邮箱/手机号）+ 密码加密 + 保存 + 触发 user.created 事件
   */
  abstract createUser(input: CreateUserSpiInput): Promise<User>;

  /**
   * 按用户名查询用户
   */
  abstract findByUsername(username: string): Promise<User | null>;

  /**
   * 按 ID 查询用户（含角色信息）
   */
  abstract findById(id: string): Promise<User>;
}
