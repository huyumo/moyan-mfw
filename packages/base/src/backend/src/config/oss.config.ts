/**
 * @fileoverview OSS 配置
 * @description 阿里云 OSS STS 临时凭证及 Bucket 配置
 */

export default () => ({
  oss: {
    accessKeyId: process.env.OSS_ACCESS_KEY_ID || '',
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || '',
    roleArn: process.env.OSS_ROLE_ARN || '',
    tokenExpireTime: parseInt(process.env.OSS_TOKEN_EXPIRE_TIME || '3600', 10),
    bucket: process.env.OSS_BUCKET || '',
    endpoint: process.env.OSS_ENDPOINT || '',
    timeout: parseInt(process.env.OSS_TIMEOUT || '60', 10),
  },
});
