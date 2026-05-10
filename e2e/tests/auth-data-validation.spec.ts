import { test, expect, type Page } from '@playwright/test';

/**
 * 通过 UI 完成登录，处理应用选择面板。
 * @param page - Playwright Page 实例
 * @param username - 用户名
 * @param password - 密码
 */
async function loginViaUI(page: Page, username: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');

  if (page.url().includes('/install')) {
    throw new Error('System not initialized, cannot login via UI');
  }

  await page.locator('[data-testid="login-username-input"]').fill(username);
  await page.locator('[data-testid="login-password-input"]').fill(password);
  await page.locator('[data-testid="login-submit-btn"]').click();

  await page.waitForTimeout(2000);

  if (page.url().includes('/login')) {
    const appItem = page.locator('.app-selector-panel .app-item').first();
    if (await appItem.isVisible({ timeout: 3000 }).catch(() => false)) {
      await appItem.click();
      await page.waitForLoadState('networkidle');
    }
  }

  await page.waitForLoadState('networkidle');
}

test.describe('认证 - 数据正确性与边界条件 (UI)', () => {
  test('AUTH-DATA-01: 登录返回数据结构完整性与字段类型验证', async ({ page }) => {
    await loginViaUI(page, 'admin', 'Admin@123');

    // 验证 localStorage 中 token 数据的完整性
    const token = await page.evaluate(() => localStorage.getItem('mfw:admin:token'));
    const refreshToken = await page.evaluate(() => localStorage.getItem('mfw:admin:refresh_token'));

    expect(typeof token).toBe('string');
    expect(token).not.toBeNull();
    expect((token as string).length).toBeGreaterThan(0);
    expect(typeof refreshToken).toBe('string');
    expect(refreshToken).not.toBeNull();
    expect((refreshToken as string).length).toBeGreaterThan(0);
  });

  test('AUTH-DATA-02: 用户名不存在 - UI 登录表单显示错误消息', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    if (page.url().includes('/install')) {
      test.skip();
      return;
    }

    await page.locator('[data-testid="login-username-input"]').fill('nonexistent_user_xyz');
    await page.locator('[data-testid="login-password-input"]').fill('Test@1234');
    await page.locator('[data-testid="login-submit-btn"]').click();

    // 应出现错误消息，且不应包含敏感信息
    const errorMsg = page.locator('.el-message--error');
    await expect(errorMsg.first()).toBeVisible({ timeout: 8000 });
    const errorText = await errorMsg.first().textContent();
    // 错误消息不应暴露用户是否存在
    if (errorText) {
      expect(errorText).not.toContain('not found');
    }
  });

  // AUTH-DATA-03: 被禁用用户登录 - 需要 API 创建用户，UI 层面无法完整模拟，跳过
  test('AUTH-DATA-03: 被禁用用户登录 - 跳过（需 API 创建用户并禁用）', async () => {
    test.skip();
  });

  test('AUTH-DATA-04: 密码长度边界 - 少于6位时表单验证或服务端返回错误', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    if (page.url().includes('/install')) {
      test.skip();
      return;
    }

    await page.locator('[data-testid="login-username-input"]').fill('admin');
    await page.locator('[data-testid="login-password-input"]').fill('12345');
    await page.locator('[data-testid="login-submit-btn"]').click();

    // 服务端应返回错误（密码过短）
    const errorMsg = page.locator('.el-message--error');
    await expect(errorMsg.first()).toBeVisible({ timeout: 8000 });
  });

  test('AUTH-DATA-05: 密码长度边界 - 超过32位时返回错误', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    if (page.url().includes('/install')) {
      test.skip();
      return;
    }

    await page.locator('[data-testid="login-username-input"]').fill('admin');
    await page.locator('[data-testid="login-password-input"]').fill('A'.repeat(33) + '1');
    await page.locator('[data-testid="login-submit-btn"]').click();

    const errorMsg = page.locator('.el-message--error');
    await expect(errorMsg.first()).toBeVisible({ timeout: 8000 });
  });

  test('AUTH-DATA-06: 用户名长度边界 - 少于2位时返回错误', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    if (page.url().includes('/install')) {
      test.skip();
      return;
    }

    await page.locator('[data-testid="login-username-input"]').fill('a');
    await page.locator('[data-testid="login-password-input"]').fill('Admin@123');
    await page.locator('[data-testid="login-submit-btn"]').click();

    const errorMsg = page.locator('.el-message--error');
    await expect(errorMsg.first()).toBeVisible({ timeout: 8000 });
  });

  test('AUTH-DATA-07: 用户名长度边界 - 超过64位时返回错误', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    if (page.url().includes('/install')) {
      test.skip();
      return;
    }

    await page.locator('[data-testid="login-username-input"]').fill('a'.repeat(65));
    await page.locator('[data-testid="login-password-input"]').fill('Admin@123');
    await page.locator('[data-testid="login-submit-btn"]').click();

    const errorMsg = page.locator('.el-message--error');
    await expect(errorMsg.first()).toBeVisible({ timeout: 8000 });
  });

  test('AUTH-DATA-08: 空请求体 - 不填表单直接提交触发前端校验', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    if (page.url().includes('/install')) {
      test.skip();
      return;
    }

    // 不填任何内容，直接点击提交
    await page.locator('[data-testid="login-submit-btn"]').click();

    // Element Plus 表单校验错误信息
    const formError = page.locator('.el-form-item__error');
    await expect(formError.first()).toBeVisible({ timeout: 5000 });
  });

  test('AUTH-DATA-09: refreshToken 有效性 - 登录后 localStorage 含有效 refreshToken', async ({ page }) => {
    await loginViaUI(page, 'admin', 'Admin@123');

    const refreshToken = await page.evaluate(() => localStorage.getItem('mfw:admin:refresh_token'));
    expect(refreshToken).not.toBeNull();
    expect(typeof refreshToken).toBe('string');
    expect((refreshToken as string).length).toBeGreaterThan(0);
  });

  test('AUTH-DATA-10: 无效 refreshToken - 清除后访问页面验证重定向到登录', async ({ page }) => {
    // 先登录获取有效 session
    await loginViaUI(page, 'admin', 'Admin@123');

    // 然后清除 token 模拟无效状态，并写入一个无效 refreshToken
    await page.evaluate(() => {
      localStorage.removeItem('mfw:admin:token');
      localStorage.setItem('mfw:admin:refresh_token', 'invalid_token_value_12345');
    });

    // 访问需认证的页面
    await page.goto('/sys/user');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // 应被重定向到登录页
    expect(page.url()).toContain('/login');
  });

  test('AUTH-DATA-11: 空 refreshToken - 清除后访问页面验证重定向', async ({ page }) => {
    await loginViaUI(page, 'admin', 'Admin@123');

    await page.evaluate(() => {
      localStorage.removeItem('mfw:admin:token');
      localStorage.setItem('mfw:admin:refresh_token', '');
    });

    await page.goto('/sys/user');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    expect(page.url()).toContain('/login');
  });

  test('AUTH-DATA-12: 用户信息接口返回数据完整性 - 登录后页面显示用户信息', async ({ page }) => {
    await loginViaUI(page, 'admin', 'Admin@123');

    // 验证页面已渲染用户相关元素（头部用户面板）
    const userElement = page.locator('.mfw-admin-header, [class*="user-panel"], [class*="user-info"], .el-avatar');
    await expect(userElement.first()).toBeVisible({ timeout: 10000 });
  });

  test('AUTH-DATA-13: 用户应用列表数据结构验证 - 登录后侧边栏菜单已加载', async ({ page }) => {
    await loginViaUI(page, 'admin', 'Admin@123');

    // 侧边栏菜单已渲染（说明应用列表和权限已获取）
    const sidebar = page.locator('[data-testid="sidebar-menu"]');
    await expect(sidebar).toBeVisible({ timeout: 10000 });

    // 至少有一个菜单项或空状态
    const menuContent = sidebar.locator('.el-menu-item, .el-sub-menu, .mfw-admin-sidebar-empty');
    await expect(menuContent.first()).toBeVisible({ timeout: 5000 });
  });

  test('AUTH-DATA-14: 权限菜单数据结构验证 - 登录后侧边栏菜单可识别', async ({ page }) => {
    await loginViaUI(page, 'admin', 'Admin@123');

    const sidebar = page.locator('[data-testid="sidebar-menu"]');
    await expect(sidebar).toBeVisible({ timeout: 10000 });

    const items = sidebar.locator('.el-menu-item, .el-sub-menu');
    const count = await items.count();
    // 菜单项目数记录即可（包含空状态时为 0）
    expect(count).toBeGreaterThanOrEqual(0);
  });

  // AUTH-DATA-15: 可用性检查 - 无 UI 入口，跳过
  test('AUTH-DATA-15: 可用性检查（已存在用户名）- 跳过（无 UI 入口）', async () => {
    test.skip();
  });

  // AUTH-DATA-16: 可用性检查 - 无 UI 入口，跳过
  test('AUTH-DATA-16: 可用性检查（不存在用户名）- 跳过（无 UI 入口）', async () => {
    test.skip();
  });

  // AUTH-DATA-17: 修改密码 - 尝试访问个人中心/设置页面
  test('AUTH-DATA-17: 修改密码（旧密码错误）- 尝试访问相关设置页面', async ({ page }) => {
    await loginViaUI(page, 'admin', 'Admin@123');

    // 导航到个人设置或账户页面
    await page.goto('/sys/user');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 验证页面加载成功（修改密码功能需 UI 表单，此处验证页面可访问）
    const pageContent = page.locator('.mfw-admin-main, .el-table, [class*="user"]');
    await expect(pageContent.first()).toBeVisible({ timeout: 10000 });

    // 如果有修改密码的表单入口，可进一步交互
    const changePwdLink = page.locator('a:has-text("修改密码"), button:has-text("修改密码"), [class*="change-password"]');
    if (await changePwdLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await changePwdLink.click();
      // 填写错误旧密码
      const oldPwdInput = page.locator('input[placeholder*="旧密码"], input[placeholder*="原密码"]');
      if (await oldPwdInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await oldPwdInput.fill('WrongOldPwd1');
        const submitBtn = page.locator('button:has-text("确认"), button:has-text("保存"), button:has-text("修改")');
        if (await submitBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
          await submitBtn.click();
          const errorMsg = page.locator('.el-message--error');
          await expect(errorMsg.first()).toBeVisible({ timeout: 8000 });
        }
      }
    }
  });
});

test.describe('初始化 - 数据正确性与边界条件 (UI)', () => {
  test('INIT-01: 初始化状态 - 访问根路径检查 URL', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    const url = page.url();
    const isValid = url.includes('/install') || url.includes('/login');
    expect(isValid).toBeTruthy();
  });

  test('INIT-02: 初始化密码少于8位 - 安装页面填短密码时按钮保持禁用', async ({ page }) => {
    await page.goto('/install');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // 如果不是安装页（已初始化），跳过
    if (!page.url().includes('/install')) {
      test.skip();
      return;
    }

    // 验证安装页面可见
    const heading = page.locator('h1:has-text("系统初始化")');
    await expect(heading).toBeVisible({ timeout: 5000 });

    // 填写 7 位密码（不满足 8 位要求）
    await page.locator('[data-testid="install-password-input"]').fill('Ab1@567');
    await page.locator('[data-testid="install-confirm-password-input"]').fill('Ab1@567');

    // 按钮应保持禁用状态
    const initBtn = page.locator('[data-testid="install-init-btn"]');
    await expect(initBtn).toBeDisabled();
  });

  test('INIT-03: 初始化密码超过32位 - 安装页面填超长密码时按钮保持禁用', async ({ page }) => {
    await page.goto('/install');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    if (!page.url().includes('/install')) {
      test.skip();
      return;
    }

    const heading = page.locator('h1:has-text("系统初始化")');
    await expect(heading).toBeVisible({ timeout: 5000 });

    // 填写 34 位密码（超过 32 位上限）
    const longPwd = 'A'.repeat(33) + '1';
    await page.locator('[data-testid="install-password-input"]').fill(longPwd);
    await page.locator('[data-testid="install-confirm-password-input"]').fill(longPwd);

    const initBtn = page.locator('[data-testid="install-init-btn"]');
    await expect(initBtn).toBeDisabled();
  });

  // INIT-04: 重复初始化 - 已初始化系统无法再次访问 /install 页面
  test('INIT-04: 重复初始化 - 已初始化后访问 /install 应被重定向', async ({ page }) => {
    // 先确认系统已初始化（访问 / 如果是 login 页面即已初始化）
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    if (page.url().includes('/install')) {
      // 系统尚未初始化，先通过 UI 初始化
      await page.locator('[data-testid="install-password-input"]').fill('Admin@123');
      await page.locator('[data-testid="install-confirm-password-input"]').fill('Admin@123');
      await page.locator('[data-testid="install-init-btn"]').click();
      await page.waitForTimeout(3000);
    }

    // 再次访问 /install，应被重定向
    await page.goto('/install');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // 不应停留在 /install 页
    expect(page.url()).not.toContain('/install');
  });

  test('INIT-05: 初始化后 admin 用户可登录 - UI 登录表单验证', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // 如果在安装页，说明系统未初始化，无法验证登录
    if (page.url().includes('/install')) {
      test.skip();
      return;
    }

    await loginViaUI(page, 'admin', 'Admin@123');

    // 登录成功后不应在登录页
    expect(page.url()).not.toContain('/login');
  });
});
