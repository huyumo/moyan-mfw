/**
 * @fileoverview 閻犱礁澧介悿鍡涙閵忊剝绶查柛妤佹礀閸樻挸霉鐎ｎ厾妲搁柕? */

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import SettingsPanel from './SettingsPanel.vue';
import type { LayoutStyleConfig } from '../../types/layout-types';

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
  theme: 'default',
  layoutMode: 'sidebar',
  sidebarWidth: 236,
  headerHeight: 64,
  contentMaxWidth: 1360,
  compact: false,
  fixedHeader: true,
  showBreadcrumb: true,
  showTabs: true,
  colorScheme: 'light',
  isDark: false,
  darkSidebar: false,
  darkSidebarChildren: false,
  darkHeader: false,
  cardRadius: 12,
};

function createWrapper() {
  return mount(SettingsPanel, {
    props: {
      modelValue: true,
      isMobile: false,
      systemPrefersDark: false,
      layoutModeOptions: [
        { label: '\u4fa7\u8fb9\u680f', value: 'sidebar' },
        { label: '\u9876\u90e8\u83dc\u5355', value: 'top' },
        { label: '\u53cc\u680f\u83dc\u5355', value: 'dual' },
      ],
      themeOptions: [
        { key: 'default', label: '\u9ed8\u8ba4' },
        { key: 'sunset', label: '\u843d\u65e5\u6a59' },
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
