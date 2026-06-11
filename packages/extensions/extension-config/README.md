# moyan-mfw-extension-config

MFW 配置管理扩展包，提供前后端统一的参数配置管理能力。

## 功能

- 支持全局配置与应用级配置
- 提供 `MfwConfigFormCard` 前端组件，开箱即用
- 提供后端 CRUD 接口与批量保存接口
- 基于 RBAC 权限控制

## 安装

```bash
npm install moyan-mfw-extension-config
```

## 使用

### 后端

```typescript
import { ConfigModule } from 'moyan-mfw-extension-config/backend';

@Module({
  imports: [ConfigModule],
})
export class AppModule {}
```

### 前端

```typescript
import { MfwConfigFormCard, configRoutes } from 'moyan-mfw-extension-config/frontend';

// 组件使用
// <MfwConfigFormCard ref="formRef" groupKey="your-group" :items="items" :app-id="appId" />
```

### 共享

```typescript
import { ConfigType, CONFIG_PERMISSION_VALUES } from 'moyan-mfw-extension-config/shared';
```
