import { test as base, expect, type Page } from '@playwright/test';

const API_BASE = '/api';

interface LoginParams {
  username: string;
  password: string;
}

interface AppContext {
  authToken: string;
  refreshToken: string;
}

export const test = base.extend<{
  authenticatedPage: Page;
}>({
  authenticatedPage: async ({ page }, use) => {
    await ensureSystemInitialized(page);
    await login(page, { username: 'admin', password: 'Admin@123' });
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await use(page);
  },
});

export { expect };

export async function ensureSystemInitialized(page: Page): Promise<void> {
  const statusResponse = await page.request.get(`${API_BASE}/install/status`);
  const statusBody = await statusResponse.json();

  if (!statusBody.data?.initialized) {
    const initResponse = await page.request.post(`${API_BASE}/install/init`, {
      data: { adminPassword: 'Admin@123' },
    });
    expect(initResponse.ok()).toBeTruthy();
  }
}

export async function login(page: Page, params: LoginParams): Promise<AppContext> {
  const response = await page.request.post(`${API_BASE}/auth/login`, {
    data: { username: params.username, password: params.password },
  });
  const body = await response.json();
  expect(body.code).toBe(0);

  const token = body.data.accessToken;
  const refreshToken = body.data.refreshToken;

  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  await page.evaluate(
    ({ token, refreshToken }) => {
      localStorage.setItem('mfw:admin:token', token);
      localStorage.setItem('mfw:admin:refresh_token', refreshToken);
    },
    { token, refreshToken },
  );

  return { authToken: token, refreshToken };
}

export async function resetSystem(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem('mfw:admin:token');
    localStorage.removeItem('mfw:admin:refresh_token');
    localStorage.removeItem('mfw:admin:current_app');
  });
}

export async function navigateTo(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
}

export async function waitForApiCall(
  page: Page,
  urlPattern: string | RegExp,
  action: () => Promise<void>,
): Promise<any> {
  const responsePromise = page.waitForResponse(
    (resp) => {
      if (typeof urlPattern === 'string') {
        return resp.url().includes(urlPattern);
      }
      return urlPattern.test(resp.url());
    },
  );
  await action();
  const response = await responsePromise;
  return response.json();
}

export async function dismissElMessage(page: Page): Promise<void> {
  await page.waitForTimeout(500);
  const closeBtn = page.locator('.el-message__closeBtn');
  if (await closeBtn.isVisible()) {
    await closeBtn.click();
  }
}

export async function confirmDialog(page: Page): Promise<void> {
  const confirmBtn = page.locator('.el-message-box .el-button--primary');
  await confirmBtn.waitFor({ state: 'visible', timeout: 5000 });
  await confirmBtn.click();
}

export async function cancelDialog(page: Page): Promise<void> {
  const cancelBtn = page.locator('.el-message-box .el-button--default');
  await cancelBtn.waitFor({ state: 'visible', timeout: 5000 });
  await cancelBtn.click();
}

export async function fillFormInput(page: Page, testId: string, value: string): Promise<void> {
  const input = page.locator(`[data-testid="${testId}"] input, [data-testid="${testId}"] .el-input__inner`);
  await input.fill(value);
}

export async function selectDropdownOption(page: Page, testId: string, optionText: string): Promise<void> {
  const trigger = page.locator(`[data-testid="${testId}"] .el-select__wrapper, [data-testid="${testId}"]`);
  await trigger.click();
  const option = page.locator('.el-select-dropdown__item').filter({ hasText: optionText });
  await option.click();
}
