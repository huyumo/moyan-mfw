"use strict";
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
var PermissionValueSyncService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionValueSyncService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const permission_value_entity_1 = require("./entities/permission-value.entity");
const permissions_1 = require("../../../common/constants/permissions");
let PermissionValueSyncService = PermissionValueSyncService_1 = class PermissionValueSyncService {
    repo;
    logger = new common_1.Logger(PermissionValueSyncService_1.name);
    constructor(repo) {
        this.repo = repo;
    }
    async sync(dataSource) {
        const declaredNames = new Set((0, permissions_1.getPermissionValues)());
        const existing = await this.repo.find({ where: { status: 1 } });
        const existingNames = new Set(existing.map((e) => e.name));
        const deprecated = existing.filter((e) => !declaredNames.has(e.name));
        if (deprecated.length > 0) {
            await this.repo.update(deprecated.map((e) => ({ bitValue: e.bitValue })), { status: 0 });
            this.logger.log(`标记废弃 ${deprecated.length} 个权限标签: ${deprecated.map((e) => e.name).join(', ')}`);
        }
        const added = [...declaredNames].filter((n) => !existingNames.has(n));
        if (added.length > 0) {
            const maxBit = await this.repo
                .createQueryBuilder('pv')
                .select('MAX(pv.bitPosition)', 'max')
                .getRawOne()
                .then((r) => (r?.max ?? -1));
            const newEntities = added.map((name, i) => {
                const bitPosition = Number(maxBit) + 1 + i;
                return this.repo.create({
                    name,
                    bitPosition,
                    bitValue: 1n << BigInt(bitPosition),
                    status: 1,
                });
            });
            await dataSource.transaction(async (manager) => {
                for (const entity of newEntities) {
                    try {
                        await manager.save(entity);
                    }
                    catch (err) {
                        if (err?.code === 'ER_DUP_ENTRY') {
                            this.logger.warn(`标签 "${entity.name}" (bitPosition=${entity.bitPosition}) 已存在，跳过`);
                        }
                        else {
                            throw err;
                        }
                    }
                }
            });
            this.logger.log(`新增 ${newEntities.length} 个权限标签: ${added.join(', ')}`);
        }
        const allActive = await this.repo.find({ where: { status: 1 }, order: { bitPosition: 'ASC' } });
        (0, permissions_1.initPermissionValueCache)(allActive.map((e) => ({ name: e.name, bitValue: e.bitValue })));
        this.logger.log(`权限值缓存已初始化 (${allActive.length} 个标签)`);
    }
};
exports.PermissionValueSyncService = PermissionValueSyncService;
exports.PermissionValueSyncService = PermissionValueSyncService = PermissionValueSyncService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(permission_value_entity_1.PermissionValue)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], PermissionValueSyncService);
//# sourceMappingURL=permission-value-sync.service.js.map