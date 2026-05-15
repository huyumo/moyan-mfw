"use strict";
/**
 * @fileoverview 初始化服务
 * @description 提供系统初始化检测和初始化执行功能
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
exports.InstallService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const app_type_entity_1 = require("../app-type/entities/app-type.entity");
const user_entity_1 = require("../user/entities/user.entity");
const app_entity_1 = require("../app/entities/app.entity");
const index_1 = require("../../../database/seeds/index");
/**
 * 初始化服务
 */
let InstallService = class InstallService {
    appTypeRepository;
    dataSource;
    constructor(appTypeRepository, dataSource) {
        this.appTypeRepository = appTypeRepository;
        this.dataSource = dataSource;
    }
    /**
     * 检查系统是否已初始化
     * @returns 是否已初始化
     */
    async isInitialized() {
        const count = await this.appTypeRepository.count();
        return count > 0;
    }
    /**
     * 执行初始化
     * @param initData 初始化数据
     * @returns 初始化结果
     */
    async initialize(initData) {
        // 检查是否已初始化
        if (await this.isInitialized()) {
            throw new common_1.ConflictException('系统已初始化，无法重复执行');
        }
        try {
            // 执行种子数据（使用 dataSource）
            await (0, index_1.runSeeds)(this.dataSource, initData.adminPassword);
            // 获取创建的实体信息
            const adminUser = await this.dataSource.manager.findOne(user_entity_1.User, {
                where: { username: 'admin' },
            });
            const systemApp = await this.dataSource.manager.findOne(app_entity_1.App, {
                where: { appCode: 'system-instance' },
            });
            const systemAppType = await this.dataSource.manager.findOne(app_type_entity_1.AppType, {
                where: { typeCode: 'system' },
            });
            return {
                appTypeId: systemAppType.id,
                appId: systemApp?.id || '',
                adminUserId: adminUser?.id || '',
                message: '初始化成功',
            };
        }
        catch (error) {
            throw error;
        }
    }
};
exports.InstallService = InstallService;
exports.InstallService = InstallService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(app_type_entity_1.AppType)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.DataSource])
], InstallService);
//# sourceMappingURL=install.service.js.map