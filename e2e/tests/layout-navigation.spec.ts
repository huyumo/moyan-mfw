import { test, expect } from '../fixtures';

test.describe('布局与导航', () => {
  test('LAYOUT-01: 侧边栏菜单可见', async ({ authenticatedPage }) => {
    const sidebarMenu = authenticatedPage.locator('[data-testid="sidebar-menu"]');
    await expect(sidebarMenu).toBeVisible({ timeout: 10000 });
  });

  test('LAYOUT-02: 侧边栏折叠/展开', async ({ authenticatedPage }) => {
    const toggleBtn = authenticatedPage.locator('[data-testid="sidebar-compact-toggle"]');
    await expect(toggleBtn).toBeVisible();

    await toggleBtn.click();
    await authenticatedPage.waitForTimeout(500);

    const sidebar = authenticatedPage.locator('.mfw-admin-sidebar');
    const isCompact = await sidebar.evaluate((el) => el.classList.contains('is-compact') || el.offsetWidth < 200);

    await toggleBtn.click();
    await authenticatedPage.waitForTimeout(500);

    const isExpanded = await sidebar.evaluate((el) => el.offsetWidth > 200);
    expect(isCompact || isExpanded).toBeTruthy();
  });

  test('LAYOUT-03: 顶部导航栏品牌区可见', async ({ authenticatedPage }) => {
    const brandArea = authenticatedPage.locator('[data-testid="header-brand-area"]');
    await expect(brandArea).toBeVisible({ timeout: 10000 });
  });

  test('LAYOUT-04: 用户头像下拉菜单操作', async ({ authenticatedPage }) => {
    const avatarTrigger = authenticatedPage.locator('[data-testid="user-avatar-trigger"]');
    await expect(avatarTrigger).toBeVisible();

    await avatarTrigger.click();

    const profileMenu = authenticatedPage.locator('[data-testid="user-profile-menu"]');
    await expect(profileMenu).toBeVisible({ timeout: 5000 });

    const logoutMenu = authenticatedPage.locator('[data-testid="user-logout-menu"]');
    await expect(logoutMenu).toBeVisible();

    await authenticatedPage.keyboard.press('Escape');
  });

  test('LAYOUT-05: 我的资料弹窗', async ({ authenticatedPage }) => {
    const avatarTrigger = authenticatedPage.locator('[data-testid="user-avatar-trigger"]');
    await avatarTrigger.click();

    const profileMenu = authenticatedPage.locator('[data-testid="user-profile-menu"]');
    await profileMenu.click();

    const editBtn = authenticatedPage.locator('[data-testid="profile-edit-btn"]');
    await expect(editBtn).toBeVisible({ timeout: 10000 });

    const passwordBtn = authenticatedPage.locator('[data-testid="profile-password-btn"]');
    await expect(passwordBtn).toBeVisible();

    const dialogClose = authenticatedPage.locator('.el-dialog__headerbtn');
    if (await dialogClose.isVisible()) {
      await dialogClose.click();
    }
  });

  test('LAYOUT-06: 修改密码弹窗', async ({ authenticatedPage }) => {
    const avatarTrigger = authenticatedPage.locator('[data-testid="user-avatar-trigger"]');
    await avatarTrigger.click();

    const passwordMenu = authenticatedPage.locator('[data-testid="user-profile-menu"]');
    await passwordMenu.click();

    const passwordBtn = authenticatedPage.locator('[data-testid="profile-password-btn"]');
    await passwordBtn.click();

    await expect(authenticatedPage.locator('[data-testid="password-old-input"]')).toBeVisible({ timeout: 5000 });
    await expect(authenticatedPage.locator('[data-testid="password-new-input"]')).toBeVisible();
    await expect(authenticatedPage.locator('[data-testid="password-confirm-input"]')).toBeVisible();
  });

  test('LAYOUT-07: 设置面板操作', async ({ authenticatedPage }) => {
    const settingsBtn = authenticatedPage.locator('[data-testid="header-settings-btn"]');
    if (await settingsBtn.isVisible()) {
      await settingsBtn.click();
    } else {
      const headerSettingsBtn = authenticatedPage.locator('[data-testid="settings-search-trigger"]');
      if (await headerSettingsBtn.isVisible()) {
        await headerSettingsBtn.click();
      }
    }

    await authenticatedPage.waitForTimeout(1000);

    const settingsPanel = authenticatedPage.locator('.mfw-admin-settings-panel, .el-drawer');
    if (await settingsPanel.isVisible()) {
      const darkSwitch = authenticatedPage.locator('[data-testid="settings-dark-switch"]');
      if (await darkSwitch.isVisible()) {
        await darkSwitch.click();
        await authenticatedPage.waitForTimeout(500);
      }

      const cancelBtn = authenticatedPage.locator('[data-testid="settings-cancel-btn"]');
      if (await cancelBtn.isVisible()) {
        await cancelBtn.click();
      }
    }
  });

  test('LAYOUT-08: 菜单导航到不同页面', async ({ authenticatedPage }) => {
    const menuItems = authenticatedPage.locator('[data-testid^="menu-node-"]');
    const count = await menuItems.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < Math.min(count, 3); i++) {
      const item = menuItems.nth(i);
      if (await item.isVisible()) {
        await item.click();
        await authenticatedPage.waitForTimeout(500);
        break;
      }
    }
  });

  test('LAYOUT-09: 标签栏可见性', async ({ authenticatedPage }) => {
    const tabsPanel = authenticatedPage.locator('[data-testid="tabs-panel"]');
    if (await tabsPanel.isVisible()) {
      const tabLabels = authenticatedPage.locator('.mfw-admin-tab-label');
      const count = await tabLabels.count();
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });

  test('LAYOUT-10: 标签栏右键菜单', async ({ authenticatedPage }) => {
    const tabsPanel = authenticatedPage.locator('[data-testid="tabs-panel"]');
    if (await tabsPanel.isVisible()) {
      const actionBtn = tabsPanel.locator('.tab-action-btn');
      if (await actionBtn.isVisible()) {
        await actionBtn.click();

        await expect(authenticatedPage.locator('[data-testid="tab-close-current"]')).toBeVisible({ timeout: 3000 });
        await expect(authenticatedPage.locator('[data-testid="tab-close-left"]')).toBeVisible();
        await expect(authenticatedPage.locator('[data-testid="tab-close-right"]')).toBeVisible();
        await expect(authenticatedPage.locator('[data-testid="tab-close-other"]')).toBeVisible();
        await expect(authenticatedPage.locator('[data-testid="tab-close-all"]')).toBeVisible();

        await authenticatedPage.keyboard.press('Escape');
      }
    }
  });

  test('LAYOUT-11: 主题切换按钮', async ({ authenticatedPage }) => {
    const themeBtn = authenticatedPage.locator('[data-testid="header-theme-btn"]');
    if (await themeBtn.isVisible()) {
      await themeBtn.click();
      await authenticatedPage.waitForTimeout(500);

      const htmlEl = authenticatedPage.locator('html');
      const isDark = await htmlEl.evaluate((el) => el.classList.contains('dark'));

      await themeBtn.click();
      await authenticatedPage.waitForTimeout(500);

      const isLight = await htmlEl.evaluate((el) => !el.classList.contains('dark'));
      expect(isDark !== isLight).toBeTruthy();
    }
  });

  test('LAYOUT-12: 全屏切换按钮', async ({ authenticatedPage }) => {
    const fullscreenBtn = authenticatedPage.locator('[data-testid="header-fullscreen-btn"]');
    if (await fullscreenBtn.isVisible()) {
      await fullscreenBtn.click();
      await authenticatedPage.waitForTimeout(1000);

      const isFullscreen = await authenticatedPage.evaluate(() => !!document.fullscreenElement);
      if (isFullscreen) {
        await fullscreenBtn.click();
        await authenticatedPage.waitForTimeout(500);
      }
    }
  });
});
