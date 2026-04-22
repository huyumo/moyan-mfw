# 应用类型管理页面卡片布局重构实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重构 sys/app-type 页面，将表格分页布局改为卡片网格布局，提升用户体验。

**Architecture:** 使用现有 MfwCardListPage 组件实现卡片网格布局，创建独立的卡片组件（AppTypeCard、RoleCard）封装卡片渲染逻辑，保持现有弹窗组件不变。

**Tech Stack:** Vue 3 + TypeScript + Element Plus + SCSS

---

## 文件结构

| 文件 | 操作 | 说明 |
|-----|-----|-----|
| `packages/base-frontend/src/views/sys/app-type/Index.vue` | 重写 | 主页面，使用 MfwCardListPage |
| `packages/base-frontend/src/views/sys/app-type/AppTypeCard.vue` | 新增 | 应用类型卡片组件 |
| `packages/base-frontend/src/components/business/builtin-role-dialog/Index.vue` | 重写 | 内置角色弹窗，改为卡片布局 |
| `packages/base-frontend/src/components/business/builtin-role-dialog/RoleCard.vue` | 新增 | 内置角色卡片组件 |

---

### Task 0: 添加 MfwCardListPage 组件导出（前置任务）

**Files:**
- Modify: `packages/base-frontend/src/components/index.ts`

- [ ] **Step 1: 在 components/index.ts 中添加 MfwCardListPage 导出**

在 `export * from './page/list-page/mod';` 之后添加导出语句：

```typescript
export * from './page/card-list-page/mod';
```

修改后的文件内容：

```typescript
// 页面类组件
export * from './page/page-wrapper/mod';
export * from './page/list-page/mod';
export * from './page/card-list-page/mod';

// 选择器类组件
export * from './picker/mod';
```

- [ ] **Step 2: 验证导出成功**

检查文件是否正确修改。

---

### Task 1: 创建应用类型卡片组件 AppTypeCard.vue

**Files:**
- Create: `packages/base-frontend/src/views/sys/app-type/AppTypeCard.vue`

- [ ] **Step 1: 创建 AppTypeCard.vue 文件**

创建卡片组件，包含以下内容：
- 头部：图标 + 类型名称 + 类型编码
- 主体：类型描述 + 状态标签 + 多应用标签
- 底部：内置角色数量 + 操作按钮

```vue
<!--
/**
 * @fileoverview 应用类型卡片组件
 * @description 用于应用类型管理页面的卡片展示
 */
-->
<template>
  <div class="app-type-card">
    <div class="app-type-card__header">
      <div class="app-type-card__icon">
        <span class="icon-text">{{ data.icon || '📊' }}</span>
      </div>
      <div class="app-type-card__title-area">
        <h3 class="app-type-card__title">{{ data.typeName }}</h3>
        <span class="app-type-card__code">{{ data.typeCode }}</span>
      </div>
    </div>
    
    <div class="app-type-card__body">
      <p class="app-type-card__desc">{{ data.typeDesc || '暂无描述' }}</p>
      <div class="app-type-card__tags">
        <el-tag :type="data.typeStatus === STATUS.ENABLED ? 'success' : 'danger'" size="small">
          {{ data.typeStatus === STATUS.ENABLED ? '启用' : '禁用' }}
        </el-tag>
        <el-tag :type="data.multiAppEnabled === STATUS.ENABLED ? 'primary' : 'info'" size="small">
          {{ data.multiAppEnabled === STATUS.ENABLED ? '多应用' : '单应用' }}
        </el-tag>
      </div>
    </div>
    
    <div class="app-type-card__footer">
      <span class="app-type-card__meta">{{ roleCount }} 个内置角色</span>
      <div class="app-type-card__actions">
        <el-button type="primary" size="small" @click="$emit('edit', data)">编辑</el-button>
        <el-button size="small" @click="$emit('permission', data)">权限池</el-button>
        <el-button size="small" @click="$emit('role', data)">内置角色</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ApiRoleFindAll } from '../../../apis/sys';
import type { AppTypeResponseDto } from '../../../apis/sys/schemas';

const STATUS = {
  ENABLED: 1,
  DISABLED: 0,
} as const;

defineOptions({ name: 'AppTypeCard' });

const props = defineProps<{
  data: AppTypeResponseDto;
}>();

defineEmits<{
  (e: 'edit', data: AppTypeResponseDto): void;
  (e: 'permission', data: AppTypeResponseDto): void;
  (e: 'role', data: AppTypeResponseDto): void;
}>();

const roleCount = ref(0);

const loadRoleCount = async () => {
  if (!props.data.id) return;
  try {
    const result = await new ApiRoleFindAll({
      query: { page: 1, pageSize: 1, appTypeId: props.data.id }
    });
    roleCount.value = result.total || 0;
  } catch {
    roleCount.value = 0;
  }
};

onMounted(() => {
  loadRoleCount();
});
</script>

<style scoped lang="scss">
.app-type-card {
  background: var(--el-bg-color);
  border-radius: 12px;
  padding: 20px;
  box-shadow: var(--el-box-shadow-light);
  border: 1px solid var(--el-border-color);
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;

  &:hover {
    box-shadow: var(--el-box-shadow);
    transform: translateY(-2px);
  }

  &__header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }

  &__icon {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #409eff, #67c23a);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .icon-text {
      font-size: 24px;
      color: white;
    }
  }

  &__title-area {
    flex: 1;
  }

  &__title {
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin: 0 0 4px 0;
  }

  &__code {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  &__body {
    flex: 1;
    margin-bottom: 16px;
  }

  &__desc {
    font-size: 14px;
    color: var(--el-text-color-regular);
    line-height: 1.5;
    margin: 0 0 12px 0;
  }

  &__tags {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  &__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 16px;
    border-top: 1px solid var(--el-border-color-lighter);
  }

  &__meta {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  &__actions {
    display: flex;
    gap: 8px;
  }
}
</style>
```

- [ ] **Step 2: 验证组件创建成功**

检查文件是否存在且内容正确。

---

### Task 2: 重写应用类型管理页面 Index.vue

**Files:**
- Modify: `packages/base-frontend/src/views/sys/app-type/Index.vue`

- [ ] **Step 1: 重写 Index.vue 文件**

将原有的 MfwListPage 改为 MfwCardListPage，移除搜索和分页功能。

```vue
<!--
/**
 * @fileoverview 应用类型管理页面
 * @description 使用卡片网格布局展示应用类型列表
 */
-->
<template>
  <MfwPageWrapper>
    <template #header-extra>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新增类型
      </el-button>
    </template>

    <MfwCardListPage
      ref="cardListPage"
      :show-search="false"
      :show-pagination="false"
      :load-data="loadData"
      render-mode="card"
      :card-grid="{ cols: 4, gap: 20 }"
      empty-text="暂无应用类型"
    >
      <template #card-item="{ item }">
        <AppTypeCard
          :data="item"
          @edit="handleEdit"
          @permission="handleConfigPermissionPool"
          @role="handleConfigBuiltinRoles"
        />
      </template>
    </MfwCardListPage>
  </MfwPageWrapper>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { MfwPageWrapper, MfwCardListPage } from '../../../components';
import type { MfwCardListPageInstance } from '../../../components/page/card-list-page/types';
import { MfwPopup } from '../../../components/feedback';
import { ApiAppTypeFindAllList } from '../../../apis/sys';
import type { AppTypeResponseDto } from '../../../apis/sys/schemas';
import AppTypeCard from './AppTypeCard.vue';
import EditForm from './EditForm.vue';
import AddForm from './AddForm.vue';
import { PermissionPoolPanel } from '../../../components/business/permission-pool-panel';
import { BuiltinRoleDialog } from '../../../components/business/builtin-role-dialog/mod';

defineOptions({ name: 'MfwAppTypeList' });

const cardListPage = ref<MfwCardListPageInstance>();

const loadData = async () => {
  try {
    const result = await new ApiAppTypeFindAllList({});
    return {
      list: result || [],
      total: result?.length || 0,
    };
  } catch (error) {
    ElMessage.error('加载应用类型列表失败');
    return { list: [], total: 0 };
  }
};

const handleAdd = () => {
  MfwPopup.open({
    title: '新增应用类型',
    type: 'dialog',
    component: AddForm,
    popupProps: { width: 500 },
    on: {
      confirm: () => {
        ElMessage.success('创建成功');
        cardListPage.value?.refresh();
      },
    },
  });
};

const handleEdit = (row: AppTypeResponseDto) => {
  MfwPopup.open({
    title: '编辑应用类型',
    type: 'drawer',
    position: 'rtl',
    component: EditForm,
    data: { ...row },
    popupProps: { size: 400 },
    on: {
      confirm: () => {
        ElMessage.success('保存成功');
        cardListPage.value?.refresh();
      },
    },
  });
};

const handleConfigPermissionPool = (row: AppTypeResponseDto) => {
  if (!row.id) {
    ElMessage.warning('请先保存应用类型');
    return;
  }
  MfwPopup.open({
    title: '配置权限池',
    type: 'dialog',
    component: PermissionPoolPanel,
    data: { appTypeId: row.id },
    popupProps: {
      size: '800px',
      top: '10vh',
    },
    footer: {
      cancelText: '关闭',
      confirmText: '保存',
    },
    on: {
      confirm: () => {
        ElMessage.success('保存成功');
      },
    },
  });
};

const handleConfigBuiltinRoles = (row: AppTypeResponseDto) => {
  if (!row.id) {
    ElMessage.warning('请先保存应用类型');
    return;
  }
  MfwPopup.open({
    title: '配置内置角色',
    type: 'dialog',
    component: BuiltinRoleDialog,
    data: { appTypeId: row.id, typeName: row.typeName },
    popupProps: {
      size: '800px',
      top: '10vh',
    },
  });
};
</script>
```

- [ ] **Step 2: 验证页面重写成功**

检查文件内容是否正确，导入是否完整。

---

### Task 3: 创建内置角色卡片组件 RoleCard.vue

**Files:**
- Create: `packages/base-frontend/src/components/business/builtin-role-dialog/RoleCard.vue`

- [ ] **Step 1: 创建 RoleCard.vue 文件**

创建角色卡片组件，包含以下内容：
- 头部：角色图标 + 角色名称
- 主体：角色编码 + 角色描述 + 状态标签
- 底部：操作按钮（配置权限、编辑、删除）

```vue
<!--
/**
 * @fileoverview 内置角色卡片组件
 * @description 用于内置角色管理弹窗的卡片展示
 */
-->
<template>
  <div class="role-card">
    <div class="role-card__header">
      <div class="role-card__icon">
        <el-icon :size="20"><User /></el-icon>
      </div>
      <span class="role-card__name">{{ data.roleName }}</span>
    </div>
    
    <div class="role-card__body">
      <div class="role-card__code">{{ data.roleCode }}</div>
      <p class="role-card__desc">{{ data.roleDesc || '暂无描述' }}</p>
      <el-tag :type="data.roleStatus === STATUS.ENABLED ? 'success' : 'danger'" size="small">
        {{ data.roleStatus === STATUS.ENABLED ? '启用' : '禁用' }}
      </el-tag>
    </div>
    
    <div class="role-card__footer">
      <el-button type="primary" size="small" link @click="$emit('permission', data)">配置权限</el-button>
      <el-button size="small" link @click="$emit('edit', data)">编辑</el-button>
      <el-button type="danger" size="small" link @click="$emit('delete', data)">删除</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { User } from '@element-plus/icons-vue';
import type { RoleResponseDto } from '../../../apis/sys/schemas';

const STATUS = {
  ENABLED: 1,
  DISABLED: 0,
} as const;

defineOptions({ name: 'RoleCard' });

defineProps<{
  data: RoleResponseDto;
}>();

defineEmits<{
  (e: 'permission', data: RoleResponseDto): void;
  (e: 'edit', data: RoleResponseDto): void;
  (e: 'delete', data: RoleResponseDto): void;
}>();
</script>

<style scoped lang="scss">
.role-card {
  background: var(--el-bg-color);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid var(--el-border-color);
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--el-color-primary);
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
  }

  &__header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  &__icon {
    width: 32px;
    height: 32px;
    background: var(--el-color-primary-light-9);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--el-color-primary);
  }

  &__name {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__body {
    margin-bottom: 12px;
  }

  &__code {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-bottom: 8px;
  }

  &__desc {
    font-size: 13px;
    color: var(--el-text-color-regular);
    line-height: 1.4;
    margin: 0 0 8px 0;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding-top: 12px;
    border-top: 1px solid var(--el-border-color-lighter);
  }
}
</style>
```

- [ ] **Step 2: 验证组件创建成功**

检查文件是否存在且内容正确。

---

### Task 4: 重写内置角色管理弹窗 Index.vue

**Files:**
- Modify: `packages/base-frontend/src/components/business/builtin-role-dialog/Index.vue`

- [ ] **Step 1: 重写 Index.vue 文件**

将原有的 MfwTableList 改为卡片网格布局。

```vue
<!--
/**
 * @fileoverview 内置角色配置弹窗组件
 * @description 使用卡片网格布局展示内置角色列表
 */
-->
<template>
  <div class="builtin-role-dialog">
    <el-alert title="内置角色说明" type="info" :closable="false" show-icon class="mb-4">
      <p>内置角色是与应用类型绑定的预设角色，创建应用实例时自动继承。</p>
    </el-alert>
    
    <div class="builtin-role-header">
      <span class="builtin-role-title">{{ typeName }} - 内置角色</span>
      <el-button type="primary" size="small" @click="handleAddRole">新增角色</el-button>
    </div>
    
    <div v-loading="loading" class="builtin-role-grid">
      <RoleCard
        v-for="role in roleList"
        :key="role.id"
        :data="role"
        @permission="handleAssignPermissions"
        @edit="handleEditRole"
        @delete="handleDeleteRole"
      />
      <el-empty v-if="!loading && roleList.length === 0" description="暂无内置角色" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { MfwPopup } from '../../feedback';
import { ApiRoleFindAll, ApiRoleDelete } from '../../../apis/sys';
import type { RoleResponseDto } from '../../../apis/sys/schemas';
import { RolePermissionPanel } from '../role-permission-panel';
import { RoleForm } from '..';
import RoleCard from './RoleCard.vue';

defineOptions({ name: 'BuiltinRoleDialog' });

const props = defineProps<{
  appTypeId: string;
  typeName?: string;
}>();

const typeName = props.typeName || '应用类型';
const roleList = ref<RoleResponseDto[]>([]);
const loading = ref(false);

const loadRoles = async () => {
  if (!props.appTypeId) return;
  loading.value = true;
  try {
    const result = await new ApiRoleFindAll({
      query: {
        page: 1,
        pageSize: 100,
        appTypeId: props.appTypeId,
      }
    });
    roleList.value = result.list || [];
  } catch (error) {
    ElMessage.error('加载内置角色失败');
    roleList.value = [];
  } finally {
    loading.value = false;
  }
};

const handleAssignPermissions = (row: RoleResponseDto) => {
  MfwPopup.open({
    title: `配置角色权限 - ${row.roleName}`,
    type: 'dialog',
    component: RolePermissionPanel,
    data: {
      roleId: row.id,
      appTypeId: props.appTypeId,
    },
    popupProps: {
      size: '800px',
      top: '10vh',
    },
    footer: {
      cancelText: '关闭',
      confirmText: '保存',
    },
    on: {
      confirm: () => {
        ElMessage.success('权限配置成功');
        loadRoles();
      },
    },
  });
};

const handleAddRole = () => {
  MfwPopup.open({
    title: '新增内置角色',
    type: 'dialog',
    component: RoleForm,
    data: { appTypeId: props.appTypeId },
    popupProps: {
      size: '500px',
    },
    footer: {
      cancelText: '取消',
      confirmText: '确定',
    },
    on: {
      confirm: () => {
        loadRoles();
      },
    },
  });
};

const handleEditRole = (row: RoleResponseDto) => {
  MfwPopup.open({
    title: '编辑内置角色',
    type: 'dialog',
    component: RoleForm,
    data: { id: row.id, role: row, appTypeId: props.appTypeId },
    popupProps: {
      size: '500px',
    },
    footer: {
      cancelText: '取消',
      confirmText: '确定',
    },
    on: {
      confirm: () => {
        loadRoles();
      },
    },
  });
};

const handleDeleteRole = async (row: RoleResponseDto) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除角色「${row.roleName}」吗？`,
      '确认删除',
      { type: 'warning' }
    );
    await new ApiRoleDelete({ params: { id: row.id } });
    ElMessage.success('删除成功');
    loadRoles();
  } catch {
    // 用户取消或删除失败
  }
};

onMounted(() => {
  loadRoles();
});
</script>

<style scoped lang="scss">
.builtin-role-dialog {
  min-height: 400px;
  display: flex;
  flex-direction: column;

  .mb-4 {
    margin-bottom: 16px;
  }

  .builtin-role-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .builtin-role-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .builtin-role-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 12px;
    flex: 1;
  }
}
</style>
```

- [ ] **Step 2: 验证弹窗重写成功**

检查文件内容是否正确，导入是否完整。

---

### Task 5: 验证和测试

**Files:**
- Verify: 所有修改的文件

- [ ] **Step 1: 检查 TypeScript 类型错误**

运行类型检查命令，确保没有类型错误。

```bash
cd packages/base-frontend
npm run typecheck
```

Expected: 无类型错误

- [ ] **Step 2: 检查 lint 错误**

运行 lint 检查命令，确保没有 lint 错误。

```bash
cd packages/base-frontend
npm run lint
```

Expected: 无 lint 错误

- [ ] **Step 3: 启动开发服务器验证页面**

启动前端开发服务器，在浏览器中验证页面功能。

```bash
cd packages/base-frontend
npm run dev
```

Expected: 页面正常显示，卡片布局正确，所有功能正常工作

---

### Task 6: 提交代码

- [ ] **Step 1: 提交所有变更**

```bash
git add packages/base-frontend/src/components/index.ts
git add packages/base-frontend/src/views/sys/app-type/Index.vue
git add packages/base-frontend/src/views/sys/app-type/AppTypeCard.vue
git add packages/base-frontend/src/components/business/builtin-role-dialog/Index.vue
git add packages/base-frontend/src/components/business/builtin-role-dialog/RoleCard.vue
git commit -m "feat(app-type): 重构应用类型管理页面为卡片布局

- 使用 MfwCardListPage 替换 MfwListPage
- 移除搜索和分页功能
- 新增 AppTypeCard 卡片组件
- 重构内置角色弹窗为卡片布局
- 新增 RoleCard 卡片组件
- 添加 MfwCardListPage 组件导出"
```

Expected: 提交成功