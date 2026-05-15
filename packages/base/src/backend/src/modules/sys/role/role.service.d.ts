/**
 * @fileoverview 角色服务
 * @description 处理角色相关业务逻辑
 */
import { Repository, EntityManager } from 'typeorm';
import { Role } from './entities/role.entity';
import { RolePermission } from './entities/role-permission.entity';
import { AssignPermissionsDto, CreateRoleDto, UpdateRoleDto, QueryRoleDto } from './dto';
import { RolePermissionResponseDto } from './dto/res/role-permission-response.dto';
import { PaginationResult } from '../../../common';
/**
 * 角色服务
 */
export declare class RoleService {
    private entityManager;
    private roleRepository;
    private rolePermissionRepository;
    constructor(entityManager: EntityManager, roleRepository: Repository<Role>, rolePermissionRepository: Repository<RolePermission>);
    /**
     * 创建角色
     * @param createRoleDto - 创建角色请求参数
     * @returns 创建的角色
     */
    create(createRoleDto: CreateRoleDto): Promise<Role>;
    /**
     * 根据 ID 查询角色
     * @param id - 角色 ID
     * @returns 角色信息
     */
    findById(id: string): Promise<Role>;
    /**
     * 查询角色列表（分页）
     * @param query - 查询参数
     * @returns 分页结果
     */
    findAll(query: QueryRoleDto): Promise<PaginationResult<any>>;
    /**
     * 更新角色
     * @param id - 角色 ID
     * @param updateRoleDto - 更新角色请求参数
     * @returns 更新后的角色
     */
    update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role>;
    /**
     * 删除角色
     * @param id - 角色 ID
     */
    delete(id: string): Promise<void>;
    /**
     * 收集权限节点（递归）
     * @param nodes - 权限树节点列表
     * @param result - 收集结果
     */
    private collectPermissionNodes;
    /**
     * 为角色分配权限
     * @param roleId - 角色 ID
     * @param permissions - 权限列表
     */
    assignPermissions(roleId: string, assignPermissionsDto: AssignPermissionsDto): Promise<void>;
    /**
     * 获取角色的权限列表
     * @param roleId - 角色 ID
     * @returns 角色权限列表
     */
    getRolePermissions(roleId: string): Promise<RolePermission[]>;
    /**
     * 获取角色的权限树配置
     * @param roleId - 角色 ID
     * @returns 角色权限树配置
     */
    getRolePermissionTree(roleId: string): Promise<RolePermissionResponseDto>;
    private buildPermissionTreeFromRows;
}
