/**
 * @fileoverview 角色事件监听器接口
 * @description 框架层入口：框架内部在角色变更时触发，业务方实现本接口并注册到 SpiEventBus 接收事件。
 * 所有方法均为可选实现，业务方只实现关心的变更。
 */

/** 角色创建事件载荷 */
export interface RoleCreatedEvent {
  roleId: string;
  roleCode: string;
  roleName: string;
  appId?: string | null;
  appTypeId?: string | null;
}

/** 角色更新事件载荷 */
export interface RoleUpdatedEvent {
  roleId: string;
  roleCode: string;
  roleName: string;
}

/** 角色删除事件载荷 */
export interface RoleDeletedEvent {
  roleId: string;
  roleCode: string;
  roleName: string;
}

/** 角色权限变更事件载荷 */
export interface RolePermissionsChangedEvent {
  roleId: string;
}

/**
 * 角色事件监听器
 * @description 业务方实现本接口（如商家角色监听器），在构造函数中调用
 * `eventBus.registerRoleListener(this)` 完成集成注册。
 */
export interface RoleEventListener {
  /** 角色创建时触发 */
  onRoleCreated?(event: RoleCreatedEvent): Promise<void> | void;
  /** 角色更新时触发 */
  onRoleUpdated?(event: RoleUpdatedEvent): Promise<void> | void;
  /** 角色删除时触发 */
  onRoleDeleted?(event: RoleDeletedEvent): Promise<void> | void;
  /** 角色权限分配变更时触发 */
  onRolePermissionsChanged?(event: RolePermissionsChangedEvent): Promise<void> | void;
}
