/**
 * API 调用类，该文件的API为自动生成，请勿手动修改
 */
import { ApiCall } from 'moyan-api'
import type { MoMethod } from 'moyan-api'

import type {
  LoginDto,
  UserSummaryDto,
  LoginResponseDto,
  UserInfoDto,
  AppInstanceItemDto,
  PermissionTreeNodeDto,
  UserPermissionsResponseDto,
  RegisterDto,
  CheckAvailabilityResponseDto,
  CreateUserDto,
  UserResponseDto,
  AdminCreateUserDto,
  PageResponseDto,
  UpdateUserDto,
  ResetPasswordDto,
  CreateRoleDto,
  RoleResponseDto,
  UpdateRoleDto,
  PermissionTreePayloadDto,
  PermissionTreesDto,
  AssignPermissionsDto,
  RolePermissionTreesResponseDto,
  RolePermissionResponseDto,
  CreatePermissionDto,
  PermissionResponseDto,
  UpdatePermissionDto,
  RouteNodeDto,
  SyncPermissionDto,
  CreateAppTypeDto,
  AppTypeResponseDto,
  PermissionTreesResponseDto,
  PermissionPoolResponseDto,
  UpdatePermissionPoolDto,
  UpdatePermissionPoolResponseDto,
  UpdateAppTypeDto,
  CreateAppDto,
  AppDetailResponseDto,
  UpdateAppDto,
  AddMemberDto,
  MemberRoleInfoDto,
  MemberResponseDto,
  UpdateMemberRolesDto,
  AvailableAvailableRoleDto,
  AuditLogResponseDto,
  InitStatusResponseDto,
  InitRequestDto,
  InitResponseDto,
  ObjectId,
  int,
  char,
  varchar,
  json,
  date,
  datetime,
  array,
  tinyint,
  text,
  integer,
  float,
  decimal,
} from './schemas'

/**
 * auth|认证相关接口->用户登录
 */
export class ApiAuthLogin extends ApiCall<
  {
    body: LoginDto
  },
  LoginResponseDto
> {
  readonly path = '/api/auth/login'
  readonly method: MoMethod = 'POST'
  readonly auth = false
}

/**
 * auth|认证相关接口->刷新 Token
 */
export class ApiAuthRefreshToken extends ApiCall<{}, LoginResponseDto> {
  readonly path = '/api/auth/refresh'
  readonly method: MoMethod = 'POST'
  readonly auth = false
}

/**
 * auth|认证相关接口->获取当前用户信息
 */
export class ApiAuthGetCurrentUser extends ApiCall<{}, UserInfoDto> {
  readonly path = '/api/auth/userinfo'
  readonly method: MoMethod = 'POST'
  readonly auth = true
}

/**
 * auth|认证相关接口->退出登录
 */
export class ApiAuthLogout extends ApiCall<{}, unknown> {
  readonly path = '/api/auth/logout'
  readonly method: MoMethod = 'POST'
  readonly auth = true
}

/**
 * auth|认证相关接口->获取用户应用列表
 */
export class ApiAuthGetUserApps extends ApiCall<{}, Array<AppInstanceItemDto>> {
  readonly path = '/api/auth/apps'
  readonly method: MoMethod = 'GET'
  readonly auth = true
}

/**
 * auth|认证相关接口->获取用户权限菜单
 */
export class ApiAuthGetUserPermissions extends ApiCall<
  {
    query: {
      appId: string //应用实例 ID
    }
  },
  UserPermissionsResponseDto
> {
  readonly path = '/api/auth/permissions'
  readonly method: MoMethod = 'GET'
  readonly auth = true
}

/**
 * auth|认证相关接口->用户注册
 */
export class ApiAuthRegister extends ApiCall<
  {
    body: RegisterDto
  },
  LoginResponseDto
> {
  readonly path = '/api/auth/register'
  readonly method: MoMethod = 'POST'
  readonly auth = false
}

/**
 * auth|认证相关接口->检查可用性
 */
export class ApiAuthCheckAvailability extends ApiCall<
  {
    query: {
      username?: string //用户名
      email?: string //邮箱
      phone?: string //手机号
    }
  },
  CheckAvailabilityResponseDto
> {
  readonly path = '/api/auth/check-availability'
  readonly method: MoMethod = 'GET'
  readonly auth = false
}

/**
 * auth|认证相关接口->修改密码
 */
export class ApiAuthChangePassword extends ApiCall<{}, unknown> {
  readonly path = '/api/auth/change-password'
  readonly method: MoMethod = 'POST'
  readonly auth = true
}

/**
 * auth|认证相关接口->同步权限
 */
export class ApiAuthSyncPermissions extends ApiCall<
  {},
  UserPermissionsResponseDto
> {
  readonly path = '/api/auth/sync-permissions'
  readonly method: MoMethod = 'POST'
  readonly auth = true
}

/**
 * user|用户相关接口->创建用户
 */
export class ApiUserCreate extends ApiCall<
  {
    body: CreateUserDto
  },
  UserResponseDto
> {
  readonly path = '/api/users'
  readonly method: MoMethod = 'POST'
  readonly auth = true
}

/**
 * user|用户相关接口->查询用户列表
 */
export class ApiUserFindAll extends ApiCall<
  {
    query: {
      page: number //页码
      pageSize: number //每页数量
      sortField?: string //排序字段
      sortOrder?: string //排序方向
      username?: string //用户名（模糊查询）
      phone?: string //手机号
      userStatus?: number //状态 (1:启用 0:禁用)
    }
  },
  PageResponseDto & {
    list: Array<UserResponseDto>
  }
> {
  readonly path = '/api/users'
  readonly method: MoMethod = 'GET'
  readonly auth = true
}

/**
 * user|用户相关接口->管理员创建用户
 */
export class ApiUserAdminCreate extends ApiCall<
  {
    body: AdminCreateUserDto
  },
  UserResponseDto
> {
  readonly path = '/api/users/admin-create'
  readonly method: MoMethod = 'POST'
  readonly auth = true
}

/**
 * user|用户相关接口->精确查找用户
 */
export class ApiUserFindOneByKeyword extends ApiCall<
  {
    query: {
      keyword: string //搜索关键词
      searchBy?: string //搜索方式: username | phone | both
    }
  },
  UserResponseDto
> {
  readonly path = '/api/users/find-one'
  readonly method: MoMethod = 'GET'
  readonly auth = true
}

/**
 * user|用户相关接口->根据 ID 查询用户
 */
export class ApiUserFindById extends ApiCall<
  {
    params: {
      id: string //用户 ID
    }
  },
  UserResponseDto
> {
  readonly path = '/api/users/{id}'
  readonly method: MoMethod = 'GET'
  readonly auth = true
}

/**
 * user|用户相关接口->更新用户
 */
export class ApiUserUpdate extends ApiCall<
  {
    body: UpdateUserDto
    params: {
      id: string //用户 ID
    }
  },
  UserResponseDto
> {
  readonly path = '/api/users/{id}'
  readonly method: MoMethod = 'PUT'
  readonly auth = true
}

/**
 * user|用户相关接口->删除用户
 */
export class ApiUserDelete extends ApiCall<
  {
    params: {
      id: string //用户 ID
    }
  },
  unknown
> {
  readonly path = '/api/users/{id}'
  readonly method: MoMethod = 'DELETE'
  readonly auth = true
}

/**
 * user|用户相关接口->更新用户状态
 */
export class ApiUserUpdateStatus extends ApiCall<
  {
    params: {
      id: string //用户 ID
    }
    query: {
      status: number //状态 (1:启用 0:禁用)
    }
  },
  UserResponseDto
> {
  readonly path = '/api/users/{id}/status'
  readonly method: MoMethod = 'PUT'
  readonly auth = true
}

/**
 * user|用户相关接口->重置用户密码
 */
export class ApiUserResetPassword extends ApiCall<
  {
    body: ResetPasswordDto
    params: {
      id: string
    }
  },
  unknown
> {
  readonly path = '/api/users/{id}/reset-password'
  readonly method: MoMethod = 'POST'
  readonly auth = true
}

/**
 * role|角色相关接口->创建角色
 */
export class ApiRoleCreate extends ApiCall<
  {
    body: CreateRoleDto
  },
  RoleResponseDto
> {
  readonly path = '/api/roles'
  readonly method: MoMethod = 'POST'
  readonly auth = true
}

/**
 * role|角色相关接口->查询角色列表
 */
export class ApiRoleFindAll extends ApiCall<
  {
    query: {
      page: number //页码
      pageSize: number //每页数量
      sortField?: string //排序字段
      sortOrder?: string //排序方向
      roleCode?: string //角色编码（模糊查询）
      roleName?: string //角色名称（模糊查询）
      roleStatus?: number //角色状态
      appTypeId?: string //应用类型 ID
      appId?: string //应用 ID
    }
  },
  PageResponseDto & {
    list: Array<RoleResponseDto>
  }
> {
  readonly path = '/api/roles'
  readonly method: MoMethod = 'GET'
  readonly auth = true
}

/**
 * role|角色相关接口->根据 ID 查询角色
 */
export class ApiRoleFindById extends ApiCall<
  {
    params: {
      id: string //角色 ID
    }
  },
  RoleResponseDto
> {
  readonly path = '/api/roles/{id}'
  readonly method: MoMethod = 'GET'
  readonly auth = true
}

/**
 * role|角色相关接口->更新角色
 */
export class ApiRoleUpdate extends ApiCall<
  {
    body: UpdateRoleDto
    params: {
      id: string //角色 ID
    }
  },
  RoleResponseDto
> {
  readonly path = '/api/roles/{id}'
  readonly method: MoMethod = 'PUT'
  readonly auth = true
}

/**
 * role|角色相关接口->删除角色
 */
export class ApiRoleDelete extends ApiCall<
  {
    params: {
      id: string //角色 ID
    }
  },
  unknown
> {
  readonly path = '/api/roles/{id}'
  readonly method: MoMethod = 'DELETE'
  readonly auth = true
}

/**
 * role|角色相关接口->分配权限
 */
export class ApiRoleAssignPermissions extends ApiCall<
  {
    body: AssignPermissionsDto
    params: {
      id: string //角色 ID
    }
  },
  unknown
> {
  readonly path = '/api/roles/{id}/permissions'
  readonly method: MoMethod = 'POST'
  readonly auth = true
}

/**
 * role|角色相关接口->获取角色权限
 */
export class ApiRoleGetRolePermissions extends ApiCall<
  {
    params: {
      id: string //角色 ID
    }
  },
  RolePermissionResponseDto
> {
  readonly path = '/api/roles/{id}/permissions'
  readonly method: MoMethod = 'GET'
  readonly auth = true
}

/**
 * permission|权限相关接口->创建权限
 */
export class ApiPermissionCreate extends ApiCall<
  {
    body: CreatePermissionDto
  },
  PermissionResponseDto
> {
  readonly path = '/api/permissions'
  readonly method: MoMethod = 'POST'
  readonly auth = true
}

/**
 * permission|权限相关接口->查询权限列表
 */
export class ApiPermissionFindAll extends ApiCall<
  {
    query: {
      page: number //页码
      pageSize: number //每页数量
      sortField?: string //排序字段
      sortOrder?: string //排序方向
      appTypeId?: string //应用类型 ID
      permName?: string //权限名称（模糊查询）
      permCode?: string //权限编码（模糊查询）
      permissionType?: string //权限类型
      nodeType?: string //节点类型
      parentId?: string //父权限 ID
    }
  },
  PageResponseDto & {
    list: Array<PermissionResponseDto>
  }
> {
  readonly path = '/api/permissions'
  readonly method: MoMethod = 'GET'
  readonly auth = true
}

/**
 * permission|权限相关接口->查询所有权限树
 */
export class ApiPermissionFindAllTree extends ApiCall<
  {
    query: {
      permissionType?: string //权限类型：PC/NORMAL
    }
  },
  Array<PermissionTreeNodeDto>
> {
  readonly path = '/api/permissions/tree/all'
  readonly method: MoMethod = 'GET'
  readonly auth = true
}

/**
 * permission|权限相关接口->获取权限树
 */
export class ApiPermissionGetPermissionTree extends ApiCall<
  {
    query: {
      parentId?: string //父权限 ID，不传则查询根节点
    }
  },
  Array<PermissionTreeNodeDto>
> {
  readonly path = '/api/permissions/tree'
  readonly method: MoMethod = 'GET'
  readonly auth = true
}

/**
 * permission|权限相关接口->根据 ID 查询权限
 */
export class ApiPermissionFindById extends ApiCall<
  {
    params: {
      id: string //权限 ID
    }
  },
  PermissionResponseDto
> {
  readonly path = '/api/permissions/{id}'
  readonly method: MoMethod = 'GET'
  readonly auth = true
}

/**
 * permission|权限相关接口->更新权限
 */
export class ApiPermissionUpdate extends ApiCall<
  {
    body: UpdatePermissionDto
    params: {
      id: string //权限 ID
    }
  },
  PermissionResponseDto
> {
  readonly path = '/api/permissions/{id}'
  readonly method: MoMethod = 'PUT'
  readonly auth = true
}

/**
 * permission|权限相关接口->删除权限
 */
export class ApiPermissionDelete extends ApiCall<
  {
    params: {
      id: string //权限 ID
    }
  },
  unknown
> {
  readonly path = '/api/permissions/{id}'
  readonly method: MoMethod = 'DELETE'
  readonly auth = true
}

/**
 * permission|权限相关接口->批量创建权限
 */
export class ApiPermissionBatchCreate extends ApiCall<
  {
    body: Array<CreatePermissionDto>
  },
  Array<PermissionResponseDto>
> {
  readonly path = '/api/permissions/batch'
  readonly method: MoMethod = 'POST'
  readonly auth = true
}

/**
 * permission|权限相关接口->同步路由到权限表
 */
export class ApiPermissionSyncPermissions extends ApiCall<
  {
    body: SyncPermissionDto
  },
  Array<PermissionTreeNodeDto>
> {
  readonly path = '/api/permissions/sync'
  readonly method: MoMethod = 'POST'
  readonly auth = true
}

/**
 * app-type|应用类型相关接口->创建应用类型
 */
export class ApiAppTypeCreate extends ApiCall<
  {
    body: CreateAppTypeDto
  },
  AppTypeResponseDto
> {
  readonly path = '/api/app-types'
  readonly method: MoMethod = 'POST'
  readonly auth = true
}

/**
 * app-type|应用类型相关接口->查询应用类型列表
 */
export class ApiAppTypeFindAll extends ApiCall<
  {
    query: {
      page: number //页码
      pageSize: number //每页数量
      sortField?: string //排序字段
      sortOrder?: string //排序方向
      typeName?: string //类型名称（模糊查询）
      typeCode?: string //类型编码（模糊查询）
      typeStatus?: number //类型状态
    }
  },
  PageResponseDto & {
    list: Array<AppTypeResponseDto>
  }
> {
  readonly path = '/api/app-types'
  readonly method: MoMethod = 'GET'
  readonly auth = true
}

/**
 * app-type|应用类型相关接口->查询所有应用类型
 */
export class ApiAppTypeFindAllList extends ApiCall<
  {},
  Array<AppTypeResponseDto>
> {
  readonly path = '/api/app-types/all'
  readonly method: MoMethod = 'GET'
  readonly auth = true
}

/**
 * app-type|应用类型相关接口->根据 ID 查询应用类型
 */
export class ApiAppTypeFindById extends ApiCall<
  {
    params: {
      id: string //应用类型 ID
    }
  },
  AppTypeResponseDto
> {
  readonly path = '/api/app-types/{id}'
  readonly method: MoMethod = 'GET'
  readonly auth = true
}

/**
 * app-type|应用类型相关接口->更新应用类型
 */
export class ApiAppTypeUpdate extends ApiCall<
  {
    body: UpdateAppTypeDto
    params: {
      id: string //应用类型 ID
    }
  },
  AppTypeResponseDto
> {
  readonly path = '/api/app-types/{id}'
  readonly method: MoMethod = 'PUT'
  readonly auth = true
}

/**
 * app-type|应用类型相关接口->删除应用类型
 */
export class ApiAppTypeDelete extends ApiCall<
  {
    params: {
      id: string //应用类型 ID
    }
  },
  unknown
> {
  readonly path = '/api/app-types/{id}'
  readonly method: MoMethod = 'DELETE'
  readonly auth = true
}

/**
 * app-type|应用类型相关接口->获取权限池配置
 */
export class ApiAppTypeGetPermissionPool extends ApiCall<
  {
    params: {
      appTypeId: string //应用类型 ID
    }
  },
  PermissionPoolResponseDto
> {
  readonly path = '/api/app-types/{appTypeId}/permission-pool'
  readonly method: MoMethod = 'GET'
  readonly auth = true
}

/**
 * app-type|应用类型相关接口->更新权限池配置
 */
export class ApiAppTypeUpdatePermissionPool extends ApiCall<
  {
    body: UpdatePermissionPoolDto
    params: {
      appTypeId: string //应用类型 ID
    }
  },
  UpdatePermissionPoolResponseDto
> {
  readonly path = '/api/app-types/{appTypeId}/permission-pool'
  readonly method: MoMethod = 'PUT'
  readonly auth = true
}

/**
 * app-type|应用类型相关接口->更新应用类型状态
 */
export class ApiAppTypeUpdateStatus extends ApiCall<
  {
    params: {
      id: string //应用类型 ID
    }
    query: {
      status: number //状态 (1:启用 0:禁用)
    }
  },
  AppTypeResponseDto
> {
  readonly path = '/api/app-types/{id}/status'
  readonly method: MoMethod = 'PUT'
  readonly auth = true
}

/**
 * app|应用实例相关接口->创建应用实例
 */
export class ApiAppCreate extends ApiCall<
  {
    body: CreateAppDto
  },
  AppDetailResponseDto
> {
  readonly path = '/api/apps'
  readonly method: MoMethod = 'POST'
  readonly auth = true
}

/**
 * app|应用实例相关接口->查询应用实例列表
 */
export class ApiAppFindAll extends ApiCall<
  {
    query: {
      page: number //页码
      pageSize: number //每页数量
      sortField?: string //排序字段
      sortOrder?: string //排序方向
      appName?: string //应用名称（模糊查询）
      appCode?: string //应用编码（模糊查询）
      appTypeId?: string //应用类型 ID
      ownerId?: string //拥有者 ID
      appStatus?: number //应用状态
    }
  },
  PageResponseDto & {
    list: Array<AppDetailResponseDto>
  }
> {
  readonly path = '/api/apps'
  readonly method: MoMethod = 'GET'
  readonly auth = true
}

/**
 * app|应用实例相关接口->根据 ID 查询应用实例
 */
export class ApiAppFindById extends ApiCall<
  {
    params: {
      id: string //应用实例 ID
    }
  },
  AppDetailResponseDto
> {
  readonly path = '/api/apps/{id}'
  readonly method: MoMethod = 'GET'
  readonly auth = true
}

/**
 * app|应用实例相关接口->更新应用实例
 */
export class ApiAppUpdate extends ApiCall<
  {
    body: UpdateAppDto
    params: {
      id: string //应用实例 ID
    }
  },
  AppDetailResponseDto
> {
  readonly path = '/api/apps/{id}'
  readonly method: MoMethod = 'PUT'
  readonly auth = true
}

/**
 * app|应用实例相关接口->删除应用实例
 */
export class ApiAppDelete extends ApiCall<
  {
    params: {
      id: string //应用实例 ID
    }
  },
  unknown
> {
  readonly path = '/api/apps/{id}'
  readonly method: MoMethod = 'DELETE'
  readonly auth = true
}

/**
 * app|应用实例相关接口->变更负责人
 */
export class ApiAppChangeOwner extends ApiCall<
  {
    params: {
      id: string //应用实例 ID
    }
    query: {
      ownerId: string //新负责人 ID
    }
  },
  AppDetailResponseDto
> {
  readonly path = '/api/apps/{id}/owner'
  readonly method: MoMethod = 'PUT'
  readonly auth = true
}

/**
 * app|应用实例相关接口->更新应用实例状态
 */
export class ApiAppUpdateStatus extends ApiCall<
  {
    params: {
      id: string //应用实例 ID
    }
    query: {
      status: number //状态 (1:启用 0:禁用)
    }
  },
  AppDetailResponseDto
> {
  readonly path = '/api/apps/{id}/status'
  readonly method: MoMethod = 'PUT'
  readonly auth = true
}

/**
 * member|应用成员相关接口->添加应用成员
 */
export class ApiAppMemberAddMember extends ApiCall<
  {
    body: AddMemberDto
    params: {
      appId: string //应用 ID
    }
  },
  unknown
> {
  readonly path = '/api/apps/{appId}/members'
  readonly method: MoMethod = 'POST'
  readonly auth = true
}

/**
 * member|应用成员相关接口->获取应用成员列表
 */
export class ApiAppMemberGetMembers extends ApiCall<
  {
    params: {
      appId: string
    }
    query: {
      page: number //页码
      pageSize: number //每页数量
      sortField?: string //排序字段
      sortOrder?: string //排序方向
      nickname?: string //用户昵称（模糊查询）
      username?: string //用户名（模糊查询）
    }
  },
  PageResponseDto & {
    list: Array<MemberResponseDto>
  }
> {
  readonly path = '/api/apps/{appId}/members'
  readonly method: MoMethod = 'GET'
  readonly auth = true
}

/**
 * member|应用成员相关接口->更新成员角色
 */
export class ApiAppMemberUpdateRoles extends ApiCall<
  {
    body: UpdateMemberRolesDto
    params: {
      appId: string //应用 ID
      userId: string //用户 ID
    }
  },
  unknown
> {
  readonly path = '/api/apps/{appId}/members/{userId}/roles'
  readonly method: MoMethod = 'PUT'
  readonly auth = true
}

/**
 * member|应用成员相关接口->移除应用成员
 */
export class ApiAppMemberRemoveMember extends ApiCall<
  {
    params: {
      appId: string //应用 ID
      userId: string //用户 ID
    }
  },
  unknown
> {
  readonly path = '/api/apps/{appId}/members/{userId}'
  readonly method: MoMethod = 'DELETE'
  readonly auth = true
}

/**
 * member|应用成员相关接口->获取可选角色列表
 */
export class ApiAppMemberGetAvailableRoles extends ApiCall<
  {
    params: {
      appId: string //应用 ID
    }
  },
  Array<AvailableAvailableRoleDto>
> {
  readonly path = '/api/apps/{appId}/members/available-roles'
  readonly method: MoMethod = 'GET'
  readonly auth = true
}

/**
 * audit-log|审计日志相关接口->查询审计日志列表
 */
export class ApiAuditLogFindAll extends ApiCall<
  {
    query: {
      page: number //页码
      pageSize: number //每页数量
      sortField?: string //排序字段
      sortOrder?: string //排序方向
      module?: string //所属模块
      event?: string //事件名称
      operatorId?: string //操作人 ID
      targetId?: string //目标 ID
      startTime?: string //开始时间
      endTime?: string //结束时间
    }
  },
  PageResponseDto & {
    list: Array<AuditLogResponseDto>
  }
> {
  readonly path = '/api/audit-logs'
  readonly method: MoMethod = 'GET'
  readonly auth = true
}

/**
 * audit-log|审计日志相关接口->根据 ID 查询审计日志
 */
export class ApiAuditLogFindById extends ApiCall<
  {
    params: {
      id: string //审计日志 ID
    }
  },
  AuditLogResponseDto
> {
  readonly path = '/api/audit-logs/{id}'
  readonly method: MoMethod = 'GET'
  readonly auth = true
}

/**
 * audit-log|审计日志相关接口->根据目标 ID 查询审计日志
 */
export class ApiAuditLogFindByTargetId extends ApiCall<
  {
    params: {
      targetId: string //目标 ID
    }
  },
  Array<AuditLogResponseDto>
> {
  readonly path = '/api/audit-logs/target/{targetId}'
  readonly method: MoMethod = 'GET'
  readonly auth = true
}

/**
 * audit-log|审计日志相关接口->根据操作人 ID 查询审计日志
 */
export class ApiAuditLogFindByOperatorId extends ApiCall<
  {
    params: {
      operatorId: string //操作人 ID
    }
  },
  Array<AuditLogResponseDto>
> {
  readonly path = '/api/audit-logs/operator/{operatorId}'
  readonly method: MoMethod = 'GET'
  readonly auth = true
}

/**
 * audit-log|审计日志相关接口->清理审计日志
 */
export class ApiAuditLogDeleteBeforeDate extends ApiCall<
  {
    params: {
      beforeDate: string //日期 (YYYY-MM-DD)
    }
  },
  unknown
> {
  readonly path = '/api/audit-logs/before/{beforeDate}'
  readonly method: MoMethod = 'DELETE'
  readonly auth = true
}

/**
 * health|健康检查接口->健康检查
 */
export class ApiHealthHealthCheck extends ApiCall<{}, unknown> {
  readonly path = '/api/health'
  readonly method: MoMethod = 'GET'
  readonly auth = false
}

/**
 * health|健康检查接口->就绪检查
 */
export class ApiHealthReadyCheck extends ApiCall<{}, unknown> {
  readonly path = '/api/health/ready'
  readonly method: MoMethod = 'GET'
  readonly auth = false
}

/**
 * health|健康检查接口->存活检查
 */
export class ApiHealthLiveCheck extends ApiCall<{}, unknown> {
  readonly path = '/api/health/live'
  readonly method: MoMethod = 'GET'
  readonly auth = false
}

/**
 * 系统初始化->检查系统是否已初始化
 */
export class ApiInstallGetStatus extends ApiCall<{}, InitStatusResponseDto> {
  readonly path = '/api/install/status'
  readonly method: MoMethod = 'GET'
  readonly auth = false
}

/**
 * 系统初始化->执行系统初始化
 */
export class ApiInstallInitialize extends ApiCall<
  {
    body: InitRequestDto
  },
  InitResponseDto
> {
  readonly path = '/api/install/init'
  readonly method: MoMethod = 'POST'
  readonly auth = false
}
