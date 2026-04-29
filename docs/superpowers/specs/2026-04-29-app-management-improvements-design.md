# 应用管理页面改进设计文档

## 概述

本设计文档描述应用管理页面的四个改进需求：
1. 表单布局调整：将Logo移至表单第一行
2. Logo回显修复：解决编辑时Logo未正确回显的问题
3. 详情卡片化：将应用详情从Descriptions组件改为卡片样式
4. 通用组件封装：封装可复用的卡片详情组件

## 问题分析

### 1. 表单布局问题

当前 `AppForm.vue` 中，Logo字段位于表单末尾（第110-121行），用户体验不佳。Logo作为应用的视觉标识，应优先展示。

**改进方案**：将Logo配置项移至 `baseTemplate` 数组首位。

### 2. Logo回显问题

**问题根源**：`AppForm.vue` 第175行使用 `(props as any).logo`，存在以下问题：
- props 类型为 `AppDetailResponseDto`，logo字段可能未正确定义
- 数据格式可能不匹配 `MfwImageSingle` 组件的 `modelValue` 类型

**修复方案**：
1. 检查 `AppDetailResponseDto` 是否包含 logo 字段
2. 确保 logo 数据格式为 `ImageResource` 类型（包含 src、width、height）
3. 正确初始化表单数据

### 3. 详情展示问题

当前 `AppDetail.vue` 使用 `MfwDetailPanel` 组件（基于 `ElDescriptions`），呈现为表格形式，视觉效果较为传统。

**改进方案**：参考 `profile-panel.vue` 的卡片样式，采用头部+信息列表的布局。

### 4. 组件复用问题

`profile-panel.vue` 的卡片样式具有良好的视觉效果，但未封装为通用组件，无法在其他详情页面复用。

**改进方案**：封装 `MfwProfileCard` 通用组件。

## 设计方案

### MfwProfileCard 组件设计

#### 组件结构

```
MfwProfileCard
├── header (头部区域)
│   ├── avatar/image (头像/图片)
│   ├── title (标题)
│   └── status/badge (状态标签)
├── info-list (信息列表)
│   └── info-row (信息行)
│       ├── icon (图标)
│       ├── label (标签)
│       └── value (值)
├── extra slot (扩展插槽)
└── actions slot (操作按钮插槽)
```

#### Props 定义

```typescript
interface HeaderConfig {
  image?: ImageResource | string;
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

interface InfoItem {
  key: string;
  label: string;
  icon?: Component;
  format?: 'text' | 'date' | 'image' | 'dict' | 'tag' | 'custom';
  formatOptions?: Record<string, any>;
  span?: number;
}

interface MfwProfileCardProps {
  header: HeaderConfig;
  items: InfoItem[];
  data: Record<string, any>;
  bordered?: boolean;
  loading?: boolean;
  emptyText?: string;
}
```

#### 样式设计

参考 `profile-panel.vue` 的样式：

```scss
.mfw-profile-card {
  padding: 20px;
  background: var(--el-bg-color);
  border-radius: 12px;
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
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
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
```

### AppForm.vue 改进

#### Logo位置调整

将Logo配置项从第110-121行移至 `baseTemplate` 数组首位：

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
    // ... 其他配置
  },
  // ... 其他字段
];
```

#### Logo回显修复

检查并修复数据初始化逻辑：

```typescript
onMounted(async () => {
  await loadAppTypes();

  if (props.id) {
    form.appTypeId = props.appTypeId;
    form.appName = props.appName;
    form.appCode = props.appCode;
    form.ownerId = props.ownerId;
    form.appDesc = props.appDesc || '';
    // 修复：正确处理logo数据
    if (props.logo) {
      form.logo = typeof props.logo === 'string' 
        ? { src: props.logo } 
        : props.logo;
    }
    form.appStatus = props.appStatus as 1 | 0;
  }
});
```

### AppDetail.vue 改进

使用 `MfwProfileCard` 替换 `MfwDetailPanel`：

```vue
<template>
  <MfwProfileCard
    :header="headerConfig"
    :items="infoItems"
    :data="data"
  >
    <template #extra>
      <!-- 扩展内容 -->
    </template>
    <template #actions>
      <!-- 操作按钮 -->
    </template>
  </MfwProfileCard>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import MfwProfileCard from '../../../components/display/mfw-profile-card';
import { User, Folder, Calendar, Document } from '@element-plus/icons-vue';

const headerConfig = computed(() => ({
  image: data.logo,
  title: data.appName,
  subtitle: data.appCode,
  status: {
    value: data.appStatus,
    type: data.appStatus === 1 ? 'success' : 'danger',
    text: data.appStatus === 1 ? '启用' : '禁用',
  },
}));

const infoItems = [
  { key: 'appType', label: '应用类型', icon: Folder },
  { key: 'owner', label: '拥有者', icon: User },
  { key: 'appDesc', label: '应用描述', icon: Document },
  { key: 'createdAt', label: '创建时间', icon: Calendar, format: 'date' },
];
</script>
```

## 实现计划

### 任务分解

1. **创建 MfwProfileCard 组件**
   - 创建组件文件 `mfw-profile-card.vue`
   - 定义类型接口
   - 实现组件逻辑和样式
   - 注册到组件库

2. **修复 AppForm.vue Logo回显**
   - 检查 API 返回数据结构
   - 修复数据初始化逻辑

3. **调整 AppForm.vue Logo位置**
   - 将Logo配置移至首位

4. **改造 AppDetail.vue**
   - 使用 MfwProfileCard 替换 MfwDetailPanel
   - 配置头部和信息项

5. **验证和测试**
   - 测试表单Logo上传和回显
   - 测试详情卡片展示
   - 测试组件复用性

## 文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `components/display/mfw-profile-card/index.ts` | 新建 | 组件入口 |
| `components/display/mfw-profile-card/mfw-profile-card.vue` | 新建 | 组件实现 |
| `components/display/mfw-profile-card/types.ts` | 新建 | 类型定义 |
| `components/display/mod.ts` | 修改 | 注册组件 |
| `views/sys/app/AppForm.vue` | 修改 | Logo位置调整+回显修复 |
| `views/sys/app/AppDetail.vue` | 修改 | 使用卡片组件 |

## 验收标准

1. Logo在表单第一行显示
2. 编辑应用时Logo正确回显
3. 应用详情以卡片样式展示
4. MfwProfileCard组件可复用
5. 样式与profile-panel保持一致
6. 支持主题切换（使用CSS变量）