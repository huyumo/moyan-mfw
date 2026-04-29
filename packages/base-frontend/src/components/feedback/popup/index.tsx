/**
 * @fileoverview MfwPopup 弹窗组件
 * @description 提供命令式弹窗 API，支持 Dialog 和 Drawer 两种形式
 */

import './style.scss';

import {
  defineComponent,
  ref,
  reactive,
  provide,
  toRef,
  type Component,
  h
} from 'vue';
import { ElDialog, ElDrawer, ElButton, ElMessage } from 'element-plus';
import type { DialogProps, DrawerProps } from 'element-plus';

/** 弹窗类型 */
export type PopupType = 'dialog' | 'drawer';

/** 弹窗位置 */
export type PopupPosition = 'ltr' | 'rtl' | 'ttb' | 'btt';

/** 页脚配置 */
export interface PopupFooter {
  showCancel?: boolean;
  showConfirm?: boolean;
  cancelText?: string;
  confirmText?: string;
  confirmLoading?: boolean;
}

/** 弹窗事件监听器 */
export interface PopupListeners {
  confirm?: (data: any) => void | Promise<void>;
  close?: (data: any) => void;
  cancel?: () => void;
  change?: (data: any) => void;
}

/** 弹窗实例 */
export interface PopupInstance {
  uuid: string;
  open: () => void;
  close: () => void;
  confirm: () => void;
  update: (options: Partial<OpenPopupOptions>) => void;
}

/** 打开弹窗选项 */
export interface OpenPopupOptions<T = any> {
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

/** 弹窗项 */
export interface PopupItem {
  uuid: string;
  title: string;
  type: PopupType;
  component: Component;
  data?: any;
  provides?: Record<string, any>;
  popupProps: Partial<DialogProps | DrawerProps>;
  footer?: PopupFooter | boolean;
  on: PopupListeners;
  visible: boolean;
  cache: boolean;
  position?: PopupPosition;
}

/** 弹窗列表 */
const popupList = reactive<PopupItem[]>([]);

/** 生成 UUID */
function generateUUID(): string {
  return 'popup_' + Math.random().toString(36).substr(2, 9);
}

/**
 * MfwPopup 命令式 API
 */
export class MfwPopupClass {
  static open<T = any>(options: OpenPopupOptions<T>): PopupInstance {
    const mergedOptions = {
      title: options.title || '',
      type: options.type || 'dialog',
      popupProps: options.popupProps || {},
      footer: options.footer === false ? false : {
        showCancel: true,
        showConfirm: true,
        cancelText: '关闭',
        confirmText: '确认',
        ...(typeof options.footer === 'object' ? options.footer : {})
      },
      on: options.on || {},
      uuid: options.uuid || generateUUID(),
      component: options.component,
      data: options.data,
      provides: options.provides,
      position: options.position,
      cache: options.cache || false
    };

    const popupItem: PopupItem = {
      uuid: mergedOptions.uuid!,
      title: mergedOptions.title!,
      type: mergedOptions.type!,
      component: mergedOptions.component,
      data: mergedOptions.data,
      provides: mergedOptions.provides,
      popupProps: mergedOptions.popupProps as Partial<DialogProps | DrawerProps>,
      footer: mergedOptions.footer as PopupFooter | boolean,
      on: mergedOptions.on as PopupListeners,
      visible: true,
      cache: mergedOptions.cache!,
      position: mergedOptions.position
    };

    popupList.push(popupItem);

    return {
      uuid: popupItem.uuid,
      open: () => {
        const item = popupList.find((p) => p.uuid === popupItem.uuid);
        if (item) item.visible = true;
      },
      close: () => {
        const index = popupList.findIndex((p) => p.uuid === popupItem.uuid);
        if (index > -1) popupList.splice(index, 1);
      },
      confirm: () => {},
      update: (newOptions: Partial<OpenPopupOptions>) => {
        const item = popupList.find((p) => p.uuid === popupItem.uuid);
        if (item) Object.assign(item, newOptions);
      }
    };
  }

  static close(uuid: string): void {
    const index = popupList.findIndex((p) => p.uuid === uuid);
    if (index > -1) popupList.splice(index, 1);
  }

  static closeAll(): void {
    popupList.length = 0;
  }

  static get popups(): PopupItem[] {
    return popupList;
  }
}

export const MfwPopup = MfwPopupClass;

/**
 * Dialog 组件
 */
const MfwPopupDialog = defineComponent({
  name: 'MfwPopupDialog',
  props: {
    item: { type: Object as any, required: true }
  },
  setup(props) {
    const item = toRef(props, 'item');
    const visible = ref(true);
    const loading = ref(false);
    const componentRef = ref<any>();

    const handleClose = () => {
      visible.value = false;
      item.value.on.close?.(item.value.data);
      if (!item.value.cache) {
        const index = popupList.findIndex((p) => p.uuid === item.value.uuid);
        if (index > -1) popupList.splice(index, 1);
      }
    };

    const handleConfirm = async () => {
      try {
        loading.value = true;
        if (componentRef.value?.onConfirm) {
          const result = componentRef.value.onConfirm();
          if (result && typeof result.then === 'function') await result;
        }
        item.value.on.confirm?.(componentRef.value);
        handleClose();
      } catch (error: any) {
        throw error;
      } finally {
        loading.value = false;
      }
    };

    const handleCancel = () => {
      componentRef.value?.onCancel?.();
      item.value.on.cancel?.();
      handleClose();
    };

    return () => {
      const slots: any = {
        default: h(item.value.component, {...item.value.data, ref: componentRef ,popupRef: {
          uuid: item.value.uuid,
          open: () => { visible.value = true; },
          close: handleClose,
          confirm: handleConfirm,
          update: (options: Partial<OpenPopupOptions>) => {
            Object.assign(item.value, options);
          }
        } as PopupInstance})
      };



      if (item.value.footer !== false) {
        slots.footer = () => (
          <div class="mfw-popup-footer">
            {(item.value.footer as PopupFooter)?.showCancel !== false && (
              <ElButton onClick={handleCancel}>
                {(item.value.footer as PopupFooter)?.cancelText || '关闭'}
              </ElButton>
            )}
            {(item.value.footer as PopupFooter)?.showConfirm !== false && (
              <ElButton type="primary" loading={loading.value} onClick={handleConfirm}>
                {(item.value.footer as PopupFooter)?.confirmText || '确认'}
              </ElButton>
            )}
          </div>
        );
      }

      return (
        <ElDialog
          {...item.value.popupProps}
          modelValue={visible.value}
          onUpdate:modelValue={(val: boolean) => {
            visible.value = val;
            if (!val) handleClose();
          }}
          title={item.value.title}
          showClose={item.value.popupProps.showClose ?? true}
          appendToBody
          draggable
          v-slots={slots}
        />
      );
    };
  }
});

/**
 * Drawer 组件
 */
const MfwPopupDrawer = defineComponent({
  name: 'MfwPopupDrawer',
  props: {
    item: { type: Object as any, required: true }
  },
  setup(props) {
    const item = toRef(props, 'item');
    const visible = ref(true);
    const loading = ref(false);
    const componentRef = ref<any>();

    const handleClose = () => {
      visible.value = false;
      item.value.on.close?.(item.value.data);
      if (!item.value.cache) {
        const index = popupList.findIndex((p) => p.uuid === item.value.uuid);
        if (index > -1) popupList.splice(index, 1);
      }
    };

    const handleConfirm = async () => {
      try {
        loading.value = true;
        if (componentRef.value?.onConfirm) {
          const result = componentRef.value.onConfirm();
          if (result && typeof result.then === 'function') await result;
        }
        item.value.on.confirm?.(componentRef.value);
        handleClose();
      } catch (error: any) {
        const msg = error?.response?.data?.message || error?.message || '操作失败';
        ElMessage.error(msg);
      } finally {
        loading.value = false;
      }
    };

    const handleCancel = () => {
      componentRef.value?.onCancel?.();
      item.value.on.cancel?.();
      handleClose();
    };

    return () => {
      const slots: any = {
        default: () => (
          <item.value.component
            ref={componentRef}
            data={item.value.data}
            popupRef={{
              uuid: item.value.uuid,
              open: () => { visible.value = true; },
              close: handleClose,
              confirm: handleConfirm,
              update: (options: Partial<OpenPopupOptions>) => {
                Object.assign(item.value, options);
              }
            } as PopupInstance}
            close={handleClose}
            confirm={handleConfirm}
          />
        )
      };

      if (item.value.footer !== false) {
        slots.footer = () => (
          <div class="mfw-popup-footer">
            {(item.value.footer as PopupFooter)?.showCancel !== false && (
              <ElButton onClick={handleCancel}>
                {(item.value.footer as PopupFooter)?.cancelText || '关闭'}
              </ElButton>
            )}
            {(item.value.footer as PopupFooter)?.showConfirm !== false && (
              <ElButton type="primary" loading={loading.value} onClick={handleConfirm}>
                {(item.value.footer as PopupFooter)?.confirmText || '确认'}
              </ElButton>
            )}
          </div>
        );
      }

      return (
        <ElDrawer
          {...item.value.popupProps}
          modelValue={visible.value}
          onUpdate:modelValue={(val: boolean) => {
            visible.value = val;
            if (!val) handleClose();
          }}
          title={item.value.title}
          position={item.value.position}
          showClose={item.value.popupProps.showClose ?? true}
          appendToBody
          v-slots={slots}
        />
      );
    };
  }
});

/**
 * 弹窗管理器组件，整改项目只允许定义一个弹窗管理器
 * 在布局页面，统一定义一个弹窗管理器，其他组件通过弹窗管理器打开弹窗
 * 弹窗管理器会根据弹窗类型，选择合适的弹窗组件（Dialog 或 Drawer）打开
 */
export const MfwPopupManager = defineComponent({
  name: 'MfwPopupManager',
  setup() {
    provide('MfwPopupList', popupList);
    return () => popupList.map((item) => (
          item.type === 'dialog' ? (
            <MfwPopupDialog key={item.uuid} item={item} />
          ) : (
            <MfwPopupDrawer key={item.uuid} item={item} />
          )
        ));
  }
});

export default MfwPopup;
