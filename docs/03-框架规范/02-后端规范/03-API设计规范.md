# API 设计规范

> 状态：**建设中** | 版本：1.0.0 | 最后更新：2026-03-31

---

## 3.1 RESTful 规范

### 3.1.1 路径命名

**🔴 强制：资源名称使用复数形式**

| 正确 | 错误 | 说明 |
|------|------|------|
| `/api/v1/users` | `/api/v1/user` | 资源集合使用复数 |
| `/api/v1/orders` | `/api/v1/order` | 资源集合使用复数 |
| `/api/v1/users/:id` | `/api/v1/user/:id` | 单个资源 ID 访问 |

**例外：**
- 不可数名词使用单数：`/api/v1/auth`, `/api/v1/config`

### 3.1.2 版本控制

**🟢 推荐：使用 URL 路径版本号**

```
/api/v1/users
/api/v2/users
```

**版本号弃用策略：**
1. 新版本的发布提前 3 个月通知
2. 旧版本保留 6 个月过渡期
3. 过渡期内返回 `Deprecation` 响应头
4. 过渡期后返回 410 Gone

### 3.1.3 资源嵌套

**🟢 推荐：资源嵌套不超过两级**

```
✅ 推荐：
/users/:userId/orders          # 用户的订单列表
/orders/:orderId/items         # 订单的商品列表

❌ 避免：
/users/:userId/orders/:orderId/items/:itemId/reviews  # 超过三级
```

**超过三级使用扁平化：**

```
// ❌ 避免：深层嵌套
GET /users/:userId/orders/:orderId/items/:itemId/reviews

// ✅ 推荐：扁平化查询
GET /reviews?orderId=xxx&itemId=yyy
GET /order-items/:id/reviews
```

---

## 3.2 请求/响应格式

### 3.2.1 统一响应结构

**🔴 强制：所有 API 响应使用统一结构**

```typescript
// common/types/api-response.ts
interface ApiResponse<T = any> {
  code: number;           // 状态码
  message: string;        // 响应消息
  data: T;                // 响应数据
  timestamp: string;      // 响应时间戳 (ISO 8601)
  path: string;           // 请求路径
}

// 成功响应示例
{
  "code": 200,
  "message": "success",
  "data": { /* 业务数据 */ },
  "timestamp": "2026-03-31T12:00:00.000Z",
  "path": "/api/v1/users"
}

// 错误响应示例
{
  "code": 404,
  "message": "用户不存在",
  "error": "NotFoundError",
  "timestamp": "2026-03-31T12:00:00.000Z",
  "path": "/api/v1/users/123"
}
```

### 3.2.2 分页响应

**🔴 强制：列表接口使用统一分页响应结构**

```typescript
// common/types/paginated-response.ts
interface PaginatedResponse<T> {
  items: T[];             // 当前页数据
  total: number;          // 总记录数
  page: number;           // 当前页码
  pageSize: number;       // 每页大小
  totalPages: number;     // 总页数
}

// 分页响应示例
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [...],
    "total": 100,
    "page": 1,
    "pageSize": 10,
    "totalPages": 10
  },
  "timestamp": "2026-03-31T12:00:00.000Z",
  "path": "/api/v1/users"
}
```

### 3.2.3 分页请求参数

**🔴 强制：分页参数使用统一命名**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `page` | number | 1 | 当前页码（从 1 开始） |
| `pageSize` | number | 10 | 每页大小（1-100） |
| `sort` | string | - | 排序字段，格式：`field,order` |

**排序参数示例：**
```
GET /api/v1/users?sort=createdAt,desc
GET /api/v1/users?sort=name,asc
GET /api/v1/users?sort=createdAt,desc&sort=name,asc  // 多字段排序
```

### 3.2.4 请求头规范

**🔴 强制：必须包含的请求头**

| 请求头 | 说明 | 示例 |
|--------|------|------|
| `Content-Type` | 请求体类型 | `application/json` |
| `Authorization` | JWT Token | `Bearer <token>` |

**🟢 推荐：可选请求头**

| 请求头 | 说明 | 示例 |
|--------|------|------|
| `X-Request-ID` | 请求追踪 ID | `uuid-v4` |
| `X-Client-Version` | 客户端版本 | `1.0.0` |

**X-Request-ID 生成规范：**
- 格式：UUID v4
- 由客户端生成，服务端透传返回
- 用于日志追踪和问题排查

---

## 3.3 错误码规范

### 3.3.1 错误码定义

**🔴 强制：使用 HTTP 状态码 + 业务错误码**

```typescript
// common/constants/error-codes.ts
enum ErrorCode {
  // 通用错误 (1000-1999)
  UNKNOWN_ERROR = 1000,
  PARAM_VALIDATION_ERROR = 1001,

  // 认证错误 (2000-2999)
  UNAUTHORIZED = 2000,
  TOKEN_EXPIRED = 2001,
  TOKEN_INVALID = 2002,

  // 授权错误 (3000-3999)
  FORBIDDEN = 3000,
  PERMISSION_DENIED = 3001,

  // 资源错误 (4000-4999)
  NOT_FOUND = 4000,
  RESOURCE_CONFLICT = 4001,

  // 系统错误 (5000-5999)
  DATABASE_ERROR = 5000,
  EXTERNAL_SERVICE_ERROR = 5001,
}
```

**错误码注册表维护：**
- 位置：`docs/03-框架规范/02-后端规范/错误码注册表.md`
- 新增错误码需要文档登记
- 已废弃错误码保留 6 个月

### 3.3.2 错误响应格式

**🔴 强制：Validation 错误返回详细字段信息**

```typescript
// 参数验证错误响应
{
  "code": 400,
  "message": "参数验证失败",
  "error": "ValidationError",
  "details": [
    {
      "field": "email",
      "message": "邮箱格式不正确",
      "value": "invalid-email"
    },
    {
      "field": "password",
      "message": "密码长度至少为 8 位",
      "value": "123456"
    }
  ],
  "timestamp": "2026-03-31T12:00:00.000Z",
  "path": "/api/v1/users"
}
```

### 3.3.3 错误码编排规则

**错误码文档自动生成：**
- 使用 `@nestjs/swagger` 自动生成 API 文档
- 错误码枚举同步到文档
- CI/CD 流程中包含文档生成步骤

---

## 3.4 数据验证规范

### 3.4.1 请求体验证

**🔴 强制：使用 class-validator 进行参数验证**

```typescript
// modules/sys/user/dto/req/create-user.dto.vo.ts
import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  nickname: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @IsString()
  @MinLength(8)
  password: string;
}
```

**全局验证管道配置：**

```typescript
// src/main.ts
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 全局启用验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,      // 自动类型转换
      whitelist: true,      // 剥离未装饰的属性
      forbidNonWhitelisted: false,  // 禁止额外属性
      stopAtFirstError: true,      // 第一个错误停止
    })
  );

  await app.listen(3000);
}
bootstrap();
```

### 3.4.2 验证错误响应

**多语言错误消息：**

```typescript
// class-validator 支持自定义多语言消息
export class CreateUserDto {
  @IsEmail({}, { message: 'validation.invalid_email' })
  email: string;

  @MinLength(8, { message: 'validation.password_min_length' })
  password: string;
}

// 使用 i18n 中间件翻译错误消息
{
  "code": 400,
  "message": "验证失败",
  "details": [
    {
      "field": "email",
      "message": "邮箱格式不正确",  // 已翻译为中文
      "value": "invalid"
    }
  ]
}
```

---

## 3.5 权限验证规范

### 3.5.1 注解式权限验证

**🔴 强制：使用装饰器进行权限验证**

```typescript
// common/decorators/permissions.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const REQUIRE_PERMISSIONS = 'require_permissions';

/**
 * 权限装饰器
 * @param permissions 权限码列表
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(REQUIRE_PERMISSIONS, permissions);

// 使用示例
@Controller('users')
export class UserController {
  @Get()
  @RequirePermissions('user:list', 'user:view')
  async findAll() {
    // ...
  }

  @Post()
  @RequirePermissions('user:create')
  async create(@Body() dto: CreateUserDto) {
    // ...
  }
}
```

**权限守卫实现：**

```typescript
// common/guards/permissions.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_PERMISSIONS } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      REQUIRE_PERMISSIONS,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userPermissions = request.user?.permissions || [];

    // 检查用户是否拥有所有必需的权限
    return requiredPermissions.every((perm) =>
      userPermissions.includes(perm),
    );
  }
}
```

### 3.5.2 权限位定义

**权限值计算工具函数：**

```typescript
// common/utils/permission.util.ts

/**
 * 权限位定义（使用 BigInt 避免溢出）
 */
export const PermissionBits = {
  CREATE: 1n << 0n,   // 1
  READ: 1n << 1n,     // 2
  UPDATE: 1n << 2n,   // 4
  DELETE: 1n << 3n,   // 8
  EXPORT: 1n << 4n,   // 16
  IMPORT: 1n << 5n,   // 32
};

/**
 * 组合权限值
 */
export function combinePermissions(...permissions: bigint[]): bigint {
  return permissions.reduce((acc, perm) => acc | perm, 0n);
}

/**
 * 检查是否拥有权限
 */
export function hasPermission(
  userValue: bigint,
  requiredValue: bigint,
): boolean {
  return (userValue & requiredValue) === requiredValue;
}

// 使用示例
const userPermValue = combinePermissions(
  PermissionBits.READ,
  PermissionBits.CREATE,
  PermissionBits.UPDATE,
);

// 检查是否有读取权限
hasPermission(userPermValue, PermissionBits.READ);  // true

// 检查是否有删除权限
hasPermission(userPermValue, PermissionBits.DELETE);  // false
```

---

## 3.6 Swagger 注解规范

### 3.6.1 全局配置

**🔴 强制：项目必须配置 Swagger 文档生成**

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger 配置
  const config = new DocumentBuilder()
    .setTitle('墨焱框架 API 文档')
    .setDescription('墨焱框架后端 API 接口文档')
    .setVersion('1.0')
    .addBearerJwt()
    .addTag('sys-user', '用户管理')
    .addTag('sys-role', '角色管理')
    .addTag('sys-permission', '权限管理')
    .addTag('sys-app', '应用管理')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(3000);
}
bootstrap();
```

### 3.6.2 DTO 注解

**🔴 强制：所有 DTO 必须使用 ApiProperty 注解**

```typescript
// modules/sys/user/dto/req/create-user.dto.vo.ts
import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

enum GenderEnum {
  UNKNOWN = 0,
  MALE = 1,
  FEMALE = 2,
}

export class CreateUserDto {
  @ApiProperty({
    description: '用户昵称',
    example: '张三',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  nickname: string;

  @ApiProperty({
    description: '邮箱地址',
    example: 'zhangsan@example.com',
  })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: '手机号',
    example: '13800138000',
    pattern: '^1[3-9]\\d{9}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone?: string;

  @ApiProperty({
    description: '密码',
    example: 'Abc123456',
    minLength: 8,
    maxLength: 20,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  password: string;

  @ApiPropertyOptional({
    description: '性别',
    enum: GenderEnum,
    enumName: 'GenderEnum',
    default: GenderEnum.UNKNOWN,
  })
  @IsOptional()
  @IsEnum(GenderEnum)
  gender?: GenderEnum;

  @ApiPropertyOptional({
    description: '备注',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  remark?: string;
}
```

### 3.6.3 响应 DTO 注解

```typescript
// modules/sys/user/dto/res/user.dto.vo.ts
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UserDto {
  @ApiProperty({ description: '用户 ID' })
  @Expose()
  id: string;

  @ApiProperty({ description: '用户昵称' })
  @Expose()
  nickname: string;

  @ApiProperty({ description: '邮箱地址' })
  @Expose()
  email: string;

  @ApiProperty({ description: '手机号', required: false })
  @Expose()
  phone?: string;

  @ApiProperty({
    description: '性别',
    enum: { 0: '未知', 1: '男', 2: '女' },
  })
  @Expose()
  gender: number;

  @ApiProperty({ description: '头像 URL', required: false })
  @Expose()
  avatar?: string;

  @ApiProperty({ description: '创建时间' })
  @Expose()
  createAt: Date;

  @ApiProperty({ description: '更新时间', required: false })
  @Expose()
  updateAt?: Date;
}
```

### 3.6.4 分页响应 DTO 注解

```typescript
// common/types/paginated-response.ts
import { ApiProperty } from '@nestjs/swagger';

export class PaginatedResponse<T> {
  @ApiProperty({ description: '数据列表', isArray: true })
  items: T[];

  @ApiProperty({ description: '总记录数' })
  total: number;

  @ApiProperty({ description: '当前页码' })
  page: number;

  @ApiProperty({ description: '每页大小' })
  pageSize: number;

  @ApiProperty({ description: '总页数' })
  totalPages: number;
}
```

### 3.6.5 控制器注解

**🔴 强制：所有 Controller 必须使用 Swagger 注解**

```typescript
// modules/sys/user/user.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/req/create-user.dto.vo';
import { UpdateUserDto } from './dto/req/update-user.dto.vo';
import { UserDto } from './dto/res/user.dto.vo';
import { PaginatedResponse } from '../../common/types/paginated-response';

@ApiTags('sys-user')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: '创建用户' })
  @ApiResponse({
    status: 201,
    description: '创建成功',
    type: UserDto,
  })
  @ApiResponse({
    status: 400,
    description: '参数验证失败',
  })
  @ApiResponse({
    status: 409,
    description: '邮箱或手机号已存在',
  })
  @ApiBody({ type: CreateUserDto })
  async create(@Body() dto: CreateUserDto): Promise<UserDto> {
    return this.userService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: '用户列表（分页）' })
  @ApiResponse({
    status: 200,
    description: '查询成功',
    type: PaginatedResponse,
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'keyword', required: false, type: String })
  async findAll(
    @Query('page', new QueryOptionalNumberPipe(1)) page: number,
    @Query('pageSize', new QueryOptionalNumberPipe(10)) pageSize: number,
    @Query('keyword') keyword?: string,
  ): Promise<PaginatedResponse<UserDto>> {
    return this.userService.findAll({ page, pageSize, keyword });
  }

  @Get(':id')
  @ApiOperation({ summary: '根据 ID 获取用户' })
  @ApiParam({ name: 'id', description: '用户 ID', example: 'uuid-v4' })
  @ApiResponse({ status: 200, type: UserDto })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<UserDto> {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新用户' })
  @ApiParam({ name: 'id', description: '用户 ID' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, type: UserDto })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserDto> {
    return this.userService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除用户' })
  @ApiParam({ name: 'id', description: '用户 ID' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.userService.remove(id);
  }
}
```

### 3.6.6 统一响应装饰器

**🔴 强制：使用统一装饰器简化响应注解**

```typescript
// common/decorators/api-response.decorator.ts
import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  getSchemaPath,
} from '@nestjs/swagger';
import { PaginatedResponse } from '../types/paginated-response';

export interface ApiOkPaginatedResponseOptions<T> {
  type: Type<T>;
  description?: string;
}

/**
 * 分页响应装饰器
 */
export function ApiOkPaginatedResponse<T>(options: ApiOkPaginatedResponseOptions<T>) {
  return applyDecorators(
    ApiExtraModels(PaginatedResponse, options.type),
    ApiOkResponse({
      description: options.description || '成功',
      schema: {
        allOf: [
          { $ref: getSchemaPath(PaginatedResponse) },
          {
            properties: {
              items: {
                type: 'array',
                items: { $ref: getSchemaPath(options.type) },
              },
            },
          },
        ],
      },
    }),
  );
}

/**
 * 统一成功响应装饰器
 */
export function ApiDataResponse<T>(type: Type<T>, description?: string) {
  return applyDecorators(
    ApiOkResponse({
      description: description || '成功',
      schema: {
        properties: {
          code: { type: 'number', example: 200 },
          message: { type: 'string', example: 'success' },
          data: { $ref: getSchemaPath(type) },
          timestamp: { type: 'string', format: 'date-time' },
          path: { type: 'string' },
        },
      },
    }),
    ApiExtraModels(type),
  );
}
```

**使用统一装饰器的控制器：**

```typescript
// modules/sys/user/user.controller.ts
import { ApiDataResponse, ApiOkPaginatedResponse } from '../../common/decorators/api-response.decorator';

@ApiTags('sys-user')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  @Post()
  @ApiOperation({ summary: '创建用户' })
  @ApiDataResponse(UserDto, '创建成功')
  async create(@Body() dto: CreateUserDto): Promise<UserDto> {
    return this.userService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: '用户列表（分页）' })
  @ApiOkPaginatedResponse({ type: UserDto, description: '查询成功' })
  async findAll(): Promise<PaginatedResponse<UserDto>> {
    return this.userService.findAll();
  }
}
```

---

## 更新历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 1.0.0 | 2026-03-31 | 初始版本，包含 RESTful 规范、请求/响应格式、错误码规范、数据验证规范、权限验证规范、Swagger 注解规范 |

---

*本文档由 03-API 设计规范详细设计而来*
