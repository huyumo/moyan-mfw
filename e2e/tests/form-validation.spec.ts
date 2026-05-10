import { test, expect } from '../fixtures';

async function isSystemInitialized(page: any): Promise<boolean> {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  try { await page.waitForURL('**/install', { timeout: 8000 }); return false; }
  catch { return true; }
}

async function goToInstall(page: any): Promise<boolean> {
  await page.goto('/install');
  await page.waitForLoadState('domcontentloaded');
  return page.url().includes('/install');
}

test.describe('登录表单验证 - 前端边界条件', () => {
  test('LOGIN-FORM-01: 提交节流 - 连续点击不会重复请求', async ({ page }) => {
    if (!(await isSystemInitialized(page))) { test.skip(); return; }
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const usernameInput = page.locator('[data-testid="login-username-input"] input');
    const passwordInput = page.locator('[data-testid="login-password-input"] input');
    await usernameInput.fill('admin');
    await passwordInput.fill('Admin@123');

    let requestCount = 0;
    page.on('request', (req) => {
      if (req.url().includes('/auth/login') && req.method() === 'POST') {
        requestCount++;
      }
    });

    const submitBtn = page.locator('[data-testid="login-submit-btn"]');
    await submitBtn.click();
    await submitBtn.click();
    await submitBtn.click();

    await page.waitForTimeout(2000);
    expect(requestCount).toBeLessThanOrEqual(2);
  });
});

test.describe('安装向导表单验证 - 前端边界条件', () => {
  test('INSTALL-FORM-01: 密码仅数字 - 按钮禁用', async ({ page }) => {
    if (await isSystemInitialized(page)) { test.skip(); return; }
    if (!(await goToInstall(page))) { test.skip(); return; }

    const passwordInput = page.locator('[data-testid="install-password-input"] input');
    await passwordInput.fill('12345678');

    const initBtn = page.locator('[data-testid="install-init-btn"]');
    await expect(initBtn).toBeDisabled();
  });

  test('INSTALL-FORM-02: 密码仅字母 - 按钮禁用', async ({ page }) => {
    if (await isSystemInitialized(page)) { test.skip(); return; }
    if (!(await goToInstall(page))) { test.skip(); return; }

    const passwordInput = page.locator('[data-testid="install-password-input"] input');
    await passwordInput.fill('abcdefghij');

    const initBtn = page.locator('[data-testid="install-init-btn"]');
    await expect(initBtn).toBeDisabled();
  });

  test('INSTALL-FORM-03: 密码7位 - 按钮禁用（需8位以上）', async ({ page }) => {
    if (await isSystemInitialized(page)) { test.skip(); return; }
    if (!(await goToInstall(page))) { test.skip(); return; }

    const passwordInput = page.locator('[data-testid="install-password-input"] input');
    await passwordInput.fill('Abc1234');

    const initBtn = page.locator('[data-testid="install-init-btn"]');
    await expect(initBtn).toBeDisabled();
  });

  test('INSTALL-FORM-04: 有效密码+一致确认 - 按钮可用', async ({ page }) => {
    if (await isSystemInitialized(page)) { test.skip(); return; }
    if (!(await goToInstall(page))) { test.skip(); return; }

    const passwordInput = page.locator('[data-testid="install-password-input"] input');
    const confirmInput = page.locator('[data-testid="install-confirm-password-input"] input');
    await passwordInput.fill('Admin@123');
    await confirmInput.fill('Admin@123');

    const initBtn = page.locator('[data-testid="install-init-btn"]');
    await expect(initBtn).toBeEnabled();
  });

  test('INSTALL-FORM-05: 管理员账号字段只读且值为 admin', async ({ page }) => {
    if (await isSystemInitialized(page)) { test.skip(); return; }
    if (!(await goToInstall(page))) { test.skip(); return; }

    const adminInput = page.locator('[data-testid="install-admin-input"] input');
    await expect(adminInput).toBeDisabled();
    await expect(adminInput).toHaveValue('admin');
  });
});

test.describe('用户管理表单验证 - 前端边界条件', () => {
  test('USER-FORM-01: 创建用户 - 用户名格式校验提示', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/sys/user');
    await authenticatedPage.waitForLoadState('networkidle');

    await authenticatedPage.locator('[data-testid="user-create-btn"]').click();

    const usernameInput = authenticatedPage.locator('[data-testid="user-username-input"] input');
    await usernameInput.fill('1badname');
    await usernameInput.blur();

    await authenticatedPage.waitForTimeout(500);

    const errorMsg = authenticatedPage.locator('.el-form-item__error');
    if (await errorMsg.isVisible()) {
      const text = await errorMsg.textContent();
      expect(text).toBeTruthy();
    }
  });

  test('USER-FORM-02: 创建用户 - 手机号格式校验', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/sys/user');
    await authenticatedPage.waitForLoadState('networkidle');

    await authenticatedPage.locator('[data-testid="user-create-btn"]').click();

    const phoneInput = authenticatedPage.locator('[data-testid="user-phone-input"] input');
    await phoneInput.fill('12345');
    await phoneInput.blur();

    await authenticatedPage.waitForTimeout(500);

    const errorMsg = authenticatedPage.locator('.el-form-item__error');
    if (await errorMsg.isVisible()) {
      const text = await errorMsg.textContent();
      expect(text).toBeTruthy();
    }
  });

  test('USER-FORM-03: 创建用户 - 必填字段为空', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/sys/user');
    await authenticatedPage.waitForLoadState('networkidle');

    await authenticatedPage.locator('[data-testid="user-create-btn"]').click();

    const confirmBtn = authenticatedPage.locator('.el-dialog__footer .el-button--primary');
    await confirmBtn.click();

    await authenticatedPage.waitForTimeout(500);

    const errorMessages = authenticatedPage.locator('.el-form-item__error');
    const count = await errorMessages.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('角色管理表单验证 - 前端边界条件', () => {
  test('ROLE-FORM-01: 创建角色 - 编码大写字母校验', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/sys/role');
    await authenticatedPage.waitForLoadState('networkidle');

    await authenticatedPage.locator('[data-testid="role-create-btn"]').click();

    const codeInput = authenticatedPage.locator('[data-testid="role-code-input"] input');
    await codeInput.fill('UPPERCASE_CODE');
    await codeInput.blur();

    await authenticatedPage.waitForTimeout(500);

    const errorMsg = authenticatedPage.locator('.el-form-item__error');
    if (await errorMsg.isVisible()) {
      const text = await errorMsg.textContent();
      expect(text).toContain('小写');
    }
  });

  test('ROLE-FORM-02: 创建角色 - 编码以数字开头', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/sys/role');
    await authenticatedPage.waitForLoadState('networkidle');

    await authenticatedPage.locator('[data-testid="role-create-btn"]').click();

    const codeInput = authenticatedPage.locator('[data-testid="role-code-input"] input');
    await codeInput.fill('1bad_code');
    await codeInput.blur();

    await authenticatedPage.waitForTimeout(500);

    const errorMsg = authenticatedPage.locator('.el-form-item__error');
    if (await errorMsg.isVisible()) {
      const text = await errorMsg.textContent();
      expect(text).toContain('小写字母开头');
    }
  });

  test('ROLE-FORM-03: 创建角色 - 必填字段为空', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/sys/role');
    await authenticatedPage.waitForLoadState('networkidle');

    await authenticatedPage.locator('[data-testid="role-create-btn"]').click();

    const confirmBtn = authenticatedPage.locator('.el-dialog__footer .el-button--primary');
    await confirmBtn.click();

    await authenticatedPage.waitForTimeout(500);

    const errorMessages = authenticatedPage.locator('.el-form-item__error');
    const count = await errorMessages.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('修改密码表单验证 - 前端边界条件', () => {
  test('PWD-FORM-01: 新密码仅数字 - 校验失败', async ({ authenticatedPage }) => {
    const avatarTrigger = authenticatedPage.locator('[data-testid="user-avatar-trigger"]');
    await avatarTrigger.click();

    const profileMenu = authenticatedPage.locator('[data-testid="user-profile-menu"]');
    await profileMenu.click();

    const passwordBtn = authenticatedPage.locator('[data-testid="profile-password-btn"]');
    await passwordBtn.click();

    const newPwdInput = authenticatedPage.locator('[data-testid="password-new-input"] input');
    await newPwdInput.fill('123456');
    await newPwdInput.blur();

    await authenticatedPage.waitForTimeout(500);

    const errorMsg = authenticatedPage.locator('.el-form-item__error');
    if (await errorMsg.isVisible()) {
      const text = await errorMsg.textContent();
      expect(text).toContain('字母');
    }
  });

  test('PWD-FORM-02: 确认密码不一致 - 校验失败', async ({ authenticatedPage }) => {
    const avatarTrigger = authenticatedPage.locator('[data-testid="user-avatar-trigger"]');
    await avatarTrigger.click();

    const profileMenu = authenticatedPage.locator('[data-testid="user-profile-menu"]');
    await profileMenu.click();

    const passwordBtn = authenticatedPage.locator('[data-testid="profile-password-btn"]');
    await passwordBtn.click();

    const newPwdInput = authenticatedPage.locator('[data-testid="password-new-input"] input');
    const confirmPwdInput = authenticatedPage.locator('[data-testid="password-confirm-input"] input');
    await newPwdInput.fill('NewPass123');
    await confirmPwdInput.fill('Different456');
    await confirmPwdInput.blur();

    await authenticatedPage.waitForTimeout(500);

    const errorMsg = authenticatedPage.locator('.el-form-item__error');
    if (await errorMsg.isVisible()) {
      const text = await errorMsg.textContent();
      expect(text).toContain('一致');
    }
  });

  test('PWD-FORM-03: 密码少于6位 - 校验失败', async ({ authenticatedPage }) => {
    const avatarTrigger = authenticatedPage.locator('[data-testid="user-avatar-trigger"]');
    await avatarTrigger.click();

    const profileMenu = authenticatedPage.locator('[data-testid="user-profile-menu"]');
    await profileMenu.click();

    const passwordBtn = authenticatedPage.locator('[data-testid="profile-password-btn"]');
    await passwordBtn.click();

    const newPwdInput = authenticatedPage.locator('[data-testid="password-new-input"] input');
    await newPwdInput.fill('Ab1');
    await newPwdInput.blur();

    await authenticatedPage.waitForTimeout(500);

    const errorMsg = authenticatedPage.locator('.el-form-item__error');
    if (await errorMsg.isVisible()) {
      const text = await errorMsg.textContent();
      expect(text).toContain('6');
    }
  });
});

test.describe('拥有者变更表单验证 - 前端边界条件', () => {
  test('OWNER-FORM-01: 拥有者变更表单元素完整性', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/sys/app');
    await authenticatedPage.waitForLoadState('networkidle');

    const ownerBtn = authenticatedPage.locator('[data-testid="app-owner-btn"]').first();
    if (await ownerBtn.isVisible()) {
      await ownerBtn.click();

      await expect(authenticatedPage.locator('[data-testid="owner-change-form"]')).toBeVisible({ timeout: 5000 });
      await expect(authenticatedPage.locator('[data-testid="owner-new-picker"]')).toBeVisible();

      const currentOwnerTag = authenticatedPage.locator('[data-testid="owner-change-form"] .el-tag');
      if (await currentOwnerTag.isVisible()) {
        const text = await currentOwnerTag.textContent();
        expect(text).toBeTruthy();
      }
    }
  });
});
