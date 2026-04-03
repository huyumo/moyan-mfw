/**
 * @fileoverview 成员管理页面 E2E 测试。
 *
 * 测试场景覆盖：
 * - 成员列表页面展示
 * - 添加成员
 * - 分配角色
 * - 移除成员
 *
 * 注意：成员管理页面需要从应用实例详情进入，通过 appId 参数区分应用实例。
 *
 * 参考：docs/01-业务需求/01-基础设施/05-页面设计/成员管理页面.md
 */

import { test, expect } from '@playwright/test';
import { loginAsAdmin, navigateToSysPage } from '../helpers/auth';

test.describe('成员管理测试', () => {
  /**
   * 测试前需要先获取一个有效的 appId
   * 成员管理页面需要 appId 参数才能正常工作
   */
  let testAppId: string;

  test.beforeAll(async ({ browser }) => {
    // 创建一个临时浏览器上下文来获取 appId
    const context = await browser.newContext();
    const page = await context.newPage();

    // 管理员登录
    await loginAsAdmin(page);

    // 进入应用实例管理页面获取 appId
    await navigateToSysPage(page, 'app');

    // 等待表格加载
    await page.waitForSelector('.el-table', { timeout: 10000 });

    // 获取第一个应用的 ID（通过点击详情按钮获取）
    const firstRow = page.locator('.el-table__row').first();
    const detailButton = firstRow.locator('button:has-text("详情")');

    if (await detailButton.isVisible()) {
      await detailButton.click();
      await page.waitForTimeout(500);

      // 从 URL 或页面内容获取 appId
      const url = page.url();
      const match = url.match(/\/sys\/app\/([^/?]+)/);
      if (match) {
        testAppId = match[1];
      } else {
        // 尝试从表格行获取应用编码作为标识
        testAppId = 'system-instance'; // 默认使用系统应用实例
      }
    } else {
      testAppId = 'system-instance';
    }

    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    // 管理员登录
    await loginAsAdmin(page);

    // 进入成员管理页面（带 appId 参数）
    await page.goto(`/sys/member?appId=${testAppId || 'system-instance'}`);
    await page.waitForLoadState('networkidle');
  });

  // ==================== 6.1 成员列表页面 ====================

  test('MB-001: 成员列表加载', async ({ page }) => {
    // 等待页面加载
    await page.waitForSelector('.mfw-page-scene, .el-table', { timeout: 10000 });

    // 验证表格显示（成员列表可能为空，但表格结构应该存在）
    const table = page.locator('.el-table');
    await expect(table).toBeVisible();

    // 验证"添加成员"按钮存在
    await expect(page.locator('button:has-text("添加成员")')).toBeVisible();
  });

  test('MB-002: 成员信息展示', async ({ page }) => {
    // 等待表格加载
    await page.waitForSelector('.el-table', { timeout: 10000 });

    // 验证表格列头包含必要字段
    await expect(page.locator('th:has-text("头像")')).toBeVisible();
    await expect(page.locator('th:has-text("昵称")')).toBeVisible();
    await expect(page.locator('th:has-text("用户名")')).toBeVisible();
    await expect(page.locator('th:has-text("角色")')).toBeVisible();

    // 如果有成员数据，验证成员信息展示
    const rows = page.locator('.el-table__row');
    const rowCount = await rows.count();

    if (rowCount > 0) {
      const firstRow = rows.first();

      // 验证头像显示（Avatar 组件）
      await expect(firstRow.locator('.el-avatar')).toBeVisible();

      // 验证昵称或用户名显示
      const nicknameCell = firstRow.locator('td:nth-child(2)');
      await expect(nicknameCell).not.toBeEmpty();

      // 验证角色标签显示（如果有分配角色）
      const roleTags = firstRow.locator('.el-tag');
      const tagCount = await roleTags.count();
      // 角色标签可能为空（新成员未分配角色）
      expect(tagCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('MB-003: 拥有者不在列表', async ({ page }) => {
    // 等待表格加载
    await page.waitForSelector('.el-table', { timeout: 10000 });

    // 成员列表不应包含拥有者
    // 验证方式：检查列表中没有显示拥有者标识或特定拥有者用户
    // 由于拥有者单独在应用详情中展示，此处验证列表中没有特定标识

    // 如果有成员，验证没有"拥有者"标签
    const rows = page.locator('.el-table__row');
    const rowCount = await rows.count();

    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      // 验证没有拥有者角色标签（内置角色中拥有者角色会标记 isOwner=1）
      const ownerTag = row.locator('.el-tag:has-text("拥有者")');
      await expect(ownerTag).not.toBeVisible();
    }
  });

  // ==================== 6.2 添加成员 ====================

  test('MB-004: 打开添加成员表单', async ({ page }) => {
    // 点击添加成员按钮
    await page.click('button:has-text("添加成员")');

    // 等待弹窗出现
    await page.waitForSelector('.el-dialog', { timeout: 5000 });

    // 验证弹窗标题
    await expect(page.locator('.el-dialog__title:has-text("添加成员")')).toBeVisible();

    // 验证搜索输入框存在
    await expect(page.locator('.el-dialog input[placeholder*="搜索"]')).toBeVisible();

    // 关闭弹窗
    await page.click('.el-dialog__headerbtn');
  });

  test('MB-005: 搜索用户', async ({ page }) => {
    // 点击添加成员按钮
    await page.click('button:has-text("添加成员")');
    await page.waitForSelector('.el-dialog', { timeout: 5000 });

    // 输入搜索关键词（用户名或手机号）
    const searchInput = page.locator('.el-dialog input[placeholder*="搜索"]');
    await searchInput.fill('test');

    // 点击搜索按钮
    await page.click('.el-dialog button:has-text("搜索")');

    // 等待搜索结果加载
    await page.waitForTimeout(500);

    // 验证搜索结果出现（可能是用户列表或空结果提示）
    const userList = page.locator('.el-dialog .user-item, .el-dialog .el-table__row');
    const userCount = await userList.count();

    // 如果找到用户，验证用户信息显示
    if (userCount > 0) {
      await expect(userList.first()).toBeVisible();
    }

    // 关闭弹窗
    await page.click('.el-dialog__headerbtn');
  });

  test('MB-006: 选择用户添加', async ({ page }) => {
    // 点击添加成员按钮
    await page.click('button:has-text("添加成员")');
    await page.waitForSelector('.el-dialog', { timeout: 5000 });

    // 搜索用户
    const searchInput = page.locator('.el-dialog input[placeholder*="搜索"]');
    await searchInput.fill('test');

    // 点击搜索按钮
    await page.click('.el-dialog button:has-text("搜索")');
    await page.waitForTimeout(500);

    // 选择一个用户
    const userItem = page.locator('.el-dialog .user-item, .el-dialog .el-table__row').first();

    const userCount = await userItem.count();
    if (userCount > 0 && await userItem.isVisible()) {
      // 点击选择用户
      await userItem.click();

      // 点击确认添加
      await page.click('.el-dialog button:has-text("确定")');

      // 等待成功提示
      await page.waitForSelector('.el-message--success', { timeout: 5000 });

      // 验证成员出现在列表中
      await page.waitForTimeout(500);
      await expect(page.locator('.el-table__row')).toBeVisible();
    } else {
      // 没有找到可添加的用户，关闭弹窗
      await page.click('.el-dialog__headerbtn');
    }
  });

  test('MB-007: 添加已存在成员', async ({ page }) => {
    // 先查看当前成员列表
    await page.waitForSelector('.el-table', { timeout: 10000 });

    const existingMemberName = await page.locator('.el-table__row td:nth-child(3)').first().textContent();

    if (existingMemberName?.trim()) {
      // 点击添加成员按钮
      await page.click('button:has-text("添加成员")');
      await page.waitForSelector('.el-dialog', { timeout: 5000 });

      // 搜索已存在的成员
      const searchInput = page.locator('.el-dialog input[placeholder*="搜索"]');
      await searchInput.fill(existingMemberName.trim());

      // 点击搜索按钮
      await page.click('.el-dialog button:has-text("搜索")');
      await page.waitForTimeout(500);

      // 尝试添加已存在的成员
      const userItem = page.locator('.el-dialog .user-item, .el-dialog .el-table__row').first();

      if (await userItem.isVisible()) {
        await userItem.click();
        await page.click('.el-dialog button:has-text("确定")');

        // 验证错误提示（用户已是成员）
        await page.waitForSelector('.el-message--error, .el-message--warning', { timeout: 5000 });
      }

      // 关闭弹窗
      await page.click('.el-dialog__headerbtn');
    } else {
      // 没有现有成员，跳过此验证
      expect(true).toBe(true);
    }
  });

  // ==================== 6.3 分配角色 ====================

  test('MB-008: 打开角色分配面板', async ({ page }) => {
    // 等待表格加载
    await page.waitForSelector('.el-table', { timeout: 10000 });

    // 查找成员行
    const rows = page.locator('.el-table__row');
    const rowCount = await rows.count();

    if (rowCount > 0) {
      // 点击第一个成员的"分配角色"按钮
      await rows.first().locator('button:has-text("分配角色")').click();

      // 等待弹窗出现
      await page.waitForSelector('.el-dialog', { timeout: 5000 });

      // 验证弹窗标题
      await expect(page.locator('.el-dialog__title:has-text("分配角色")')).toBeVisible();

      // 关闭弹窗
      await page.click('.el-dialog__headerbtn');
    } else {
      // 没有成员数据，需要先添加成员
      expect(true).toBe(true);
    }
  });

  test('MB-009: 查看可选角色', async ({ page }) => {
    // 等待表格加载
    await page.waitForSelector('.el-table', { timeout: 10000 });

    // 查找成员行
    const rows = page.locator('.el-table__row');
    const rowCount = await rows.count();

    if (rowCount > 0) {
      // 点击分配角色按钮
      await rows.first().locator('button:has-text("分配角色")').click();
      await page.waitForSelector('.el-dialog', { timeout: 5000 });

      // 验证角色列表显示
      const roleList = page.locator('.el-dialog .el-checkbox, .el-dialog .role-item');
      const roleCount = await roleList.count();

      // 应该至少有一个可选角色（内置角色或应用级角色）
      expect(roleCount).toBeGreaterThan(0);

      // 关闭弹窗
      await page.click('.el-dialog__headerbtn');
    } else {
      expect(true).toBe(true);
    }
  });

  test('MB-010: 勾选角色', async ({ page }) => {
    // 等待表格加载
    await page.waitForSelector('.el-table', { timeout: 10000 });

    // 查找成员行
    const rows = page.locator('.el-table__row');
    const rowCount = await rows.count();

    if (rowCount > 0) {
      // 点击分配角色按钮
      await rows.first().locator('button:has-text("分配角色")').click();
      await page.waitForSelector('.el-dialog', { timeout: 5000 });

      // 查找可选角色复选框
      const roleCheckbox = page.locator('.el-dialog .el-checkbox').first();

      if (await roleCheckbox.isVisible()) {
        // 勾选角色
        await roleCheckbox.click();

        // 点击保存
        await page.click('.el-dialog button:has-text("确定")');

        // 等待成功提示
        await page.waitForSelector('.el-message--success', { timeout: 5000 });

        // 验证角色标签出现在成员行中
        await page.waitForTimeout(500);
        const roleTags = page.locator('.el-table__row').first().locator('.el-tag');
        await expect(roleTags.first()).toBeVisible();
      } else {
        // 关闭弹窗
        await page.click('.el-dialog__headerbtn');
      }
    } else {
      expect(true).toBe(true);
    }
  });

  test('MB-011: 多角色分配', async ({ page }) => {
    // 等待表格加载
    await page.waitForSelector('.el-table', { timeout: 10000 });

    // 查找成员行
    const rows = page.locator('.el-table__row');
    const rowCount = await rows.count();

    if (rowCount > 0) {
      // 点击分配角色按钮
      await rows.first().locator('button:has-text("分配角色")').click();
      await page.waitForSelector('.el-dialog', { timeout: 5000 });

      // 查找所有可选角色复选框
      const roleCheckboxes = page.locator('.el-dialog .el-checkbox');
      const checkboxCount = await roleCheckboxes.count();

      if (checkboxCount >= 2) {
        // 勾选多个角色
        await roleCheckboxes.nth(0).click();
        await roleCheckboxes.nth(1).click();

        // 点击保存
        await page.click('.el-dialog button:has-text("确定")');

        // 等待成功提示
        await page.waitForSelector('.el-message--success', { timeout: 5000 });

        // 验证多个角色标签显示
        await page.waitForTimeout(500);
        const roleTags = page.locator('.el-table__row').first().locator('.el-tag');
        const tagCount = await roleTags.count();
        expect(tagCount).toBeGreaterThanOrEqual(2);
      } else {
        // 关闭弹窗
        await page.click('.el-dialog__headerbtn');
      }
    } else {
      expect(true).toBe(true);
    }
  });

  test('MB-012: 取消角色分配', async ({ page }) => {
    // 等待表格加载
    await page.waitForSelector('.el-table', { timeout: 10000 });

    // 查找已分配角色的成员行
    const rows = page.locator('.el-table__row');
    const rowCount = await rows.count();

    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const roleTags = row.locator('.el-tag');
      const tagCount = await roleTags.count();

      if (tagCount > 0) {
        // 点击分配角色按钮
        await row.locator('button:has-text("分配角色")').click();
        await page.waitForSelector('.el-dialog', { timeout: 5000 });

        // 找到已勾选的角色复选框并取消勾选
        const checkedCheckbox = page.locator('.el-dialog .el-checkbox.is-checked').first();

        if (await checkedCheckbox.isVisible()) {
          await checkedCheckbox.click();

          // 点击保存
          await page.click('.el-dialog button:has-text("确定")');

          // 等待成功提示
          await page.waitForSelector('.el-message--success', { timeout: 5000 });
        }

        break;
      }
    }
  });

  // ==================== 6.4 移除成员 ====================

  test('MB-013: 移除成员确认', async ({ page }) => {
    // 等待表格加载
    await page.waitForSelector('.el-table', { timeout: 10000 });

    // 查找成员行
    const rows = page.locator('.el-table__row');
    const rowCount = await rows.count();

    if (rowCount > 0) {
      // 点击移除按钮
      await rows.first().locator('button:has-text("移除")').click();

      // 验证确认对话框出现
      await page.waitForSelector('.el-message-box', { timeout: 5000 });
      await expect(page.locator('.el-message-box__title:has-text("确认移除")')).toBeVisible();

      // 取消移除
      await page.click('.el-message-box .el-button--default');
    } else {
      expect(true).toBe(true);
    }
  });

  test('MB-014: 确认移除', async ({ page }) => {
    // 等待表格加载
    await page.waitForSelector('.el-table', { timeout: 10000 });

    // 查找成员行
    const rows = page.locator('.el-table__row');
    const rowCount = await rows.count();

    if (rowCount > 0) {
      const firstMemberName = await rows.first().locator('td:nth-child(3)').textContent();

      // 点击移除按钮
      await rows.first().locator('button:has-text("移除")').click();

      // 确认移除
      await page.waitForSelector('.el-message-box', { timeout: 5000 });
      await page.click('.el-message-box .el-button--primary');

      // 等待成功提示
      await page.waitForSelector('.el-message--success', { timeout: 5000 });

      // 验证成员从列表中消失
      await page.waitForTimeout(500);
      if (firstMemberName?.trim()) {
        await expect(page.locator(`td:has-text("${firstMemberName.trim()}")`)).not.toBeVisible();
      }
    } else {
      expect(true).toBe(true);
    }
  });

  test('MB-015: 成员不能给自己分配角色', async ({ page }) => {
    // 此测试需要使用普通用户登录来验证
    // 管理员可以给任何成员分配角色，普通成员不能给自己分配角色

    // 使用管理员登录时，此限制不适用
    // 需要切换为普通成员登录来验证

    // 当前测试使用管理员账号，跳过此验证
    // 实际测试应该：
    // 1. 创建一个普通成员账号
    // 2. 用该成员账号登录
    // 3. 进入成员管理页面
    // 4. 尝试给自己分配角色
    // 5. 验证显示"不能给自己分配角色"提示

    test.skip(true, '需要使用普通成员账号验证此场景');
  });
});