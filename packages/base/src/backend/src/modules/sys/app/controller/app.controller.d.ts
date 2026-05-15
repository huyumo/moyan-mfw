/**
 * @fileoverview 应用控制器
 * @description 处理应用实例相关 HTTP 请求
 */
import { AppService } from '../service/app.service';
import { CreateAppDto, UpdateAppDto, QueryAppDto } from '../dto';
/**
 * 应用控制器
 * @description 处理应用实例相关的 CRUD 请求
 */
export declare class AppController {
    private appService;
    constructor(appService: AppService);
    /**
     * 创建应用实例
     */
    create(createAppDto: CreateAppDto): Promise<import("../../../../common").ApiResponse<import("../entities/app.entity").App>>;
    /**
     * 查询应用实例列表
     */
    findAll(query: QueryAppDto): Promise<import("../../../../common").ApiResponse<import("../../../../common").PaginationResult<any>>>;
    /**
     * 根据 ID 查询应用实例
     */
    findById(id: string): Promise<import("../../../../common").ApiResponse<any>>;
    /**
     * 更新应用实例
     */
    update(id: string, updateAppDto: UpdateAppDto): Promise<import("../../../../common").ApiResponse<import("../entities/app.entity").App>>;
    /**
     * 删除应用实例
     */
    delete(id: string): Promise<import("../../../../common").ApiResponse<null>>;
    /**
     * 变更负责人
     */
    changeOwner(id: string, ownerId: string): Promise<import("../../../../common").ApiResponse<import("../entities/app.entity").App>>;
    /**
     * 更新应用实例状态
     */
    updateStatus(id: string, status: number): Promise<import("../../../../common").ApiResponse<import("../entities/app.entity").App>>;
}
