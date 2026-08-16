# 01 · 快速开始

## 安装

```bash
npm install moyan-mfw-base
# 或
pnpm add moyan-mfw-base
```

> 前置依赖（peerDependencies）：`moyan-api`（前端 API 调用层运行时）。
> 运行环境：Node.js >= 20；项目为 ES Module（`"type": "module"`）。

## 一、后端快速开始

### 1. 创建入口文件

```typescript
// backend/src/main.ts
import { createBaseBackendApp } from 'moyan-mfw-base/backend';
import { AppModule } from './app.modules';
import { appTypesConfig } from './app-types.config';
import './permissions'; // 注册业务权限值

async function bootstrap() {
  const app = await createBaseBackendApp({
    name: '墨焱业务后端',
    appTypes: appTypesConfig,      // 业务应用类型
    syncAppTypes: true,            // 启动时同步应用类型到数据库
    modules: [AppModule],          // 业务模块
    swagger: [{ name: 'my-api', title: '我的业务 API', include: [AppModule] }],
  });

  await app.listen(Number(process.env.PORT) || 3000);
}

bootstrap();
```

### 2. 业务模块（标准 CRUD 模块）

```typescript
// backend/src/modules/supplier/supplier.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupplierController } from './supplier.controller';
import { SupplierService } from './supplier.service';
import { SupplierMemberProfile } from './entities/supplier-member-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SupplierMemberProfile])],
  controllers: [SupplierController],
  providers: [SupplierService],
  exports: [SupplierService],
})
export class SupplierModule {}
```

```typescript
// backend/src/modules/supplier/supplier.controller.ts
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SupplierService } from './supplier.service';
import { Permission } from '../../permissions'; // 业务权限装饰器（见下）

@ApiTags('supplier')
@Controller('supplier')
@Permission('supplier:manage') // 类级别：整个控制器需要该权限点
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Get('profile/:memberId')
  @ApiOperation({ summary: '获取供应商档案' })
  async getProfile(@Param('memberId') memberId: string) {
    return this.supplierService.getSupplierProfile(memberId);
  }

  @Post('profile/:memberId')
  @ApiOperation({ summary: '创建供应商档案' })
  @Permission('supplier:manage', ['上架']) // 方法级别：叠加操作权限位
  async createProfile(@Param('memberId') memberId: string, @Body() dto: CreateSupplierDto) {
    return this.supplierService.createSupplierProfile(memberId, dto);
  }
}
```

### 3. 业务权限装饰器（带类型推断）

```typescript
// backend/src/permissions.ts
import { createBusinessPermissionDecorator } from 'moyan-mfw-base/backend';

export const BUSINESS_PERMISSION_VALUES = ['上架', '发货', '退款', '添加'] as const;
export const Permission = createBusinessPermissionDecorator(BUSINESS_PERMISSION_VALUES);
```

### 4. 应用类型配置

```typescript
// backend/src/app-types.config.ts
import { AppTypeConfig } from 'moyan-mfw-base/backend';

export const appTypesConfig: AppTypeConfig[] = [
  {
    typeName: '供应商',
    typeCode: 'supplier',
    typeDesc: '供应商应用类型',
    multiAppEnabled: 1, // 1=一个用户可加入多个应用实例，0=只能加入一个
    builtinRole: [
      { roleCode: 'supplier_admin', roleName: '供应商管理员', isOwner: 1 },
      { roleCode: 'supplier_member', roleName: '供应商成员' },
    ],
  },
];
```

> 注意：内置类型 `system` 和 `admin` 不可覆盖。

## 二、前端快速开始

### 1. 菜单树配置（路由与权限的唯一数据源）

```typescript
// frontend/src/menu-trees.ts
import type { FrontendAppTypeMenuConfig } from 'moyan-mfw-base/frontend';
import { SysUserPage, SysRolePage } from 'moyan-mfw-base/frontend'; // 内置系统页面
import DashboardPage from '@/views/dashboard/Index.vue';

const systemMenuTree: FrontendAppTypeMenuConfig = {
  appTypeCode: 'system',
  roleCode: 'super_admin',
  label: '系统管理',
  icon: 'Setting',
  children: [
    { path: 'dashboard', name: '首页', icon: 'DataBoard', component: DashboardPage },
    {
      path: 'sys',
      name: '系统管理',
      icon: 'Setting',
      children: [
        { path: 'user', name: '用户管理', icon: 'User', permissions: ['添加', '编辑', '删除'], component: SysUserPage },
        { path: 'role', name: '角色管理', icon: 'UserFilled', permissions: ['添加', '编辑', '删除'], component: SysRolePage },
      ],
    },
  ],
};

export const menuTrees: FrontendAppTypeMenuConfig[] = [systemMenuTree];
```

### 2. 入口文件

```typescript
// frontend/src/main.ts
import { createBaseAdminApp, registerPermissionValues } from 'moyan-mfw-base/frontend';
import { menuTrees } from './menu-trees';
import './permissions'; // 业务页面配置函数

// 注册业务自定义权限值（与后端 BUSINESS_PERMISSION_VALUES 保持一致）
registerPermissionValues(['上架', '发货', '退款', '添加']);

const admin = createBaseAdminApp({
  title: '墨焱业务前端',
  menuTrees,
  layout: {
    layoutMode: 'sidebar',
    showTabs: true,
    colorMode: 'system',
    themePackage: 'tech',
  },
  navigation: {
    brandName: '墨焱管理后台',
    brandTagline: '业务演示应用',
    homePath: '/',
  },
});

// 从后端拉取权限值（name → bitValue）并初始化缓存
const values = await admin.fetchPermissionValues();
admin.initPermissionCache(values);

await admin.mount('#app');
```

## 三、共享层快速开始（字典框架）

```typescript
import { DictMeta, DictEntry, toItems, getLabel } from 'moyan-mfw-base/shared';

@DictMeta({ key: 'gender', label: '性别' })
export class GenderDict {
  @DictEntry({ label: '未知', type: 'info' })
  static UNKNOWN = 0;

  @DictEntry({ label: '男', type: 'primary' })
  static MALE = 1;

  @DictEntry({ label: '女', type: 'danger' })
  static FEMALE = 2;
}

toItems(GenderDict); // [{ value: 0, label: '未知', type: 'info' }, ...]
getLabel(GenderDict, 1);  // '男'
```

## 下一步

- 阅读 [02-核心概念](./02-core-concepts.md) 理解权限与多租户模型
- 后端：阅读 [应用工厂与配置](./03-backend/app-factory.md) 与 [装饰器](./03-backend/decorators.md)
- 前端：阅读 [路由与菜单树](./04-frontend/routing.md) 与 [组件总览](./04-frontend/components/README.md)