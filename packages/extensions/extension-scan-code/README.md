# moyan-mfw-extension-scan-code

MFW 扫码扩展包：通用二维码内容生成/解析/核销基础设施 + 码生成策略配置入库（页面管理）。

自实际项目 `libs/scan-code` 迁移升级：新增配置表 `ext_scan_code_settings`（页面管理码格式与场景白名单），表名统一 `ext_` 前缀，主键列宽放宽到 32 支持自定义格式。

## 安装

```bash
pnpm add moyan-mfw-base moyan-mfw-extension-scan-code
```

## 入口

| 入口 | 说明 |
|---|---|
| `moyan-mfw-extension-scan-code/backend` | ScanCodeModule、纯 TS 层、实体、配置管理层、服务层、DTO |
| `moyan-mfw-extension-scan-code/frontend` | `MfwScanCodeConfigPage` 扫码配置页面组件 |
| `moyan-mfw-extension-scan-code/shared` | 常量、共享类型、权限标签 |

## 快速开始（后端）

```typescript
import { createBaseBackendApp } from 'moyan-mfw-base/backend';
import { ScanCodeModule, SCAN_CODE_EXTENSION_PERMISSION_VALUES } from 'moyan-mfw-extension-scan-code/backend';

await createBaseBackendApp({
  name: '业务后端',
  modules: [AppModule], // AppModule 内 imports: [ScanCodeModule]
  permissionValues: [...SCAN_CODE_EXTENSION_PERMISSION_VALUES],
});

// 配置管理接口自动挂载（配置页面调用）：
//   GET/PUT  /api/ext/scan-code/config/settings
```

业务方注入 ScanCodeService 使用（扩展包不暴露生成/解析/核销 HTTP 接口）：

```typescript
// 生成（码格式/场景白名单来自配置页面）
const { code } = await scanCodeService.generate({
  type: ScanCodeType.SINGLE_USE,
  scene: 'gift',
  data: { userId: 'u-123', batchNo: 'B2026' },
  indexFields: ['userId'], // 写扩展表支持 findByDataField 高效查询
});

// 解析（自动懒标记过期）
const record = await scanCodeService.parse(code);

// 核销（单次码条件更新防并发重复核销）
const used = await scanCodeService.use(code, operatorId, storeId?);

// 按业务字段查询（走扩展表索引）
const records = await scanCodeService.findByDataField('userId', 'u-123');

// 事务内生成/更新（与其他业务表同事务）
await scanCodeService.generateInTransaction(manager, options);
await scanCodeService.updateDataInTransaction(manager, code, { status: 'issued' });
```

## 核心设计

- **code = id**：二维码内容直接是主键，扫码后 `WHERE id = code` 查询
- **单次/多次**：`type` 1=可多次使用（累加 usedCount）、2=只允许一次（条件更新 `WHERE status=ACTIVE` 防并发重复核销）
- **JSON + 扩展表**：`data` 存完整业务数据，`indexFields` 拆行入 `ext_scan_code_data` 建索引
- **懒加载过期**：无定时任务，parse/use 时现查现改状态

## 配置说明（配置页面管理）

`ext_scan_code_settings` 单行配置：

| 配置项 | 约束 | 默认 |
|---|---|---|
| groupCount 分组数 | 2~5 | 3 |
| groupLength 每组字符数 | 3~5 | 4 |
| separator 分隔符 | ≤2 字符（空=不分隔） | `-` |
| charset 字符集 | A-Z1-9（排除0防混淆）/ A-Z0-9 | A-Z1-9 |
| scenes 场景白名单 | null/空=不限制 | 不限制 |

约束：码内容总长度（分组字符 + 分隔符）≤ 32 字符；修改策略只影响新生成的码。

**数据库迁移**：`database/migrations/20260816000000-scan-code-init.ts`（建 `ext_scan_code_records` / `ext_scan_code_data` / `ext_scan_code_settings` 三表）。

## 快速开始（前端）

```typescript
import { MfwScanCodeConfigPage } from 'moyan-mfw-extension-scan-code/frontend';
// 在 menu-trees.ts 中引用：
// { path: 'scan-code-config', name: '扫码配置', icon: 'FullScreen', component: MfwScanCodeConfigPage, permissions: ['编辑'] }
```

配置页面包含：生成策略表单（含示例码实时预览）+ 场景白名单 tag 编辑。
