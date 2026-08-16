# 后端 · SPI 集成

框架通过 SPI（Service Provider Interface）向业务方提供两组入口，让业务实体与框架内部状态（应用实例/成员/角色/用户）保持同步：

| 入口 | 载体 | 调用方向 | 典型场景 |
|------|------|----------|----------|
| **业务层入口** | 抽象类（`AppEntitySpi` / `UserEntitySpi` / `RoleEntitySpi` / `AppTypeEntitySpi`） | 业务代码 **调用** 框架 | 添加商家时同步创建应用实例并绑定拥有者 |
| **框架层入口** | 监听器接口 + `SpiEventBus` | 框架操作时 **回调** 业务方 | 成员变更时同步商家侧状态 |

所有 SPI 从 `moyan-mfw-base/backend` 导出；`SysModule` 为 `@Global()`，业务方**无需 import 模块**，直接在构造函数注入即可。

## 一、业务层入口：实体管理抽象类

### `AppEntitySpi` — 应用实例同步（核心）

```typescript
import { AppEntitySpi, CreateAppSpiInput } from 'moyan-mfw-base/backend';

@Injectable()
export class MerchantService {
  constructor(private readonly appEntitySpi: AppEntitySpi) {}

  async create(dto: CreateMerchantDto) {
    // 一步完成：解析应用类型 → 创建应用实例 → 绑定拥有者（成员记录 + owner 角色）
    const app = await this.appEntitySpi.createApp({
      appName: dto.merchantName,
      appCode: dto.merchantCode,
      appTypeCode: 'merchant',   // 与 appTypesConfig 中的 typeCode 对应
      logo: dto.logo,
      ownerId: dto.ownerId,
    });

    try {
      const merchant = this.merchantRepository.create({ ...dto, appId: app.id, status: 1 });
      return await this.merchantRepository.save(merchant);
    } catch (error) {
      // 补偿：业务保存失败时回滚应用实例
      await this.appEntitySpi.deleteApp(app.id).catch(() => undefined);
      throw error;
    }
  },

  async disable(id: string) {
    // 业务状态 + SPI 同步禁用应用
    await this.appEntitySpi.disableApp(merchant.appId);
  }
}
```

方法清单：

| 方法 | 说明 |
|------|------|
| `createApp(input)` | 创建应用实例（`appTypeId` 与 `appTypeCode` 二选一，同时提供优先 `appTypeId`），传 `ownerId` 时自动绑定拥有者 |
| `updateApp(appId, input)` | 更新应用基础信息（名称/描述/logo/排序） |
| `disableApp(appId)` / `enableApp(appId)` | 禁用 / 启用应用实例 |
| `deleteApp(appId)` | 删除应用实例（软删） |
| `changeAppOwner(appId, ownerId)` | 变更拥有者（同步成员记录与 owner 角色） |
| `getApp(appId)` / `findAppByCode(appCode)` | 查询（含拥有者与应用类型） |### `UserEntitySpi` — 用户同步（扩展注册方式）

用于三方注册、批量导入用户等业务侧创建框架用户的场景：

```typescript
import { UserEntitySpi } from 'moyan-mfw-base/backend';

@Injectable()
export class MerchantService {
  constructor(private readonly userEntitySpi: UserEntitySpi) {}

  async registerThirdParty(dto: ThirdPartyRegisterDto) {
    const existing = await this.userEntitySpi.findByUsername(dto.platformUserId);
    if (existing) throw new BadRequestException('该三方账号已注册');

    // 框架默认实现保证：唯一性校验 + 密码加密 + 触发 user.created 事件
    const user = await this.userEntitySpi.createUser({
      username: dto.platformUserId,
      password: randomBytes(8).toString('hex'),
      nickname: dto.nickname,
      phone: dto.phone,
    });
    // ...创建业务实体并绑定 ownerId: user.id
  }
}
```

方法清单：`createUser(input)` / `findByUsername(username)` / `findById(id)`。

### `RoleEntitySpi` / `AppTypeEntitySpi`

- `RoleEntitySpi`：`createRole(input)` / `assignPermissions(input)` 等，业务侧扩展角色管理时使用。
- `AppTypeEntitySpi`：查询应用类型配置。## 二、框架层入口：事件监听器

实现框架接口并在构造函数中注册到 `SpiEventBus`，框架内部变更时自动回调（旁路语义：监听器异常只记日志，不影响主流程）。

### 成员事件

```typescript
import {
  SpiEventBus,
  MemberEventListener,
  MemberAddedEvent,
  MemberRemovedEvent,
  MemberRolesChangedEvent,
} from 'moyan-mfw-base/backend';

@Injectable()
export class MerchantMemberListener implements MemberEventListener {
  constructor(eventBus: SpiEventBus) {
    eventBus.registerMemberListener(this);
  },

  async onMemberAdded(event: MemberAddedEvent) {
    // event: { appId, userId, ... }
  },
  async onMemberRemoved(event: MemberRemovedEvent) {},
  async onMemberRolesChanged(event: MemberRolesChangedEvent) {},
}
```

### 用户事件 / 角色事件

| 接口 | 方法 |
|------|------|
| `UserEventListener` | `onUserCreated` / `onUserUpdated` / `onUserDeleted` |
| `RoleEventListener` | `onRoleCreated` / `onRoleUpdated` / `onRoleDeleted` / `onRolePermissionsChanged` |

```typescript
eventBus.registerUserListener(this); // 注册用户监听器
eventBus.registerRoleListener(this); // 注册角色监听器
```

## 三、自定义默认实现

框架提供默认实现 `DefaultAppEntitySpi` / `DefaultUserEntitySpi` / `DefaultRoleEntitySpi` / `DefaultAppTypeEntitySpi`。业务方可继承并覆盖个别方法后，以自定义 Provider 覆盖：

```typescript
// 业务模块中
@Module({
  providers: [{ provide: AppEntitySpi, useClass: MyAppEntitySpi }],
})
export class BusinessModule {}
```

## 完整示例

仓库 `demo/backend/src/modules/merchant/` 是完整 SPI 用例（业务层入口 + 框架层监听器）；`demo/backend/src/modules/ledger-demo/` 展示了 5 个 SPI 的组合用法。
