/**
 * @fileoverview MfwDateFormat 组件单元测试
 */

import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import MfwDateFormat from '../date-format';

describe('MfwDateFormat', () => {
  describe('基础渲染', () => {
    it('应正确渲染默认格式化的日期', () => {
      const date = new Date('2026-03-29 14:30:45');
      const wrapper = mount(MfwDateFormat, {
        props: {
          value: date
        }
      });

      expect(wrapper.text()).toContain('2026-03-29');
      expect(wrapper.text()).toContain('14:30:45');
    });

    it('应正确格式化日期字符串', () => {
      const wrapper = mount(MfwDateFormat, {
        props: {
          value: '2026-03-29',
          fmt: 'YYYY-MM-DD'
        }
      });

      expect(wrapper.text()).toBe('2026-03-29');
    });

    it('应正确格式化时间戳', () => {
      const timestamp = new Date('2026-03-29').getTime();
      const wrapper = mount(MfwDateFormat, {
        props: {
          value: timestamp,
          fmt: 'YYYY-MM-DD'
        }
      });

      expect(wrapper.text()).toBe('2026-03-29');
    });
  });

  describe('空值处理', () => {
    it('应显示空值文本（null）', () => {
      const wrapper = mount(MfwDateFormat, {
        props: {
          value: null,
          emptyText: '未设置'
        }
      });

      expect(wrapper.text()).toBe('未设置');
    });

    it('应显示空值文本（undefined）', () => {
      const wrapper = mount(MfwDateFormat, {
        props: {
          value: undefined,
          emptyText: '--'
        }
      });

      expect(wrapper.text()).toBe('--');
    });

    it('应显示空值文本（空字符串）', () => {
      const wrapper = mount(MfwDateFormat, {
        props: {
          value: '',
          emptyText: '暂无数据'
        }
      });

      expect(wrapper.text()).toBe('暂无数据');
    });
  });

  describe('格式模板', () => {
    it('应支持 YYYY-MM-DD 格式', () => {
      const wrapper = mount(MfwDateFormat, {
        props: {
          value: '2026-03-29 14:30:45',
          fmt: 'YYYY-MM-DD'
        }
      });

      expect(wrapper.text()).toBe('2026-03-29');
    });

    it('应支持 HH:mm:ss 格式', () => {
      const wrapper = mount(MfwDateFormat, {
        props: {
          value: '2026-03-29 14:30:45',
          fmt: 'HH:mm:ss'
        }
      });

      expect(wrapper.text()).toBe('14:30:45');
    });

    it('应支持完整日期时间格式', () => {
      const wrapper = mount(MfwDateFormat, {
        props: {
          value: '2026-03-29 14:30:45',
          fmt: 'YYYY年MM月DD日 HH时mm分ss秒'
        }
      });

      expect(wrapper.text()).toBe('2026年03月29日 14时30分45秒');
    });

    it('应支持两位年份格式', () => {
      const wrapper = mount(MfwDateFormat, {
        props: {
          value: '2026-03-29',
          fmt: 'YY-MM-DD'
        }
      });

      expect(wrapper.text()).toBe('26-03-29');
    });
  });

  describe('事件处理', () => {
    it('应触发 click 事件', async () => {
      const onClick = vi.fn();
      const wrapper = mount(MfwDateFormat, {
        props: {
          value: '2026-03-29',
          onClick
        }
      });

      await wrapper.find('.mfw-date-format').trigger('click');
      expect(onClick).toHaveBeenCalled();
    });
  });

  describe('插槽', () => {
    it('应支持默认插槽覆盖', () => {
      const wrapper = mount(MfwDateFormat, {
        props: {
          value: '2026-03-29'
        },
        slots: {
          default: () => '自定义内容'
        }
      });

      expect(wrapper.text()).toBe('自定义内容');
    });
  });

  describe('边界情况', () => {
    it('应处理无效日期字符串', () => {
      const wrapper = mount(MfwDateFormat, {
        props: {
          value: 'invalid-date',
          fmt: 'YYYY-MM-DD'
        }
      });

      // 无效日期应显示原值
      expect(wrapper.text()).toBe('invalid-date');
    });

    it('应处理无效时间戳', () => {
      const wrapper = mount(MfwDateFormat, {
        props: {
          value: NaN,
          fmt: 'YYYY-MM-DD'
        }
      });

      expect(wrapper.text()).toBe('NaN');
    });

    it('应正确处理零值时间戳', () => {
      const wrapper = mount(MfwDateFormat, {
        props: {
          value: 0,
          fmt: 'YYYY-MM-DD'
        }
      });

      // 0 是有效的 Unix 时间戳（1970-01-01）
      expect(wrapper.text()).toBe('1970-01-01');
    });
  });
});
