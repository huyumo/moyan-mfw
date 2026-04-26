# moyan-base-backend

墨焱基础后端框架 - NestJS 管理后台基础设施

## 安装

```bash
npm install moyan-base-backend
```

或使用 pnpm：

```bash
pnpm add moyan-base-backend
```

## 使用方式

### 基础使用

```typescript
import { createBaseBackendApp } from 'moyan-base-backend';

async function bootstrap() {
  const app = await createBaseBackendApp();
  await app.listen(3000);
}

bootstrap();
```

### 配置应用类型

```typescript
import { createBaseBackendApp, AppTypeConfig } from 'moyan-base-backend';

const appTypes: AppTypeConfig[] = [
  {
    typeName: '供应商',
    typeCode: 'supplier',
    typeDesc: '供应商应用类型',
    multiAppEnabled: 1,
    builtinRole: [
      { roleCode: 'supplier_admin', roleName: '供应商管理员' },
      { roleCode: 'supplier_member', roleName: '供应商成员' },
    ],
  },
  {
    typeName: '配送商',
    typeCode: 'delivery',
    multiAppEnabled: 1,
    builtinRole: [
      { roleCode: 'delivery_admin', roleName: '配送商管理员' },
    ],
  },
];

const app = await createBaseBackendApp({
  appTypes,
});

await app.listen(3000);
```

### 注册业务模块

```typescript
import { createBaseBackendApp, Base, AppMember } from 'moyan-base-backend';
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Module, Controller, Get, Injectable } from '@nestjs/common';

// 创建扩展实体
@Entity('supplier_member_profile')
export class SupplierMemberProfile extends Base {
  @Column()
  companyName: string;

  @Column()
  businessLicense: string;

  @ManyToOne(() => AppMember)
  @JoinColumn()
  member: AppMember;
}

// 业务服务
@Injectable()
export class SupplierService {
  constructor() {}

  async getSuppliers() {
    // 业务逻辑
  }
}

// 业务 Controller
@Controller('supplier')
export class SupplierController {
  constructor(private supplierService: SupplierService) {}

  @Get('list')
  async getList() {
    return this.supplierService.getSuppliers();
  }
}

// 业务模块
@Module({
  controllers: [SupplierController],
  providers: [SupplierService],
})
export class SupplierModule {}

// 创建应用
const app = await createBaseBackendApp({
  appTypes: [
    { typeName: '供应商', typeCode: 'supplier', builtinRole: [...] },
  ],
  modules: [SupplierModule],
});

await app.listen(3000);
```

### 使用钩子扩展

```typescript
import { createBaseBackendApp, HookConfig } from 'moyan-base-backend';

const hooks: HookConfig = {
  onDatabaseReady: async (ctx) => {
    console.log('数据库连接已建立');
    // 执行初始化逻辑
  },
  onAppInit: async (ctx) => {
    console.log('应用初始化完成');
    // 获取服务
    const userService = ctx.getService(UserService);
    // 执行业务初始化
  },
  afterLogin: async (ctx, user, token) => {
    console.log(`用户 ${user.username} 登录成功`);
    // 记录额外信息
  },
};

const app = await createBaseBackendApp({
  hooks,
});

await app.listen(3000);
```

### 配置 Swagger 多文档

```typescript
import { createBaseBackendApp, SwaggerGroupConfig } from 'moyan-base-backend';

const swagger: SwaggerGroupConfig[] = [
  {
    name: 'business',
    title: '业务API文档',
    description: '商城业务模块 API',
    include: [SupplierModule, ProductModule],
  },
  {
    name: 'delivery',
    title: '配送API文档',
    include: [DeliveryModule],
  },
];

const app = await createBaseBackendApp({
  swagger,
});

await app.listen(3000);

// API 文档地址：
// - 核心 API: http://localhost:3000/api-docs/sys
// - 业务 API: http://localhost:3000/api-docs/business
// - 配送 API: http://localhost:3000/api-docs/delivery
```

## 导出内容

### 应用工厂

- `createBaseBackendApp` - 应用工厂函数

### 核心实体

- `User` - 用户实体
- `Role` - 角色实体
- `Permission` - 权限实体
- `AppType` - 应用类型实体
- `App` - 应用实例实体
- `AppMember` - 应用成员实体
- `AuditLog` - 审计日志实体
- `Base` - 实体基类

### 核心服务

- `AuthService` - 认证服务
- `UserService` - 用户服务
- `RoleService` - 角色服务
- `PermissionService` - 权限服务
- `AppTypeService` - 应用类型服务
- `AppService` - 应用实例服务
- `AppMemberService` - 应用成员服务
- `AuditLogService` - 审计日志服务
- `InstallService` - 系统初始化服务

### 装饰器

- `@Public()` - 标记公共接口（无需认证）
- `@RequirePermission()` - 权限控制
- `@User()` - 获取当前用户
- `@AuditLog()` - 审计日志记录

### 守卫

- `AuthGuard` - JWT 认证守卫
- `PermissionGuard` - 权限守卫

### 工具函数

- `PaginationX` - 分页查询工具
- `hashPassword` / `verifyPassword` - 密码加密/验证
- `hasPermission` - 权限位运算检查
- `flatToTree` / `treeToFlat` - 树形结构转换

### 类型定义

- `CreateBaseBackendAppOptions` - 应用配置选项
- `AppTypeConfig` - 应用类型配置
- `HookConfig` - 钩子配置
- `AppContext` - 应用上下文
- `SwaggerGroupConfig` - Swagger 文档分组配置

## 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Node.js | 20.x | 运行时环境 |
| NestJS | 10.x | Web 应用框架 |
| TypeORM | 0.3.x | ORM 框架 |
| MySQL | 8.0+ | 关系型数据库 |
| Redis | 7.x | 缓存/会话存储 |
| JWT | - | Token 认证 |
| Swagger | - | API 文档 |

## 环境要求

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- MySQL 8.0+
- Redis 7.x

## 许可证

MIT License

---

**维护**: Moyan Team | **版本**: 1.0.0