/**
 * @fileoverview 布局组件事件转发测试。
 */

import { mount } from '@vue/test-utils';
import { computed, ref } from 'vue';
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
        isDark: false,
        darkSidebar: false,
        darkSidebarChildren: false,
        darkHeader: false,
        showBreadcrumb: true,
        showTabs: true,
        colorScheme: 'light',
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
      themeOptions: [{ key: 'default', label: 'default' }],
      visitedTabs: [],
      toggleCompact: vi.fn(),
      setDarkMode: vi.fn(),
      toggleSettingsPanel: vi.fn(),
    },
    mobileMenuOpen: ref(false),
    resetConfirmVisible: ref(false),
    isMobile: ref(false),
    systemPrefersDark: ref(false),
    layoutModeOptions: [
      { label: '\u4fa7\u8fb9\u680f', value: 'sidebar' },
      { label: '\u9876\u90e8\u83dc\u5355', value: 'top' },
    ],
    shellVars: computed(() => ({})),
    shellClasses: computed(() => ({})),
    currentTitle: computed(() => '\u9996\u9875'),
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

describe('AdminLayout', () => {
  it('forwards preview and save events from SettingsPanel', async () => {
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
                <button class="settings-save" @click="$emit('save-settings', { theme: 'sunset' })">save</button>
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
    expect(handleSaveSettings).toHaveBeenCalledWith({ theme: 'sunset' });
  });
});
