/**
 * @fileoverview 数据库种子数据执行脚本
 * @description 执行所有种子数据，初始化系统基础数据
 */

import { DataSource } from 'typeorm';
import { AppType } from '../../modules/sys/app-type/entities/app-type.entity';
import { Permission, NodeType, ShowMode, PermissionType } from '../../modules/sys/permission/entities/permission.entity';
import { Role } from '../../modules/sys/role/entities/role.entity';
import { User } from '../../modules/sys/user/entities/user.entity';
import { UserRole } from '../../modules/sys/role/entities/user-role.entity';
import { RolePermission } from '../../modules/sys/permission/entities/role-permission.entity';
import { hashPassword } from '../../common/utils/encrypt';
import { buildPerValue } from '../../common/constants/permissions';

/**
 * 种子数据执行函数
 */
export async function runSeeds(dataSource: DataSource): Promise<void> {
  process.stdout.write('🌱 开始执行种子数据...');

  // 1. 初始化应用类型
  await seedAppTypes(dataSource);

  // 2. 初始化权限
  await seedPermissions(dataSource);

  // 3. 初始化角色
  await seedRoles(dataSource);

  // 4. 初始化管理员账号
  await seedAdminUser(dataSource);

  // 5. 绑定角色权限
  await seedRolePermissions(dataSource);

  // 6. 绑定用户角色
  await seedUserRoles(dataSource);

  process.stdout.write('✅ 种子数据执行完成！');
}

/**
 * 1. 初始化应用类型（严格按照文档要求）
 */
async function seedAppTypes(dataSource: DataSource): Promise<void> {
  process.stdout.write('  📦 初始化应用类型...');

  const appTypes = [
    {
      typeName: '系统管理',
      typeCode: 'system', // 系统内置类型，不可删除
      typeDesc: '系统内置应用类型，用于系统管理功能',
      icon: 'SettingOutlined',
      multiAppEnabled: 0,
      typeStatus: 1,
      sortOrder: 0,
    },
  ];

  for (const appType of appTypes) {
    const exists = await dataSource.manager.findOne(AppType, { where: { typeCode: appType.typeCode } });
    if (!exists) {
      await dataSource.manager.save(AppType, { ...appType, createdAt: new Date() });
      process.stdout.write(`    ✓ 创建应用类型：${appType.typeName} (typeCode: ${appType.typeCode})`);
    } else {
      process.stdout.write(`    √ 应用类型已存在：${appType.typeName} (typeCode: ${appType.typeCode})`);
    }
  }
}

/**
 * 2. 初始化权限（严格按文档要求创建2个根节点）
 * - PC权限根节点
 * - 普通权限根节点
 */
async function seedPermissions(dataSource: DataSource): Promise<void> {
  process.stdout.write('  🔐 初始化权限...');

  // 1. 创建PC权限根节点
  const pcRootPerm = await dataSource.manager.findOne(Permission, {
    where: { permCode: 'pc_root', permissionType: PermissionType.PC }
  });
  let pcRootId: string;

  if (!pcRootPerm) {
    const pcRoot = dataSource.manager.create(Permission);
    pcRoot.permName = 'PC权限根节点';
    pcRoot.permCode = 'pc_root';
    pcRoot.permDesc = 'PC权限系统的根节点，所有PC权限的父节点';
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
    process.stdout.write(`    ✓ 创建PC权限根节点：${pcRoot.permName} (ID: ${pcRootId})`);
  } else {
    pcRootId = pcRootPerm.id;
    process.stdout.write(`    √ PC权限根节点已存在：${pcRootPerm.permName} (ID: ${pcRootId})`);
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

  // 3. 创建示例PC权限子节点（可选，用于测试）
  // 注意：permCode 必须与同步逻辑一致，使用 pc: 前缀
  const pcPermissions = [
    {
      permName: '系统管理',
      permCode: 'pc:system',
      nodeType: NodeType.MENU,
      routePath: '/system',
      iconName: 'SettingOutlined',
    },
    {
      permName: '用户管理',
      permCode: 'pc:system:user',
      nodeType: NodeType.MENU,
      routePath: '/system/user',
      iconName: 'UserOutlined',
    },
    {
      permName: '用户列表',
      permCode: 'pc:system:user:list',
      nodeType: NodeType.PAGE,
      routePath: '/system/user/list',
      iconName: '',
      permissionValue: buildPerValue(['查看', '添加', '编辑', '删除', '导出', '导入']), // 63n
    },
  ];

  for (const permData of pcPermissions) {
    const exists = await dataSource.manager.findOne(Permission, {
      where: { permCode: permData.permCode, permissionType: PermissionType.PC }
    });

    if (!exists) {
      // 确定父节点
      let parentId: string | null = null;
      const pathSegments = permData.permCode.replace('pc:', '').split(':');
      if (pathSegments.length > 1) {
        const parentCode = 'pc:' + pathSegments.slice(0, -1).join(':');
        const parent = await dataSource.manager.findOne(Permission, {
          where: { permCode: parentCode, permissionType: PermissionType.PC }
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
      process.stdout.write(`    ✓ 创建PC权限子节点：${permData.permName}`);
    } else {
      process.stdout.write(`    √ PC权限子节点已存在：${permData.permName}`);
    }
  }

  // 4. 创建系统管理权限（用于权限管理 API 的权限检查）
  const systemPermissions = [
    {
      permName: '权限管理',
      permCode: 'system:permission',
      nodeType: NodeType.TAG,
      permissionValue: buildPerValue(['查看', '添加', '编辑', '删除', '导出', '导入']), // 63n (全部权限)
    },
  ];

  for (const permData of systemPermissions) {
    const exists = await dataSource.manager.findOne(Permission, {
      where: { permCode: permData.permCode, permissionType: PermissionType.NORMAL }
    });

    if (!exists) {
      const perm = dataSource.manager.create(Permission);
      perm.permName = permData.permName;
      perm.permCode = permData.permCode;
      perm.permDesc = `${permData.permName}权限节点，用于权限管理接口的权限控制`;
      perm.permissionType = PermissionType.NORMAL;
      perm.nodeType = permData.nodeType;
      perm.parentId = normalRootId;
      perm.routePath = '';
      perm.iconName = '';
      perm.sortOrder = 0;
      perm.isVisible = 1;
      perm.isCache = 0;
      perm.showMode = ShowMode.NORMAL;
      perm.permStatus = 1;
      perm.permissionValue = permData.permissionValue || 0n;
      perm.isAutoSync = 0;

      await dataSource.manager.save(perm);
      process.stdout.write(`    ✓ 创建系统权限节点：${permData.permName} (permCode: ${permData.permCode})`);
    } else {
      process.stdout.write(`    √ 系统权限节点已存在：${permData.permName}`);
    }
  }

  // 5. 创建示例普通权限子节点（可选，用于测试）
  const normalPermissions = [
    {
      permName: '业务权限',
      permCode: 'business',
      nodeType: NodeType.MENU,
    },
    {
      permName: '数据查看',
      permCode: 'business:view',
      nodeType: NodeType.TAG,
      permissionValue: buildPerValue(['查看']), // 32n
    },
  ];

  for (const permData of normalPermissions) {
    const exists = await dataSource.manager.findOne(Permission, {
      where: { permCode: permData.permCode, permissionType: PermissionType.NORMAL }
    });

    if (!exists) {
      const perm = dataSource.manager.create(Permission);
      perm.permName = permData.permName;
      perm.permCode = permData.permCode;
      perm.permDesc = `${permData.permName}权限节点`;
      perm.permissionType = PermissionType.NORMAL;
      perm.nodeType = permData.nodeType;
      perm.parentId = normalRootId;
      perm.routePath = '';
      perm.iconName = '';
      perm.sortOrder = 0;
      perm.isVisible = 1;
      perm.isCache = 0;
      perm.showMode = ShowMode.NORMAL;
      perm.permStatus = 1;
      perm.permissionValue = permData.permissionValue || 0n;
      perm.isAutoSync = 0;

      await dataSource.manager.save(perm);
      process.stdout.write(`    ✓ 创建普通权限子节点：${permData.permName}`);
    } else {
      process.stdout.write(`    √ 普通权限子节点已存在：${permData.permName}`);
    }
  }

  process.stdout.write(`\n  📊 权限初始化完成：`);
  process.stdout.write(`    - PC权限根节点 ID: ${pcRootId}`);
  process.stdout.write(`    - 普通权限根节点 ID: ${normalRootId}`);
}

/**
 * 3. 初始化角色
 */
async function seedRoles(dataSource: DataSource): Promise<void> {
  process.stdout.write('  👥 初始化角色...');

  const roles = [
    {
      id: 'a2b83a1e-b1b9-4a19-b587-2f110ee56ae9', // 固定 UUID，与权限守卫匹配
      roleName: '超级管理员',
      roleCode: 'super_admin',
      roleDesc: '系统超级管理员，拥有所有权限',
      appId: undefined,
      appTypeId: undefined,
      isBuiltin: 1,
      isOwner: 1,
      roleStatus: 1,
      sortOrder: 0,
    },
    {
      id: 'c3d4e5f6-a7b8-4c5d-8e9f-0a1b2c3d4e5f', // 固定 UUID，用于 admin 角色
      roleName: '管理员',
      roleCode: 'admin',
      roleDesc: '系统管理员，拥有大部分管理权限',
      appId: undefined,
      appTypeId: undefined,
      isBuiltin: 1,
      isOwner: 0,
      roleStatus: 1,
      sortOrder: 1,
    },
    {
      id: 'd4e5f6a7-b8c9-4d5e-9f0a-1b2c3d4e5f6a', // 固定 UUID，用于 user 角色
      roleName: '普通用户',
      roleCode: 'user',
      roleDesc: '普通用户，拥有基础查看权限',
      appId: undefined,
      appTypeId: undefined,
      isBuiltin: 1,
      isOwner: 0,
      roleStatus: 1,
      sortOrder: 2,
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
      process.stdout.write(`    ✓ 创建角色：${role.roleName} (ID: ${role.id})`);
    } else {
      process.stdout.write(`    √ 角色已存在：${role.roleName} (ID: ${exists.id})`);
    }
  }
}

/**
 * 4. 初始化管理员账号
 */
async function seedAdminUser(dataSource: DataSource): Promise<void> {
  process.stdout.write('  👤 初始化管理员账号...');

  const users = [
    {
      username: 'admin',
      password: 'Admin@123', // 初始密码
      nickname: '超级管理员',
      phone: undefined,
      email: 'admin@example.com',
      avatar: undefined,
      gender: 0,
      userStatus: 1,
      isDeveloper: 0,
    },
    {
      username: 'test',
      password: 'Test@123',
      nickname: '测试用户',
      phone: undefined,
      email: 'test@example.com',
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
 * 5. 绑定角色权限（简化版本）
 */
async function seedRolePermissions(dataSource: DataSource): Promise<void> {
  process.stdout.write('  🔗 绑定角色权限...');

  // 获取所有角色
  const superAdminRole = await dataSource.manager.findOne(Role, { where: { roleCode: 'super_admin' } });
  const adminRole = await dataSource.manager.findOne(Role, { where: { roleCode: 'admin' } });
  const userRole = await dataSource.manager.findOne(Role, { where: { roleCode: 'user' } });

  // 获取所有权限
  const allPermissions = await dataSource.manager.find(Permission);

  if (!superAdminRole || !adminRole || !userRole) {
    process.stdout.write('    ⚠️ 角色未完全创建，跳过权限绑定');
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
  process.stdout.write(`    ✓ 超级管理员绑定 ${superAdminPerms.length} 个权限`);

  // 管理员绑定大部分权限（排除根节点）
  const adminPermIds = allPermissions
    .filter((p) => p.permCode !== 'pc_root' && p.permCode !== 'normal_root')
    .map((p) => p.id);

  for (const permId of adminPermIds) {
    const exists = await dataSource.manager.findOne(RolePermission, {
      where: { roleId: adminRole.id, permissionId: permId },
    });
    if (!exists) {
      const perm = allPermissions.find((p) => p.id === permId);
      await dataSource.manager.save(RolePermission, {
        roleId: adminRole.id,
        permissionId: permId,
        permissionValue: perm?.permissionValue || 0n,
        createdAt: new Date(),
      });
    }
  }
  process.stdout.write(`    ✓ 管理员绑定 ${adminPermIds.length} 个权限`);

  // 普通用户只绑定查看权限
  const viewPerms = allPermissions.filter((p) => p.permCode.endsWith(':view') || p.permCode.endsWith(':list'));
  for (const perm of viewPerms) {
    const exists = await dataSource.manager.findOne(RolePermission, {
      where: { roleId: userRole.id, permissionId: perm.id },
    });
    if (!exists) {
      await dataSource.manager.save(RolePermission, {
        roleId: userRole.id,
        permissionId: perm.id,
        permissionValue: perm.permissionValue || 0n,
        createdAt: new Date(),
      });
    }
  }
  process.stdout.write(`    ✓ 普通用户绑定 ${viewPerms.length} 个查看权限`);
}

/**
 * 6. 绑定用户角色
 */
async function seedUserRoles(dataSource: DataSource): Promise<void> {
  process.stdout.write('  🔗 绑定用户角色...');

  const adminUser = await dataSource.manager.findOne(User, { where: { username: 'admin' } });
  const testUser = await dataSource.manager.findOne(User, { where: { username: 'test' } });
  const superAdminRole = await dataSource.manager.findOne(Role, { where: { roleCode: 'super_admin' } });
  const userRole = await dataSource.manager.findOne(Role, { where: { roleCode: 'user' } });

  if (!adminUser || !testUser || !superAdminRole || !userRole) {
    process.stdout.write('    ⚠️ 用户或角色未完全创建，跳过角色绑定');
    return;
  }

  // 绑定 admin 用户为超级管理员
  const adminRoleExists = await dataSource.manager.findOne(UserRole, {
    where: { userId: adminUser.id, roleId: superAdminRole.id },
  });
  if (!adminRoleExists) {
    await dataSource.manager.save(UserRole, {
      userId: adminUser.id,
      roleId: superAdminRole.id,
      createdAt: new Date(),
    });
    process.stdout.write(`    ✓ 用户 admin 绑定角色：超级管理员`);
  } else {
    process.stdout.write(`    √ 用户 admin 已绑定角色：超级管理员`);
  }

  // 绑定 test 用户为普通用户
  const testRoleExists = await dataSource.manager.findOne(UserRole, {
    where: { userId: testUser.id, roleId: userRole.id },
  });
  if (!testRoleExists) {
    await dataSource.manager.save(UserRole, {
      userId: testUser.id,
      roleId: userRole.id,
      createdAt: new Date(),
    });
    process.stdout.write(`    ✓ 用户 test 绑定角色：普通用户`);
  } else {
    process.stdout.write(`    √ 用户 test 已绑定角色：普通用户`);
  }
}
