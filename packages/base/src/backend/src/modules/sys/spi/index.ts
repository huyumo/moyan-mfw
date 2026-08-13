/**
 * @fileoverview 管理 SPI 层统一导出
 * @description 框架提供给业务方的 SPI 集成入口：
 * - abstractions：实体管理抽象类（业务层入口，注入调用 / 继承扩展）
 * - events：实体变更监听器接口与事件总线（框架层入口，实现接口并注册）
 * - impl：框架内置默认实现
 */

export * from './abstractions';
export * from './events';
export * from './impl';
export { SpiModule } from './spi.module';
