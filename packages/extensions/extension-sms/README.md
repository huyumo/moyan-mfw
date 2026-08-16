# moyan-mfw-extension-sms

MFW 短信扩展包：运营商凭证 + 短信模板配置入库（页面管理）+ 通用发送 + 验证码服务。

自实际项目 `libs/sms` 迁移升级：配置从"环境变量 + 内存模板注册"升级为"数据库持久化 + 配置页面管理"，环境变量降级保留。

## 安装

```bash
pnpm add moyan-mfw-base moyan-mfw-extension-sms
```

## 入口

| 入口 | 说明 |
|---|---|
| `moyan-mfw-extension-sms/backend` | SmsModule、SDK 层、配置管理层、服务层、DTO |
| `moyan-mfw-extension-sms/frontend` | `MfwSmsConfigPage` 短信配置页面组件 |
| `moyan-mfw-extension-sms/shared` | 常量、共享类型、权限标签 |

## 快速开始（后端）

```typescript
import { createBaseBackendApp } from 'moyan-mfw-base/backend';
import { SmsModule, SMS_EXTENSION_PERMISSION_VALUES } from 'moyan-mfw-extension-sms/backend';

await createBaseBackendApp({
  name: '业务后端',
  modules: [AppModule], // AppModule 内 imports: [SmsModule]
  permissionValues: [...SMS_EXTENSION_PERMISSION_VALUES],
});

// 配置管理接口自动挂载（配置页面调用）：
//   GET/PUT  /api/ext/sms/config/provider-setting
//   GET/PUT  /api/ext/sms/config/templates
//   DELETE   /api/ext/sms/config/templates/:id
```

业务方注入 Service 使用：

```typescript
// 发送验证码（模板需在配置页面或代码中注册）
const result = await smsCodeService.sendCode('13800138000', 'login_code');
// DEV_MODE=true 时 result.code 返回验证码（本地联调）

// 校验验证码（一次性使用，5 次失败锁定 5 分钟）
await smsCodeService.verifyCode('13800138000', '123456', 'login_code');

// 发通知短信（不经模板注册表，直接指定签名/模板）
await smsSdkService.send({
  phone: '13800138000',
  signName: '某某酒业',
  templateCode: 'SMS_509465234',
  templateParams: { orderNo: 'SO123' },
});

// 程序化注册模板（优先级高于配置页面）
smsTemplateService.register('order_notify', {
  signName: '某某酒业',
  templateCode: 'SMS_509465234',
  paramKeys: ['orderNo'],
});
```

## 配置说明

**凭证解析优先级**：配置页面（`ext_sms_provider_settings` 表）→ 环境变量（`SMS_ALIYUN_ACCESS_KEY_ID/SECRET`，降级 `OSS_ACCESS_KEY_ID/SECRET`）→ 报错。页面修改后即时生效（读取走缓存，保存即失效）。

**环境变量**：

| 变量 | 说明 |
|---|---|
| `SMS_PROVIDER` | 环境变量降级时的运营商选择（默认 aliyun） |
| `SMS_ALIYUN_ACCESS_KEY_ID/SECRET` | 阿里云短信专用凭证（降级用） |
| `OSS_ACCESS_KEY_ID/SECRET` | 二级降级（向后兼容） |
| `SMS_ALIYUN_SIGN_NAME` | 默认签名（降级用） |
| `DEV_MODE=true` | 跳过真实发送，验证码经接口返回（本地联调） |
| `CACHE_DRIVER` | 验证码存储/限流依赖，建议 `redis`（本地可 `memory`） |

**数据库迁移**：`database/migrations/20260816000000-sms-init.ts`（建 `ext_sms_provider_settings` + `ext_sms_templates` 两表）。

## 快速开始（前端）

```typescript
import { MfwSmsConfigPage } from 'moyan-mfw-extension-sms/frontend';
// 在 menu-trees.ts 中引用：
// { path: 'sms-config', name: '短信配置', icon: 'Message', component: MfwSmsConfigPage, permissions: ['编辑'] }
```

配置页面包含：运营商凭证表单（secret 脱敏展示、留空不改）+ 模板管理表格（scene/signName/templateCode/paramKeys CRUD）。

## 安全说明

- `GET provider-setting` 永不返回明文 Secret（仅尾 4 位）
- 保存时 Secret 留空表示保持已有值；首次配置必填
- 验证码：60s/次发送限流、180s 有效期、5 次校验失败锁定 5 分钟、校验通过即作废
