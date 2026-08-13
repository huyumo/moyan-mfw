/**
 * @fileoverview 用户实体 SPI 默认实现
 * @description 委托 UserService 实现用户创建/查询逻辑。
 * 业务方可直接注入 UserEntitySpi 抽象类使用，或继承本类覆盖个别方法。
 */

import { Injectable } from '@nestjs/common';
import {
  UserEntitySpi,
  CreateUserSpiInput,
} from '../abstractions/user-entity-spi';
import { UserService } from '../../user/user.service';
import { User } from '../../user/entities/user.entity';
import { CreateUserDto } from '../../user/dto';

/**
 * 用户实体 SPI 默认实现
 */
@Injectable()
export class DefaultUserEntitySpi extends UserEntitySpi {
  constructor(private userService: UserService) {
    super();
  }

  async createUser(input: CreateUserSpiInput): Promise<User> {
    // UserService.create 内部完成唯一性校验 + 密码加密，并触发 user.created 事件
    return this.userService.create(input as CreateUserDto);
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userService.findByUsername(username);
  }

  async findById(id: string): Promise<User> {
    return this.userService.findById(id);
  }
}
