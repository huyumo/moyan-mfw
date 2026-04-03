/**
 * @fileoverview MfwPopup 弹窗组件单元测试
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { MfwPopup, MfwPopupManager } from '../index';

describe('MfwPopup', () => {
  // 测试用的简单组件
  const TestComponent = {
    name: 'TestComponent',
    props: ['data'],
    template: '<div class="test-content">{{ data?.text || "默认内容" }}</div>'
  };

  beforeEach(() => {
    // 挂载 PopupManager
    mount(MfwPopupManager);
  });

  afterEach(() => {
    // 关闭所有弹窗
    MfwPopup.closeAll();
  });

  describe('基础功能', () => {
    it('应打开一个 Dialog 弹窗', async () => {
      MfwPopup.open({
        title: '测试弹窗',
        type: 'dialog',
        component: TestComponent
      });

      await nextTick();

      const popups = MfwPopup.popups;
      expect(popups.length).toBe(1);
      expect(popups[0].title).toBe('测试弹窗');
      expect(popups[0].type).toBe('dialog');
    });

    it('应打开一个 Drawer 弹窗', async () => {
      MfwPopup.open({
        title: '抽屉测试',
        type: 'drawer',
        component: TestComponent
      });

      await nextTick();

      const popups = MfwPopup.popups;
      expect(popups.length).toBe(1);
      expect(popups[0].type).toBe('drawer');
    });

    it('应返回弹窗实例', async () => {
      const popup = MfwPopup.open({
        title: '测试',
        component: TestComponent
      });

      expect(popup).toHaveProperty('uuid');
      expect(popup).toHaveProperty('close');
      expect(popup).toHaveProperty('open');
      expect(popup).toHaveProperty('update');
    });
  });

  describe('数据传递', () => {
    it('应传递数据给组件', async () => {
      const testData = { text: '测试数据' };

      MfwPopup.open({
        title: '数据测试',
        component: TestComponent,
        data: testData
      });

      await nextTick();

      const popups = MfwPopup.popups;
      expect(popups[0].data).toEqual(testData);
    });
  });

  describe('关闭功能', () => {
    it('应通过 UUID 关闭指定弹窗', async () => {
      const popup = MfwPopup.open({
        title: '关闭测试',
        component: TestComponent
      });

      await nextTick();
      expect(MfwPopup.popups.length).toBe(1);

      MfwPopup.close(popup.uuid);
      await nextTick();

      expect(MfwPopup.popups.length).toBe(0);
    });

    it('应关闭所有弹窗', async () => {
      MfwPopup.open({ title: '弹窗1', component: TestComponent });
      MfwPopup.open({ title: '弹窗2', component: TestComponent });
      MfwPopup.open({ title: '弹窗3', component: TestComponent });

      await nextTick();
      expect(MfwPopup.popups.length).toBe(3);

      MfwPopup.closeAll();
      await nextTick();

      expect(MfwPopup.popups.length).toBe(0);
    });

    it('实例方法应能关闭弹窗', async () => {
      const popup = MfwPopup.open({
        title: '实例关闭测试',
        component: TestComponent
      });

      await nextTick();
      expect(MfwPopup.popups.length).toBe(1);

      popup.close();
      await nextTick();

      expect(MfwPopup.popups.length).toBe(0);
    });
  });

  describe('更新配置', () => {
    it('应更新弹窗配置', async () => {
      const popup = MfwPopup.open({
        title: '原始标题',
        component: TestComponent
      });

      await nextTick();
      expect(MfwPopup.popups[0].title).toBe('原始标题');

      popup.update({ title: '新标题' });
      await nextTick();

      expect(MfwPopup.popups[0].title).toBe('新标题');
    });
  });

  describe('页脚配置', () => {
    it('应隐藏页脚（footer=false）', async () => {
      MfwPopup.open({
        title: '无页脚',
        component: TestComponent,
        footer: false
      });

      await nextTick();

      const popups = MfwPopup.popups;
      expect(popups[0].footer).toBe(false);
    });

    it('应自定义页脚按钮文本', async () => {
      MfwPopup.open({
        title: '自定义按钮',
        component: TestComponent,
        footer: {
          showCancel: true,
          showConfirm: true,
          cancelText: '取消操作',
          confirmText: '确认提交'
        }
      });

      await nextTick();

      const popups = MfwPopup.popups;
      const footer = popups[0].footer as any;
      expect(footer.cancelText).toBe('取消操作');
      expect(footer.confirmText).toBe('确认提交');
    });

    it('应隐藏取消按钮', async () => {
      MfwPopup.open({
        title: '隐藏取消',
        component: TestComponent,
        footer: {
          showCancel: false,
          showConfirm: true
        }
      });

      await nextTick();

      const popups = MfwPopup.popups;
      const footer = popups[0].footer as any;
      expect(footer.showCancel).toBe(false);
    });
  });

  describe('事件监听', () => {
    it('应触发 confirm 事件', async () => {
      const onConfirm = vi.fn();

      MfwPopup.open({
        title: '事件测试',
        component: TestComponent,
        on: {
          confirm: onConfirm
        }
      });

      await nextTick();

      // 模拟触发确认
      const popup = MfwPopup.popups[0];
      popup.on.confirm?.({ test: true });

      expect(onConfirm).toHaveBeenCalled();
    });

    it('应触发 close 事件', async () => {
      const onClose = vi.fn();

      MfwPopup.open({
        title: '关闭事件测试',
        component: TestComponent,
        on: {
          close: onClose
        }
      });

      await nextTick();

      // 直接调用 popupList 中 item 的 on.close 回调
      const popup = MfwPopup.popups[0];
      popup.on.close?.({ test: true });

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Drawer 特有功能', () => {
    it('应支持不同方向', async () => {
      const positions = ['ltr', 'rtl', 'ttb', 'btt'] as const;

      for (const position of positions) {
        MfwPopup.closeAll();

        MfwPopup.open({
          title: `方向测试-${position}`,
          type: 'drawer',
          component: TestComponent,
          position
        });

        await nextTick();

        expect(MfwPopup.popups[0].position).toBe(position);
      }
    });
  });

  describe('缓存功能', () => {
    it('应缓存组件实例（cache=true）', async () => {
      MfwPopup.open({
        title: '缓存测试',
        component: TestComponent,
        cache: true
      });

      await nextTick();

      expect(MfwPopup.popups[0].cache).toBe(true);
    });
  });

  describe('UUID 生成', () => {
    it('应使用自定义 UUID', async () => {
      const customUUID = 'my-custom-uuid-123';

      MfwPopup.open({
        uuid: customUUID,
        title: '自定义 UUID',
        component: TestComponent
      });

      await nextTick();

      expect(MfwPopup.popups[0].uuid).toBe(customUUID);
    });

    it('应自动生成 UUID', async () => {
      MfwPopup.open({
        title: '自动生成 UUID',
        component: TestComponent
      });

      await nextTick();

      const uuid = MfwPopup.popups[0].uuid;
      expect(uuid).toBeDefined();
      expect(typeof uuid).toBe('string');
      expect(uuid.length).toBeGreaterThan(0);
    });
  });

  describe('边界情况', () => {
    it('应处理多个弹窗共存', async () => {
      const popups: string[] = [];

      for (let i = 0; i < 5; i++) {
        const popup = MfwPopup.open({
          title: `弹窗${i}`,
          component: TestComponent
        });
        popups.push(popup.uuid);
      }

      await nextTick();

      expect(MfwPopup.popups.length).toBe(5);

      // 验证每个弹窗的 UUID 都是唯一的
      const uuids = MfwPopup.popups.map(p => p.uuid);
      const uniqueUuids = [...new Set(uuids)];
      expect(uniqueUuids.length).toBe(5);
    });

    it('应处理空配置', async () => {
      // @ts-ignore - 测试空配置的情况
      const popup = MfwPopup.open({
        component: TestComponent
      });

      await nextTick();

      expect(popup).toBeDefined();
      expect(MfwPopup.popups.length).toBe(1);
    });
  });
});
