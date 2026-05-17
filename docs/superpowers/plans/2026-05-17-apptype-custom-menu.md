# AppType 自定义菜单 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 AppType 实体添加 JSON 字段存储自定义菜单，登录选择应用后若 AppType 有自定义菜单则替换默认权限菜单渲染。

**Architecture:** 后端在 `getUserPermissions()` 中检测 AppType.customMenu，存在时用自定义菜单结构重建 menuTree（保留 DB 中的 permissionValue 等字段）。前端新增 CustomMenuEditor 组件供管理员编辑。

**Tech Stack:** NestJS + TypeORM + Vue 3 + Element Plus + TypeScript

---

## 文件结构

```
# 后端修改
packages/base/src/backend/src/modules/sys/app-type/entities/app-type.entity.ts  [修改] 添加 customMenu 字段
packages/base/src/backend/src/modules/sys/app-type/app-type.service.ts           [修改] 添加 CRUD 方法
packages/base/src/backend/src/modules/sys/app-type/app-type.controller.ts        [修改] 添加 REST 端点
packages/base/src/backend/src/modules/sys/app-type/dto/req/save-custom-menu.dto.ts [新建] 保存 DTO
packages/base/src/backend/src/modules/sys/auth/auth.service.ts                  [修改] getUserPermissions() 集成自定义菜单
packages/base/src/frontend/src/apis/sys/                                        [重新生成] 运行 api:build

# 前端新建
packages/base/src/frontend/src/components/business/custom-menu-editor/Index.vue [新建] 自定义菜单编辑器
packages/base/src/frontend/src/components/business/custom-menu-editor/types.ts  [新建] 类型定义

# 前端修改
packages/base/src/frontend/src/views/sys/app-type/AppTypeCard.vue                [修改] 添加按钮
packages/base/src/frontend/src/views/sys/app-type/Index.vue                      [修改] 处理事件
```

---

### Task 1: 后端 — AppType 实体添加 customMenu 字段 + 共享类型

**Files:**
- Modify: `packages/base/src/backend/src/modules/sys/app-type/entities/app-type.entity.ts`

- [ ] **Step 1: 添加 CustomMenuItem 类型定义和 customMenu 字段**

在 `app-type.entity.ts` 中 `sortOrder` 字段之后、类结束 `}` 之前添加：

```typescript
/**
 * 自定义菜单
 * @description JSON 结构，存在时替换默认权限菜单
 */
@Column({ type: 'json', nullable: true, comment: '自定义菜单树 - JSON 结构，存在时替换默认权限菜单' })
customMenu: CustomMenuItem[] | null;
```

同时在文件顶部（import 之后、@Entity 之前）添加接口定义：

```typescript
/** 自定义菜单节点 */
export interface CustomMenuItem {
  /** 权限编码 — 必须对应 sys_permissions 中的真实权限 */
  permCode: string;
  /** 菜单显示名称 */
  permName: string;
  /** 图标 */
  icon?: string;
  /** 路由路径 */
  routePath?: string;
  /** 排序 */
  sortOrder?: number;
  /** 子节点 */
  children?: CustomMenuItem[];
}
```

- [ ] **Step 2: 运行 typecheck 确认无类型错误**

```bash
pnpm typecheck:base-backend
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add customMenu JSON field to AppType entity"
```

---

### Task 2: 后端 — AppTypeService 添加自定义菜单 CRUD

**Files:**
- Create: `packages/base/src/backend/src/modules/sys/app-type/dto/req/save-custom-menu.dto.ts`
- Modify: `packages/base/src/backend/src/modules/sys/app-type/app-type.service.ts`

- [ ] **Step 1: 创建 DTO**

```typescript
/**
 * @fileoverview 保存自定义菜单 DTO
 * @description 保存应用类型的自定义菜单配置
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested, IsString, IsOptional, IsNumber, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class CustomMenuItemDto {
  @ApiProperty({ description: '权限编码' })
  @IsString()
  @IsNotEmpty()
  permCode: string;

  @ApiProperty({ description: '菜单名称' })
  @IsString()
  @IsNotEmpty()
  permName: string;

  @ApiProperty({ description: '图标', required: false })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiProperty({ description: '路由路径', required: false })
  @IsString()
  @IsOptional()
  routePath?: string;

  @ApiProperty({ description: '排序', required: false })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @ApiProperty({ description: '子节点', required: false, type: [CustomMenuItemDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CustomMenuItemDto)
  children?: CustomMenuItemDto[];
}

export class SaveCustomMenuDto {
  @ApiProperty({ description: '自定义菜单节点数组', type: [CustomMenuItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomMenuItemDto)
  data: CustomMenuItemDto[];
}
```

- [ ] **Step 2: 在 AppTypeService 添加方法**

```typescript
/**
 * 获取自定义菜单
 */
async getCustomMenu(appTypeId: string): Promise<CustomMenuItem[] | null> {
  const appType = await this.appTypeRepository.findOne({ where: { id: appTypeId } });
  if (!appType) throw new NotFoundError('应用类型');
  return appType.customMenu || null;
}

/**
 * 保存自定义菜单
 */
async saveCustomMenu(appTypeId: string, data: CustomMenuItem[]): Promise<AppType> {
  const appType = await this.appTypeRepository.findOne({ where: { id: appTypeId } });
  if (!appType) throw new NotFoundError('应用类型');
  appType.customMenu = data;
  return this.appTypeRepository.save(appType);
}

/**
 * 清空自定义菜单
 */
async clearCustomMenu(appTypeId: string): Promise<AppType> {
  const appType = await this.appTypeRepository.findOne({ where: { id: appTypeId } });
  if (!appType) throw new NotFoundError('应用类型');
  appType.customMenu = null;
  return this.appTypeRepository.save(appType);
}
```

需要添加 import:
```typescript
import { CustomMenuItem } from './entities/app-type.entity';
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add customMenu CRUD methods to AppTypeService"
```

---

### Task 3: 后端 — AppTypeController 添加 REST 端点

**Files:**
- Modify: `packages/base/src/backend/src/modules/sys/app-type/app-type.controller.ts`

- [ ] **Step 1: 添加三个端点**

在 `AppTypeController` 类中添加（在 `updateStatus` 方法之后、类结束之前）:

```typescript
/**
 * 获取自定义菜单
 */
@Get(':id/custom-menu')
@ApiOperation({ summary: '获取自定义菜单', description: '获取应用类型的自定义菜单配置' })
@ApiParam({ name: 'id', description: '应用类型 ID' })
@RequirePermission({ permCode: 'pc_root:sys:app-type' })
async getCustomMenu(@Param('id', ParseUUIDPipe) id: string) {
  const result = await this.appTypeService.getCustomMenu(id);
  return ApiResponseUtil.success(result, '查询成功');
}

/**
 * 保存自定义菜单
 */
@Put(':id/custom-menu')
@ApiOperation({ summary: '保存自定义菜单', description: '保存应用类型的自定义菜单配置' })
@ApiParam({ name: 'id', description: '应用类型 ID' })
@AuditLog({ module: AuditModule.APP_TYPE, event: 'UPDATE_CUSTOM_MENU', description: '更新自定义菜单' })
@RequirePermission({ permCode: 'pc_root:sys:app-type', permissionValue: ['编辑'] })
async saveCustomMenu(
  @Param('id', ParseUUIDPipe) id: string,
  @Body() dto: SaveCustomMenuDto,
) {
  const result = await this.appTypeService.saveCustomMenu(id, dto.data);
  return ApiResponseUtil.success(result, '保存成功');
}

/**
 * 清空自定义菜单
 */
@Delete(':id/custom-menu')
@HttpCode(HttpStatus.NO_CONTENT)
@ApiOperation({ summary: '清空自定义菜单', description: '清空应用类型的自定义菜单配置' })
@ApiParam({ name: 'id', description: '应用类型 ID' })
@AuditLog({ module: AuditModule.APP_TYPE, event: 'CLEAR_CUSTOM_MENU', description: '清空自定义菜单' })
@RequirePermission({ permCode: 'pc_root:sys:app-type', permissionValue: ['编辑'] })
async clearCustomMenu(@Param('id', ParseUUIDPipe) id: string) {
  await this.appTypeService.clearCustomMenu(id);
  return ApiResponseUtil.success(null, '清空成功');
}
```

添加 import:
```typescript
import { SaveCustomMenuDto } from './dto/req/save-custom-menu.dto';
```

- [ ] **Step 2: 检查 AuditModule 是否需要添加新枚举值**

查找 `AuditModule` 定义，确认 `APP_TYPE` 模块是否已支持 `UPDATE_CUSTOM_MENU` / `CLEAR_CUSTOM_MENU` 事件：

```bash
# 如果 AuditModule 没有这两个事件值，添加它们
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add customMenu REST endpoints to AppTypeController"
```

---

### Task 4: 后端 — auth.service.ts 集成自定义菜单

**Files:**
- Modify: `packages/base/src/backend/src/modules/sys/auth/auth.service.ts`

- [ ] **Step 1: 在 getUserPermissions() 中插入自定义菜单逻辑**

在 `auth.service.ts` 中，`getUserPermissions()` 方法的 `return` 语句之前（appTypeId 已获取后）添加：

```typescript
// 检测自定义菜单
const appTypeRepository = this.entityManager.getRepository(AppType);
const appType = await appTypeRepository.findOne({
  where: { id: appTypeId },
  select: ['id', 'customMenu'],
});

if (appType?.customMenu?.length) {
  // 构建 permCode → DB 节点映射
  const nodeMap = new Map<string, any>();
  for (const item of result) {
    nodeMap.set(item.permCode, item);
  }

  // 按自定义菜单结构重建 menuTree
  menuTree = buildCustomMenuTree(appType.customMenu, nodeMap);
}
```

在文件末尾（class 外部）添加辅助函数：

```typescript
/**
 * 根据自定义菜单结构重建菜单树
 */
function buildCustomMenuTree(
  customMenus: CustomMenuItem[],
  nodeMap: Map<string, any>,
): any[] {
  return customMenus
    .map((item) => {
      const dbNode = nodeMap.get(item.permCode);
      if (!dbNode) return null;
      return {
        ...dbNode,
        permName: item.permName,
        iconName: item.icon || dbNode.iconName,
        sortOrder: item.sortOrder ?? dbNode.sortOrder,
        children: item.children?.length
          ? buildCustomMenuTree(item.children, nodeMap)
          : dbNode.children || [],
      };
    })
    .filter(Boolean);
}
```

添加 import:
```typescript
import { CustomMenuItem } from '../app-type/entities/app-type.entity';
```

> **注意:** `AppType` 已在 `AuthModule` 的 `TypeOrmModule.forFeature` 中注册，可直接通过 `entityManager.getRepository(AppType)` 使用。

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: integrate customMenu into auth getUserPermissions"
```

---

### Task 5: 生成数据库迁移

- [ ] **Step 1: 生成迁移**

```bash
cd packages/base && pnpm migration:generate AddCustomMenuToAppType
```

- [ ] **Step 2: 检查生成的迁移文件**

确认 SQL 包含 `ALTER TABLE sys_app_types ADD COLUMN custom_menu json NULL COMMENT '自定义菜单树'`

- [ ] **Step 3: 运行迁移**

```bash
pnpm migration:run
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "chore: add customMenu migration for sys_app_types"
```

---

### Task 6: 前端 — 生成 API 客户端

- [ ] **Step 1: 运行 API 生成**

```bash
cd packages/base/src/frontend && node api.build.cjs
```

（或使用 `pnpm api:build`）

- [ ] **Step 2: 验证生成的 API**

检查 `packages/base/src/frontend/src/apis/sys/index.ts` 中是否包含 `ApiAppTypeGetCustomMenu`、`ApiAppTypeSaveCustomMenu`、`ApiAppTypeClearCustomMenu`。

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "chore: regenerate frontend API client with customMenu endpoints"
```

---

### Task 7: 前端 — CustomMenuEditor 组件（核心）

**Files:**
- Create: `packages/base/src/frontend/src/components/business/custom-menu-editor/types.ts`
- Create: `packages/base/src/frontend/src/components/business/custom-menu-editor/Index.vue`
- Modify: `packages/base/src/frontend/src/components/business/index.ts`（如存在导出文件）

**参考:** `e:\YunYi\网约车自选小程序\代码\admin\src\view\system\customMenu\index.vue`

- [ ] **Step 1: 创建类型定义 `types.ts`**

```typescript
/** 自定义菜单节点（前端使用） */
export interface CustomMenuNode {
  permCode: string;
  permName: string;
  icon?: string;
  routePath?: string;
  sortOrder?: number;
  children?: CustomMenuNode[];
  /** 前端编辑状态 */
  editTitle?: boolean;
  old_title?: string;
  is_change?: boolean;
  is_new?: boolean;
}
```

- [ ] **Step 2: 创建 Index.vue — 左：默认菜单树（只读）**

```
自定义菜单编辑器布局：
┌──────────────────────────────────────────────────────┐
│ Header: [保存] [重置] [清空自定义]                    │
├──────────────────────┬───────────────────────────────┤
│ 默认菜单结构（只读）   │ 自定义菜单结构（可编辑）       │
│ el-tree              │ el-tree draggable             │
│  - 显示所有权限节点    │  - 拖拽排序                   │
│                      │  - 点击名称编辑                │
│                      │  - 点击图标更换                │
│                      │  - 添加/删除节点               │
│                      │  - 从默认菜单选择节点添加       │
└──────────────────────┴───────────────────────────────┘
```

**实现要点：**
- 左侧：从 `GET /app-types/:id/permission-pool` 获取权限树作默认参考
- 右侧：编辑中的自定义菜单树（`el-tree` + `draggable`）
- 添加节点：弹出选择框从默认菜单树中选取已有权限（避免自由输入 permCode）
- 编辑名称：点击节点名称 → 显示 input → 失焦确认
- 编辑图标：弹出 IconPicker
- 删除：ElMessageBox.confirm 确认后移除
- 重置：复制默认菜单结构
- 保存：调用 `PUT /app-types/:id/custom-menu`
- 清空：调用 `DELETE /app-types/:id/custom-menu`
- `defineExpose({ onConfirm })` 通过 MfwPopup 集成

**组件 props:**
```typescript
defineProps<{
  appTypeId: string;
}>();
```

- [ ] **Step 3: 确保 MfwPopup 集成模式**

组件使用 `defineExpose({ onConfirm })` 暴露确认方法：

```typescript
const onConfirm = async () => {
  await new ApiAppTypeSaveCustomMenu({
    params: { id: props.appTypeId },
    body: { data: customMenus.value },
    option: { hintSuccess: true },
  });
  return true;
};

defineExpose({ onConfirm });
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: add CustomMenuEditor component for app-type"
```

---

### Task 8: 前端 — AppTypeCard 添加"自定义菜单"按钮

**Files:**
- Modify: `packages/base/src/frontend/src/views/sys/app-type/AppTypeCard.vue`

- [ ] **Step 1: 添加按钮**

在 `__actions` div 中，角色按钮之后添加：

```vue
<el-button size="small" type="warning" plain data-testid="app-type-menu-btn" v-permission="{ value: ['menu'] }" @click="$emit('customMenu', data)">菜单</el-button>
```

- [ ] **Step 2: 添加 emit 声明**

在 `defineEmits` 中添加 `'customMenu'` 事件：

```typescript
(e: 'customMenu', data: AppTypeResponseDto): void;
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add custom menu button to AppTypeCard"
```

---

### Task 9: 前端 — Index.vue 处理自定义菜单事件

**Files:**
- Modify: `packages/base/src/frontend/src/views/sys/app-type/Index.vue`

- [ ] **Step 1: 导入 CustomMenuEditor 并添加事件处理**

在模板 `AppTypeCard` 上添加 `@customMenu` 事件：

```vue
<AppTypeCard :data="item" @edit="handleEdit" @permission="handleConfigPermissionPool"
  @role="handleConfigBuiltinRoles" @customMenu="handleCustomMenu" />
```

添加处理函数：

```typescript
import { CustomMenuEditor } from '../../../components/business/custom-menu-editor/Index.vue';

const handleCustomMenu = (row: AppTypeResponseDto) => {
  if (!row.id) {
    ElMessage.warning('请先保存应用类型');
    return;
  }
  MfwPopup.open({
    title: `自定义菜单 — ${row.typeName}`,
    type: 'drawer',
    position: 'rtl',
    component: CustomMenuEditor,
    data: { appTypeId: row.id },
    popupProps: { size: '90%' },
  });
};
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: wire CustomMenuEditor into AppType index page"
```

---

### Task 10: 类型检查 & 验证

- [ ] **Step 1: 运行全量类型检查**

```bash
pnpm typecheck
```

确保零错误。

- [ ] **Step 2: 检查后端编译**

```bash
cd packages/base && pnpm build
```

- [ ] **Step 3: 提交最终修复**

```bash
git add -A && git commit -m "chore: fix type errors after customMenu implementation"
```
