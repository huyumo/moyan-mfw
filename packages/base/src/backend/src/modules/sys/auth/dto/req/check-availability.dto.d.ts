/**
 * @fileoverview 检查可用性请求 DTO
 */
/**
 * 检查用户名/邮箱/手机号可用性请求 DTO
 */
export declare class CheckAvailabilityDto {
    username?: string;
    email?: string;
    phone?: string;
}
/**
 * 检查可用性响应 DTO
 */
export declare class CheckAvailabilityResponseDto {
    usernameAvailable?: boolean;
    emailAvailable?: boolean;
    phoneAvailable?: boolean;
}
