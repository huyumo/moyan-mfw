/**
 * @fileoverview 初始化服务
 * @description 提供系统初始化检测和初始化执行功能
 */

import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AppType } from '../app-type/entities/app-type.entity';
import { User } from '../user/entities/user.entity';
import { App } from '../app/entities/app.entity';
import { Role } from '../role/entities/role.entity';
import { runSeeds } from '../../../database/seeds/index';
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
   *
   * 注意：当数据库连接不可用（如 "Pool is closed"、连接丢失等）时，保守返回 true。
   * 原因：前端 guard 在 /api/install/status 返回 initialized=false 时会跳转 install 页面，
   * 用户重新初始化会清空已有数据。数据库异常不能等同于"未初始化"。
   */
  async isInitialized(): Promise<boolean> {
    try {
      const count = await this.appTypeRepository.count();
      return count > 0;
    } catch (error) {
      console.error(
        '[InstallService] isInitialized: 查询失败，保守视为已初始化以防止误跳转 install 页面',
        error,
      );
      return true;
    }
  }

  /**
   * 检测数据库中是否存在业务数据（用于防止误初始化覆盖已有数据）
   * @returns 业务数据统计
   */
  async getExistingDataStats(): Promise<{
    hasData: boolean;
    userCount: number;
    roleCount: number;
    appTypeCount: number;
    appCount: number;
  }> {
    try {
      const [userCount, roleCount, appTypeCount, appCount] = await Promise.all([
        this.dataSource.getRepository(User).count(),
        this.dataSource.getRepository(Role).count(),
        this.appTypeRepository.count(),
        this.dataSource.getRepository(App).count(),
      ]);
      return {
        hasData: userCount > 0 || roleCount > 0 || appTypeCount > 0 || appCount > 0,
        userCount,
        roleCount,
        appTypeCount,
        appCount,
      };
    } catch (error) {
      // 查询失败时保守认为有数据，阻止初始化
      console.error('[InstallService] getExistingDataStats: 查询失败，保守视为已有数据', error);
      return {
        hasData: true,
        userCount: -1,
        roleCount: -1,
        appTypeCount: -1,
        appCount: -1,
      };
    }
  }

  /**
   * 执行初始化
   * @param initData 初始化数据
   * @returns 初始化结果
   *
   * 安全机制（防止误初始化导致数据丢失）：
   * 1. 通过 isInitialized() 检查 AppType 表
   * 2. 通过 getExistingDataStats() 多表交叉检查（User/Role/AppType/App）
   * 3. 任一检查发现数据即拒绝执行，除非显式传入 force=true 且服务端
   *    通过 ALLOW_FORCE_INSTALL=true 环境变量显式启用强制模式
   */
  async initialize(initData: {
    adminPassword: string;
    force?: boolean;
  }): Promise<InitResponseDto> {
    // 检查 1：AppType 表是否已有数据
    if (await this.isInitialized()) {
      throw new ConflictException('系统已初始化，无法重复执行');
    }

    // 检查 2：多表交叉检查，任一表有数据则视为已初始化
    const stats = await this.getExistingDataStats();
    if (stats.hasData) {
      // 仅当客户端显式请求 force 且服务端通过环境变量显式允许时，才可强制执行
      const allowForce = process.env.ALLOW_FORCE_INSTALL === 'true';
      if (!initData.force || !allowForce) {
        const detail = `用户=${stats.userCount} 角色=${stats.roleCount} 应用类型=${stats.appTypeCount} 应用=${stats.appCount}`;
        const hint = allowForce
          ? '如确需强制重新初始化（将清空现有数据），请在请求体中传入 force=true。'
          : '如确需强制重新初始化，需由管理员在服务端设置 ALLOW_FORCE_INSTALL=true 环境变量，并在请求体中传入 force=true。';
        throw new ConflictException(
          `检测到数据库中已存在业务数据（${detail}），拒绝执行初始化以防止数据丢失。${hint}`,
        );
      }
      // 强制模式：记录警告日志，便于审计
      console.warn(
        '[InstallService] initialize: 检测到已有数据，但收到强制初始化请求（ALLOW_FORCE_INSTALL=true, force=true），将继续执行。',
        stats,
      );
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
