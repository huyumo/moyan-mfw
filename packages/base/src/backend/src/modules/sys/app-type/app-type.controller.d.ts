/**
 * @fileoverview 应用类型控制器
 * @description 处理应用类型相关 HTTP 请求
 */
import { AppTypeService } from './app-type.service';
import { CreateAppTypeDto, UpdateAppTypeDto, QueryAppTypeDto } from './dto';
import { UpdatePermissionPoolDto } from './dto/req/update-permission-pool.dto';
import { PermissionPoolResponseDto, UpdatePermissionPoolResponseDto } from './dto/res/permission-pool-response.dto';
import { StatusDto } from '@/common/types/status.dto';
/**
 * 应用类型控制器
 * @description 处理应用类型相关的 CRUD 请求
 */
export declare class AppTypeController {
    private appTypeService;
    constructor(appTypeService: AppTypeService);
    /**
     * 创建应用类型
     */
    create(createAppTypeDto: CreateAppTypeDto): Promise<import("../../../common").ApiResponse<import("./entities/app-type.entity").AppType>>;
    /**
     * 查询应用类型列表
     */
    findAll(query: QueryAppTypeDto): Promise<import("../../../common").ApiResponse<import("../../../common").PaginationResult<any>>>;
    /**
     * 查询所有应用类型
     */
    findAllList(): Promise<import("../../../common").ApiResponse<any[]>>;
    /**
     * 根据 ID 查询应用类型
     */
    findById(id: string): Promise<import("../../../common").ApiResponse<import("./entities/app-type.entity").AppType>>;
    /**
     * 获取权限池配置
     */
    getPermissionPool(appTypeId: string): Promise<import("../../../common").ApiResponse<PermissionPoolResponseDto>>;
    /**
     * 更新权限池配置
     */
    updatePermissionPool(appTypeId: string, updateDto: UpdatePermissionPoolDto): Promise<import("../../../common").ApiResponse<UpdatePermissionPoolResponseDto>>;
    /**
     * 更新应用类型
     */
    update(id: string, updateAppTypeDto: UpdateAppTypeDto): Promise<import("../../../common").ApiResponse<import("./entities/app-type.entity").AppType>>;
    /**
     * 删除应用类型
     */
    delete(id: string): Promise<import("../../../common").ApiResponse<null>>;
    /**
     * 更新应用类型状态
     */
    updateStatus(id: string, body: StatusDto): Promise<import("../../../common").ApiResponse<import("./entities/app-type.entity").AppType>>;
}
