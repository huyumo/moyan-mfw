# OSS 授权接口集成设计

> **日期**: 2026-05-31
> **状态**: 设计已确认，待实现
> **驱动**: `brainstorming` → `writing-plans`

---

## 1. 背景与目标

### 1.1 现状

- `packages/base/src/backend` 已有 `upload` 模块（`modules/sys/upload/`），仅支持本地磁盘存储
- 无 OSS/云存储相关服务和接口
- 未依赖 `ali-oss` 包

### 1.2 目标

在 `upload` 模块内集成阿里云 OSS STS 临时凭证授权接口，使前端可直接上传文件至 OSS，绕过服务端中转。

### 1.3 参考

基于 `yunyi` 项目 `micro-system/src/file/service/oss.service.ts` 的 `getAuthorization()` 实现。

---

## 2. 核心决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 云厂商 | 仅阿里云 OSS | YAGNI，不提前为多云设计抽象层 |
| 模块位置 | 集成进 `modules/sys/upload/` | 复用现有模块，不新建独立 oss 模块 |
| 访问控制 | `@SkipPermission()` — 仅需登录态 | 与现有上传接口保持一致 |
| 实现方式 | 子服务 `OssService`（方案 B） | 职责清晰，本地上传与 OSS 分离 |

---

## 3. 文件变更清单

| 操作 | 文件 | 说明 |
|------|------|------|
| **新增** | `config/oss.config.ts` | OSS STS 凭证及 Bucket 环境变量配置 |
| **新增** | `modules/sys/upload/oss.service.ts` | 调用 `ali-oss` STS API 获取临时凭证 |
| **新增** | `modules/sys/upload/dto/res/oss-authorization.dto.ts` | Swagger 响应 DTO |
| **修改** | `config/index.ts` | 导出 `ossConfig` |
| **修改** | `app.module.ts` | `ConfigModule.load` 数组追加 `ossConfig` |
| **修改** | `modules/sys/upload/upload.controller.ts` | 新增 `GET /upload-files/oss-authorization` |
| **修改** | `modules/sys/upload/upload.module.ts` | `providers` + `exports` 注册 `OssService` |
| **修改** | `modules/sys/upload/index.ts` | 导出 `OssService` |

**新增依赖**: `ali-oss`（提供 STS 类）

---

## 4. 配置设计

### 4.1 文件: `config/oss.config.ts`

```typescript
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
```

### 4.2 环境变量

| 变量 | 用途 | 默认值 |
|------|------|--------|
| `OSS_ACCESS_KEY_ID` | 阿里云 RAM 用户 AccessKey | (空) |
| `OSS_ACCESS_KEY_SECRET` | RAM 用户 AccessKeySecret | (空) |
| `OSS_ROLE_ARN` | RAM 角色 ARN（STS 扮演） | (空) |
| `OSS_TOKEN_EXPIRE_TIME` | STS 临时凭证有效期（秒） | `3600` |
| `OSS_BUCKET` | Bucket 名称 | (空) |
| `OSS_ENDPOINT` | Endpoint（如 `oss-cn-hangzhou.aliyuncs.com`） | (空) |
| `OSS_TIMEOUT` | 前端直传超时（秒） | `60` |

### 4.3 注册

`config/index.ts` 新增 `export { default as ossConfig } from './oss.config';`，`app.module.ts` 的 `ConfigModule.forRoot({ load: [...] })` 数组追加 `ossConfig`。

---

## 5. 服务设计

### 5.1 文件: `modules/sys/upload/oss.service.ts`

```typescript
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
```

### 5.2 注册

`upload.module.ts` 的 `providers` 和 `exports` 均加入 `OssService`。

---

## 6. 控制器 & API

### 6.1 路径

`GET /api/upload-files/oss-authorization`

### 6.2 控制器变更

`UploadFileController` 追加方法：

```typescript
@Get('oss-authorization')
@ApiOperation({ summary: '获取 OSS 上传授权' })
@ApiResponse({ status: 200, type: OssAuthorizationDto })
async getOssAuthorization() {
  const result = await this.ossService.getAuthorization();
  return ApiResponseUtil.success(result, '获取 OSS 授权成功');
}
```

- 复用类级别 `@SkipPermission()` — 仅需登录态
- 构造函数注入 `OssService`

### 6.3 响应 DTO

```typescript
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
```

---

## 7. 错误处理

- STS API 调用失败 → NestJS 默认异常过滤器处理，返回 `500 Internal Server Error`
- 配置缺失 → STS 构造函数不校验，阿里云 SDK 在 `assumeRole()` 时抛错
- 不额外封装 try/catch，保持与框架默认行为一致

---

## 8. 测试策略

- 单测 `OssService.getAuthorization()`：mock `STS` 类和 `ConfigService`
- 验证正常返回结构、STS 调用参数传递正确
- 不写 E2E（依赖阿里云外部 API，非本任务范围）

---

## 9. 不纳入的设计

- 不实现 OSS 回调校验、签名 URL 生成、分片上传等高级功能
- 不创建独立的 `oss` 模块
- 不引入多云 OSS 抽象层
- 不修改 `UploadFileService` 本地存储逻辑
