/**
 * @fileoverview 角色控制器
 * @description 处理角色相关 HTTP 请求
 */
import { RoleService } from './role.service';
import { CreateRoleDto, UpdateRoleDto, AssignPermissionsDto, QueryRoleDto, RolePermissionResponseDto } from './dto';
/**
 * 角色控制器
 * @description 处理角色相关的 CRUD 请求
 */
export declare class RoleController {
    private roleService;
    constructor(roleService: RoleService);
    /**
     * 创建角色
     */
    create(createRoleDto: CreateRoleDto): Promise<import("../../../common").ApiResponse<import(".").Role>>;
    /**
     * 查询角色列表
     */
    findAll(query: QueryRoleDto): Promise<import("../../../common").ApiResponse<import("../../../common").PaginationResult<any>>>;
    /**
     * 根据 ID 查询角色
     */
    findById(id: string): Promise<import("../../../common").ApiResponse<import(".").Role>>;
    /**
     * 更新角色
     */
    update(id: string, updateRoleDto: UpdateRoleDto): Promise<import("../../../common").ApiResponse<import(".").Role>>;
    /**
     * 删除角色
     */
    delete(id: string): Promise<import("../../../common").ApiResponse<null>>;
    /**
     * 为角色分配权限
     */
    assignPermissions(id: string, assignPermissionsDto: AssignPermissionsDto): Promise<import("../../../common").ApiResponse<null>>;
    /**
     * 获取角色的权限列表
     */
    getRolePermissions(id: string): Promise<import("../../../common").ApiResponse<RolePermissionResponseDto>>;
}
