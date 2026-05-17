/**
 * @fileoverview 认证服务
 * @description 处理用户认证相关业务逻辑
 */

import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { UserRole } from '../role/entities/user-role.entity';
import { Role } from '../role/entities/role.entity';
import { NodeType, Permission, ShowMode } from '../permission/entities/permission.entity';
import { RolePermission } from '../role/entities/role-permission.entity';
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
  UserPermissionsResponseDto
} from './dto/res/user-permissions-response.dto';
import { RegisterDto } from './dto/req/register.dto';
import { CheckAvailabilityResponseDto } from './dto/req/check-availability.dto';
import { BusinessException } from '../../../common/exceptions/business.exception';
import { hashPassword } from '../../../common/utils/encrypt';
import { executeRawSql } from '../../../common/utils/sql.util';
import { PermissionTreeNodeDto } from '../permission';
import { flatToTree } from '@/common/utils/tree.util';
import { AppType, CustomMenuItem } from '../app-type/entities/app-type.entity';

/**
 * 认证服务
 */
@Injectable()
export class AuthService {
  constructor(
    @InjectEntityManager()
    private entityManager: EntityManager,
    @InjectDataSource()
    private dataSource: DataSource,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(AppTypePermissionEntity)
    private appTypePermissionRepository: Repository<AppTypePermissionEntity>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) { }

  private getJwtConfig() {
    return this.configService.get<any>('jwt', {
      expiresIn: 7200,
      refreshExpiresIn: 7200,
    });
  }

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

    const jwtConfig = this.getJwtConfig();
    const refreshExpiresIn = jwtConfig.refreshExpiresIn;
    const refreshToken = await this.jwtService.signAsync(payload, { expiresIn: refreshExpiresIn });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: jwtConfig.expiresIn,
      user: {
        username: user.username,
        nickname: user.nickname || user.username,
        avatar: user.avatar,
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
      const payload = await this.jwtService.verifyAsync(refreshToken);

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new BusinessException('用户不存在', 404);
      }

      const userRoles = await this.userRoleRepository.find({
        where: { userId: user.id },
        relations: ['role'],
      });

      const newPayload = {
        sub: user.id,
        username: user.username,
        roleIds: userRoles.map((ur) => ur.roleId),
        iat: Date.now() / 1000,
      };

      const jwtConfig = this.getJwtConfig();
      const accessExpiresIn = jwtConfig.expiresIn;
      const accessToken = await this.jwtService.signAsync(newPayload, {
        expiresIn: accessExpiresIn,
      });

      const refreshExpiresIn = jwtConfig.refreshExpiresIn;
      const newRefreshToken = await this.jwtService.signAsync(newPayload, {
        expiresIn: refreshExpiresIn,
      });

      return {
        accessToken,
        refreshToken: newRefreshToken,
        tokenType: 'Bearer',
        expiresIn: jwtConfig.expiresIn,
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
      avatar: user.avatar,
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
    const sql = `
      SELECT
        sam.appId,
        sa.appName,
        sa.appCode,
        sa.appTypeId,
        sat.typeCode AS appTypeCode,
        sat.typeName AS appTypeName,
        IF(sa.ownerId = sam.userId, 'owner', 'member') AS role,
        sa.logo
      FROM sys_app_members sam
      INNER JOIN sys_apps sa ON sa.id = sam.appId
      INNER JOIN sys_app_types sat ON sat.id = sa.appTypeId
      WHERE sam.userId = :userId AND sa.appStatus = 1
    `;
    return executeRawSql<AppInstanceItemDto>(this.entityManager, sql, { userId });
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

    const sql = `
    SELECT sa.appTypeId appTypeId FROM sys_apps sa WHERE sa.id = :appId ;
    SELECT 
      sp.id,
      sp.permCode,
      sp.permName,
      sp.permissionType,
      sp.nodeType,
      sp.parentId,
      sp.routePath,
      sp.externalUrl,
      sp.iconName,
      sp.sortOrder,
      sp.isVisible,
      sp.isCache,
      sp.showMode,
      BIT_OR(sp.permissionValue) permissionValue
    FROM sys_user_roles sur
    INNER JOIN sys_roles sr ON sur.roleId = sr.id
    INNER JOIN sys_role_permissions srp ON srp.roleId = sr.id
    INNER JOIN sys_permissions sp ON sp.id = srp.permissionId
    WHERE 
      sur.userId = :userId AND 
      sur.appId = :appId AND
      sp.isVisible = 1
    GROUP BY sp.permCode
    ORDER BY sp.sortOrder ASC;
    `

    const [appTypeIdResult, result] = await executeRawSql(this.entityManager, sql, { userId, appId }, true);
    const permissions = result.map((item: any) => item.permCode)
    const appTypeId = appTypeIdResult[0]?.appTypeId || ''

    // 构建 permissionValueMap
    const permissionValueMap: Record<string, string> = {};
    for (const item of result) {
      if (item.permissionValue) {
        permissionValueMap[item.permCode] = item.permissionValue.toString();
      }
    }

    let menuTree = flatToTree(result as any[])

    // 检测自定义菜单：存在时按自定义菜单结构重建 menuTree
    if (appTypeId) {
      const appTypeRepository = this.entityManager.getRepository(AppType);
      const appType = await appTypeRepository.findOne({
        where: { id: appTypeId },
        select: ['id', 'customMenu'],
      });

      if (appType?.customMenu?.length) {
        const nodeMap = new Map<string, any>();
        for (const item of result) {
          nodeMap.set(item.permCode, item);
        }
        menuTree = buildCustomMenuTree(appType.customMenu, nodeMap);
      }
    }

    return {
      menuTree,
      permissions: permissions,
      appTypeId: appTypeId,
      permissionValueMap,
    };
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

    const jwtConfig = this.getJwtConfig();
    const refreshExpiresIn = jwtConfig.refreshExpiresIn;
    const refreshToken = await this.jwtService.signAsync(payload, { expiresIn: refreshExpiresIn });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: jwtConfig.expiresIn,
      user: {
        username: user.username,
        nickname: user.nickname || user.username,
        avatar: user.avatar,
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

/**
 * 根据自定义菜单结构重建菜单树
 */
function buildCustomMenuTree(
  customMenus: CustomMenuItem[],
  nodeMap: Map<string, any>,
): any[] {
  return customMenus
    .map((item) => {
      const dbNode = nodeMap.get(item.permCode);
      if (!dbNode) return null;
      return {
        ...dbNode,
        permName: item.permName,
        iconName: item.icon || dbNode.iconName,
        sortOrder: item.sortOrder ?? dbNode.sortOrder,
        children: item.children?.length
          ? buildCustomMenuTree(item.children, nodeMap)
          : dbNode.children || [],
      };
    })
    .filter(Boolean);
}
