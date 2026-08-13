# 管理 SPI（框架提供给业务方的编程接口）

> 面向框架使用者（业务方）：在自有业务实体管理接口中，通过 SPI 同步维护框架内部的**应用实例 / 角色 / 成员 / 用户**状态。

## 一、SPI 定位

框架以 **SPI（Service Provider Interface）** 方式向业务方提供两组入口：

| 入口 | 载体 | 调用方向 | 典型场景 |
|---|---|---|---|
| **业务层入口** | 抽象类（`AppEntitySpi` / `UserEntitySpi` / `RoleEntitySpi` / `AppTypeEntitySpi`） | 业务方代码 **调用** 框架 | 添加商家时同步创建应用实例并绑定拥有者 |
| **框架层入口** | 监听器接口（`MemberEventListener` / `UserEventListener` / `RoleEventListener`）+ `SpiEventBus` | 框架内部操作时 **回调** 业务方 | 成员被添加/移除/角色变更时，业务方同步商家侧状态 |

所有 SPI 均从 `moyan-mfw-base/backend` 导出，`SysModule` 已标记 `@Global()`，**业务方无需 import 任何模块，直接在构造函数中注入即可**。

## 二、业务层入口：实体管理抽象类

### 1. AppEntitySpi —— 应用实体 SPI（核心）

业务方在业务实体管理接口中调用，同步维护框架应用实例状态：

```typescript
import { AppEntitySpi, CreateAppSpiInput } from 'moyan-mfw-base/backend';

@Injectable()
export class MerchantService {
  constructor(
    private appEntitySpi: AppEntitySpi, // 直接注入抽象类，框架提供默认实现
  ) {}

  /** 添加商家：业务实体创建 + SPI 同步应用实例（一步完成建应用 + 绑定 owner） */
  async create(dto: CreateMerchantDto) {
    // 1. 业务侧：保存商家扩展表
    const merchant = await this.merchantRepo.save({ ...dto, status: 1 });

    try {
      // 2. 调用 SPI：创建应用实例 + 绑定拥有者（内部完成成员记录 + owner 角色分配）
      const app = await this.appEntitySpi.createApp({
        appName: dto.merchantName,       // 应用名称（店铺名称）
        appCode: dto.merchantCode,       // 应用编码（业务唯一）
        appTypeCode: 'merchant',         // 应用类型编码，框架按编码解析 appTypeId
        logo: dto.logo,
        ownerId: dto.adminUserId,        // 创建时绑定拥有者
      });
      merchant.appId = app.id;
      return this.merchantRepo.save(merchant);
    } catch (error) {
      // 补偿：框架侧同步失败时回滚业务记录
      await this.merchantRepo.remove(merchant);
      throw error;
    }
  }

  /** 禁用商家：业务状态 + SPI 同步禁用应用实例 */
  async disable(id: string) {
    const merchant = await this.merchantRepo.findOne({ where: { id } });
    merchant.status = 0;
    await this.merchantRepo.save(merchant);
    await this.appEntitySpi.disableApp(merchant.appId); // 同步禁用应用
  }
}
```

**方法清单：**

| 方法 | 说明 |
|---|---|
| `createApp(input)` | 一步完成：解析应用类型 → 创建应用实例 →（传 `ownerId` 时）绑定拥有者（成员 + owner 角色分配） |
| `updateApp(appId, input)` | 更新应用基础信息（名称/描述/logo/排序） |
| `disableApp(appId)` / `enableApp(appId)` | 禁用 / 启用应用实例 |
| `deleteApp(appId)` | 删除应用实例（软删，`system-instance` 受保护） |
| `changeAppOwner(appId, ownerId)` | 变更拥有者（完整移交：旧 owner 成员/角色清理 + 新 owner 绑定） |
| `getApp(appId)` / `findAppByCode(appCode)` | 查询（含 owner/appType） |

### 2. UserEntitySpi —— 用户实体 SPI（扩展注册方式）

业务方扩展注册方式（如三方注册）时，通过 SPI 创建框架用户：

```typescript
import { UserEntitySpi } from 'moyan-mfw-base/backend';

@Injectable()
export class MerchantService {
  constructor(private userEntitySpi: UserEntitySpi) {}

  /** 三方注册：业务层入口调用 SPI 创建框架用户 */
  async registerByWechat(dto: WechatRegisterDto) {
    const existing = await this.userEntitySpi.findByUsername(dto.openId);
    if (existing) throw new BadRequestException('该三方账号已注册');

    const user = await this.userEntitySpi.createUser({
      username: dto.openId,
      password: randomBytes(8).toString('hex'),
      nickname: dto.nickname,
      phone: dto.phone,
    });
    // 唯一性校验 + 密码加密由框架默认实现保证，并自动触发 user.created 事件
    return user;
  }
}
```

**方法清单：** `createUser(input)`（唯一性校验 + 加密 + 保存 + 触发事件）、`findByUsername(username)`、`findById(id)`

### 3. RoleEntitySpi / AppTypeEntitySpi

- `RoleEntitySpi`：`createRole(input)`（roleCode 全局唯一校验）、`assignPermissions(roleId, permissionTrees)`（权限池校验）、`getRole(roleId)`
- `AppTypeEntitySpi`（只读）：`findById(appTypeId)`、`findByCode(typeCode)`、`findAll()`

### 覆盖默认实现

框架默认实现类：`DefaultAppEntitySpi` / `DefaultUserEntitySpi` / `DefaultRoleEntitySpi` / `DefaultAppTypeEntitySpi`（均从 `moyan-mfw-base/backend` 导出）。业务方可继承默认实现并覆盖个别方法：

```typescript
import { DefaultAppEntitySpi, CreateAppSpiInput } from 'moyan-mfw-base/backend';

@Injectable()
export class MyAppEntitySpi extends DefaultAppEntitySpi {
  async createApp(input: CreateAppSpiInput) {
    const app = await super.createApp(input);
    // 自定义扩展：同步外部 ERP / 发通知等
    return app;
  }
}
```

## 三、框架层入口：实体变更事件

框架内部在成员/角色/用户变更时触发事件，业务方**实现监听器接口并注册到 `SpiEventBus`**（与 scheduler 的 `ScheduledTaskHandler` 自注册模式一致）。

### 1. 成员事件（MemberEventListener）

```typescript
import { SpiEventBus, MemberEventListener, MemberAddedEvent } from 'moyan-mfw-base/backend';

@Injectable()
export class MerchantMemberListener implements MemberEventListener {
  constructor(eventBus: SpiEventBus) {
    eventBus.registerMemberListener(this); // 集成注册
  }

  async onMemberAdded(event: MemberAddedEvent): Promise<void> {
    // 成员加入应用时同步商家侧状态（成员数 / 通知等）
    console.log(`成员加入 appId=${event.appId} userId=${event.userId}`);
  }

  async onMemberRemoved(event: MemberRemovedEvent): Promise<void> { /* ... */ }
  async onMemberRolesChanged(event: MemberRolesChangedEvent): Promise<void> { /* ... */ }
}
```

放入业务模块 providers 即自动生效：

```typescript
@Module({
  providers: [MerchantService, MerchantMemberListener], // 监听器构造时自注册
})
export class MerchantModule {}
```

### 2. 事件总览

| 监听器接口 | 回调方法 | 触发时机 |
|---|---|---|
| `MemberEventListener` | `onMemberAdded` / `onMemberRemoved` / `onMemberRolesChanged` | 添加/移除成员、变更成员角色 |
| `UserEventListener` | `onUserCreated` / `onUserUpdated` / `onUserDeleted` | sys_users 创建/更新（含状态变更）/删除 |
| `RoleEventListener` | `onRoleCreated` / `onRoleUpdated` / `onRoleDeleted` / `onRolePermissionsChanged` | 角色创建/更新/删除/权限分配 |

监听器全部方法均为**可选实现**；异常会被捕获记录，**不影响框架主流程**（旁路语义）。

## 四、登录 / 注册前后钩子

`AuthService` 支持注册钩子，`login()` / `register()` 前后触发：

### 方式一：createBaseBackendApp 的 hooks 配置（HookConfig）

```typescript
createBaseBackendApp({
  // ...
  hooks: {
    beforeLogin: async (ctx, credentials) => { /* 登录前（异常可阻止登录） */ },
    afterLogin: async (ctx, user, token) => { /* 登录成功后 */ },
    beforeRegister: async (ctx, registerDto) => { /* 注册前（异常可阻止注册） */ },
    afterRegister: async (ctx, user) => { /* 注册成功后 */ },
  },
});
```

### 方式二：向 AuthService 直接注册（业务方代码内）

```typescript
import { AuthService } from 'moyan-mfw-base/backend';

@Injectable()
export class MerchantRegisterHook {
  constructor(authService: AuthService) {
    authService.registerAuthHook('afterRegister', async (user) => {
      // 新用户注册后创建商家默认配置
    });
  }
}
```

钩子异常会向上传播（`beforeLogin` / `beforeRegister` 异常可阻止流程）。

## 五、事务边界与一致性建议

- **SPI 方法内部**各自保证一致性（如 `createApp` 中创建应用与绑定 owner 的顺序保证；`changeOwner` 自带事务）
- **业务扩展表与框架状态之间**的强一致由业务方保障，推荐模式：
  1. 先保存业务扩展表 → 调用 SPI → 回填关联 ID；SPI 失败时**补偿回滚**业务记录（见上文商家示例）
  2. 需要强事务时，业务方可用框架 `DataSource` 的 `transaction` 包裹，SPI 内部对同一 DataSource 的嵌套事务会并入外层事务

## 六、可运行示例

`demo/backend/src/modules/merchant/` 提供了完整的商家管理示例：

- `POST /api/merchants` —— 添加商家：SPI 同步创建应用实例 + 绑定 owner
- `POST /api/merchants/register-third-party` —— 三方注册：`UserEntitySpi.createUser` + `AppEntitySpi.createApp`
- `PUT /api/merchants/:id/disable` / `enable` —— 禁用/启用：SPI 同步应用状态
- `DELETE /api/merchants/:id` —— 删除：SPI 同步删除应用
- `MerchantMemberListener` / `MerchantUserListener` —— 成员/用户变更事件监听示例
- `main.ts` hooks —— 登录/注册前后钩子示例
