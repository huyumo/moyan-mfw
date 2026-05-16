/**
 * @fileoverview 广告管理核心模块
 */

import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AdPlacement } from './entities/ad-placement.entity'
import { Ad } from './entities/ad.entity'
import { AdPlacementService } from './service/ad-placement.service'
import { AdService } from './service/ad.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([AdPlacement, Ad]),
  ],
  providers: [AdPlacementService, AdService],
  exports: [AdPlacementService, AdService],
})
export class AdCoreModule {}
