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
import { Permission, PermissionType } from '../permission/entities/permission.entity';
import { AppTypePermissionEntity } from '../app-type/entities/app-type-permission.entity';
import { CreateRoleDto, UpdateRoleDto } from './dto';
import {
  RolePermissionResponseDto,
  RolePermissionTreeNodeDto,
} from './dto/res/role-permission-response.dto';
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
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(AppTypePermissionEntity)
    private appTypePermissionRepository: Repository<AppTypePermissionEntity>,
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
    permissions: Array<{ permissionId: string; permissionValue: bigint }>,
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

  /**
   * 获取角色的权限树配置
   * @param roleId - 角色 ID
   * @returns 角色权限树配置
   */
  async getRolePermissionTree(roleId: string): Promise<RolePermissionResponseDto> {
    // 验证角色存在
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundError('角色');
    }

    // 获取角色关联的 appTypeId
    const appTypeId = role.appTypeId;

    // 如果角色没有关联应用类型，返回空树
    if (!appTypeId) {
      return {
        roleId,
        permissionTrees: {
          pcTree: [],
          normalTree: [],
        },
      };
    }

    // 获取所有权限
    const allPermissions = await this.permissionRepository.find({
      order: { sortOrder: 'ASC' },
    });

    // 获取权限池配置（通过 appTypeId）
    const poolPermissions = await this.appTypePermissionRepository.find({
      where: { appTypeId },
    });

    // 构建权限池 Map（permissionId -> permissionValue）
    const poolMap = new Map<string, bigint>();
    for (const pool of poolPermissions) {
      poolMap.set(pool.permissionId, pool.permissionValue);
    }

    // 获取角色已分配的权限
    const rolePermissions = await this.rolePermissionRepository.find({
      where: { roleId },
    });

    // 构建角色权限 Map（permissionId -> permissionValue）
    const rolePermMap = new Map<string, bigint>();
    for (const rp of rolePermissions) {
      rolePermMap.set(rp.permissionId, rp.permissionValue);
    }

    // 构建权限树（仅包含权限池中的权限）
    const pcTree = this.buildRolePermissionTree(
      allPermissions.filter((p) => p.permissionType === PermissionType.PC),
      poolMap,
      rolePermMap,
    );
    const normalTree = this.buildRolePermissionTree(
      allPermissions.filter((p) => p.permissionType === PermissionType.NORMAL),
      poolMap,
      rolePermMap,
    );

    return {
      roleId,
      permissionTrees: {
        pcTree,
        normalTree,
      },
    };
  }

  /**
   * 构建角色权限树
   * @param permissions - 权限列表
   * @param poolMap - 权限池 Map（permissionId -> permissionValue）
   * @param rolePermMap - 角色权限 Map（permissionId -> permissionValue）
   * @returns 角色权限树
   */
  private buildRolePermissionTree(
    permissions: Permission[],
    poolMap: Map<string, bigint>,
    rolePermMap: Map<string, bigint>,
  ): RolePermissionTreeNodeDto[] {
    // 构建 ID -> Permission Map
    const permMap = new Map<string, Permission>();
    for (const perm of permissions) {
      permMap.set(perm.id, perm);
    }

    // 找出根节点（parentId 为空或 null）
    const roots = permissions.filter((p) => !p.parentId);

    // 递归构建树
    return roots.map((root) => this.buildRoleTreeNode(root, permMap, poolMap, rolePermMap));
  }

  /**
   * 构建单个角色权限树节点
   * @param permission - 权限实体
   * @param permMap - 权限 Map
   * @param poolMap - 权限池 Map
   * @param rolePermMap - 角色权限 Map
   * @returns 树节点
   */
  private buildRoleTreeNode(
    permission: Permission,
    permMap: Map<string, Permission>,
    poolMap: Map<string, bigint>,
    rolePermMap: Map<string, bigint>,
  ): RolePermissionTreeNodeDto {
    // 检查是否在权限池中
    const inPool = poolMap.has(permission.id);

    // 检查是否已分配给角色（checked = 在权限池中且已分配）
    const checked = inPool && rolePermMap.has(permission.id);
    const rolePermValue = rolePermMap.get(permission.id);

    // 获取父权限的权限值（角色权限场景：权限池配置的 permissionValue）
    let parentPermissionValue: string | undefined;
    if (permission.parentId) {
      // 父权限在权限池中的 permissionValue
      const parentPoolValue = poolMap.get(permission.parentId);
      if (parentPoolValue !== undefined) {
        parentPermissionValue = parentPoolValue.toString();
      }
    }

    // 构建节点（仅包含权限池中的权限）
    const node: RolePermissionTreeNodeDto = {
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
      // permissionValue 在角色已分配此权限时有效（bigint 序列化为字符串）
      permissionValue: checked && rolePermValue !== undefined ? rolePermValue.toString() : undefined,
      // parentPermissionValue 父权限在权限池中的权限值
      parentPermissionValue,
    };

    // 找出子节点（仅包含权限池中的权限）
    const children = Array.from(permMap.values())
      .filter((p) => p.parentId === permission.id && poolMap.has(p.id))
      .sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder))
      .map((child) => this.buildRoleTreeNode(child, permMap, poolMap, rolePermMap));

    if (children.length > 0) {
      node.children = children;
    }

    return node;
  }
}
