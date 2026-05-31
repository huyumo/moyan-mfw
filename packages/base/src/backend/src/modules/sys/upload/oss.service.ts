/**
 * @fileoverview OSS 服务
 * @description 提供阿里云 OSS STS 临时凭证授权
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { STS } from 'ali-oss';

@Injectable()
export class OssService {
  constructor(private configService: ConfigService) {}

  async getAuthorization() {
    const ossConfig = this.configService.get('oss');
    const client = new STS({
      accessKeyId: ossConfig.accessKeyId,
      accessKeySecret: ossConfig.accessKeySecret,
    });
    const result = await client.assumeRole(
      ossConfig.roleArn,
      '',
      ossConfig.tokenExpireTime,
    );
    return {
      accessKeyId: result.credentials.AccessKeyId,
      accessKeySecret: result.credentials.AccessKeySecret,
      securityToken: result.credentials.SecurityToken,
      stsToken: result.credentials.SecurityToken,
      expiration: result.credentials.Expiration,
      bucket: ossConfig.bucket,
      endpoint: ossConfig.endpoint,
      timeout: ossConfig.timeout,
    };
  }
}
