/**
 * @fileoverview 健康检查控制器
 * @description 提供服务健康检查接口
 */
import { DataSource } from 'typeorm';
/**
 * 健康检查响应 DTO
 */
interface HealthCheckResponse {
    status: 'ok' | 'error';
    timestamp: string;
    uptime: number;
    database: {
        status: 'connected' | 'disconnected';
        latency?: number;
    };
    memory: {
        heapUsed: number;
        heapTotal: number;
        rss: number;
    };
}
/**
 * 健康检查控制器
 * @description 提供服务健康状态检查接口
 */
export declare class HealthController {
    private dataSource;
    private startTime;
    constructor(dataSource: DataSource);
    /**
     * 健康检查
     * @returns 服务健康状态
     */
    healthCheck(): Promise<HealthCheckResponse>;
    /**
     * 就绪检查
     * @returns 服务是否就绪
     */
    readyCheck(): Promise<{
        ready: boolean;
    }>;
    /**
     * 存活检查
     * @returns 服务是否存活
     */
    liveCheck(): Promise<{
        alive: boolean;
    }>;
}
export {};
