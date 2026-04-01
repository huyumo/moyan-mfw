/**
 * @fileoverview 权限服务
 * @description 处理权限相关业务逻辑
 */

import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, TreeRepository } from 'typeorm';
import { Permission } from './entities/permission.entity';
import { CreatePermissionDto, UpdatePermissionDto, QueryPermissionDto } from './dto';
import { NotFoundError } from '../../../common/exceptions/not-found.exception';

/**
 * 权限服务
 */
@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    private dataSource: DataSource,
  ) {}

  /**
   * 创建权限
   * @param createPermissionDto - 创建权限请求参数
   * @returns 创建的权限
   */
  async create(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    const { permCode } = createPermissionDto;

    // 检查权限编码是否存在
    const existingPermission = await this.permissionRepository.findOne({
      where: { permCode },
    });

    if (existingPermission) {
      throw new ConflictException('权限编码已存在');
    }

    // 创建权限
    const permission = this.permissionRepository.create(createPermissionDto);
    return this.permissionRepository.save(permission);
  }

  /**
   * 根据 ID 查询权限
   * @param id - 权限 ID
   * @returns 权限信息
   */
  async findById(id: string): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundError('权限');
    }

    return permission;
  }

  /**
   * 查询权限列表（分页）
   * @param query - 查询参数
   * @returns 权限列表和总数
   */
  async findAll(query: QueryPermissionDto) {
    const {
      page = 1,
      pageSize = 10,
      permName,
      permCode,
      permissionType,
      nodeType,
      parentId,
    } = query;

    const queryBuilder = this.permissionRepository.createQueryBuilder('permission');

    // 条件查询
    if (permName) {
      queryBuilder.andWhere('permission.permName LIKE :permName', {
        permName: `%${permName}%`,
      });
    }

    if (permCode) {
      queryBuilder.andWhere('permission.permCode LIKE :permCode', {
        permCode: `%${permCode}%`,
      });
    }

    if (permissionType !== undefined) {
      queryBuilder.andWhere('permission.permissionType = :permissionType', { permissionType });
    }

    if (nodeType !== undefined) {
      queryBuilder.andWhere('permission.nodeType = :nodeType', { nodeType });
    }

    if (parentId) {
      queryBuilder.andWhere('permission.parentId = :parentId', { parentId });
    }

    // 分页和排序
    const [list, total] = await queryBuilder
      .orderBy('permission.sortOrder', 'ASC')
      .addOrderBy('permission.createdAt', 'DESC')
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
   * 查询所有权限（树形结构）
   * @returns 树形权限列表
   */
  async findAllTree(): Promise<Permission[]> {
    return this.permissionRepository.find({
      order: {
        sortOrder: 'ASC',
        createdAt: 'DESC',
      },
    });
  }

  /**
   * 更新权限
   * @param id - 权限 ID
   * @param updatePermissionDto - 更新权限请求参数
   * @returns 更新后的权限
   */
  async update(id: string, updatePermissionDto: UpdatePermissionDto): Promise<Permission> {
    // 查找权限
    const permission = await this.permissionRepository.findOne({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundError('权限');
    }

    // 如果更新权限编码，检查是否重复
    if (updatePermissionDto.permCode && updatePermissionDto.permCode !== permission.permCode) {
      const existingPermission = await this.permissionRepository.findOne({
        where: { permCode: updatePermissionDto.permCode },
      });

      if (existingPermission) {
        throw new ConflictException('权限编码已存在');
      }
    }

    // 更新权限信息
    Object.assign(permission, updatePermissionDto);
    return this.permissionRepository.save(permission);
  }

  /**
   * 删除权限
   * @param id - 权限 ID
   */
  async delete(id: string): Promise<void> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundError('权限');
    }

    // 检查是否有子权限
    const children = await this.permissionRepository.find({
      where: { parentId: id },
    });

    if (children.length > 0) {
      throw new ConflictException('存在子权限，无法删除');
    }

    // 使用软删除
    await this.permissionRepository.softDelete(id);
  }

  /**
   * 获取权限树
   * @param parentId - 父权限 ID（可选）
   * @returns 权限树
   */
  async getPermissionTree(parentId?: string): Promise<Permission[]> {
    const permissions = await this.permissionRepository.find({
      where: parentId ? { parentId } : undefined,
      order: {
        sortOrder: 'ASC',
      },
    });

    return permissions;
  }

  /**
   * 批量创建权限
   * @param permissions - 权限列表
   * @returns 创建的权限列表
   */
  async batchCreate(permissions: CreatePermissionDto[]): Promise<Permission[]> {
    // 验证必填字段
    for (const perm of permissions) {
      if (!perm.permName || !perm.permCode || !perm.permissionType) {
        throw new BadRequestException('缺少必填字段：permName, permCode, permissionType 不能为空');
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const createdPermissions: Permission[] = [];

      for (const perm of permissions) {
        // 检查权限编码是否存在
        const existingPermission = await queryRunner.manager.findOne(Permission, {
          where: { permCode: perm.permCode },
        });

        if (existingPermission) {
          throw new ConflictException(`权限编码 ${perm.permCode} 已存在`);
        }

        const permission = queryRunner.manager.create(Permission, perm);
        const saved = await queryRunner.manager.save(permission);
        createdPermissions.push(saved);
      }

      await queryRunner.commitTransaction();
      return createdPermissions;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
