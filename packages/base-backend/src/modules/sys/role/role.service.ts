/**
 * @fileoverview 角色服务
 * @description 处理角色相关业务逻辑
 */

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { Role } from './entities/role.entity';
import { RolePermission } from './entities/role-permission.entity';
import { UserRole } from './entities/user-role.entity';
import { PermissionType } from '../permission/entities/permission.entity';
import { AssignPermissionsDto, CreateRoleDto, UpdateRoleDto, QueryRoleDto } from './dto';
import {
  RolePermissionResponseDto,
} from './dto/res/role-permission-response.dto';
import { NotFoundError } from '../../../common/exceptions/not-found.exception';
import { PermissionTreeNodeDto } from '../permission';
import { PaginationResult, PaginationX, WhereBuilder } from '../../../common';
import { flatToTree } from '@/common/utils/tree.util';
import { App } from '../app/entities/app.entity';

/**
 * 角色服务
 */
@Injectable()
export class RoleService {
  constructor(
    @InjectEntityManager()
    private entityManager: EntityManager,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
  ) { }

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
   * @returns 分页结果
   */
  async findAll(query: QueryRoleDto): Promise<PaginationResult<any>> {
    let { roleCode, roleName, roleStatus, appId, appTypeId } = query;

    let isBuiltin: number | undefined;
    if (appId) appTypeId = undefined
    if (appTypeId) isBuiltin = 1

    const whereBuilder = new WhereBuilder();
    whereBuilder
      .like('role.roleCode', roleCode)
      .like('role.roleName', roleName)
      .eq('role.roleStatus', roleStatus)
      .eq('role.isBuiltin', isBuiltin);

    const pager = new PaginationX(this.entityManager.connection, query);
    return await pager
      .where('main', whereBuilder)
      .unshiftSql({
        tag: 'appType',
        sql: `SELECT @appTypeId := appTypeId FROM sys_apps WHERE id = '${appId}'`,
        isGetOne: true,
      })
      .sql(({ select, wheres, orderBy, limit }) => {
        const whereClause = wheres?.main || '';
        return `
          SELECT ${select} FROM sys_roles role
          LEFT JOIN sys_apps sa ON sa.appTypeId = role.appTypeId
          WHERE role.appTypeId = IFNULL(@appTypeId,'${appTypeId}')
          ${whereClause.replace('WHERE', 'AND')}
          ${orderBy}
          ${limit}
        `;
      })
      .select('role.*')
      .printSql()
      .defaultOrderBy('role.sortOrder ASC, role.createdAt DESC')
      .getData();
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
   * 收集权限节点（递归）
   * @param nodes - 权限树节点列表
   * @param result - 收集结果
   */
  private collectPermissionNodes(
    nodes: Array<{ id: string; checked: boolean; permissionValue?: string; children?: any[] }>,
    result: Array<{ id: string; checked: boolean; permissionValue?: string }>,
  ): void {
    for (const node of nodes) {
      node.checked && result.push({
        id: node.id,
        checked: node.checked,
        permissionValue: node.permissionValue,
      });

      if (node.children && node.children.length > 0) {
        this.collectPermissionNodes(node.children, result);
      }
    }
  }
  /**
   * 为角色分配权限
   * @param roleId - 角色 ID
   * @param permissions - 权限列表
   */
  async assignPermissions(
    roleId: string,
    assignPermissionsDto: AssignPermissionsDto,
  ): Promise<void> {
    return this.entityManager.transaction(async (manager) => {

      // 删除角色所有权限
      await manager.delete(RolePermission, { roleId });

      // 收集所有待处理的权限节点
      const allNodes: Array<{ id: string; checked: boolean; permissionValue?: string }> =
        [];
      this.collectPermissionNodes(assignPermissionsDto.permissionTrees.pcTree, allNodes);
      this.collectPermissionNodes(assignPermissionsDto.permissionTrees.normalTree, allNodes);
      const datas = allNodes.map((item) => {
        return manager.create(RolePermission, {
          roleId,
          permissionId: item.id,
          permissionValue: item.permissionValue ? BigInt(item.permissionValue) : 0n,
        })
      })
      console.log(datas);

      await manager.save(datas);
    });
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

  /**
   * 获取角色的权限树配置
   * @param roleId - 角色 ID
   * @returns 角色权限树配置
   */
  async getRolePermissionTree(roleId: string): Promise<RolePermissionResponseDto> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundError('角色');
    }

    const rows: any[] = await this.entityManager.query(
      `WITH 
      pond AS(
        SELECT 
          p.id,
          p.permName,
          p.permCode,
          p.permissionType,
          p.nodeType,
          p.parentId,
          p.routePath,
          p.externalUrl,
          p.iconName,
          p.sortOrder,
          p.isCache,
          p.showMode,
          atp.permissionValue AS parentPermissionValue,
          atp.appTypeId
        FROM sys_app_type_permissions atp
        INNER JOIN sys_permissions p ON atp.permissionId = p.id
        LEFT JOIN sys_roles r ON r.appTypeId = atp.appTypeId
        WHERE r.id = ?
      )
      SELECT 
        pond.*,
        IFNULL(rp.permissionValue,0) permissionValue,
        IF(rp.permissionId IS NULL,false,true) checked
      FROM pond
      LEFT JOIN sys_role_permissions rp ON rp.permissionId = pond.id AND rp.roleId = ?`,
      [roleId, roleId],
    );

    const pcRows = rows.filter((r) => r.permissionType === PermissionType.PC);
    const normalRows = rows.filter((r) => r.permissionType === PermissionType.NORMAL);
    const pcTree = this.buildPermissionTreeFromRows(pcRows);
    const normalTree = this.buildPermissionTreeFromRows(normalRows);
    return {
      roleId,
      permissionTrees: {
        pcTree,
        normalTree,
      },
    };
  }

  private buildPermissionTreeFromRows(rows: any[]): PermissionTreeNodeDto[] {
    const nodes = rows.map((row) => {
      const { appTypeId, ...rest } = row;
      return {
        ...rest,
        sortOrder: Number(row.sortOrder),
        isVisible: Number(row.isVisible),
        isCache: Number(row.isCache),
        permStatus: Number(row.permStatus),
        isAutoSync: row.isAutoSync != null ? Number(row.isAutoSync) : undefined,
        checked: row.checked == 1,
        permissionValue: row.permissionValue != null ? String(row.permissionValue) : undefined,
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

}
