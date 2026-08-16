# 共享层（`moyan-mfw-base/shared`）

共享层提供**前后端同构**的字典框架与共享类型，可在 Node.js 与浏览器环境使用。

## 字典框架

装饰器式字典定义，自动注册 + 反射读取：

```typescript
import { DictMeta, DictEntry, toItems, getLabel, getMeta, toDescription, toDbItems, getAllDicts } from 'moyan-mfw-base/shared';

@DictMeta({ key: 'gender', label: '性别', module: 'user' })
export class GenderDict {
  @DictEntry({ label: '未知', type: 'info' })
  static UNKNOWN = 0;

  @DictEntry({ label: '男', type: 'primary' })
  static MALE = 1;

  @DictEntry({ label: '女', type: 'danger' })
  static FEMALE = 2;
}

toItems(GenderDict);        // [{ value: 0, label: '未知', type: 'info' }, ...]
getLabel(GenderDict, 1);    // '男'
getMeta(GenderDict);        // { key: 'gender', label: '性别', module: 'user' }
toDescription(GenderDict);  // '性别: 0=未知, 1=男, 2=女'
toDbItems(GenderDict);      // [{ value: 0, label: '未知' }, ...]（种子用）
getAllDicts();              // 全部已注册字典（含元数据）
```

### API

| API | 说明 |
|------|------|
| `@DictMeta({ key, label, module? })` | 类装饰器：声明字典元数据并注册 |
| `@DictEntry({ label, type? })` | 属性装饰器：声明字典项（值取静态属性值） |
| `toItems(cls)` | 字典项数组 `{ value, label, type? }` |
| `getLabel(cls, value)` | 值 → 标签（找不到返回 `--`） |
| `getMeta(cls)` | 元数据 |
| `toDescription(cls)` | 描述文本 |
| `toDbItems(cls)` | 种子数据格式 `{ value, label }[]` |
| `getAllDicts()` | 全局注册的所有字典 |

`DictItem.type`：`primary / success / warning / danger / info`（渲染标签颜色）。## 内置字典

| 字典类 | key | 项 |
|--------|-----|-----|
| `StatusDict` | status | 启用=1 / 禁用=0 |
| `BoolDict` | bool | 是=1 / 否=0 |
| `IsBuiltinDict` | is_builtin | 内置 / 非内置 |
| `IsOwnerDict` | is_owner | 拥有者 / 非拥有者 |
| `MultiAppEnabledDict` | multi_app_enabled | 支持多应用 / 不支持 |
| `PermissionTypeDict` | permission_type | 平台权限 PC / 普通权限 NORMAL |
| `NodeTypeDict` | node_type | 菜单 MENU / 页面 PAGE / 标签 TAG |
| `ShowModeDict` | show_mode | 正常 NORMAL / 开发者模式 DEV |
| `IsAutoSyncDict` / `IsVisibleDict` / `IsCacheDict` | — | 是否自动同步 / 可见 / 缓存 |
| `AuditModuleDict` | audit_module | 认证/用户/角色/权限/应用/应用类型/成员/系统/上传 |
| `GenderDict` | gender | 未知=0 / 男=1 / 女=2 |
| `DeveloperDict` | developer | 是 / 否 |

## 共享类型

`moyan-mfw-base/shared` 同时导出前端路由所需的纯数据类型：

```typescript
import type { AppTypeMenuConfig, MenuNode } from 'moyan-mfw-base/shared';
```

`MenuNode`：`path` / `name` / `icon?` / `hidden?` / `auth?` / `permissions?` / `permCode?` / `showMode?` / `children?`（纯数据，不含组件引用）。

`AppTypeMenuConfig`：`appTypeCode` / `roleCode` / `label` / `icon?` / `children`。

## 使用规范

1. 业务字典定义在共享层（`moyan-mfw-shared` 或本地 `shared/` 包），后端种子与前端下拉共用同一份定义。
2. 字典 key 全局唯一，避免与内置字典冲突（如自定义 `gender_custom`）。
3. `toItems` 结果可直接作为 `MfwDictFormat` 的 `dict` 与 `el-select` 的 `options`。
