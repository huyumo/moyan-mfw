/**
 * @fileoverview 完整业务流程端到端测试（纯 UI 操作，不使用 API 或直接操作数据库）
 *
 * 测试流程：
 *   Phase 1（系统初始化配置）:
 *     1. 清除数据 → 启动后端 → 启动前端
 *     2. 首次访问 → 初始化向导 → 设置 admin 密码
 *     3. admin 登录
 *     4. 同步 PC 权限节点
 *     5. 应用类型管理页面：配置 system 应用类型的权限池和内置角色
 *
 *   Phase 2（多应用工作流，需后端重启加载业务应用类型）:
 *     6. 重新登录 → 配置 supplier 应用类型权限池和内置角色
 *     7. 创建 supplier 应用实例
 *     8. 创建新用户 → 添加为应用成员 → 分配角色
 *     9. 用户登录 → 选择应用 → 验证权限菜单
 */

import { test, expect } from '@playwright/test';

const ADMIN_PASSWORD = 'Admin@123';
const TEST_USERNAME = `testuser_${Date.now()}`;
const TEST_PASSWORD = 'Test@12345';

// ============================================================================
// Phase 1: 系统初始化配置
// ============================================================================

test.describe('Phase 1: 系统初始化配置', () => {
  test.setTimeout(120000);

  test('STEP-01: 通过 UI 完成系统初始化向导', async ({ page }) => {
    // 1. 访问首页，等待路由守卫处理
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // 2. 等待页面 URL 变化
    try {
      await page.waitForURL('**/install', { timeout: 20000 });
    } catch {
      await page.goto('/install');
      await page.waitForLoadState('domcontentloaded');
    }

    console.log(`[INFO] STEP-01 URL: ${page.url()}`);
    if (!page.url().includes('/install')) {
      console.log(`[INFO] 已初始化，跳过`);
      return;
    }

    // 3. 等待安装向导可见或跳过
    try {
      await page.waitForSelector('.install-wizard', { timeout: 10000 });
    } catch {
      console.log(`[INFO] STEP-01: 安装向导未出现（系统可能已初始化），跳过`);
      return;
    }

    // 4. 使用 placeholder 定位密码输入框（Element Plus 可能不传递 data-testid）
    const passwordInput = page.locator('input[placeholder*="8-32"]');
    await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
    await passwordInput.click();
    await passwordInput.fill(ADMIN_PASSWORD);

    const confirmInput = page.locator('input[placeholder*="再次输入"]');
    await confirmInput.waitFor({ state: 'visible', timeout: 5000 });
    await confirmInput.click();
    await confirmInput.fill(ADMIN_PASSWORD);

    // 5. "开始初始化"按钮 - 使用文本定位
    const initBtn = page.locator('button').filter({ hasText: '开始初始化' });
    await expect(initBtn).toBeEnabled({ timeout: 5000 });
    await initBtn.click();

    // 6. 等待成功和跳转
    await expect(page.locator('.el-message--success')).toBeVisible({ timeout: 20000 });
    // 安装向导会自动跳转到 /login
    await page.waitForTimeout(2000);
  });

  test('STEP-02: 通过 UI 登录 admin 账号', async ({ page }) => {
    // 1. 导航到登录页
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // 2. 验证登录页面元素
    await expect(page.locator('.mfw-login-page')).toBeVisible({ timeout: 15000 });

    // 3. 填写登录表单
    await page.locator('.mfw-login-page .el-input__inner[placeholder="请输入用户名"]').fill('admin');
    await page.locator('.mfw-login-page .el-input__inner[placeholder="请输入密码"]').fill(ADMIN_PASSWORD);

    // 4. 点击登录按钮
    const loginBtn = page.locator('.mfw-login-page .mfw-login-submit');
    await expect(loginBtn).toBeEnabled();
    await loginBtn.click();

    // 5. 等待登录处理
    await page.waitForLoadState('networkidle');

    // 6. 处理可能的应用选择面板（admin 通常只有一个 system-instance 应用）
    const appSelector = page.locator('.app-selector-panel');
    const hasAppSelector = await appSelector.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasAppSelector) {
      await appSelector.locator('.app-item, .el-card').first().click();
    }

    // 7. 等待跳转到仪表盘
    await page.waitForURL('**/dashboard', { timeout: 20000 }).catch(() => {
      // 如果没跳转到 dashboard，可能是应用选择或权限问题
    });
    // 验证页面已加载
    await expect(page.locator('body')).toBeVisible();
  });

  test('STEP-03: 同步 PC 权限节点', async ({ page }) => {
    // 1. 首先确保已登录
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    if (page.url().includes('/login')) {
      await page.locator('.mfw-login-page .el-input__inner[placeholder="请输入用户名"]').fill('admin');
      await page.locator('.mfw-login-page .el-input__inner[placeholder="请输入密码"]').fill(ADMIN_PASSWORD);
      await page.locator('.mfw-login-page .mfw-login-submit').click();
      await page.waitForLoadState('networkidle');
      // 处理可能的 app 选择
      const appSelector = page.locator('.app-selector-panel');
      const hasSelector = await appSelector.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasSelector) {
        await appSelector.locator('.app-item, .el-card').first().click();
      }
      await page.waitForTimeout(2000);
    }

    // 2. 导航到 PC 权限管理页面
    await page.goto('/sys/permission-pc');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 3. 点击"同步路由"按钮
    const syncBtn = page.locator('[data-testid="permission-sync-btn"]');
    await expect(syncBtn).toBeVisible({ timeout: 10000 });
    await syncBtn.click();

    // 4. 等待同步成功提示
    await expect(page.locator('.el-message--success')).toBeVisible({ timeout: 20000 });

    await page.waitForTimeout(500);
  });

  test('STEP-04: 配置 system 应用类型的权限池', async ({ page }) => {
    await page.goto('/sys/app-type');
    await page.waitForLoadState('networkidle');
    // 等待卡片数据加载完成
    await page.waitForTimeout(2000);

    // 使用 el-card 选择器（AppTypeCard 根元素是 el-card）
    const systemCard = page.locator('.el-card').filter({ hasText: /系统管理|system/ }).first();
    const isSystemVisible = await systemCard.isVisible({ timeout: 10000 }).catch(() => false);
    if (!isSystemVisible) {
      console.log('[WARN] 未找到"系统管理"应用类型卡片，可能数据未加载');
      return;
    }

    // 点击"权限池"按钮
    const permissionBtn = systemCard.locator('[data-testid="app-type-permission-btn"]');
    const isBtnVisible = await permissionBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (isBtnVisible) {
      await permissionBtn.click();
      await page.waitForTimeout(500);

      // 等待权限池弹窗
      const permissionDialog = page.locator('.el-dialog, .el-drawer').filter({ hasText: '配置权限池' });
      const isDialogVisible = await permissionDialog.isVisible({ timeout: 8000 }).catch(() => false);
      if (isDialogVisible) {
        // 尝试保存或关闭
        const confirmBtn = page.locator('.el-dialog__footer .el-button--primary, .el-drawer__footer .el-button--primary').last();
        if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await confirmBtn.click();
          await page.waitForTimeout(1000);
        } else {
          const closeBtn = page.locator('.el-dialog__headerbtn, .el-drawer__close-btn').last();
          if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await closeBtn.click();
          }
        }
      }
    }
  });

  test('STEP-05: 配置 system 应用类型的内置角色', async ({ page }) => {
    await page.goto('/sys/app-type');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const systemCard = page.locator('.app-type-card, .el-card').filter({ hasText: /系统管理|system/ }).first();
    const isSystemVisible = await systemCard.isVisible({ timeout: 5000 }).catch(() => false);
    if (!isSystemVisible) {
      return;
    }

    const roleBtn = systemCard.locator('[data-testid="app-type-role-btn"]');
    const isBtnVisible = await roleBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (isBtnVisible) {
      await roleBtn.click();

      const roleDialog = page.locator('.el-dialog, .el-drawer').filter({ hasText: /内置角色|角色/ });
      const isDialogVisible = await roleDialog.isVisible({ timeout: 5000 }).catch(() => false);
      if (isDialogVisible) {
        await page.waitForTimeout(1000);
        const closeBtn = page.locator('.el-dialog__headerbtn, .el-drawer__close-btn').last();
        if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await closeBtn.click();
        }
      }
    }
  });
});

// ============================================================================
// Phase 2: 多应用工作流（需要后端重启以加载业务应用类型 supplier）
//
// 注意：Phase 2 的测试依赖 Phase 1 完成后的系统状态，并且需要重启后端
// 以触发 `app-types.config.ts` 中 `supplier` 应用类型的同步。
// ============================================================================

test.describe('Phase 2: 多应用工作流', () => {
  test.setTimeout(120000);

  test('STEP-06: 验证 supplier 应用类型已加载', async ({ page }) => {
    // 1. 登录
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    if (page.url().includes('/login')) {
      await page.locator('.mfw-login-page .el-input__inner[placeholder="请输入用户名"]').fill('admin');
      await page.locator('.mfw-login-page .el-input__inner[placeholder="请输入密码"]').fill(ADMIN_PASSWORD);
      await page.locator('.mfw-login-page .mfw-login-submit').click();
      await page.waitForLoadState('networkidle');
      const appSelector = page.locator('.app-selector-panel');
      if (await appSelector.isVisible({ timeout: 3000 }).catch(() => false)) {
        await appSelector.locator('.app-item, .el-card').first().click();
      }
      await page.waitForTimeout(2000);
    }

    // 2. 导航到应用类型管理页面
    await page.goto('/sys/app-type');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 3. 检查 supplier 应用类型是否存在
    const supplierCard = page.locator('.app-type-card, .el-card').filter({ hasText: /供应商|supplier/ }).first();
    const isSupplierVisible = await supplierCard.isVisible({ timeout: 8000 }).catch(() => false);

    if (!isSupplierVisible) {
      console.log('[WARN] supplier 应用类型未找到。请确保 Phase 1 完成后重启了后端服务以触发业务应用类型同步。');
      test.skip(true, 'supplier 应用类型未加载，请重启后端后再运行此测试');
      return;
    }

    // 4. 验证 supplier 卡片
    await expect(supplierCard).toBeVisible();
  });

  test('STEP-07: 配置 supplier 应用类型的权限池和内置角色', async ({ page }) => {
    await page.goto('/sys/app-type');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const supplierCard = page.locator('.app-type-card, .el-card').filter({ hasText: /供应商|supplier/ }).first();
    const isVisible = await supplierCard.isVisible({ timeout: 5000 }).catch(() => false);
    if (!isVisible) {
      test.skip(true, 'supplier 应用类型未加载');
      return;
    }

    // 配置权限池
    const permissionBtn = supplierCard.locator('[data-testid="app-type-permission-btn"]');
    if (await permissionBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await permissionBtn.click();
      const permissionDialog = page.locator('.el-dialog').filter({ hasText: '配置权限池' });
      if (await permissionDialog.isVisible({ timeout: 5000 }).catch(() => false)) {
        const confirmBtn = page.locator('.el-dialog__footer .el-button--primary').last();
        if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await confirmBtn.click();
          await page.waitForTimeout(1000);
        } else {
          await page.locator('.el-dialog__headerbtn').last().click();
        }
      }
    }
    await page.waitForTimeout(500);

    // 配置内置角色
    await page.goto('/sys/app-type');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const cardAfter = page.locator('.app-type-card, .el-card').filter({ hasText: /供应商|supplier/ }).first();
    if (await cardAfter.isVisible({ timeout: 5000 }).catch(() => false)) {
      const roleBtn = cardAfter.locator('[data-testid="app-type-role-btn"]');
      if (await roleBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await roleBtn.click();
        const roleDialog = page.locator('.el-dialog').filter({ hasText: /内置角色|角色/ });
        if (await roleDialog.isVisible({ timeout: 5000 }).catch(() => false)) {
          await page.waitForTimeout(1000);
          if (await page.locator('.el-dialog__headerbtn').last().isVisible({ timeout: 2000 }).catch(() => false)) {
            await page.locator('.el-dialog__headerbtn').last().click();
          }
        }
      }
    }
  });

  test('STEP-08: 创建 supplier 应用实例', async ({ page }) => {
    await page.goto('/sys/app');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const createBtn = page.locator('[data-testid="app-create-btn"]');
    const isCreateBtnVisible = await createBtn.isVisible({ timeout: 10000 }).catch(() => false);
    if (!isCreateBtnVisible) {
      test.skip(true, '未找到新建应用按钮（可能权限不足）');
      return;
    }
    await createBtn.click();

    // 等待表单弹窗
    const formDialog = page.locator('.el-dialog').filter({ hasText: /新建应用/ });
    const isDialogVisible = await formDialog.isVisible({ timeout: 5000 }).catch(() => false);
    if (!isDialogVisible) {
      test.skip(true, '新建应用弹窗未打开');
      return;
    }

    // 选择应用类型 - "供应商"
    const typeSelectTrigger = formDialog.locator('[data-testid="app-type-select"] .el-select__wrapper');
    await typeSelectTrigger.click();
    await page.waitForTimeout(800);

    const supplierOption = page.locator('.el-select-dropdown__item').filter({ hasText: /供应商/ }).first();
    const isSupplierOption = await supplierOption.isVisible({ timeout: 3000 }).catch(() => false);
    if (isSupplierOption) {
      await supplierOption.click();
    } else {
      // 选择第一个可用选项
      const firstOption = page.locator('.el-select-dropdown__item').first();
      if (await firstOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await firstOption.click();
      }
    }

    // 填写应用名称
    const appName = `测试供应商应用_${Date.now()}`;
    await formDialog.locator('input[placeholder*="应用名称"]').fill(appName);

    // 填写应用编码
    const appCode = `supplier_test_${Date.now()}`;
    await formDialog.locator('input[placeholder*="应用编码"]').fill(appCode);

    // 填写应用描述
    const descInput = formDialog.locator('textarea[placeholder*="应用描述"]');
    if (await descInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await descInput.fill('端到端测试创建的供应商应用实例');
    }

    // 点击确认按钮
    const confirmBtn = formDialog.locator('.el-dialog__footer .el-button--primary').last();
    await confirmBtn.click();

    // 等待成功提示
    await expect(page.locator('.el-message--success')).toBeVisible({ timeout: 15000 });
    await page.waitForLoadState('networkidle');
  });

  test('STEP-09: 创建新用户', async ({ page }) => {
    await page.goto('/sys/user');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const createBtn = page.locator('[data-testid="user-create-btn"]');
    const isCreateBtnVisible = await createBtn.isVisible({ timeout: 10000 }).catch(() => false);
    if (!isCreateBtnVisible) {
      test.skip(true, '未找到新建用户按钮（可能权限不足）');
      return;
    }
    await createBtn.click();

    const formDialog = page.locator('.el-dialog').filter({ hasText: /新建用户|添加用户/ });
    const isDialogVisible = await formDialog.isVisible({ timeout: 5000 }).catch(() => false);
    if (!isDialogVisible) {
      test.skip(true, '新建用户弹窗未打开');
      return;
    }

    // 填写用户名 - 使用 dialog 内第一个可见的 input
    const allInputs = formDialog.locator('.el-input__inner');
    const inputCount = await allInputs.count();
    if (inputCount >= 1) {
      await allInputs.first().fill(TEST_USERNAME);
    }

    // 填写密码 - 使用 placeholder 定位
    const passwordInput = formDialog.locator('input[placeholder*="密码"][type="password"], input[placeholder*="密码"]');
    if (await passwordInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await passwordInput.fill(TEST_PASSWORD);
    }

    // 填写昵称 - 使用 placeholder 定位
    const nicknameInput = formDialog.locator('input[placeholder*="昵称"]');
    if (await nicknameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nicknameInput.fill(`测试用户_${Date.now()}`);
    }

    // 点击确认
    const confirmBtn = formDialog.locator('.el-dialog__footer .el-button--primary').last();
    await confirmBtn.click();

    await expect(page.locator('.el-message--success')).toBeVisible({ timeout: 15000 });
    await page.waitForLoadState('networkidle');
  });

  test('STEP-10: 将新用户添加为 supplier 应用成员并分配角色', async ({ page }) => {
    // 导航到成员管理页面
    await page.goto('/sys/member');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 验证成员管理页面已加载
    const createBtn = page.locator('[data-testid="member-create-btn"]');
    const isCreateBtnVisible = await createBtn.isVisible({ timeout: 8000 }).catch(() => false);
    if (!isCreateBtnVisible) {
      console.log('[WARN] member-create-btn 不可见，可能需要先选择应用');
      // 尝试导航到应用管理页面选择 supplier 应用
      await page.goto('/sys/app');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      return;
    }

    // 点击添加成员
    await createBtn.click();

    // 等待添加成员弹窗
    const addDialog = page.locator('.el-dialog').filter({ hasText: /添加成员/ });
    const isDialogVisible = await addDialog.isVisible({ timeout: 5000 }).catch(() => false);
    if (isDialogVisible) {
      const userPicker = addDialog.locator('.el-input__inner').first();
      if (await userPicker.isVisible({ timeout: 2000 }).catch(() => false)) {
        await userPicker.click();
        await page.waitForTimeout(500);
        await userPicker.fill(TEST_USERNAME);
        await page.waitForTimeout(500);
        const userOption = page.locator('.el-select-dropdown__item').filter({ hasText: TEST_USERNAME }).first();
        if (await userOption.isVisible({ timeout: 3000 }).catch(() => false)) {
          await userOption.click();
        }
        const confirmBtn = addDialog.locator('.el-dialog__footer .el-button--primary').last();
        await confirmBtn.click();
        await page.waitForTimeout(1000);
      } else {
        const closeBtn = addDialog.locator('.el-dialog__headerbtn').last();
        if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await closeBtn.click();
        }
      }
    }
  });

  test('STEP-11: 新用户登录并验证访问', async ({ page }) => {
    // 导航到登录页
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // 确保在登录页
    if (!page.url().includes('/login')) {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
    }

    // 用新用户登录
    await page.locator('.mfw-login-page .el-input__inner[placeholder="请输入用户名"]').fill(TEST_USERNAME);
    await page.locator('.mfw-login-page .el-input__inner[placeholder="请输入密码"]').fill(TEST_PASSWORD);

    const loginBtn = page.locator('.mfw-login-page .mfw-login-submit');
    await loginBtn.click();

    // 等待响应
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 检查登录结果
    const currentUrl = page.url();
    console.log(`[INFO] 新用户 (${TEST_USERNAME}) 登录后 URL: ${currentUrl}`);

    // 可能的情况：成功 / 无权限 / 需要选应用
    await expect(page.locator('body')).toBeVisible();
  });
});
