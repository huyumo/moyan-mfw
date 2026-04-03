/**
 * @fileoverview 权限服务
 * @description 处理权限相关业务逻辑
 */

import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, TreeRepository } from 'typeorm';
import { Permission } from './entities/permission.entity';
import { CreatePermissionDto, UpdatePermissionDto, QueryPermissionDto } from './dto';
import { RouteNodeDto, SyncPermissionResponseDto, ComparePermissionResponseDto, DiffItemDto, SyncDetailDto } from './dto';
import { NotFoundError } from '../../../common/exceptions/not-found.exception';
import { PermissionType, NodeType } from './entities/permission.entity';

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

  /**
   * 同步路由到权限表
   * @param appTypeId - 应用类型 ID
   * @param routes - 路由树
   * @param dryRun - 是否仅预览
   * @returns 同步结果
   */
  async syncPermissions(
    appTypeId: string,
    routes: RouteNodeDto[],
    dryRun: boolean = false,
  ): Promise<SyncPermissionResponseDto> {
    const details: SyncDetailDto[] = [];
    let added = 0;
    let updated = 0;
    let skipped = 0;

    // TODO-TASK-2026-04-03-003: 添加 appTypeId 字段到 Permission entity
    // 预计完成：2026-04-05
    // 阻塞原因：需要数据库迁移添加 appTypeId 字段

    // 获取现有 PC 权限
    const existingPermissions = await this.permissionRepository.find({
      where: {
        permissionType: PermissionType.PC,
      },
    });
    const existingMap = new Map(existingPermissions.map(p => [p.permCode, p]));

    // 递归处理路由节点
    const processRoutes = async (
      routeNodes: RouteNodeDto[],
      parentCode: string | null = null,
    ): Promise<void> => {
      for (let i = 0; i < routeNodes.length; i++) {
        const route = routeNodes[i];
        const permCode = this.generatePermCode(route.path);
        const nodeType = route.children && route.children.length > 0 ? NodeType.MENU : NodeType.PAGE;
        const existing = existingMap.get(permCode);

        if (existing) {
          // 检查是否需要更新
          const needsUpdate =
            existing.permName !== route.name ||
            existing.parentId !== (parentCode ? existingMap.get(parentCode)?.id || null : null) ||
            existing.sortOrder !== i;

          if (needsUpdate) {
            if (!dryRun) {
              existing.permName = route.name;
              existing.sortOrder = i;
              if (parentCode) {
                const parent = existingMap.get(parentCode);
                existing.parentId = parent?.id || null;
              } else {
                existing.parentId = null;
              }
              await this.permissionRepository.save(existing);
            }
            updated++;
            details.push({
              type: 'update',
              permName: route.name,
              permCode,
              nodeType,
              parentCode: parentCode || undefined,
            });
          } else {
            skipped++;
            details.push({
              type: 'skip',
              permName: route.name,
              permCode,
              nodeType,
              parentCode: parentCode || undefined,
            });
          }
        } else {
          // 新增权限
          if (!dryRun) {
            const parent = parentCode ? existingMap.get(parentCode) : null;
            const newPermission = this.permissionRepository.create({
              permName: route.name,
              permCode,
              permDesc: `同步生成：${route.name}`,
              permissionType: PermissionType.PC,
              nodeType,
              parentId: parent?.id || undefined,
              routePath: route.path,
              sortOrder: i,
              isAutoSync: 1,
              permStatus: 1,
              permissionValue: nodeType === NodeType.PAGE ? 63n : 0n, // PAGE 默认有所有操作权限
            });
            const saved = await this.permissionRepository.save(newPermission);
            existingMap.set(permCode, saved);
          }
          added++;
          details.push({
            type: 'add',
            permName: route.name,
            permCode,
            nodeType,
            parentCode: parentCode || undefined,
          });
        }

        // 递归处理子路由
        if (route.children && route.children.length > 0) {
          await processRoutes(route.children, permCode);
        }
      }
    };

    await processRoutes(routes);

    return {
      dryRun,
      added,
      updated,
      skipped,
      details,
    };
  }

  /**
   * 比对路由与权限差异
   * @param appTypeId - 应用类型 ID
   * @param routes - 路由树
   * @returns 比对结果
   */
  async comparePermissions(
    appTypeId: string,
    routes: RouteNodeDto[],
  ): Promise<ComparePermissionResponseDto> {
    const added: DiffItemDto[] = [];
    const updated: DiffItemDto[] = [];
    const removed: DiffItemDto[] = [];
    const moved: DiffItemDto[] = [];

    // 获取现有 PC 权限
    const existingPermissions = await this.permissionRepository.find({
      where: {
        permissionType: PermissionType.PC,
      },
    });
    const existingMap = new Map(existingPermissions.map(p => [p.permCode, p]));
    const processedCodes = new Set<string>();

    // 递归比对路由
    const compareRoutes = async (
      routeNodes: RouteNodeDto[],
      parentCode: string | null = null,
    ): Promise<void> => {
      for (const route of routeNodes) {
        const permCode = this.generatePermCode(route.path);
        processedCodes.add(permCode);
        const existing = existingMap.get(permCode);

        if (!existing) {
          // 新增
          added.push({
            type: 'added',
            permCode,
            permName: route.name,
            routePath: route.path,
            suggestion: `新增${route.children && route.children.length > 0 ? '目录' : '页面'}权限`,
          });
        } else {
          // 检查更新
          const expectedParentId = parentCode ? existingMap.get(parentCode)?.id || null : null;
          if (existing.parentId !== expectedParentId) {
            moved.push({
              type: 'moved',
              permCode,
              permName: route.name,
              routePath: route.path,
              suggestion: '移动权限节点位置',
            });
          } else if (existing.permName !== route.name) {
            updated.push({
              type: 'updated',
              permCode,
              permName: route.name,
              routePath: route.path,
              suggestion: '更新权限名称',
            });
          }
        }

        // 递归处理子路由
        if (route.children && route.children.length > 0) {
          await compareRoutes(route.children, permCode);
        }
      }
    };

    await compareRoutes(routes);

    // 检查已删除的权限
    for (const [permCode, perm] of existingMap) {
      if (!processedCodes.has(permCode) && perm.isAutoSync === 1) {
        removed.push({
          type: 'removed',
          permCode,
          permName: perm.permName,
          routePath: perm.routePath || '',
          suggestion: '路由已删除，权限保留（懒清理策略）',
        });
      }
    }

    return {
      added,
      updated,
      removed,
      moved,
      totalDiffs: added.length + updated.length + removed.length + moved.length,
    };
  }

  /**
   * 生成权限编码
   * @param path - 路由路径
   * @returns 权限编码
   */
  private generatePermCode(path: string): string {
    // 移除开头的斜杠，将路径转换为权限编码
    const cleanPath = path.replace(/^\//, '').replace(/\//g, ':');
    return `pc:${cleanPath || 'root'}`;
  }
}
