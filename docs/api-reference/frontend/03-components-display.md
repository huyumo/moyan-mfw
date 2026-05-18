# 03 · 展示类组件

## 目录

- [`MfwCardPanel`](#mfwcardpanel) — 卡片面板容器
- [`MfwDetail` / `MfwDetailPanel` / `MfwUserFormat`](#mfwdetail-mfwdetailpanel-mfwuserformat) — 详情展示
- [`MfwFormat` 系列](#mfwformat-系列) — 格式化展示
- [`ParticleBackground`](#particlebackground) — 粒子背景动画

---

## `MfwCardPanel`

卡片面板容器，用于数据展示和表单卡片。

```typescript
import { MfwCardPanel } from 'moyan-mfw-base/frontend'
```

```vue
<MfwCardPanel title="基本信息" icon="InfoFilled">
  <el-descriptions :column="2" border>
    <el-descriptions-item label="用户名">admin</el-descriptions-item>
  </el-descriptions>
</MfwCardPanel>
```

---

## `MfwDetail` / `MfwDetailPanel` / `MfwUserFormat`

详情展示组件。

```typescript
import { MfwDetail, MfwDetailPanel, MfwUserFormat } from 'moyan-mfw-base/frontend'
```

| 组件 | 说明 |
|------|------|
| `MfwDetail` | 详情展示容器 |
| `MfwDetailPanel` | 详情面板 |
| `MfwUserFormat` | 用户信息格式化展示 |

---

## `MfwFormat` 系列

数据格式化展示组件，支持多种数据类型。

```typescript
import {
  MfwFormat,        // 通用格式化
  MfwDateFormat,    // 日期格式化
  MfwImageFormat,   // 图片格式化
  MfwDictFormat,    // 字典格式化
  MfwTagFormat,     // 标签格式化
} from 'moyan-mfw-base/frontend'
```

### 使用示例

```vue
<template>
  <MfwDateFormat :value="item.createdAt" format="YYYY-MM-DD HH:mm" />
  <MfwImageFormat :value="item.avatar" :width="40" :height="40" />
  <MfwDictFormat :value="item.status" :dict="StatusDict" />
  <MfwTagFormat :value="item.type" type="primary" />
</template>
```

---

## `ParticleBackground`

粒子背景动画组件。

```typescript
import { ParticleBackground } from 'moyan-mfw-base/frontend'
```

```vue
<ParticleBackground color="#409EFF" :count="80" />
```

用于登录页、大屏等场景的背景装饰。
