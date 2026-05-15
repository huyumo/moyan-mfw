/**
 * @fileoverview 应用类型服务
 * @description 处理应用类型相关业务逻辑
 */
import { Repository, DataSource } from 'typeorm';
import { AppType } from './entities/app-type.entity';
import { Role } from '../role/entities/role.entity';
import { CreateAppTypeDto, UpdateAppTypeDto, QueryAppTypeDto } from './dto';
import { UpdatePermissionPoolDto } from './dto/req/update-permission-pool.dto';
import { PermissionPoolResponseDto, UpdatePermissionPoolResponseDto } from './dto/res/permission-pool-response.dto';
import { PaginationResult } from '../../../common';
/**
 * 应用类型服务
 */
export declare class AppTypeService {
    private appTypeRepository;
    private roleRepository;
    private dataSource;
    constructor(appTypeRepository: Repository<AppType>, roleRepository: Repository<Role>, dataSource: DataSource);
    /**
     * 创建应用类型
     * @param createAppTypeDto - 创建应用类型请求参数
     * @returns 创建的应用类型
     */
    create(createAppTypeDto: CreateAppTypeDto): Promise<AppType>;
    /**
     * 根据 ID 查询应用类型
     * @param id - 应用类型 ID
     * @returns 应用类型信息
     */
    findById(id: string): Promise<AppType>;
    /**
     * 查询应用类型列表（分页）
     * @param query - 查询参数
     * @returns 分页结果
     */
    findAll(query: QueryAppTypeDto): Promise<PaginationResult<any>>;
    /**
     * 查询所有应用类型
     * @returns 应用类型列表
     */
    findAllList(): Promise<any[]>;
    /**
     * 更新应用类型
     * @param id - 应用类型 ID
     * @param updateAppTypeDto - 更新应用类型请求参数
     * @returns 更新后的应用类型
     */
    update(id: string, updateAppTypeDto: UpdateAppTypeDto): Promise<AppType>;
    /**
     * 删除应用类型
     * @param id - 应用类型 ID
     */
    delete(id: string): Promise<void>;
    /**
     * 更新应用类型状态
     * @param id - 应用类型 ID
     * @param status - 新状态
     * @returns 更新后的应用类型
     */
    updateStatus(id: string, status: number): Promise<AppType>;
    /**
     * 获取权限池配置
     * @param appTypeId - 应用类型 ID
     * @returns 权限池配置
     */
    getPermissionPool(appTypeId: string): Promise<PermissionPoolResponseDto>;
    /**
     * 更新权限池配置
     * @param appTypeId - 应用类型 ID
     * @param updateDto - 更新权限池请求
     * @returns 更新结果
     */
    updatePermissionPool(appTypeId: string, updateDto: UpdatePermissionPoolDto): Promise<UpdatePermissionPoolResponseDto>;
    private buildPermissionTreeFromRows;
    /**
     * 收集权限节点（递归）
     * @param nodes - 权限树节点列表
     * @param result - 收集结果
     */
    private collectPermissionNodes;
}
