/**
 * @fileoverview 配置管理后端入口
 */

export * from './config.module';
export * from './service/config.service';
export * from './dto';
export * from './entities/config.entity';

// 导出权限定义，供业务层收集
export { CONFIG_PERMISSION_VALUES } from 'moyan-mfw-extension-config/shared';
