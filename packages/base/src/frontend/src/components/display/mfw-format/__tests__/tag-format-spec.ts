/**
 * @fileoverview MfwTagFormat 组件单元测试
 */

import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import MfwTagFormat from '../../tag-format';

describe('MfwTagFormat', () => {
  describe('基础渲染', () => {
    it('应正确渲染标签文本', () => {
      const wrapper = mount(MfwTagFormat, {
        props: {
          value: '已完成'
        }
      });

      expect(wrapper.text()).toBe('已完成');
    });

    it('应渲染为 ElTag 组件', () => {
      const wrapper = mount(MfwTagFormat, {
        props: {
          value: '测试'
        }
      });

      expect(wrapper.find('.el-tag').exists()).toBe(true);
    });
  });

  describe('标签类型', () => {
    it('应支持 success 类型', () => {
      const wrapper = mount(MfwTagFormat, {
        props: {
          value: '成功',
          type: 'success'
        }
      });

      expect(wrapper.find('.el-tag--success').exists()).toBe(true);
    });

    it('应支持 danger 类型', () => {
      const wrapper = mount(MfwTagFormat, {
        props: {
          value: '失败',
          type: 'danger'
        }
      });

      expect(wrapper.find('.el-tag--danger').exists()).toBe(true);
    });

    it('应支持 warning 类型', () => {
      const wrapper = mount(MfwTagFormat, {
        props: {
          value: '警告',
          type: 'warning'
        }
      });

      expect(wrapper.find('.el-tag--warning').exists()).toBe(true);
    });

    it('应支持 info 类型', () => {
      const wrapper = mount(MfwTagFormat, {
        props: {
          value: '信息',
          type: 'info'
        }
      });

      expect(wrapper.find('.el-tag--info').exists()).toBe(true);
    });

    it('应支持 primary 类型', () => {
      const wrapper = mount(MfwTagFormat, {
        props: {
          value: '主要',
          type: 'primary'
        }
      });

      expect(wrapper.find('.el-tag--primary').exists()).toBe(true);
    });
  });

  describe('空值处理', () => {
    it('应显示空值文本（null）', () => {
      const wrapper = mount(MfwTagFormat, {
        props: {
          value: null,
          emptyText: '无状态'
        }
      });

      expect(wrapper.text()).toBe('无状态');
    });

    it('应显示空值文本（undefined）', () => {
      const wrapper = mount(MfwTagFormat, {
        props: {
          value: undefined,
          emptyText: '--'
        }
      });

      expect(wrapper.text()).toBe('--');
    });

    it('应显示空值文本（空字符串）', () => {
      const wrapper = mount(MfwTagFormat, {
        props: {
          value: '',
          emptyText: '未设置'
        }
      });

      expect(wrapper.text()).toBe('未设置');
    });
  });

  describe('圆角样式', () => {
    it('圆角默认为开启状态', () => {
      const wrapper = mount(MfwTagFormat, {
        props: {
          value: '圆角'
        }
      });

      // 组件默认 round=true，渲染 el-tag
      expect(wrapper.find('.el-tag').exists()).toBe(true);
    });
  });

  describe('效果样式', () => {
    it('应支持 dark 效果', () => {
      const wrapper = mount(MfwTagFormat, {
        props: {
          value: '深色',
          effect: 'dark'
        }
      });

      expect(wrapper.find('.el-tag--dark').exists()).toBe(true);
    });

    it('应支持 plain 效果', () => {
      const wrapper = mount(MfwTagFormat, {
        props: {
          value: '朴素',
          effect: 'plain'
        }
      });

      expect(wrapper.find('.el-tag--plain').exists()).toBe(true);
    });

    it('应支持 plain 效果（默认）', () => {
      const wrapper = mount(MfwTagFormat, {
        props: {
          value: '朴素'
        }
      });

      expect(wrapper.find('.el-tag--plain').exists()).toBe(true);
    });
  });

  describe('自动颜色', () => {
    it('应支持自动颜色（autoColor=true）', () => {
      const wrapper = mount(MfwTagFormat, {
        props: {
          value: '自动颜色',
          autoColor: true
        }
      });

      // 自动颜色会设置行内样式
      const tag = wrapper.find('.el-tag');
      expect(tag.attributes('style')).toBeTruthy();
    });
  });

  describe('事件处理', () => {
    it('应触发 click 事件', async () => {
      const onClick = vi.fn();
      const wrapper = mount(MfwTagFormat, {
        props: {
          value: '点击我',
          onClick
        }
      });

      await wrapper.find('.el-tag').trigger('click');
      expect(onClick).toHaveBeenCalled();
    });
  });

  describe('自定义类名', () => {
    it('应应用自定义类名', () => {
      const wrapper = mount(MfwTagFormat, {
        props: {
          value: '测试',
          className: 'my-tag'
        }
      });

      expect(wrapper.find('.my-tag').exists()).toBe(true);
    });
  });

  describe('边界情况', () => {
    it('应处理较长的文本', () => {
      const longText = '这是一个非常长的标签文本用于测试溢出处理';
      const wrapper = mount(MfwTagFormat, {
        props: {
          value: longText
        }
      });

      expect(wrapper.text()).toBe(longText);
    });

    it('应处理包含特殊字符的文本', () => {
      const specialText = '<script>alert("xss")</script>';
      const wrapper = mount(MfwTagFormat, {
        props: {
          value: specialText
        }
      });

      // Vue 会自动转义 HTML 特殊字符
      expect(wrapper.text()).toBe(specialText);
      expect(wrapper.html()).not.toContain('<script>');
    });

    it('应处理数字类型的值', () => {
      const wrapper = mount(MfwTagFormat, {
        props: {
          value: 123
        }
      });

      expect(wrapper.text()).toBe('123');
    });
  });
});
