/**
 * @fileoverview 广告扩展包后端入口
 * @description 导出 CoreModule（仅 Service+Entity）、完整 AdModule、实体、DTO、路由配置
 */

export { AdCoreModule } from './ad-core.module'
export { AdModule, AdModule as default } from './ad.module'
export { AdPlacement, Ad } from './entities'
export { AdPlacementService, AdService } from './service'
export {
  CreateAdPlacementDto, UpdateAdPlacementDto, QueryAdPlacementDto,
  CreateAdDto, UpdateAdDto, QueryAdDto,
  BatchUpdateSortDto,
} from './dto'
export { AD_EXTENSION_PERMISSION_VALUES } from 'moyan-mfw-extension-ad/shared'

/**
 * 广告模块路由前缀配置，业务层无需关心具体前缀值。
 * 使用方式：`createBaseBackendApp({ moduleRoutes: [adModuleRoute] })`
 */
export { adModuleRoute } from './ad.module'
