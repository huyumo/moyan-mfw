/**
 * @fileoverview SPI 事件总线模块
 * @description @Global 模块：提供 SpiEventBus（框架层入口事件分发）。
 * 独立成模块以避免循环依赖（SysModule 的 SPI 抽象类依赖各管理 Service，
 * 而各管理 Service 的 UserService/RoleService/AppMemberService 需要注入 SpiEventBus）。
 */

import { Module, Global } from '@nestjs/common';
import { SpiEventBus } from './events/event-bus';

/**
 * SPI 事件总线模块（全局）
 * @description 提供 SpiEventBus，全局可注入；业务方实现监听器接口后注入 SpiEventBus 自注册
 */
@Global()
@Module({
  providers: [SpiEventBus],
  exports: [SpiEventBus],
})
export class SpiModule {}
