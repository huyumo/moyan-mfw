/**
 * @fileoverview 用户管理 E2E 测试。
 * @description 测试用户列表、新建用户、编辑用户、状态管理、密码重置等功能。
 *
 * 参考文档：docs/01-业务需求/01-基础设施/06-API 接口/用户接口.md
 * 测试用例清单：docs/04-项目实施/05-任务追踪/2026-04-02-1430-Playwright测试用例清单.md
 *
 * 测试账号：
 * - admin / Admin@123（管理员）
 * - test / Test@123（普通用户）
 */

import { test, expect } from '@playwright/test';
import {
  loginAsAdmin,
  selectApp,
  navigateToSysPage,
  waitForTableLoad,
  getTableRowCount,
  getSuccessMessage,
  getErrorMessage,
  TEST_ACCOUNTS,
} from '../helpers/auth';

test.describe('用户管理测试', () => {
  // 每个测试前先登录管理员账号
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await selectApp(page);
    await navigateToSysPage(page, 'user');
  });

  // ========================================
  // 2.1 用户列表页面
  // ========================================

  test.describe('用户列表页面', () => {
    /**
     * USER-001: 用户列表加载
     * 操作步骤：1. 登录后进入 /sys/user 2. 等待列表加载
     * 预期结果：显示用户列表表格，包含用户名、昵称、手机号、状态等字段
     */
    test('USER-001: 用户列表加载', async ({ page }) => {
      // 等待表格加载
      await waitForTableLoad(page);

      // 验证表格存在
      const table = page.locator('.el-table');
      await expect(table).toBeVisible();

      // 验证关键列存在
      const headers = table.locator('.el-table__header th');
      const headerTexts = await headers.allTextContents();

      // 验证包含必要字段
      expect(headerTexts.some(h => h.includes('用户名'))).toBeTruthy();
      expect(headerTexts.some(h => h.includes('昵称'))).toBeTruthy();
      expect(headerTexts.some(h => h.includes('手机号'))).toBeTruthy();
      expect(headerTexts.some(h => h.includes('状态'))).toBeTruthy();

      // 验证有数据行
      const rowCount = await getTableRowCount(page);
      expect(rowCount).toBeGreaterThan(0);
    });

    /**
     * USER-002: 用户列表分页
     * 操作步骤：1. 查看列表底部 2. 点击分页按钮
     * 预期结果：分页组件正常工作，可切换页码
     */
    test('USER-002: 用户列表分页', async ({ page }) => {
      await waitForTableLoad(page);

      // 验证分页组件存在
      const pagination = page.locator('.el-pagination');
      await expect(pagination).toBeVisible();

      // 检查是否有多个页码
      const pageButtons = pagination.locator('.el-pager li, .btn-prev, .btn-next');
      const count = await pageButtons.count();

      // 如果有分页按钮，测试切换
      if (count > 2) {
        // 点击下一页
        const nextButton = pagination.locator('.btn-next');
        const isNextDisabled = await nextButton.getAttribute('class');
        if (!isNextDisabled?.includes('disabled')) {
          await nextButton.click();
          await page.waitForLoadState('networkidle');

          // 验证表格刷新
          await waitForTableLoad(page);
        }
      }
    });

    /**
     * USER-003: 用户搜索
     * 操作步骤：1. 在搜索框输入关键词 2. 点击搜索按钮
     * 预期结果：列表过滤显示匹配的用户
     */
    test('USER-003: 用户搜索', async ({ page }) => {
      await waitForTableLoad(page);

      // 查找搜索框
      const searchInput = page.locator('.search-form input[placeholder*="用户名"]').first();
      await searchInput.fill('admin');

      // 点击搜索按钮
      const searchButton = page.locator('.search-form button:has-text("搜索"), button:has-text("查询")').first();
      await searchButton.click();

      // 等待表格刷新
      await page.waitForLoadState('networkidle');
      await waitForTableLoad(page);

      // 验证搜索结果
      const rows = page.locator('.el-table__body-wrapper tr');
      const count = await rows.count();

      // 搜索 admin 应该至少有一个结果
      expect(count).toBeGreaterThanOrEqual(1);

      // 验证结果包含 admin
      if (count > 0) {
        const firstRowText = await rows.first().textContent();
        expect(firstRowText).toContain('admin');
      }
    });

    /**
     * USER-004: 清空搜索
     * 操作步骤：1. 搜索后 2. 点击清空按钮
     * 预期结果：列表恢复显示所有用户
     */
    test('USER-004: 清空搜索', async ({ page }) => {
      await waitForTableLoad(page);

      // 先执行搜索
      const searchInput = page.locator('.search-form input[placeholder*="用户名"]').first();
      await searchInput.fill('admin');

      const searchButton = page.locator('.search-form button:has-text("搜索")').first();
      await searchButton.click();
      await page.waitForLoadState('networkidle');

      // 获取搜索后行数
      const searchedCount = await getTableRowCount(page);

      // 点击清空/重置按钮
      const resetButton = page.locator('.search-form button:has-text("清空"), button:has-text("重置")').first();
      await resetButton.click();
      await page.waitForLoadState('networkidle');

      // 获取清空后行数
      const resetCount = await getTableRowCount(page);

      // 清空后应该显示更多用户
      expect(resetCount).toBeGreaterThanOrEqual(searchedCount);
    });
  });

  // ========================================
  // 2.2 新建用户
  // ========================================

  test.describe('新建用户', () => {
    /**
     * USER-005: 打开新建用户表单
     * 操作步骤：1. 点击"新建用户"按钮
     * 预期结果：打开新建用户抽屉/弹窗，显示表单
     */
    test('USER-005: 打开新建用户表单', async ({ page }) => {
      await waitForTableLoad(page);

      // 点击新建用户按钮
      const addButton = page.locator('button:has-text("新建用户")').first();
      await addButton.click();

      // 等待弹窗打开
      await page.waitForTimeout(500);

      // 验证弹窗显示
      const dialog = page.getByRole('dialog', { name: '新建用户' });
      await expect(dialog).toBeVisible();

      // 验证表单字段存在
      await expect(dialog.locator('input[placeholder*="用户名"]')).toBeVisible();
      await expect(dialog.locator('input[placeholder*="密码"]')).toBeVisible();
    });

    /**
     * USER-006: 新建用户成功
     * 操作步骤：1. 填写用户名 newuser 2. 填写昵称 新用户 3. 填写手机号 13800138000 4. 填写密码 New@123 5. 点击提交
     * 预期结果：用户创建成功，列表刷新显示新用户
     */
    test('USER-006: 新建用户成功', async ({ page }) => {
      await waitForTableLoad(page);

      // 生成唯一用户名（避免重复）
      const uniqueUsername = `testuser_${Date.now()}`;

      // 打开新建用户弹窗
      const addButton = page.locator('button:has-text("新建用户")').first();
      await addButton.click();
      await page.waitForTimeout(500);

      const dialog = page.getByRole('dialog', { name: '新建用户' });

      // 填写表单
      await dialog.locator('input[placeholder*="用户名"]').fill(uniqueUsername);
      await dialog.locator('input[placeholder*="密码"]').fill('Test@123456');
      await dialog.locator('input[placeholder*="昵称"]').fill('测试新用户');
      await dialog.locator('input[placeholder*="手机号"]').fill('13900139000');

      // 点击确定/提交
      await dialog.locator('button:has-text("确定"), button:has-text("提交")').first().click();

      // 等待操作完成
      await page.waitForTimeout(1000);

      // 验证成功提示
      const successMsg = await getSuccessMessage(page);
      expect(successMsg).toContain('成功');

      // 验证弹窗关闭
      await expect(dialog).not.toBeVisible();

      // 验证列表刷新（搜索新用户）
      await page.waitForLoadState('networkidle');
      const searchInput = page.locator('.search-form input[placeholder*="用户名"]').first();
      await searchInput.fill(uniqueUsername);
      await page.locator('.search-form button:has-text("搜索")').first().click();
      await page.waitForLoadState('networkidle');

      // 验证新用户出现在列表中
      const rows = page.locator('.el-table__body-wrapper tr');
      const firstRowText = await rows.first().textContent();
      expect(firstRowText).toContain(uniqueUsername);
    });

    /**
     * USER-007: 新建用户用户名重复
     * 操作步骤：1. 填写已存在的用户名 2. 点击提交
     * 预期结果：显示"用户名已存在"错误提示
     */
    test('USER-007: 新建用户用户名重复', async ({ page }) => {
      await waitForTableLoad(page);

      // 打开新建用户弹窗
      const addButton = page.locator('button:has-text("新建用户")').first();
      await addButton.click();
      await page.waitForTimeout(500);

      const dialog = page.getByRole('dialog', { name: '新建用户' });

      // 填写已存在的用户名
      await dialog.locator('input[placeholder*="用户名"]').fill('admin');
      await dialog.locator('input[placeholder*="密码"]').fill('Test@123456');
      await dialog.locator('input[placeholder*="昵称"]').fill('重复用户测试');

      // 点击确定
      await dialog.locator('button:has-text("确定")').first().click();

      // 等待错误提示
      await page.waitForTimeout(1000);

      // 验证错误提示
      const errorMsg = await getErrorMessage(page);
      expect(errorMsg).toBeTruthy();

      // 验证弹窗仍然显示（未关闭）
      await expect(dialog).toBeVisible();
    });

    /**
     * USER-008: 新建用户必填项缺失
     * 操作步骤：1. 不填写用户名 2. 点击提交
     * 预期结果：显示"请输入用户名"验证错误
     */
    test('USER-008: 新建用户必填项缺失', async ({ page }) => {
      await waitForTableLoad(page);

      // 打开新建用户弹窗
      const addButton = page.locator('button:has-text("新建用户")').first();
      await addButton.click();
      await page.waitForTimeout(500);

      const dialog = page.getByRole('dialog', { name: '新建用户' });

      // 只填写密码，不填用户名
      await dialog.locator('input[placeholder*="密码"]').fill('Test@123456');

      // 点击确定
      await dialog.locator('button:has-text("确定")').first().click();

      // 等待验证错误显示
      await page.waitForTimeout(500);

      // 验证表单验证错误
      const formError = dialog.locator('.el-form-item__error');
      await expect(formError).toBeVisible();

      const errorText = await formError.textContent();
      expect(errorText).toContain('请输入用户名');

      // 弹窗应该仍然显示
      await expect(dialog).toBeVisible();
    });

    /**
     * USER-009: 新建用户密码格式错误
     * 操作步骤：1. 填写不符合规则的密码 2. 点击提交
     * 预期结果：显示密码格式错误提示
     */
    test('USER-009: 新建用户密码格式错误', async ({ page }) => {
      await waitForTableLoad(page);

      // 打开新建用户弹窗
      const addButton = page.locator('button:has-text("新建用户")').first();
      await addButton.click();
      await page.waitForTimeout(500);

      const dialog = page.getByRole('dialog', { name: '新建用户' });

      // 填写用户名和不符合规则的密码（太短）
      await dialog.locator('input[placeholder*="用户名"]').fill(`test_${Date.now()}`);
      await dialog.locator('input[placeholder*="密码"]').fill('123');  // 密码太短

      // 点击确定
      await dialog.locator('button:has-text("确定")').first().click();

      // 等待验证错误显示
      await page.waitForTimeout(500);

      // 验证密码格式错误提示
      const formError = dialog.locator('.el-form-item__error');
      const isVisible = await formError.isVisible().catch(() => false);

      if (isVisible) {
        const errorText = await formError.textContent();
        expect(errorText).toContain('密码');
      }

      // 弹窗应该仍然显示
      await expect(dialog).toBeVisible();
    });
  });

  // ========================================
  // 2.3 编辑用户
  // ========================================

  test.describe('编辑用户', () => {
    /**
     * USER-010: 打开编辑用户表单
     * 操作步骤：1. 在用户列表中 2. 点击某个用户的"编辑"按钮
     * 预期结果：打开编辑用户抽屉，显示用户当前信息
     */
    test('USER-010: 打开编辑用户表单', async ({ page }) => {
      await waitForTableLoad(page);

      // 找到第一行的编辑按钮
      const editButton = page.locator('.el-table__body-wrapper tr').first()
        .locator('button:has-text("编辑")');
      await editButton.click();

      // 等待弹窗打开
      await page.waitForTimeout(500);

      // 验证编辑弹窗显示
      const dialog = page.getByRole('dialog', { name: '编辑用户' });
      await expect(dialog).toBeVisible();

      // 验证表单有数据
      const usernameInput = dialog.locator('input[placeholder*="用户名"]');
      const usernameValue = await usernameInput.inputValue();
      expect(usernameValue).toBeTruthy();
    });

    /**
     * USER-011: 编辑用户昵称
     * 操作步骤：1. 修改昵称字段 2. 点击提交
     * 预期结果：用户昵称更新成功，列表刷新
     */
    test('USER-011: 编辑用户昵称', async ({ page }) => {
      await waitForTableLoad(page);

      // 找到测试用户进行编辑
      const searchInput = page.locator('.search-form input[placeholder*="用户名"]').first();
      await searchInput.fill('test');
      await page.locator('.search-form button:has-text("搜索")').first().click();
      await page.waitForLoadState('networkidle');

      // 点击编辑按钮
      const editButton = page.locator('.el-table__body-wrapper tr').first()
        .locator('button:has-text("编辑")');
      await editButton.click();
      await page.waitForTimeout(500);

      const dialog = page.getByRole('dialog', { name: '编辑用户' });

      // 修改昵称
      const nicknameInput = dialog.locator('input[placeholder*="昵称"]');
      const newNickname = `测试用户_${Date.now()}`;
      await nicknameInput.fill(newNickname);

      // 点击确定
      await dialog.locator('button:has-text("确定")').first().click();

      // 等待操作完成
      await page.waitForTimeout(1000);

      // 验证成功提示
      const successMsg = await getSuccessMessage(page);
      expect(successMsg).toContain('成功');

      // 验证弹窗关闭
      await expect(dialog).not.toBeVisible();
    });

    /**
     * USER-012: 编辑用户手机号
     * 操作步骤：1. 修改手机号字段 2. 点击提交
     * 预期结果：用户手机号更新成功
     */
    test('USER-012: 编辑用户手机号', async ({ page }) => {
      await waitForTableLoad(page);

      // 搜索 test 用户
      const searchInput = page.locator('.search-form input[placeholder*="用户名"]').first();
      await searchInput.fill('test');
      await page.locator('.search-form button:has-text("搜索")').first().click();
      await page.waitForLoadState('networkidle');

      // 点击编辑按钮
      const editButton = page.locator('.el-table__body-wrapper tr').first()
        .locator('button:has-text("编辑")');
      await editButton.click();
      await page.waitForTimeout(500);

      const dialog = page.getByRole('dialog', { name: '编辑用户' });

      // 修改手机号
      const phoneInput = dialog.locator('input[placeholder*="手机号"]');
      await phoneInput.fill('13800138888');

      // 点击确定
      await dialog.locator('button:has-text("确定")').first().click();

      // 等待操作完成
      await page.waitForTimeout(1000);

      // 验证成功提示
      const successMsg = await getSuccessMessage(page);
      expect(successMsg).toContain('成功');
    });

    /**
     * USER-013: 编辑用户不可修改用户名
     * 操作步骤：1. 查看用户名字段
     * 预期结果：用户名字段为禁用状态，不可修改
     */
    test('USER-013: 编辑用户不可修改用户名', async ({ page }) => {
      await waitForTableLoad(page);

      // 点击编辑按钮
      const editButton = page.locator('.el-table__body-wrapper tr').first()
        .locator('button:has-text("编辑")');
      await editButton.click();
      await page.waitForTimeout(500);

      const dialog = page.getByRole('dialog', { name: '编辑用户' });

      // 验证用户名字段禁用
      const usernameInput = dialog.locator('input[placeholder*="用户名"]');
      const isDisabled = await usernameInput.isDisabled();

      expect(isDisabled).toBeTruthy();
    });
  });

  // ========================================
  // 2.4 用户状态管理
  // ========================================

  test.describe('用户状态管理', () => {
    /**
     * USER-014: 禁用用户
     * 操作步骤：1. 点击启用用户的"禁用"按钮 2. 确认操作
     * 预期结果：用户状态变为禁用，状态列显示"禁用"
     */
    test('USER-014: 禁用用户', async ({ page }) => {
      await waitForTableLoad(page);

      // 找一个启用的用户（状态开关为开启状态）
      const rows = page.locator('.el-table__body-wrapper tr');
      const rowCount = await rows.count();

      // 遍历找到启用的用户
      for (let i = 0; i < rowCount; i++) {
        const row = rows.nth(i);
        const username = await row.locator('td').first().textContent();

        // 不禁用当前登录的管理员
        if (username?.trim() === 'admin') continue;

        const switchEl = row.locator('.el-switch');
        const isChecked = await switchEl.getAttribute('class');

        if (isChecked?.includes('is-checked')) {
          // 点击开关禁用用户
          await switchEl.click();
          await page.waitForTimeout(500);

          // 等待成功提示
          const successMsg = await getSuccessMessage(page);
          expect(successMsg).toContain('禁用');

          return;
        }
      }

      // 如果没有找到可禁用的用户
      test.skip(true, '没有找到可禁用的用户');
    });

    /**
     * USER-015: 启用用户
     * 操作步骤：1. 点击禁用用户的"启用"按钮 2. 确认操作
     * 预期结果：用户状态变为启用，状态列显示"启用"
     */
    test('USER-015: 启用用户', async ({ page }) => {
      await waitForTableLoad(page);

      // 找一个禁用的用户（状态开关为关闭状态）
      const rows = page.locator('.el-table__body-wrapper tr');
      const rowCount = await rows.count();

      // 遍历找到禁用的用户
      for (let i = 0; i < rowCount; i++) {
        const row = rows.nth(i);
        const switchEl = row.locator('.el-switch');
        const isChecked = await switchEl.getAttribute('class');

        if (!isChecked?.includes('is-checked')) {
          // 点击开关启用用户
          await switchEl.click();
          await page.waitForTimeout(500);

          // 等待成功提示
          const successMsg = await getSuccessMessage(page);
          expect(successMsg).toContain('启用');

          return;
        }
      }

      // 如果没有找到可启用的用户，先禁用一个再启用
      // 找一个启用用户先禁用
      for (let i = 0; i < rowCount; i++) {
        const row = rows.nth(i);
        const username = await row.locator('td').first().textContent();

        if (username?.trim() === 'admin') continue;

        const switchEl = row.locator('.el-switch');
        const isChecked = await switchEl.getAttribute('class');

        if (isChecked?.includes('is-checked')) {
          // 先禁用
          await switchEl.click();
          await page.waitForTimeout(500);

          // 再启用
          await switchEl.click();
          await page.waitForTimeout(500);

          const successMsg = await getSuccessMessage(page);
          expect(successMsg).toContain('启用');

          return;
        }
      }
    });

    /**
     * USER-016: 禁用当前登录用户
     * 操作步骤：1. 尝试禁用当前登录用户 2. 点击禁用按钮
     * 预期结果：显示"不能禁用当前登录用户"提示，操作失败
     */
    test('USER-016: 禁用当前登录用户', async ({ page }) => {
      await waitForTableLoad(page);

      // 搜索 admin 用户
      const searchInput = page.locator('.search-form input[placeholder*="用户名"]').first();
      await searchInput.fill('admin');
      await page.locator('.search-form button:has-text("搜索")').first().click();
      await page.waitForLoadState('networkidle');

      // 找到 admin 行
      const adminRow = page.locator('.el-table__body-wrapper tr').first();
      const switchEl = adminRow.locator('.el-switch');

      // 尝试点击禁用
      await switchEl.click();
      await page.waitForTimeout(500);

      // 验证错误提示
      const errorMsg = await getErrorMessage(page);
      expect(errorMsg).toBeTruthy();
      expect(errorMsg).toContain('不能禁用');
    });
  });

  // ========================================
  // 2.5 密码重置
  // ========================================

  test.describe('密码重置', () => {
    /**
     * USER-017: 重置用户密码
     * 操作步骤：1. 点击用户的"重置密码"按钮 2. 输入新密码 3. 确认提交
     * 预期结果：密码重置成功，显示成功提示
     */
    test('USER-017: 重置用户密码', async ({ page }) => {
      await waitForTableLoad(page);

      // 搜索 test 用户
      const searchInput = page.locator('.search-form input[placeholder*="用户名"]').first();
      await searchInput.fill('test');
      await page.locator('.search-form button:has-text("搜索")').first().click();
      await page.waitForLoadState('networkidle');

      // 点击重置密码按钮
      const resetButton = page.locator('.el-table__body-wrapper tr').first()
        .locator('button:has-text("重置密码")');
      await resetButton.click();

      // 等待提示框出现
      await page.waitForTimeout(500);

      // 在提示框中输入新密码
      const messagebox = page.locator('.el-message-box');
      await messagebox.locator('input').fill('NewTest@123');

      // 点击确定
      await messagebox.locator('button:has-text("确定")').first().click();

      // 等待操作完成
      await page.waitForTimeout(1000);

      // 验证成功提示
      const successMsg = await getSuccessMessage(page);
      expect(successMsg).toContain('成功');
    });

    /**
     * USER-018: 重置密码格式验证
     * 操作步骤：1. 输入不符合规则的密码 2. 点击提交
     * 预期结果：显示密码格式错误提示
     */
    test('USER-018: 重置密码格式验证', async ({ page }) => {
      await waitForTableLoad(page);

      // 搜索 test 用户
      const searchInput = page.locator('.search-form input[placeholder*="用户名"]').first();
      await searchInput.fill('test');
      await page.locator('.search-form button:has-text("搜索")').first().click();
      await page.waitForLoadState('networkidle');

      // 点击重置密码按钮
      const resetButton = page.locator('.el-table__body-wrapper tr').first()
        .locator('button:has-text("重置密码")');
      await resetButton.click();

      // 等待提示框出现
      await page.waitForTimeout(500);

      const messagebox = page.locator('.el-message-box');

      // 输入不符合规则的密码（太短）
      await messagebox.locator('input').fill('123');

      // 点击确定
      await messagebox.locator('button:has-text("确定")').first().click();

      // 等待验证提示
      await page.waitForTimeout(500);

      // 验证错误提示显示
      const errorMsg = messagebox.locator('.el-message-box__errormsg, .el-form-item__error');
      const isVisible = await errorMsg.isVisible().catch(() => false);

      if (isVisible) {
        const errorText = await errorMsg.textContent();
        expect(errorText).toContain('密码');
      }

      // 提示框应该仍然显示
      await expect(messagebox).toBeVisible();

      // 取消操作
      await messagebox.locator('button:has-text("取消")').first().click();
    });
  });
});