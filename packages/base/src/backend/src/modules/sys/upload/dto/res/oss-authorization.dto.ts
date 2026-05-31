/**
 * @fileoverview OSS 授权响应 DTO
 * @description OSS STS 临时凭证授权接口响应数据结构
 */

import { ApiProperty } from '@nestjs/swagger';

export class OssAuthorizationDto {
  @ApiProperty({ description: '临时 AccessKeyId' })
  accessKeyId: string;

  @ApiProperty({ description: '临时 AccessKeySecret' })
  accessKeySecret: string;

  @ApiProperty({ description: '安全令牌' })
  securityToken: string;

  @ApiProperty({ description: 'STS Token（同 securityToken）' })
  stsToken: string;

  @ApiProperty({ description: '凭证过期时间（ISO 8601）' })
  expiration: string;

  @ApiProperty({ description: 'OSS Bucket 名称' })
  bucket: string;

  @ApiProperty({ description: 'OSS Endpoint' })
  endpoint: string;

  @ApiProperty({ description: '上传超时时间（秒）' })
  timeout: number;
}
