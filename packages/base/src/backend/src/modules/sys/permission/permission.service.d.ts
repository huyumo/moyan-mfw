/**
 * @fileoverview 权限服务
 * @description 处理权限相关业务逻辑
 */
import { Repository, DataSource } from 'typeorm';
import { Permission } from './entities/permission.entity';
import { CreatePermissionDto, UpdatePermissionDto, QueryPermissionDto } from './dto';
import { RouteNodeDto, PermissionTreeNodeDto } from './dto';
import { PaginationResult } from '../../../common';
/**
 * 权限服务
 */
export declare class PermissionService {
    private permissionRepository;
    private dataSource;
    constructor(permissionRepository: Repository<Permission>, dataSource: DataSource);
    /**
     * 创建权限
     * @param createPermissionDto - 创建权限请求参数
     * @returns 创建的权限
     */
    create(createPermissionDto: CreatePermissionDto): Promise<Permission>;
    /**
     * 根据 ID 查询权限
     * @param id - 权限 ID
     * @returns 权限信息
     */
    findById(id: string): Promise<Permission>;
    /**
     * 查询权限列表（分页）
     * @param query - 查询参数
     * @returns 分页结果
     */
    findAll(query: QueryPermissionDto): Promise<PaginationResult<any>>;
    /**
     * 查询所有权限（树形结构，带 children）
     * @param permissionType - 权限类型筛选（可选）
     * @returns 树形权限列表
     */
    findAllTreeWithChildren(permissionType?: string): Promise<PermissionTreeNodeDto[]>;
    /**
     * 获取权限树（带 children）
     * @param parentId - 父权限 ID（可选）
     * @returns 权限树
     */
    getPermissionTreeWithChildren(parentId?: string): Promise<PermissionTreeNodeDto[]>;
    /**
     * 将扁平列表转换为树形结构
     * @param permissions - 权限列表
     * @param rootParentId - 根节点父 ID
     * @returns 树形结构
     */
    private buildTree;
    /**
     * 查询所有权限（树形结构）
     * @returns 树形权限列表
     */
    findAllTree(): Promise<Permission[]>;
    /**
     * 更新权限
     * @param id - 权限 ID
     * @param updatePermissionDto - 更新权限请求参数
     * @returns 更新后的权限
     */
    update(id: string, updatePermissionDto: UpdatePermissionDto): Promise<Permission>;
    /**
     * 删除权限（级联删除子节点）
     * @param id - 权限 ID
     */
    delete(id: string): Promise<void>;
    /**
     * 递归删除子权限
     * @param parentId - 父权限 ID
     */
    private deleteChildren;
    /**
     * 获取权限树
     * @param parentId - 父权限 ID（可选）
     * @returns 权限树
     */
    getPermissionTree(parentId?: string): Promise<Permission[]>;
    /**
     * 批量创建权限
     * @param permissions - 权限列表
     * @returns 创建的权限列表
     */
    batchCreate(permissions: CreatePermissionDto[]): Promise<Permission[]>;
    /**
     * 同步路由到权限表
     * @description 将前端路由同步为 PC 权限节点，存储到 Permission 表（全局）
     * 简化流程：清理旧同步数据 → 同步新数据 → 返回最新权限树
     * @param routes - 路由列表（树形结构）
     * @returns 最新权限树
     */
    syncPermissions(routes: RouteNodeDto[]): Promise<PermissionTreeNodeDto[]>;
    /**
     * 清理旧的自动同步数据
     * 删除所有 isAutoSync=1 的 PC 权限（保留 pc_root 和 isAutoSync=0 的权限）
     */
    private clearAutoSyncPermissions;
    /**
     * 确保 PC 根节点存在
     */
    private ensurePcRoot;
    /**
     * 扁平化路由（树形 → 数组）
     * 按路径深度排序，确保父节点先处理
     */
    private flattenRoutes;
    /**
     * 同步单个路由节点
     * @param route - 路由节点
     * @param allRoutePaths - 所有路由路径集合（用于判断 nodeType）
     */
    private syncRouteNode;
    /**
     * 生成权限编码（严格按照树结构）
     * @param path - 路由路径
     * @returns 权限编码（格式：pc_root:path:to:route）
     */
    private generatePermCode;
}
