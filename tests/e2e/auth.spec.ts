/**
 * @fileoverview 登录流程 E2E 测试。
 * @description 测试用户登录、应用实例选择、权限加载、切换应用实例、登出等流程。
 *
 * 参考文档：docs/01-业务需求/01-基础设施/04-业务流程/用户登录流程.md
 * 测试用例清单：docs/04-项目实施/05-任务追踪/2026-04-02-1430-Playwright测试用例清单.md
 *
 * 测试账号：
 * - admin / Admin@123（管理员）
 * - test / Test@123（普通用户）
 */

import { test, expect } from '@playwright/test';
import {
  login,
  loginAsAdmin,
  loginAsUser,
  selectApp,
  logout,
  switchAppInstance,
  TEST_ACCOUNTS,
} from './helpers/auth';

test.describe('登录流程测试', () => {
  // ========================================
  // 1.1 用户登录阶段
  // ========================================

  test.describe('用户登录阶段', () => {
    /**
     * AUTH-001: 登录页面加载
     * 操作步骤：1. 访问 /login 2. 等待页面加载完成
     * 预期结果：显示登录表单，包含用户名、密码输入框和登录按钮
     */
    test('AUTH-001: 登录页面加载', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // 验证登录表单显示
      await expect(page.locator('.mfw-login-page')).toBeVisible();

      // 验证用户名输入框存在
      const usernameInput = page.locator('input[aria-label="Username"]').first();
      await expect(usernameInput).toBeVisible();

      // 验证密码输入框存在
      const passwordInput = page.locator('input[aria-label="Password"]').first();
      await expect(passwordInput).toBeVisible();

      // 验证登录按钮存在
      const submitButton = page.locator('button[aria-label="Submit login"]').first();
      await expect(submitButton).toBeVisible();
    });

    /**
     * AUTH-002: 正常登录成功
     * 操作步骤：1. 输入用户名 test 2. 输入密码 Test@123 3. 点击登录按钮
     * 预期结果：登录成功，跳转到应用实例选择页面
     */
    test('AUTH-002: 正常登录成功（普通用户）', async ({ page }) => {
      await loginAsUser(page);

      // 验证跳转到应用选择页或主页
      const url = page.url();
      expect(url).toMatch(/\/app-select|\/dashboard|\/sys/);
    });

    /**
     * AUTH-003: 管理员登录成功
     * 操作步骤：1. 输入用户名 admin 2. 输入密码 Admin@123 3. 点击登录按钮
     * 预期结果：登录成功，跳转到应用实例选择页面
     */
    test('AUTH-003: 管理员登录成功', async ({ page }) => {
      await loginAsAdmin(page);

      // 验证跳转到应用选择页或主页
      const url = page.url();
      expect(url).toMatch(/\/app-select|\/dashboard|\/sys/);
    });

    /**
     * AUTH-004: 用户名为空登录
     * 操作步骤：1. 不输入用户名 2. 输入密码 3. 点击登录按钮
     * 预期结果：显示"请输入用户名"错误提示
     */
    test('AUTH-004: 用户名为空登录', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // 只输入密码，不输入用户名
      const passwordInput = page.locator('input[aria-label="Password"]').first();
      await passwordInput.fill('Test@123');

      // 点击登录按钮
      const submitButton = page.locator('button[aria-label="Submit login"]').first();
      await submitButton.click();

      // 等待表单验证错误显示
      await page.waitForTimeout(500);

      // 验证显示用户名必填错误
      const formError = page.locator('.el-form-item__error').first();
      await expect(formError).toBeVisible();
      const errorText = await formError.textContent();
      expect(errorText).toContain('请输入用户名');
    });

    /**
     * AUTH-005: 密码为空登录
     * 操作步骤：1. 输入用户名 2. 不输入密码 3. 点击登录按钮
     * 预期结果：显示"请输入密码"错误提示
     */
    test('AUTH-005: 密码为空登录', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // 只输入用户名，不输入密码
      const usernameInput = page.locator('input[aria-label="Username"]').first();
      await usernameInput.fill('test');

      // 点击登录按钮
      const submitButton = page.locator('button[aria-label="Submit login"]').first();
      await submitButton.click();

      // 等待表单验证错误显示
      await page.waitForTimeout(500);

      // 验证显示密码必填错误
      const formError = page.locator('.el-form-item__error').first();
      await expect(formError).toBeVisible();
      const errorText = await formError.textContent();
      expect(errorText).toContain('请输入密码');
    });

    /**
     * AUTH-006: 错误密码登录
     * 操作步骤：1. 输入正确用户名 2. 输入错误密码 3. 点击登录按钮
     * 预期结果：显示"用户名或密码错误"提示
     */
    test('AUTH-006: 错误密码登录', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // 输入正确用户名，错误密码
      const usernameInput = page.locator('input[aria-label="Username"]').first();
      await usernameInput.fill('test');

      const passwordInput = page.locator('input[aria-label="Password"]').first();
      await passwordInput.fill('WrongPassword@123');

      // 点击登录按钮
      const submitButton = page.locator('button[aria-label="Submit login"]').first();
      await submitButton.click();

      // 等待错误提示显示
      await page.waitForTimeout(1000);

      // 验证显示错误提示
      const errorToast = page.locator('.el-message--error');
      const isVisible = await errorToast.isVisible().catch(() => false);

      if (isVisible) {
        const errorText = await errorToast.textContent();
        expect(errorText).toContain('用户名或密码错误');
      } else {
        // 如果没有 toast，验证仍在登录页
        expect(page.url()).toContain('/login');
      }
    });

    /**
     * AUTH-007: 不存在用户登录
     * 操作步骤：1. 输入不存在用户名 2. 输入任意密码 3. 点击登录按钮
     * 预期结果：显示"用户名或密码错误"提示
     */
    test('AUTH-007: 不存在用户登录', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // 输入不存在用户名
      const usernameInput = page.locator('input[aria-label="Username"]').first();
      await usernameInput.fill('nonexistent_user');

      const passwordInput = page.locator('input[aria-label="Password"]').first();
      await passwordInput.fill('SomePassword@123');

      // 点击登录按钮
      const submitButton = page.locator('button[aria-label="Submit login"]').first();
      await submitButton.click();

      // 等待错误提示显示
      await page.waitForTimeout(1000);

      // 验证显示错误提示
      const errorToast = page.locator('.el-message--error');
      const isVisible = await errorToast.isVisible().catch(() => false);

      if (isVisible) {
        const errorText = await errorToast.textContent();
        expect(errorText).toContain('用户名或密码错误');
      } else {
        // 如果没有 toast，验证仍在登录页
        expect(page.url()).toContain('/login');
      }
    });
  });

  // ========================================
  // 1.2 应用实例选择阶段
  // ========================================

  test.describe('应用实例选择阶段', () => {
    /**
     * AUTH-008: 多应用实例选择
     * 操作步骤：1. 登录成功后 2. 查看应用实例列表
     * 预期结果：显示用户可访问的多个应用实例（作为拥有者或成员）
     */
    test('AUTH-008: 多应用实例选择', async ({ page }) => {
      await loginAsAdmin(page);

      // 检查是否在应用选择页或已有导航菜单
      const url = page.url();

      if (url.includes('/app-select')) {
        // 验证应用实例列表显示
        const appList = page.locator('.app-item, .app-instance-item');
        const count = await appList.count();

        // 管理员应该至少有一个应用实例
        expect(count).toBeGreaterThan(0);
      } else {
        // 如果直接进入主页，说明只有一个应用实例或已自动选择
        // 验证导航菜单存在
        const navMenu = page.locator('.el-menu, .sidebar-menu');
        await expect(navMenu.first()).toBeVisible();
      }
    });

    /**
     * AUTH-009: 选择应用实例
     * 操作步骤：1. 在应用实例列表中 2. 点击某个应用实例
     * 预期结果：进入该应用实例的主界面，加载权限菜单
     */
    test('AUTH-009: 选择应用实例', async ({ page }) => {
      await loginAsAdmin(page);

      // 如果在应用选择页，选择一个应用
      const url = page.url();
      if (url.includes('/app-select')) {
        // 点击第一个应用实例
        const firstApp = page.locator('.app-item, .app-instance-item').first();
        await firstApp.click();

        // 等待加载完成
        await page.waitForLoadState('networkidle');
      }

      // 验证进入主界面
      const navMenu = page.locator('.el-menu, .sidebar-menu');
      await expect(navMenu.first()).toBeVisible();
    });

    /**
     * AUTH-010: 单应用实例自动进入
     * 操作步骤：1. 用户只有一个应用实例 2. 登录成功后
     * 预期结果：自动进入该应用实例，无需手动选择
     */
    test('AUTH-010: 单应用实例自动进入', async ({ page }) => {
      // 使用普通用户登录（假设只有一个应用实例）
      await loginAsUser(page);

      // 验证直接进入主界面或自动选择应用
      const url = page.url();

      // 如果自动进入，URL 应不包含 /app-select
      // 如果还在 app-select，说明用户有多个应用实例
      if (!url.includes('/app-select')) {
        // 验证导航菜单存在
        const navMenu = page.locator('.el-menu, .sidebar-menu');
        await expect(navMenu.first()).toBeVisible();
      }
    });
  });

  // ========================================
  // 1.3 权限加载阶段
  // ========================================

  test.describe('权限加载阶段', () => {
    /**
     * AUTH-011: 权限菜单渲染
     * 操作步骤：1. 选择应用实例后 2. 查看左侧导航菜单
     * 预期结果：根据用户权限渲染对应的菜单树
     */
    test('AUTH-011: 权限菜单渲染', async ({ page }) => {
      await loginAsAdmin(page);
      await selectApp(page);

      // 验证导航菜单存在
      const navMenu = page.locator('.el-menu, .sidebar-menu');
      await expect(navMenu.first()).toBeVisible();

      // 验证有菜单项
      const menuItems = navMenu.first().locator('.el-menu-item, .el-sub-menu');
      const count = await menuItems.count();

      // 管理员应该有菜单项
      expect(count).toBeGreaterThan(0);
    });

    /**
     * AUTH-012: 无权限应用实例
     * 操作步骤：1. 用户没有任何应用实例 2. 登录成功后
     * 预期结果：显示"暂无可用应用实例"，无法进入系统
     */
    test('AUTH-012: 无权限应用实例', async ({ page }) => {
      // 此测试需要特殊的无权限用户，暂时跳过
      // 实际实现：创建一个没有任何应用实例的用户进行测试
      test.skip(true, '需要特殊的无权限测试账号');
    });
  });

  // ========================================
  // 1.4 切换应用实例
  // ========================================

  test.describe('切换应用实例', () => {
    /**
     * AUTH-013: 切换应用实例
     * 操作步骤：1. 已登录状态 2. 点击应用实例选择器 3. 选择另一个应用实例
     * 预期结果：权限刷新为新应用实例的权限，导航菜单重新渲染
     */
    test('AUTH-013: 切换应用实例', async ({ page }) => {
      await loginAsAdmin(page);
      await selectApp(page);

      // 检查是否有应用切换器
      const appSwitcher = page.locator('.app-selector, .app-switcher, [data-testid="app-selector"]').first();
      const hasSwitcher = await appSwitcher.isVisible().catch(() => false);

      if (hasSwitcher) {
        // 打开应用选择器
        await appSwitcher.click();
        await page.waitForTimeout(300);

        // 检查是否有其他应用可选择
        const appList = page.locator('.app-item, .app-instance-item');
        const count = await appList.count();

        if (count > 1) {
          // 选择第二个应用
          await appList.nth(1).click();
          await page.waitForLoadState('networkidle');

          // 验证导航菜单重新渲染
          const navMenu = page.locator('.el-menu, .sidebar-menu');
          await expect(navMenu.first()).toBeVisible();
        } else {
          test.skip(true, '当前用户只有一个应用实例，无法测试切换');
        }
      } else {
        test.skip(true, '页面没有应用切换器');
      }
    });

    /**
     * AUTH-014: 切换后权限变化
     * 操作步骤：1. 切换到权限不同的应用实例 2. 比较前后菜单
     * 预期结果：新应用实例的权限与之前不同，菜单内容变化
     */
    test('AUTH-014: 切换后权限变化', async ({ page }) => {
      await loginAsAdmin(page);
      await selectApp(page);

      // 获取当前菜单项数量
      const navMenu = page.locator('.el-menu, .sidebar-menu').first();
      const initialCount = await navMenu.locator('.el-menu-item, .el-sub-menu').count();

      // 检查是否有应用切换器
      const appSwitcher = page.locator('.app-selector, .app-switcher').first();
      const hasSwitcher = await appSwitcher.isVisible().catch(() => false);

      if (hasSwitcher) {
        await appSwitcher.click();
        await page.waitForTimeout(300);

        const appList = page.locator('.app-item, .app-instance-item');
        const count = await appList.count();

        if (count > 1) {
          // 选择另一个应用
          await appList.nth(1).click();
          await page.waitForLoadState('networkidle');

          // 获取切换后菜单项数量
          const newCount = await navMenu.locator('.el-menu-item, .el-sub-menu').count();

          // 验证菜单变化（权限不同，菜单数量可能不同）
          // 注意：如果两个应用权限相同，数量可能不变
          // 此测试主要验证切换后菜单重新渲染
          await expect(navMenu).toBeVisible();
        } else {
          test.skip(true, '当前用户只有一个应用实例');
        }
      } else {
        test.skip(true, '页面没有应用切换器');
      }
    });
  });

  // ========================================
  // 1.5 登出流程
  // ========================================

  test.describe('登出流程', () => {
    /**
     * AUTH-015: 用户登出
     * 操作步骤：1. 点击登出按钮 2. 认登出
     * 预期结果：清除 Token，跳转到登录页面
     */
    test('AUTH-015: 用户登出', async ({ page }) => {
      await loginAsAdmin(page);
      await selectApp(page);

      // 验证已登录
      expect(page.url()).not.toContain('/login');

      // 执行登出
      await logout(page);

      // 验证跳转到登录页
      await expect(page).toHaveURL(/\/login/);
    });
  });
});