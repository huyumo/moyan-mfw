/**
 * @fileoverview 公共模块统一导出
 * @description 导出 common 模块的所有公共内容
 */

// Entities
export { Base } from './entities/base.entity';

// Exceptions
export { BusinessException } from './exceptions/business.exception';
export { NotFoundError } from './exceptions/not-found.exception';
export { ForbiddenError } from './exceptions/forbidden.exception';
export { UnauthorizedError } from './exceptions/unauthorized.exception';

// Filters
export { AllExceptionsFilter } from './filters/all-exceptions.filter';

// Guards
export { AuthGuard } from './guards/auth.guard';
export { PermissionGuard } from './guards/permission.guard';

// Interceptors
export { LoggingInterceptor } from './interceptors/logging.interceptor';
export { TransformInterceptor } from './interceptors/transform.interceptor';
export { AuditInterceptor } from './interceptors/audit.interceptor';

// Decorators
export { Public, IS_PUBLIC_KEY } from './decorators/public.decorator';
export {
  RequirePermission,
  createBusinessPermissionDecorator,
  REQUIRE_PERMISSION,
  type RequirePermissionOptions,
} from './decorators/require-permission.decorator';
export {
  AuditLog,
  AUDIT_LOG,
  AuditModule,
  type AuditLogOptions,
} from './decorators/audit-log.decorator';
export { ApiPaginatedResponse } from './decorators/api-paginated-response.decorator';
export { User } from './decorators/user.decorator';
export { AppId } from './decorators/app-id.decorator';

// Utils
export { hashPassword, verifyPassword } from './utils/encrypt';
export {
  PaginationX,
  PaginationResult,
  PaginationQueryDto
} from './utils/pagination-x.util';
export { executeRawSql,WhereBuilder } from './utils/sql.util';
export {
  QueryBuilderHelper,
  type QueryCondition,
  type ConditionGroup,
} from './utils/query-builder.util';

// Types
export type {
  UserInfo,
  PageQuery,
  PageResult,
  CommonOptions,
} from './types/common.types';
export type {
  ApiResponse,
  ApiResponseUtil,
  ErrorResponse,
} from './types/api.types';
export {
  ImageResourceDto,
  MediaResourceDto,
  FileResourceDto,
  ResourceType,
} from './types/resource.types';
export { UserDto } from './types/user.dto';

// Constants
export {
  DEFAULT_PERMISSION_VALUES,
  EXTENSION_PERMISSION_VALUES,
  PERMISSION_VALUES,
  registerPermissionValues,
  getPermissionValues,
  buildPerValue,
  getPermValue,
  parsePerValue,
  hasPermission,
  getPermissionOptions,
  initPermissionValueCache,
  getPermissionValueCache,
  type DefaultPermissionName,
  type ExtensionPermissionName,
  type BasePermissionName,
} from './constants/permissions';
