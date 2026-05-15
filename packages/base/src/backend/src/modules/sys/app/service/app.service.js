"use strict";
/**
 * @fileoverview 应用服务
 * @description 处理应用实例相关业务逻辑
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
exports.AppService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const crypto_1 = require("crypto");
const app_entity_1 = require("../entities/app.entity");
const not_found_exception_1 = require("../../../../common/exceptions/not-found.exception");
const common_2 = require("../../../../common");
/**
 * 应用服务
 */
let AppService = class AppService {
    appRepository;
    dataSource;
    constructor(appRepository, dataSource) {
        this.appRepository = appRepository;
        this.dataSource = dataSource;
    }
    /**
     * 创建应用实例
     * @param createAppDto - 创建应用实例请求参数
     * @returns 创建的应用实例
     */
    async create(createAppDto) {
        const { appCode } = createAppDto;
        const existingApp = await this.appRepository.findOne({
            where: { appCode },
        });
        if (existingApp) {
            throw new common_1.ConflictException('应用编码已存在');
        }
        const app = this.appRepository.create(createAppDto);
        return this.appRepository.save(app);
    }
    /**
     * 根据 ID 查询应用实例
     * @param id - 应用实例 ID
     * @returns 应用实例信息
     */
    async findById(id) {
        const result = await this.dataSource.query(`SELECT 
        app.*,
        JSON_OBJECT('id', t.id, 'typeName', t.typeName, 'typeCode', t.typeCode) as appType,
        JSON_OBJECT('id', u.id, 'username', u.username, 'nickname', u.nickname, 'avatar', u.avatar) as owner
      FROM sys_apps app
      LEFT JOIN sys_app_types t ON app.appTypeId = t.id
      LEFT JOIN sys_users u ON app.ownerId = u.id AND u.deleteAt IS NULL
      WHERE app.id = ? AND app.deleteAt IS NULL`, [id]);
        if (!result || result.length === 0) {
            throw new not_found_exception_1.NotFoundError('应用实例');
        }
        const app = result[0];
        return {
            ...app,
            appType: app.appType,
            owner: app.owner,
        };
    }
    /**
     * 查询应用实例列表（分页）
     * @param query - 查询参数
     * @returns 分页结果
     */
    async findAll(query) {
        const { appName, appCode, appTypeId, ownerId, appStatus } = query;
        const whereBuilder = new common_2.WhereBuilder();
        whereBuilder
            .like('app.appName', appName)
            .like('app.appCode', appCode)
            .eq('app.appTypeId', appTypeId)
            .eq('app.ownerId', ownerId)
            .eq('app.appStatus', appStatus);
        const pager = new common_2.PaginationX(this.dataSource, query);
        const result = await pager
            .where('main', whereBuilder)
            .sql(({ select, wheres, orderBy, limit }) => {
            const whereClause = wheres?.main || '';
            return `SELECT ${select} FROM sys_apps app LEFT JOIN sys_app_types t ON app.appTypeId = t.id LEFT JOIN sys_users u ON app.ownerId = u.id ${whereClause} ${orderBy} ${limit}`;
        })
            .select(`app.*, 
        JSON_OBJECT('id', t.id, 'typeName', t.typeName, 'typeCode', t.typeCode) as appType,
        JSON_OBJECT('id', u.id, 'username', u.username, 'nickname', u.nickname, 'avatar', u.avatar) as owner`)
            .defaultOrderBy('app.sortOrder ASC, app.createdAt DESC')
            .getData();
        if (result.data && result.data.length > 0) {
            result.data = result.data.map((item) => ({
                ...item,
                appType: item.appType ? JSON.parse(item.appType) : null,
                owner: item.owner ? JSON.parse(item.owner) : null,
            }));
        }
        return result;
    }
    /**
     * 更新应用实例
     * @param id - 应用实例 ID
     * @param updateAppDto - 更新应用实例请求参数
     * @returns 更新后的应用实例
     */
    async update(id, updateAppDto) {
        // 查找应用实例
        const app = await this.appRepository.findOne({
            where: { id },
        });
        if (!app) {
            throw new not_found_exception_1.NotFoundError('应用实例');
        }
        // 如果更新应用编码，检查是否重复
        if (updateAppDto.appCode && updateAppDto.appCode !== app.appCode) {
            const existingApp = await this.appRepository.findOne({
                where: { appCode: updateAppDto.appCode },
            });
            if (existingApp) {
                throw new common_1.ConflictException('应用编码已存在');
            }
        }
        // 更新应用实例信息
        Object.assign(app, updateAppDto);
        return this.appRepository.save(app);
    }
    /**
     * 删除应用实例
     * @param id - 应用实例 ID
     */
    async delete(id) {
        const app = await this.appRepository.findOne({
            where: { id },
        });
        if (!app) {
            throw new not_found_exception_1.NotFoundError('应用实例');
        }
        if (app.appCode === 'system-instance') {
            throw new common_1.BadRequestException('系统内置应用不可删除');
        }
        // 使用软删除
        await this.appRepository.softDelete(id);
    }
    /**
     * 变更负责人
     * @description 完整移交应用所有权：移除原拥有者的成员身份和角色，为新拥有者分配拥有者权限
     * @param id - 应用实例 ID
     * @param ownerId - 新负责人 ID
     * @returns 更新后的应用实例
     */
    async changeOwner(id, ownerId) {
        const app = await this.appRepository.findOne({
            where: { id },
        });
        if (!app) {
            throw new not_found_exception_1.NotFoundError('应用实例');
        }
        if (app.appCode === 'system-instance') {
            throw new common_1.BadRequestException('系统内置应用不可更换拥有者');
        }
        if (app.ownerId === ownerId) {
            return app;
        }
        const oldOwnerId = app.ownerId;
        await this.dataSource.transaction(async (manager) => {
            const users = await manager.query(`SELECT id FROM sys_users WHERE id = ? AND deleteAt IS NULL`, [ownerId]);
            if (!users || users.length === 0) {
                throw new common_1.BadRequestException('用户不存在');
            }
            const ownerRoles = await manager.query(`SELECT id FROM sys_roles WHERE isOwner = 1 AND (appId = ? OR appTypeId = ?)`, [app.id, app.appTypeId]);
            if (oldOwnerId) {
                await manager.query(`DELETE FROM sys_user_roles WHERE userId = ? AND appId = ?`, [oldOwnerId, app.id]);
                await manager.query(`DELETE FROM sys_app_members WHERE userId = ? AND appId = ?`, [oldOwnerId, app.id]);
            }
            app.ownerId = ownerId;
            await manager.save(app);
            await manager.query(`INSERT IGNORE INTO sys_app_members (id, appId, userId, createdAt, updateAt)
         VALUES (UUID(), ?, ?, NOW(), NOW())`, [app.id, ownerId]);
            if (ownerRoles.length > 0) {
                const insertValues = ownerRoles.map((r) => [
                    (0, crypto_1.randomUUID)(),
                    ownerId,
                    r.id,
                    app.id,
                ]);
                await manager.query(`INSERT IGNORE INTO sys_user_roles (id, userId, roleId, appId) VALUES ?`, [insertValues]);
            }
        });
        return app;
    }
    /**
     * 更新应用实例状态
     * @param id - 应用实例 ID
     * @param status - 新状态
     * @returns 更新后的应用实例
     */
    async updateStatus(id, status) {
        const app = await this.appRepository.findOne({
            where: { id },
        });
        if (!app) {
            throw new not_found_exception_1.NotFoundError('应用实例');
        }
        app.appStatus = status;
        return this.appRepository.save(app);
    }
};
exports.AppService = AppService;
exports.AppService = AppService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(app_entity_1.App)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.DataSource])
], AppService);
//# sourceMappingURL=app.service.js.map