"use strict";
/**
 * @fileoverview 健康检查控制器
 * @description 提供服务健康检查接口
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const public_decorator_1 = require("../../common/decorators/public.decorator");
/**
 * 健康检查控制器
 * @description 提供服务健康状态检查接口
 */
let HealthController = class HealthController {
    dataSource;
    startTime = Date.now();
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    /**
     * 健康检查
     * @returns 服务健康状态
     */
    async healthCheck() {
        const memoryUsage = process.memoryUsage();
        let dbStatus = 'disconnected';
        let dbLatency;
        // 检查数据库连接
        try {
            const start = Date.now();
            await this.dataSource.query('SELECT 1');
            dbLatency = Date.now() - start;
            dbStatus = 'connected';
        }
        catch {
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
    async readyCheck() {
        try {
            await this.dataSource.query('SELECT 1');
            return { ready: true };
        }
        catch {
            return { ready: false };
        }
    }
    /**
     * 存活检查
     * @returns 服务是否存活
     */
    async liveCheck() {
        return { alive: true };
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: '健康检查',
        description: '检查服务运行状态、数据库连接状态和内存使用情况',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '服务健康',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "healthCheck", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('ready'),
    (0, swagger_1.ApiOperation)({
        summary: '就绪检查',
        description: '检查服务是否已准备好接收请求',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '服务就绪',
    }),
    (0, swagger_1.ApiResponse)({
        status: 503,
        description: '服务未就绪',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "readyCheck", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('live'),
    (0, swagger_1.ApiOperation)({
        summary: '存活检查',
        description: '检查服务进程是否存活',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '服务存活',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "liveCheck", null);
exports.HealthController = HealthController = __decorate([
    (0, swagger_1.ApiTags)('health', '健康检查接口'),
    (0, common_1.Controller)('health'),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.DataSource])
], HealthController);
//# sourceMappingURL=health.controller.js.map