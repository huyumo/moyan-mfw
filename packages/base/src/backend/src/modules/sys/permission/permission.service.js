"use strict";
/**
 * @fileoverview 权限服务
 * @description 处理权限相关业务逻辑
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
exports.PermissionService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const permission_entity_1 = require("./entities/permission.entity");
const not_found_exception_1 = require("../../../common/exceptions/not-found.exception");
const permission_entity_2 = require("./entities/permission.entity");
const common_2 = require("../../../common");
/**
 * 权限服务
 */
let PermissionService = class PermissionService {
    permissionRepository;
    dataSource;
    constructor(permissionRepository, dataSource) {
        this.permissionRepository = permissionRepository;
        this.dataSource = dataSource;
    }
    /**
     * 创建权限
     * @param createPermissionDto - 创建权限请求参数
     * @returns 创建的权限
     */
    async create(createPermissionDto) {
        const { permCode, nodeType, parentId, permissionType } = createPermissionDto;
        // 自动生成完整的 permCode（严格按照树结构）
        let fullPermCode = permCode;
        if (parentId) {
            const parent = await this.permissionRepository.findOne({
                where: { id: parentId },
            });
            if (!parent) {
                throw new not_found_exception_1.NotFoundError('父权限');
            }
            // 拼接父节点的 permCode（严格按树结构）
            fullPermCode = `${parent.permCode}:${permCode}`;
        }
        else {
            // 没有父节点，检查是否是根节点
            if (permissionType === permission_entity_2.PermissionType.PC && permCode !== 'pc_root') {
                throw new common_1.BadRequestException('PC 权限的根节点编码必须为 pc_root');
            }
            if (permissionType === permission_entity_2.PermissionType.NORMAL && permCode !== 'normal_root') {
                throw new common_1.BadRequestException('普通权限的根节点编码必须为 normal_root');
            }
        }
        // 检查权限编码是否存在
        const existingPermission = await this.permissionRepository.findOne({
            where: { permCode: fullPermCode },
        });
        if (existingPermission) {
            throw new common_1.ConflictException(`权限编码已存在: ${fullPermCode}`);
        }
        // 根节点只能创建 MENU 类型
        if (!parentId && nodeType !== permission_entity_2.NodeType.MENU) {
            throw new common_1.BadRequestException('根节点只能创建 MENU 类型');
        }
        // TAG 类型的父节点必须是 MENU 类型
        if (nodeType === permission_entity_2.NodeType.TAG && parentId) {
            const parentPermission = await this.permissionRepository.findOne({
                where: { id: parentId },
            });
            if (!parentPermission) {
                throw new not_found_exception_1.NotFoundError('父权限');
            }
            if (parentPermission.nodeType !== permission_entity_2.NodeType.MENU) {
                throw new common_1.BadRequestException(`TAG 类型权限的父节点必须是 MENU 类型，当前父节点类型为 ${parentPermission.nodeType}`);
            }
        }
        // 创建权限（使用完整编码）
        const permission = this.permissionRepository.create({
            ...createPermissionDto,
            permCode: fullPermCode,
        });
        return this.permissionRepository.save(permission);
    }
    /**
     * 根据 ID 查询权限
     * @param id - 权限 ID
     * @returns 权限信息
     */
    async findById(id) {
        const permission = await this.permissionRepository.findOne({
            where: { id },
        });
        if (!permission) {
            throw new not_found_exception_1.NotFoundError('权限');
        }
        return permission;
    }
    /**
     * 查询权限列表（分页）
     * @param query - 查询参数
     * @returns 分页结果
     */
    async findAll(query) {
        const { permName, permCode, permissionType, nodeType, parentId } = query;
        const whereBuilder = new common_2.WhereBuilder();
        whereBuilder
            .like('permission.permName', permName)
            .like('permission.permCode', permCode)
            .eq('permission.permissionType', permissionType)
            .eq('permission.nodeType', nodeType)
            .eq('permission.parentId', parentId);
        const pager = new common_2.PaginationX(this.dataSource, query);
        return await pager
            .where('main', whereBuilder)
            .sql(({ select, wheres, orderBy, limit }) => {
            const whereClause = wheres?.main || '';
            return `SELECT ${select} FROM sys_permissions permission ${whereClause} ${orderBy} ${limit}`;
        })
            .select('permission.*')
            .defaultOrderBy('permission.sortOrder ASC, permission.createdAt DESC')
            .getData();
    }
    /**
     * 查询所有权限（树形结构，带 children）
     * @param permissionType - 权限类型筛选（可选）
     * @returns 树形权限列表
     */
    async findAllTreeWithChildren(permissionType) {
        const queryBuilder = this.permissionRepository.createQueryBuilder('permission');
        if (permissionType) {
            queryBuilder.where('permission.permissionType = :permissionType', { permissionType });
        }
        queryBuilder.orderBy('permission.sortOrder', 'ASC');
        const permissions = await queryBuilder.getMany();
        return this.buildTree(permissions);
    }
    /**
     * 获取权限树（带 children）
     * @param parentId - 父权限 ID（可选）
     * @returns 权限树
     */
    async getPermissionTreeWithChildren(parentId) {
        const permissions = await this.permissionRepository.find({
            where: parentId ? { parentId } : undefined,
            order: {
                sortOrder: 'ASC',
            },
        });
        return this.buildTree(permissions, parentId);
    }
    /**
     * 将扁平列表转换为树形结构
     * @param permissions - 权限列表
     * @param rootParentId - 根节点父 ID
     * @returns 树形结构
     */
    buildTree(permissions, rootParentId) {
        const map = new Map();
        const roots = [];
        // 先创建所有节点的映射
        permissions.forEach(item => {
            const node = {
                id: item.id,
                permName: item.permName,
                permCode: item.permCode,
                permDesc: item.permDesc,
                permissionType: item.permissionType,
                nodeType: item.nodeType,
                parentId: item.parentId || undefined,
                routePath: item.routePath || undefined,
                externalUrl: item.externalUrl || undefined,
                iconName: item.iconName || undefined,
                sortOrder: item.sortOrder,
                isVisible: item.isVisible,
                isCache: item.isCache,
                showMode: item.showMode,
                permStatus: item.permStatus,
                isAutoSync: item.isAutoSync,
                permissionValue: typeof item.permissionValue === 'bigint' ? item.permissionValue.toString() : String(item.permissionValue),
                createdAt: item.createdAt,
                updateAt: item.updateAt,
                checked: false,
                children: [],
            };
            map.set(item.id, node);
        });
        // 构建树形结构
        permissions.forEach(item => {
            const node = map.get(item.id);
            if (item.parentId && map.has(item.parentId)) {
                const parent = map.get(item.parentId);
                if (!parent.children) {
                    parent.children = [];
                }
                parent.children.push(node);
            }
            else if (!item.parentId || item.parentId === rootParentId) {
                roots.push(node);
            }
        });
        // 清理空的 children 数组
        const cleanEmptyChildren = (nodes) => {
            nodes.forEach(node => {
                if (node.children && node.children.length === 0) {
                    delete node.children;
                }
                else if (node.children) {
                    cleanEmptyChildren(node.children);
                }
            });
        };
        cleanEmptyChildren(roots);
        return roots;
    }
    /**
     * 查询所有权限（树形结构）
     * @returns 树形权限列表
     */
    async findAllTree() {
        return this.permissionRepository.find({
            order: {
                sortOrder: 'ASC',
                createdAt: 'DESC',
            },
        });
    }
    /**
     * 更新权限
     * @param id - 权限 ID
     * @param updatePermissionDto - 更新权限请求参数
     * @returns 更新后的权限
     */
    async update(id, updatePermissionDto) {
        // 查找权限
        const permission = await this.permissionRepository.findOne({
            where: { id },
        });
        if (!permission) {
            throw new not_found_exception_1.NotFoundError('权限');
        }
        // 如果更新权限编码，检查是否重复
        if (updatePermissionDto.permCode && updatePermissionDto.permCode !== permission.permCode) {
            const existingPermission = await this.permissionRepository.findOne({
                where: { permCode: updatePermissionDto.permCode },
            });
            if (existingPermission) {
                throw new common_1.ConflictException('权限编码已存在');
            }
        }
        // 更新权限信息
        Object.assign(permission, updatePermissionDto);
        return this.permissionRepository.save(permission);
    }
    /**
     * 删除权限（级联删除子节点）
     * @param id - 权限 ID
     */
    async delete(id) {
        const permission = await this.permissionRepository.findOne({
            where: { id },
        });
        if (!permission) {
            throw new not_found_exception_1.NotFoundError('权限');
        }
        // 禁止删除根节点
        if (permission.permCode === 'pc_root' || permission.permCode === 'normal_root') {
            throw new common_1.BadRequestException('权限根节点不允许删除');
        }
        // 递归删除子权限
        await this.deleteChildren(id);
        // 删除当前权限
        await this.permissionRepository.softDelete(id);
    }
    /**
     * 递归删除子权限
     * @param parentId - 父权限 ID
     */
    async deleteChildren(parentId) {
        const children = await this.permissionRepository.find({
            where: { parentId },
        });
        for (const child of children) {
            // 递归删除子权限的子权限
            await this.deleteChildren(child.id);
            // 删除子权限
            await this.permissionRepository.softDelete(child.id);
        }
    }
    /**
     * 获取权限树
     * @param parentId - 父权限 ID（可选）
     * @returns 权限树
     */
    async getPermissionTree(parentId) {
        const permissions = await this.permissionRepository.find({
            where: parentId ? { parentId } : undefined,
            order: {
                sortOrder: 'ASC',
            },
        });
        return permissions;
    }
    /**
     * 批量创建权限
     * @param permissions - 权限列表
     * @returns 创建的权限列表
     */
    async batchCreate(permissions) {
        // 验证必填字段
        for (const perm of permissions) {
            if (!perm.permName || !perm.permCode || !perm.permissionType) {
                throw new common_1.BadRequestException('缺少必填字段：permName, permCode, permissionType 不能为空');
            }
        }
        return this.dataSource.transaction(async (manager) => {
            const createdPermissions = [];
            for (const perm of permissions) {
                const existingPermission = await manager.findOne(permission_entity_1.Permission, {
                    where: { permCode: perm.permCode },
                });
                if (existingPermission) {
                    throw new common_1.ConflictException(`权限编码 ${perm.permCode} 已存在`);
                }
                const permission = manager.create(permission_entity_1.Permission, perm);
                const saved = await manager.save(permission);
                createdPermissions.push(saved);
            }
            return createdPermissions;
        });
    }
    /**
     * 同步路由到权限表
     * @description 将前端路由同步为 PC 权限节点，存储到 Permission 表（全局）
     * 简化流程：清理旧同步数据 → 同步新数据 → 返回最新权限树
     * @param routes - 路由列表（树形结构）
     * @returns 最新权限树
     */
    async syncPermissions(routes) {
        // 确保 PC 根节点存在
        await this.ensurePcRoot();
        // 清理旧的同步数据（isAutoSync=1 的 PC 权限）
        await this.clearAutoSyncPermissions();
        // 扁平化路由并按深度排序
        const flatRoutes = this.flattenRoutes(routes);
        // 构建路径集合，用于判断 nodeType（基于路由数据，而非数据库）
        const allRoutePaths = new Set(flatRoutes.map(r => r.path));
        // 同步每个路由节点
        for (const route of flatRoutes) {
            await this.syncRouteNode(route, allRoutePaths);
        }
        // 返回最新权限树
        return this.findAllTreeWithChildren('PC');
    }
    /**
     * 清理旧的自动同步数据
     * 删除所有 isAutoSync=1 的 PC 权限（保留 pc_root 和 isAutoSync=0 的权限）
     */
    async clearAutoSyncPermissions() {
        // 使用事务删除，避免外键约束问题
        await this.dataSource.transaction(async (manager) => {
            // 1. 获取所有 isAutoSync=1 的 PC 权限 ID（排除 pc_root）
            const pcPerms = await manager.find(permission_entity_1.Permission, {
                where: {
                    permissionType: permission_entity_2.PermissionType.PC,
                    isAutoSync: 1, // 只清理自动同步的权限
                },
                select: ['id', 'permCode'],
            });
            const idsToDelete = pcPerms
                .filter(p => p.permCode !== 'pc_root')
                .map(p => p.id);
            if (idsToDelete.length === 0)
                return;
            // 2. 删除 sys_role_permissions 关联（只删除 isAutoSync=1 的权限关联）
            // 使用 FIND_IN_SET 避免 IN 语法对数组参数的限制
            await manager.query(`DELETE FROM sys_role_permissions WHERE FIND_IN_SET(permissionId, ?)`, [idsToDelete.join(',')]);
            // 3. 删除权限（按深度从深到浅）
            const sortedPerms = pcPerms
                .filter(p => p.permCode !== 'pc_root')
                .sort((a, b) => {
                const depthA = a.permCode.split(':').length;
                const depthB = b.permCode.split(':').length;
                return depthB - depthA;
            });
            for (const perm of sortedPerms) {
                await manager.delete(permission_entity_1.Permission, perm.id);
            }
        });
    }
    /**
     * 确保 PC 根节点存在
     */
    async ensurePcRoot() {
        const pcRoot = await this.permissionRepository.findOne({
            where: { permCode: 'pc_root' },
        });
        if (!pcRoot) {
            const root = this.permissionRepository.create({
                permName: 'PC权限根节点',
                permCode: 'pc_root',
                permDesc: 'PC权限系统的根节点',
                permissionType: permission_entity_2.PermissionType.PC,
                nodeType: permission_entity_2.NodeType.MENU,
                parentId: null,
                sortOrder: 0,
                isVisible: 0,
                isAutoSync: 0,
                permStatus: 1,
                permissionValue: 0n,
            });
            await this.permissionRepository.save(root);
        }
    }
    /**
     * 扁平化路由（树形 → 数组）
     * 按路径深度排序，确保父节点先处理
     */
    flattenRoutes(routes) {
        const result = [];
        const flatten = (routeList) => {
            for (const route of routeList) {
                result.push(route);
                if (route.children && route.children.length > 0) {
                    flatten(route.children);
                }
            }
        };
        flatten(routes);
        // 按路径深度排序
        result.sort((a, b) => {
            const depthA = a.path.split('/').filter(Boolean).length;
            const depthB = b.path.split('/').filter(Boolean).length;
            return depthA - depthB;
        });
        return result;
    }
    /**
     * 同步单个路由节点
     * @param route - 路由节点
     * @param allRoutePaths - 所有路由路径集合（用于判断 nodeType）
     */
    async syncRouteNode(route, allRoutePaths) {
        const permCode = this.generatePermCode(route.path);
        const pathSegments = route.path.split('/').filter(Boolean);
        const depth = pathSegments.length;
        // 确定父节点
        let parentId = null;
        if (depth === 1) {
            // 顶级路由挂载到 pc_root
            const pcRoot = await this.permissionRepository.findOne({
                where: { permCode: 'pc_root' },
            });
            parentId = pcRoot?.id || null;
        }
        else {
            // 查找父节点
            const parentPath = '/' + pathSegments.slice(0, -1).join('/');
            const parentCode = this.generatePermCode(parentPath);
            const parent = await this.permissionRepository.findOne({
                where: { permCode: parentCode },
            });
            parentId = parent?.id || null;
        }
        // 判断 nodeType：基于路由数据（有 children 或有子路由路径）
        const hasChildrenInRoute = route.children && route.children.length > 0;
        const hasChildRoutes = Array.from(allRoutePaths).some(p => p.startsWith(route.path + '/') && p !== route.path);
        const nodeType = (hasChildrenInRoute || hasChildRoutes) ? permission_entity_2.NodeType.MENU : permission_entity_2.NodeType.PAGE;
        // 解析前端传入的 permissionValue
        const permissionValue = route.permissionValue
            ? BigInt(route.permissionValue)
            : 0n;
        // 检查是否已存在
        const existing = await this.permissionRepository.findOne({
            where: { permCode },
        });
        if (existing) {
            existing.permName = route.name;
            existing.routePath = route.path;
            existing.nodeType = nodeType;
            if (parentId)
                existing.parentId = parentId;
            existing.permissionValue = nodeType === permission_entity_2.NodeType.PAGE ? permissionValue : 0n;
            await this.permissionRepository.save(existing);
        }
        else {
            // 新增
            const newPerm = this.permissionRepository.create({
                permName: route.name,
                permCode,
                permDesc: `同步生成：${route.name}`,
                permissionType: permission_entity_2.PermissionType.PC,
                nodeType,
                parentId: parentId || undefined,
                routePath: route.path,
                sortOrder: depth * 10,
                isAutoSync: 1,
                permStatus: 1,
                permissionValue: nodeType === permission_entity_2.NodeType.PAGE ? permissionValue : 0n,
            });
            await this.permissionRepository.save(newPerm);
        }
    }
    /**
     * 生成权限编码（严格按照树结构）
     * @param path - 路由路径
     * @returns 权限编码（格式：pc_root:path:to:route）
     */
    generatePermCode(path) {
        const cleanPath = path.replace(/^\//, '').replace(/\//g, ':');
        return `pc_root:${cleanPath || 'root'}`;
    }
};
exports.PermissionService = PermissionService;
exports.PermissionService = PermissionService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(permission_entity_1.Permission)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.DataSource])
], PermissionService);
//# sourceMappingURL=permission.service.js.map