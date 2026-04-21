/**
 * @fileoverview 布局组件事件转发测试。
 */

import { mount } from '@vue/test-utils';
import { computed, ref } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { describe, expect, it, vi } from 'vitest';
import AdminLayout from './AdminLayout.vue';

const handlePreviewChange = vi.fn();
const handleSaveSettings = vi.fn();

vi.mock('./composables/use-admin-layout', () => ({
  useAdminLayout: () => ({
    layoutStore: {
      styleConfig: {
        fixedHeader: true,
        compact: false,
        showTabs: true,
        colorMode: 'light',
        themePackage: 'default',
      },
      showSidebar: true,
      navigation: {
        brandName: 'moyan',
        brandTagline: 'admin',
        topNav: [],
        homePath: '/dashboard',
      },
      layoutExtensions: {},
      settingsPanelOpen: true,
      themeOptions: [{ name: 'default', label: 'default', colors: { primary: '#409eff', success: '#67c23a', warning: '#e6a23c', danger: '#f56c6c', info: '#909399' } }],
      visitedTabs: [],
      toggleCompact: vi.fn(),
      toggleSettingsPanel: vi.fn(),
    },
    mobileMenuOpen: ref(false),
    resetConfirmVisible: ref(false),
    isMobile: ref(false),
    layoutModeOptions: [
      { label: '侧边栏', value: 'sidebar' },
      { label: '顶部菜单', value: 'top' },
    ],
    shellClasses: computed(() => ({})),
    topLevelMenus: computed(() => []),
    activeTopMenuKey: computed(() => ''),
    showPrimaryTopMenus: computed(() => false),
    displayedSideMenus: computed(() => []),
    activeMenuPath: computed(() => '/dashboard'),
    activeTabPath: computed({
      get: () => '/dashboard',
      set: vi.fn(),
    }),
    handleTopMenuClick: vi.fn(),
    toggleMobileMenu: vi.fn(),
    handleResetDefaults: vi.fn(),
    confirmResetDefaults: vi.fn(),
    removeTab: vi.fn(),
    handleTabCommand: vi.fn(),
    handleUserCommand: vi.fn(),
    handlePreviewChange,
    handleSaveSettings,
    getThemeColor: vi.fn(() => '#2f6ef6'),
  }),
}));

vi.mock('./composables/use-color-mode', () => ({
  useColorMode: () => ({
    isDark: { value: false },
    colorMode: { value: 'light' },
    setColorMode: vi.fn(),
  }),
}));

describe('AdminLayout', () => {
  it('forwards preview and save events from SettingsPanel', async () => {
    setActivePinia(createPinia());

    const wrapper = mount(AdminLayout, {
      global: {
        stubs: {
          HeaderPanel: { template: '<div />' },
          AsidePanel: { template: '<div />' },
          MainPanel: { template: '<div><slot /></div>' },
          SettingsPanel: {
            emits: ['preview-change', 'save-settings'],
            template: `
              <div>
                <button class="settings-preview" @click="$emit('preview-change', { layoutMode: 'top' })">preview</button>
                <button class="settings-save" @click="$emit('save-settings', { themePackage: 'sunset' })">save</button>
              </div>
            `,
          },
          ElDialog: { template: '<div><slot /><slot name="footer" /></div>' },
          ElButton: { template: '<button><slot /></button>' },
          RouterView: { template: '<div />' },
        },
      },
    });

    await wrapper.find('.settings-preview').trigger('click');
    await wrapper.find('.settings-save').trigger('click');

    expect(handlePreviewChange).toHaveBeenCalledTimes(1);
    expect(handlePreviewChange).toHaveBeenCalledWith({ layoutMode: 'top' });
    expect(handleSaveSettings).toHaveBeenCalledTimes(1);
    expect(handleSaveSettings).toHaveBeenCalledWith({ themePackage: 'sunset' });
  });
});