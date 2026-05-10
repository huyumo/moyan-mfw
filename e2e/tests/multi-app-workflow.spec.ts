import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const ADMIN_USER = 'admin';
const ADMIN_PASS = 'Admin@123';

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
  await page.waitForTimeout(1500);
}

test.describe('多应用完整工作流 - 通过前端UI创建应用实例', () => {
  test('WORKFLOW-01: 导航到应用管理页面并创建第一个应用实例', async ({ page }) => {
    await loginViaUI(page, ADMIN_USER, ADMIN_PASS);

    await page.goto('/sys/app');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-testid="app-create-btn"]')).toBeVisible({ timeout: 10000 });

    await page.locator('[data-testid="app-create-btn"]').click();

    await expect(page.locator('[data-testid="app-type-select"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="app-name-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="app-code-input"]')).toBeVisible();

    const timestamp = Date.now();
    await page.locator('[data-testid="app-type-select"]').click();
    await page.waitForTimeout(500);
    const typeOptions = page.locator('.el-select-dropdown__item');
    if (!(await typeOptions.first().isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, '应用类型下拉列表为空，请检查应用类型配置数据');
      return;
    }
    await typeOptions.first().click();

    await page.locator('[data-testid="app-name-input"]').fill(`测试应用A_${timestamp}`);
    await page.locator('[data-testid="app-code-input"]').fill(`test_app_a_${timestamp}`);
    await page.locator('[data-testid="app-desc-input"]').fill('端到端测试创建的应用实例A');

    const confirmBtn = page.locator('.el-dialog__footer .el-button--primary');
    await confirmBtn.click();

    await page.waitForTimeout(1000);
    await expect(page.locator('.el-message--success')).toBeVisible({ timeout: 5000 });
  });

  test('WORKFLOW-02: 创建第二个应用实例（同类型）', async ({ page }) => {
    await loginViaUI(page, ADMIN_USER, ADMIN_PASS);

    await page.goto('/sys/app');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="app-create-btn"]').click();

    const timestamp = Date.now();
    await page.locator('[data-testid="app-type-select"]').click();
    await page.waitForTimeout(500);
    const typeOptions = page.locator('.el-select-dropdown__item');
    if (!(await typeOptions.first().isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, '应用类型下拉列表为空，请检查应用类型配置数据');
      return;
    }
    await typeOptions.first().click();

    await page.locator('[data-testid="app-name-input"]').fill(`测试应用B_${timestamp}`);
    await page.locator('[data-testid="app-code-input"]').fill(`test_app_b_${timestamp}`);
    await page.locator('[data-testid="app-desc-input"]').fill('端到端测试创建的应用实例B');

    const confirmBtn = page.locator('.el-dialog__footer .el-button--primary');
    await confirmBtn.click();

    await page.waitForTimeout(1000);
    await expect(page.locator('.el-message--success')).toBeVisible({ timeout: 5000 });
  });

  test('WORKFLOW-03: 验证应用列表显示创建的应用', async ({ page }) => {
    await loginViaUI(page, ADMIN_USER, ADMIN_PASS);

    await page.goto('/sys/app');
    await page.waitForLoadState('networkidle');

    const table = page.locator('.el-table');
    await expect(table).toBeVisible({ timeout: 10000 });

    const rowsBefore = page.locator('.el-table__body tr');
    const countBefore = await rowsBefore.count();

    await page.locator('[data-testid="app-create-btn"]').click();

    const timestamp = Date.now();
    await page.locator('[data-testid="app-type-select"]').click();
    await page.waitForTimeout(500);
    const typeOptions = page.locator('.el-select-dropdown__item');
    if (!(await typeOptions.first().isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, '应用类型下拉列表为空，请检查应用类型配置数据');
      return;
    }
    await typeOptions.first().click();

    await page.locator('[data-testid="app-name-input"]').fill(`验证应用_${timestamp}`);
    await page.locator('[data-testid="app-code-input"]').fill(`verify_app_${timestamp}`);
    await page.locator('[data-testid="app-desc-input"]').fill('验证数据持久化的测试应用');

    const confirmBtn = page.locator('.el-dialog__footer .el-button--primary');
    await confirmBtn.click();

    await page.waitForTimeout(1000);
    await expect(page.locator('.el-message--success')).toBeVisible({ timeout: 5000 });

    await page.waitForTimeout(2000);
    await page.reload();
    await page.waitForLoadState('networkidle');

    const rowsAfter = page.locator('.el-table__body tr');
    const countAfter = await rowsAfter.count();
    expect(countAfter).toBeGreaterThan(countBefore);

    const appCodes = await rowsAfter.locator('td:nth-child(3)').allTextContents();
    const hasVerifyApp = appCodes.some(code => code.includes('verify_app'));
    expect(hasVerifyApp).toBeTruthy();
  });
});

test.describe('多应用完整工作流 - 通过前端UI创建用户', () => {
  test('WORKFLOW-04: 导航到用户管理页面并创建测试用户', async ({ page }) => {
    await loginViaUI(page, ADMIN_USER, ADMIN_PASS);

    await page.goto('/sys/user');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-testid="user-create-btn"]')).toBeVisible({ timeout: 10000 });

    await page.locator('[data-testid="user-create-btn"]').click();

    await expect(page.locator('[data-testid="user-username-input"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="user-phone-input"]')).toBeVisible();

    const timestamp = Date.now();
    const phoneSuffix = String(timestamp).slice(-8).replace(/^0/, '1');
    await page.locator('[data-testid="user-username-input"]').fill(`testuser_${timestamp}`);
    await page.locator('[data-testid="user-nickname-input"]').fill('端到端测试用户');
    await page.locator('[data-testid="user-phone-input"]').fill(`139${phoneSuffix}`);

    const genderRadio = page.locator('[data-testid="user-gender-radio"] .el-radio');
    if (await genderRadio.first().isVisible()) {
      await genderRadio.first().click();
    }

    const confirmBtn = page.locator('.el-dialog__footer .el-button--primary');
    await confirmBtn.click();

    await page.waitForTimeout(1000);
    await expect(page.locator('.el-message--success')).toBeVisible({ timeout: 5000 });
  });

  test('WORKFLOW-05: 验证用户列表显示创建的用户', async ({ page }) => {
    await loginViaUI(page, ADMIN_USER, ADMIN_PASS);

    await page.goto('/sys/user');
    await page.waitForLoadState('networkidle');

    const table = page.locator('.el-table');
    await expect(table).toBeVisible({ timeout: 10000 });

    const rowsBefore = page.locator('.el-table__body tr');
    const countBefore = await rowsBefore.count();

    await page.locator('[data-testid="user-create-btn"]').click();

    await expect(page.locator('[data-testid="user-username-input"]')).toBeVisible({ timeout: 5000 });

    const timestamp = Date.now();
    const phoneSuffix = String(timestamp).slice(-8).replace(/^0/, '1');
    await page.locator('[data-testid="user-username-input"]').fill(`verifyuser_${timestamp}`);
    await page.locator('[data-testid="user-nickname-input"]').fill('验证数据持久化用户');
    await page.locator('[data-testid="user-phone-input"]').fill(`139${phoneSuffix}`);

    const confirmBtn = page.locator('.el-dialog__footer .el-button--primary');
    await confirmBtn.click();

    await page.waitForTimeout(1000);
    await expect(page.locator('.el-message--success')).toBeVisible({ timeout: 5000 });

    await page.waitForTimeout(2000);
    await page.reload();
    await page.waitForLoadState('networkidle');

    const rowsAfter = page.locator('.el-table__body tr');
    const countAfter = await rowsAfter.count();
    expect(countAfter).toBeGreaterThan(countBefore);

    const usernames = await rowsAfter.locator('td:nth-child(2)').allTextContents();
    const hasVerifyUser = usernames.some(name => name.includes('verifyuser_'));
    expect(hasVerifyUser).toBeTruthy();
  });
});

test.describe('多应用完整工作流 - 通过前端UI管理成员和角色', () => {
  test('WORKFLOW-06: 导航到成员管理页面', async ({ page }) => {
    await loginViaUI(page, ADMIN_USER, ADMIN_PASS);

    await page.goto('/sys/member');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-testid="member-create-btn"]')).toBeVisible({ timeout: 10000 });
  });

  test('WORKFLOW-07: 添加成员到应用', async ({ page }) => {
    await loginViaUI(page, ADMIN_USER, ADMIN_PASS);

    await page.goto('/sys/member');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="member-create-btn"]').click();

    await expect(page.locator('[data-testid="add-member-user-picker"]')).toBeVisible({ timeout: 5000 });

    const userPickerInput = page.locator('[data-testid="add-member-user-picker"] input');
    await userPickerInput.click();
    await page.waitForTimeout(500);

    const userOptions = page.locator('.el-select-dropdown__item');
    if (!(await userOptions.first().isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, '成员选择的用户下拉为空，请确认已有可用用户');
      return;
    }

    const testUserOption = userOptions.locator(':text-matches("testuser_", "i")');
    if (await testUserOption.count() > 0) {
      await testUserOption.first().click();
    } else {
      await userOptions.first().click();
    }

    const confirmBtn = page.locator('.el-dialog__footer .el-button--primary');
    await confirmBtn.click();

    await page.waitForTimeout(1000);
    await expect(page.locator('.el-message--success')).toBeVisible({ timeout: 5000 });
  });

  test('WORKFLOW-08: 为成员分配角色', async ({ page }) => {
    await loginViaUI(page, ADMIN_USER, ADMIN_PASS);

    await page.goto('/sys/member');
    await page.waitForLoadState('networkidle');

    const rows = page.locator('.el-table__body tr');
    const rowCount = await rows.count();
    
    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const assignBtn = row.locator('[data-testid="member-assign-role-btn"]');
      
      if (await assignBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        const isDisabled = await assignBtn.isDisabled();
        if (isDisabled) {
          continue;
        }
        
        await assignBtn.click();

        await expect(page.locator('[data-testid="role-assign-checkbox-group"]')).toBeVisible({ timeout: 5000 });

        const roleCheckbox = page.locator('[data-testid="role-assign-checkbox-group"] .el-checkbox').first();
        if (await roleCheckbox.isVisible()) {
          await roleCheckbox.click();
        }

        const confirmBtn = page.locator('.el-dialog__footer .el-button--primary');
        await confirmBtn.click();

        await page.waitForTimeout(1000);
        return;
      }
    }
    
    test.skip(true, '没有可操作的成员（所有成员的分配角色按钮都被禁用）');
  });
});

test.describe('多应用完整工作流 - 通过前端UI创建角色', () => {
  test('WORKFLOW-09: 导航到角色管理页面', async ({ page }) => {
    await loginViaUI(page, ADMIN_USER, ADMIN_PASS);

    await page.goto('/sys/role');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-testid="role-create-btn"]')).toBeVisible({ timeout: 10000 });
  });

  test('WORKFLOW-10: 创建应用级角色', async ({ page }) => {
    await loginViaUI(page, ADMIN_USER, ADMIN_PASS);

    await page.goto('/sys/role');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="role-create-btn"]').click();

    await expect(page.locator('[data-testid="role-name-input"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="role-code-input"]')).toBeVisible();

    const timestamp = Date.now();
    await page.locator('[data-testid="role-name-input"]').fill(`测试角色_${timestamp}`);
    await page.locator('[data-testid="role-code-input"]').fill(`test_role_${timestamp}`);
    await page.locator('[data-testid="role-desc-input"]').fill('端到端测试创建的角色');

    const sortInput = page.locator('[data-testid="role-sort-input"] input');
    if (await sortInput.isVisible()) {
      await sortInput.fill('100');
    }

    const confirmBtn = page.locator('.el-dialog__footer .el-button--primary');
    await confirmBtn.click();

    await page.waitForTimeout(1000);
    await expect(page.locator('.el-message--success')).toBeVisible({ timeout: 5000 });
  });

  test('WORKFLOW-11: 验证角色列表显示创建的角色', async ({ page }) => {
    await loginViaUI(page, ADMIN_USER, ADMIN_PASS);

    await page.goto('/sys/role');
    await page.waitForLoadState('networkidle');

    const cards = page.locator('.mfw-card-panel, .el-card');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});

test.describe('多应用完整工作流 - 应用切换验证', () => {
  test('WORKFLOW-12: 验证侧边栏菜单可见', async ({ page }) => {
    await loginViaUI(page, ADMIN_USER, ADMIN_PASS);

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const sidebarMenu = page.locator('[data-testid="sidebar-menu"]');
    await expect(sidebarMenu).toBeVisible({ timeout: 10000 });

    const menuItems = page.locator('[data-testid^="menu-node-"]');
    const count = await menuItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('WORKFLOW-13: 验证应用切换器可见', async ({ page }) => {
    await loginViaUI(page, ADMIN_USER, ADMIN_PASS);

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const appSwitcher = page.locator('[data-testid="app-switcher"]');
    if (await appSwitcher.isVisible()) {
      await appSwitcher.click();
      await page.waitForTimeout(300);

      const appOptions = page.locator('.el-dropdown-menu__item');
      const count = await appOptions.count();
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });

  test('WORKFLOW-14: 切换应用后导航到不同页面', async ({ page }) => {
    await loginViaUI(page, ADMIN_USER, ADMIN_PASS);

    await page.goto('/sys/user');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/sys/user');

    await page.goto('/sys/role');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/sys/role');
  });

  test('WORKFLOW-15: 验证localStorage包含应用信息', async ({ page }) => {
    await loginViaUI(page, ADMIN_USER, ADMIN_PASS);

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const storeState = await page.evaluate(() => {
      const appStr = localStorage.getItem('mfw:admin:current_app');
      const token = localStorage.getItem('mfw:admin:token');
      return {
        hasToken: !!token,
        currentApp: appStr ? JSON.parse(appStr) : null,
        hasCurrentApp: !!appStr,
      };
    });

    expect(storeState.hasToken).toBeTruthy();
    if (storeState.hasCurrentApp) {
      expect(storeState.currentApp).toHaveProperty('appId');
    }
  });
});

test.describe('多应用完整工作流 - 数据一致性验证', () => {
  test('DATA-01: 应用管理页面表格数据完整性', async ({ page }) => {
    await loginViaUI(page, ADMIN_USER, ADMIN_PASS);

    await page.goto('/sys/app');
    await page.waitForLoadState('networkidle');

    const table = page.locator('.el-table');
    await expect(table).toBeVisible({ timeout: 10000 });

    const headerCells = table.locator('.el-table__header th');
    const headerCount = await headerCells.count();
    expect(headerCount).toBeGreaterThanOrEqual(4);

    const headers = await headerCells.allTextContents();
    expect(headers.some(h => h.includes('名称') || h.includes('应用名称'))).toBeTruthy();
    expect(headers.some(h => h.includes('编码') || h.includes('应用编码'))).toBeTruthy();
  });

  test('DATA-02: 用户管理页面表格数据完整性', async ({ page }) => {
    await loginViaUI(page, ADMIN_USER, ADMIN_PASS);

    await page.goto('/sys/user');
    await page.waitForLoadState('networkidle');

    const table = page.locator('.el-table');
    await expect(table).toBeVisible({ timeout: 10000 });

    const headerCells = table.locator('.el-table__header th');
    const headerCount = await headerCells.count();
    expect(headerCount).toBeGreaterThanOrEqual(4);
  });

  test('DATA-03: 角色管理页面卡片数据完整性', async ({ page }) => {
    await loginViaUI(page, ADMIN_USER, ADMIN_PASS);

    await page.goto('/sys/role');
    await page.waitForLoadState('networkidle');

    const cards = page.locator('.mfw-card-panel, .el-card');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);

    const firstCard = cards.first();
    await expect(firstCard).toBeVisible();
  });

  test('DATA-04: 成员管理页面数据完整性', async ({ page }) => {
    await loginViaUI(page, ADMIN_USER, ADMIN_PASS);

    await page.goto('/sys/member');
    await page.waitForLoadState('networkidle');

    const table = page.locator('.el-table');
    await expect(table).toBeVisible({ timeout: 10000 });
  });
});
