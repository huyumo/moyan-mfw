/**
 * @fileoverview 数据库连接健康检查服务
 * @description 定期检测数据库连接状态，仅在 DataSource 完全未初始化时尝试重连
 */

import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { DataSource } from "typeorm";

/**
 * 数据库连接健康检查服务
 * @description 每 30 秒执行一次 `SELECT 1` 探测连接状态
 */
@Injectable()
export class DatabaseHealthService implements OnModuleInit, OnModuleDestroy {
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private readonly healthCheckIntervalMs = 30000; // 30 秒

  constructor(private dataSource: DataSource) {}

  async onModuleInit() {
    console.log(
      "[DatabaseHealth] Starting database connection health check...",
    );

    // 定期检测连接状态
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.dataSource.query("SELECT 1");
      } catch (error) {
        console.error(
          "[DatabaseHealth] Connection health check failed:",
          error,
        );

        // 注意：不要在 isInitialized 时主动 destroy DataSource。
        // destroy 后到 initialize 完成之间存在"Pool is closed"窗口期，
        // 期间所有请求（含 /api/install/status）都会 500，
        // 前端 guard 会误判为"未初始化"并跳转 install 页面 → 重新初始化会清空数据。
        // mysql2 连接池本身具备自动重连/重试能力，这里仅在 DataSource 完全未初始化时尝试初始化。
        if (!this.dataSource.isInitialized) {
          try {
            await this.dataSource.initialize();
            console.log("[DatabaseHealth] Reconnected successfully");
          } catch (reconnectError) {
            console.error(
              "[DatabaseHealth] Reconnection failed:",
              reconnectError,
            );
          }
        } else {
          console.warn(
            "[DatabaseHealth] DataSource still initialized, rely on pool auto-reconnect. " +
              'Do not destroy to avoid "Pool is closed" window.',
          );
        }
      }
    }, this.healthCheckIntervalMs);
  }

  async onModuleDestroy() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      console.log("[DatabaseHealth] Stopped health check");
    }
  }
}
