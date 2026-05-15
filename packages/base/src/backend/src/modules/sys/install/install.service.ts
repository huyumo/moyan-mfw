/**
 * @fileoverview 初始化服务
 * @description 提供系统初始化检测和初始化执行功能
 */

import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AppType } from '../../app-type/entities/app-type.entity';
import { User } from '../../user/entities/user.entity';
import { App } from '../../app/entities/app.entity';
import { runSeeds } from '../../../../database/seeds/index';
import { InitResponseDto } from './dto/init-response.dto';

/**
 * 初始化服务
 */
@Injectable()
export class InstallService {
  constructor(
    @InjectRepository(AppType)
    private appTypeRepository: Repository<AppType>,
    private dataSource: DataSource,
  ) {}

  /**
   * 检查系统是否已初始化
   * @returns 是否已初始化
   */
  async isInitialized(): Promise<boolean> {
    const count = await this.appTypeRepository.count();
    return count > 0;
  }

  /**
   * 执行初始化
   * @param initData 初始化数据
   * @returns 初始化结果
   */
  async initialize(initData: {
    adminPassword: string;
  }): Promise<InitResponseDto> {
    // 检查是否已初始化
    if (await this.isInitialized()) {
      throw new ConflictException('系统已初始化，无法重复执行');
    }

    try {
      // 执行种子数据（使用 dataSource）
      await runSeeds(this.dataSource, initData.adminPassword);

      // 获取创建的实体信息
      const adminUser = await this.dataSource.manager.findOne(User, {
        where: { username: 'admin' },
      });

      const systemApp = await this.dataSource.manager.findOne(App, {
        where: { appCode: 'system-instance' },
      });

      const systemAppType = await this.dataSource.manager.findOne(AppType, {
        where: { typeCode: 'system' },
      });

      return {
        appTypeId: systemAppType!.id,
        appId: systemApp?.id || '',
        adminUserId: adminUser?.id || '',
        message: '初始化成功',
      };
    } catch (error) {
      throw error;
    }
  }
}
