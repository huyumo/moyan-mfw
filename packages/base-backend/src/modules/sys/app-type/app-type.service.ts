/**
 * @fileoverview 应用类型服务
 * @description 处理应用类型相关业务逻辑
 */

import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { AppType } from './entities/app-type.entity';
import { AppTypePermissionEntity } from './entities/app-type-permission.entity';
import { Permission, PermissionType } from '../permission/entities/permission.entity';
import { CreateAppTypeDto, UpdateAppTypeDto, QueryAppTypeDto } from './dto';
import { UpdatePermissionPoolDto } from './dto/req/update-permission-pool.dto';
import {
  PermissionPoolResponseDto,
  UpdatePermissionPoolResponseDto,
  PermissionTreeNodeDto,
} from './dto/res/permission-pool-response.dto';
import { NotFoundError } from '../../../common/exceptions/not-found.exception';
import { PaginationHelper, PaginationResult, QueryBuilderHelper } from '../../../common';

/**
 * 应用类型服务
 */
@Injectable()
export class AppTypeService {
  constructor(
    @InjectRepository(AppType)
    private appTypeRepository: Repository<AppType>,
    @InjectRepository(AppTypePermissionEntity)
    private appTypePermissionRepository: Repository<AppTypePermissionEntity>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    private dataSource: DataSource,
  ) {}

  /**
   * 创建应用类型
   * @param createAppTypeDto - 创建应用类型请求参数
   * @returns 创建的应用类型
   */
  async create(createAppTypeDto: CreateAppTypeDto): Promise<AppType> {
    const { typeCode } = createAppTypeDto;

    // 检查类型编码是否存在
    const existingAppType = await this.appTypeRepository.findOne({
      where: { typeCode },
    });

    if (existingAppType) {
      throw new ConflictException('类型编码已存在');
    }

    // 创建应用类型
    const appType = this.appTypeRepository.create(createAppTypeDto);
    return this.appTypeRepository.save(appType);
  }

  /**
   * 根据 ID 查询应用类型
   * @param id - 应用类型 ID
   * @returns 应用类型信息
   */
  async findById(id: string): Promise<AppType> {
    const appType = await this.appTypeRepository.findOne({
      where: { id },
    });

    if (!appType) {
      throw new NotFoundError('应用类型');
    }

    return appType;
  }

  /**
   * 查询应用类型列表（分页）
   * @param query - 查询参数
   * @returns 分页结果
   */
  async findAll(query: QueryAppTypeDto): Promise<PaginationResult<AppType>> {
    const qb = this.appTypeRepository.createQueryBuilder('appType');

    // 使用 QueryBuilderHelper 构建查询条件（支持 10+ 条件不臃肿）
    QueryBuilderHelper.applyConditions(qb, [
      { field: 'appType.typeName', value: query.typeName, operator: 'like' },
      { field: 'appType.typeCode', value: query.typeCode, operator: 'like' },
      { field: 'appType.typeStatus', value: query.typeStatus, operator: '=' },
    ]);

    // 使用 PaginationHelper 执行分页查询
    return PaginationHelper.executeQuery(
      qb.orderBy('appType.sortOrder', 'ASC').addOrderBy('appType.createdAt', 'DESC'),
      query,
    );
  }

  /**
   * 查询所有应用类型
   * @returns 应用类型列表
   */
  async findAllList(): Promise<AppType[]> {
    return this.appTypeRepository.find({
      order: {
        sortOrder: 'ASC',
        createdAt: 'DESC',
      },
    });
  }

  /**
   * 更新应用类型
   * @param id - 应用类型 ID
   * @param updateAppTypeDto - 更新应用类型请求参数
   * @returns 更新后的应用类型
   */
  async update(id: string, updateAppTypeDto: UpdateAppTypeDto): Promise<AppType> {
    // 查找应用类型
    const appType = await this.appTypeRepository.findOne({
      where: { id },
    });

    if (!appType) {
      throw new NotFoundError('应用类型');
    }

    // 如果更新类型编码，检查是否重复
    if (updateAppTypeDto.typeCode && updateAppTypeDto.typeCode !== appType.typeCode) {
      const existingAppType = await this.appTypeRepository.findOne({
        where: { typeCode: updateAppTypeDto.typeCode },
      });

      if (existingAppType) {
        throw new ConflictException('类型编码已存在');
      }
    }

    // 更新应用类型信息
    Object.assign(appType, updateAppTypeDto);
    return this.appTypeRepository.save(appType);
  }

  /**
   * 删除应用类型
   * @param id - 应用类型 ID
   */
  async delete(id: string): Promise<void> {
    const appType = await this.appTypeRepository.findOne({
      where: { id },
    });

    if (!appType) {
      throw new NotFoundError('应用类型');
    }

    // 使用软删除
    await this.appTypeRepository.softDelete(id);
  }

  /**
   * 更新应用类型状态
   * @param id - 应用类型 ID
   * @param status - 新状态
   * @returns 更新后的应用类型
   */
  async updateStatus(id: string, status: number): Promise<AppType> {
    const appType = await this.appTypeRepository.findOne({
      where: { id },
    });

    if (!appType) {
      throw new NotFoundError('应用类型');
    }

    appType.typeStatus = status;
    return this.appTypeRepository.save(appType);
  }

  /**
   * 获取权限池配置
   * @param appTypeId - 应用类型 ID
   * @returns 权限池配置
   */
  async getPermissionPool(appTypeId: string): Promise<PermissionPoolResponseDto> {
    // 验证应用类型存在
    const appType = await this.appTypeRepository.findOne({
      where: { id: appTypeId },
    });

    if (!appType) {
      throw new NotFoundError('应用类型');
    }

    // 获取所有权限
    const allPermissions = await this.permissionRepository.find({
      order: { sortOrder: 'ASC' },
    });

    // 获取权限池中已配置的权限
    const poolPermissions = await this.appTypePermissionRepository.find({
      where: { appTypeId },
    });

    // 构建权限池 Map（permissionId -> permissionValue）
    const poolMap = new Map<string, bigint>();
    for (const pool of poolPermissions) {
      poolMap.set(pool.permissionId, pool.permissionValue);
    }

    // 构建权限树
    const pcTree = this.buildPermissionTree(
      allPermissions.filter((p) => p.permissionType === PermissionType.PC),
      poolMap,
    );
    const normalTree = this.buildPermissionTree(
      allPermissions.filter((p) => p.permissionType === PermissionType.NORMAL),
      poolMap,
    );

    return {
      appTypeId,
      permissionTrees: {
        pcTree,
        normalTree,
      },
    };
  }

  /**
   * 更新权限池配置
   * @param appTypeId - 应用类型 ID
   * @param updateDto - 更新权限池请求
   * @returns 更新结果
   */
  async updatePermissionPool(
    appTypeId: string,
    updateDto: UpdatePermissionPoolDto,
  ): Promise<UpdatePermissionPoolResponseDto> {
    // 验证应用类型存在
    const appType = await this.appTypeRepository.findOne({
      where: { id: appTypeId },
    });

    if (!appType) {
      throw new NotFoundError('应用类型');
    }

    // 收集所有待处理的权限节点
    const allNodes: Array<{ permissionId: string; checked: boolean; permissionValue?: string }> =
      [];

    // 遍历 PC 权限树
    this.collectPermissionNodes(updateDto.permissionTrees.pcTree, allNodes);

    // 遍历普通权限树
    this.collectPermissionNodes(updateDto.permissionTrees.normalTree, allNodes);

    // 使用事务批量更新
    let updatedCount = 0;

    await this.dataSource.transaction(async (manager) => {
      // 先删除所有旧的权限池配置
      await manager.delete(AppTypePermissionEntity, { appTypeId });

      // 插入新的权限池配置（仅处理 checked=true 的节点）
      const entitiesToInsert: AppTypePermissionEntity[] = [];

      for (const node of allNodes) {
        if (node.checked) {
          const entity = manager.create(AppTypePermissionEntity, {
            appTypeId,
            permissionId: node.permissionId,
            permissionValue: node.permissionValue ? BigInt(node.permissionValue) : 0n,
          });
          entitiesToInsert.push(entity);
        }
      }

      if (entitiesToInsert.length > 0) {
        await manager.save(entitiesToInsert);
        updatedCount = entitiesToInsert.length;
      }
    });

    return {
      appTypeId,
      updatedCount,
    };
  }

  /**
   * 构建权限树
   * @param permissions - 权限列表
   * @param poolMap - 权限池 Map
   * @returns 权限树
   */
  private buildPermissionTree(
    permissions: Permission[],
    poolMap: Map<string, bigint>,
  ): PermissionTreeNodeDto[] {
    // 构建 ID -> Permission Map
    const permMap = new Map<string, Permission>();
    for (const perm of permissions) {
      permMap.set(perm.id, perm);
    }

    // 找出根节点（parentId 为空或 null）
    const roots = permissions.filter((p) => !p.parentId);

    // 递归构建树
    return roots.map((root) => this.buildTreeNode(root, permMap, poolMap));
  }

  /**
   * 构建单个树节点
   * @param permission - 权限实体
   * @param permMap - 权限 Map
   * @param poolMap - 权限池 Map
   * @returns 树节点
   */
  private buildTreeNode(
    permission: Permission,
    permMap: Map<string, Permission>,
    poolMap: Map<string, bigint>,
  ): PermissionTreeNodeDto {
    // 检查是否在权限池中
    const checked = poolMap.has(permission.id);
    const poolValue = poolMap.get(permission.id);

    // 构建节点
    const node: PermissionTreeNodeDto = {
      id: permission.id,
      permName: permission.permName,
      permCode: permission.permCode,
      permDesc: permission.permDesc,
      permissionType: permission.permissionType as 'PC' | 'NORMAL',
      nodeType: permission.nodeType as 'MENU' | 'PAGE' | 'TAG',
      parentId: permission.parentId ?? undefined,
      routePath: permission.routePath,
      externalUrl: permission.externalUrl,
      iconName: permission.iconName,
      sortOrder: permission.sortOrder,
      isVisible: permission.isVisible,
      isCache: permission.isCache,
      showMode: permission.showMode as 'NORMAL' | 'DEV',
      permStatus: permission.permStatus,
      isAutoSync: permission.isAutoSync,
      checked,
      // permissionValue 在 PC 权限的 PAGE 节点、普通权限的 TAG 节点时有效（bigint 序列化为字符串）
      permissionValue: checked && poolValue !== undefined ? poolValue.toString() : undefined,
      // parentPermissionValue 父权限定义的权限值
      parentPermissionValue: permission.permissionValue?.toString(),
    };

    // 找出子节点
    const children = Array.from(permMap.values()).filter((p) => p.parentId === permission.id);

    if (children.length > 0) {
      node.children = children
        .sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder))
        .map((child) => this.buildTreeNode(child, permMap, poolMap));
    }

    return node;
  }

  /**
   * 收集权限节点（递归）
   * @param nodes - 权限树节点列表
   * @param result - 收集结果
   */
  private collectPermissionNodes(
    nodes: Array<{ permissionId: string; checked: boolean; permissionValue?: string; children?: any[] }>,
    result: Array<{ permissionId: string; checked: boolean; permissionValue?: string }>,
  ): void {
    for (const node of nodes) {
      result.push({
        permissionId: node.permissionId,
        checked: node.checked,
        permissionValue: node.permissionValue,
      });

      if (node.children && node.children.length > 0) {
        this.collectPermissionNodes(node.children, result);
      }
    }
  }
}
