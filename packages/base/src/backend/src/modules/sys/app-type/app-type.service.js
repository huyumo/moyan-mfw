"use strict";
/**
 * @fileoverview 应用类型服务
 * @description 处理应用类型相关业务逻辑
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
exports.AppTypeService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const app_type_entity_1 = require("./entities/app-type.entity");
const app_type_permission_entity_1 = require("./entities/app-type-permission.entity");
const permission_entity_1 = require("../permission/entities/permission.entity");
const role_entity_1 = require("../role/entities/role.entity");
const not_found_exception_1 = require("../../../common/exceptions/not-found.exception");
const common_2 = require("../../../common");
const tree_util_1 = require("@/common/utils/tree.util");
/**
 * 应用类型服务
 */
let AppTypeService = class AppTypeService {
    appTypeRepository;
    roleRepository;
    dataSource;
    constructor(appTypeRepository, roleRepository, dataSource) {
        this.appTypeRepository = appTypeRepository;
        this.roleRepository = roleRepository;
        this.dataSource = dataSource;
    }
    /**
     * 创建应用类型
     * @param createAppTypeDto - 创建应用类型请求参数
     * @returns 创建的应用类型
     */
    async create(createAppTypeDto) {
        const { typeCode } = createAppTypeDto;
        // 检查类型编码是否存在
        const existingAppType = await this.appTypeRepository.findOne({
            where: { typeCode },
        });
        if (existingAppType) {
            throw new common_1.ConflictException('类型编码已存在');
        }
        // 创建应用类型
        const appType = this.appTypeRepository.create(createAppTypeDto);
        return this.appTypeRepository.save(appType);
    }
    /**
     * 根据 ID 查询应用类型
     * @param id - 应用类型 ID
     * @returns 应用类型信息
     */
    async findById(id) {
        const appType = await this.appTypeRepository.findOne({
            where: { id },
        });
        if (!appType) {
            throw new not_found_exception_1.NotFoundError('应用类型');
        }
        return appType;
    }
    /**
     * 查询应用类型列表（分页）
     * @param query - 查询参数
     * @returns 分页结果
     */
    async findAll(query) {
        const { typeName, typeCode, typeStatus } = query;
        const whereBuilder = new common_2.WhereBuilder();
        whereBuilder
            .like('appType.typeName', typeName)
            .like('appType.typeCode', typeCode)
            .eq('appType.typeStatus', typeStatus);
        const pager = new common_2.PaginationX(this.dataSource, query);
        return await pager
            .where('main', whereBuilder)
            .sql(({ select, wheres, orderBy, limit }) => {
            const whereClause = wheres?.main || '';
            return `SELECT ${select} FROM sys_app_types appType ${whereClause} ${orderBy} ${limit}`;
        })
            .select('appType.*')
            .defaultOrderBy('appType.sortOrder ASC')
            .getData();
    }
    /**
     * 查询所有应用类型
     * @returns 应用类型列表
     */
    async findAllList() {
        const appTypes = await this.appTypeRepository.find({
            order: {
                sortOrder: 'ASC'
            },
        });
        const appTypeIds = appTypes.map((t) => t.id);
        const countResults = appTypeIds.length > 0
            ? await this.roleRepository
                .createQueryBuilder('role')
                .select('role.appTypeId', 'appTypeId')
                .addSelect('COUNT(*)', 'count')
                .where('role.appTypeId IN (:...appTypeIds)', { appTypeIds })
                .andWhere('role.isBuiltin = 1')
                .groupBy('role.appTypeId')
                .getRawMany()
            : [];
        const countMap = new Map();
        for (const row of countResults) {
            countMap.set(row.appTypeId, Number(row.count));
        }
        return appTypes.map((appType) => ({
            ...appType,
            builtinRoleCount: countMap.get(appType.id) || 0,
        }));
    }
    /**
     * 更新应用类型
     * @param id - 应用类型 ID
     * @param updateAppTypeDto - 更新应用类型请求参数
     * @returns 更新后的应用类型
     */
    async update(id, updateAppTypeDto) {
        // 查找应用类型
        const appType = await this.appTypeRepository.findOne({
            where: { id },
        });
        if (!appType) {
            throw new not_found_exception_1.NotFoundError('应用类型');
        }
        // 如果更新类型编码，检查是否重复
        if (updateAppTypeDto.typeCode && updateAppTypeDto.typeCode !== appType.typeCode) {
            const existingAppType = await this.appTypeRepository.findOne({
                where: { typeCode: updateAppTypeDto.typeCode },
            });
            if (existingAppType) {
                throw new common_1.ConflictException('类型编码已存在');
            }
        }
        // 更新应用类型信息
        Object.assign(appType, updateAppTypeDto);
        return this.appTypeRepository.save(appType);
    }
    /**
     * 删除应用类型
     * @param id - 应用类型 ID
     */
    async delete(id) {
        const appType = await this.appTypeRepository.findOne({
            where: { id },
        });
        if (!appType) {
            throw new not_found_exception_1.NotFoundError('应用类型');
        }
        // 使用软删除
        await this.appTypeRepository.softDelete(id);
    }
    /**
     * 更新应用类型状态
     * @param id - 应用类型 ID
     * @param status - 新状态
     * @returns 更新后的应用类型
     */
    async updateStatus(id, status) {
        const appType = await this.appTypeRepository.findOne({
            where: { id },
        });
        if (!appType) {
            throw new not_found_exception_1.NotFoundError('应用类型');
        }
        appType.typeStatus = status;
        return this.appTypeRepository.save(appType);
    }
    /**
     * 获取权限池配置
     * @param appTypeId - 应用类型 ID
     * @returns 权限池配置
     */
    async getPermissionPool(appTypeId) {
        const appType = await this.appTypeRepository.findOne({
            where: { id: appTypeId },
        });
        if (!appType) {
            throw new not_found_exception_1.NotFoundError('应用类型');
        }
        const rows = await this.dataSource.query(`SELECT
        p.id,
        p.permName,
        p.permCode,
        p.permDesc,
        p.permissionType,
        p.nodeType,
        p.parentId,
        p.routePath,
        p.externalUrl,
        p.iconName,
        p.sortOrder,
        p.isVisible,
        p.isCache,
        p.showMode,
        p.permStatus,
        p.isAutoSync,
        p.permissionValue AS parentPermissionValue,
        atp.permissionValue,
        IF(atp.permissionId IS NULL, 0, 1) checked
      FROM sys_permissions p
      LEFT JOIN sys_app_type_permissions atp ON atp.permissionId = p.id AND atp.appTypeId = ?
      WHERE p.deleteAt IS NULL
      ORDER BY p.sortOrder ASC`, [appTypeId]);
        const pcRows = rows.filter((r) => r.permissionType === permission_entity_1.PermissionType.PC);
        const normalRows = rows.filter((r) => r.permissionType === permission_entity_1.PermissionType.NORMAL);
        const pcTree = this.buildPermissionTreeFromRows(pcRows);
        const normalTree = this.buildPermissionTreeFromRows(normalRows);
        return {
            appTypeId,
            permissionTrees: {
                pcTree,
                normalTree,
            },
        };
    }
    /**
     * 更新权限池配置
     * @param appTypeId - 应用类型 ID
     * @param updateDto - 更新权限池请求
     * @returns 更新结果
     */
    async updatePermissionPool(appTypeId, updateDto) {
        // 验证应用类型存在
        const appType = await this.appTypeRepository.findOne({
            where: { id: appTypeId },
        });
        if (!appType) {
            throw new not_found_exception_1.NotFoundError('应用类型');
        }
        // 收集所有待处理的权限节点
        const allNodes = [];
        // 遍历 PC 权限树
        this.collectPermissionNodes(updateDto.permissionTrees.pcTree, allNodes);
        // 遍历普通权限树
        this.collectPermissionNodes(updateDto.permissionTrees.normalTree, allNodes);
        // 使用事务批量更新
        let updatedCount = 0;
        await this.dataSource.transaction(async (manager) => {
            // 先删除所有旧的权限池配置
            await manager.delete(app_type_permission_entity_1.AppTypePermissionEntity, { appTypeId });
            // 插入新的权限池配置（仅处理 checked=true 的节点）
            const entitiesToInsert = [];
            for (const node of allNodes) {
                if (node.checked) {
                    const entity = manager.create(app_type_permission_entity_1.AppTypePermissionEntity, {
                        appTypeId,
                        permissionId: node.id,
                        permissionValue: node.permissionValue ? BigInt(node.permissionValue) : 0n,
                    });
                    entitiesToInsert.push(entity);
                }
            }
            if (entitiesToInsert.length > 0) {
                await manager.save(entitiesToInsert);
                updatedCount = entitiesToInsert.length;
            }
        });
        return {
            appTypeId,
            updatedCount,
        };
    }
    buildPermissionTreeFromRows(rows) {
        const nodes = rows.map((row) => {
            const checked = row.checked == 1;
            return {
                ...row,
                checked,
                sortOrder: Number(row.sortOrder),
                isVisible: Number(row.isVisible),
                isCache: Number(row.isCache),
                permStatus: Number(row.permStatus),
                isAutoSync: row.isAutoSync != null ? Number(row.isAutoSync) : undefined,
                permissionValue: checked && row.permissionValue != null ? String(row.permissionValue) : undefined,
                parentPermissionValue: row.parentPermissionValue != null ? String(row.parentPermissionValue) : undefined,
            };
        });
        const tree = (0, tree_util_1.flatToTree)(nodes, { keepEmptyChildren: false });
        const sortTree = (items) => {
            items.sort((a, b) => a.sortOrder - b.sortOrder);
            for (const item of items) {
                if (item.children?.length)
                    sortTree(item.children);
            }
        };
        sortTree(tree);
        return tree;
    }
    /**
     * 收集权限节点（递归）
     * @param nodes - 权限树节点列表
     * @param result - 收集结果
     */
    collectPermissionNodes(nodes, result) {
        for (const node of nodes) {
            result.push({
                id: node.id,
                checked: node.checked,
                permissionValue: node.permissionValue,
            });
            if (node.children && node.children.length > 0) {
                this.collectPermissionNodes(node.children, result);
            }
        }
    }
};
exports.AppTypeService = AppTypeService;
exports.AppTypeService = AppTypeService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(app_type_entity_1.AppType)),
    __param(1, (0, typeorm_1.InjectRepository)(role_entity_1.Role)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], AppTypeService);
//# sourceMappingURL=app-type.service.js.map