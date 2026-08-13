/**
 * @fileoverview SPI 事件层统一导出
 * @description 导出事件总线与各实体事件监听器接口/载荷
 */

export { SpiEventBus } from './event-bus';

export type {
  MemberEventListener,
  MemberAddedEvent,
  MemberRemovedEvent,
  MemberRolesChangedEvent,
} from './member-events';

export type {
  UserEventListener,
  UserCreatedEvent,
  UserUpdatedEvent,
  UserDeletedEvent,
} from './user-events';

export type {
  RoleEventListener,
  RoleCreatedEvent,
  RoleUpdatedEvent,
  RoleDeletedEvent,
  RolePermissionsChangedEvent,
} from './role-events';
