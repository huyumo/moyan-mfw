/**
 * @fileoverview MfwDictFormat 组件单元测试
 */

import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import MfwDictFormat from '../../dict-format';

describe('MfwDictFormat', () => {
  const mockDict = [
    { value: 1, label: '启用', type: 'success' },
    { value: 0, label: '禁用', type: 'danger' },
    { value: 'pending', label: '待处理', type: 'warning' }
  ];

  describe('基础渲染', () => {
    it('应正确显示匹配的字典标签', () => {
      const wrapper = mount(MfwDictFormat, {
        props: {
          value: 1,
          dict: mockDict
        }
      });

      expect(wrapper.text()).toBe('启用');
    });

    it('应正确匹配字符串值', () => {
      const wrapper = mount(MfwDictFormat, {
        props: {
          value: 'pending',
          dict: mockDict
        }
      });

      expect(wrapper.text()).toBe('待处理');
    });

    it('应正确匹配数字值', () => {
      const wrapper = mount(MfwDictFormat, {
        props: {
          value: 0,
          dict: mockDict
        }
      });

      expect(wrapper.text()).toBe('禁用');
    });
  });

  describe('空值处理', () => {
    it('应显示空值文本（null）', () => {
      const wrapper = mount(MfwDictFormat, {
        props: {
          value: null,
          dict: mockDict,
          emptyText: '未设置'
        }
      });

      expect(wrapper.text()).toBe('未设置');
    });

    it('应显示空值文本（undefined）', () => {
      const wrapper = mount(MfwDictFormat, {
        props: {
          value: undefined,
          dict: mockDict,
          emptyText: '--'
        }
      });

      expect(wrapper.text()).toBe('--');
    });

    it('应显示空值文本（未匹配）', () => {
      const wrapper = mount(MfwDictFormat, {
        props: {
          value: 'unknown',
          dict: mockDict,
          emptyText: '未知状态'
        }
      });

      expect(wrapper.text()).toBe('未知状态');
    });
  });

  describe('标签模式', () => {
    it('应以标签形式渲染（asTag=true）', () => {
      const wrapper = mount(MfwDictFormat, {
        props: {
          value: 1,
          dict: mockDict,
          asTag: true
        }
      });

      // 检查是否存在 el-tag 类
      expect(wrapper.find('.el-tag').exists()).toBe(true);
      expect(wrapper.text()).toBe('启用');
    });

    it('标签应使用正确的类型', () => {
      const wrapper = mount(MfwDictFormat, {
        props: {
          value: 0,
          dict: mockDict,
          asTag: true
        }
      });

      // danger 类型对应禁用状态
      const tag = wrapper.find('.el-tag');
      expect(tag.classes()).toContain('el-tag--danger');
    });
  });

  describe('自定义类名', () => {
    it('应应用自定义类名', () => {
      const wrapper = mount(MfwDictFormat, {
        props: {
          value: 1,
          dict: mockDict,
          className: 'custom-class'
        }
      });

      expect(wrapper.find('.custom-class').exists()).toBe(true);
    });
  });

  describe('事件处理', () => {
    it('应触发 click 事件并返回字典项', async () => {
      const onClick = vi.fn();
      const wrapper = mount(MfwDictFormat, {
        props: {
          value: 1,
          dict: mockDict,
          onClick
        }
      });

      await wrapper.find('.mfw-dict-format').trigger('click');
      expect(onClick).toHaveBeenCalled();
      // 检查回调参数是否为匹配的字典项
      const callArg = onClick.mock.calls[0][0];
      expect(callArg).toEqual(mockDict[0]);
    });

    it('点击未匹配项时应返回 null', async () => {
      const onClick = vi.fn();
      const wrapper = mount(MfwDictFormat, {
        props: {
          value: 'unknown',
          dict: mockDict,
          emptyText: '未知',
          onClick
        }
      });

      await wrapper.find('.mfw-dict-format').trigger('click');
      expect(onClick).toHaveBeenCalledWith(null);
    });
  });

  describe('插槽', () => {
    it('应支持默认插槽覆盖', () => {
      const wrapper = mount(MfwDictFormat, {
        props: {
          value: 1,
          dict: mockDict
        },
        slots: {
          default: () => '自定义显示'
        }
      });

      expect(wrapper.text()).toBe('自定义显示');
    });
  });

  describe('边界情况', () => {
    it('应处理空字典', () => {
      const wrapper = mount(MfwDictFormat, {
        props: {
          value: 1,
          dict: [],
          emptyText: '无数据'
        }
      });

      expect(wrapper.text()).toBe('无数据');
    });

    it('应处理值为 0 的情况', () => {
      const wrapper = mount(MfwDictFormat, {
        props: {
          value: 0,
          dict: mockDict
        }
      });

      expect(wrapper.text()).toBe('禁用');
    });

    it('应处理值为空字符串的情况', () => {
      const wrapper = mount(MfwDictFormat, {
        props: {
          value: '',
          dict: mockDict,
          emptyText: '空值'
        }
      });

      expect(wrapper.text()).toBe('空值');
    });
  });
});
