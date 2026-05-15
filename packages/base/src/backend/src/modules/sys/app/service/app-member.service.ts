/**
 * @fileoverview 成员服务
 * @description 处理应用成员相关业务逻辑
 */

import { Injectable, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { randomUUID } from 'crypto';
import { AppMember } from '../../entities/app-member.entity';
import { Role } from '../../../role/entities/role.entity';
import { User } from '../../../user/entities/user.entity';
import { App } from '../../entities/app.entity';
import { AppType } from '../../../app-type/entities/app-type.entity';
import { AddMemberDto, UpdateMemberRolesDto, QueryMemberDto } from '../../dto';
import { PaginationX, WhereBuilder, PaginationResult } from '../../../../../common';

/**
 * 成员服务
 */
@Injectable()
export class AppMemberService {
  constructor(
    @InjectRepository(AppMember)
    private appMemberRepository: Repository<AppMember>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(App)
    private appRepository: Repository<App>,
    @InjectRepository(AppType)
    private appTypeRepository: Repository<AppType>,
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

    const app = await this.appRepository.findOne({ where: { id: appId } });
    if (!app) {
      throw new NotFoundException('应用不存在');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const appType = await this.appTypeRepository.findOne({
      where: { id: app.appTypeId },
    });

    if (appType && appType.multiAppEnabled === 0) {
      const sameTypeMembers = await this.dataSource.query(
        `SELECT sa.appName FROM sys_app_members sam
         INNER JOIN sys_apps sa ON sa.id = sam.appId AND sa.deleteAt IS NULL
         WHERE sam.userId = ? AND sa.appTypeId = ? AND sam.appId != ?`,
        [userId, app.appTypeId, appId],
      );

      if (sameTypeMembers && sameTypeMembers.length > 0) {
        throw new BadRequestException(
          `应用类型 "${appType.typeName}" 不支持多应用，该用户已是实例 "${sameTypeMembers[0].appName}" 的成员`,
        );
      }
    }

    const existingMember = await this.appMemberRepository.findOne({
      where: { appId, userId },
    });

    if (existingMember) {
      throw new ConflictException('该用户已是应用成员');
    }

    const member = this.appMemberRepository.create({ appId, userId });
    return this.appMemberRepository.save(member);
  }

  /**
   * 获取应用成员列表（分页）
   * @param appId - 应用 ID
   * @param query - 查询参数
   * @returns 分页结果
   */
  async getMembers(appId: string, query: QueryMemberDto): Promise<PaginationResult<any>> {
    const { nickname, username } = query;
    const app = await this.appRepository.findOne({ where: { id: appId } });
    if (!app) {
      throw new NotFoundException('应用不存在');
    }

    const whereBuilder = new WhereBuilder();
    whereBuilder
      .eq('am.appId', appId)
      .like('u.nickname', nickname)
      .like('u.username', username)

    // 角色范围过滤：仅返回当前应用或同应用类型下的角色
    const roleScopeBuilder = new WhereBuilder();
    roleScopeBuilder
      .eq('r.appId', appId)
      .eq('r.appTypeId', app.appTypeId, 'OR');

    const pager = new PaginationX(this.dataSource, query);
    return await pager
      .where('main', whereBuilder)
      .where('roleScope', roleScopeBuilder)
      .sql(({ select, wheres, orderBy, limit }) => {
        const whereClause = wheres?.main || '';
        const roleScopeClause = wheres?.roleScope || '';
        return `
        WITH rj AS(
          SELECT 
            ur.userId,
            JSON_ARRAYAGG(
              JSON_OBJECT(
                'roleId', r.id,
                'roleCode', r.roleCode,
                'roleName', r.roleName,
                'isBuiltin', r.isBuiltin
              )
            ) AS roles
          FROM sys_user_roles ur
          INNER JOIN sys_roles r ON ur.roleId = r.id
          WHERE ur.appId = '${appId}' ${roleScopeClause.replace('WHERE', 'AND')}
          GROUP BY ur.userId
        )
        SELECT
          ${select}
        FROM sys_app_members am
        INNER JOIN sys_apps a ON a.id = am.appId   
        INNER JOIN sys_users u ON u.id = am.userId 
        LEFT JOIN  rj ON rj.userId = am.userId
          ${whereClause}
          ${orderBy}
          ${limit}
        `;
      })
      .select(`
          am.id,
          am.userId,
          am.appId,
          am.createdAt,
          u.nickname,
          u.avatar,
          u.email,
          u.phone,
          u.username,
          a.appCode,
          a.appName,
          a.logo as appLogo,
          a.ownerId,
          a.sortOrder,
          a.appTypeId,
          COALESCE(rj.roles, JSON_ARRAY()) AS roles,
          IF(a.ownerId = am.userId,1,0) isOwner
        `)
      .defaultOrderBy('createdAt DESC')
      .getData();
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
    await this.dataSource.transaction(async (manager) => {
      await manager.query(
        `DELETE FROM sys_user_roles WHERE userId = ? AND appId = ? AND roleId NOT IN (SELECT id FROM sys_roles WHERE isOwner = 1)`,
        [userId, appId],
      );

      if (roleIds.length > 0) {
        const insertValues = roleIds.map((roleId) => {
          const id = randomUUID();
          return [id, userId, roleId, appId];
        });
        await manager.query(
          `INSERT INTO sys_user_roles (id, userId, roleId, appId) VALUES ?`,
          [insertValues],
        );
      }
    });
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
    await this.dataSource.transaction(async (manager) => {
      await manager.query(
        `DELETE FROM sys_user_roles WHERE userId = ? AND appId = ?`,
        [userId, appId],
      );

      await manager.delete(AppMember, { appId, userId });
    });
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