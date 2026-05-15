/**
 * @fileoverview 认证服务
 * @description 处理用户认证相关业务逻辑
 */
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { UserRole } from '../role/entities/user-role.entity';
import { Role } from '../role/entities/role.entity';
import { Permission } from '../permission/entities/permission.entity';
import { RolePermission } from '../role/entities/role-permission.entity';
import { AppTypePermissionEntity } from '../app-type/entities/app-type-permission.entity';
import { LoginDto } from './dto/req/login.dto';
import { LoginResponseDto, UserInfoDto, AppInstanceItemDto } from './dto/res/auth-response.dto';
import { UserPermissionsResponseDto } from './dto/res/user-permissions-response.dto';
import { RegisterDto } from './dto/req/register.dto';
import { CheckAvailabilityResponseDto } from './dto/req/check-availability.dto';
/**
 * 认证服务
 */
export declare class AuthService {
    private entityManager;
    private dataSource;
    private userRepository;
    private userRoleRepository;
    private roleRepository;
    private permissionRepository;
    private rolePermissionRepository;
    private appTypePermissionRepository;
    private jwtService;
    private configService;
    constructor(entityManager: EntityManager, dataSource: DataSource, userRepository: Repository<User>, userRoleRepository: Repository<UserRole>, roleRepository: Repository<Role>, permissionRepository: Repository<Permission>, rolePermissionRepository: Repository<RolePermission>, appTypePermissionRepository: Repository<AppTypePermissionEntity>, jwtService: JwtService, configService: ConfigService);
    private getJwtConfig;
    /**
     * 用户登录
     * @param loginDto - 登录请求参数
     * @returns 登录响应（包含 Token）
     */
    login(loginDto: LoginDto): Promise<LoginResponseDto>;
    /**
     * 刷新 Token
     * @param refreshToken - 刷新 Token
     * @returns 新的 Token 对
     */
    refreshToken(refreshToken: string): Promise<LoginResponseDto>;
    /**
     * 获取当前用户信息
     * @param userId - 用户 ID
     * @returns 用户信息
     */
    getCurrentUser(userId: string): Promise<UserInfoDto>;
    /**
     * 退出登录
     * @description 清理 Token（可在 Redis 中将 Token 加入黑名单）
     * @param token - 当前 Token
     */
    logout(_token: string): Promise<void>;
    /**
     * 获取用户可访问的应用实例列表
     * @param userId - 用户 ID
     * @returns 用户可访问的应用实例列表
     */
    getUserApps(userId: string): Promise<AppInstanceItemDto[]>;
    /**
     * 获取用户权限菜单
     * @param userId - 用户 ID
     * @param appId - 应用实例 ID
     * @returns 用户权限菜单树
     */
    getUserPermissions(userId: string, appId: string): Promise<UserPermissionsResponseDto>;
    /**
     * 用户自注册
     * @param registerDto - 注册请求参数
     * @returns 登录响应（包含 Token）
     */
    register(registerDto: RegisterDto): Promise<LoginResponseDto>;
    /**
     * 检查用户名/邮箱/手机号可用性
     * @param checkDto - 检查请求参数
     * @returns 可用性检查结果
     */
    checkAvailability(checkDto: {
        username?: string;
        email?: string;
        phone?: string;
    }): Promise<CheckAvailabilityResponseDto>;
    /**
     * 修改密码
     * @param userId - 用户 ID
     * @param oldPassword - 旧密码
     * @param newPassword - 新密码
     */
    changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void>;
    /**
     * 同步用户权限（重新加载用户权限缓存）
     * @param userId - 用户 ID
     * @param appId - 应用实例 ID
     * @returns 用户权限菜单树
     */
    syncPermissions(userId: string, appId: string): Promise<UserPermissionsResponseDto>;
}
