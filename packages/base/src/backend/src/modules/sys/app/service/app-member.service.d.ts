/**
 * @fileoverview 成员服务
 * @description 处理应用成员相关业务逻辑
 */
import { Repository, DataSource } from 'typeorm';
import { AppMember } from '../entities/app-member.entity';
import { Role } from '../../role/entities/role.entity';
import { User } from '../../user/entities/user.entity';
import { App } from '../entities/app.entity';
import { AppType } from '../../app-type/entities/app-type.entity';
import { AddMemberDto, UpdateMemberRolesDto, QueryMemberDto } from '../dto';
import { PaginationResult } from '../../../../common';
/**
 * 成员服务
 */
export declare class AppMemberService {
    private appMemberRepository;
    private roleRepository;
    private userRepository;
    private appRepository;
    private appTypeRepository;
    private dataSource;
    constructor(appMemberRepository: Repository<AppMember>, roleRepository: Repository<Role>, userRepository: Repository<User>, appRepository: Repository<App>, appTypeRepository: Repository<AppType>, dataSource: DataSource);
    /**
     * 添加应用成员
     * @param appId - 应用 ID
     * @param addMemberDto - 添加成员请求参数
     * @returns 创建成员关联
     */
    addMember(appId: string, addMemberDto: AddMemberDto): Promise<AppMember>;
    /**
     * 获取应用成员列表（分页）
     * @param appId - 应用 ID
     * @param query - 查询参数
     * @returns 分页结果
     */
    getMembers(appId: string, query: QueryMemberDto): Promise<PaginationResult<any>>;
    /**
     * 更新成员角色
     * @param appId - 应用 ID
     * @param userId - 用户 ID
     * @param updateDto - 更新角色请求参数
     */
    updateRoles(appId: string, userId: string, updateDto: UpdateMemberRolesDto): Promise<void>;
    /**
     * 移除应用成员
     * @param appId - 应用 ID
     * @param userId - 用户 ID
     */
    removeMember(appId: string, userId: string): Promise<void>;
    /**
     * 获取可选角色列表
     * @param appId - 应用 ID
     * @returns 可选角色列表（内置角色 + 应用级角色，排除拥有者角色）
     */
    getAvailableRoles(appId: string): Promise<any[]>;
}
