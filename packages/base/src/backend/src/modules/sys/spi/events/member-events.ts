/**
 * @fileoverview 成员事件监听器接口
 * @description 框架层入口：框架内部在成员变更时触发，业务方实现本接口并注册到 SpiEventBus 接收事件。
 * 所有方法均为可选实现，业务方只实现关心的变更。
 */

/** 成员添加事件载荷 */
export interface MemberAddedEvent {
  appId: string;
  userId: string;
}

/** 成员移除事件载荷 */
export interface MemberRemovedEvent {
  appId: string;
  userId: string;
}

/** 成员角色变更事件载荷 */
export interface MemberRolesChangedEvent {
  appId: string;
  userId: string;
  /** 变更后的角色 ID 列表 */
  roleIds: string[];
}

/**
 * 成员事件监听器
 * @description 业务方实现本接口（如商家成员监听器），在构造函数中调用
 * `eventBus.registerMemberListener(this)` 完成集成注册。
 */
export interface MemberEventListener {
  /** 成员被添加时触发 */
  onMemberAdded?(event: MemberAddedEvent): Promise<void> | void;
  /** 成员被移除时触发 */
  onMemberRemoved?(event: MemberRemovedEvent): Promise<void> | void;
  /** 成员角色变更时触发 */
  onMemberRolesChanged?(event: MemberRolesChangedEvent): Promise<void> | void;
}
