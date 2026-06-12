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
import { MfwConfigFormCard } from 'moyan-mfw-extension-config/frontend';
import type { ConfigFormItemConfig, ConfigFormGroupConfig } from 'moyan-mfw-extension-config/frontend';
import { ConfigType } from 'moyan-mfw-extension-config/shared';

// 基础用法
const items: ConfigFormItemConfig[] = [
  { key: 'siteName', label: '站点名称', type: 'input', configType: ConfigType.PUBLIC },
];

// 分组用法
const formGroup: ConfigFormGroupConfig = {
  type: 'el-tabs',
  groups: [
    {
      key: 'basic',
      title: '基础配置',
      template: [
        { key: 'siteName', label: '站点名称', type: 'input', configType: ConfigType.PUBLIC },
      ],
    },
  ],
};
```

### 共享

```typescript
import { ConfigType, CONFIG_PERMISSION_VALUES } from 'moyan-mfw-extension-config/shared';
```
