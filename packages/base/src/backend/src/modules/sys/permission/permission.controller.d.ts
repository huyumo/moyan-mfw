/**
 * @fileoverview 权限控制器
 * @description 处理权限相关 HTTP 请求
 */
import { PermissionService } from './permission.service';
import { CreatePermissionDto, UpdatePermissionDto, QueryPermissionDto } from './dto';
import { SyncPermissionDto, PermissionTreeNodeDto } from './dto';
/**
 * 权限控制器
 * @description 处理权限相关的 CRUD 请求
 */
export declare class PermissionController {
    private permissionService;
    constructor(permissionService: PermissionService);
    /**
     * 创建权限
     */
    create(createPermissionDto: CreatePermissionDto): Promise<import("../../../common").ApiResponse<import(".").Permission>>;
    /**
     * 查询权限列表
     */
    findAll(query: QueryPermissionDto): Promise<import("../../../common").ApiResponse<import("../../../common").PaginationResult<any>>>;
    /**
     * 查询所有权限（树形结构）
     */
    findAllTree(permissionType?: string): Promise<import("../../../common").ApiResponse<PermissionTreeNodeDto[]>>;
    /**
     * 获取权限树
     */
    getPermissionTree(parentId?: string): Promise<import("../../../common").ApiResponse<PermissionTreeNodeDto[]>>;
    /**
     * 根据 ID 查询权限
     */
    findById(id: string): Promise<import("../../../common").ApiResponse<import(".").Permission>>;
    /**
     * 更新权限
     */
    update(id: string, updatePermissionDto: UpdatePermissionDto): Promise<import("../../../common").ApiResponse<import(".").Permission>>;
    /**
     * 删除权限
     */
    delete(id: string): Promise<import("../../../common").ApiResponse<null>>;
    /**
     * 批量创建权限
     */
    batchCreate(permissions: CreatePermissionDto[]): Promise<import("../../../common").ApiResponse<import(".").Permission[]>>;
    /**
     * 同步路由到权限表
     */
    syncPermissions(syncDto: SyncPermissionDto): Promise<import("../../../common").ApiResponse<PermissionTreeNodeDto[]>>;
}
