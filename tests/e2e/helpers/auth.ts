/**
 * @fileoverview 登录流程测试辅助函数。
 * @description 提供登录、选择应用实例、登出等常用操作的封装函数，
 *              供其他测试模块复用。
 */

import type { Page } from '@playwright/test';

/**
 * 测试账号配置。
 */
export const TEST_ACCOUNTS = {
  /** 管理员账号。 */
  admin: {
    username: 'admin',
    password: 'Admin@123',
  },
  /** 普通用户账号。 */
  user: {
    username: 'test',
    password: 'Test@123',
  },
} as const;

/**
 * 登录页面路径。
 */
export const LOGIN_PATH = '/login';

/**
 * 应用实例选择页面路径模式。
 */
export const APP_SELECT_PATTERN = /\/app-select|\/dashboard|\/sys|\/$/;

/**
 * 登录操作。
 *
 * @param page - Playwright Page 对象。
 * @param username - 用户名。
 * @param password - 密码。
 * @param expectSuccess - 是否期望登录成功（默认 true）。
 * @returns Promise<void>。
 */
export async function login(
  page: Page,
  username: string,
  password: string,
  expectSuccess = true
): Promise<void> {
  await page.goto(LOGIN_PATH);
  await page.waitForLoadState('networkidle');

  // 输入用户名 - 使用 aria-label 定位
  const usernameInput = page.locator('input[aria-label="Username"]').first();
  await usernameInput.fill(username);

  // 输入密码 - 使用 aria-label 定位
  const passwordInput = page.locator('input[aria-label="Password"]').first();
  await passwordInput.fill(password);

  // 点击登录按钮 - 使用 aria-label 定位
  const submitButton = page.locator('button[aria-label="Submit login"]').first();
  await submitButton.click();

  if (expectSuccess) {
    // 等待登录成功后跳转
    await page.waitForURL(APP_SELECT_PATTERN, { timeout: 10000 });
  }
}

/**
 * 使用管理员账号登录。
 *
 * @param page - Playwright Page 对象。
 * @returns Promise<void>。
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  await login(page, TEST_ACCOUNTS.admin.username, TEST_ACCOUNTS.admin.password);
}

/**
 * 使用普通用户账号登录。
 *
 * @param page - Playwright Page 对象。
 * @returns Promise<void>。
 */
export async function loginAsUser(page: Page): Promise<void> {
  await login(page, TEST_ACCOUNTS.user.username, TEST_ACCOUNTS.user.password);
}

/**
 * 选择应用实例。
 *
 * @param page - Playwright Page 对象。
 * @param appName - 应用实例名称（可选，默认选择第一个）。
 * @returns Promise<void>。
 */
export async function selectApp(page: Page, appName?: string): Promise<void> {
  // 如果在应用选择页面，点击选择应用
  const appSelectPage = page.locator('.app-select-page, .app-instance-list');
  const isVisible = await appSelectPage.isVisible().catch(() => false);

  if (isVisible) {
    if (appName) {
      // 选择指定应用
      await page.locator(`text="${appName}"`).first().click();
    } else {
      // 选择第一个应用实例
      const firstApp = page.locator('.app-item, .app-instance-item').first();
      await firstApp.click();
    }
  }

  // 等待加载完成
  await page.waitForLoadState('networkidle');
}

/**
 * 登录并进入指定应用实例。
 *
 * @param page - Playwright Page 对象。
 * @param accountType - 账号类型（'admin' | 'user'）。
 * @param appName - 应用实例名称（可选）。
 * @returns Promise<void>。
 */
export async function loginAndSelectApp(
  page: Page,
  accountType: 'admin' | 'user' = 'admin',
  appName?: string
): Promise<void> {
  if (accountType === 'admin') {
    await loginAsAdmin(page);
  } else {
    await loginAsUser(page);
  }

  await selectApp(page, appName);
}

/**
 * 用户登出。
 *
 * @param page - Playwright Page 对象。
 * @returns Promise<void>。
 */
export async function logout(page: Page): Promise<void> {
  // 先点击用户菜单按钮打开下拉菜单
  const userMenuButton = page.locator('button:has-text("Admin"), button[aria-label*="user"], button:has(img)').filter({
    has: page.locator('strong:has-text("Admin")'),
  }).first();

  await userMenuButton.click();
  await page.waitForTimeout(500);

  // 使用角色定位器查找登出菜单项
  const logoutButton = page.getByRole('menuitem', { name: /logout|登出|退出/i });
  await logoutButton.click();

  // 等待确认对话框（如果有）
  const confirmDialog = page.locator('.el-message-box');
  const hasConfirm = await confirmDialog.isVisible().catch(() => false);

  if (hasConfirm) {
    await confirmDialog.locator('button:has-text("确定")').first().click();
  }

  // 等待跳转到登录页
  await page.waitForURL(/\/login/, { timeout: 5000 });
}

/**
 * 切换应用实例。
 *
 * @param page - Playwright Page 对象。
 * @param appName - 目标应用实例名称。
 * @returns Promise<void>。
 */
export async function switchAppInstance(page: Page, appName: string): Promise<void> {
  // 查找应用实例选择器
  const appSelector = page.locator('.app-selector, .app-switcher, [data-testid="app-selector"]').first();
  await appSelector.click();

  // 等待应用列表显示
  await page.waitForTimeout(300);

  // 选择目标应用
  await page.locator(`text="${appName}"`).first().click();

  // 等待权限刷新完成
  await page.waitForLoadState('networkidle');
}

/**
 * 检查是否已登录。
 *
 * @param page - Playwright Page 对象。
 * @returns Promise<boolean> 是否已登录。
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  const currentUrl = page.url();
  return !currentUrl.includes('/login');
}

/**
 * 确保已登录状态（如果未登录则自动登录）。
 *
 * @param page - Playwright Page 对象。
 * @param accountType - 账号类型。
 * @returns Promise<void>。
 */
export async function ensureLoggedIn(
  page: Page,
  accountType: 'admin' | 'user' = 'admin'
): Promise<void> {
  if (!await isLoggedIn(page)) {
    if (accountType === 'admin') {
      await loginAsAdmin(page);
    } else {
      await loginAsUser(page);
    }
    await selectApp(page);
  }
}

/**
 * 导航到系统管理页面。
 *
 * @param page - Playwright Page 对象。
 * @param path - 子路径，如 'user', 'role', 'audit-log' 等。
 * @returns Promise<void>。
 */
export async function navigateToSysPage(page: Page, path: string): Promise<void> {
  await page.goto(`/sys/${path}`);
  await page.waitForLoadState('networkidle');
}

/**
 * 获取当前页面错误消息。
 *
 * @param page - Playwright Page 对象。
 * @returns Promise<string | null> 错误消息文本。
 */
export async function getErrorMessage(page: Page): Promise<string | null> {
  const errorToast = page.locator('.el-message--error, .el-message.error');
  const isVisible = await errorToast.isVisible().catch(() => false);

  if (isVisible) {
    return errorToast.textContent();
  }

  // 检查表单验证错误
  const formError = page.locator('.el-form-item__error');
  const formErrorVisible = await formError.isVisible().catch(() => false);

  if (formErrorVisible) {
    return formError.textContent();
  }

  return null;
}

/**
 * 等待并获取成功消息。
 *
 * @param page - Playwright Page 对象。
 * @returns Promise<string | null> 成功消息文本。
 */
export async function getSuccessMessage(page: Page): Promise<string | null> {
  const successToast = page.locator('.el-message--success, .el-message.success');
  await successToast.waitFor({ state: 'visible', timeout: 5000 }).catch(() => null);
  return successToast.textContent();
}

/**
 * 等待表格加载完成。
 *
 * @param page - Playwright Page 对象。
 * @returns Promise<void>。
 */
export async function waitForTableLoad(page: Page): Promise<void> {
  // 等待表格数据加载
  await page.locator('.el-table__body-wrapper tr').first().waitFor({ state: 'visible', timeout: 10000 });
  await page.waitForLoadState('networkidle');
}

/**
 * 获取表格数据行数。
 *
 * @param page - Playwright Page 对象。
 * @returns Promise<number> 数据行数。
 */
export async function getTableRowCount(page: Page): Promise<number> {
  const rows = page.locator('.el-table__body-wrapper tr');
  return rows.count();
}