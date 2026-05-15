/**
 * @fileoverview 用户控制器
 * @description 处理用户相关 HTTP 请求
 */
import { UserService } from './user.service';
import { CreateUserDto, AdminCreateUserDto, UpdateUserDto, QueryUserDto, ResetPasswordDto } from './dto';
import { StatusDto } from '@/common/types/status.dto';
/**
 * 用户控制器
 * @description 处理用户相关的 CRUD 请求
 */
export declare class UserController {
    private userService;
    constructor(userService: UserService);
    /**
     * 创建用户
     */
    create(createUserDto: CreateUserDto): Promise<import("../../../common").ApiResponse<import(".").User>>;
    adminCreate(dto: AdminCreateUserDto): Promise<import("../../../common").ApiResponse<import(".").User>>;
    /**
     * 查询用户列表
     */
    findAll(query: QueryUserDto): Promise<import("../../../common").ApiResponse<import("../../../common").PaginationResult<any>>>;
    findOneByKeyword(keyword: string, searchBy?: 'username' | 'phone' | 'both'): Promise<import("../../../common").ApiResponse<import(".").User | null>>;
    /**
     * 根据 ID 查询用户
     */
    findById(id: string): Promise<import("../../../common").ApiResponse<import(".").User>>;
    /**
     * 更新用户
     */
    update(id: string, updateUserDto: UpdateUserDto): Promise<import("../../../common").ApiResponse<import(".").User>>;
    /**
     * 删除用户
     */
    delete(id: string): Promise<import("../../../common").ApiResponse<null>>;
    /**
     * 更新用户状态
     */
    updateStatus(id: string, body: StatusDto): Promise<import("../../../common").ApiResponse<import(".").User>>;
    /**
     * 重置用户密码
     */
    resetPassword(id: string, body: ResetPasswordDto): Promise<import("../../../common").ApiResponse<null>>;
}
