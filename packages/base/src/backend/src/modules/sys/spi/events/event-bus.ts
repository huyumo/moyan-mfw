/**
 * @fileoverview SPI 事件总线
 * @description 框架层入口：框架内部在成员/角色/用户变更时触发事件，
 * 分发给业务方通过 registerXxxListener 注册的监听器（实现框架接口集成，与 scheduler handler 自注册模式一致）。
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  MemberEventListener,
  MemberAddedEvent,
  MemberRemovedEvent,
  MemberRolesChangedEvent,
} from './member-events';
import {
  UserEventListener,
  UserCreatedEvent,
  UserUpdatedEvent,
  UserDeletedEvent,
} from './user-events';
import {
  RoleEventListener,
  RoleCreatedEvent,
  RoleUpdatedEvent,
  RoleDeletedEvent,
  RolePermissionsChangedEvent,
} from './role-events';

/**
 * SPI 事件总线（@Global 提供）
 * @description 业务方注入本服务并注册监听器：
 * ```ts
 * constructor(@Inject(SpiEventBus) private eventBus: SpiEventBus) {
 *   eventBus.registerMemberListener(this);
 * }
 * ```
 * 监听器异常会被捕获记录，不影响框架主流程（旁路语义）。
 */
@Injectable()
export class SpiEventBus {
  private readonly logger = new Logger(SpiEventBus.name);

  private memberListeners: MemberEventListener[] = [];
  private userListeners: UserEventListener[] = [];
  private roleListeners: RoleEventListener[] = [];

  // ── 监听器注册（业务方集成） ──

  registerMemberListener(listener: MemberEventListener): void {
    this.memberListeners.push(listener);
  }

  registerUserListener(listener: UserEventListener): void {
    this.userListeners.push(listener);
  }

  registerRoleListener(listener: RoleEventListener): void {
    this.roleListeners.push(listener);
  }

  // ── 成员事件 ──

  /** 成员添加事件（框架内部触发） */
  async emitMemberAdded(event: MemberAddedEvent): Promise<void> {
    await this.dispatch(this.memberListeners, (l) => l.onMemberAdded?.(event));
  }

  /** 成员移除事件（框架内部触发） */
  async emitMemberRemoved(event: MemberRemovedEvent): Promise<void> {
    await this.dispatch(this.memberListeners, (l) => l.onMemberRemoved?.(event));
  }

  /** 成员角色变更事件（框架内部触发） */
  async emitMemberRolesChanged(event: MemberRolesChangedEvent): Promise<void> {
    await this.dispatch(this.memberListeners, (l) => l.onMemberRolesChanged?.(event));
  }

  // ── 用户事件 ──

  /** 用户创建事件（框架内部触发，含 UserEntitySpi.createUser） */
  async emitUserCreated(event: UserCreatedEvent): Promise<void> {
    await this.dispatch(this.userListeners, (l) => l.onUserCreated?.(event));
  }

  /** 用户更新事件（框架内部触发，含状态变更） */
  async emitUserUpdated(event: UserUpdatedEvent): Promise<void> {
    await this.dispatch(this.userListeners, (l) => l.onUserUpdated?.(event));
  }

  /** 用户删除事件（框架内部触发） */
  async emitUserDeleted(event: UserDeletedEvent): Promise<void> {
    await this.dispatch(this.userListeners, (l) => l.onUserDeleted?.(event));
  }

  // ── 角色事件 ──

  /** 角色创建事件（框架内部触发） */
  async emitRoleCreated(event: RoleCreatedEvent): Promise<void> {
    await this.dispatch(this.roleListeners, (l) => l.onRoleCreated?.(event));
  }

  /** 角色更新事件（框架内部触发） */
  async emitRoleUpdated(event: RoleUpdatedEvent): Promise<void> {
    await this.dispatch(this.roleListeners, (l) => l.onRoleUpdated?.(event));
  }

  /** 角色删除事件（框架内部触发） */
  async emitRoleDeleted(event: RoleDeletedEvent): Promise<void> {
    await this.dispatch(this.roleListeners, (l) => l.onRoleDeleted?.(event));
  }

  /** 角色权限变更事件（框架内部触发） */
  async emitRolePermissionsChanged(event: RolePermissionsChangedEvent): Promise<void> {
    await this.dispatch(this.roleListeners, (l) => l.onRolePermissionsChanged?.(event));
  }

  /**
   * 分发事件到监听器
   * @description 逐个调用，单个监听器异常仅记录日志，不影响框架主流程（旁路语义）
   */
  private async dispatch<T>(
    listeners: T[],
    invoke: (listener: T) => Promise<void> | void,
  ): Promise<void> {
    for (const listener of listeners) {
      try {
        await invoke(listener);
      } catch (error: any) {
        this.logger.error(`SPI 事件监听器执行失败: ${error?.message}`, error?.stack);
      }
    }
  }
}
