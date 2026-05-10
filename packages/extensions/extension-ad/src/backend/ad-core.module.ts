/**
 * @fileoverview 广告管理核心模块（无 HTTP 暴露）
 * @description 仅提供服务与实体注册，供业务层内部消费。不注册 Controller。
 */

import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AdPlacementType } from './entities/ad-placement-type.entity'
import { AdPlacement } from './entities/ad-placement.entity'
import { Ad } from './entities/ad.entity'
import { AdPlacementTypeService } from './service/ad-placement-type.service'
import { AdPlacementService } from './service/ad-placement.service'
import { AdService } from './service/ad.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([AdPlacementType, AdPlacement, Ad]),
  ],
  providers: [AdPlacementTypeService, AdPlacementService, AdService],
  exports: [AdPlacementTypeService, AdPlacementService, AdService],
})
export class AdCoreModule {}
