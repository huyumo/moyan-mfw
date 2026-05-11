/**
 * @fileoverview 认证模块 DTO 统一导出
 * @description 导出认证模块的所有 DTO
 */

// Request DTOs
export { LoginDto } from './req/login.dto';
export { RefreshTokenDto } from './req/refresh-token.dto';
export { CheckAvailabilityDto, CheckAvailabilityResponseDto } from './req/check-availability.dto';
export { RegisterDto } from './req/register.dto';

// Response DTOs
export {
  LoginResponseDto,
  UserInfoDto,
  AppInstanceItemDto,
  UserAppsResponseDto,
} from './res/auth-response.dto';
export {

  UserPermissionsResponseDto,
} from './res/user-permissions-response.dto';
