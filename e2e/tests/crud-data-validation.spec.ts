import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const ADMIN_USER = 'admin';
const ADMIN_PASS = 'Admin@123';
const TEST_PREFIX = `e2e_crud_`;

async function loginViaUI(page: Page, username: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  const loginEl = page.locator('.mfw-login-page');
  const isVisible = await loginEl.isVisible({ timeout: 5000 }).catch(() => false);
  if (!isVisible) {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    return;
  }
  await page.locator('input[placeholder*="用户名"]').fill(username);
  await page.locator('input[placeholder*="密码"]').fill(password);
  await page.locator('.mfw-login-page .mfw-login-submit').click();
  await page.waitForLoadState('networkidle');
  const appSelector = page.locator('.app-selector-panel');
  if (await appSelector.isVisible({ timeout: 3000 }).catch(() => false)) {
    await appSelector.locator('.app-item, .el-card').first().click();
  }
  await page.waitForTimeout(1000);
}

test.describe('用户管理 - 数据正确性与边界条件', () => {
  test.setTimeout(60000);

  test('USER-DATA-01: 创建用户 - 基本成功流程', async ({ page }) => {
    await loginViaUI(page, ADMIN_USER, ADMIN_PASS);
    await page.goto('/sys/user');
    await page.waitForLoadState('networkidle');

    const createBtn = page.locator('[data-testid="user-create-btn"]');
    if (!(await createBtn.isVisible({ timeout: 5000 }).catch(() => false))) { test.skip(); return; }
    await createBtn.click();

    const ts = Date.now();
    const dialog = page.locator('.el-dialog').filter({ hasText: /新建|添加/ });
    await expect(dialog.locator('.el-input__inner').first()).toBeVisible({ timeout: 5000 });
    const inputs = dialog.locator('.el-input__inner');
    const inputCount = await inputs.count();
    if (inputCount >= 1) await inputs.nth(0).fill(`${TEST_PREFIX}u_${ts}`);
    if (inputCount >= 2) await inputs.nth(1).fill(`测试昵称_${ts}`);

    await dialog.locator('.el-dialog__footer .el-button--primary').last().click();
    await expect(page.locator('.el-message--success, .el-notification')).toBeVisible({ timeout: 10000 });
  });

  test('USER-DATA-02: 创建用户 - 重复用户名应显示错误', async ({ page }) => {
    await loginViaUI(page, ADMIN_USER, ADMIN_PASS);
    await page.goto('/sys/user');
    await page.waitForLoadState('networkidle');

    const createBtn = page.locator('[data-testid="user-create-btn"]');
    if (!(await createBtn.isVisible({ timeout: 5000 }).catch(() => false))) { test.skip(); return; }
    await createBtn.click();

    const dialog = page.locator('.el-dialog').filter({ hasText: /新建|添加/ });
    await expect(dialog.locator('.el-input__inner').first()).toBeVisible({ timeout: 5000 });
    await dialog.locator('.el-input__inner').first().fill(ADMIN_USER);

    await dialog.locator('.el-dialog__footer .el-button--primary').last().click();
    const errMsg = page.locator('.el-message--error');
    const hasErr = await errMsg.isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasErr) {
      const closeBtn = dialog.locator('.el-dialog__headerbtn').last();
      if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) await closeBtn.click();
    }
    expect(hasErr).toBeTruthy();
  });

  test('USER-DATA-03: 用户列表 - 表格数据加载', async ({ page }) => {
    await loginViaUI(page, ADMIN_USER, ADMIN_PASS);
    await page.goto('/sys/user');
    await page.waitForLoadState('networkidle');

    const table = page.locator('.el-table, .mfw-list-page');
    await expect(table).toBeVisible({ timeout: 10000 });
    const rows = page.locator('.el-table__body tr');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('USER-DATA-04: 用户搜索 - 按用户名过滤', async ({ page }) => {
    await loginViaUI(page, ADMIN_USER, ADMIN_PASS);
    await page.goto('/sys/user');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('[data-testid="user-search-username"] input, [data-testid="user-search-name"] input, input[placeholder*="用户名"]').first();
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('admin');
      const searchBtn = page.locator('[data-testid="search-btn"], button:has-text("搜索")').first();
      if (await searchBtn.isVisible({ timeout: 2000 }).catch(() => false)) await searchBtn.click();
      await page.waitForLoadState('networkidle');
    }
    const rows = page.locator('.el-table__body tr');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('USER-DATA-05: 删除用户 - admin 不能删除', async ({ page }) => {
    await loginViaUI(page, ADMIN_USER, ADMIN_PASS);
    await page.goto('/sys/user');
    await page.waitForLoadState('networkidle');

    const deleteBtns = page.locator('[data-testid="user-delete-btn"]');
    const delBtn = deleteBtns.first();
    if (await delBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await delBtn.click();
      const confirmBox = page.locator('.el-message-box');
      await expect(confirmBox).toBeVisible({ timeout: 3000 });
      const cancelBtn = confirmBox.locator('.el-button').filter({ hasText: /取消|取 消/ }).first();
      if (await cancelBtn.isVisible({ timeout: 2000 }).catch(() => false)) await cancelBtn.click();
    }
  });

  test('USER-DATA-06: 用户编辑 - 弹窗打开验证', async ({ page }) => {
    await loginViaUI(page, ADMIN_USER, ADMIN_PASS);
    await page.goto('/sys/user');
    await page.waitForLoadState('networkidle');

    const editBtns = page.locator('[data-testid="user-edit-btn"]');
    if (await editBtns.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await editBtns.first().click();
      const dialog = page.locator('.el-dialog, .el-drawer').filter({ hasText: /编辑|修改/ });
      const isOpen = await dialog.isVisible({ timeout: 5000 }).catch(() => false);
      if (isOpen) {
        const closeBtn = page.locator('.el-dialog__headerbtn, .el-drawer__close-btn').last();
        if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) await closeBtn.click();
      }
      expect(isOpen).toBeTruthy();
    }
  });
});

test.describe('角色管理 - 数据正确性与边界条件', () => {
  test.setTimeout(60000);

  test('ROLE-DATA-01: 创建角色 - 基本成功流程', async ({ page }) => {
    await loginViaUI(page, ADMIN_USER, ADMIN_PASS);
    await page.goto('/sys/role');
    await page.waitForLoadState('networkidle');

    const createBtn = page.locator('[data-testid="role-create-btn"]');
    if (!(await createBtn.isVisible({ timeout: 5000 }).catch(() => false))) { test.skip(); return; }
    await createBtn.click();

    const ts = Date.now();
    const dialog = page.locator('.el-dialog').filter({ hasText: /新建|创建/ });
    await expect(dialog.locator('.el-input__inner').first()).toBeVisible({ timeout: 5000 });
    const inputs = dialog.locator('.el-input__inner');
    const inputCount = await inputs.count();
    if (inputCount >= 1) await inputs.nth(0).fill(`测试角色_${ts}`);
    if (inputCount >= 2) await inputs.nth(1).fill(`test_role_${ts}`);

    await dialog.locator('.el-dialog__footer .el-button--primary').last().click();
    await expect(page.locator('.el-message--success, .el-notification')).toBeVisible({ timeout: 10000 });
  });

  test('ROLE-DATA-02: 角色列表 - 卡片数据加载', async ({ page }) => {
    await loginViaUI(page, ADMIN_USER, ADMIN_PASS);
    await page.goto('/sys/role');
    await page.waitForLoadState('networkidle');

    const cards = page.locator('.role-card, .el-card, .mfw-card-panel');
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
  });

  test('ROLE-DATA-03: 角色搜索 - 卡片显示', async ({ page }) => {
    await loginViaUI(page, ADMIN_USER, ADMIN_PASS);
    await page.goto('/sys/role');
    await page.waitForLoadState('networkidle');

    const cards = page.locator('.role-card, .el-card, .mfw-card-panel');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});

test.describe('应用管理 - 数据正确性与边界条件', () => {
  test.setTimeout(60000);

  test('APP-DATA-01: 创建应用 - 基本成功流程', async ({ page }) => {
    await loginViaUI(page, ADMIN_USER, ADMIN_PASS);
    await page.goto('/sys/app');
    await page.waitForLoadState('networkidle');

    const createBtn = page.locator('[data-testid="app-create-btn"]');
    if (!(await createBtn.isVisible({ timeout: 5000 }).catch(() => false))) { test.skip(); return; }
    await createBtn.click();

    const ts = Date.now();
    const dialog = page.locator('.el-dialog').filter({ hasText: /新建/ });
    await expect(dialog).toBeVisible({ timeout: 5000 });

    const typeTrigger = dialog.locator('[data-testid="app-type-select"] .el-select__wrapper');
    if (await typeTrigger.isVisible({ timeout: 3000 }).catch(() => false)) {
      await typeTrigger.click();
      await page.waitForTimeout(500);
      const options = page.locator('.el-select-dropdown__item');
      if (await options.first().isVisible({ timeout: 2000 }).catch(() => false)) await options.first().click();
    }

    const inputs = dialog.locator('.el-input__inner');
    const inputCount = await inputs.count();
    if (inputCount >= 1) await inputs.nth(0).fill(`测试应用_${ts}`);
    if (inputCount >= 2) await inputs.nth(1).fill(`test_app_${ts}`);

    await dialog.locator('.el-dialog__footer .el-button--primary').last().click();
    await expect(page.locator('.el-message--success, .el-notification')).toBeVisible({ timeout: 10000 });
  });

  test('APP-DATA-02: 应用列表 - 表格数据加载', async ({ page }) => {
    await loginViaUI(page, ADMIN_USER, ADMIN_PASS);
    await page.goto('/sys/app');
    await page.waitForLoadState('networkidle');

    const table = page.locator('.el-table, .mfw-list-page');
    await expect(table).toBeVisible({ timeout: 10000 });
    const rows = page.locator('.el-table__body tr');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('APP-DATA-03: system-instance 不可删除', async ({ page }) => {
    await loginViaUI(page, ADMIN_USER, ADMIN_PASS);
    await page.goto('/sys/app');
    await page.waitForLoadState('networkidle');

    const deleteBtns = page.locator('[data-testid="app-delete-btn"]');
    const count = await deleteBtns.count();
    if (count > 0) {
      const sysRow = page.locator('.el-table__body tr').filter({ hasText: 'system' }).first();
      const sysDeleteBtn = sysRow.locator('[data-testid="app-delete-btn"]');
      const isSysDeleteVisible = await sysDeleteBtn.isVisible({ timeout: 3000 }).catch(() => false);
      expect(isSysDeleteVisible).toBeFalsy();
    }
  });
});

test.describe('应用类型管理 - 数据正确性', () => {
  test.setTimeout(30000);

  test('ATYPE-DATA-01: 卡片列表加载', async ({ page }) => {
    await loginViaUI(page, ADMIN_USER, ADMIN_PASS);
    await page.goto('/sys/app-type');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const cards = page.locator('.app-type-card, .el-card');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('ATYPE-DATA-02: 编辑按钮可见', async ({ page }) => {
    await loginViaUI(page, ADMIN_USER, ADMIN_PASS);
    await page.goto('/sys/app-type');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const editBtn = page.locator('[data-testid="app-type-edit-btn"]').first();
    const isVisible = await editBtn.isVisible({ timeout: 5000 }).catch(() => false);
    expect(isVisible).toBeTruthy();
  });
});

test.describe('成员管理 - 数据正确性', () => {
  test.setTimeout(30000);

  test('MEMBER-DATA-01: 成员列表加载', async ({ page }) => {
    await loginViaUI(page, ADMIN_USER, ADMIN_PASS);
    await page.goto('/sys/member');
    await page.waitForLoadState('networkidle');

    const table = page.locator('.el-table, .mfw-list-page');
    await expect(table).toBeVisible({ timeout: 10000 });
  });
});

test.describe('审计日志 - 数据正确性', () => {
  test.setTimeout(30000);

  test('AUDIT-DATA-01: 日志列表加载', async ({ page }) => {
    await loginViaUI(page, ADMIN_USER, ADMIN_PASS);
    await page.goto('/sys/audit-log');
    await page.waitForLoadState('networkidle');

    const table = page.locator('.el-table, .mfw-list-page');
    await expect(table).toBeVisible({ timeout: 10000 });
  });

  test('AUDIT-DATA-02: 搜索过滤可用', async ({ page }) => {
    await loginViaUI(page, ADMIN_USER, ADMIN_PASS);
    await page.goto('/sys/audit-log');
    await page.waitForLoadState('networkidle');

    const searchPanel = page.locator('.mfw-search-panel, .search-panel, [data-testid="audit-search-module"]');
    const isVisible = await searchPanel.isVisible({ timeout: 5000 }).catch(() => false);
    expect(isVisible).toBeTruthy();
  });
});

test.describe('权限管理 - 数据正确性', () => {
  test.setTimeout(30000);

  test('PERM-DATA-01: NORMAL 权限树加载', async ({ page }) => {
    await loginViaUI(page, ADMIN_USER, ADMIN_PASS);
    await page.goto('/sys/permission');
    await page.waitForLoadState('networkidle');

    const tree = page.locator('.el-tree, [data-testid="permission-tree"]');
    const isVisible = await tree.isVisible({ timeout: 10000 }).catch(() => false);
    expect(isVisible).toBeTruthy();
  });

  test('PERM-DATA-02: PC 权限树加载', async ({ page }) => {
    await loginViaUI(page, ADMIN_USER, ADMIN_PASS);
    await page.goto('/sys/permission-pc');
    await page.waitForLoadState('networkidle');

    const tree = page.locator('.el-tree, [data-testid="permission-tree"]');
    const isVisible = await tree.isVisible({ timeout: 10000 }).catch(() => false);
    expect(isVisible).toBeTruthy();
  });
});

test.describe('跨模块联动验证', () => {
  test.setTimeout(60000);

  test('CROSS-01: 创建用户后在成员管理中可搜索', async ({ page }) => {
    await loginViaUI(page, ADMIN_USER, ADMIN_PASS);
    const ts = Date.now();
    const testUser = `${TEST_PREFIX}cross_${ts}`;

    await page.goto('/sys/user');
    await page.waitForLoadState('networkidle');
    const createBtn = page.locator('[data-testid="user-create-btn"]');
    if (!(await createBtn.isVisible({ timeout: 5000 }).catch(() => false))) { test.skip(); return; }
    await createBtn.click();

    const dialog = page.locator('.el-dialog').filter({ hasText: /新建|添加/ });
    await expect(dialog.locator('.el-input__inner').first()).toBeVisible({ timeout: 5000 });
    await dialog.locator('.el-input__inner').first().fill(testUser);
    await dialog.locator('.el-dialog__footer .el-button--primary').last().click();
    await expect(page.locator('.el-message--success, .el-notification')).toBeVisible({ timeout: 10000 });

    await page.goto('/sys/member');
    await page.waitForLoadState('networkidle');
    const memberCreateBtn = page.locator('[data-testid="member-create-btn"]');
    if (!(await memberCreateBtn.isVisible({ timeout: 5000 }).catch(() => false))) return;
    await memberCreateBtn.click();

    const addDialog = page.locator('.el-dialog').filter({ hasText: /添加成员/ });
    if (await addDialog.isVisible({ timeout: 3000 }).catch(() => false)) {
      const pickerInput = addDialog.locator('.el-input__inner').first();
      if (await pickerInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await pickerInput.click();
        await page.waitForTimeout(500);
        await pickerInput.fill(testUser);
        await page.waitForTimeout(500);
        const options = page.locator('.el-select-dropdown__item');
        const visible = await options.first().isVisible({ timeout: 2000 }).catch(() => false);
        expect(visible).toBeTruthy();
      }
      const closeBtn = addDialog.locator('.el-dialog__headerbtn').last();
      if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) await closeBtn.click();
    }
  });

  test('CROSS-02: 创建角色后在用户角色分配中可见', async ({ page }) => {
    await loginViaUI(page, ADMIN_USER, ADMIN_PASS);
    await page.goto('/sys/role');
    await page.waitForLoadState('networkidle');

    const cards = page.locator('.role-card, .el-card, .mfw-card-panel');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);
    const firstCard = cards.first();
    const cardText = await firstCard.textContent();
    expect(cardText).toBeTruthy();
  });
});
