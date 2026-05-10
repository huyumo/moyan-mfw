/**
 * @fileoverview 广告管理模块
 * @description 广告管理扩展模块定义，包含广告位、类型配置、广告内容
 */

import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AdPlacementType } from './entities/ad-placement-type.entity'
import { AdPlacement } from './entities/ad-placement.entity'
import { Ad } from './entities/ad.entity'
import { AdPlacementTypeService } from './service/ad-placement-type.service'
import { AdPlacementTypeController } from './controller/ad-placement-type.controller'
import { AdPlacementService } from './service/ad-placement.service'
import { AdPlacementController } from './controller/ad-placement.controller'
import { AdService } from './service/ad.service'
import { AdController } from './controller/ad.controller'

@Module({
  imports: [
    TypeOrmModule.forFeature([AdPlacementType, AdPlacement, Ad]),
  ],
  providers: [AdPlacementTypeService, AdPlacementService, AdService],
  controllers: [AdPlacementTypeController, AdPlacementController, AdController],
  exports: [AdPlacementTypeService, AdPlacementService, AdService],
})
export class AdModule {}
