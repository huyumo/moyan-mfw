/**
 * @fileoverview 初始化控制器
 * @description 提供系统初始化相关 API 接口
 */
import { InstallService } from './install.service';
import { InitRequestDto } from './dto/init-request.dto';
import { InitResponseDto, InitStatusResponseDto } from './dto/init-response.dto';
/**
 * 初始化控制器
 */
export declare class InstallController {
    private readonly installService;
    constructor(installService: InstallService);
    /**
     * 检查系统是否已初始化
     * @returns 初始化状态
     */
    getStatus(): Promise<InitStatusResponseDto>;
    /**
     * 执行系统初始化
     * @param initData 初始化数据
     * @returns 初始化结果
     */
    initialize(initData: InitRequestDto): Promise<InitResponseDto>;
}
