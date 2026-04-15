/**
 * @fileoverview 分配权限请求 DTO
 * @description 为角色分配权限的请求参数
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsArray, ValidateNested, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdatePermissionPoolDto } from '@/modules/sys/app-type';


/**
 * 分配权限请求 DTO
 */
export class AssignPermissionsDto extends UpdatePermissionPoolDto {

}
