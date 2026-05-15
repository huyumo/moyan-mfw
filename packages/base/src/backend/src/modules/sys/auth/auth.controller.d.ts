/**
 * @fileoverview 认证控制器
 * @description 处理用户认证相关请求
 */
import { UserDto } from '../../../common';
import { AuthService } from './auth.service';
import { LoginDto, LoginResponseDto, UserInfoDto, AppInstanceItemDto, UserPermissionsResponseDto, RegisterDto, CheckAvailabilityDto, CheckAvailabilityResponseDto, LogoutDto } from './dto';
/**
 * 认证控制器
 * @description 处理用户登录、登出、Token 刷新等认证相关请求
 */
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    /**
     * 用户登录
     * @param loginDto - 登录请求参数
     * @returns 登录响应（包含 Token）
     */
    login(loginDto: LoginDto): Promise<import("../../../common").ApiResponse<LoginResponseDto>>;
    /**
     * 刷新 Token
     * @param refreshTokenDto - 刷新 Token 请求参数
     * @returns 新的 Token 对
     */
    refreshToken(refreshToken: string): Promise<import("../../../common").ApiResponse<LoginResponseDto>>;
    /**
     * 获取当前用户信息
     * @param user - 用户信息（从 JWT 中解析）
     * @returns 当前用户信息
     */
    getCurrentUser(user: UserDto): Promise<import("../../../common").ApiResponse<UserInfoDto>>;
    /**
     * 退出登录
     * @param req - 请求对象
     * @returns 退出结果
     */
    logout(dto: LogoutDto): Promise<import("../../../common").ApiResponse<null>>;
    /**
     * 获取用户可访问的应用实例列表
     * @param user - 用户信息（从 JWT 中解析）
     * @returns 用户可访问的应用实例列表
     */
    getUserApps(user: UserDto): Promise<import("../../../common").ApiResponse<AppInstanceItemDto[]>>;
    /**
     * 获取用户权限菜单
     * @param user - 用户信息（从 JWT 中解析）
     * @param query - 查询参数（appId）
     * @returns 用户权限菜单树
     */
    getUserPermissions(user: UserDto, appId: string): Promise<import("../../../common").ApiResponse<UserPermissionsResponseDto>>;
    /**
     * 用户自注册
     * @param registerDto - 注册请求参数
     * @returns 登录响应（包含 Token）
     */
    register(registerDto: RegisterDto): Promise<import("../../../common").ApiResponse<LoginResponseDto>>;
    /**
     * 检查用户名/邮箱/手机号可用性
     * @param query - 检查参数
     * @returns 可用性检查结果
     */
    checkAvailability(query: CheckAvailabilityDto): Promise<import("../../../common").ApiResponse<CheckAvailabilityResponseDto>>;
    /**
     * 修改密码
     * @param user - 用户信息
     * @param body - 请求体
     * @returns 修改结果
     */
    changePassword(user: UserDto, body: {
        oldPassword: string;
        newPassword: string;
    }): Promise<import("../../../common").ApiResponse<null>>;
    /**
     * 同步用户权限
     * @param user - 用户信息
     * @param query - 查询参数
     * @returns 用户权限菜单树
     */
    syncPermissions(user: UserDto, appId: string): Promise<import("../../../common").ApiResponse<UserPermissionsResponseDto>>;
}
