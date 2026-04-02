import { ApiCall } from 'moyan-api'
import type { MoMethod } from 'moyan-api'

import type {
  LoginDto,
  UserSummaryDto,
  LoginResponseDto,
  UserInfoDto,
  CreateUserDto,
  UserResponseDto,
  UpdateUserDto,
  CreateRoleDto,
  RoleResponseDto,
  UpdateRoleDto,
  PermissionItemDto,
  AssignPermissionsDto,
  CreatePermissionDto,
  PermissionResponseDto,
  UpdatePermissionDto,
  CreateAppTypeDto,
  AppTypeResponseDto,
  UpdateAppTypeDto,
  CreateAppDto,
  AppDetailResponseDto,
  UpdateAppDto,
  AddMemberDto,
  RoleInfoDto,
  MemberResponseDto,
  UpdateMemberRolesDto,
  AvailableRoleDto,
  AuditLogResponseDto,
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
export class ApiAuthLogin extends ApiCall<LoginDto, LoginResponseDto> {
  path = '/api/auth/login'
  method: MoMethod = 'POST'
  auth = false
}

/**
 * auth|认证相关接口->刷新 Token
 */
export class ApiAuthRefreshToken extends ApiCall<{}, LoginResponseDto> {
  path = '/api/auth/refresh'
  method: MoMethod = 'POST'
  auth = false
}

/**
 * auth|认证相关接口->获取当前用户信息
 */
export class ApiAuthGetCurrentUser extends ApiCall<{}, UserInfoDto> {
  path = '/api/auth/userinfo'
  method: MoMethod = 'POST'
  auth = true
}

/**
 * auth|认证相关接口->退出登录
 */
export class ApiAuthLogout extends ApiCall<{}, any> {
  path = '/api/auth/logout'
  method: MoMethod = 'POST'
  auth = true
}

/**
 * user|用户相关接口->创建用户
 */
export class ApiUserCreate extends ApiCall<CreateUserDto, any> {
  path = '/api/users'
  method: MoMethod = 'POST'
  auth = true
}

/**
 * user|用户相关接口->查询用户列表
 */
export class ApiUserFindAll extends ApiCall<
  {
    username?: string //用户名（模糊查询）
    phone?: string //手机号
    userStatus?: number //状态 (1:启用 0:禁用)
    page?: number //当前页码
    pageSize?: number //每页数量
  },
  any
> {
  path = '/api/users'
  method: MoMethod = 'GET'
  auth = true
}

/**
 * user|用户相关接口->根据 ID 查询用户
 */
export class ApiUserFindById extends ApiCall<
  {
    id: string //用户 ID
  },
  UserResponseDto
> {
  path = '/api/users/{id}'
  method: MoMethod = 'GET'
  auth = true
}

/**
 * user|用户相关接口->更新用户
 */
export class ApiUserUpdate extends ApiCall<UpdateUserDto, UserResponseDto> {
  path = '/api/users/{id}'
  method: MoMethod = 'PUT'
  auth = true
}

/**
 * user|用户相关接口->删除用户
 */
export class ApiUserDelete extends ApiCall<
  {
    id: string //用户 ID
  },
  any
> {
  path = '/api/users/{id}'
  method: MoMethod = 'DELETE'
  auth = true
}

/**
 * user|用户相关接口->更新用户状态
 */
export class ApiUserUpdateStatus extends ApiCall<
  {
    id: string //用户 ID
    status: number //状态 (1:启用 0:禁用)
  },
  UserResponseDto
> {
  path = '/api/users/{id}/status'
  method: MoMethod = 'PUT'
  auth = true
}

/**
 * user|用户相关接口->重置用户密码
 */
export class ApiUserResetPassword extends ApiCall<
  {
    id: string //用户 ID
    password: string //新密码
  },
  any
> {
  path = '/api/users/{id}/reset-password'
  method: MoMethod = 'POST'
  auth = true
}

/**
 * role|角色相关接口->创建角色
 */
export class ApiRoleCreate extends ApiCall<CreateRoleDto, any> {
  path = '/api/roles'
  method: MoMethod = 'POST'
  auth = true
}

/**
 * role|角色相关接口->查询角色列表
 */
export class ApiRoleFindAll extends ApiCall<
  {
    roleStatus?: number
    roleName?: string
    roleCode?: string
    pageSize?: number
    page?: number
  },
  any
> {
  path = '/api/roles'
  method: MoMethod = 'GET'
  auth = true
}

/**
 * role|角色相关接口->根据 ID 查询角色
 */
export class ApiRoleFindById extends ApiCall<
  {
    id: string //角色 ID
  },
  RoleResponseDto
> {
  path = '/api/roles/{id}'
  method: MoMethod = 'GET'
  auth = true
}

/**
 * role|角色相关接口->更新角色
 */
export class ApiRoleUpdate extends ApiCall<UpdateRoleDto, RoleResponseDto> {
  path = '/api/roles/{id}'
  method: MoMethod = 'PUT'
  auth = true
}

/**
 * role|角色相关接口->删除角色
 */
export class ApiRoleDelete extends ApiCall<
  {
    id: string //角色 ID
  },
  any
> {
  path = '/api/roles/{id}'
  method: MoMethod = 'DELETE'
  auth = true
}

/**
 * role|角色相关接口->分配权限
 */
export class ApiRoleAssignPermissions extends ApiCall<
  AssignPermissionsDto,
  any
> {
  path = '/api/roles/{id}/permissions'
  method: MoMethod = 'POST'
  auth = true
}

/**
 * role|角色相关接口->获取角色权限
 */
export class ApiRoleGetRolePermissions extends ApiCall<
  {
    id: string //角色 ID
  },
  any
> {
  path = '/api/roles/{id}/permissions'
  method: MoMethod = 'GET'
  auth = true
}

/**
 * permission|权限相关接口->创建权限
 */
export class ApiPermissionCreate extends ApiCall<CreatePermissionDto, any> {
  path = '/api/permissions'
  method: MoMethod = 'POST'
  auth = true
}

/**
 * permission|权限相关接口->查询权限列表
 */
export class ApiPermissionFindAll extends ApiCall<
  {
    permName?: string //权限名称（模糊查询）
    permCode?: string //权限编码（模糊查询）
    permissionType?: number //权限类型
    nodeType?: number //节点类型
    parentId?: string //父权限 ID
    page?: number //当前页码
    pageSize?: number //每页数量
  },
  any
> {
  path = '/api/permissions'
  method: MoMethod = 'GET'
  auth = true
}

/**
 * permission|权限相关接口->查询所有权限树
 */
export class ApiPermissionFindAllTree extends ApiCall<
  {},
  Array<PermissionResponseDto>
> {
  path = '/api/permissions/tree/all'
  method: MoMethod = 'GET'
  auth = true
}

/**
 * permission|权限相关接口->获取权限树
 */
export class ApiPermissionGetPermissionTree extends ApiCall<
  {
    parentId?: string //父权限 ID，不传则查询根节点
  },
  Array<PermissionResponseDto>
> {
  path = '/api/permissions/tree'
  method: MoMethod = 'GET'
  auth = true
}

/**
 * permission|权限相关接口->根据 ID 查询权限
 */
export class ApiPermissionFindById extends ApiCall<
  {
    id: string //权限 ID
  },
  PermissionResponseDto
> {
  path = '/api/permissions/{id}'
  method: MoMethod = 'GET'
  auth = true
}

/**
 * permission|权限相关接口->更新权限
 */
export class ApiPermissionUpdate extends ApiCall<
  UpdatePermissionDto,
  PermissionResponseDto
> {
  path = '/api/permissions/{id}'
  method: MoMethod = 'PUT'
  auth = true
}

/**
 * permission|权限相关接口->删除权限
 */
export class ApiPermissionDelete extends ApiCall<
  {
    id: string //权限 ID
  },
  any
> {
  path = '/api/permissions/{id}'
  method: MoMethod = 'DELETE'
  auth = true
}

/**
 * permission|权限相关接口->批量创建权限
 */
export class ApiPermissionBatchCreate extends ApiCall<{}, any> {
  path = '/api/permissions/batch'
  method: MoMethod = 'POST'
  auth = true
}

/**
 * app-type|应用类型相关接口->创建应用类型
 */
export class ApiAppTypeCreate extends ApiCall<CreateAppTypeDto, any> {
  path = '/api/app-types'
  method: MoMethod = 'POST'
  auth = true
}

/**
 * app-type|应用类型相关接口->查询应用类型列表
 */
export class ApiAppTypeFindAll extends ApiCall<
  {
    page?: number //当前页码
    pageSize?: number //每页数量
    sortField?: string //排序字段
    sortOrder?: string //排序方向
    typeName?: string //类型名称（模糊查询）
    typeCode?: string //类型编码（模糊查询）
    typeStatus?: number //类型状态
  },
  any
> {
  path = '/api/app-types'
  method: MoMethod = 'GET'
  auth = true
}

/**
 * app-type|应用类型相关接口->查询所有应用类型
 */
export class ApiAppTypeFindAllList extends ApiCall<
  {},
  Array<AppTypeResponseDto>
> {
  path = '/api/app-types/all'
  method: MoMethod = 'GET'
  auth = true
}

/**
 * app-type|应用类型相关接口->根据 ID 查询应用类型
 */
export class ApiAppTypeFindById extends ApiCall<
  {
    id: string //应用类型 ID
  },
  AppTypeResponseDto
> {
  path = '/api/app-types/{id}'
  method: MoMethod = 'GET'
  auth = true
}

/**
 * app-type|应用类型相关接口->更新应用类型
 */
export class ApiAppTypeUpdate extends ApiCall<
  UpdateAppTypeDto,
  AppTypeResponseDto
> {
  path = '/api/app-types/{id}'
  method: MoMethod = 'PUT'
  auth = true
}

/**
 * app-type|应用类型相关接口->删除应用类型
 */
export class ApiAppTypeDelete extends ApiCall<
  {
    id: string //应用类型 ID
  },
  any
> {
  path = '/api/app-types/{id}'
  method: MoMethod = 'DELETE'
  auth = true
}

/**
 * app-type|应用类型相关接口->更新应用类型状态
 */
export class ApiAppTypeUpdateStatus extends ApiCall<
  {
    id: string //应用类型 ID
    status: number //状态 (1:启用 0:禁用)
  },
  AppTypeResponseDto
> {
  path = '/api/app-types/{id}/status'
  method: MoMethod = 'PUT'
  auth = true
}

/**
 * app|应用实例相关接口->创建应用实例
 */
export class ApiAppCreate extends ApiCall<CreateAppDto, any> {
  path = '/api/apps'
  method: MoMethod = 'POST'
  auth = true
}

/**
 * app|应用实例相关接口->查询应用实例列表
 */
export class ApiAppFindAll extends ApiCall<
  {
    page?: number //当前页码
    pageSize?: number //每页数量
    sortField?: string //排序字段
    sortOrder?: string //排序方向
    appName?: string //应用名称（模糊查询）
    appCode?: string //应用编码（模糊查询）
    appTypeId?: string //应用类型 ID
    ownerId?: string //拥有者 ID
    appStatus?: number //应用状态
  },
  any
> {
  path = '/api/apps'
  method: MoMethod = 'GET'
  auth = true
}

/**
 * app|应用实例相关接口->根据 ID 查询应用实例
 */
export class ApiAppFindById extends ApiCall<
  {
    id: string //应用实例 ID
  },
  AppDetailResponseDto
> {
  path = '/api/apps/{id}'
  method: MoMethod = 'GET'
  auth = true
}

/**
 * app|应用实例相关接口->更新应用实例
 */
export class ApiAppUpdate extends ApiCall<UpdateAppDto, AppDetailResponseDto> {
  path = '/api/apps/{id}'
  method: MoMethod = 'PUT'
  auth = true
}

/**
 * app|应用实例相关接口->删除应用实例
 */
export class ApiAppDelete extends ApiCall<
  {
    id: string //应用实例 ID
  },
  any
> {
  path = '/api/apps/{id}'
  method: MoMethod = 'DELETE'
  auth = true
}

/**
 * app|应用实例相关接口->变更负责人
 */
export class ApiAppChangeOwner extends ApiCall<
  {
    id: string //应用实例 ID
    ownerId: string //新负责人 ID
  },
  AppDetailResponseDto
> {
  path = '/api/apps/{id}/owner'
  method: MoMethod = 'PUT'
  auth = true
}

/**
 * app|应用实例相关接口->更新应用实例状态
 */
export class ApiAppUpdateStatus extends ApiCall<
  {
    id: string //应用实例 ID
    status: number //状态 (1:启用 0:禁用)
  },
  AppDetailResponseDto
> {
  path = '/api/apps/{id}/status'
  method: MoMethod = 'PUT'
  auth = true
}

/**
 * member|应用成员相关接口->添加应用成员
 */
export class ApiMemberAddMember extends ApiCall<AddMemberDto, any> {
  path = '/api/apps/{appId}/members'
  method: MoMethod = 'POST'
  auth = true
}

/**
 * member|应用成员相关接口->获取应用成员列表
 */
export class ApiMemberGetMembers extends ApiCall<
  {
    appId: string //应用 ID
  },
  Array<MemberResponseDto>
> {
  path = '/api/apps/{appId}/members'
  method: MoMethod = 'GET'
  auth = true
}

/**
 * member|应用成员相关接口->更新成员角色
 */
export class ApiMemberUpdateRoles extends ApiCall<UpdateMemberRolesDto, any> {
  path = '/api/apps/{appId}/members/{userId}/roles'
  method: MoMethod = 'PUT'
  auth = true
}

/**
 * member|应用成员相关接口->移除应用成员
 */
export class ApiMemberRemoveMember extends ApiCall<
  {
    appId: string //应用 ID
    userId: string //用户 ID
  },
  any
> {
  path = '/api/apps/{appId}/members/{userId}'
  method: MoMethod = 'DELETE'
  auth = true
}

/**
 * member|应用成员相关接口->获取可选角色列表
 */
export class ApiMemberGetAvailableRoles extends ApiCall<
  {
    appId: string //应用 ID
  },
  Array<AvailableRoleDto>
> {
  path = '/api/apps/{appId}/members/available-roles'
  method: MoMethod = 'GET'
  auth = true
}

/**
 * audit-log|审计日志相关接口->查询审计日志列表
 */
export class ApiAuditLogFindAll extends ApiCall<
  {
    module?: string //所属模块
    event?: string //事件名称
    operatorId?: string //操作人 ID
    targetId?: string //目标 ID
    startTime?: string //开始时间
    endTime?: string //结束时间
    page?: number //当前页码
    pageSize?: number //每页数量
  },
  any
> {
  path = '/api/audit-logs'
  method: MoMethod = 'GET'
  auth = true
}

/**
 * audit-log|审计日志相关接口->根据 ID 查询审计日志
 */
export class ApiAuditLogFindById extends ApiCall<
  {
    id: string //审计日志 ID
  },
  AuditLogResponseDto
> {
  path = '/api/audit-logs/{id}'
  method: MoMethod = 'GET'
  auth = true
}

/**
 * audit-log|审计日志相关接口->根据目标 ID 查询审计日志
 */
export class ApiAuditLogFindByTargetId extends ApiCall<
  {
    targetId: string //目标 ID
  },
  Array<AuditLogResponseDto>
> {
  path = '/api/audit-logs/target/{targetId}'
  method: MoMethod = 'GET'
  auth = true
}

/**
 * audit-log|审计日志相关接口->根据操作人 ID 查询审计日志
 */
export class ApiAuditLogFindByOperatorId extends ApiCall<
  {
    operatorId: string //操作人 ID
  },
  Array<AuditLogResponseDto>
> {
  path = '/api/audit-logs/operator/{operatorId}'
  method: MoMethod = 'GET'
  auth = true
}

/**
 * audit-log|审计日志相关接口->清理审计日志
 */
export class ApiAuditLogDeleteBeforeDate extends ApiCall<
  {
    beforeDate: string //日期 (YYYY-MM-DD)
  },
  any
> {
  path = '/api/audit-logs/before/{beforeDate}'
  method: MoMethod = 'DELETE'
  auth = true
}
