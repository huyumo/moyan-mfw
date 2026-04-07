/**
 * @fileoverview 权限服务
 * @description 处理权限相关业务逻辑
 */

import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, TreeRepository } from 'typeorm';
import { Permission } from './entities/permission.entity';
import { CreatePermissionDto, UpdatePermissionDto, QueryPermissionDto } from './dto';
import { RouteNodeDto, PermissionTreeNodeDto } from './dto';
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
    const { permCode, nodeType, parentId, permissionType } = createPermissionDto;

    // 自动生成完整的 permCode（严格按照树结构）
    let fullPermCode = permCode;
    if (parentId) {
      const parent = await this.permissionRepository.findOne({
        where: { id: parentId },
      });
      if (!parent) {
        throw new NotFoundError('父权限');
      }
      // 拼接父节点的 permCode（严格按树结构）
      fullPermCode = `${parent.permCode}:${permCode}`;
    } else {
      // 没有父节点，检查是否是根节点
      if (permissionType === PermissionType.PC && permCode !== 'pc_root') {
        throw new BadRequestException('PC 权限的根节点编码必须为 pc_root');
      }
      if (permissionType === PermissionType.NORMAL && permCode !== 'normal_root') {
        throw new BadRequestException('普通权限的根节点编码必须为 normal_root');
      }
    }

    // 检查权限编码是否存在
    const existingPermission = await this.permissionRepository.findOne({
      where: { permCode: fullPermCode },
    });

    if (existingPermission) {
      throw new ConflictException(`权限编码已存在: ${fullPermCode}`);
    }

    // 根节点只能创建 MENU 类型
    if (!parentId && nodeType !== NodeType.MENU) {
      throw new BadRequestException('根节点只能创建 MENU 类型');
    }

    // TAG 类型的父节点必须是 MENU 类型
    if (nodeType === NodeType.TAG && parentId) {
      const parentPermission = await this.permissionRepository.findOne({
        where: { id: parentId },
      });

      if (!parentPermission) {
        throw new NotFoundError('父权限');
      }

      if (parentPermission.nodeType !== NodeType.MENU) {
        throw new BadRequestException(`TAG 类型权限的父节点必须是 MENU 类型，当前父节点类型为 ${parentPermission.nodeType}`);
      }
    }

    // 创建权限（使用完整编码）
    const permission = this.permissionRepository.create({
      ...createPermissionDto,
      permCode: fullPermCode,
    });
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
   * 查询所有权限（树形结构，带 children）
   * @param permissionType - 权限类型筛选（可选）
   * @returns 树形权限列表
   */
  async findAllTreeWithChildren(permissionType?: string): Promise<PermissionTreeNodeDto[]> {
    const queryBuilder = this.permissionRepository.createQueryBuilder('permission');

    if (permissionType) {
      queryBuilder.where('permission.permissionType = :permissionType', { permissionType });
    }

    queryBuilder.orderBy('permission.sortOrder', 'ASC');

    const permissions = await queryBuilder.getMany();
    return this.buildTree(permissions);
  }

  /**
   * 获取权限树（带 children）
   * @param parentId - 父权限 ID（可选）
   * @returns 权限树
   */
  async getPermissionTreeWithChildren(parentId?: string): Promise<PermissionTreeNodeDto[]> {
    const permissions = await this.permissionRepository.find({
      where: parentId ? { parentId } : undefined,
      order: {
        sortOrder: 'ASC',
      },
    });
    return this.buildTree(permissions, parentId);
  }

  /**
   * 将扁平列表转换为树形结构
   * @param permissions - 权限列表
   * @param rootParentId - 根节点父 ID
   * @returns 树形结构
   */
  private buildTree(
    permissions: Permission[],
    rootParentId?: string,
  ): PermissionTreeNodeDto[] {
    const map = new Map<string, PermissionTreeNodeDto & { children?: PermissionTreeNodeDto[] }>();
    const roots: PermissionTreeNodeDto[] = [];

    // 先创建所有节点的映射
    permissions.forEach(item => {
      const node: PermissionTreeNodeDto & { children?: PermissionTreeNodeDto[] } = {
        id: item.id,
        permName: item.permName,
        permCode: item.permCode,
        permDesc: item.permDesc,
        permissionType: item.permissionType,
        nodeType: item.nodeType,
        parentId: item.parentId || undefined,
        routePath: item.routePath || undefined,
        externalUrl: item.externalUrl || undefined,
        iconName: item.iconName || undefined,
        sortOrder: item.sortOrder,
        isVisible: item.isVisible,
        isCache: item.isCache,
        showMode: item.showMode,
        permStatus: item.permStatus,
        isAutoSync: item.isAutoSync,
        permissionValue: typeof item.permissionValue === 'bigint' ? item.permissionValue.toString() : (item.permissionValue as string),
        createdAt: item.createdAt,
        updateAt: item.updateAt,
        children: [],
      };
      map.set(item.id, node);
    });

    // 构建树形结构
    permissions.forEach(item => {
      const node = map.get(item.id)!;
      if (item.parentId && map.has(item.parentId)) {
        const parent = map.get(item.parentId)!;
        if (!parent.children) {
          parent.children = [];
        }
        parent.children.push(node);
      } else if (!item.parentId || item.parentId === rootParentId) {
        roots.push(node);
      }
    });

    // 清理空的 children 数组
    const cleanEmptyChildren = (nodes: PermissionTreeNodeDto[]) => {
      nodes.forEach(node => {
        if (node.children && node.children.length === 0) {
          delete node.children;
        } else if (node.children) {
          cleanEmptyChildren(node.children);
        }
      });
    };
    cleanEmptyChildren(roots);

    return roots;
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
   * 删除权限（级联删除子节点）
   * @param id - 权限 ID
   */
  async delete(id: string): Promise<void> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundError('权限');
    }

    // 禁止删除根节点
    if (permission.permCode === 'pc_root' || permission.permCode === 'normal_root') {
      throw new BadRequestException('权限根节点不允许删除');
    }

    // 递归删除子权限
    await this.deleteChildren(id);

    // 删除当前权限
    await this.permissionRepository.softDelete(id);
  }

  /**
   * 递归删除子权限
   * @param parentId - 父权限 ID
   */
  private async deleteChildren(parentId: string): Promise<void> {
    const children = await this.permissionRepository.find({
      where: { parentId },
    });

    for (const child of children) {
      // 递归删除子权限的子权限
      await this.deleteChildren(child.id);
      // 删除子权限
      await this.permissionRepository.softDelete(child.id);
    }
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
   * @description 将前端路由同步为 PC 权限节点，存储到 Permission 表（全局）
   * 简化流程：清理旧同步数据 → 同步新数据 → 返回最新权限树
   * @param routes - 路由列表（树形结构）
   * @returns 最新权限树
   */
  async syncPermissions(routes: RouteNodeDto[]): Promise<PermissionTreeNodeDto[]> {
    // 确保 PC 根节点存在
    await this.ensurePcRoot();

    // 清理旧的同步数据（isAutoSync=1 的 PC 权限）
    await this.clearAutoSyncPermissions();

    // 扁平化路由并按深度排序
    const flatRoutes = this.flattenRoutes(routes);

    // 构建路径集合，用于判断 nodeType（基于路由数据，而非数据库）
    const allRoutePaths = new Set(flatRoutes.map(r => r.path));

    // 同步每个路由节点
    for (const route of flatRoutes) {
      await this.syncRouteNode(route, allRoutePaths);
    }

    // 返回最新权限树
    return this.findAllTreeWithChildren('PC');
  }

  /**
   * 清理旧的自动同步数据
   * 删除所有 isAutoSync=1 的 PC 权限（保留 pc_root 和 isAutoSync=0 的权限）
   */
  private async clearAutoSyncPermissions(): Promise<void> {
    // 使用事务删除，避免外键约束问题
    await this.dataSource.transaction(async (manager) => {
      // 1. 获取所有 isAutoSync=1 的 PC 权限 ID（排除 pc_root）
      const pcPerms = await manager.find(Permission, {
        where: {
          permissionType: PermissionType.PC,
          isAutoSync: 1, // 只清理自动同步的权限
        },
        select: ['id', 'permCode'],
      });

      const idsToDelete = pcPerms
        .filter(p => p.permCode !== 'pc_root')
        .map(p => p.id);

      if (idsToDelete.length === 0) return;

      // 2. 删除 sys_role_permission 关联（只删除 isAutoSync=1 的权限关联）
      // 使用 FIND_IN_SET 避免 IN 语法对数组参数的限制
      await manager.query(
        `DELETE FROM sys_role_permission WHERE FIND_IN_SET(permissionId, ?)`,
        [idsToDelete.join(',')]
      );

      // 3. 删除权限（按深度从深到浅）
      const sortedPerms = pcPerms
        .filter(p => p.permCode !== 'pc_root')
        .sort((a, b) => {
          const depthA = a.permCode.split(':').length;
          const depthB = b.permCode.split(':').length;
          return depthB - depthA;
        });

      for (const perm of sortedPerms) {
        await manager.delete(Permission, perm.id);
      }
    });
  }

  /**
   * 确保 PC 根节点存在
   */
  private async ensurePcRoot(): Promise<void> {
    const pcRoot = await this.permissionRepository.findOne({
      where: { permCode: 'pc_root' },
    });

    if (!pcRoot) {
      const root = this.permissionRepository.create({
        permName: 'PC权限根节点',
        permCode: 'pc_root',
        permDesc: 'PC权限系统的根节点',
        permissionType: PermissionType.PC,
        nodeType: NodeType.MENU,
        parentId: null,
        sortOrder: 0,
        isVisible: 0,
        isAutoSync: 0,
        permStatus: 1,
        permissionValue: 0n,
      });
      await this.permissionRepository.save(root);
    }
  }

  /**
   * 扁平化路由（树形 → 数组）
   * 按路径深度排序，确保父节点先处理
   */
  private flattenRoutes(routes: RouteNodeDto[]): RouteNodeDto[] {
    const result: RouteNodeDto[] = [];

    const flatten = (routeList: RouteNodeDto[]) => {
      for (const route of routeList) {
        result.push(route);
        if (route.children && route.children.length > 0) {
          flatten(route.children);
        }
      }
    };

    flatten(routes);

    // 按路径深度排序
    result.sort((a, b) => {
      const depthA = a.path.split('/').filter(Boolean).length;
      const depthB = b.path.split('/').filter(Boolean).length;
      return depthA - depthB;
    });

    return result;
  }

  /**
   * 同步单个路由节点
   * @param route - 路由节点
   * @param allRoutePaths - 所有路由路径集合（用于判断 nodeType）
   */
  private async syncRouteNode(route: RouteNodeDto, allRoutePaths: Set<string>): Promise<void> {
    const permCode = this.generatePermCode(route.path);
    const pathSegments = route.path.split('/').filter(Boolean);
    const depth = pathSegments.length;

    // 确定父节点
    let parentId: string | null = null;
    if (depth === 1) {
      // 顶级路由挂载到 pc_root
      const pcRoot = await this.permissionRepository.findOne({
        where: { permCode: 'pc_root' },
      });
      parentId = pcRoot?.id || null;
    } else {
      // 查找父节点
      const parentPath = '/' + pathSegments.slice(0, -1).join('/');
      const parentCode = this.generatePermCode(parentPath);
      const parent = await this.permissionRepository.findOne({
        where: { permCode: parentCode },
      });
      parentId = parent?.id || null;
    }

    // 判断 nodeType：基于路由数据（有 children 或有子路由路径）
    const hasChildrenInRoute = route.children && route.children.length > 0;
    const hasChildRoutes = Array.from(allRoutePaths).some(p =>
      p.startsWith(route.path + '/') && p !== route.path
    );
    const nodeType = (hasChildrenInRoute || hasChildRoutes) ? NodeType.MENU : NodeType.PAGE;

    // 检查是否已存在
    const existing = await this.permissionRepository.findOne({
      where: { permCode },
    });

    if (existing) {
      // 更新名称、路径、nodeType
      existing.permName = route.name;
      existing.routePath = route.path;
      existing.nodeType = nodeType;
      if (parentId) existing.parentId = parentId;
      // 同步生成的 PAGE 节点设置默认权限值
      if (nodeType === NodeType.PAGE) {
        existing.permissionValue = 63n;
      }
      await this.permissionRepository.save(existing);
    } else {
      // 新增
      const newPerm = this.permissionRepository.create({
        permName: route.name,
        permCode,
        permDesc: `同步生成：${route.name}`,
        permissionType: PermissionType.PC,
        nodeType,
        parentId: parentId || undefined,
        routePath: route.path,
        sortOrder: depth * 10,
        isAutoSync: 1,
        permStatus: 1,
        permissionValue: nodeType === NodeType.PAGE ? 63n : 0n,
      });
      await this.permissionRepository.save(newPerm);
    }
  }

  /**
   * 生成权限编码（严格按照树结构）
   * @param path - 路由路径
   * @returns 权限编码（格式：pc_root:path:to:route）
   */
  private generatePermCode(path: string): string {
    const cleanPath = path.replace(/^\//, '').replace(/\//g, ':');
    return `pc_root:${cleanPath || 'root'}`;
  }
}
