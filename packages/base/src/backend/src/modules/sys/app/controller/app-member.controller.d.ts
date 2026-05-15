/**
 * @fileoverview 成员控制器
 * @description 处理应用成员相关 HTTP 请求
 */
import { AppMemberService } from '../service/app-member.service';
import { AddMemberDto, UpdateMemberRolesDto, QueryMemberDto } from '../dto';
/**
 * 成员控制器
 * @description 处理应用成员相关的 CRUD 请求
 */
export declare class AppMemberController {
    private appMemberService;
    constructor(appMemberService: AppMemberService);
    /**
     * 添加应用成员
     */
    addMember(appId: string, addMemberDto: AddMemberDto): Promise<import("../../../../common").ApiResponse<import("../entities/app-member.entity").AppMember>>;
    /**
     * 获取应用成员列表
     */
    getMembers(appId: string, query: QueryMemberDto): Promise<import("../../../../common").ApiResponse<import("../../../../common").PaginationResult<any>>>;
    /**
     * 更新成员角色
     */
    updateRoles(appId: string, userId: string, updateDto: UpdateMemberRolesDto): Promise<import("../../../../common").ApiResponse<null>>;
    /**
     * 移除应用成员
     */
    removeMember(appId: string, userId: string): Promise<import("../../../../common").ApiResponse<null>>;
    /**
     * 获取可选角色列表
     */
    getAvailableRoles(appId: string): Promise<import("../../../../common").ApiResponse<any[]>>;
}
