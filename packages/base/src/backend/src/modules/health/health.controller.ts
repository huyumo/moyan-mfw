/**
 * @fileoverview 健康检查控制器
 * @description 提供服务健康检查接口
 */

import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Public } from '../../../common/decorators/public.decorator';
import { ApiResponseUtil } from '../../../common/types/api.types';

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
@ApiTags('health', '健康检查接口')
@Controller('health')
export class HealthController {
  private startTime = Date.now();

  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  /**
   * 健康检查
   * @returns 服务健康状态
   */
  @Public()
  @Get()
  @ApiOperation({
    summary: '健康检查',
    description: '检查服务运行状态、数据库连接状态和内存使用情况',
  })
  @ApiResponse({
    status: 200,
    description: '服务健康',
  })
  async healthCheck(): Promise<HealthCheckResponse> {
    const memoryUsage = process.memoryUsage();
    let dbStatus: 'connected' | 'disconnected' = 'disconnected';
    let dbLatency: number | undefined;

    // 检查数据库连接
    try {
      const start = Date.now();
      await this.dataSource.query('SELECT 1');
      dbLatency = Date.now() - start;
      dbStatus = 'connected';
    } catch {
      dbStatus = 'disconnected';
    }

    return {
      status: dbStatus === 'connected' ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      database: {
        status: dbStatus,
        latency: dbLatency,
      },
      memory: {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        rss: memoryUsage.rss,
      },
    };
  }

  /**
   * 就绪检查
   * @returns 服务是否就绪
   */
  @Public()
  @Get('ready')
  @ApiOperation({
    summary: '就绪检查',
    description: '检查服务是否已准备好接收请求',
  })
  @ApiResponse({
    status: 200,
    description: '服务就绪',
  })
  @ApiResponse({
    status: 503,
    description: '服务未就绪',
  })
  async readyCheck(): Promise<{ ready: boolean }> {
    try {
      await this.dataSource.query('SELECT 1');
      return { ready: true };
    } catch {
      return { ready: false };
    }
  }

  /**
   * 存活检查
   * @returns 服务是否存活
   */
  @Public()
  @Get('live')
  @ApiOperation({
    summary: '存活检查',
    description: '检查服务进程是否存活',
  })
  @ApiResponse({
    status: 200,
    description: '服务存活',
  })
  async liveCheck(): Promise<{ alive: boolean }> {
    return { alive: true };
  }
}