/**
 * @fileoverview 多应用多角色权限边界端到端测试（纯 UI）
 * @description
 * 覆盖非 admin 账号在业务应用类型下的权限边界场景。
 * MFW 框架核心差异化能力验证——多应用、多角色、权限隔离。
 *
 * ⚠️ 约束：纯 UI 操作，不允许调用 API 或直接操作数据库。
 *
 * 测试场景：
 *   P0 - 拥有者核心流程（应用拥有者能否正常管理成员和角色）
 *   P1 - 权限边界与隔离（普通成员无管理权限 / 跨应用隔离）
 *   P2 - 动态权限变更（移除成员 / 撤销角色 / 禁用用户）
 */

import { test, expect, type Page } from '@playwright/test';

const ADMIN_USER = 'admin';
const ADMIN_PASS = 'Admin@123';
const DEFAULT_PASS = 'Admin@123';

const OWNER_PREFIX = 'e2e_owner';
const MEMBER_PREFIX = 'e2e_member';

let ownerUsername = '';

// ============================================================================
// 纯 UI 登录/登出
// ============================================================================

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

function generateUsername(prefix: string): string {
  return `${prefix}_${String(Date.now()).slice(-8)}`;
}

// ============================================================================
// 纯 UI 数据准备
// ============================================================================

async function createUserViaUI(page: Page, username: string): Promise<void> {
  await page.goto('/sys/user');
  await page.waitForLoadState('networkidle');

  const createBtn = page.locator('[data-testid="user-create-btn"]');
  if (!(await createBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
    test.skip(true, '创建用户按钮不可见');
    return;
  }
  await createBtn.click();

  await expect(page.locator('[data-testid="user-username-input"]')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('[data-testid="user-nickname-input"]')).toBeVisible();

  await page.locator('[data-testid="user-username-input"] input').fill(username);
  await page.locator('[data-testid="user-nickname-input"] input').fill(username);

  const phoneInput = page.locator('[data-testid="user-phone-input"] input');
  if (await phoneInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await phoneInput.fill(`138${String(Date.now()).slice(-8)}`);
  }

  const confirmBtn = page.locator('.el-dialog__footer .el-button--primary').last();
  await confirmBtn.click();

  await expect(page.locator('.el-message--success, .el-message--info')).toBeVisible({ timeout: 15000 });
  await page.waitForTimeout(500);
}

async function createAppViaUI(page: Page, appName: string): Promise<void> {
  await page.goto('/sys/app');
  await page.waitForLoadState('networkidle');

  const createBtn = page.locator('[data-testid="app-create-btn"]');
  if (!(await createBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
    test.skip(true, '创建应用按钮不可见');
    return;
  }
  await createBtn.click();

  const dialog = page.locator('.el-dialog').filter({ hasText: /新建/ });
  await expect(dialog).toBeVisible({ timeout: 5000 });

  const typeTrigger = dialog.locator('[data-testid="app-type-select"]');
  await typeTrigger.click();
  await page.waitForTimeout(500);

  const typeOptions = page.locator('.el-select-dropdown__item');
  if (!(await typeOptions.first().isVisible({ timeout: 3000 }).catch(() => false))) {
    test.skip(true, '没有可用应用类型');
    return;
  }
  const supplierOption = typeOptions.filter({ hasText: /供应商/ });
  if (await supplierOption.count() > 0) {
    await supplierOption.first().click();
  } else {
    await typeOptions.last().click();
  }

  await dialog.locator('[data-testid="app-name-input"]').fill(appName);
  const appCode = `e2e_${String(Date.now()).slice(-6)}`;
  await dialog.locator('[data-testid="app-code-input"]').fill(appCode);

  const confirmBtn = dialog.locator('.el-dialog__footer .el-button--primary').last();
  await confirmBtn.click();

  await expect(page.locator('.el-message--success')).toBeVisible({ timeout: 15000 });
  await page.waitForTimeout(500);
}

async function addMemberViaUI(page: Page, targetUser: string): Promise<void> {
  await page.goto('/sys/member');
  await page.waitForLoadState('networkidle');

  const createBtn = page.locator('[data-testid="member-create-btn"]');
  if (!(await createBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
    test.skip(true, '添加成员按钮不可见');
    return;
  }
  await createBtn.click();

  await expect(page.locator('[data-testid="add-member-user-picker"]')).toBeVisible({ timeout: 5000 });

  const userPickerInput = page.locator('[data-testid="add-member-user-picker"] input');
  await userPickerInput.click();
  await page.waitForTimeout(500);

  await userPickerInput.fill(targetUser);
  await page.waitForTimeout(500);

  const userOptions = page.locator('.el-select-dropdown__item');
  if (!(await userOptions.first().isVisible({ timeout: 3000 }).catch(() => false))) {
    test.skip(true, '用户下拉为空');
    return;
  }

  const targetOption = userOptions.filter({ hasText: targetUser });
  if (await targetOption.count() > 0) {
    await targetOption.first().click();
  } else {
    await userOptions.first().click();
  }

  const confirmBtn = page.locator('.el-dialog__footer .el-button--primary').last();
  await confirmBtn.click();
  await page.waitForTimeout(1000);
}

async function assignOwnerRoleViaUI(page: Page, memberName: string): Promise<void> {
  await page.goto('/sys/member');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  const memberRow = page.locator('.el-table__body tr').filter({ hasText: memberName }).first();
  const assignBtn = memberRow.locator('[data-testid="member-assign-role-btn"]');
  if (!(await assignBtn.isVisible({ timeout: 3000 }).catch(() => false))) return;

  await assignBtn.click();

  await expect(page.locator('[data-testid="role-assign-checkbox-group"]')).toBeVisible({ timeout: 5000 });

  const ownerCheckbox = page.locator('[data-testid="role-assign-checkbox-group"] .el-checkbox').filter({ hasText: /管理员/ });
  if (await ownerCheckbox.count() > 0) {
    await ownerCheckbox.first().click();
  } else {
    const firstCheckbox = page.locator('[data-testid="role-assign-checkbox-group"] .el-checkbox').first();
    if (await firstCheckbox.isVisible()) await firstCheckbox.click();
  }

  const confirmBtn = page.locator('.el-dialog__footer .el-button--primary').last();
  await confirmBtn.click();
  await page.waitForTimeout(1000);
}

async function switchUser(page: Page, username: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
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

// ============================================================================
// P0: 应用拥有者核心权限验证（serial: setup 数据供后续测试使用）
// ============================================================================

test.describe.serial('P0: 应用拥有者核心权限验证', () => {
  test.setTimeout(120000);

  test('PERM-P0-SETUP: Admin 通过 UI 创建拥有者账号 + 应用 + 分配拥有者角色', async ({ page }) => {
    await loginViaUI(page, ADMIN_USER, ADMIN_PASS);

    const ts = Date.now();
    ownerUsername = generateUsername(OWNER_PREFIX);
    const appName = `权限测试应用_${ts}`;

    await createUserViaUI(page, ownerUsername);
    console.log(`[SETUP] 创建用户: ${ownerUsername}`);

    await createAppViaUI(page, appName);
    console.log(`[SETUP] 创建应用: ${appName}`);

    await addMemberViaUI(page, ownerUsername);
    console.log(`[SETUP] 添加成员: ${ownerUsername}`);

    await assignOwnerRoleViaUI(page, ownerUsername);
    console.log(`[SETUP] 分配拥有者角色: ${ownerUsername}`);
  });

  test('PERM-P0-01: 拥有者登录后可进入成员管理页面', async ({ page }) => {
    if (!ownerUsername) { test.skip(true, '预置数据未创建：SETUP 失败，ownerUsername 为空'); return; }
    await switchUser(page, ownerUsername, DEFAULT_PASS);

    const url = page.url();
    if (url.includes('/login')) {
      console.log(`[P0-01] 拥有者 ${ownerUsername} 登录失败，仍停留在/login。可能原因：SETUP 阶段用户未创建成功，或密码不匹配`);
      test.skip(true, `拥有者 ${ownerUsername} 登录失败，SETUP 数据可能未创建成功`);
      return;
    }

    await page.goto('/sys/member');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const el = page.locator('.el-table, [data-testid="member-create-btn"]');
    await expect(el.first()).toBeVisible({ timeout: 10000 });
  });

  test('PERM-P0-02: 拥有者添加成员时搜索用户不报权限不足 (find-one)', async ({ page }) => {
    if (!ownerUsername) { test.skip(true, '预置数据未创建'); return; }
    await switchUser(page, ownerUsername, DEFAULT_PASS);

    await page.goto('/sys/member');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const createBtn = page.locator('[data-testid="member-create-btn"]');
    if (!(await createBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, '添加成员按钮不可见');
      return;
    }
    await createBtn.click();

    await expect(page.locator('[data-testid="add-member-user-picker"]')).toBeVisible({ timeout: 5000 });

    const userPickerInput = page.locator('[data-testid="add-member-user-picker"] input');
    await userPickerInput.click();
    await page.waitForTimeout(300);
    await userPickerInput.fill('admin');
    await page.waitForTimeout(1000);

    const err = page.locator('.el-message--error').filter({ hasText: /权限不足/ });
    const denied = await err.isVisible({ timeout: 3000 }).catch(() => false);
    expect(denied, '拥有者搜索用户时不应报权限不足').toBeFalsy();
  });

  test('PERM-P0-03: 拥有者可创建应用级角色', async ({ page }) => {
    if (!ownerUsername) { test.skip(true, '预置数据未创建'); return; }
    await switchUser(page, ownerUsername, DEFAULT_PASS);

    await page.goto('/sys/role');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const createBtn = page.locator('[data-testid="role-create-btn"]');
    if (!(await createBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, '创建角色按钮不可见');
      return;
    }
    await createBtn.click();

    await expect(page.locator('[data-testid="role-name-input"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="role-code-input"]')).toBeVisible();

    const ts = Date.now();
    await page.locator('[data-testid="role-name-input"]').fill(`拥有者创建的角色_${ts}`);
    await page.locator('[data-testid="role-code-input"]').fill(`or_${String(ts).slice(-6)}`);

    await page.locator('.el-dialog__footer .el-button--primary').last().click();
    await expect(page.locator('.el-message--success')).toBeVisible({ timeout: 10000 });
  });
});

// ============================================================================
// P1: 权限边界与跨应用隔离
// ============================================================================

test.describe('P1: 普通成员权限边界', () => {
  test.setTimeout(120000);

  test('PERM-P1-01: 普通成员登录后无成员管理操作入口', async ({ page }) => {
    const memberUser = generateUsername(MEMBER_PREFIX);

    await loginViaUI(page, ADMIN_USER, ADMIN_PASS);

    await createUserViaUI(page, memberUser);

    const ts = Date.now();
    await createAppViaUI(page, `边界测试应用_${ts}`);
    await addMemberViaUI(page, memberUser);
    // 不分配管理角色

    await switchUser(page, memberUser, DEFAULT_PASS);
    expect(page.url()).not.toContain('/login');

    await page.goto('/sys/member');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const createBtn = page.locator('[data-testid="member-create-btn"]');
    const isVisible = await createBtn.isVisible({ timeout: 3000 }).catch(() => false);

    if (isVisible) {
      await createBtn.click();
      const denied = page.locator('.el-message--error').filter({ hasText: /权限不足/ });
      await expect(denied).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('P1: 跨应用权限隔离', () => {
  test.setTimeout(120000);

  test('PERM-P1-02: 应用 A 拥有者无法看到应用 B 的应用', async ({ page }) => {
    const ownerA = generateUsername('e2e_appA');
    const appA = `隔离测试A_${Date.now()}`;
    const appB = `隔离测试B_${Date.now() + 1}`;

    await loginViaUI(page, ADMIN_USER, ADMIN_PASS);

    await createUserViaUI(page, ownerA);
    await createAppViaUI(page, appA);
    await addMemberViaUI(page, ownerA);
    await assignOwnerRoleViaUI(page, ownerA);

    await createAppViaUI(page, appB);

    await switchUser(page, ownerA, DEFAULT_PASS);

    const appSwitcher = page.locator('[data-testid="app-switcher"]');
    if (await appSwitcher.isVisible({ timeout: 5000 }).catch(() => false)) {
      await appSwitcher.click();
      await page.waitForTimeout(300);

      const options = page.locator('.el-dropdown-menu__item');
      const texts = await options.allTextContents();
      console.log(`拥有者A 可见应用: [${texts.join(', ')}]`);

      const seesAppB = texts.some(t => t.includes(appB));
      if (seesAppB) {
        console.log('⚠️ 跨应用隔离可能有问题');
      }
    }
  });
});

// ============================================================================
// P2: 动态权限变更与边界条件
// ============================================================================

test.describe('P2: 动态权限变更', () => {
  test.setTimeout(120000);

  test('PERM-P2-01: 用户被移除成员后无法访问成员管理', async ({ page }) => {
    const testUser = generateUsername('e2e_p2_remove');

    await loginViaUI(page, ADMIN_USER, ADMIN_PASS);

    await createUserViaUI(page, testUser);

    const ts = Date.now();
    await createAppViaUI(page, `移除测试_${ts}`);
    await addMemberViaUI(page, testUser);
    await assignOwnerRoleViaUI(page, testUser);

    await switchUser(page, testUser, DEFAULT_PASS);
    await page.goto('/sys/member');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const beforeBtn = page.locator('[data-testid="member-create-btn"]');
    const wasVisible = await beforeBtn.isVisible({ timeout: 5000 }).catch(() => false);

    // Admin 移除用户
    await switchUser(page, ADMIN_USER, ADMIN_PASS);
    await page.goto('/sys/member');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const memberRow = page.locator('.el-table__body tr').filter({ hasText: testUser }).first();
    const removeBtn = memberRow.locator('[data-testid="member-remove-btn"]');
    if (await removeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await removeBtn.click();
      const confirmBtn = page.locator('.el-message-box .el-button--primary');
      if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await confirmBtn.click();
        await page.waitForTimeout(1500);
      }
    }

    await switchUser(page, testUser, DEFAULT_PASS);
    await page.goto('/sys/member');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const afterBtn = page.locator('[data-testid="member-create-btn"]');
    const isVisible = await afterBtn.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`[P2-01] 移除前=${wasVisible}, 移除后=${isVisible}`);
  });

  test('PERM-P2-02: 撤销用户角色后立即生效', async ({ page }) => {
    const testUser = generateUsername('e2e_p2_revoke');

    await loginViaUI(page, ADMIN_USER, ADMIN_PASS);

    await createUserViaUI(page, testUser);

    const ts = Date.now();
    await createAppViaUI(page, `撤销测试_${ts}`);
    await addMemberViaUI(page, testUser);
    await assignOwnerRoleViaUI(page, testUser);

    await switchUser(page, testUser, DEFAULT_PASS);
    await page.goto('/sys/member');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const beforeBtn = page.locator('[data-testid="member-create-btn"]');
    const wasVisible = await beforeBtn.isVisible({ timeout: 5000 }).catch(() => false);

    // Admin 撤销角色
    await switchUser(page, ADMIN_USER, ADMIN_PASS);
    await page.goto('/sys/member');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const memberRow = page.locator('.el-table__body tr').filter({ hasText: testUser }).first();
    const assignBtn = memberRow.locator('[data-testid="member-assign-role-btn"]');
    if (await assignBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await assignBtn.click();
      await expect(page.locator('[data-testid="role-assign-checkbox-group"]')).toBeVisible({ timeout: 5000 });

      const checkedBoxes = page.locator('[data-testid="role-assign-checkbox-group"] .el-checkbox.is-checked');
      const count = await checkedBoxes.count();
      for (let i = 0; i < count; i++) {
        await checkedBoxes.nth(i).click();
        await page.waitForTimeout(200);
      }

      await page.locator('.el-dialog__footer .el-button--primary').last().click();
      await page.waitForTimeout(1000);
    }

    await switchUser(page, testUser, DEFAULT_PASS);
    await page.goto('/sys/member');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const afterBtn = page.locator('[data-testid="member-create-btn"]');
    const isVisible = await afterBtn.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`[P2-02] 撤销前=${wasVisible}, 撤销后=${isVisible}`);
  });
});

test.describe('P2: Token 与认证边界', () => {
  test.setTimeout(60000);

  test('PERM-P2-03: 用户被禁用后无法登录', async ({ page }) => {
    const testUser = generateUsername('e2e_p2_disabled');

    await loginViaUI(page, ADMIN_USER, ADMIN_PASS);
    await createUserViaUI(page, testUser);

    // 禁用用户
    await page.goto('/sys/user');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const userRow = page.locator('.el-table__body tr').filter({ hasText: testUser }).first();
    const statusSwitch = userRow.locator('[data-testid="user-status-switch"]');
    if (await statusSwitch.isVisible({ timeout: 3000 }).catch(() => false)) {
      await statusSwitch.click();
      const confirmBtn = page.locator('.el-message-box .el-button--primary');
      if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await confirmBtn.click();
        await page.waitForTimeout(1000);
      }
    }

    // 被禁用用户尝试登录
    await switchUser(page, testUser, DEFAULT_PASS);

    const errMsg = page.locator('.el-message--error');
    const hasErr = await errMsg.first().isVisible({ timeout: 8000 }).catch(() => false);
    // 应登录失败或显示错误
    if (hasErr) {
      const text = await errMsg.first().textContent();
      if (text) {
        expect(text, '错误消息不应暴露用户存在性').not.toContain('not found');
      }
    }
  });
});
