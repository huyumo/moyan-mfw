/**
 * @fileoverview 广告扩展包后端入口
 * @description 导出 CoreModule（仅 Service+Entity）、完整 AdModule、实体、DTO
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
