/**
 * @fileoverview 偏好设置面板组件测试。
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import SettingsPanel from './SettingsPanel.vue';
import type { LayoutStyleConfig } from '../../types/layout-types';

vi.mock('../../composables/use-color-mode', () => ({
  useColorMode: () => ({
    isDark: { value: false },
    colorMode: { value: 'system' },
    setColorMode: vi.fn(),
  }),
}));

vi.mock('../../composables/use-theme-switch', () => ({
  useThemeSwitch: () => ({
    setTheme: vi.fn(),
    availableThemes: { value: [] },
  }),
}));

const ElDrawerStub = {
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
  },
  template: '<div v-if="modelValue"><slot /></div>',
};

const ElButtonStub = {
  emits: ['click'],
  template: '<button v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>',
};

const passthroughStub = {
  template: '<div><slot /></div>',
};

const styleConfig: LayoutStyleConfig = {
  layoutMode: 'sidebar',
  sidebarWidth: 236,
  headerHeight: 64,
  contentMaxWidth: 1360,
  compact: false,
  fixedHeader: true,
  showBreadcrumb: true,
  showTabs: true,
  cardRadius: 12,
  buttonRadius: 6,
  colorMode: 'system',
  themePackage: 'default',
};

function createWrapper() {
  setActivePinia(createPinia());

  return mount(SettingsPanel, {
    props: {
      modelValue: true,
      isMobile: false,
      layoutModeOptions: [
        { label: '侧边栏', value: 'sidebar' },
        { label: '顶部菜单', value: 'top' },
        { label: '双栏菜单', value: 'dual' },
      ],
      themeOptions: [
        { name: 'default', label: '默认', colors: { primary: '#409eff', success: '#67c23a', warning: '#e6a23c', danger: '#f56c6c', info: '#909399' } },
        { name: 'sunset', label: '落日橙', colors: { primary: '#e6a23c', success: '#67c23a', warning: '#e6a23c', danger: '#f56c6c', info: '#909399' } },
      ],
      styleConfig,
      getThemeColor: () => '#2f6ef6',
    },
    global: {
      stubs: {
        ElDrawer: ElDrawerStub,
        ElScrollbar: passthroughStub,
        ElTabs: passthroughStub,
        ElTabPane: passthroughStub,
        ElFormItem: passthroughStub,
        ElIcon: passthroughStub,
        ElSwitch: passthroughStub,
        ElSlider: passthroughStub,
        ElButton: ElButtonStub,
        LayoutModeIcon: passthroughStub,
      },
    },
  });
}

describe('SettingsPanel', () => {
  it('emits preview-change when layout mode changes', async () => {
    const wrapper = createWrapper();
    const modeCards = wrapper.findAll('.mfw-admin-layout-mode-card');

    await modeCards[1].trigger('click');

    const events = wrapper.emitted('preview-change');
    expect(events).toBeTruthy();
    const lastPayload = events?.at(-1)?.[0] as Partial<LayoutStyleConfig> | undefined;
    expect(lastPayload?.layoutMode).toBe('top');
  });

  it('emits save-settings with the latest draft', async () => {
    const wrapper = createWrapper();
    const modeCards = wrapper.findAll('.mfw-admin-layout-mode-card');

    await modeCards[1].trigger('click');
    await wrapper.find('.mfw-admin-settings-save').trigger('click');

    const events = wrapper.emitted('save-settings');
    const payload = events?.[0]?.[0] as LayoutStyleConfig | undefined;
    expect(events).toBeTruthy();
    expect(payload?.layoutMode).toBe('top');
  });

  it('restores opening config after close and reopen', async () => {
    const wrapper = createWrapper();
    const modeCards = wrapper.findAll('.mfw-admin-layout-mode-card');

    await modeCards[1].trigger('click');
    await wrapper.setProps({ modelValue: false });
    await wrapper.setProps({ modelValue: true });

    const refreshedCards = wrapper.findAll('.mfw-admin-layout-mode-card');
    expect(refreshedCards[0].classes()).toContain('is-active');
    expect(refreshedCards[1].classes()).not.toContain('is-active');
  });
});