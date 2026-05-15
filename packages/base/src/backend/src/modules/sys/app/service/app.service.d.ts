/**
 * @fileoverview 应用服务
 * @description 处理应用实例相关业务逻辑
 */
import { Repository, DataSource } from 'typeorm';
import { App } from '../entities/app.entity';
import { CreateAppDto, UpdateAppDto, QueryAppDto } from '../dto';
import { PaginationResult } from '../../../../common';
/**
 * 应用服务
 */
export declare class AppService {
    private appRepository;
    private dataSource;
    constructor(appRepository: Repository<App>, dataSource: DataSource);
    /**
     * 创建应用实例
     * @param createAppDto - 创建应用实例请求参数
     * @returns 创建的应用实例
     */
    create(createAppDto: CreateAppDto): Promise<App>;
    /**
     * 根据 ID 查询应用实例
     * @param id - 应用实例 ID
     * @returns 应用实例信息
     */
    findById(id: string): Promise<any>;
    /**
     * 查询应用实例列表（分页）
     * @param query - 查询参数
     * @returns 分页结果
     */
    findAll(query: QueryAppDto): Promise<PaginationResult<any>>;
    /**
     * 更新应用实例
     * @param id - 应用实例 ID
     * @param updateAppDto - 更新应用实例请求参数
     * @returns 更新后的应用实例
     */
    update(id: string, updateAppDto: UpdateAppDto): Promise<App>;
    /**
     * 删除应用实例
     * @param id - 应用实例 ID
     */
    delete(id: string): Promise<void>;
    /**
     * 变更负责人
     * @description 完整移交应用所有权：移除原拥有者的成员身份和角色，为新拥有者分配拥有者权限
     * @param id - 应用实例 ID
     * @param ownerId - 新负责人 ID
     * @returns 更新后的应用实例
     */
    changeOwner(id: string, ownerId: string): Promise<App>;
    /**
     * 更新应用实例状态
     * @param id - 应用实例 ID
     * @param status - 新状态
     * @returns 更新后的应用实例
     */
    updateStatus(id: string, status: number): Promise<App>;
}
