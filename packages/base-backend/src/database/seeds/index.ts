/**
 * @fileoverview 数据库种子数据执行脚本
 * @description 执行所有种子数据，初始化系统基础数据
 */

import { DataSource } from 'typeorm';
import { AppType } from '../../modules/sys/app-type/entities/app-type.entity';
import { App } from '../../modules/sys/app/entities/app.entity';
import { Permission, NodeType, ShowMode, PermissionType } from '../../modules/sys/permission/entities/permission.entity';
import { Role } from '../../modules/sys/role/entities/role.entity';
import { User } from '../../modules/sys/user/entities/user.entity';
import { UserRole } from '../../modules/sys/role/entities/user-role.entity';
import { RolePermission } from '../../modules/sys/permission/entities/role-permission.entity';
import { hashPassword } from '../../common/utils/encrypt';
import { buildPerValue } from '../../common/constants/permissions';
import { AppTypePermissionEntity } from '../../modules/sys/app-type/entities/app-type-permission.entity';
import { AppMember } from '../../modules/sys/app/entities/app-member.entity';

/**
 * 种子数据执行函数
 *
 * 执行顺序：
 * 1. 应用类型 → 2. 用户 → 3. 权限 → 4. 角色 → 5. 应用实例 → 6. 权限池 → 7. 角色权限 → 8. 拥有者绑定
 */
export async function runSeeds(dataSource: DataSource, adminPassword?: string): Promise<void> {
  process.stdout.write('🌱 开始执行种子数据...\n');

  // 1. 初始化应用类型
  await seedAppTypes(dataSource);

  // 2. 初始化管理员账号（先创建用户，为后续依赖做准备）
  await seedAdminUser(dataSource, adminPassword);

  // 3. 初始化权限（基础 PC 权限）
  await seedPermissions(dataSource);

  // 4. 初始化角色（内置角色绑定 appTypeId）
  await seedRoles(dataSource);

  // 5. 初始化应用实例（依赖 admin 用户和已创建的角色）
  await seedAppInstances(dataSource);

  // 6. 配置权限池
  await seedPermissionPool(dataSource);

  // 7. 分配角色权限
  await seedRolePermissions(dataSource);

  // 8. 绑定拥有者（sys_user_app + sys_user_role）
  await seedAppMembers(dataSource);

  process.stdout.write('\n✅ 种子数据执行完成！\n');
}

/**
 * 1. 初始化应用类型（严格按照文档要求）
 */
async function seedAppTypes(dataSource: DataSource): Promise<void> {
  process.stdout.write('  📦 初始化应用类型...');

  const appTypes = [{
    typeName: '系统管理',
    typeCode: 'system',
    typeDesc: '系统内置应用类型，用于系统管理功能',
    icon: 'SettingOutlined',
    multiAppEnabled: 0,
    typeStatus: 1,
    sortOrder: 0,
  }];

  for (const appType of appTypes) {
    const exists = await dataSource.manager.findOne(AppType, { where: { typeCode: appType.typeCode } });
    if (!exists) {
      await dataSource.manager.save(AppType, appType);
      process.stdout.write(`    ✓ 创建应用类型：${appType.typeName} (typeCode: ${appType.typeCode})`);
    } else {
      process.stdout.write(`    √ 应用类型已存在：${appType.typeName} (typeCode: ${appType.typeCode})`);
    }
  }
}

/**
 * 2. 初始化权限（严格按文档要求创建 2 个根节点）
 * - PC 权限根节点
 * - 普通权限根节点
 */
async function seedPermissions(dataSource: DataSource): Promise<void> {
  process.stdout.write('  🔐 初始化权限...');

  // 1. 创建 PC 权限根节点
  const pcRootPerm = await dataSource.manager.findOne(Permission, {
    where: { permCode: 'pc_root', permissionType: PermissionType.PC }
  });
  let pcRootId: string;

  if (!pcRootPerm) {
    const pcRoot = dataSource.manager.create(Permission);
    pcRoot.permName = 'PC 权限根节点';
    pcRoot.permCode = 'pc_root';
    pcRoot.permDesc = 'PC 权限系统的根节点，所有 PC 权限的父节点';
    pcRoot.permissionType = PermissionType.PC;
    pcRoot.nodeType = NodeType.MENU;
    pcRoot.parentId = null as any;
    pcRoot.routePath = '';
    pcRoot.iconName = '';
    pcRoot.sortOrder = 0;
    pcRoot.isVisible = 0; // 根节点不在菜单中显示
    pcRoot.isCache = 0;
    pcRoot.showMode = ShowMode.NORMAL;
    pcRoot.permStatus = 1;
    pcRoot.permissionValue = 0n;
    pcRoot.isAutoSync = 0;

    const saved = await dataSource.manager.save(pcRoot);
    pcRootId = saved.id;
    process.stdout.write(`    ✓ 创建 PC 权限根节点：${pcRoot.permName} (ID: ${pcRootId})`);
  } else {
    pcRootId = pcRootPerm.id;
    process.stdout.write(`    √ PC 权限根节点已存在：${pcRootPerm.permName} (ID: ${pcRootId})`);
  }

  // 2. 创建普通权限根节点
  const normalRootPerm = await dataSource.manager.findOne(Permission, {
    where: { permCode: 'normal_root', permissionType: PermissionType.NORMAL }
  });
  let normalRootId: string;

  if (!normalRootPerm) {
    const normalRoot = dataSource.manager.create(Permission);
    normalRoot.permName = '普通权限根节点';
    normalRoot.permCode = 'normal_root';
    normalRoot.permDesc = '普通权限系统的根节点，所有普通权限的父节点';
    normalRoot.permissionType = PermissionType.NORMAL;
    normalRoot.nodeType = NodeType.MENU;
    normalRoot.parentId = null as any;
    normalRoot.routePath = '';
    normalRoot.iconName = '';
    normalRoot.sortOrder = 0;
    normalRoot.isVisible = 0; // 根节点不在菜单中显示
    normalRoot.isCache = 0;
    normalRoot.showMode = ShowMode.NORMAL;
    normalRoot.permStatus = 1;
    normalRoot.permissionValue = 0n;
    normalRoot.isAutoSync = 0;

    const saved = await dataSource.manager.save(normalRoot);
    normalRootId = saved.id;
    process.stdout.write(`    ✓ 创建普通权限根节点：${normalRoot.permName} (ID: ${normalRootId})`);
  } else {
    normalRootId = normalRootPerm.id;
    process.stdout.write(`    √ 普通权限根节点已存在：${normalRootPerm.permName} (ID: ${normalRootId})`);
  }

  // 3. 创建 PC 权限子节点（根据前端实际路由配置）
  // 前端路由：/sys/user, /sys/role, /sys/app, /sys/app-type, /sys/permission, /sys/permission-pc, /sys/member, /sys/audit-log
  const pcPermissions = [
    // 首页（只读）
    {
      permName: '首页',
      permCode: 'pc_root:dashboard',
      nodeType: NodeType.PAGE,
      routePath: '/dashboard',
      iconName: 'DataBoard',
      permissionValue: buildPerValue(['查看']),
    },
    // 系统管理模块（菜单分组）
    {
      permName: '系统管理',
      permCode: 'pc_root:sys',
      nodeType: NodeType.MENU,
      routePath: '/sys',
      iconName: 'Setting',
    },
    // 用户管理（页面）
    {
      permName: '用户管理',
      permCode: 'pc_root:sys:user',
      nodeType: NodeType.PAGE,
      routePath: '/sys/user',
      iconName: 'User',
      permissionValue: buildPerValue(['查看', '添加', '编辑', '删除']),
    },
    // 角色管理（页面）
    {
      permName: '角色管理',
      permCode: 'pc_root:sys:role',
      nodeType: NodeType.PAGE,
      routePath: '/sys/role',
      iconName: 'UserFilled',
      permissionValue: buildPerValue(['查看', '添加', '编辑', '删除']),
    },
    // 应用管理（页面）
    {
      permName: '应用管理',
      permCode: 'pc_root:sys:app',
      nodeType: NodeType.PAGE,
      routePath: '/sys/app',
      iconName: 'Application',
      permissionValue: buildPerValue(['查看', '添加', '编辑', '删除']),
    },
    // 应用类型管理（只读 + 编辑）
    {
      permName: '应用类型管理',
      permCode: 'pc_root:sys:app-type',
      nodeType: NodeType.PAGE,
      routePath: '/sys/app-type',
      iconName: 'Grid',
      permissionValue: buildPerValue(['查看', '编辑']),
    },
    // 成员管理（添加、编辑、删除成员）
    {
      permName: '成员管理',
      permCode: 'pc_root:sys:member',
      nodeType: NodeType.PAGE,
      routePath: '/sys/member',
      iconName: 'Avatar',
      permissionValue: buildPerValue(['查看', '添加', '编辑', '删除']),
    },
    // 权限管理（页面）
    {
      permName: '权限管理',
      permCode: 'pc_root:sys:permission',
      nodeType: NodeType.PAGE,
      routePath: '/sys/permission',
      iconName: 'Lock',
      permissionValue: buildPerValue(['查看', '添加', '编辑', '删除']),
    },
    // PC 权限管理（页面）
    {
      permName: 'PC 权限管理',
      permCode: 'pc_root:sys:permission-pc',
      nodeType: NodeType.PAGE,
      routePath: '/sys/permission-pc',
      iconName: 'Monitor',
      permissionValue: buildPerValue(['查看', '添加', '编辑', '删除']),
    },
    // 审计日志（页面）
    {
      permName: '审计日志',
      permCode: 'pc_root:sys:audit-log',
      nodeType: NodeType.PAGE,
      routePath: '/sys/audit-log',
      iconName: 'Document',
      permissionValue: buildPerValue(['查看']),
    },
  ];

  for (const permData of pcPermissions) {
    const exists = await dataSource.manager.findOne(Permission, {
      where: { permCode: permData.permCode }
    });

    if (!exists) {
      // 确定父节点
      let parentId: string | null = null;
      // 移除 pc_root: 前缀，获取路径段
      const permCodeWithoutPrefix = permData.permCode.replace('pc_root:', '');
      const pathSegments = permCodeWithoutPrefix.split(':');

      if (pathSegments.length > 1) {
        // 构建父节点编码
        const parentCodeSuffix = pathSegments.slice(0, -1).join(':');
        const parentCode = `pc_root:${parentCodeSuffix}`;
        const parent = await dataSource.manager.findOne(Permission, {
          where: { permCode: parentCode }
        });
        parentId = parent?.id || null;
      } else {
        parentId = pcRootId;
      }

      const perm = dataSource.manager.create(Permission);
      perm.permName = permData.permName;
      perm.permCode = permData.permCode;
      perm.permDesc = `${permData.permName}权限节点`;
      perm.permissionType = PermissionType.PC;
      perm.nodeType = permData.nodeType;
      perm.parentId = parentId;
      perm.routePath = permData.routePath || '';
      perm.iconName = permData.iconName || '';
      perm.sortOrder = 0;
      perm.isVisible = 1;
      perm.isCache = 1;
      perm.showMode = ShowMode.NORMAL;
      perm.permStatus = 1;
      perm.permissionValue = permData.permissionValue || 0n;
      perm.isAutoSync = 0;

      await dataSource.manager.save(perm);
      process.stdout.write(`    ✓ 创建 PC 权限子节点：${permData.permName}`);
    } else {
      // 权限已存在，更新为 isAutoSync=0（标记为种子数据权限，同步时不删除）
      await dataSource.manager.update(Permission, exists.id, {
        isAutoSync: 0,
        permName: permData.permName,
        permDesc: `${permData.permName}权限节点`,
        permissionType: PermissionType.PC,
        nodeType: permData.nodeType,
        routePath: permData.routePath || '',
        iconName: permData.iconName || '',
        isVisible: 1,
        isCache: 1,
        showMode: ShowMode.NORMAL,
        permStatus: 1,
        permissionValue: permData.permissionValue || exists.permissionValue,
      });
      process.stdout.write(`    √ PC 权限子节点已存在：${permData.permName} (更新 isAutoSync=0)`);
    }
  }

  process.stdout.write(`\n  📊 权限初始化完成：`);
  process.stdout.write(`    - PC 权限根节点 ID: ${pcRootId}`);
  process.stdout.write(`    - 普通权限根节点 ID: ${normalRootId}`);
}

/**
 * 3. 初始化角色（绑定 appTypeId）
 */
async function seedRoles(dataSource: DataSource): Promise<void> {
  process.stdout.write('  👥 初始化角色...');

  // 获取 system 应用类型 ID
  const systemAppType = await dataSource.manager.findOne(AppType, {
    where: { typeCode: 'system' },
  });

  if (!systemAppType) {
    process.stdout.write('    ⚠️ 应用类型未创建，跳过角色初始化\n');
    return;
  }

  const roles = [
    {
      id: 'a2b83a1e-b1b9-4a19-b587-2f110ee56ae9', // 固定 UUID，与权限守卫匹配
      roleName: '超级管理员',
      roleCode: 'super_admin',
      roleDesc: '系统超级管理员，拥有所有权限',
      appId: undefined,
      appTypeId: systemAppType.id, // 绑定应用类型 ID
      isBuiltin: 1,
      isOwner: 1,
      roleStatus: 1,
      sortOrder: 0,
    },
  ];

  for (const role of roles) {
    const exists = await dataSource.manager.findOne(Role, { where: { roleCode: role.roleCode } });
    if (!exists) {
      await dataSource.manager.save(Role, {
        id: role.id,
        roleName: role.roleName,
        roleCode: role.roleCode,
        roleDesc: role.roleDesc,
        appId: role.appId,
        appTypeId: role.appTypeId,
        isBuiltin: role.isBuiltin,
        isOwner: role.isOwner,
        roleStatus: role.roleStatus,
        sortOrder: role.sortOrder,
      });
      process.stdout.write(`    ✓ 创建角色：${role.roleName} (ID: ${role.id})\n`);
    } else {
      // 更新现有角色的 appTypeId（修复旧种子数据的绑定问题）
      await dataSource.manager.update(Role, exists.id, {
        appTypeId: role.appTypeId,
        isBuiltin: role.isBuiltin,
        isOwner: role.isOwner,
        roleDesc: role.roleDesc,
      });
      process.stdout.write(`    ✓ 更新角色：${role.roleName} (ID: ${exists.id}, appTypeId: ${role.appTypeId})\n`);
    }
  }
}

/**
 * 4. 初始化管理员账号
 */
async function seedAdminUser(dataSource: DataSource, adminPassword?: string): Promise<void> {
  process.stdout.write('  👤 初始化管理员账号...');

  const users = [
    {
      username: 'admin',
      password: adminPassword || 'Admin@123', // 初始密码
      nickname: '超级管理员',
      phone: undefined,
      email: 'admin@example.com',
      avatar: undefined,
      gender: 0,
      userStatus: 1,
      isDeveloper: 0,
    },
  ];

  for (const user of users) {
    const exists = await dataSource.manager.findOne(User, { where: { username: user.username } });
    if (!exists) {
      const hashedPassword = await hashPassword(user.password);
      await dataSource.manager.save(User, {
        username: user.username,
        nickname: user.nickname,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        gender: user.gender,
        userStatus: user.userStatus,
        isDeveloper: user.isDeveloper,
        password: hashedPassword,
      });
      process.stdout.write(`    ✓ 创建用户：${user.username} (密码：${user.password})`);
    } else {
      process.stdout.write(`    √ 用户已存在：${user.username}`);
    }
  }
}

/**
 * 7. 绑定角色权限
 */
async function seedRolePermissions(dataSource: DataSource): Promise<void> {
  process.stdout.write('  🔗 绑定角色权限...');

  // 获取超级管理员角色
  const superAdminRole = await dataSource.manager.findOne(Role, { where: { roleCode: 'super_admin' } });

  // 获取所有权限
  const allPermissions = await dataSource.manager.find(Permission);

  if (!superAdminRole) {
    process.stdout.write('    ⚠️ 超级管理员角色未创建，跳过权限绑定');
    return;
  }

  if (allPermissions.length === 0) {
    process.stdout.write('    ⚠️ 权限未创建，跳过权限绑定');
    return;
  }

  // 超级管理员拥有所有权限
  const superAdminPerms = allPermissions.map((p) => ({
    roleId: superAdminRole.id,
    permissionId: p.id,
    permissionValue: p.permissionValue || 0n,
  }));

  for (const perm of superAdminPerms) {
    const exists = await dataSource.manager.findOne(RolePermission, {
      where: { roleId: perm.roleId, permissionId: perm.permissionId },
    });
    if (!exists) {
      await dataSource.manager.save(RolePermission, { ...perm, createdAt: new Date() });
    }
  }
  process.stdout.write(`    ✓ 超级管理员绑定 ${superAdminPerms.length} 个权限\n`);
}

/**
 * 7. 初始化应用实例
 */
async function seedAppInstances(dataSource: DataSource): Promise<void> {
  process.stdout.write('  📱 初始化应用实例...');

  const systemAppType = await dataSource.manager.findOne(AppType, {
    where: { typeCode: 'system' },
  });
  const adminUser = await dataSource.manager.findOne(User, {
    where: { username: 'admin' },
  });

  if (!systemAppType || !adminUser) {
    process.stdout.write('    ⚠️ 应用类型或用户未完全创建，跳过应用实例初始化\n');
    return;
  }

  const appInstances = [{
    appName: '系统管理后台',
    appCode: 'system-instance',  // 与文档一致
    appTypeId: systemAppType.id,
    ownerId: adminUser.id,
    appStatus: 1,
    icon: 'SettingOutlined',
  }];

  for (const app of appInstances) {
    const existing = await dataSource.manager.findOne(App, {
      where: { appCode: app.appCode },
    });
    if (!existing) {
      await dataSource.manager.save(App, app);
      process.stdout.write(`    ✓ 创建应用实例：${app.appName} (appCode: ${app.appCode})\n`);
    } else {
      process.stdout.write(`    √ 应用实例已存在：${app.appName} (appCode: ${app.appCode})\n`);
    }
  }
}

/**
 * 8. 配置权限池
 */
async function seedPermissionPool(dataSource: DataSource): Promise<void> {
  process.stdout.write('  🔒 配置权限池...');

  const systemAppType = await dataSource.manager.findOne(AppType, {
    where: { typeCode: 'system' },
  });

  if (!systemAppType) {
    process.stdout.write('    ⚠️ 应用类型未创建，跳过权限池配置\n');
    return;
  }

  const allPermissions = await dataSource.manager.find(Permission, {
    where: { permissionType: PermissionType.PC },
  });

  if (allPermissions.length === 0) {
    process.stdout.write('    ⚠️ 权限未创建，跳过权限池配置\n');
    return;
  }

  // 为每个权限创建权限池记录
  let createdCount = 0;
  for (const perm of allPermissions) {
    const exists = await dataSource.manager.findOne(AppTypePermissionEntity, {
      where: {
        appTypeId: systemAppType.id,
        permissionId: perm.id,
      },
    });

    if (!exists) {
      await dataSource.manager.save(AppTypePermissionEntity, {
        appTypeId: systemAppType.id,
        permissionId: perm.id,
        permissionValue: perm.permissionValue || 0n,
      });
      createdCount++;
    }
  }

  process.stdout.write(`    ✓ 配置 ${allPermissions.length} 个权限到权限池（新增 ${createdCount} 个）\n`);
}

/**
 * 9. 绑定拥有者（sys_app_members + sys_user_role）
 */
async function seedAppMembers(dataSource: DataSource): Promise<void> {
  process.stdout.write('  🔗 绑定拥有者...');

  const adminUser = await dataSource.manager.findOne(User, {
    where: { username: 'admin' },
  });

  const systemApp = await dataSource.manager.findOne(App, {
    where: { appCode: 'system-instance' },
  });

  const superAdminRole = await dataSource.manager.findOne(Role, {
    where: { roleCode: 'super_admin' },
  });

  if (!adminUser || !systemApp || !superAdminRole) {
    process.stdout.write('    ⚠️ 用户、应用或角色未完全创建，跳过拥有者绑定\n');
    return;
  }

  // 1. 创建 sys_app_members 记录（拥有者）
  const memberExists = await dataSource.manager.findOne(AppMember, {
    where: {
      appId: systemApp.id,
      userId: adminUser.id,
    },
  });

  if (!memberExists) {
    await dataSource.manager.save(AppMember, {
      appId: systemApp.id,
      userId: adminUser.id,
      roleId: superAdminRole.id,  // 同时绑定角色
    });
    process.stdout.write(`    ✓ 绑定 admin 用户为 ${systemApp.appName} 的拥有者\n`);
  } else {
    process.stdout.write(`    √ 拥有者绑定已存在：admin → ${systemApp.appName}\n`);
  }

  // 2. 创建 sys_user_role 记录（如果不存在）
  const userRoleExists = await dataSource.manager.findOne(UserRole, {
    where: {
      userId: adminUser.id,
      roleId: superAdminRole.id,
    },
  });

  if (!userRoleExists) {
    await dataSource.manager.save(UserRole, {
      userId: adminUser.id,
      roleId: superAdminRole.id,
      createdAt: new Date(),
    });
    process.stdout.write(`    ✓ 绑定 admin 用户为超级管理员角色\n`);
  } else {
    process.stdout.write(`    √ 用户角色绑定已存在：admin → 超级管理员\n`);
  }
}
