"use strict";
/**
 * @fileoverview 角色服务
 * @description 处理角色相关业务逻辑
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
exports.RoleService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const role_entity_1 = require("./entities/role.entity");
const role_permission_entity_1 = require("./entities/role-permission.entity");
const permission_entity_1 = require("../permission/entities/permission.entity");
const not_found_exception_1 = require("../../../common/exceptions/not-found.exception");
const common_2 = require("../../../common");
const tree_util_1 = require("@/common/utils/tree.util");
/**
 * 角色服务
 */
let RoleService = class RoleService {
    entityManager;
    roleRepository;
    rolePermissionRepository;
    constructor(entityManager, roleRepository, rolePermissionRepository) {
        this.entityManager = entityManager;
        this.roleRepository = roleRepository;
        this.rolePermissionRepository = rolePermissionRepository;
    }
    /**
     * 创建角色
     * @param createRoleDto - 创建角色请求参数
     * @returns 创建的角色
     */
    async create(createRoleDto) {
        const { roleCode } = createRoleDto;
        // 检查角色编码是否存在
        const existingRole = await this.roleRepository.findOne({
            where: { roleCode },
        });
        if (existingRole) {
            throw new common_1.ConflictException('角色编码已存在');
        }
        // 创建角色
        const role = this.roleRepository.create(createRoleDto);
        return this.roleRepository.save(role);
    }
    /**
     * 根据 ID 查询角色
     * @param id - 角色 ID
     * @returns 角色信息
     */
    async findById(id) {
        const role = await this.roleRepository.findOne({
            where: { id },
        });
        if (!role) {
            throw new not_found_exception_1.NotFoundError('角色');
        }
        return role;
    }
    /**
     * 查询角色列表（分页）
     * @param query - 查询参数
     * @returns 分页结果
     */
    async findAll(query) {
        let { roleCode, roleName, roleStatus, appId, appTypeId } = query;
        if (appId && !/^[a-f0-9-]{36}$/.test(appId)) {
            throw new common_1.BadRequestException('无效的 appId 格式');
        }
        let isBuiltin;
        if (appId)
            appTypeId = undefined;
        if (appTypeId)
            isBuiltin = 1;
        const whereBuilder = new common_2.WhereBuilder();
        whereBuilder
            .like('role.roleCode', roleCode)
            .like('role.roleName', roleName)
            .eq('role.roleStatus', roleStatus)
            .eq('role.isBuiltin', isBuiltin);
        const pager = new common_2.PaginationX(this.entityManager.connection, query);
        return await pager
            .where('main', whereBuilder)
            .unshiftSql({
            tag: 'appType',
            sql: `SELECT @appTypeId := appTypeId FROM sys_apps WHERE id = '${appId}'`,
            isGetOne: true,
        })
            .sql(({ select, wheres, orderBy, limit }) => {
            const whereClause = wheres?.main || '';
            return `
          SELECT ${select} FROM sys_roles role
          LEFT JOIN sys_apps sa ON sa.appTypeId = role.appTypeId
          WHERE role.appTypeId = IFNULL(@appTypeId,'${appTypeId}')
          ${whereClause.replace('WHERE', 'AND')}
          ${orderBy}
          ${limit}
        `;
        })
            .select('role.*')
            .printSql()
            .defaultOrderBy('role.sortOrder ASC, role.createdAt DESC')
            .getData();
    }
    /**
     * 更新角色
     * @param id - 角色 ID
     * @param updateRoleDto - 更新角色请求参数
     * @returns 更新后的角色
     */
    async update(id, updateRoleDto) {
        // 查找角色
        const role = await this.roleRepository.findOne({
            where: { id },
        });
        if (!role) {
            throw new not_found_exception_1.NotFoundError('角色');
        }
        // 更新角色信息
        Object.assign(role, updateRoleDto);
        return this.roleRepository.save(role);
    }
    /**
     * 删除角色
     * @param id - 角色 ID
     */
    async delete(id) {
        const role = await this.roleRepository.findOne({
            where: { id },
        });
        if (!role) {
            throw new not_found_exception_1.NotFoundError('角色');
        }
        // 内置角色不允许删除
        if (role.isBuiltin === 1) {
            throw new common_1.ConflictException('内置角色不允许删除');
        }
        // 使用软删除
        await this.roleRepository.softDelete(id);
    }
    /**
     * 收集权限节点（递归）
     * @param nodes - 权限树节点列表
     * @param result - 收集结果
     */
    collectPermissionNodes(nodes, result) {
        for (const node of nodes) {
            node.checked && result.push({
                id: node.id,
                checked: node.checked,
                permissionValue: node.permissionValue,
            });
            if (node.children && node.children.length > 0) {
                this.collectPermissionNodes(node.children, result);
            }
        }
    }
    /**
     * 为角色分配权限
     * @param roleId - 角色 ID
     * @param permissions - 权限列表
     */
    async assignPermissions(roleId, assignPermissionsDto) {
        return this.entityManager.transaction(async (manager) => {
            // 删除角色所有权限
            await manager.delete(role_permission_entity_1.RolePermission, { roleId });
            // 收集所有待处理的权限节点
            const allNodes = [];
            this.collectPermissionNodes(assignPermissionsDto.permissionTrees.pcTree, allNodes);
            this.collectPermissionNodes(assignPermissionsDto.permissionTrees.normalTree, allNodes);
            const datas = allNodes.map((item) => {
                return manager.create(role_permission_entity_1.RolePermission, {
                    roleId,
                    permissionId: item.id,
                    permissionValue: item.permissionValue ? BigInt(item.permissionValue) : 0n,
                });
            });
            await manager.save(datas);
        });
    }
    /**
     * 获取角色的权限列表
     * @param roleId - 角色 ID
     * @returns 角色权限列表
     */
    async getRolePermissions(roleId) {
        return this.rolePermissionRepository.find({
            where: { roleId },
            relations: ['permission'],
        });
    }
    /**
     * 获取角色的权限树配置
     * @param roleId - 角色 ID
     * @returns 角色权限树配置
     */
    async getRolePermissionTree(roleId) {
        const role = await this.roleRepository.findOne({
            where: { id: roleId },
        });
        if (!role) {
            throw new not_found_exception_1.NotFoundError('角色');
        }
        const rows = await this.entityManager.query(`WITH 
      pond AS(
        SELECT 
          p.id,
          p.permName,
          p.permCode,
          p.permissionType,
          p.nodeType,
          p.parentId,
          p.routePath,
          p.externalUrl,
          p.iconName,
          p.sortOrder,
          p.isCache,
          p.showMode,
          atp.permissionValue AS parentPermissionValue,
          atp.appTypeId
        FROM sys_app_type_permissions atp
        INNER JOIN sys_permissions p ON atp.permissionId = p.id
        LEFT JOIN sys_roles r ON r.appTypeId = atp.appTypeId
        WHERE r.id = ?
      )
      SELECT 
        pond.*,
        IFNULL(rp.permissionValue,0) permissionValue,
        IF(rp.permissionId IS NULL,false,true) checked
      FROM pond
      LEFT JOIN sys_role_permissions rp ON rp.permissionId = pond.id AND rp.roleId = ?`, [roleId, roleId]);
        const pcRows = rows.filter((r) => r.permissionType === permission_entity_1.PermissionType.PC);
        const normalRows = rows.filter((r) => r.permissionType === permission_entity_1.PermissionType.NORMAL);
        const pcTree = this.buildPermissionTreeFromRows(pcRows);
        const normalTree = this.buildPermissionTreeFromRows(normalRows);
        return {
            roleId,
            permissionTrees: {
                pcTree,
                normalTree,
            },
        };
    }
    buildPermissionTreeFromRows(rows) {
        const nodes = rows.map((row) => {
            const { appTypeId, ...rest } = row;
            return {
                ...rest,
                sortOrder: Number(row.sortOrder),
                isVisible: Number(row.isVisible),
                isCache: Number(row.isCache),
                permStatus: Number(row.permStatus),
                isAutoSync: row.isAutoSync != null ? Number(row.isAutoSync) : undefined,
                checked: row.checked == 1,
                permissionValue: row.permissionValue != null ? String(row.permissionValue) : undefined,
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
};
exports.RoleService = RoleService;
exports.RoleService = RoleService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectEntityManager)()),
    __param(1, (0, typeorm_1.InjectRepository)(role_entity_1.Role)),
    __param(2, (0, typeorm_1.InjectRepository)(role_permission_entity_1.RolePermission)),
    __metadata("design:paramtypes", [typeorm_2.EntityManager,
        typeorm_2.Repository,
        typeorm_2.Repository])
], RoleService);
//# sourceMappingURL=role.service.js.map