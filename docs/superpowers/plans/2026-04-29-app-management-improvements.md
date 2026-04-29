# 应用管理页面改进实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 改进应用管理页面，包括Logo位置调整、回显修复、详情卡片化、通用组件封装

**Architecture:** 创建 MfwProfileCard 通用卡片组件，参考 profile-panel.vue 样式；修复 AppForm.vue Logo回显问题；调整Logo位置至表单首位；改造 AppDetail.vue 使用卡片组件

**Tech Stack:** Vue 3 + TypeScript + Element Plus + SCSS

---

## 文件结构

| 文件 | 操作 | 说明 |
|------|------|------|
| `components/display/mfw-profile-card/index.ts` | 新建 | 组件入口 |
| `components/display/mfw-profile-card/mfw-profile-card.vue` | 新建 | 组件实现 |
| `components/display/mfw-profile-card/types.ts` | 新建 | 类型定义 |
| `components/display/mfw-profile-card/style.scss` | 新建 | 组件样式 |
| `components/display/mod.ts` | 修改 | 注册组件 |
| `views/sys/app/AppForm.vue` | 修改 | Logo位置调整+回显修复 |
| `views/sys/app/AppDetail.vue` | 修改 | 使用卡片组件 |

---

### Task 1: 创建 MfwProfileCard 类型定义

**Files:**
- Create: `packages/base-frontend/src/components/display/mfw-profile-card/types.ts`

- [ ] **Step 1: 创建类型定义文件**

```typescript
import type { Component } from 'vue';

export interface ProfileCardHeader {
  image?: { src: string; width?: number; height?: number } | string;
  title: string;
  subtitle?: string;
  status?: {
    value: string | number;
    type?: 'success' | 'warning' | 'danger' | 'info';
    text?: string;
  };
  avatarSize?: number;
  gradient?: boolean;
}

export interface ProfileCardItem {
  key: string;
  label: string;
  icon?: Component;
  format?: 'text' | 'date' | 'image' | 'dict' | 'tag' | 'custom';
  formatOptions?: Record<string, any>;
  span?: number;
}

export interface ProfileCardProps {
  header: ProfileCardHeader;
  items: ProfileCardItem[];
  data: Record<string, any>;
  bordered?: boolean;
  loading?: boolean;
  emptyText?: string;
}
```

- [ ] **Step 2: 验证类型定义**

运行: `cd packages/base-frontend && npm run typecheck`
预期: 无类型错误

---

### Task 2: 创建 MfwProfileCard 组件样式

**Files:**
- Create: `packages/base-frontend/src/components/display/mfw-profile-card/style.scss`

- [ ] **Step 1: 创建样式文件**

```scss
.mfw-profile-card {
  padding: 20px;
  background: var(--el-bg-color);
  border-radius: 12px;

  &.bordered {
    border: 1px solid var(--el-border-color-lighter);
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  margin-bottom: 16px;
}

.card-avatar {
  background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  border-radius: 8px;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.card-header-info {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.card-subtitle {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.card-status {
  display: flex;
  align-items: center;
  gap: 4px;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.row-icon {
  width: 16px;
  height: 16px;
  color: var(--el-text-color-secondary);
}

.row-label {
  width: 70px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.row-value {
  flex: 1;
  font-size: 14px;
  color: var(--el-text-color-primary);
  font-weight: 500;
}

.card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 20px;
}
```

---

### Task 3: 创建 MfwProfileCard 组件实现

**Files:**
- Create: `packages/base-frontend/src/components/display/mfw-profile-card/mfw-profile-card.vue`

- [ ] **Step 1: 创建组件文件**

```vue
<template>
  <div class="mfw-profile-card" :class="{ bordered: bordered }">
    <div class="card-header">
      <div 
        class="card-avatar" 
        :style="{ width: avatarSizePx, height: avatarSizePx }"
      >
        <img 
          v-if="imageSrc" 
          :src="imageSrc" 
          :alt="header.title"
        />
        <span v-else>{{ header.title?.charAt(0) }}</span>
      </div>
      <div class="card-header-info">
        <div>
          <span class="card-title">{{ header.title }}</span>
          <span v-if="header.subtitle" class="card-subtitle">{{ header.subtitle }}</span>
        </div>
        <div class="card-status">
          <el-tag 
            v-if="header.status" 
            :type="header.status.type || 'success'" 
            size="small"
          >
            {{ header.status.text || header.status.value }}
          </el-tag>
        </div>
      </div>
    </div>

    <div class="info-list">
      <div 
        v-for="item in items" 
        :key="item.key" 
        class="info-row"
      >
        <el-icon v-if="item.icon" class="row-icon">
          <component :is="item.icon" />
        </el-icon>
        <span class="row-label">{{ item.label }}</span>
        <span class="row-value">
          <slot 
            :name="item.key" 
            :value="getValue(item.key)" 
            :item="item" 
            :data="data"
          >
            {{ formatValue(item) }}
          </slot>
        </span>
      </div>
    </div>

    <slot name="extra" :data="data" />

    <div v-if="$slots.actions" class="card-actions">
      <slot name="actions" :data="data" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ProfileCardProps, ProfileCardItem } from './types';

const props = withDefaults(defineProps<ProfileCardProps>(), {
  bordered: false,
  loading: false,
  emptyText: '--',
});

defineOptions({ name: 'MfwProfileCard' });

const avatarSizePx = computed(() => {
  const size = props.header.avatarSize || 48;
  return `${size}px`;
});

const imageSrc = computed(() => {
  const image = props.header.image;
  if (!image) return undefined;
  return typeof image === 'string' ? image : image.src;
});

const getValue = (key: string): any => {
  return props.data?.[key];
};

const formatValue = (item: ProfileCardItem): string => {
  const value = getValue(item.key);
  if (value === null || value === undefined || value === '') {
    return props.emptyText;
  }

  switch (item.format) {
    case 'date':
      if (!value) return props.emptyText;
      const d = new Date(value);
      if (isNaN(d.getTime())) return value;
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    case 'dict':
      const dict = item.formatOptions?.dict || [];
      const found = dict.find((d: any) => d.value === value);
      return found?.label || props.emptyText;
    case 'tag':
      return value;
    case 'image':
      return typeof value === 'string' ? value : value?.src || props.emptyText;
    case 'custom':
      return String(value);
    default:
      if (typeof value === 'object') {
        return value?.name || value?.typeName || value?.nickname || value?.username || props.emptyText;
      }
      return String(value);
  }
};
</script>

<style scoped lang="scss">
@import './style.scss';
</style>
```

---

### Task 4: 创建 MfwProfileCard 组件入口

**Files:**
- Create: `packages/base-frontend/src/components/display/mfw-profile-card/index.ts`

- [ ] **Step 1: 创建入口文件**

```typescript
import MfwProfileCard from './mfw-profile-card.vue';
export { MfwProfileCard };
export * from './types';
```

---

### Task 5: 注册 MfwProfileCard 组件

**Files:**
- Modify: `packages/base-frontend/src/components/display/mod.ts`

- [ ] **Step 1: 添加组件导出**

修改文件，添加以下内容：

```typescript
export { MfwProfileCard } from './mfw-profile-card';
export type * from './mfw-profile-card/types';
```

完整修改后的文件：

```typescript
/**
 * @fileoverview 展示类组件导出
 */

export { MfwFormat, MfwDateFormat, MfwImageFormat, MfwDictFormat, MfwTagFormat } from './mfw-format';
export type * from './mfw-format/types';
export { MfwDetailPanel, MfwUserFormat } from './mfw-detail';
export type * from './mfw-detail/types';
export { MfwProfileCard } from './mfw-profile-card';
export type * from './mfw-profile-card/types';
```

---

### Task 6: 修复 AppForm.vue Logo回显问题

**Files:**
- Modify: `packages/base-frontend/src/views/sys/app/AppForm.vue:169-177`

- [ ] **Step 1: 修复Logo数据初始化**

修改 `onMounted` 中的Logo赋值逻辑：

原代码（第175行）：
```typescript
form.logo = (props as any).logo || undefined;
```

修改为（处理字符串类型转换）：
```typescript
if (props.logo) {
  form.logo = typeof props.logo === 'string' 
    ? { src: props.logo } 
    : props.logo;
}
```

完整修改后的 `onMounted` 部分：

```typescript
onMounted(async () => {
  await loadAppTypes();

  if (props.id) {
    form.appTypeId = props.appTypeId;
    form.appName = props.appName;
    form.appCode = props.appCode;
    form.ownerId = props.ownerId;
    form.appDesc = props.appDesc || '';
    if (props.logo) {
      form.logo = typeof props.logo === 'string' 
        ? { src: props.logo } 
        : props.logo;
    }
    form.appStatus = props.appStatus as 1 | 0;
  }
});
```

---

### Task 7: 调整 AppForm.vue Logo位置

**Files:**
- Modify: `packages/base-frontend/src/views/sys/app/AppForm.vue:57-135`

- [ ] **Step 1: 将Logo配置移至首位**

修改 `baseTemplate` 数组，将Logo配置从第110-121行移至数组首位：

```typescript
const baseTemplate: FormItemConfig[] = [
  {
    key: 'logo',
    label: '应用Logo',
    component: MfwImageSingle,
    elProps: {
      crop: true,
      cropRatio: 1,
      cropWidth: 200,
      cropHeight: 200,
      placeholder: '点击上传Logo',
    },
  },
  {
    key: 'appTypeId',
    label: '应用类型',
    component: 'el-select',
    placeholder: '请选择应用类型',
    rules: [{ required: true, message: '请选择应用类型', trigger: 'change' }],
    disabled: () => isEdit.value,
    elProps: {
      style: 'width: 100%',
    },
  },
  {
    key: 'appName',
    label: '应用名称',
    component: 'el-input',
    placeholder: '请输入应用名称',
    rules: [{ required: true, message: '请输入应用名称', trigger: 'blur' }],
  },
  {
    key: 'appCode',
    label: '应用编码',
    component: 'el-input',
    placeholder: '请输入应用编码',
    rules: [{ required: true, message: '请输入应用编码', trigger: 'blur' }],
    show: () => !isEdit.value,
  },
  {
    key: 'appCode',
    label: '应用编码',
    component: 'el-input',
    disabled: true,
    show: () => isEdit.value,
  },
  {
    key: 'ownerId',
    label: '拥有者',
    component: MfwUserPicker,
    rules: [{ required: true, message: '请选择拥有者', trigger: 'change' }],
    elProps: {
      style: 'width: 100%',
    },
  },
  {
    key: 'appDesc',
    label: '应用描述',
    component: 'el-input',
    placeholder: '请输入应用描述',
    elProps: {
      type: 'textarea',
      rows: 3,
    },
  },
  {
    key: 'appStatus',
    label: '状态',
    component: 'el-switch',
    show: () => isEdit.value,
    value: STATUS.ENABLED,
    elProps: {
      activeValue: STATUS.ENABLED,
      inactiveValue: STATUS.DISABLED,
      activeText: '启用',
      inactiveText: '禁用',
    },
  },
];
```

---

### Task 8: 改造 AppDetail.vue 使用卡片组件

**Files:**
- Modify: `packages/base-frontend/src/views/sys/app/AppDetail.vue`

- [ ] **Step 1: 替换组件导入**

修改导入部分：

```typescript
import { computed } from 'vue';
import { MfwProfileCard } from '../../../components';
import type { ProfileCardHeader, ProfileCardItem } from '../../../components/display/mfw-profile-card/types';
import type { AppDetailResponseDto } from '../../../apis/sys/schemas';
import { Folder, User, Calendar, Document } from '@element-plus/icons-vue';
```

- [ ] **Step 2: 重构组件模板**

```vue
<template>
  <MfwProfileCard
    :header="headerConfig"
    :items="infoItems"
    :data="data"
    bordered
  >
    <template #appType="{ value }">
      {{ value?.typeName || '--' }}
    </template>
    <template #owner="{ value }">
      {{ value?.nickname || value?.username || '--' }}
    </template>
  </MfwProfileCard>
</template>
```

- [ ] **Step 3: 重构组件脚本**

```vue
<script setup lang="ts">
import { computed } from 'vue';
import { MfwProfileCard } from '../../../components';
import type { ProfileCardHeader, ProfileCardItem } from '../../../components/display/mfw-profile-card/types';
import type { AppDetailResponseDto } from '../../../apis/sys/schemas';
import { Folder, User, Calendar, Document } from '@element-plus/icons-vue';

const STATUS = {
  ENABLED: 1,
  DISABLED: 0,
} as const;

interface Props {
  data?: AppDetailResponseDto;
}

const props = defineProps<Props>();
defineOptions({ name: 'AppDetail' });

const headerConfig = computed<ProfileCardHeader>(() => ({
  image: props.data?.logo,
  title: props.data?.appName || '--',
  subtitle: props.data?.appCode,
  status: props.data?.appStatus !== undefined ? {
    value: props.data.appStatus,
    type: props.data.appStatus === STATUS.ENABLED ? 'success' : 'danger',
    text: props.data.appStatus === STATUS.ENABLED ? '启用' : '禁用',
  } : undefined,
}));

const infoItems: ProfileCardItem[] = [
  { key: 'appType', label: '应用类型', icon: Folder },
  { key: 'owner', label: '拥有者', icon: User },
  { key: 'appDesc', label: '应用描述', icon: Document },
  { key: 'sortOrder', label: '排序号' },
  { key: 'createdAt', label: '创建时间', icon: Calendar, format: 'date' },
  { key: 'updateAt', label: '更新时间', icon: Calendar, format: 'date' },
];
</script>
```

---

### Task 9: 验证和测试

- [ ] **Step 1: 运行类型检查**

运行: `cd packages/base-frontend && npm run typecheck`
预期: 无类型错误

- [ ] **Step 2: 运行lint检查**

运行: `cd packages/base-frontend && npm run lint`
预期: 无lint错误

- [ ] **Step 3: 启动开发服务器测试**

运行: `cd packages/base-frontend && npm run dev`
预期: 
- 应用管理页面表单Logo在第一行显示
- 编辑应用时Logo正确回显
- 应用详情以卡片样式展示

---

### Task 10: 提交变更

- [ ] **Step 1: 提交所有变更**

```bash
git add packages/base-frontend/src/components/display/mfw-profile-card/
git add packages/base-frontend/src/components/display/mod.ts
git add packages/base-frontend/src/views/sys/app/AppForm.vue
git add packages/base-frontend/src/views/sys/app/AppDetail.vue
git commit -m "feat(app): 改进应用管理页面 - Logo位置调整、回显修复、详情卡片化、通用组件封装"
```