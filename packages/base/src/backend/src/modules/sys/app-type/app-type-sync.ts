/**
 * @fileoverview 应用类型配置自动同步
 * @description 在服务启动时同步业务应用类型配置到数据库
 */

import { DataSource, EntityManager } from 'typeorm';
import { AppType } from './entities/app-type.entity';
import { Role } from '../../role/entities/role.entity';
import { AppTypeConfig, RoleConfig } from '../../../../types/app-config.types';
import { BUILTIN_APP_TYPES } from '../../../../utils/app-type-validator';

/**
 * 同步应用类型配置到数据库
 * 
 * 同步规则：
 * 1. 只处理业务应用类型（排除 system/admin 内置类型）
 * 2. 已存在的应用类型跳过，但检查并补充缺失的内置角色
 * 3. 使用事务保证数据一致性
 * 4. 处理并发竞争（唯一约束冲突视为已存在）
 */
export async function syncAppTypesConfig(
  dataSource: DataSource,
  appTypes: AppTypeConfig[],
): Promise<void> {
  if (!appTypes || appTypes.length === 0) {
    return;
  }

  const businessAppTypes = appTypes.filter(
    (config) => !BUILTIN_APP_TYPES.includes(config.typeCode)
  );

  if (businessAppTypes.length === 0) {
    return;
  }

  process.stdout.write('🔄 开始同步业务应用类型配置...\n');

  for (const config of businessAppTypes) {
    await syncSingleAppType(dataSource, config);
  }

  process.stdout.write('✅ 业务应用类型配置同步完成\n');
}

/**
 * 同步单个应用类型（使用事务）
 */
async function syncSingleAppType(
  dataSource: DataSource,
  config: AppTypeConfig,
): Promise<void> {
  await dataSource.transaction(async (manager: EntityManager) => {
    const appTypeRepo = manager.getRepository(AppType);
    const roleRepo = manager.getRepository(Role);

    const existingAppType = await appTypeRepo.findOne({
      where: { typeCode: config.typeCode },
    });

    if (existingAppType) {
      process.stdout.write(`  √ 应用类型已存在：${config.typeName} (${config.typeCode})\n`);
      
      if (config.builtinRole && config.builtinRole.length > 0) {
        await syncBuiltinRoles(manager, existingAppType.id, config.builtinRole);
      }
      return;
    }

    try {
      const newAppType = appTypeRepo.create({
        typeName: config.typeName,
        typeCode: config.typeCode,
        typeDesc: config.typeDesc || '',
        icon: config.icon || '',
        multiAppEnabled: config.multiAppEnabled,
        typeStatus: 1,
        sortOrder: 0,
      });

      const savedAppType = await appTypeRepo.save(newAppType);
      process.stdout.write(`  ✓ 创建应用类型：${config.typeName} (${config.typeCode})\n`);

      if (config.builtinRole && config.builtinRole.length > 0) {
        await createBuiltinRoles(manager, savedAppType.id, config.builtinRole);
      }
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY' || error.message?.includes('Duplicate')) {
        process.stdout.write(`  √ 应用类型并发创建冲突：${config.typeName} (${config.typeCode}) - 视为已存在\n`);
        
        const existing = await appTypeRepo.findOne({
          where: { typeCode: config.typeCode },
        });
        if (existing && config.builtinRole && config.builtinRole.length > 0) {
          await syncBuiltinRoles(manager, existing.id, config.builtinRole);
        }
      } else {
        throw error;
      }
    }
  });
}

/**
 * 同步内置角色（补充缺失的角色）
 */
async function syncBuiltinRoles(
  manager: EntityManager,
  appTypeId: string,
  builtinRoles: RoleConfig[],
): Promise<void> {
  const roleRepo = manager.getRepository(Role);

  for (const roleConfig of builtinRoles) {
    const existingRole = await roleRepo.findOne({
      where: { roleCode: roleConfig.roleCode },
    });

    if (existingRole) {
      process.stdout.write(`    √ 内置角色已存在：${roleConfig.roleName} (${roleConfig.roleCode})\n`);
      continue;
    }

    try {
      await roleRepo.save({
        roleName: roleConfig.roleName,
        roleCode: roleConfig.roleCode,
        roleDesc: `${roleConfig.roleName}（内置角色）`,
        appTypeId,
        isBuiltin: 1,
        isOwner: roleConfig.isOwner ?? 0,
        roleStatus: 1,
        sortOrder: 0,
      });
      process.stdout.write(`    ✓ 补充内置角色：${roleConfig.roleName} (${roleConfig.roleCode})\n`);
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY' || error.message?.includes('Duplicate')) {
        process.stdout.write(`    √ 内置角色并发创建冲突：${roleConfig.roleName} (${roleConfig.roleCode}) - 视为已存在\n`);
      } else {
        throw error;
      }
    }
  }
}

/**
 * 创建内置角色（新应用类型）
 */
async function createBuiltinRoles(
  manager: EntityManager,
  appTypeId: string,
  builtinRoles: RoleConfig[],
): Promise<void> {
  const roleRepo = manager.getRepository(Role);

  for (const roleConfig of builtinRoles) {
    try {
      await roleRepo.save({
        roleName: roleConfig.roleName,
        roleCode: roleConfig.roleCode,
        roleDesc: `${roleConfig.roleName}（内置角色）`,
        appTypeId,
        isBuiltin: 1,
        isOwner: roleConfig.isOwner ?? 0,
        roleStatus: 1,
        sortOrder: 0,
      });
      process.stdout.write(`    ✓ 创建内置角色：${roleConfig.roleName} (${roleConfig.roleCode})\n`);
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY' || error.message?.includes('Duplicate')) {
        process.stdout.write(`    √ 内置角色并发创建冲突：${roleConfig.roleName} (${roleConfig.roleCode}) - 视为已存在\n`);
      } else {
        throw error;
      }
    }
  }
}