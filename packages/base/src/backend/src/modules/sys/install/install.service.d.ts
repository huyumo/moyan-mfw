/**
 * @fileoverview 初始化服务
 * @description 提供系统初始化检测和初始化执行功能
 */
import { DataSource, Repository } from 'typeorm';
import { AppType } from '../app-type/entities/app-type.entity';
import { InitResponseDto } from './dto/init-response.dto';
/**
 * 初始化服务
 */
export declare class InstallService {
    private appTypeRepository;
    private dataSource;
    constructor(appTypeRepository: Repository<AppType>, dataSource: DataSource);
    /**
     * 检查系统是否已初始化
     * @returns 是否已初始化
     */
    isInitialized(): Promise<boolean>;
    /**
     * 执行初始化
     * @param initData 初始化数据
     * @returns 初始化结果
     */
    initialize(initData: {
        adminPassword: string;
    }): Promise<InitResponseDto>;
}
