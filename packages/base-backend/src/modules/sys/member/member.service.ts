/**
 * @fileoverview 成员服务
 * @description 处理应用成员相关业务逻辑
 */

import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { AppMember } from '../app/entities/app-member.entity';
import { Role } from '../role/entities/role.entity';
import { User } from '../user/entities/user.entity';
import { App } from '../app/entities/app.entity';
import { AddMemberDto, UpdateMemberRolesDto } from './dto';

/**
 * 成员服务
 */
@Injectable()
export class MemberService {
  constructor(
    @InjectRepository(AppMember)
    private appMemberRepository: Repository<AppMember>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(App)
    private appRepository: Repository<App>,
    private dataSource: DataSource,
  ) {}

  /**
   * 添加应用成员
   * @param appId - 应用 ID
   * @param addMemberDto - 添加成员请求参数
   * @returns 创建成员关联
   */
  async addMember(appId: string, addMemberDto: AddMemberDto): Promise<AppMember> {
    const { userId } = addMemberDto;

    // 检查应用是否存在
    const app = await this.appRepository.findOne({ where: { id: appId } });
    if (!app) {
      throw new NotFoundException('应用不存在');
    }

    // 检查用户是否存在
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 检查成员是否已存在
    const existingMember = await this.appMemberRepository.findOne({
      where: { appId, userId },
    });

    if (existingMember) {
      throw new ConflictException('该用户已是应用成员');
    }

    // 创建成员关联（初始不分配角色）
    const member = this.appMemberRepository.create({ appId, userId });
    return this.appMemberRepository.save(member);
  }

  /**
   * 获取应用成员列表
   * @param appId - 应用 ID
   * @returns 成员列表（包含用户信息和角色列表）
   */
  async getMembers(appId: string): Promise<any[]> {
    // 检查应用是否存在
    const app = await this.appRepository.findOne({ where: { id: appId } });
    if (!app) {
      throw new NotFoundException('应用不存在');
    }

    // 查询成员列表（包含用户信息）
    const members = await this.appMemberRepository.find({
      where: { appId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });

    // 为每个成员查询角色列表
    const memberList = await Promise.all(
      members.map(async (member) => {
        // 查询用户在该应用中的角色
        const queryRunner = this.dataSource.createQueryRunner();
        const roles = await queryRunner.manager.query(
          `
          SELECT r.id as roleId, r.roleName as roleName, r.roleCode as roleCode, r.isBuiltin as isBuiltin
          FROM sys_roles r
          INNER JOIN sys_user_role ur ON r.id = ur.roleId
          WHERE ur.userId = ? AND (r.appId = ? OR r.appTypeId = ?)
          AND r.isOwner = 0
          `,
          [member.userId, appId, app.appTypeId],
        );

        await queryRunner.release();

        return {
          id: member.id,
          appId: member.appId,
          userId: member.userId,
          createdAt: member.createdAt,
          user: member.user,
          roles: roles || [],
        };
      }),
    );

    return memberList;
  }

  /**
   * 更新成员角色
   * @param appId - 应用 ID
   * @param userId - 用户 ID
   * @param updateDto - 更新角色请求参数
   */
  async updateRoles(
    appId: string,
    userId: string,
    updateDto: UpdateMemberRolesDto,
  ): Promise<void> {
    const { roleIds } = updateDto;

    // 检查应用是否存在
    const app = await this.appRepository.findOne({ where: { id: appId } });
    if (!app) {
      throw new NotFoundException('应用不存在');
    }

    // 检查成员是否存在
    const member = await this.appMemberRepository.findOne({
      where: { appId, userId },
    });
    if (!member) {
      throw new NotFoundException('该用户不是应用成员');
    }

    // 验证所有角色 ID 是否有效且属于该应用
    if (roleIds.length > 0) {
      const roles = await this.roleRepository.findBy({ id: In(roleIds) });
      if (roles.length !== roleIds.length) {
        throw new BadRequestException('存在无效的角色 ID');
      }

      // 验证角色是否属于该应用或应用类型
      const validRoles = roles.filter(
        (r) => r.appId === appId || r.appTypeId === app.appTypeId,
      );
      if (validRoles.length !== roleIds.length) {
        throw new BadRequestException('存在不属于该应用的角色');
      }
    }

    // 使用事务更新角色
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 删除现有角色关联（排除拥有者角色）
      await queryRunner.manager.query(
        `
        DELETE ur FROM sys_user_role ur
        INNER JOIN sys_roles r ON ur.roleId = r.id
        WHERE ur.userId = ? AND (r.appId = ? OR r.appTypeId = ?)
        AND r.isOwner = 0
        `,
        [userId, appId, app.appTypeId],
      );

      // 添加新角色关联
      if (roleIds.length > 0) {
        const insertValues = roleIds.map((roleId) => {
          const id = require('crypto').randomUUID();
          return [id, userId, roleId, new Date()];
        });
        await queryRunner.manager.query(
          `INSERT INTO sys_user_role (id, userId, roleId, created_at) VALUES ?`,
          [insertValues],
        );
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 移除应用成员
   * @param appId - 应用 ID
   * @param userId - 用户 ID
   */
  async removeMember(appId: string, userId: string): Promise<void> {
    // 检查应用是否存在
    const app = await this.appRepository.findOne({ where: { id: appId } });
    if (!app) {
      throw new NotFoundException('应用不存在');
    }

    // 检查成员是否存在
    const member = await this.appMemberRepository.findOne({
      where: { appId, userId },
    });
    if (!member) {
      throw new NotFoundException('成员不存在');
    }

    // 检查是否是拥有者
    if (app.ownerId === userId) {
      throw new BadRequestException('不能移除应用拥有者');
    }

    // 使用事务删除成员和角色关联
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 删除角色关联
      await queryRunner.manager.query(
        `DELETE FROM sys_user_role WHERE userId = ?`,
        [userId],
      );

      // 删除成员关联
      await this.appMemberRepository.delete({ appId, userId });

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 获取可选角色列表
   * @param appId - 应用 ID
   * @returns 可选角色列表（内置角色 + 应用级角色，排除拥有者角色）
   */
  async getAvailableRoles(appId: string): Promise<any[]> {
    // 检查应用是否存在
    const app = await this.appRepository.findOne({ where: { id: appId } });
    if (!app) {
      throw new NotFoundException('应用不存在');
    }

    // 查询可选角色（内置角色 + 应用级角色，排除拥有者角色）
    const roles = await this.roleRepository
      .createQueryBuilder('role')
      .where('(role.appId = :appId OR role.appTypeId = :appTypeId)', {
        appId,
        appTypeId: app.appTypeId,
      })
      .andWhere('role.isOwner = :isOwner', { isOwner: 0 })
      .orderBy('role.sortOrder', 'ASC')
      .getMany();

    return roles.map((r) => ({
      id: r.id,
      roleName: r.roleName,
      roleCode: r.roleCode,
      isBuiltin: r.isBuiltin,
      isOwner: r.isOwner,
    }));
  }
}
