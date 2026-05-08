---
version: "1.0"
last_updated: "2026-04-25"
scope: backend
triggers:
  - 新增后端模块
  - 创建 Service
  - 创建 Controller
  - 创建 Entity
  - 创建 DTO
dependencies:
  - backend/pagination-query
  - auth/permission-debugging
maturity: stable
tags: [后端, 模块, Controller, Service, Entity, DTO, 权限]
---

# 新增后端模块

## 模块目录结构

```
modules/sys/xxx/
├── dto/
│   ├── req/
│   │   ├── create-xxx.dto.ts
│   │   ├── update-xxx.dto.ts
│   │   └── query-xxx.dto.ts      # 继承 PaginationQueryDto
│   ├── res/
│   │   └── xxx-response.dto.ts
│   └── index.ts                  # 统一导出
├── entities/
│   └── xxx.entity.ts
├── xxx.controller.ts             # 控制器（单实体模块扁平放置）
├── xxx.service.ts                # 服务（单实体模块扁平放置）
└── xxx.module.ts
```

## 多实体模块目录结构

当模块包含多套 Controller/Service（如 app 模块的 App + AppMember）时，使用子目录：

```
modules/sys/app/
├── controller/
│   ├── app.controller.ts
│   └── app-member.controller.ts
├── service/
│   ├── app.service.ts
│   └── app-member.service.ts
├── dto/...
├── entities/...
└── app.module.ts
```

## Controller 标准

```typescript
@ApiTags('模块英文名', '模块中文描述')
@ApiBearerAuth('Authorization')
@UseGuards(AuthGuard)
@Controller('路由名')
export class XxxController {
  constructor(private xxxService: XxxService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '简述', description: '详述' })
  @ApiResponse({ status: 201, type: XxxResponseDto })
  @AuditLog({ module: AuditModule.XXX, event: 'CREATE_XXX', description: '创建XXX' })
  @RequirePermission({ permCode: 'pc_root:sys:xxx', permissionValue: ['添加'] })
  async create(@Body() dto: CreateXxxDto) {
    const result = await this.xxxService.create(dto);
    return ApiResponseUtil.success(result, '创建成功');
  }

  @Get()
  @ApiOperation({ summary: '查询列表' })
  @ApiPaginatedResponse(XxxResponseDto)
  @RequirePermission({ permCode: 'pc_root:sys:xxx' })
  async findAll(@Query() query: QueryXxxDto) {
    const result = await this.xxxService.findAll(query);
    return ApiResponseUtil.success(result, '查询成功');
  }
}
```

Controller 必须遵守：
- 每个方法必须有 `@ApiOperation`
- 写操作（CUD）必须有 `@AuditLog` + `@RequirePermission`
- 响应统一使用 `ApiResponseUtil.success(result, message)`
- ID 参数使用 `@Param('id', ParseUUIDPipe)`
- 公开接口使用 `@Public()` 装饰器
- 获取用户信息使用 `@User()` 装饰器，而非 `@Request() req`

## @User() 装饰器

从请求中提取用户信息，避免手动从 `@Request()` 中获取：

```typescript
import { User, UserDto } from '../../../common';

// 获取完整用户信息
@Get('profile')
async getProfile(@User() user: UserDto) {
  return { userId: user.id, username: user.username };
}

// 获取单个属性（如用户 ID）
@Get('my-posts')
async getMyPosts(@User('id') userId: string) {
  return this.postService.findByUserId(userId);
}

// 获取角色 ID 列表
@Get('roles')
async getRoles(@User('roleIds') roleIds: string[]) {
  return this.roleService.findByIds(roleIds);
}
```

**UserDto 类型定义：**
```typescript
class UserDto {
  id: string;        // 用户 ID
  username: string;  // 用户名
  roleIds?: string[]; // 角色 ID 列表
}
```

**反模式：**
- ✋ 使用 `@Request() req` 然后手动获取 `req.user.id` → 使用 `@User() user` 或 `@User('id') userId`

## Service 标准

```typescript
@Injectable()
export class XxxService {
  constructor(
    @InjectRepository(Xxx) private xxxRepository: Repository<Xxx>,
    private dataSource: DataSource,
  ) {}

  async create(dto: CreateXxxDto): Promise<Xxx> {
    const existing = await this.xxxRepository.findOne({ where: { code: dto.code } });
    if (existing) throw new ConflictException('编码已存在');

    const entity = this.xxxRepository.create(dto);
    await this.dataSource.transaction(async (manager) => {
      await manager.save(entity);
    });
    return entity;
  }

  async delete(id: string): Promise<void> {
    const entity = await this.xxxRepository.findOne({ where: { id } });
    if (!entity) throw new NotFoundError('XXX');
    await this.xxxRepository.softDelete(id);
  }
}
```

Service 必须遵守：
- 多表操作必须使用事务：`await this.dataSource.transaction(async (manager) => { ... })` — 回调正常结束自动提交，throw 自动回滚
- 事务内用 `manager.query()` / `manager.save()` 代替 `repository`，确保同一连接
- 删除统一使用 `softDelete`
- 资源不存在使用 `NotFoundError`（来自 common/exceptions）
- 密码使用 `hashPassword` / `verifyPassword`（来自 common/utils/encrypt）
- 分页查询使用 `PaginationX + WhereBuilder`（详见 {{ref:backend/pagination-query}} — 分页查询规范）

## DTO 标准

```typescript
export class CreateXxxDto {
  @ApiProperty({ description: '名称', example: '示例' })
  @IsNotEmpty({ message: '名称不能为空' })
  @IsString()
  @Length(2, 64, { message: '名称长度应在 2-64 字符之间' })
  name: string;

  @ApiProperty({ description: '描述', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class QueryXxxDto extends PaginationQueryDto {
  @ApiProperty({ description: '名称（模糊查询）', required: false })
  @IsOptional()
  @IsString()
  name?: string;
}
```

## Entity 标准

- 所有实体继承 `Base`（含 createdAt/updatedAt/deletedAt）
- UUID 主键：`@PrimaryColumn('uuid') { default: () => 'UUID()' }`
- 软删除：`@DeleteDateColumn()`
- 状态字段：默认 1（启用），加 `@Index()`
- 排序字段：默认 0
- 关联关系：使用 `@ManyToOne` / `@OneToMany` + `@JoinColumn`

## 权限编码规则

- 格式：`pc_root:sys:模块名`（PC 端管理权限前缀）
- 小写+连字符：`pc_root:sys:order-management`
- 当前已有编码：`user` / `role` / `permission` / `permission-pc` / `app-type` / `app` / `member` / `audit-log`
- 新增模块须在 `common/constants/permissions.ts` 中添加权限编码
- `permissionValue` 位运算值：添加=1n / 编辑=2n / 删除=4n / 导出=8n / 导入=16n / 审批=32n

完整认证链路与排查详见 {{ref:permission-debugging}} — 权限与认证排查

## 异常使用

| 异常类 | 场景 | HTTP 状态码 |
|--------|------|-----------|
| `NotFoundError('资源名')` | 资源不存在 | 404 |
| `ForbiddenError()` | 无权限 | 403 |
| `UnauthorizedError()` | 未认证 | 401 |
| `BusinessException(msg)` | 业务异常 | 400 |
| `ConflictException(msg)` | 唯一性冲突 | 409 |
| `BadRequestException(msg)` | 参数错误 | 400 |

## 反模式（Red Flags）— 立即停止

- ✋ 单实体模块创建 `controller/` 或 `service/` 子目录 → 扁平放置，仅多实体模块使用子目录
- ✋ 手写 TypeORM `createQueryBuilder` 做分页查询 → 使用 `PaginationX + WhereBuilder`（例外：复杂关联查询/子查询 PaginationX 不支持时，可使用 QueryBuilder，但须经 Review 确认）
- ✋ 在 Service 中直接 `this.xxxRepository.find()` 做分页 → 使用 `PaginationX`
- ✋ 忘记在 Controller 写操作方法上加 `@AuditLog` → CUD 操作必加（例外：内部批处理/定时任务调用的方法，标记 `@Public()` 且加注释说明原因）
- ✋ 忘记在 Controller 写操作方法上加 `@RequirePermission` → CUD 操作必加（例外：同上，内部方法须标记 `@Public()` 且加注释）
- ✋ 使用 `@PrimaryGeneratedColumn()` 自增主键 → 使用 UUID：`@PrimaryColumn('uuid') { default: () => 'UUID()' }`
- ✋ 使用硬删除 `repository.remove()` / `repository.delete()` → 使用 `softDelete()`（例外：中间表/关联表的清理操作可硬删除，须加注释说明原因）
- ✋ 手写 `createQueryRunner() + connect + startTransaction + try/catch/finally + release` → 使用 `this.dataSource.transaction(callback)`，TypeORM 内部处理 begin/commit/rollback/release
- ✋ 响应不使用 `ApiResponseUtil.success()` → 统一包装响应
- ✋ 新增模块后忘记运行 `pnpm run api:build` → 修改后端后必须重新生成前端 API

## 新增后端模块清单

详见 {{ref:resources/backend-checklist}} — 后端模块 13 项清单
