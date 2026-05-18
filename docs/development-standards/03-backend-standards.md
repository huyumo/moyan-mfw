# 03 · 后端开发规范

## 模块目录结构

### 单实体模块（扁平）

```
modules/sys/xxx/
├── dto/
│   ├── req/
│   │   ├── create-xxx.dto.ts
│   │   ├── update-xxx.dto.ts
│   │   └── query-xxx.dto.ts      # 继承 PaginationQueryDto
│   ├── res/
│   │   └── xxx-response.dto.ts
│   └── index.ts
├── entities/
│   └── xxx.entity.ts
├── xxx.controller.ts
├── xxx.service.ts
└── xxx.module.ts
```

### 多实体模块（子目录）

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

---

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
    const result = await this.xxxService.create(dto)
    return ApiResponseUtil.success(result, '创建成功')
  }

  @Get()
  @ApiOperation({ summary: '查询列表' })
  @ApiPaginatedResponse(XxxResponseDto)
  @RequirePermission({ permCode: 'pc_root:sys:xxx' })
  async findAll(@Query() query: QueryXxxDto) {
    const result = await this.xxxService.findAll(query)
    return result  // TransformInterceptor 自动包装
  }
}
```

### Controller 必须遵守

- ✅ 每个方法必须有 `@ApiOperation`
- ✅ 写操作（CUD）必须有 `@AuditLog` + `@RequirePermission`
- ✅ 响应统一使用 `ApiResponseUtil.success(result, message)`
- ✅ ID 参数使用 `@Param('id', ParseUUIDPipe)`
- ✅ 公开接口使用 `@Public()` 装饰器
- ✅ 获取用户信息使用 `@User()` 装饰器，而非 `@Request() req`
- ✋ 禁止使用 `@Request()` / `@Req()` 获取用户

---

## Service 标准

```typescript
@Injectable()
export class XxxService {
  constructor(
    @InjectRepository(Xxx) private xxxRepository: Repository<Xxx>,
    private dataSource: DataSource,
  ) {}

  async create(dto: CreateXxxDto): Promise<Xxx> {
    const existing = await this.xxxRepository.findOne({ where: { code: dto.code } })
    if (existing) throw new ConflictException('编码已存在')

    const entity = this.xxxRepository.create(dto)
    await this.dataSource.transaction(async (manager) => {
      await manager.save(entity)
    })
    return entity
  }

  async delete(id: string): Promise<void> {
    const entity = await this.xxxRepository.findOne({ where: { id } })
    if (!entity) throw new NotFoundError('XXX')
    await this.xxxRepository.softDelete(id)
  }
}
```

### Service 必须遵守

- ✅ 多表操作使用 `dataSource.transaction(callback)` — 回调正常结束自动 commit，throw 自动 rollback
- ✅ 事务内用 `manager.query()` / `manager.save()`，确保同一连接
- ✅ 删除统一 `softDelete`
- ✅ 资源不存在用 `NotFoundError('资源名')`
- ✅ 分页查询用 `PaginationX + WhereBuilder`
- ✋ 禁止 `createQueryRunner() + try/catch` 手写事务
- ✋ 禁止 `repository.find()` 做分页

---

## Entity 标准

- ✅ 所有实体继承 `Base`（含 `createdAt` / `updateAt` / `deleteAt`）
- ✅ UUID 主键：`@PrimaryGeneratedColumn('uuid')`
- ✅ 软删除：`@DeleteDateColumn()`
- ✅ 状态字段：默认 `1`（启用），加 `@Index()`
- ✅ 排序字段：默认 `0`
- ✋ 禁止自增主键 `@PrimaryGeneratedColumn()`
- ✋ 禁止硬删除 `repository.remove()` / `repository.delete()`

---

## DTO 标准

```typescript
export class CreateXxxDto {
  @ApiProperty({ description: '名称', example: '示例' })
  @IsNotEmpty({ message: '名称不能为空' })
  @IsString()
  @Length(2, 64, { message: '名称长度应在 2-64 字符之间' })
  name: string

  @ApiProperty({ description: '描述', required: false })
  @IsOptional()
  @IsString()
  description?: string
}

export class QueryXxxDto extends PaginationQueryDto {
  @ApiProperty({ description: '名称（模糊查询）', required: false })
  @IsOptional()
  @IsString()
  name?: string
}
```

---

## 异常使用速查

| 异常类 | HTTP 状态码 | 场景 |
|--------|-----------|------|
| `NotFoundError('资源名')` | 404 | 资源不存在 |
| `ForbiddenError()` | 403 | 无权限 |
| `UnauthorizedError()` | 401 | 未认证 |
| `BusinessException(msg, code?)` | 400 | 业务异常 |
| `ConflictException(msg)` | 409 | 唯一性冲突 |
| `BadRequestException(msg)` | 400 | 参数错误 |

---

## 分页查询标准

```typescript
async findAll(query: QueryXxxDto): Promise<PaginationResult<XxxResponseDto>> {
  const { name, status } = query
  const whereBuilder = new WhereBuilder()
  whereBuilder.like('xxx.name', name).eq('xxx.status', status)

  const pager = new PaginationX(this.dataSource, query)
  return await pager
    .where('main', whereBuilder)
    .sql(({ select, wheres, orderBy, limit }) => {
      const whereClause = wheres?.main || ''
      return `SELECT ${select} FROM sys_xxx xxx ${whereClause} ${orderBy} ${limit}`
    })
    .select('xxx.*')
    .defaultOrderBy('xxx.createdAt DESC')
    .getData()
}
```

---

## 权限编码规则

- 格式：`pc_root:sys:模块名`（PC 端管理权限前缀）
- 新增模块须在 `common/constants/permissions.ts` 中添加权限编码
- `permissionValue` 位值：添加=1n / 编辑=2n / 删除=4n / 导出=8n / 导入=16n / 审批=32n
