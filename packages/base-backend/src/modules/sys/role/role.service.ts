/**
 * @fileoverview 角色服务
 * @description 处理角色相关业务逻辑
 */

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager, Equal } from 'typeorm';
import { Role } from './entities/role.entity';
import { RolePermission } from './entities/role-permission.entity';
import { UserRole } from './entities/user-role.entity';
import { Permission, PermissionType } from '../permission/entities/permission.entity';
import { AppTypePermissionEntity } from '../app-type/entities/app-type-permission.entity';
import { AssignPermissionsDto, CreateRoleDto, UpdateRoleDto } from './dto';
import {
  RolePermissionResponseDto,
} from './dto/res/role-permission-response.dto';
import { NotFoundError } from '../../../common/exceptions/not-found.exception';
import { AppTypeService } from '../app-type';
import { PermissionTreeNodeDto } from '../permission';

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
    @InjectRepository(UserRole)
    private userRepository: Repository<UserRole>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(AppTypePermissionEntity)
    private appTypePermissionRepository: Repository<AppTypePermissionEntity>,
    private dataSource: DataSource,
    private appTypeService: AppTypeService,
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
    assignPermissionsDto: AssignPermissionsDto,
  ): Promise<void> {
    return this.entityManager.transaction(async (manager) => {

      // 删除角色所有权限
      await manager.delete(RolePermission, { roleId });






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
    // 验证角色存在
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundError('角色');
    }

    // 权限池数据
    const permissionPool = await this.appTypeService.getPermissionPool(role.appTypeId);
    // 已选中的角色权限
    const rolePermissions = await  this.rolePermissionRepository.find({where:{roleId:Equal(roleId)}})

    const pcTree = this.buildRolePermissions(
      permissionPool.permissionTrees.pcTree,
      rolePermissions,
    );
    const normalTree = this.buildRolePermissions(
      permissionPool.permissionTrees.normalTree,
      rolePermissions,
    );

    return {
      roleId,
      permissionTrees: {
        pcTree,
        normalTree,
      },
    };
  }

  private buildRolePermissions(
    tree: PermissionTreeNodeDto[],
    rolePermissions: RolePermission[],
  ): PermissionTreeNodeDto[] {

    const filter = (arr: PermissionTreeNodeDto[]) => {
      return arr.filter((item) => {
        if (item.children?.length) {
          item.children = filter(item.children);
        }
        return item.checked || (item.children && item.children.length > 0);
      })
    }
    const filteredTree = filter(tree);
    console.log(rolePermissions.map((perm) => perm.permissionId));
    
    const newTree = filteredTree.map((item) => {
      if (item.children) {
        item.children = this.buildRolePermissions(item.children, rolePermissions);
      }
      item.checked = rolePermissions.some((perm) => perm.permissionId === item.id);
      return item;
    });
    return newTree;
  }

}
