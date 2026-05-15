"use strict";
/**
 * @fileoverview 初始化控制器
 * @description 提供系统初始化相关 API 接口
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
exports.InstallController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const public_decorator_1 = require("../../../common/decorators/public.decorator");
const install_service_1 = require("./install.service");
const init_request_dto_1 = require("./dto/init-request.dto");
const init_response_dto_1 = require("./dto/init-response.dto");
/**
 * 初始化控制器
 */
let InstallController = class InstallController {
    installService;
    constructor(installService) {
        this.installService = installService;
    }
    /**
     * 检查系统是否已初始化
     * @returns 初始化状态
     */
    async getStatus() {
        const initialized = await this.installService.isInitialized();
        return { initialized };
    }
    /**
     * 执行系统初始化
     * @param initData 初始化数据
     * @returns 初始化结果
     */
    async initialize(initData) {
        return this.installService.initialize(initData);
    }
};
exports.InstallController = InstallController;
__decorate([
    (0, common_1.Get)('status'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: '检查系统是否已初始化' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        type: init_response_dto_1.InitStatusResponseDto,
        description: '返回系统初始化状态',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InstallController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Post)('init'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: '执行系统初始化' }),
    (0, swagger_1.ApiBody)({ type: init_request_dto_1.InitRequestDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        type: init_response_dto_1.InitResponseDto,
        description: '返回初始化结果',
    }),
    (0, swagger_1.ApiResponse)({
        status: 409,
        description: '系统已初始化，无法重复执行',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [init_request_dto_1.InitRequestDto]),
    __metadata("design:returntype", Promise)
], InstallController.prototype, "initialize", null);
exports.InstallController = InstallController = __decorate([
    (0, swagger_1.ApiTags)('系统初始化'),
    (0, common_1.Controller)('install'),
    __metadata("design:paramtypes", [install_service_1.InstallService])
], InstallController);
//# sourceMappingURL=install.controller.js.map