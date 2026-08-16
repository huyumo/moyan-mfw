# 组件 · 反馈（feedback）

## `MfwPopup` — 命令式弹窗

框架推荐使用**命令式**弹窗 API，无需在模板中维护 Dialog/Drawer 的 visible 状态：

```typescript
import { MfwPopup } from 'moyan-mfw-base/frontend';

const popup = MfwPopup.open({
  title: '编辑供应商',
  type: 'dialog',                // 'dialog' | 'drawer'
  component: SupplierForm,       // 内容组件
  elProps: { id: row.id },       // 传给内容组件的属性（推荐）
  provides: { someKey: value },  // provide 注入
  popupProps: { width: '600px', closeOnClickModal: false },  // Dialog/Drawer 配置
  footer: {
    showCancel: true,
    showConfirm: true,
    confirmText: '保存',
    confirmLoading: true,        // 提交中显示 loading
  },
  on: {
    confirm: async (data) => {   // 点击确认（可异步）
      await save(data);
      popup.close();             // 关闭当前弹窗
    },
    close: (data) => {},
    cancel: () => {},
    change: (data) => {},
  },
  cache: true,                   // 缓存组件实例（切换页签不销毁）
});

// 抽屉方向（drawer 类型）
popup.update({ position: 'rtl' });  // 'ltr' | 'rtl' | 'ttb' | 'btt'
```

### 内容组件约定

内容组件通过 props 接收弹窗能力：

```vue
<script setup lang="ts">
// 方式一（推荐）：elProps 传入的业务属性
const props = defineProps<{ id?: string }>();

// 方式二：弹窗实例与关闭/确认能力
const { popupRef, close, confirm } = defineProps<{
  popupRef?: PopupInstance;
  close?: () => void;
  confirm?: () => void;
}>();

// 提交成功后关闭
async function submit() {
  await save();
  close?.();
}
</script>
```

> `data` 属性已废弃，统一使用 `elProps` 传参。

### `PopupInstance`

`open()` / `close()` / `confirm()` / `update(options)` / `uuid`。

### 全局关闭

```typescript
import { MfwPopupManager } from 'moyan-mfw-base/frontend';

MfwPopupManager.closeAll();   // 关闭所有弹窗
MfwPopupManager.close(uuid);  // 按 uuid 关闭
```

## 使用规范

1. 业务弹窗一律用 `MfwPopup.open`，不要在模板里手写 el-dialog + visible 状态。
2. 向内容组件传值用 `elProps`（不要再传 `data`）。
3. 确认按钮需要异步提交时设置 `footer.confirmLoading = true`，提交完成调用 `popup.close()`。
4. 跨页签保持状态用 `cache: true`。
