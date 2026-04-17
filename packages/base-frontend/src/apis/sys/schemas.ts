/**
 * 数据库字段类型，该文件的类型为自动生成，请勿手动修改
 */
export type ObjectId = string
export type int = number | string
export type integer = number | string
export type float = number | string
export type tinyint = number | string
export type char = string
export type varchar = string
export type json =
  | { [key: string]: unknown }
  | Array<{ [key: string]: unknown }>
export type datetime = Date | string
export type date = Date | string
export type array = Array<unknown>
export type text = string
export type decimal = number | string

export type LoginDto = {
  username: string // 用户名
  password: string // 密码
}

export type UserSummaryDto = {
  username: string // 用户名
  nickname: string // 昵称
  avatar: string // 头像 URL
}

export type LoginResponseDto = {
  accessToken: string // 访问 Token
  refreshToken: string // 刷新 Token
  tokenType: string // Token 类型
  expiresIn: number // 过期时间（秒）
  user: any // 用户信息
}

export type UserInfoDto = {
  id: string // 用户 ID
  username: string // 用户名
  nickname: string // 昵称
  avatar: string // 头像 URL
  roles: Array<string> // 角色列表
}

export type AppInstanceItemDto = {
  appId: string // 应用实例 ID
  appName: string // 应用实例名称
  appCode: string // 应用实例编码
  appTypeId: string // 应用类型 ID
  appTypeCode: string // 应用类型编码
  appTypeName: string // 应用类型名称
  role: string // 用户身份
  icon?: string // 应用图标
}

export type PermissionTreeNodeDto = {
  id: string // 权限 ID
  permName: string // 权限名称
  permCode: string // 权限编码
  permDesc?: string // 权限描述
  permissionType: string // 权限类型
  nodeType: string // 节点类型
  parentId?: string // 父权限 ID
  routePath?: string // 路由路径
  externalUrl?: string // 外部链接
  iconName?: string // 图标名称
  sortOrder: number // 排序号
  isVisible: number // 是否可见
  isCache: number // 是否缓存
  showMode: string // 显示模式
  permStatus: number // 权限状态
  checked: boolean // 是否选中
  isAutoSync?: number // 是否自动同步：1=同步生成 0=手动添加
  permissionValue?: string // 权限值（位运算）
  parentPermissionValue?: string // 父权限值（位运算）
  children?: Array<PermissionTreeNodeDto> // 子权限列表
  createdAt: string // 创建时间
  updateAt: string // 更新时间
}

export type UserPermissionsResponseDto = {
  menuTree: Array<PermissionTreeNodeDto> // 用户权限菜单树
  permissions: Array<string> // 用户权限列表（扁平化）
  appTypeId: string // 应用类型 ID
}

export type RegisterDto = {
  username: string // 用户名
  password: string // 密码
  nickname?: string // 昵称
  email?: string // 邮箱
  phone?: string // 手机号
}

export type CheckAvailabilityResponseDto = {
  usernameAvailable: boolean // 用户名是否可用
  emailAvailable: boolean // 邮箱是否可用
  phoneAvailable: boolean // 手机号是否可用
}

export type CreateUserDto = {
  username: string // 用户名
  password: string // 密码
  nickname?: string // 昵称
  phone?: string // 手机号
  email?: string // 邮箱
  avatar?: string // 头像 URL
  gender?: number // 性别 (0:未知 1:男 2:女)
  roleIds?: Array<string> // 角色 ID 列表
}

export type UserResponseDto = {
  id: string // 用户 ID
  username: string // 用户名
  nickname: string // 昵称
  phone: string // 手机号
  email: string // 邮箱
  avatar: string // 头像 URL
  gender: number // 性别 (0:未知 1:男 2:女)
  userStatus: number // 状态 (1:启用 0:禁用)
  isDeveloper: boolean // 是否开发者
  createdAt: string // 创建时间
  updateAt: string // 更新时间
}

export type UpdateUserDto = {
  nickname?: string // 昵称
  phone?: string // 手机号
  email?: string // 邮箱
  avatar?: string // 头像 URL
  gender?: number // 性别 (0:未知 1:男 2:女)
  roleIds?: Array<string> // 角色 ID 列表
}

export type CreateRoleDto = {
  roleName: string // 角色名称
  roleCode: string // 角色编码
  roleDesc?: string // 角色描述
  appTypeId?: string // 应用类型 ID
  appId?: string // 应用实例 ID
  sortOrder?: number // 排序号
  isBuiltin?: number // 是否内置
}

export type RoleResponseDto = {
  id: string // 角色 ID
  roleName: string // 角色名称
  roleCode: string // 角色编码
  roleDesc: string // 角色描述
  appTypeId: string // 应用类型 ID
  appId: string // 应用实例 ID
  isBuiltin: number // 是否内置
  isOwner: number // 是否拥有者角色
  roleStatus: number // 角色状态 (1:启用 0:禁用)
  sortOrder: number // 排序号
  createdAt: string // 创建时间
  updateAt: string // 更新时间
}

export type PageResponseDto = {
  total: number // 总数量
  page: number // 当前页码
  pageSize: number // 每页数量
  totalPages: number // 总页数
  hasNext: boolean // 是否有下一页
  hasPrev: boolean // 是否有上一页
}

export type UpdateRoleDto = {
  roleName?: string // 角色名称
  roleDesc?: string // 角色描述
  sortOrder?: number // 排序号
  roleStatus?: number // 角色状态 (1:启用 0:禁用)
}

export type PermissionTreePayloadDto = {
  id: string // 权限 ID
  checked: boolean // 是否选中（true=加入权限池，false=移除）
  permissionValue?: string // 权限值（位运算权限值，十进制字符串格式）
  children?: Array<PermissionTreePayloadDto> // 子节点列表
}

export type PermissionTreesDto = {
  pcTree: Array<PermissionTreePayloadDto> // PC 权限树
  normalTree: Array<PermissionTreePayloadDto> // 普通权限树
}

export type AssignPermissionsDto = {
  permissionTrees: any // 权限树配置
}

export type RolePermissionTreesResponseDto = {
  pcTree: Array<PermissionTreeNodeDto> // PC 权限树
  normalTree: Array<PermissionTreeNodeDto> // 普通权限树
}

export type RolePermissionResponseDto = {
  roleId: string // 角色 ID
  permissionTrees: any // 权限树配置
}

export type CreateAppTypeDto = {
  typeName: string // 类型名称
  typeCode: string // 类型编码
  typeDesc?: string // 类型描述
  icon?: string // 图标 URL 或图标名称
  multiAppEnabled: number // 是否支持多应用
  typeStatus: number // 类型状态
  sortOrder: number // 排序号
}

export type AppTypeResponseDto = {
  id: string // 应用类型 ID
  typeName: string // 类型名称
  typeCode: string // 类型编码
  typeDesc: string // 类型描述
  icon: string // 图标
  multiAppEnabled: number // 是否支持多应用
  typeStatus: number // 类型状态
  sortOrder: number // 排序号
  createdAt: string // 创建时间
  updateAt: string // 更新时间
}

export type PermissionTreesResponseDto = {
  pcTree: Array<PermissionTreeNodeDto> // PC 权限树
  normalTree: Array<PermissionTreeNodeDto> // 普通权限树
}

export type PermissionPoolResponseDto = {
  appTypeId: string // 应用类型 ID
  permissionTrees: any // 权限树配置
}

export type UpdatePermissionPoolDto = {
  permissionTrees: any // 权限树配置
}

export type UpdatePermissionPoolResponseDto = {
  appTypeId: string // 应用类型 ID
  updatedCount: number // 更新的权限节点数量
}

export type UpdateAppTypeDto = {
  typeName?: string // 类型名称
  typeCode?: string // 类型编码
  typeDesc?: string // 类型描述
  icon?: string // 图标 URL 或图标名称
  multiAppEnabled?: number // 是否支持多应用
  typeStatus?: number // 类型状态
  sortOrder?: number // 排序号
}

export type CreatePermissionDto = {
  permName: string // 权限名称
  permCode: string // 权限编码
  permDesc?: string // 权限描述
  permissionType: string // 权限类型
  nodeType?: string // 节点类型
  parentId?: string // 父权限 ID
  routePath?: string // 路由路径
  externalUrl?: string // 外部链接
  iconName?: string // 图标名称
  sortOrder?: number // 排序号
  isVisible?: number // 是否可见
  isCache?: number // 是否缓存
  showMode: string // 显示模式
  permStatus?: number // 权限状态
  permissionValue?: integer // 权限值（位运算）
}

export type PermissionResponseDto = {
  id: string // 权限 ID
  permName: string // 权限名称
  permCode: string // 权限编码
  permDesc: string // 权限描述
  permissionType: string // 权限类型
  nodeType: string // 节点类型
  parentId: string // 父权限 ID
  routePath: string // 路由路径
  externalUrl: string // 外部链接
  iconName: string // 图标名称
  sortOrder: number // 排序号
  isVisible: number // 是否可见
  isCache: number // 是否缓存
  showMode: string // 显示模式
  permStatus: number // 权限状态
  permissionValue: string // 权限值（位运算）
  createdAt: string // 创建时间
  updateAt: string // 更新时间
}

export type UpdatePermissionDto = {
  permName?: string // 权限名称
  permCode?: string // 权限编码
  permDesc?: string // 权限描述
  nodeType?: string // 节点类型
  routePath?: string // 路由路径
  externalUrl?: string // 外部链接
  iconName?: string // 图标名称
  sortOrder?: number // 排序号
  isVisible?: number // 是否可见
  isCache?: number // 是否缓存
  showMode?: string // 显示模式
  permStatus?: number // 权限状态
  permissionValue?: integer // 权限值（位运算）
}

export type RouteNodeDto = {
  path: string // 路由路径
  name: string // 路由名称
  children?: Array<RouteNodeDto> // 子路由
}

export type SyncPermissionDto = {
  routes: Array<RouteNodeDto> // 路由树结构
}

export type CreateAppDto = {
  appTypeId: string // 应用类型 ID
  appName: string // 应用名称
  appCode: string // 应用编码
  ownerId: string // 拥有者 ID
  appDesc?: string // 应用描述
  icon?: string // 应用图标 URL 或图标名称
  sortOrder: number // 排序号
}

export type AppDetailResponseDto = {
  id: string // 应用 ID
  appTypeId: string // 应用类型 ID
  appName: string // 应用名称
  appCode: string // 应用编码
  appDesc: string // 应用描述
  ownerId: string // 拥有者 ID
  icon: string // 应用图标
  appStatus: number // 应用状态
  sortOrder: number // 排序号
  createdAt: string // 创建时间
  updateAt: string // 更新时间
  appType: object // 应用类型信息
  owner: object // 拥有者信息
}

export type UpdateAppDto = {
  appCode?: string // 应用编码
  appName?: string // 应用名称
  appDesc?: string // 应用描述
  icon?: string // 应用图标 URL 或图标名称
  ownerId?: string // 拥有者 ID（变更负责人时使用）
  appStatus?: number // 应用状态 (1:启用 0:禁用)
  sortOrder?: number // 排序号
}

export type AddMemberDto = {
  userId: string // 用户 ID
}

export type MemberUserInfoDto = {
  id: string // 用户 ID
  username: string // 用户名
  nickname: string // 昵称
  avatar: string // 头像 URL
}

export type MemberRoleInfoDto = {
  roleName: string // 角色名称
  roleCode: string // 角色编码
  isBuiltin: number // 是否内置
  roleId: string // 角色 ID
}

export type MemberResponseDto = {
  id: string // 成员 ID
  appId: string // 应用 ID
  userId: string // 用户 ID
  createdAt: string // 创建时间
  user: any // 用户信息
  roles: Array<MemberRoleInfoDto> // 角色列表
}

export type UpdateMemberRolesDto = {
  roleIds: Array<array> // 角色 ID 列表（全量替换）
}

export type AvailableRoleDto = {
  id: string // 角色 ID
  roleName: string // 角色名称
  roleCode: string // 角色编码
  isBuiltin: number // 是否内置角色
  isOwner: number // 是否拥有者角色
}

export type AuditLogResponseDto = {
  id: string // 日志 ID
  module: string // 所属模块
  event: string // 事件名称
  operatorId: string // 操作人 ID
  operatorName: string // 操作人名称
  targetId: string // 目标 ID
  targetType: string // 目标类型
  description: string // 描述
  snapshot?: object // 快照
  ip: string // IP 地址
  userAgent?: string // User-Agent
  createAt: string // 创建时间
}

export type InitStatusResponseDto = {
  initialized: boolean // 是否已初始化
}

export type InitRequestDto = {
  adminPassword: string // 管理员密码
}

export type InitResponseDto = {
  appTypeId: string // 应用类型 ID
  appId: string // 应用实例 ID
  adminUserId: string // 管理员用户 ID
  message: string // 初始化消息
}
