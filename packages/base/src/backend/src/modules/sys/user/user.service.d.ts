/**
 * @fileoverview 用户服务
 * @description 处理用户相关业务逻辑
 */
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { UserRole } from '../role/entities/user-role.entity';
import { CreateUserDto, AdminCreateUserDto, UpdateUserDto, QueryUserDto } from './dto';
import { PaginationResult } from '../../../common';
/**
 * 用户服务
 */
export declare class UserService {
    private userRepository;
    private userRoleRepository;
    private dataSource;
    private configService;
    constructor(userRepository: Repository<User>, userRoleRepository: Repository<UserRole>, dataSource: DataSource, configService: ConfigService);
    /**
     * 创建用户
     * @param createUserDto - 创建用户请求参数
     * @returns 创建的用户
     */
    create(createUserDto: CreateUserDto): Promise<User>;
    adminCreate(dto: AdminCreateUserDto): Promise<User>;
    private resolveDefaultPassword;
    findOneByKeyword(keyword: string, searchBy: 'username' | 'phone' | 'both'): Promise<User | null>;
    /**
     * 根据 ID 查询用户
     * @param id - 用户 ID
     * @returns 用户信息
     */
    findById(id: string): Promise<User>;
    /**
     * 根据用户名查询用户
     * @param username - 用户名
     * @returns 用户信息
     */
    findByUsername(username: string): Promise<User | null>;
    /**
     * 查询用户列表（分页）
     * @param query - 查询参数
     * @returns 分页结果
     */
    findAll(query: QueryUserDto): Promise<PaginationResult<any>>;
    /**
     * 更新用户
     * @param id - 用户 ID
     * @param updateUserDto - 更新用户请求参数
     * @returns 更新后的用户
     */
    update(id: string, updateUserDto: UpdateUserDto): Promise<User>;
    /**
     * 删除用户
     * @param id - 用户 ID
     */
    delete(id: string): Promise<void>;
    /**
     * 更新用户状态
     * @param id - 用户 ID
     * @param status - 新状态
     * @returns 更新后的用户
     */
    updateStatus(id: string, status: number): Promise<User>;
    /**
     * 重置用户密码
     * @param id - 用户 ID
     * @param newPassword - 新密码
     */
    resetPassword(id: string, newPassword: string): Promise<void>;
}
