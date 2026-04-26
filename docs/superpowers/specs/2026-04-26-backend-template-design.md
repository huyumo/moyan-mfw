# backend 业务后端模板设计文档

## 一、概述

### 1.1 目标

创建 `backend` 目录作为业务后端模板，展示如何使用 `moyan-base-backend` npm 包创建业务系统。

### 1.2 设计原则

| 原则 | 说明 |
|------|------|
| 与 frontend 对称 | 与 `frontend` 目录结构保持对称 |
| 最小模板 | 只包含启动入口 + 一个示例业务模块 |
| 展示扩展机制 | 示例模块展示应用类型扩展 + 成员扩展实体 |

---

## 二、目录结构

```
backend/
├── src/
│   ├── main.ts                    # 启动入口
│   ├── modules/
│   │   └── supplier/              # 供应商示例模块
│   │       ├── entities/
│   │       │   └── supplier-member-profile.entity.ts  # 成员扩展实体
│   │       ├── supplier.controller.ts
│   │       ├── supplier.service.ts
│   │       ├── supplier.module.ts
│   │       └── dto/
│   │           └── create-supplier.dto.ts
│   └── app-types.config.ts        # 应用类型配置
├── package.json
├── tsconfig.json
├── nest-cli.json
└── .env.example
```

---

## 三、与 frontend 对称对比

| frontend | backend |
|----------|---------|
| `createBaseAdminApp()` | `createBaseBackendApp()` |
| `routes: businessRoutes` | `modules: [SupplierModule]` |
| `layoutExtensions` | `hooks` |
| 业务组件 | 业务实体/服务/控制器 |

---

## 四、核心文件设计

### 4.1 package.json

```json
{
  "name": "moyan-backend",
  "version": "1.0.0",
  "description": "Moyan 后台管理 - 业务后端模板",
  "type": "commonjs",
  "scripts": {
    "dev": "nest start --watch",
    "build": "nest build",
    "start": "node dist/src/main"
  },
  "dependencies": {
    "moyan-base-backend": "workspace:*",
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "typeorm": "^0.3.17",
    "mysql2": "^3.6.0",
    "reflect-metadata": "^0.1.13"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "typescript": "^5.1.3"
  }
}
```

### 4.2 main.ts

```typescript
import { createBaseBackendApp } from 'moyan-base-backend';
import { appTypesConfig } from './app-types.config';
import { SupplierModule } from './modules/supplier/supplier.module';

async function bootstrap() {
  const app = await createBaseBackendApp({
    appTypes: appTypesConfig,
    modules: [SupplierModule],
    swagger: [
      {
        name: 'supplier',
        title: '供应商API',
        include: [SupplierModule],
      },
    ],
  });

  await app.listen(3000);
}

bootstrap();
```

### 4.3 app-types.config.ts

```typescript
import { AppTypeConfig } from 'moyan-base-backend';

export const appTypesConfig: AppTypeConfig[] = [
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
];
```

### 4.4 supplier-member-profile.entity.ts

```typescript
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Base, AppMember } from 'moyan-base-backend';

@Entity('supplier_member_profile')
export class SupplierMemberProfile extends Base {
  @Column({ length: 100 })
  companyName: string;

  @Column({ length: 50, nullable: true })
  businessLicense: string;

  @Column({ length: 200, nullable: true })
  address: string;

  @ManyToOne(() => AppMember)
  @JoinColumn()
  member: AppMember;
}
```

---

## 五、实现要点

1. 创建 `backend` 目录结构
2. 配置 `package.json` 依赖 `moyan-base-backend`
3. 创建启动入口 `main.ts`
4. 创建应用类型配置 `app-types.config.ts`
5. 创建供应商示例模块（实体、服务、控制器、模块）
6. 创建 `.env.example` 环境变量示例
7. 配置 `tsconfig.json` 和 `nest-cli.json`