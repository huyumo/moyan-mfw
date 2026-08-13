/**
 * @fileoverview 商家成员监听器
 * @description 展示框架层入口 SPI：实现 MemberEventListener 接口并在构造函数中注册到 SpiEventBus，
 * 框架内部成员变更（添加/移除/角色变更）时自动回调，业务方可在此同步商家侧状态
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  SpiEventBus,
  MemberEventListener,
  MemberAddedEvent,
  MemberRemovedEvent,
  MemberRolesChangedEvent,
} from 'moyan-mfw-base/backend';

/**
 * 商家成员监听器
 * @description 示例：成员变更时打印日志（实际场景可同步商家扩展表成员数/发通知等）
 */
@Injectable()
export class MerchantMemberListener implements MemberEventListener {
  private readonly logger = new Logger(MerchantMemberListener.name);

  constructor(eventBus: SpiEventBus) {
    // 集成注册：实现框架接口并注册到事件总线（与 scheduler handler 自注册模式一致）
    eventBus.registerMemberListener(this);
  }

  /** 成员被添加时触发 */
  async onMemberAdded(event: MemberAddedEvent): Promise<void> {
    this.logger.log(
      `[商家同步] 成员加入应用 appId=${event.appId} userId=${event.userId}`,
    );
    // 实际场景：同步商家扩展表成员数 / 发送入驻通知等
  }

  /** 成员被移除时触发 */
  async onMemberRemoved(event: MemberRemovedEvent): Promise<void> {
    this.logger.log(
      `[商家同步] 成员退出应用 appId=${event.appId} userId=${event.userId}`,
    );
  }

  /** 成员角色变更时触发 */
  async onMemberRolesChanged(event: MemberRolesChangedEvent): Promise<void> {
    this.logger.log(
      `[商家同步] 成员角色变更 appId=${event.appId} userId=${event.userId} roleIds=${JSON.stringify(event.roleIds)}`,
    );
  }
}
