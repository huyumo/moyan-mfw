/**
 * @fileoverview 广告管理完整模块
 * @description CoreModule + Controller，提供完整的 HTTP API
 */

import { Module } from '@nestjs/common'
import { AdPlacementController } from './controller/ad-placement.controller'
import { AdController } from './controller/ad.controller'
import { RouterModule } from '@nestjs/core'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Ad, AdPlacement } from './entities'
import { AdPlacementService, AdService } from './service'

@Module({
  imports: [
    TypeOrmModule.forFeature([AdPlacement, Ad]),
    RouterModule.register([{ path: 'ext/ad', module: AdModule }]),
  ],
  controllers: [AdPlacementController, AdController],
  providers: [AdPlacementService, AdService],
  exports: [AdPlacementService, AdService],

})
export class AdModule { }