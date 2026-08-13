/**
 * @fileoverview 商家用户监听器
 * @description 展示 sys_user 变更事件（框架层入口）：实现 UserEventListener 接口并注册到 SpiEventBus，
 * 框架内部用户创建/更新/删除时自动回调
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  SpiEventBus,
  UserEventListener,
  UserCreatedEvent,
  UserUpdatedEvent,
  UserDeletedEvent,
} from 'moyan-mfw-base/backend';

/**
 * 商家用户监听器
 * @description 示例：用户变更时打印日志（实际场景可同步商家侧用户档案/消息通知等）
 */
@Injectable()
export class MerchantUserListener implements UserEventListener {
  private readonly logger = new Logger(MerchantUserListener.name);

  constructor(eventBus: SpiEventBus) {
    eventBus.registerUserListener(this);
  }

  /** 用户创建时触发（含业务方通过 UserEntitySpi.createUser 创建） */
  async onUserCreated(event: UserCreatedEvent): Promise<void> {
    this.logger.log(
      `[用户同步] 新用户创建 id=${event.id} username=${event.username}`,
    );
  }

  /** 用户更新时触发（含状态变更） */
  async onUserUpdated(event: UserUpdatedEvent): Promise<void> {
    this.logger.log(
      `[用户同步] 用户更新 id=${event.id} username=${event.username} userStatus=${event.userStatus}`,
    );
  }

  /** 用户删除时触发 */
  async onUserDeleted(event: UserDeletedEvent): Promise<void> {
    this.logger.log(
      `[用户同步] 用户删除 id=${event.id} username=${event.username}`,
    );
  }
}
