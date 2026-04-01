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

/**
 * 种子数据执行函数
 */
export async function runSeeds(dataSource: DataSource): Promise<void> {
  console.log('🌱 开始执行种子数据...');

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

  console.log('✅ 种子数据执行完成！');
}

/**
 * 1. 初始化应用类型
 */
async function seedAppTypes(dataSource: DataSource): Promise<void> {
  console.log('  📦 初始化应用类型...');

  const appTypes = [
    {
      typeName: '管理后台',
      typeCode: 'admin',
      typeDesc: '企业内部管理后台系统',
      icon: 'SettingOutlined',
      multiAppEnabled: 0,
      typeStatus: 1,
      sortOrder: 0,
    },
    {
      typeName: '用户端',
      typeCode: 'user',
      typeDesc: '面向用户的 C 端系统',
      icon: 'UserOutlined',
      multiAppEnabled: 1,
      typeStatus: 1,
      sortOrder: 1,
    },
  ];

  for (const appType of appTypes) {
    const exists = await dataSource.manager.findOne(AppType, { where: { typeCode: appType.typeCode } });
    if (!exists) {
      await dataSource.manager.save(AppType, { ...appType, createdAt: new Date() });
      console.log(`    ✓ 创建应用类型：${appType.typeName}`);
    }
  }
}

/**
 * 2. 初始化权限（系统管理模块）
 */
async function seedPermissions(dataSource: DataSource): Promise<void> {
  console.log('  🔐 初始化权限...');

  const permissions = [
    // 系统管理根节点 (permCode: system, permissionValue: 0)
    {
      permName: '系统管理',
      permCode: 'system',
      permDesc: '系统管理根节点',
      permissionType: 1, // MENU
      nodeType: 1, // CATALOG
      parentId: null,
      routePath: '/system',
      iconName: 'SettingOutlined',
      sortOrder: 0,
      isVisible: 1,
      isCache: 1,
      showMode: 1, // NORMAL
      permStatus: 1,
      permissionValue: 0n,
    },
    // 用户管理 (permCode: system:user, permissionValue: 位运算值)
    {
      permName: '用户管理',
      permCode: 'system:user',
      permDesc: '用户管理功能',
      permissionType: 1, // MENU
      nodeType: 2, // MENU
      parentId: null, // 将在代码中设置为 system 的 ID
      routePath: '/system/user',
      iconName: 'UserOutlined',
      sortOrder: 1,
      isVisible: 1,
      isCache: 1,
      showMode: 1,
      permStatus: 1,
      permissionValue: 0n,
    },
    // 用户管理 - 新增 (permissionValue: 1 = 2^0)
    {
      permName: '用户新增',
      permCode: 'system:user:add',
      permDesc: '新增用户权限',
      permissionType: 2, // BUTTON
      nodeType: 3, // BUTTON
      parentId: null,
      routePath: '',
      iconName: '',
      sortOrder: 0,
      isVisible: 1,
      isCache: 0,
      showMode: 1,
      permStatus: 1,
      permissionValue: 1n, // 2^0 = ADD
    },
    // 用户管理 - 编辑 (permissionValue: 2 = 2^1)
    {
      permName: '用户编辑',
      permCode: 'system:user:edit',
      permDesc: '编辑用户权限',
      permissionType: 2, // BUTTON
      nodeType: 3, // BUTTON
      parentId: null,
      routePath: '',
      iconName: '',
      sortOrder: 1,
      isVisible: 1,
      isCache: 0,
      showMode: 1,
      permStatus: 1,
      permissionValue: 2n, // 2^1 = EDIT
    },
    // 用户管理 - 删除 (permissionValue: 4 = 2^2)
    {
      permName: '用户删除',
      permCode: 'system:user:delete',
      permDesc: '删除用户权限',
      permissionType: 2, // BUTTON
      nodeType: 3, // BUTTON
      parentId: null,
      routePath: '',
      iconName: '',
      sortOrder: 2,
      isVisible: 1,
      isCache: 0,
      showMode: 1,
      permStatus: 1,
      permissionValue: 4n, // 2^2 = DELETE
    },
    // 用户管理 - 查看 (permissionValue: 32 = 2^5)
    {
      permName: '用户查看',
      permCode: 'system:user:view',
      permDesc: '查看用户权限',
      permissionType: 2, // BUTTON
      nodeType: 3, // BUTTON
      parentId: null,
      routePath: '',
      iconName: '',
      sortOrder: 3,
      isVisible: 1,
      isCache: 0,
      showMode: 1,
      permStatus: 1,
      permissionValue: 32n, // 2^5 = VIEW
    },
    // 角色管理
    {
      permName: '角色管理',
      permCode: 'system:role',
      permDesc: '角色管理功能',
      permissionType: 1, // MENU
      nodeType: 2, // MENU
      parentId: null,
      routePath: '/system/role',
      iconName: 'TeamOutlined',
      sortOrder: 2,
      isVisible: 1,
      isCache: 1,
      showMode: 1,
      permStatus: 1,
      permissionValue: 0n,
    },
    // 角色管理 - 新增
    {
      permName: '角色新增',
      permCode: 'system:role:add',
      permDesc: '新增角色权限',
      permissionType: 2, // BUTTON
      nodeType: 3, // BUTTON
      parentId: null,
      routePath: '',
      iconName: '',
      sortOrder: 0,
      isVisible: 1,
      isCache: 0,
      showMode: 1,
      permStatus: 1,
      permissionValue: 1n,
    },
    // 角色管理 - 编辑
    {
      permName: '角色编辑',
      permCode: 'system:role:edit',
      permDesc: '编辑角色权限',
      permissionType: 2, // BUTTON
      nodeType: 3, // BUTTON
      parentId: null,
      routePath: '',
      iconName: '',
      sortOrder: 1,
      isVisible: 1,
      isCache: 0,
      showMode: 1,
      permStatus: 1,
      permissionValue: 2n,
    },
    // 角色管理 - 删除
    {
      permName: '角色删除',
      permCode: 'system:role:delete',
      permDesc: '删除角色权限',
      permissionType: 2, // BUTTON
      nodeType: 3, // BUTTON
      parentId: null,
      routePath: '',
      iconName: '',
      sortOrder: 2,
      isVisible: 1,
      isCache: 0,
      showMode: 1,
      permStatus: 1,
      permissionValue: 4n,
    },
    // 角色管理 - 查看
    {
      permName: '角色查看',
      permCode: 'system:role:view',
      permDesc: '查看角色权限',
      permissionType: 2, // BUTTON
      nodeType: 3, // BUTTON
      parentId: null,
      routePath: '',
      iconName: '',
      sortOrder: 3,
      isVisible: 1,
      isCache: 0,
      showMode: 1,
      permStatus: 1,
      permissionValue: 32n,
    },
    // 角色管理 - 分配权限
    {
      permName: '分配权限',
      permCode: 'system:role:assign',
      permDesc: '分配角色权限',
      permissionType: 2, // BUTTON
      nodeType: 3, // BUTTON
      parentId: null,
      routePath: '',
      iconName: '',
      sortOrder: 4,
      isVisible: 1,
      isCache: 0,
      showMode: 1,
      permStatus: 1,
      permissionValue: 16n, // 2^4 = ASSIGN
    },
    // 权限管理
    {
      permName: '权限管理',
      permCode: 'system:permission',
      permDesc: '权限管理功能',
      permissionType: 1, // MENU
      nodeType: 2, // MENU
      parentId: null,
      routePath: '/system/permission',
      iconName: 'SafetyCertificateOutlined',
      sortOrder: 3,
      isVisible: 1,
      isCache: 1,
      showMode: 1,
      permStatus: 1,
      permissionValue: 0n,
    },
    // 权限管理 - 新增
    {
      permName: '权限新增',
      permCode: 'system:permission:add',
      permDesc: '新增权限',
      permissionType: 2, // BUTTON
      nodeType: 3, // BUTTON
      parentId: null,
      routePath: '',
      iconName: '',
      sortOrder: 0,
      isVisible: 1,
      isCache: 0,
      showMode: 1,
      permStatus: 1,
      permissionValue: 1n,
    },
    // 权限管理 - 编辑
    {
      permName: '权限编辑',
      permCode: 'system:permission:edit',
      permDesc: '编辑权限',
      permissionType: 2, // BUTTON
      nodeType: 3, // BUTTON
      parentId: null,
      routePath: '',
      iconName: '',
      sortOrder: 1,
      isVisible: 1,
      isCache: 0,
      showMode: 1,
      permStatus: 1,
      permissionValue: 2n,
    },
    // 权限管理 - 删除
    {
      permName: '权限删除',
      permCode: 'system:permission:delete',
      permDesc: '删除权限',
      permissionType: 2, // BUTTON
      nodeType: 3, // BUTTON
      parentId: null,
      routePath: '',
      iconName: '',
      sortOrder: 2,
      isVisible: 1,
      isCache: 0,
      showMode: 1,
      permStatus: 1,
      permissionValue: 4n,
    },
    // 权限管理 - 查看
    {
      permName: '权限查看',
      permCode: 'system:permission:view',
      permDesc: '查看权限',
      permissionType: 2, // BUTTON
      nodeType: 3, // BUTTON
      parentId: null,
      routePath: '',
      iconName: '',
      sortOrder: 3,
      isVisible: 1,
      isCache: 0,
      showMode: 1,
      permStatus: 1,
      permissionValue: 32n,
    },
    // 应用类型管理
    {
      permName: '应用类型管理',
      permCode: 'system:app-type',
      permDesc: '应用类型管理功能',
      permissionType: 1, // MENU
      nodeType: 2, // MENU
      parentId: null,
      routePath: '/system/app-type',
      iconName: 'AppstoreOutlined',
      sortOrder: 4,
      isVisible: 1,
      isCache: 1,
      showMode: 1,
      permStatus: 1,
      permissionValue: 0n,
    },
    // 应用类型管理 - 新增
    {
      permName: '应用类型新增',
      permCode: 'system:app-type:add',
      permDesc: '新增应用类型',
      permissionType: 2, // BUTTON
      nodeType: 3, // BUTTON
      parentId: null,
      routePath: '',
      iconName: '',
      sortOrder: 0,
      isVisible: 1,
      isCache: 0,
      showMode: 1,
      permStatus: 1,
      permissionValue: 1n,
    },
    // 应用类型管理 - 编辑
    {
      permName: '应用类型编辑',
      permCode: 'system:app-type:edit',
      permDesc: '编辑应用类型',
      permissionType: 2, // BUTTON
      nodeType: 3, // BUTTON
      parentId: null,
      routePath: '',
      iconName: '',
      sortOrder: 1,
      isVisible: 1,
      isCache: 0,
      showMode: 1,
      permStatus: 1,
      permissionValue: 2n,
    },
    // 应用类型管理 - 删除
    {
      permName: '应用类型删除',
      permCode: 'system:app-type:delete',
      permDesc: '删除应用类型',
      permissionType: 2, // BUTTON
      nodeType: 3, // BUTTON
      parentId: null,
      routePath: '',
      iconName: '',
      sortOrder: 2,
      isVisible: 1,
      isCache: 0,
      showMode: 1,
      permStatus: 1,
      permissionValue: 4n,
    },
    // 应用类型管理 - 查看
    {
      permName: '应用类型查看',
      permCode: 'system:app-type:view',
      permDesc: '查看应用类型',
      permissionType: 2, // BUTTON
      nodeType: 3, // BUTTON
      parentId: null,
      routePath: '',
      iconName: '',
      sortOrder: 3,
      isVisible: 1,
      isCache: 0,
      showMode: 1,
      permStatus: 1,
      permissionValue: 32n,
    },
    // 审计日志管理
    {
      permName: '审计日志管理',
      permCode: 'system:audit-log',
      permDesc: '审计日志管理功能',
      permissionType: 1, // MENU
      nodeType: 2, // MENU
      parentId: null,
      routePath: '/system/audit-log',
      iconName: 'FileTextOutlined',
      sortOrder: 5,
      isVisible: 1,
      isCache: 1,
      showMode: 1,
      permStatus: 1,
      permissionValue: 0n,
    },
    // 审计日志管理 - 查看
    {
      permName: '审计日志查看',
      permCode: 'system:audit-log:view',
      permDesc: '查看审计日志',
      permissionType: 2, // BUTTON
      nodeType: 3, // BUTTON
      parentId: null,
      routePath: '',
      iconName: '',
      sortOrder: 0,
      isVisible: 1,
      isCache: 0,
      showMode: 1,
      permStatus: 1,
      permissionValue: 32n,
    },
    // 审计日志管理 - 删除
    {
      permName: '审计日志删除',
      permCode: 'system:audit-log:delete',
      permDesc: '删除审计日志',
      permissionType: 2, // BUTTON
      nodeType: 3, // BUTTON
      parentId: null,
      routePath: '',
      iconName: '',
      sortOrder: 1,
      isVisible: 1,
      isCache: 0,
      showMode: 1,
      permStatus: 1,
      permissionValue: 4n,
    },
  ];

  // 先创建根节点 "系统管理"
  const rootPerm = await dataSource.manager.findOne(Permission, { where: { permCode: 'system' } });
  let rootPermId: string | undefined = undefined;

  if (!rootPerm) {
    const rootPermEntity = dataSource.manager.create(Permission);
    rootPermEntity.permName = permissions[0].permName;
    rootPermEntity.permCode = permissions[0].permCode;
    rootPermEntity.permDesc = permissions[0].permDesc;
    rootPermEntity.permissionType = permissions[0].permissionType as unknown as PermissionType;
    rootPermEntity.nodeType = permissions[0].nodeType as unknown as NodeType;
    rootPermEntity.parentId = null as unknown as string;
    rootPermEntity.routePath = permissions[0].routePath;
    rootPermEntity.iconName = permissions[0].iconName;
    rootPermEntity.sortOrder = permissions[0].sortOrder;
    rootPermEntity.isVisible = permissions[0].isVisible;
    rootPermEntity.isCache = permissions[0].isCache;
    rootPermEntity.showMode = permissions[0].showMode as unknown as ShowMode;
    rootPermEntity.permStatus = permissions[0].permStatus;
    rootPermEntity.permissionValue = permissions[0].permissionValue;

    const saved = await dataSource.manager.save(rootPermEntity) as Permission;
    rootPermId = saved.id;
    console.log(`    ✓ 创建根权限：${permissions[0].permName}`);
  } else {
    rootPermId = (rootPerm as Permission).id;
    console.log(`    √ 根权限已存在：${permissions[0].permName}`);
  }

  // 创建其他权限
  for (let i = 1; i < permissions.length; i++) {
    const permData = permissions[i];

    // 检查是否已存在
    const exists = await dataSource.manager.findOne(Permission, { where: { permCode: permData.permCode } });
    if (exists) {
      console.log(`    √ 权限已存在：${permData.permName}`);
      continue;
    }

    // 设置父权限 ID
    let parentId: string | undefined = undefined;
    if (permData.permCode.startsWith('system:user')) {
      parentId = rootPermId;
    } else if (permData.permCode.startsWith('system:role')) {
      // 需要先找到角色管理节点的 ID
      const parentPerm = await dataSource.manager.findOne(Permission, { where: { permCode: 'system:role' } });
      parentId = parentPerm?.id || rootPermId;
    } else if (permData.permCode.startsWith('system:permission')) {
      const parentPerm = await dataSource.manager.findOne(Permission, { where: { permCode: 'system:permission' } });
      parentId = parentPerm?.id || rootPermId;
    } else if (permData.permCode.startsWith('system:app-type')) {
      const parentPerm = await dataSource.manager.findOne(Permission, { where: { permCode: 'system:app-type' } });
      parentId = parentPerm?.id || rootPermId;
    } else if (permData.permCode.startsWith('system:audit-log')) {
      const parentPerm = await dataSource.manager.findOne(Permission, { where: { permCode: 'system:audit-log' } });
      parentId = parentPerm?.id || rootPermId;
    }

    const permEntity = dataSource.manager.create(Permission);
    permEntity.permName = permData.permName;
    permEntity.permCode = permData.permCode;
    permEntity.permDesc = permData.permDesc;
    permEntity.permissionType = permData.permissionType as unknown as PermissionType;
    permEntity.nodeType = permData.nodeType as unknown as NodeType;
    permEntity.parentId = parentId as unknown as string;
    permEntity.routePath = permData.routePath;
    permEntity.iconName = permData.iconName;
    permEntity.sortOrder = permData.sortOrder;
    permEntity.isVisible = permData.isVisible;
    permEntity.isCache = permData.isCache;
    permEntity.showMode = permData.showMode as unknown as ShowMode;
    permEntity.permStatus = permData.permStatus;
    permEntity.permissionValue = permData.permissionValue;

    await dataSource.manager.save(permEntity);
    console.log(`    ✓ 创建权限：${permData.permName}`);
  }
}

/**
 * 3. 初始化角色
 */
async function seedRoles(dataSource: DataSource): Promise<void> {
  console.log('  👥 初始化角色...');

  const roles = [
    {
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
      console.log(`    ✓ 创建角色：${role.roleName}`);
    } else {
      console.log(`    √ 角色已存在：${role.roleName}`);
    }
  }
}

/**
 * 4. 初始化管理员账号
 */
async function seedAdminUser(dataSource: DataSource): Promise<void> {
  console.log('  👤 初始化管理员账号...');

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
      console.log(`    ✓ 创建用户：${user.username} (密码：${user.password})`);
    } else {
      console.log(`    √ 用户已存在：${user.username}`);
    }
  }
}

/**
 * 5. 绑定角色权限
 */
async function seedRolePermissions(dataSource: DataSource): Promise<void> {
  console.log('  🔗 绑定角色权限...');

  // 获取所有角色
  const superAdminRole = await dataSource.manager.findOne(Role, { where: { roleCode: 'super_admin' } });
  const adminRole = await dataSource.manager.findOne(Role, { where: { roleCode: 'admin' } });
  const userRole = await dataSource.manager.findOne(Role, { where: { roleCode: 'user' } });

  // 获取所有权限
  const allPermissions = await dataSource.manager.find(Permission);

  if (!superAdminRole || !adminRole || !userRole) {
    console.log('    ⚠️ 角色未完全创建，跳过权限绑定');
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
  console.log(`    ✓ 超级管理员绑定 ${superAdminPerms.length} 个权限`);

  // 管理员绑定大部分权限（排除审计日志删除）
  const adminPermCodes = allPermissions
    .filter((p) => p.permCode !== 'system:audit-log:delete')
    .map((p) => p.id);

  for (const permId of adminPermCodes) {
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
  console.log(`    ✓ 管理员绑定 ${adminPermCodes.length} 个权限`);

  // 普通用户只绑定查看权限
  const viewPerms = allPermissions.filter((p) => p.permCode.endsWith(':view'));
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
  console.log(`    ✓ 普通用户绑定 ${viewPerms.length} 个查看权限`);
}

/**
 * 6. 绑定用户角色
 */
async function seedUserRoles(dataSource: DataSource): Promise<void> {
  console.log('  🔗 绑定用户角色...');

  const adminUser = await dataSource.manager.findOne(User, { where: { username: 'admin' } });
  const testUser = await dataSource.manager.findOne(User, { where: { username: 'test' } });
  const superAdminRole = await dataSource.manager.findOne(Role, { where: { roleCode: 'super_admin' } });
  const userRole = await dataSource.manager.findOne(Role, { where: { roleCode: 'user' } });

  if (!adminUser || !testUser || !superAdminRole || !userRole) {
    console.log('    ⚠️ 用户或角色未完全创建，跳过角色绑定');
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
    console.log(`    ✓ 用户 admin 绑定角色：超级管理员`);
  } else {
    console.log(`    √ 用户 admin 已绑定角色：超级管理员`);
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
    console.log(`    ✓ 用户 test 绑定角色：普通用户`);
  } else {
    console.log(`    √ 用户 test 已绑定角色：普通用户`);
  }
}
