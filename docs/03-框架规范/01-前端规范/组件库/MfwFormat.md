# MfwFormat 格式化组件

> 组件类型: 展示组件 | 模块: display

---

## 概述

`MfwFormat` 是一组用于数据格式化展示的组件，包含日期格式化、图片格式化、字典格式化和标签格式化四个子组件。

## 安装与注册

```typescript
// main.ts
import { MfwFormat } from 'moyan-mfw-base-frontend';

app.use(MfwFormat);
```

## MfwDateFormat 日期格式化

### Props

| 属性 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| value | `Date \| string \| number \| null` | 否 | - | 日期值 |
| fmt | `string` | 否 | `YYYY-MM-DD` | 格式化模板 |
| emptyText | `string` | 否 | `-` | 空值显示文本 |
| className | `string` | 否 | - | 自定义类名 |

### 格式化模板

| 模板 | 说明 | 示例 |
|------|------|------|
| YYYY | 四位年份 | 2026 |
| MM | 两位月份 | 03 |
| DD | 两位日期 | 29 |
| HH | 两位小时（24小时制） | 14 |
| mm | 两位分钟 | 30 |
| ss | 两位秒 | 45 |

### 示例

```vue
<template>
  <!-- 基础用法 -->
  <MfwDateFormat value="2026-03-29" />
  <!-- 输出: 2026-03-29 -->

  <!-- 带时间格式 -->
  <MfwDateFormat :value="new Date()" fmt="YYYY-MM-DD HH:mm:ss" />
  <!-- 输出: 2026-03-29 14:30:45 -->

  <!-- 空值处理 -->
  <MfwDateFormat :value="null" emptyText="未设置" />
  <!-- 输出: 未设置 -->
</template>
```

---

## MfwImageFormat 图片格式化

### Props

| 属性 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| value | `string \| string[] \| null` | 否 | - | 图片 URL，支持单图或数组 |
| width | `number \| string` | 否 | `100` | 图片宽度（px） |
| height | `number \| string` | 否 | - | 图片高度（px） |
| preview | `boolean` | 否 | `false` | 是否支持点击预览 |
| fit | `string` | 否 | `cover` | 图片填充模式 |
| emptyText | `string` | 否 | `-` | 空值显示文本 |
| className | `string` | 否 | - | 自定义类名 |

### fit 填充模式

| 模式 | 说明 |
|------|------|
| fill | 拉伸填充 |
| contain | 等比缩放，完整显示 |
| cover | 等比缩放，填满容器 |
| none | 不缩放 |
| scale-down | 类似 contain，但只缩小不放大 |

### 示例

```vue
<template>
  <!-- 单图 -->
  <MfwImageFormat value="https://example.com/image.jpg" :width="100" />

  <!-- 多图 -->
  <MfwImageFormat :value="['url1.jpg', 'url2.jpg']" :width="80" :preview="true" />

  <!-- 空值 -->
  <MfwImageFormat :value="null" emptyText="无图片" />
</template>
```

---

## MfwDictFormat 字典格式化

### Props

| 属性 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| value | `string \| number \| null` | 否 | - | 字典值 |
| dict | `DictItem[]` | 否 | `[]` | 字典数据 |
| asTag | `boolean` | 否 | `false` | 是否显示为标签样式 |
| emptyText | `string` | 否 | `-` | 空值显示文本 |
| className | `string` | 否 | - | 自定义类名 |

### DictItem 类型

```typescript
interface DictItem {
  value: string | number;
  label: string;
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
}
```

### 示例

```vue
<template>
  <!-- 基础文本显示 -->
  <MfwDictFormat value="1" :dict="statusDict" />
  <!-- 输出: 启用 -->

  <!-- 标签样式 -->
  <MfwDictFormat value="0" :dict="statusDict" as-tag />
  <!-- 输出: <el-tag type="danger">禁用</el-tag> -->
</template>

<script setup>
const statusDict = [
  { value: 1, label: '启用', type: 'success' },
  { value: 0, label: '禁用', type: 'danger' },
];
</script>
```

---

## MfwTagFormat 标签格式化

### Props

| 属性 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| value | `string \| null` | 否 | - | 标签文本 |
| type | `string` | 否 | - | 标签类型 |
| autoColor | `boolean` | 否 | `false` | 是否自动根据文本生成颜色 |
| round | `boolean` | 否 | `false` | 是否为圆角 |
| effect | `string` | 否 | `light` | 效果样式 |
| emptyText | `string` | 否 | `-` | 空值显示文本 |
| className | `string` | 否 | - | 自定义类名 |

### type 标签类型

| 类型 | 颜色 |
|------|------|
| primary | 蓝色 |
| success | 绿色 |
| warning | 橙色 |
| danger | 红色 |
| info | 灰色 |

### effect 效果样式

| 效果 | 说明 |
|------|------|
| light | 亮色主题 |
| dark | 暗色主题 |
| plain | 朴素样式 |

### 示例

```vue
<template>
  <!-- 基础用法 -->
  <MfwTagFormat value="已完成" type="success" />

  <!-- 圆角标签 -->
  <MfwTagFormat value="进行中" type="primary" round />

  <!-- 暗色主题 -->
  <MfwTagFormat value="紧急" type="danger" effect="dark" />

  <!-- 自动颜色 -->
  <MfwTagFormat value="自定义文本" autoColor />
</template>
```

---

## 类型定义

```typescript
// 基础类型
interface BaseFormatProps {
  emptyText?: string;
  className?: string;
}

// 日期格式化
interface DateFormatProps extends BaseFormatProps {
  value?: Date | string | number | null;
  fmt?: string;
}

// 图片格式化
interface ImageFormatProps extends BaseFormatProps {
  value?: string | string[] | null;
  width?: number | string;
  height?: number | string;
  preview?: boolean;
  fit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down';
}

// 字典项
interface DictItem {
  value: string | number;
  label: string;
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

// 字典格式化
interface DictFormatProps extends BaseFormatProps {
  value?: string | number | null;
  dict?: DictItem[];
  asTag?: boolean;
}

// 标签格式化
interface TagFormatProps extends BaseFormatProps {
  value?: string | null;
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  autoColor?: boolean;
  round?: boolean;
  effect?: 'light' | 'dark' | 'plain';
}
```

---

## 更新历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 1.0.0 | 2026-04-03 | 初始版本 |
