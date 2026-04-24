# MfwPopup 弹窗组件

> 组件类型: 反馈组件 | 模块: feedback

---

## 概述

`MfwPopup` 提供命令式弹窗 API，支持 Dialog（对话框）和 Drawer（抽屉）两种形式。通过命令式 API 调用，无需在模板中声明弹窗组件。

## 安装与注册

```typescript
// main.ts
import { MfwPopup, MfwPopupManager } from 'moyan-mfw-base-frontend';

// 注册弹窗管理器（必须，用于渲染弹窗）
app.component('MfwPopupManager', MfwPopupManager);
```

```vue
<!-- App.vue -->
<template>
  <router-view />
  <!-- 弹窗管理器必须放在应用根组件 -->
  <MfwPopupManager />
</template>
```

---

## 基础用法

### 打开弹窗

```vue
<script setup lang="ts">
import { MfwPopup } from 'moyan-mfw-base-frontend';
import UserForm from './UserForm.vue';

const handleOpen = () => {
  MfwPopup.open({
    title: '用户详情',
    type: 'dialog',
    component: UserForm,
    data: { userId: '123' },
    on: {
      confirm: (data) => {
        console.log('确认:', data);
      },
      close: (data) => {
        console.log('关闭:', data);
      }
    }
  });
};
</script>
```

### 弹窗表单组件示例

```vue
<!-- UserForm.vue -->
<template>
  <el-form :model="formData">
    <el-form-item label="用户名">
      <el-input v-model="formData.name" />
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref } from 'vue';

// 接收弹窗传入的数据
const props = defineProps<{
  data?: { userId: string };
  popupRef?: any;
}>();

const formData = ref({
  name: ''
});

// 确认时调用（可选）
const onConfirm = async () => {
  // 返回 Promise 可进行异步验证
  await saveUser(formData.value);
};

// 取消时调用（可选）
const onCancel = () => {
  console.log('取消');
};

defineExpose({
  onConfirm,
  onCancel
});
</script>
```

---

## API 参考

### MfwPopup.open

打开一个弹窗。

```typescript
MfwPopup.open<T = any>(options: OpenPopupOptions<T>): PopupInstance
```

### OpenPopupOptions

| 属性 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| component | `Component` | 是 | - | 弹窗内容组件 |
| title | `string` | 否 | `''` | 弹窗标题 |
| type | `'dialog' \| 'drawer'` | 否 | `'dialog'` | 弹窗类型 |
| data | `T` | 否 | - | 传递给内容组件的数据 |
| provides | `Record<string, any>` | 否 | - | 提供给内容组件的依赖注入 |
| popupProps | `Partial<DialogProps \| DrawerProps>` | 否 | `{}` | Element Plus Dialog/Drawer 配置 |
| footer | `PopupFooter \| boolean` | 否 | - | 页脚配置，`false` 隐藏页脚 |
| on | `PopupListeners` | 否 | `{}` | 事件监听器 |
| position | `'ltr' \| 'rtl' \| 'ttb' \| 'btt'` | 否 | - | Drawer 方向（仅 drawer 类型） |
| cache | `boolean` | 否 | `false` | 是否缓存组件实例 |
| uuid | `string` | 否 | 自动生成 | 弹窗唯一标识 |

### PopupFooter

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| showCancel | `boolean` | `true` | 显示取消按钮 |
| showConfirm | `boolean` | `true` | 显示确认按钮 |
| cancelText | `string` | `'关闭'` | 取消按钮文本 |
| confirmText | `string` | `'确认'` | 确认按钮文本 |
| confirmLoading | `boolean` | `false` | 确认按钮加载状态 |

### PopupListeners

| 事件 | 类型 | 说明 |
|------|------|------|
| confirm | `(data: any) => void \| Promise<void>` | 确认事件 |
| close | `(data: any) => void` | 关闭事件 |
| cancel | `() => void` | 取消事件 |
| change | `(data: any) => void` | 数据变化事件 |

### PopupInstance

| 属性/方法 | 类型 | 说明 |
|------|------|------|
| uuid | `string` | 弹窗唯一标识 |
| open | `() => void` | 打开弹窗 |
| close | `() => void` | 关闭弹窗 |
| confirm | `() => void` | 触发确认 |
| update | `(options: Partial<OpenPopupOptions>) => void` | 更新配置 |

---

## 使用示例

### Dialog 弹窗

```typescript
MfwPopup.open({
  title: '编辑用户',
  type: 'dialog',
  component: UserForm,
  data: { userId: '123' },
  popupProps: {
    width: '500px',
    closeOnClickModal: false
  },
  footer: {
    showCancel: true,
    showConfirm: true,
    cancelText: '取消',
    confirmText: '保存'
  },
  on: {
    confirm: async (data) => {
      await saveData(data);
    }
  }
});
```

### Drawer 抽屉

```typescript
MfwPopup.open({
  title: '用户详情',
  type: 'drawer',
  component: UserDetail,
  data: { userId: '123' },
  position: 'rtl', // 从右侧滑出
  popupProps: {
    size: '600px'
  },
  on: {
    close: (data) => {
      console.log('抽屉关闭');
    }
  }
});
```

### 无页脚弹窗

```typescript
MfwPopup.open({
  title: '预览',
  type: 'dialog',
  component: PreviewComponent,
  footer: false, // 隐藏页脚
  popupProps: {
    width: '800px'
  }
});
```

### 关闭指定弹窗

```typescript
const popup = MfwPopup.open({
  title: '处理中',
  component: ProcessingComponent
});

// 稍后关闭
setTimeout(() => {
  MfwPopup.close(popup.uuid);
}, 3000);
```

### 关闭所有弹窗

```typescript
MfwPopup.closeAll();
```

---

## 弹窗内容组件规范

### Props 接收

弹窗内容组件可通过 props 接收以下数据：

```typescript
interface PopupComponentProps<T = any> {
  /** 弹窗数据 */
  data?: T;
  /** 弹窗实例 */
  popupRef?: PopupInstance;
  /** 关闭弹窗方法 */
  close?: () => void;
  /** 确认弹窗方法 */
  confirm?: () => void;
}
```

### 确认/取消回调

如需在确认时进行校验或异步操作，暴露 `onConfirm` 方法：

```vue
<script setup lang="ts">
// 同步确认
const onConfirm = () => {
  if (!formValid()) {
    throw new Error('表单校验失败'); // 抛出错误阻止关闭
  }
};

// 异步确认
const onConfirm = async () => {
  await submitForm(); // 等待完成
};

// 取消回调
const onCancel = () => {
  console.log('用户取消');
};

defineExpose({
  onConfirm,
  onCancel
});
</script>
```

---

## 类型定义

```typescript
/** 弹窗类型 */
type PopupType = 'dialog' | 'drawer';

/** 弹窗位置（仅 drawer） */
type PopupPosition = 'ltr' | 'rtl' | 'ttb' | 'btt';

/** 页脚配置 */
interface PopupFooter {
  showCancel?: boolean;
  showConfirm?: boolean;
  cancelText?: string;
  confirmText?: string;
  confirmLoading?: boolean;
}

/** 弹窗事件 */
interface PopupListeners {
  confirm?: (data: any) => void | Promise<void>;
  close?: (data: any) => void;
  cancel?: () => void;
  change?: (data: any) => void;
}

/** 打开选项 */
interface OpenPopupOptions<T = any> {
  uuid?: string;
  title?: string;
  type?: PopupType;
  component: Component;
  data?: T;
  provides?: Record<string, any>;
  popupProps?: Partial<DialogProps | DrawerProps>;
  footer?: PopupFooter | boolean;
  on?: PopupListeners;
  position?: PopupPosition;
  cache?: boolean;
}

/** 弹窗实例 */
interface PopupInstance {
  uuid: string;
  open: () => void;
  close: () => void;
  confirm: () => void;
  update: (options: Partial<OpenPopupOptions>) => void;
}
```

---

## 注意事项

1. **必须注册 MfwPopupManager**：在应用根组件中放置 `<MfwPopupManager />`，否则弹窗无法渲染

2. **组件缓存**：设置 `cache: true` 可在关闭后保留组件状态，下次打开时恢复

3. **异步确认**：`onConfirm` 返回 Promise 时，弹窗会等待 Promise 完成后再关闭。如果 Promise 被拒绝，弹窗保持打开状态

4. **样式覆盖**：通过 `popupProps.class` 可自定义弹窗样式

5. ** Drawer 方向**：`position` 仅在 `type: 'drawer'` 时有效

---

## 最佳实践

### 仅声明与默认值不同的 footer 配置

`footer` 的 `cancelText` 默认值为 `'关闭'`，`confirmText` 默认值为 `'确认'`，`showCancel`/`showConfirm` 默认为 `true`。仅当值与默认值不同时才需显式声明：

```typescript
// ❌ 错误：cancelText 与默认值重复
MfwPopup.open({
  footer: { cancelText: '关闭', confirmText: '保存' },
});

// ✅ 正确：仅声明与默认值不同的字段
MfwPopup.open({
  footer: { confirmText: '保存' },
});
```

### 简化 confirm 回调为函数引用

当 `on.confirm` 回调仅调用单个方法时，直接传递函数引用即可，与箭头函数写法语义等价：

```typescript
// ❌ 冗余：不必要的箭头函数包装
on: {
  confirm: () => {
    listPage.value?.refresh();
  },
}

// ✅ 简洁：直接传递函数引用
on: { confirm: listPage.value?.refresh }
```

### 移除空的回调定义

空的回调函数没有任何作用，不需要时直接省略 `on` 配置：

```typescript
// ❌ 错误：空的 confirm 回调
on: {
  confirm: () => {},
}

// ✅ 正确：不需要回调时不传 on
// （不传 on 即可）
```

---

## 更新历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 1.1.0 | 2026-04-24 | 新增最佳实践章节（footer 精简、回调简化、空回调移除） |
| 1.0.0 | 2026-04-03 | 初始版本 |
