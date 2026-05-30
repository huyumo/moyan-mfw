/**
 * @fileoverview 应用类型服务
 * @description 处理应用类型相关业务逻辑
 */

import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { AppType } from './entities/app-type.entity';
import { AppTypePermissionEntity } from './entities/app-type-permission.entity';
import { PermissionType, Permission } from '../permission/entities/permission.entity';
import { Role } from '../role/entities/role.entity';
import { CreateAppTypeDto, UpdateAppTypeDto, QueryAppTypeDto } from './dto';
import { UpdatePermissionPoolDto } from './dto/req/update-permission-pool.dto';
import {
  PermissionPoolResponseDto,
  UpdatePermissionPoolResponseDto,
} from './dto/res/permission-pool-response.dto';
import { NotFoundError } from '../../../common/exceptions/not-found.exception';
import { PaginationResult, PaginationX, WhereBuilder } from '../../../common';
import { flatToTree } from '@/common/utils/tree.util';
import { PermissionTreeNodeDto } from '../permission';
import { CustomMenuItem } from './entities/app-type.entity';
import { Cacheable, CacheEvict } from '../../../cache/decorators/cache.decorator';
import { CacheTTL } from '../../../cache/constants/cache.constants';

/**
 * 应用类型服务
 */
@Injectable()
export class AppTypeService {
  constructor(
    @InjectRepository(AppType)
    private appTypeRepository: Repository<AppType>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    private dataSource: DataSource,
  ) {}

  /**
   * 创建应用类型
   * @param createAppTypeDto - 创建应用类型请求参数
   * @returns 创建的应用类型
   */
  @CacheEvict({ keys: ['sys:appType:allList'] })
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
  @Cacheable({ key: 'sys:appType:{#id}' })
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
  async findAll(query: QueryAppTypeDto): Promise<PaginationResult<any>> {
    const { typeName, typeCode, typeStatus } = query;
    const whereBuilder = new WhereBuilder();
    whereBuilder
      .like('appType.typeName', typeName)
      .like('appType.typeCode', typeCode)
      .eq('appType.typeStatus', typeStatus);

    const pager = new PaginationX(this.dataSource, query);
    return await pager
      .where('main', whereBuilder)
      .sql(({ select, wheres, orderBy, limit }) => {
        const whereClause = wheres?.main || '';
        return `SELECT ${select} FROM sys_app_types appType ${whereClause} ${orderBy} ${limit}`;
      })
      .select('appType.*')
      .defaultOrderBy('appType.sortOrder ASC')
      .getData();
  }

  /**
   * 查询所有应用类型
   * @returns 应用类型列表
   */
  @Cacheable({ key: 'sys:appType:allList', ttl: CacheTTL.MEDIUM })
  async findAllList(): Promise<any[]> {
    const appTypes = await this.appTypeRepository.find({
      order: {
        sortOrder: 'ASC'
      },
    });

    const appTypeIds = appTypes.map((t) => t.id);
    const countResults = appTypeIds.length > 0
      ? await this.roleRepository
          .createQueryBuilder('role')
          .select('role.appTypeId', 'appTypeId')
          .addSelect('COUNT(*)', 'count')
          .where('role.appTypeId IN (:...appTypeIds)', { appTypeIds })
          .andWhere('role.isBuiltin = 1')
          .groupBy('role.appTypeId')
          .getRawMany()
      : [];

    const countMap = new Map<string, number>();
    for (const row of countResults) {
      countMap.set(row.appTypeId, Number(row.count));
    }

    return appTypes.map((appType) => ({
      ...appType,
      builtinRoleCount: countMap.get(appType.id) || 0,
    }));
  }

  /**
   * 更新应用类型
   * @param id - 应用类型 ID
   * @param updateAppTypeDto - 更新应用类型请求参数
   * @returns 更新后的应用类型
   */
  @CacheEvict({ keys: ['sys:appType:{#id}', 'sys:appType:allList'] })
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
  @CacheEvict({ keys: ['sys:appType:{#id}', 'sys:appType:allList'] })
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
  @CacheEvict({ keys: 'sys:appType:{#id}' })
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
  @Cacheable({ key: 'sys:appType:permissionPool:{#appTypeId}', ttl: CacheTTL.LONG })
  async getPermissionPool(appTypeId: string): Promise<PermissionPoolResponseDto> {
    const appType = await this.appTypeRepository.findOne({
      where: { id: appTypeId },
    });

    if (!appType) {
      throw new NotFoundError('应用类型');
    }

    const rows: any[] = await this.dataSource.query(
      `SELECT
        p.id,
        p.permName,
        p.permCode,
        p.permDesc,
        p.permissionType,
        p.nodeType,
        p.parentId,
        p.routePath,
        p.externalUrl,
        p.iconName,
        p.sortOrder,
        p.isVisible,
        p.isCache,
        p.showMode,
        p.permStatus,
        p.isAutoSync,
        p.permissionValue AS parentPermissionValue,
        atp.permissionValue,
        IF(atp.permissionId IS NULL, 0, 1) checked
      FROM sys_permissions p
      LEFT JOIN sys_app_type_permissions atp ON atp.permissionId = p.id AND atp.appTypeId = ?
      WHERE p.deleteAt IS NULL
      ORDER BY p.sortOrder ASC`,
      [appTypeId],
    );

    const pcRows = rows.filter((r) => r.permissionType === PermissionType.PC);
    const normalRows = rows.filter((r) => r.permissionType === PermissionType.NORMAL);

    const pcTree = this.buildPermissionTreeFromRows(pcRows);
    const normalTree = this.buildPermissionTreeFromRows(normalRows);

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
  @CacheEvict({ keys: 'sys:appType:permissionPool:{#appTypeId}' })
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
    const allNodes: Array<{ id: string; checked: boolean; permissionValue?: string }> =
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
            permissionId: node.id,
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

  private buildPermissionTreeFromRows(rows: any[]): PermissionTreeNodeDto[] {
    const nodes = rows.map((row) => {
      const checked = row.checked == 1;
      return {
        ...row,
        checked,
        sortOrder: Number(row.sortOrder),
        isVisible: Number(row.isVisible),
        isCache: Number(row.isCache),
        permStatus: Number(row.permStatus),
        isAutoSync: row.isAutoSync != null ? Number(row.isAutoSync) : undefined,
        permissionValue: checked && row.permissionValue != null ? String(row.permissionValue) : undefined,
        parentPermissionValue: row.parentPermissionValue != null ? String(row.parentPermissionValue) : undefined,
      } as PermissionTreeNodeDto;
    });

    const tree = flatToTree(nodes as any[], { keepEmptyChildren: false }) as PermissionTreeNodeDto[];

    const sortTree = (items: PermissionTreeNodeDto[]) => {
      items.sort((a, b) => a.sortOrder - b.sortOrder);
      for (const item of items) {
        if (item.children?.length) sortTree(item.children);
      }
    };
    sortTree(tree);

    return tree;
  }

  /**
   * 获取自定义菜单
   */
  @Cacheable({ key: 'sys:appType:customMenu:{#appTypeId}', ttl: CacheTTL.LONG })
  async getCustomMenu(appTypeId: string): Promise<CustomMenuItem[] | null> {
    const appType = await this.appTypeRepository.findOne({ where: { id: appTypeId } });
    if (!appType) throw new NotFoundError('应用类型');
    return appType.customMenu || null;
  }

  /**
   * 保存自定义菜单
   */
  @CacheEvict({ keys: 'sys:appType:customMenu:{#appTypeId}' })
  async saveCustomMenu(appTypeId: string, data: CustomMenuItem[]): Promise<AppType> {
    const appType = await this.appTypeRepository.findOne({ where: { id: appTypeId } });
    if (!appType) throw new NotFoundError('应用类型');

    const permCodes = collectPermCodes(data);
    if (permCodes.length > 0) {
      const existing = await this.permissionRepository.find({
        where: { permCode: In(permCodes) },
        select: ['permCode'],
      });
      const existingCodes = new Set(existing.map(p => p.permCode));
      const missing = permCodes.filter(c => !existingCodes.has(c));
      if (missing.length > 0) {
        throw new BadRequestException(`权限编码不存在: ${missing.join(', ')}`);
      }
    }

    appType.customMenu = data;
    return this.appTypeRepository.save(appType);
  }

  /**
   * 清空自定义菜单
   */
  @CacheEvict({ keys: 'sys:appType:customMenu:{#appTypeId}' })
  async clearCustomMenu(appTypeId: string): Promise<AppType> {
    const appType = await this.appTypeRepository.findOne({ where: { id: appTypeId } });
    if (!appType) throw new NotFoundError('应用类型');
    appType.customMenu = null;
    return this.appTypeRepository.save(appType);
  }

  /**
   * 收集权限节点（递归）
   * @param nodes - 权限树节点列表
   * @param result - 收集结果
   */
  private collectPermissionNodes(
    nodes: Array<{ id: string; checked: boolean; permissionValue?: string; children?: any[] }>,
    result: Array<{ id: string; checked: boolean; permissionValue?: string }>,
  ): void {
    for (const node of nodes) {
      result.push({
        id: node.id,
        checked: node.checked,
        permissionValue: node.permissionValue,
      });

      if (node.children && node.children.length > 0) {
        this.collectPermissionNodes(node.children, result);
      }
    }
  }
}

/** 递归收集自定义菜单中所有 permCode */
function collectPermCodes(menus: CustomMenuItem[]): string[] {
  const codes: string[] = [];
  for (const item of menus) {
    codes.push(item.permCode);
    if (item.children?.length) {
      codes.push(...collectPermCodes(item.children));
    }
  }
  return codes;
}
