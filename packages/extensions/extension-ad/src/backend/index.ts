/**
 * @fileoverview 广告扩展包后端入口
 * @description 导出 NestJS 模块、实体、生命周期钩子
 */

export { AdModule, AdModule as default } from './ad.module'
export { AdPlacementType, AdPlacement, Ad } from './entities'
export { AdPlacementTypeService, AdPlacementService, AdService } from './service'
