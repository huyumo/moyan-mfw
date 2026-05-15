/**
 * @fileoverview 权限模块 DTO 统一导出
 * @description 导出权限模块的所有 DTO
 */
export { CreatePermissionDto } from './req/create-permission.dto';
export { UpdatePermissionDto } from './req/update-permission.dto';
export { QueryPermissionDto } from './req/query-permission.dto';
export { SyncPermissionDto, RouteNodeDto } from './req/sync-permission.dto';
export { PermissionResponseDto, PermissionTreeNodeDto } from './res/permission-response.dto';
