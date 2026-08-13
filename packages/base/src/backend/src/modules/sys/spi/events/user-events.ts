/**
 * @fileoverview 用户事件监听器接口
 * @description 框架层入口：框架内部在 sys_users 变更时触发，业务方实现本接口并注册到 SpiEventBus 接收事件。
 * 所有方法均为可选实现，业务方只实现关心的变更。
 */

/** 用户创建事件载荷（不含密码等敏感字段） */
export interface UserCreatedEvent {
  id: string;
  username: string;
  nickname?: string;
  phone?: string | null;
  email?: string | null;
  userStatus?: number;
}

/** 用户更新事件载荷（不含密码等敏感字段） */
export interface UserUpdatedEvent {
  id: string;
  username: string;
  nickname?: string;
  phone?: string | null;
  email?: string | null;
  userStatus?: number;
  /** 变更前的用户信息（用于对比） */
  before?: {
    nickname?: string;
    phone?: string | null;
    email?: string | null;
    userStatus?: number;
  };
}

/** 用户删除事件载荷 */
export interface UserDeletedEvent {
  id: string;
  username: string;
}

/**
 * 用户事件监听器（sys_user 变更事件）
 * @description 业务方实现本接口（如商家用户监听器），在构造函数中调用
 * `eventBus.registerUserListener(this)` 完成集成注册。
 */
export interface UserEventListener {
  /** 用户创建时触发（含业务方通过 UserEntitySpi.createUser 创建） */
  onUserCreated?(event: UserCreatedEvent): Promise<void> | void;
  /** 用户信息更新时触发（含状态变更） */
  onUserUpdated?(event: UserUpdatedEvent): Promise<void> | void;
  /** 用户删除时触发 */
  onUserDeleted?(event: UserDeletedEvent): Promise<void> | void;
}
