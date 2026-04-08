/**
 * @fileoverview 认证服务
 * @description 处理用户认证相关业务逻辑
 */

import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { UserRole } from '../role/entities/user-role.entity';
import { Role } from '../role/entities/role.entity';
import { App } from '../app/entities/app.entity';
import { AppMember } from '../app/entities/app-member.entity';
import { AppType } from '../app-type/entities/app-type.entity';
import { Permission } from '../permission/entities/permission.entity';
import { RolePermission } from '../permission/entities/role-permission.entity';
import { AppTypePermissionEntity } from '../app-type/entities/app-type-permission.entity';
import { PermissionType } from '../permission/entities/permission.entity';
import { verifyPassword } from '../../../common/utils/encrypt';
import { LoginDto } from './dto/req/login.dto';
import {
  LoginResponseDto,
  UserInfoDto,
  AppInstanceItemDto,
} from './dto/res/auth-response.dto';
import {
  UserPermissionsResponseDto,
  PermissionTreeNodeDto,
} from './dto/res/user-permissions-response.dto';
import { RegisterDto } from './dto/req/register.dto';
import { CheckAvailabilityResponseDto } from './dto/req/check-availability.dto';
import { BusinessException } from '../../../common/exceptions/business.exception';
import { hashPassword } from '../../../common/utils/encrypt';

/**
 * 认证服务
 */
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(App)
    private appRepository: Repository<App>,
    @InjectRepository(AppMember)
    private appMemberRepository: Repository<AppMember>,
    @InjectRepository(AppType)
    private appTypeRepository: Repository<AppType>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(AppTypePermissionEntity)
    private appTypePermissionRepository: Repository<AppTypePermissionEntity>,
    private jwtService: JwtService,
  ) {}

  /**
   * 用户登录
   * @param loginDto - 登录请求参数
   * @returns 登录响应（包含 Token）
   */
  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const { username, password } = loginDto;

    // 查找用户
    const user = await this.userRepository.findOne({
      where: { username },
    });

    if (!user) {
      // 用户不存在，返回 401 错误码
      throw new BusinessException('用户名或密码错误', 401);
    }

    // 检查用户状态
    if (user.userStatus !== 1) {
      throw new BusinessException('用户已被禁用', 403);
    }

    // 验证密码
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      // 密码错误，返回 401 错误码
      throw new BusinessException('用户名或密码错误', 401);
    }

    // 查询用户角色
    const userRoles = await this.userRoleRepository.find({
      where: { userId: user.id },
      relations: ['role'],
    });

    // 生成 Token
    const payload = {
      sub: user.id,
      username: user.username,
      roleIds: userRoles.map((ur) => ur.roleId),
    };

    const accessToken = await this.jwtService.signAsync(payload);

    const refreshToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: parseInt(process.env.JWT_EXPIRES_IN || '7200', 10),
      user: {
        username: user.username,
        nickname: user.nickname || user.username,
        avatar: user.avatar || '',
      },
    };
  }

  /**
   * 刷新 Token
   * @param refreshToken - 刷新 Token
   * @returns 新的 Token 对
   */
  async refreshToken(refreshToken: string): Promise<LoginResponseDto> {
    try {
      // 验证刷新 Token
      const payload = await this.jwtService.verifyAsync(refreshToken);

      // 查找用户
      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new BusinessException('用户不存在', 404);
      }

      // 查询用户角色
      const userRoles = await this.userRoleRepository.find({
        where: { userId: user.id },
        relations: ['role'],
      });

      // 生成新的 Token（使用当前时间戳确保 token 唯一）
      const newPayload = {
        sub: user.id,
        username: user.username,
        roleIds: userRoles.map((ur) => ur.roleId),
        iat: Date.now() / 1000, // 使用当前时间戳
      };

      const accessToken = await this.jwtService.signAsync(newPayload, {
        expiresIn: parseInt(process.env.JWT_EXPIRES_IN || '7200', 10),
      });

      const newRefreshToken = await this.jwtService.signAsync(newPayload, {
        expiresIn: parseInt(process.env.JWT_EXPIRES_IN || '7200', 10),
      });

      return {
        accessToken,
        refreshToken: newRefreshToken,
        tokenType: 'Bearer',
        expiresIn: parseInt(process.env.JWT_EXPIRES_IN || '7200', 10),
      };
    } catch (error) {
      // Token 验证失败，返回 401 错误码
      throw new BusinessException('刷新 Token 无效或已过期', 401);
    }
  }

  /**
   * 获取当前用户信息
   * @param userId - 用户 ID
   * @returns 用户信息
   */
  async getCurrentUser(userId: string): Promise<UserInfoDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BusinessException('用户不存在', 404);
    }

    // 查询用户角色
    const userRoles = await this.userRoleRepository.find({
      where: { userId: user.id },
      relations: ['role'],
    });

    return {
      id: user.id,
      username: user.username,
      nickname: user.nickname || user.username,
      avatar: user.avatar || '',
      // 返回角色名称列表
      roles: userRoles.map((ur) => ur.role.roleName) || [],
    };
  }

  /**
   * 退出登录
   * @description 清理 Token（可在 Redis 中将 Token 加入黑名单）
   * @param token - 当前 Token
   */
  async logout(_token: string): Promise<void> {
    // TODO-TASK-2026-04-07-001: 将 Token 加入 Redis 黑名单
    // await this.redisService.setex(`token_blacklist:${token}`, expiresIn, '1');
  }

  /**
   * 获取用户可访问的应用实例列表
   * @param userId - 用户 ID
   * @returns 用户可访问的应用实例列表
   */
  async getUserApps(userId: string): Promise<AppInstanceItemDto[]> {
    // 1. 查询用户作为拥有者的应用
    const ownedApps = await this.appRepository.find({
      where: { ownerId: userId, appStatus: 1 },
    });

    // 2. 查询用户作为成员的应用
    const memberApps = await this.appMemberRepository.find({
      where: { userId },
      relations: ['app'],
    });

    // 3. 获取所有相关的应用类型 ID
    const appIds = new Set<string>();
    const appTypeIdSet = new Set<string>();

    ownedApps.forEach((app) => {
      appIds.add(app.id);
      if (app.appTypeId) {
        appTypeIdSet.add(app.appTypeId);
      }
    });

    memberApps.forEach((member) => {
      if (member.app && member.app.appStatus === 1) {
        appIds.add(member.appId);
        if (member.app.appTypeId) {
          appTypeIdSet.add(member.app.appTypeId);
        }
      }
    });

    // 4. 查询应用类型信息
    const appTypeIds = Array.from(appTypeIdSet);
    const appTypes = appTypeIds.length > 0
      ? await this.appTypeRepository.find({
          where: { id: In(appTypeIds) },
        })
      : [];

    const appTypeMap = new Map<string, AppType>();
    appTypes.forEach((appType) => {
      appTypeMap.set(appType.id, appType);
    });

    // 5. 构建返回结果
    const result: AppInstanceItemDto[] = [];

    // 添加拥有者的应用
    ownedApps.forEach((app) => {
      const appType = appTypeMap.get(app.appTypeId);
      result.push({
        appId: app.id,
        appName: app.appName,
        appCode: app.appCode,
        appTypeId: app.appTypeId || '',
        appTypeCode: appType?.typeCode || '',
        appTypeName: appType?.typeName || '',
        role: 'owner',
        icon: app.icon,
      });
    });

    // 添加成员的应用（排除已经是拥有者的）
    memberApps.forEach((member) => {
      if (member.app && member.app.appStatus === 1 && !appIds.has(member.appId)) {
        const app = member.app;
        const appType = appTypeMap.get(app.appTypeId);
        result.push({
          appId: app.id,
          appName: app.appName,
          appCode: app.appCode,
          appTypeId: app.appTypeId || '',
          appTypeCode: appType?.typeCode || '',
          appTypeName: appType?.typeName || '',
          role: 'member',
          icon: app.icon,
        });
      }
    });

    return result;
  }

  /**
   * 获取用户权限菜单
   * @param userId - 用户 ID
   * @param appId - 应用实例 ID
   * @returns 用户权限菜单树
   */
  async getUserPermissions(
    userId: string,
    appId: string,
  ): Promise<UserPermissionsResponseDto> {
    // 1. 查询应用实例信息，获取 appTypeId
    const app = await this.appRepository.findOne({
      where: { id: appId },
    });

    if (!app) {
      throw new BusinessException('应用实例不存在', 404);
    }

    const appTypeId = app.appTypeId;

    // 2. 查询应用类型信息，确定权限类型过滤规则
    let appType: AppType | null = null;
    if (appTypeId) {
      appType = await this.appTypeRepository.findOne({
        where: { id: appTypeId },
      });
    }

    // 3. 查询用户在该应用实例下的角色
    // 用户作为拥有者时，自动拥有管理员角色的全部权限
    const isOwner = app.ownerId === userId;

    // 查询用户角色关联
    const userRoles = await this.userRoleRepository.find({
      where: { userId },
      relations: ['role'],
    });

    // 过滤出该应用实例下的角色（appId 匹配）或全局角色（appId 为空）
    const roleIds: string[] = [];
    const roleCodes: string[] = [];

    if (isOwner) {
      // 拥有者自动获得拥有者角色
      const ownerRole = await this.roleRepository.findOne({
        where: { appId, isOwner: 1 },
      });
      if (ownerRole) {
        roleIds.push(ownerRole.id);
        roleCodes.push(ownerRole.roleCode);
      }
    }

    userRoles.forEach((ur) => {
      if (ur.role) {
        // 角色属于该应用实例，或者是全局角色（appId 和 appTypeId 都为空）
        const isGlobalRole = !ur.role.appId && !ur.role.appTypeId;
        const isAppRole = ur.role.appId === appId;
        const isAppTypeRole = ur.role.appTypeId === appTypeId;

        if (isGlobalRole || isAppRole || isAppTypeRole) {
          roleIds.push(ur.roleId);
          roleCodes.push(ur.role.roleCode);
        }
      }
    });

    if (roleIds.length === 0) {
      // 用户没有角色，返回空菜单
      return {
        menuTree: [],
        permissions: [],
        appTypeId: appTypeId || '',
      };
    }

    // 4. 查询应用类型权限池（如果存在 appTypeId）
    // 权限池定义了该应用类型可用的权限范围
    let appTypePermissionIds: string[] | null = null;
    let hasAppTypePermissionPool = false; // 是否配置了权限池

    if (appTypeId) {
      const appTypePermissions = await this.appTypePermissionRepository.find({
        where: { appTypeId },
      });
      if (appTypePermissions.length > 0) {
        hasAppTypePermissionPool = true;
        appTypePermissionIds = appTypePermissions.map((p) => p.permissionId);
      }
    }

    // 5. 获取所有角色的权限
    const rolePermissions = await this.rolePermissionRepository.find({
      where: { roleId: In(roleIds) },
      relations: ['permission'],
    });

    // 6. 合并权限（相同 permissionId 的 permissionValue 取位运算 OR）
    const permissionMap = new Map<string, { permission: Permission; value: number }>();

    // 根据应用类型决定允许的权限类型
    // system 类型只允许 PC 权限，其他类型只允许 NORMAL 权限
    const allowedPermissionType = appType?.typeCode === 'system'
      ? PermissionType.PC
      : PermissionType.NORMAL;

    rolePermissions.forEach((rp) => {
      if (rp.permission && rp.permission.permStatus === 1) {
        const permId = rp.permissionId;

        // 过滤：权限类型必须匹配
        if (rp.permission.permissionType !== allowedPermissionType) {
          return; // 跳过权限类型不匹配的权限
        }

        // 过滤：如果应用类型配置了权限池，只保留权限池内的权限
        // 如果没有配置权限池，则不过滤（降级兼容）
        if (hasAppTypePermissionPool && appTypePermissionIds && !appTypePermissionIds.includes(permId)) {
          return; // 跳过不在权限池中的权限
        }

        const existing = permissionMap.get(permId);
        if (existing) {
          // 合并权限值（位运算 OR）
          existing.value = existing.value | rp.permissionValue;
        } else {
          permissionMap.set(permId, {
            permission: rp.permission,
            value: rp.permissionValue,
          });
        }
      }
    });

    // 如果是拥有者，需要查询该应用类型下所有权限
    if (isOwner) {
      // 根据应用类型决定查询的权限类型
      const permissionTypeFilter = appType?.typeCode === 'system'
        ? PermissionType.PC
        : PermissionType.NORMAL;

      const allPermissions = await this.permissionRepository.find({
        where: {
          permStatus: 1,
          permissionType: permissionTypeFilter,
        },
        order: { sortOrder: 'ASC' },
      });

      // 添加拥有者可能遗漏的权限（全部权限）
      allPermissions.forEach((perm) => {
        if (!permissionMap.has(perm.id)) {
          // 检查是否在权限池中（如果有配置）
          if (hasAppTypePermissionPool && appTypePermissionIds && !appTypePermissionIds.includes(perm.id)) {
            return;
          }
          permissionMap.set(perm.id, {
            permission: perm,
            value: perm.permissionValue || Number(0),
          });
        }
      });
    }

    // 7. 转换为 DTO 格式（bigint 序列化为字符串）
    const permissions = Array.from(permissionMap.values());

    // 8. 构建菜单树结构
    const menuTree = this.buildPermissionTree(permissions);

    // 9. 构建扁平化权限编码列表
    const permissionCodes = permissions.map((p) => p.permission.permCode);

    return {
      menuTree,
      permissions: permissionCodes,
      appTypeId: appTypeId || '',
    };
  }

  /**
   * 构建权限树结构
   * @param permissions - 权限列表
   * @returns 树形结构
   */
  private buildPermissionTree(
    permissions: Array<{ permission: Permission; value: number }>,
  ): PermissionTreeNodeDto[] {
    // 创建节点映射
    const nodeMap = new Map<string, PermissionTreeNodeDto>();
    const rootNodes: PermissionTreeNodeDto[] = [];

    // 先创建所有节点
    permissions.forEach(({ permission, value }) => {
      const node: PermissionTreeNodeDto = {
        id: permission.id,
        permName: permission.permName,
        permCode: permission.permCode,
        permDesc: permission.permDesc,
        permissionType: permission.permissionType as 'PC' | 'NORMAL',
        nodeType: permission.nodeType as 'MENU' | 'PAGE' | 'TAG',
        parentId: permission.parentId ?? undefined,
        routePath: permission.routePath,
        externalUrl: permission.externalUrl,
        iconName: permission.iconName,
        sortOrder: permission.sortOrder,
        isVisible: permission.isVisible,
        isCache: permission.isCache,
        showMode: permission.showMode as 'NORMAL' | 'DEV',
        permStatus: permission.permStatus,
        permissionValue: value,
        children: [],
      };
      nodeMap.set(permission.id, node);
    });

    // 构建树形关系
    permissions.forEach(({ permission }) => {
      const node = nodeMap.get(permission.id);
      if (node) {
        if (permission.parentId) {
          const parent = nodeMap.get(permission.parentId);
          if (parent) {
            parent.children = parent.children || [];
            parent.children.push(node);
          } else {
            // 父节点不存在，作为根节点
            rootNodes.push(node);
          }
        } else {
          // 无父节点，作为根节点
          rootNodes.push(node);
        }
      }
    });

    // 按 sortOrder 排序
    rootNodes.sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder));
    nodeMap.forEach((node) => {
      if (node.children && node.children.length > 0) {
        node.children.sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder));
      }
    });

    // 过滤掉不可见的节点
    return this.filterVisibleNodes(rootNodes);
  }

  /**
   * 过滤不可见节点
   * @param nodes - 节点列表
   * @returns 可见节点列表
   * @description 如果父节点不可见，子节点会提升为根节点
   */
  private filterVisibleNodes(nodes: PermissionTreeNodeDto[]): PermissionTreeNodeDto[] {
    const result: PermissionTreeNodeDto[] = [];

    for (const node of nodes) {
      if (node.isVisible === 1) {
        // 当前节点可见，保留
        const newNode = { ...node };
        if (node.children && node.children.length > 0) {
          newNode.children = this.filterVisibleNodes(node.children);
        }
        result.push(newNode);
      } else {
        // 当前节点不可见，递归处理子节点（子节点提升为根节点）
        if (node.children && node.children.length > 0) {
          const visibleChildren = this.filterVisibleNodes(node.children);
          result.push(...visibleChildren);
        }
      }
    }

    return result;
  }

  /**
   * 用户自注册
   * @param registerDto - 注册请求参数
   * @returns 登录响应（包含 Token）
   */
  async register(registerDto: RegisterDto): Promise<LoginResponseDto> {
    const { username, password, nickname, email, phone } = registerDto;

    // 检查用户名是否已存在
    const existingUser = await this.userRepository.findOne({
      where: { username },
    });

    if (existingUser) {
      throw new BusinessException('用户名已存在', 400);
    }

    // 检查邮箱是否已存在
    if (email) {
      const existingEmail = await this.userRepository.findOne({
        where: { email },
      });
      if (existingEmail) {
        throw new BusinessException('邮箱已被注册', 400);
      }
    }

    // 检查手机号是否已存在
    if (phone) {
      const existingPhone = await this.userRepository.findOne({
        where: { phone },
      });
      if (existingPhone) {
        throw new BusinessException('手机号已被注册', 400);
      }
    }

    // 加密密码
    const hashedPassword = await hashPassword(password);

    // 创建用户
    const user = this.userRepository.create({
      username,
      password: hashedPassword,
      nickname: nickname || username,
      email,
      phone,
      userStatus: 1,
      gender: 0,
      isDeveloper: 0,
    });

    await this.userRepository.save(user);

    // 生成 Token
    const payload = {
      sub: user.id,
      username: user.username,
      roleIds: [],
    };

    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: parseInt(process.env.JWT_EXPIRES_IN || '7200', 10),
      user: {
        username: user.username,
        nickname: user.nickname || user.username,
        avatar: user.avatar || '',
      },
    };
  }

  /**
   * 检查用户名/邮箱/手机号可用性
   * @param checkDto - 检查请求参数
   * @returns 可用性检查结果
   */
  async checkAvailability(checkDto: { username?: string; email?: string; phone?: string }): Promise<CheckAvailabilityResponseDto> {
    const result: CheckAvailabilityResponseDto = {};

    if (checkDto.username) {
      const user = await this.userRepository.findOne({
        where: { username: checkDto.username },
      });
      result.usernameAvailable = !user;
    }

    if (checkDto.email) {
      const user = await this.userRepository.findOne({
        where: { email: checkDto.email },
      });
      result.emailAvailable = !user;
    }

    if (checkDto.phone) {
      const user = await this.userRepository.findOne({
        where: { phone: checkDto.phone },
      });
      result.phoneAvailable = !user;
    }

    return result;
  }

  /**
   * 修改密码
   * @param userId - 用户 ID
   * @param oldPassword - 旧密码
   * @param newPassword - 新密码
   */
  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BusinessException('用户不存在', 404);
    }

    // 验证旧密码
    const isPasswordValid = await verifyPassword(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new BusinessException('原密码错误', 400);
    }

    // 加密新密码
    const hashedPassword = await hashPassword(newPassword);
    await this.userRepository.update(userId, { password: hashedPassword });
  }

  /**
   * 同步用户权限（重新加载用户权限缓存）
   * @param userId - 用户 ID
   * @param appId - 应用实例 ID
   * @returns 用户权限菜单树
   */
  async syncPermissions(userId: string, appId: string): Promise<UserPermissionsResponseDto> {
    // 直接调用 getUserPermissions 重新获取权限
    return this.getUserPermissions(userId, appId);
  }
}
