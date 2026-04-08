/**
 * @fileoverview 角色服务
 * @description 处理角色相关业务逻辑
 */

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Role } from './entities/role.entity';
import { RolePermission } from '../permission/entities/role-permission.entity';
import { UserRole } from './entities/user-role.entity';
import { CreateRoleDto, UpdateRoleDto } from './dto';
import { NotFoundError } from '../../../common/exceptions/not-found.exception';

/**
 * 角色服务
 */
@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(UserRole)
    private userRepository: Repository<UserRole>,
    private dataSource: DataSource,
  ) {}

  /**
   * 创建角色
   * @param createRoleDto - 创建角色请求参数
   * @returns 创建的角色
   */
  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    const { roleCode } = createRoleDto;

    // 检查角色编码是否存在
    const existingRole = await this.roleRepository.findOne({
      where: { roleCode },
    });

    if (existingRole) {
      throw new ConflictException('角色编码已存在');
    }

    // 创建角色
    const role = this.roleRepository.create(createRoleDto);
    return this.roleRepository.save(role);
  }

  /**
   * 根据 ID 查询角色
   * @param id - 角色 ID
   * @returns 角色信息
   */
  async findById(id: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },
    });

    if (!role) {
      throw new NotFoundError('角色');
    }

    return role;
  }

  /**
   * 查询角色列表（分页）
   * @param query - 查询参数
   * @returns 角色列表和总数
   */
  async findAll(query: {
    page?: number;
    pageSize?: number;
    roleCode?: string;
    roleName?: string;
    roleStatus?: number;
    appTypeId?: string;
    appId?: string;
  }) {
    const { page = 1, pageSize = 10, roleCode, roleName, roleStatus, appTypeId, appId } = query;

    const queryBuilder = this.roleRepository.createQueryBuilder('role');

    // 条件查询
    if (roleCode) {
      queryBuilder.andWhere('role.roleCode LIKE :roleCode', {
        roleCode: `%${roleCode}%`,
      });
    }

    if (roleName) {
      queryBuilder.andWhere('role.roleName LIKE :roleName', {
        roleName: `%${roleName}%`,
      });
    }

    if (roleStatus !== undefined) {
      queryBuilder.andWhere('role.roleStatus = :roleStatus', { roleStatus });
    }

    if (appTypeId) {
      queryBuilder.andWhere('role.appTypeId = :appTypeId', { appTypeId });
    }

    if (appId) {
      queryBuilder.andWhere('role.appId = :appId', { appId });
    }

    // 分页和排序
    const [list, total] = await queryBuilder
      .orderBy('role.sortOrder', 'ASC')
      .addOrderBy('role.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 更新角色
   * @param id - 角色 ID
   * @param updateRoleDto - 更新角色请求参数
   * @returns 更新后的角色
   */
  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    // 查找角色
    const role = await this.roleRepository.findOne({
      where: { id },
    });

    if (!role) {
      throw new NotFoundError('角色');
    }

    // 更新角色信息
    Object.assign(role, updateRoleDto);
    return this.roleRepository.save(role);
  }

  /**
   * 删除角色
   * @param id - 角色 ID
   */
  async delete(id: string): Promise<void> {
    const role = await this.roleRepository.findOne({
      where: { id },
    });

    if (!role) {
      throw new NotFoundError('角色');
    }

    // 内置角色不允许删除
    if (role.isBuiltin === 1) {
      throw new ConflictException('内置角色不允许删除');
    }

    // 使用软删除
    await this.roleRepository.softDelete(id);
  }

  /**
   * 为角色分配权限
   * @param roleId - 角色 ID
   * @param permissions - 权限列表
   */
  async assignPermissions(
    roleId: string,
    permissions: Array<{ permissionId: string; permissionValue: number }>,
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 删除旧的权限关联
      await queryRunner.manager.delete(RolePermission, { roleId });

      // 添加新的权限关联
      if (permissions && permissions.length > 0) {
        const rolePermissions = permissions.map((item) =>
          queryRunner.manager.create(RolePermission, {
            roleId,
            permissionId: item.permissionId,
            permissionValue: item.permissionValue,
          }),
        );
        await queryRunner.manager.save(rolePermissions);
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
   * 获取角色的权限列表
   * @param roleId - 角色 ID
   * @returns 角色权限列表
   */
  async getRolePermissions(roleId: string): Promise<RolePermission[]> {
    return this.rolePermissionRepository.find({
      where: { roleId },
      relations: ['permission'],
    });
  }
}
