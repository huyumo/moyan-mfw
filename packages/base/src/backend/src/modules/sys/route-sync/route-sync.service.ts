/**
 * @fileoverview 路由数据自动同步服务
 * @description 在服务启动时根据菜单树配置自动同步：
 *   1. PC 权限到 sys_permissions
 *   2. 权限池到 sys_app_type_permissions（自动全量勾选）
 *   3. 内置角色权限到 sys_role_permissions（自动全量勾选）
 *
 * 使用 SHA256 哈希对比判断是否需要同步，避免每次启动都重复写入。
 */

import { Injectable, Logger } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource, In } from "typeorm";
import * as crypto from "crypto";
import type { AppTypeMenuConfig, MenuNode } from "@internal/base-shared";
import {
  Permission,
  PermissionType,
  NodeType,
} from "../permission/entities/permission.entity";
import { AppType } from "../app-type/entities/app-type.entity";
import { AppTypePermissionEntity } from "../app-type/entities/app-type-permission.entity";
import { Role } from "../role/entities/role.entity";
import { RolePermission } from "../role/entities/role-permission.entity";
import { RouteSyncState } from "./route-sync-state.entity";
import {
  buildPerValue,
  getPermissionValueCache,
} from "@/common/constants/permissions";
import { PermissionValue } from "../permission/entities/permission-value.entity";

/**
 * 扁平化后的路由节点（用于权限同步）。
 */
interface FlatRouteNode {
  path: string;
  name: string;
  /** 所属 AppType 编码（用于区分不同 AppType 的同名路径） */
  appTypeCode: string;
  permCode?: string;
  permissionValue?: bigint;
}

@Injectable()
export class RouteSyncService {
  private readonly logger = new Logger(RouteSyncService.name);

  constructor(
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(AppType)
    private appTypeRepository: Repository<AppType>,
    @InjectRepository(AppTypePermissionEntity)
    private appTypePermissionRepository: Repository<AppTypePermissionEntity>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(RouteSyncState)
    private syncStateRepository: Repository<RouteSyncState>,
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  /**
   * 同步菜单树配置到数据库。
   *
   * 执行流程：
   * 1. 计算配置哈希值
   * 2. 与数据库存储的哈希对比 → 无变化则跳过
   * 3. 同步 PC 权限（sys_permissions）
   * 4. 同步 AppType 权限池（sys_app_type_permissions）
   * 5. 同步内置角色权限（sys_role_permissions）
   * 6. 保存新的哈希值
   *
   * @param menuTrees - 应用类型菜单树配置数组
   * @returns 同步结果摘要
   */
  async syncMenuTrees(menuTrees: AppTypeMenuConfig[]): Promise<{
    skipped: boolean;
    syncedAppTypes: string[];
    permissionCount: number;
    poolCount: number;
    rolePermCount: number;
  }> {
    // 1. 计算配置哈希
    const newHash = this.computeHash(menuTrees);

    this.logger.log(`菜单树配置哈希: ${newHash}`);

    // 2. 检查是否需要同步
    const skipSync = await this.shouldSkipSync(menuTrees, newHash);
    if (skipSync) {
      this.logger.log("菜单树配置未变更，跳过同步");
      return {
        skipped: true,
        syncedAppTypes: [],
        permissionCount: 0,
        poolCount: 0,
        rolePermCount: 0,
      };
    }

    this.logger.log("检测到菜单树配置变更，开始同步...");

    const syncedAppTypes: string[] = [];
    let totalPermissionCount = 0;
    let totalPoolCount = 0;
    let totalRolePermCount = 0;

    // 在事务中执行完整同步
    await this.dataSource.transaction(async (manager) => {
      // 3. 同步 PC 权限
      const permResult = await this.syncPcPermissions(menuTrees, manager);
      totalPermissionCount =
        permResult.created + permResult.updated + permResult.deleted;

      // 4. 同步各 AppType 的权限池
      for (const appTypeConfig of menuTrees) {
        const appType = await this.appTypeRepository.findOne({
          where: { typeCode: appTypeConfig.appTypeCode },
        });

        if (!appType) {
          this.logger.warn(
            `应用类型 "${appTypeConfig.appTypeCode}" 不存在，跳过权限池和角色权限同步`,
          );
          continue;
        }

        syncedAppTypes.push(appTypeConfig.appTypeCode);

        // 同步权限池
        const poolCount = await this.syncAppTypePermissionPool(
          appType.id,
          appTypeConfig,
          manager,
        );
        totalPoolCount += poolCount;

        // 同步内置角色权限
        const rolePermCount = await this.syncBuiltinRolePermissions(
          appType.id,
          appTypeConfig,
          manager,
        );
        totalRolePermCount += rolePermCount;
      }

      // 6. 保存哈希值
      for (const appTypeConfig of menuTrees) {
        await this.saveSyncState(appTypeConfig.appTypeCode, newHash, manager);
      }
    });

    this.logger.log(
      `菜单树同步完成：${syncedAppTypes.length} 个应用类型，` +
        `${totalPermissionCount} 个权限变动，` +
        `${totalPoolCount} 个权限池记录，` +
        `${totalRolePermCount} 个角色权限记录`,
    );

    return {
      skipped: false,
      syncedAppTypes,
      permissionCount: totalPermissionCount,
      poolCount: totalPoolCount,
      rolePermCount: totalRolePermCount,
    };
  }

  /**
   * 计算菜单树配置的 SHA256 哈希值。
   *
   * 使用 JSON.stringify 序列化（固定 key 排序），确保相同配置产生相同哈希。
   */
  private computeHash(menuTrees: AppTypeMenuConfig[]): string {
    const sorted = menuTrees.map((tree) => ({
      appTypeCode: tree.appTypeCode,
      label: tree.label,
      icon: tree.icon,
      order: tree.order,
      children: this.sortNodes(tree.children),
    }));
    const normalized = JSON.stringify(sorted);
    return crypto.createHash("sha256").update(normalized).digest("hex");
  }

  /**
   * 递归排序菜单节点（确保 JSON 序列化稳定）。
   */
  private sortNodes(nodes: MenuNode[]): any[] {
    return nodes
      .map((node) => ({
        path: node.path,
        name: node.name,
        icon: node.icon,
        order: node.order,
        hidden: node.hidden,
        auth: node.auth,
        permissions: node.permissions
          ? [...node.permissions].sort()
          : undefined,
        permCode: node.permCode,
        children: node.children ? this.sortNodes(node.children) : undefined,
      }))
      .sort((a, b) => a.path.localeCompare(b.path));
  }

  /**
   * 检查是否应该跳过同步。
   * 所有 AppType 的哈希都未变化时才跳过。
   */
  private async shouldSkipSync(
    menuTrees: AppTypeMenuConfig[],
    newHash: string,
  ): Promise<boolean> {
    if (menuTrees.length === 0) return true;

    // 检查是否存在未同步过的 AppType
    const appTypeCodes = menuTrees.map((t) => t.appTypeCode);
    const existingStates = await this.syncStateRepository.find({
      where: { appTypeCode: In(appTypeCodes) },
    });

    if (existingStates.length < appTypeCodes.length) {
      // 存在新 AppType，需要同步
      return false;
    }

    // 但全局哈希变了也要同步（即使每个 AppType 的哈希都可能不同）
    // 这里使用全局哈希判断：任一 AppType 的独立配置变更都需要全量同步
    const globalHash = newHash;

    // 检查是否有任一 AppType 的哈希发生变化
    for (const state of existingStates) {
      if (state.configHash !== globalHash) {
        return false;
      }
    }

    return true;
  }

  /**
   * 保存同步状态。
   */
  private async saveSyncState(
    appTypeCode: string,
    hash: string,
    manager: any,
  ): Promise<void> {
    const repo = manager.getRepository(RouteSyncState);
    let state = await repo.findOne({ where: { appTypeCode } });
    if (!state) {
      state = repo.create({
        appTypeCode,
        configHash: hash,
        syncedAt: new Date(),
      });
    } else {
      state.configHash = hash;
      state.syncedAt = new Date();
    }
    await repo.save(state);
  }

  // ==================== PC 权限同步 ====================

  /**
   * 同步 PC 权限到 sys_permissions 表。
   *
   * 1. 确保 pc_root 根节点存在
   * 2. 从菜单树扁平化所有节点
   * 3. 生成 permCode（优先使用自定义 permCode，否则自动生成）
   * 4. 清除不在新配置中的 isAutoSync=1 的权限
   * 5. Upsert 权限节点
   */
  private async syncPcPermissions(
    menuTrees: AppTypeMenuConfig[],
    manager: any,
  ): Promise<{ created: number; updated: number; deleted: number }> {
    const permRepo = manager.getRepository(Permission);

    // 确保 pc_root 存在
    await this.ensurePcRoot(manager);

    // 扁平化所有菜单节点，生成路由节点列表
    const permValueMap = await this.loadPermissionValueMap(manager);
    const flatRoutes = this.flattenMenuTrees(menuTrees, permValueMap);

    // 构建新配置的 permCode 集合
    const newPermCodes = new Set(
      flatRoutes.map(
        (r) =>
          r.permCode || this.generatePermCode(r.path, r.appTypeCode),
      ),
    );

    // 构建 (appTypeCode, path) → permCode 的映射（用于父节点查找）
    const keyToPermCode = new Map<string, string>();
    for (const route of flatRoutes) {
      const code =
        route.permCode || this.generatePermCode(route.path, route.appTypeCode);
      const key = `${route.appTypeCode}:${route.path}`;
      keyToPermCode.set(key, code);
    }

    // 构建所有路由路径集合（用于判断 nodeType）
    const allRoutePaths = new Set(flatRoutes.map((r) => r.path));

    // 清除不再存在的自动同步权限
    const deletedCount = await this.clearObsoleteAutoSyncPermissions(
      newPermCodes,
      manager,
    );

    let created = 0;
    let updated = 0;

    // 按路径深度排序（父节点优先）
    flatRoutes.sort((a, b) => {
      const depthA = a.path.split("/").filter(Boolean).length;
      const depthB = b.path.split("/").filter(Boolean).length;
      return depthA - depthB;
    });

    // Upsert 每个路由节点
    for (const route of flatRoutes) {
      const permCode =
        route.permCode ||
        this.generatePermCode(route.path, route.appTypeCode);
      const pathSegments = route.path.split("/").filter(Boolean);
      const depth = pathSegments.length;

      // 确定父节点（按 AppType 区分）
      let parentId: string | null = null;
      if (depth === 1) {
        const pcRoot = await permRepo.findOne({
          where: { permCode: "pc_root" },
        });
        parentId = pcRoot?.id || null;
      } else {
        const parentPath = "/" + pathSegments.slice(0, -1).join("/");
        const parentKey = `${route.appTypeCode}:${parentPath}`;
        const parentCode = keyToPermCode.get(parentKey);
        if (parentCode) {
          const parent = await permRepo.findOne({
            where: { permCode: parentCode },
          });
          parentId = parent?.id || null;
        }
      }

      // 判断 nodeType
      const hasChildRoutes = Array.from(allRoutePaths).some(
        (p) => p.startsWith(route.path + "/") && p !== route.path,
      );
      const nodeType = hasChildRoutes ? NodeType.MENU : NodeType.PAGE;

      // 解析 permissionValue
      const permissionValue = route.permissionValue || 0n;

      // 查找是否存在
      const existing = await permRepo.findOne({ where: { permCode } });

      if (existing) {
        // 更新现有权限
        await permRepo.update(existing.id, {
          permName: route.name,
          routePath: route.path,
          nodeType,
          parentId: parentId || undefined,
          permissionValue: nodeType === NodeType.PAGE ? permissionValue : 0n,
          isAutoSync: 1,
          permStatus: 1,
        });
        updated++;
      } else {
        // 新增权限
        await permRepo.save(
          permRepo.create({
            permName: route.name,
            permCode,
            permDesc: `自动同步生成：${route.name}`,
            permissionType: PermissionType.PC,
            nodeType,
            parentId: parentId || undefined,
            routePath: route.path,
            sortOrder: depth * 10,
            isAutoSync: 1,
            permStatus: 1,
            permissionValue: nodeType === NodeType.PAGE ? permissionValue : 0n,
          }),
        );
        created++;
      }
    }

    this.logger.log(
      `PC 权限同步完成：新增 ${created}，更新 ${updated}，删除 ${deletedCount}`,
    );

    return { created, updated, deleted: deletedCount };
  }

  /**
   * 从菜单树配置扁平化所有节点。
   *
   * @param menuTrees - 菜单树配置
   * @param permValueMap - 权限名称 → bitValue 映射（从 sys_permission_values 表加载）
   */
  private flattenMenuTrees(
    menuTrees: AppTypeMenuConfig[],
    permValueMap: Map<string, bigint> = new Map(),
  ): FlatRouteNode[] {
    const result: FlatRouteNode[] = [];

    const flatten = (
      nodes: MenuNode[],
      appTypeCode: string,
      parentPath: string = "",
    ) => {
      for (const node of nodes) {
        const fullPath = parentPath
          ? `/${parentPath}/${node.path}`.replace(/^\/\//, "/")
          : `/${node.path}`;

        // 使用 permCode 或自动生成时拼上 appTypeCode
        const permCode = node.permCode || undefined;

        // 从数据库权限值映射计算 permissionValue（不依赖运行时缓存）
        let permissionValue: bigint | undefined;
        if (
          node.permissions &&
          node.permissions.length > 0 &&
          permValueMap.size > 0
        ) {
          permissionValue = 0n;
          for (const name of node.permissions) {
            const bit = permValueMap.get(name);
            if (bit !== undefined) {
              permissionValue |= bit;
            }
          }
        }

        result.push({
          path: fullPath,
          name: node.name,
          appTypeCode,
          permCode,
          permissionValue,
        });

        if (node.children && node.children.length > 0) {
          flatten(node.children, appTypeCode, fullPath.replace(/^\//, ""));
        }
      }
    };

    for (const tree of menuTrees) {
      flatten(tree.children, tree.appTypeCode);
    }

    return result;
  }

  /**
   * 确保 PC 根节点存在。
   */
  private async ensurePcRoot(manager: any): Promise<void> {
    const permRepo = manager.getRepository(Permission);
    const pcRoot = await permRepo.findOne({ where: { permCode: "pc_root" } });

    if (!pcRoot) {
      await permRepo.save(
        permRepo.create({
          permName: "PC 权限根节点",
          permCode: "pc_root",
          permDesc: "PC 权限系统的根节点",
          permissionType: PermissionType.PC,
          nodeType: NodeType.MENU,
          parentId: null,
          sortOrder: 0,
          isVisible: 0,
          isAutoSync: 0,
          permStatus: 1,
          permissionValue: 0n,
        }),
      );
      this.logger.log("已创建 PC 权限根节点 (pc_root)");
    }
  }

  /**
   * 从数据库加载权限值映射（名称 → bitValue）。
   *
   * 直接查询 sys_permission_values 表，不依赖运行时缓存，
   * 确保 RouteSyncService 在任何场景下都能正确计算 permissionValue。
   */
  private async loadPermissionValueMap(
    manager: any,
  ): Promise<Map<string, bigint>> {
    const map = new Map<string, bigint>();
    const values: { name: string; bit_value: string }[] = await manager.query(
      `SELECT name, bit_value FROM sys_permission_values WHERE status = 1`,
    );
    for (const v of values) {
      map.set(v.name, BigInt(v.bit_value));
    }
    this.logger.log(
      `从数据库加载了 ${map.size} 个权限值映射`,
    );
    return map;
  }

  /**
   * 生成权限编码。
   * 格式：pc_root:{appTypeCode}:{path:colon:separated}
   *
   * 每个 AppType 拥有独立的 permCode 命名空间，确保不同 AppType 的同名路径
   * （如 /dashboard）生成不同的权限编码。
   */
  private generatePermCode(path: string, appTypeCode: string): string {
    const cleanPath = path.replace(/^\//, "").replace(/\//g, ":");
    return `pc_root:${appTypeCode}:${cleanPath || "root"}`;
  }

  /**
   * 清除不在新配置中的自动同步权限。
   */
  private async clearObsoleteAutoSyncPermissions(
    newPermCodes: Set<string>,
    manager: any,
  ): Promise<number> {
    const permRepo = manager.getRepository(Permission);

    // 获取所有 isAutoSync=1 的 PC 权限
    const autoSyncPerms = await permRepo.find({
      where: {
        permissionType: PermissionType.PC,
        isAutoSync: 1,
      },
      select: ["id", "permCode"],
    });

    // 找出需要删除的
    const permsToDelete = autoSyncPerms.filter(
      (p: { id: string; permCode: string }) => !newPermCodes.has(p.permCode),
    );

    if (permsToDelete.length === 0) return 0;

    // 按深度从深到浅排序
    const sortedPerms = [...permsToDelete].sort((a, b) => {
      const depthA = a.permCode.split(":").length;
      const depthB = b.permCode.split(":").length;
      return depthB - depthA;
    });

    // 逐个删除
    for (const perm of sortedPerms) {
      await manager.query(
        `DELETE FROM sys_role_permissions WHERE permissionId = ?`,
        [perm.id],
      );
      await manager.query(
        `DELETE FROM sys_app_type_permissions WHERE permissionId = ?`,
        [perm.id],
      );
      await permRepo.delete(perm.id);
    }

    if (sortedPerms.length > 0) {
      this.logger.log(`已清除 ${sortedPerms.length} 个过期的自动同步权限`);
    }

    return sortedPerms.length;
  }

  // ==================== 权限池同步 ====================

  /**
   * 同步 AppType 的权限池（sys_app_type_permissions）。
   *
   * 仅勾选属于该 AppType 的同步权限（通过 permCode 中的 appTypeCode 前缀过滤）。
   * permCode 格式：pc_root:{appTypeCode}:{path}
   */
  private async syncAppTypePermissionPool(
    appTypeId: string,
    appTypeConfig: AppTypeMenuConfig,
    manager: any,
  ): Promise<number> {
    const poolRepo = manager.getRepository(AppTypePermissionEntity);
    const permRepo = manager.getRepository(Permission);
    const appTypeCode = appTypeConfig.appTypeCode;

    // 仅查询属于该 AppType 的同步 PC 权限
    // permCode 格式：pc_root:system:dashboard 等
    const prefix = `pc_root:${appTypeCode}:`;
    const autoSyncPerms = await manager.query(
      `SELECT id, permissionValue FROM sys_permissions 
       WHERE permissionType = 'PC' AND isAutoSync = 1 
       AND permCode LIKE ?`,
      [`${prefix}%`],
    );

    if (autoSyncPerms.length === 0) {
      this.logger.log(
        `应用类型 "${appTypeCode}" 没有可用的同步权限，跳过权限池同步`,
      );
      return 0;
    }

    // 删除旧的权限池记录（仅该 AppType）
    await poolRepo.delete({ appTypeId });

    // 全量插入
    const entities = autoSyncPerms.map(
      (perm: { id: string; permissionValue: bigint }) =>
        poolRepo.create({
          appTypeId,
          permissionId: perm.id,
          permissionValue: perm.permissionValue || 0n,
        }),
    );

    if (entities.length > 0) {
      await poolRepo.save(entities);
    }

    this.logger.log(
      `应用类型 "${appTypeCode}" 权限池同步完成：${entities.length} 条记录`,
    );

    return entities.length;
  }

  // ==================== 内置角色权限同步 ====================

  /**
   * 同步内置角色的权限（sys_role_permissions）。
   *
   * 对每个内置角色，自动全量勾选其 AppType 权限池中的所有权限。
   * Owner 角色获取全部操作权限。
   */
  private async syncBuiltinRolePermissions(
    appTypeId: string,
    appTypeConfig: AppTypeMenuConfig,
    manager: any,
  ): Promise<number> {
    const roleRepo = manager.getRepository(Role);
    const rolePermRepo = manager.getRepository(RolePermission);

    // 查询该 AppType 的内置角色
    const builtinRoles = await roleRepo.find({
      where: {
        appTypeId,
        isBuiltin: 1,
      },
    });

    if (builtinRoles.length === 0) {
      this.logger.log(
        `应用类型 "${appTypeConfig.appTypeCode}" 没有内置角色，跳过角色权限同步`,
      );
      return 0;
    }

    // 查询权限池中的权限
    const poolPerms = await manager
      .getRepository(AppTypePermissionEntity)
      .find({
        where: { appTypeId },
        relations: ["permission"],
      });

    let totalCount = 0;

    for (const role of builtinRoles) {
      // 删除旧的角色权限
      await rolePermRepo.delete({ roleId: role.id });

      // 全量插入
      const entities = poolPerms.map(
        (pool: { permissionId: string; permissionValue: bigint }) =>
          rolePermRepo.create({
            roleId: role.id,
            permissionId: pool.permissionId,
            permissionValue: pool.permissionValue || 0n,
          }),
      );

      if (entities.length > 0) {
        await rolePermRepo.save(entities);
      }

      totalCount += entities.length;
      this.logger.log(
        `内置角色 "${role.roleName}" 权限同步完成：${entities.length} 条记录`,
      );
    }

    return totalCount;
  }
}
