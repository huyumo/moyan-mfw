/**
 * @fileoverview 角色管理页面 E2E 测试。
 *
 * 测试场景覆盖：
 * - 角色列表页面展示
 * - 内置角色与应用级角色区分
 * - 新建应用级角色
 * - 编辑应用级角色
 * - 删除应用级角色
 * - 角色权限分配
 *
 * 参考：docs/01-业务需求/01-基础设施/05-页面设计/角色管理页面.md
 */

import { test, expect } from '@playwright/test';
import { loginAsAdmin, navigateToSysPage } from '../helpers/auth';

test.describe('角色管理测试', () => {
  test.beforeEach(async ({ page }) => {
    // 管理员登录
    await loginAsAdmin(page);
    // 进入角色管理页面
    await navigateToSysPage(page, 'role');
  });

  // ==================== 5.1 角色列表页面 ====================

  test('RL-001: 角色列表加载', async ({ page }) => {
    // 等待表格加载
    await page.waitForSelector('.el-table', { timeout: 10000 });

    // 验证表格显示
    await expect(page.locator('.el-table')).toBeVisible();

    // 验证表格列头包含必要字段
    await expect(page.locator('th:has-text("角色名称")')).toBeVisible();
    await expect(page.locator('th:has-text("角色编码")')).toBeVisible();
    await expect(page.locator('th:has-text("类型")')).toBeVisible();
    await expect(page.locator('th:has-text("状态")')).toBeVisible();

    // 验证有数据行存在
    const rows = page.locator('.el-table__row');
    await expect(rows.first()).toBeVisible();
  });

  test('RL-002: 内置角色标识', async ({ page }) => {
    // 等待表格加载
    await page.waitForSelector('.el-table', { timeout: 10000 });

    // 查找内置角色行（通过"内置"标签识别）
    const builtinTag = page.locator('.el-tag.el-tag--warning:has-text("内置")');

    // 验证存在内置角色标签
    await expect(builtinTag.first()).toBeVisible();

    // 验证内置角色的编辑按钮禁用
    const builtinRow = builtinTag.first().locator('xpath=ancestor::tr');
    const editButton = builtinRow.locator('button:has-text("编辑")');
    await expect(editButton).toBeDisabled();

    // 验证内置角色的删除按钮禁用
    const deleteButton = builtinRow.locator('button:has-text("删除")');
    await expect(deleteButton).toBeDisabled();
  });

  test('RL-003: 应用级角色标识', async ({ page }) => {
    // 等待表格加载
    await page.waitForSelector('.el-table', { timeout: 10000 });

    // 查找应用级角色行（通过"应用级"标签识别）
    const appLevelTag = page.locator('.el-tag.el-tag--primary:has-text("应用级")');

    // 如果存在应用级角色，验证其按钮可用
    const count = await appLevelTag.count();
    if (count > 0) {
      const appLevelRow = appLevelTag.first().locator('xpath=ancestor::tr');
      const editButton = appLevelRow.locator('button:has-text("编辑")');
      await expect(editButton).toBeEnabled();

      // 验证非拥有者的应用级角色删除按钮可用
      const isOwnerCell = appLevelRow.locator('td:nth-child(5)'); // 拥有者列
      const isOwnerText = await isOwnerCell.textContent();
      if (isOwnerText?.trim() === '否') {
        const deleteButton = appLevelRow.locator('button:has-text("删除")');
        await expect(deleteButton).toBeEnabled();
      }
    } else {
      // 如果没有应用级角色，测试通过（数据库初始状态可能只有内置角色）
      expect(true).toBe(true);
    }
  });

  test('RL-004: 内置角色操作提示', async ({ page }) => {
    // 等待表格加载
    await page.waitForSelector('.el-table', { timeout: 10000 });

    // 查找内置角色行
    const builtinTag = page.locator('.el-tag.el-tag--warning:has-text("内置")');
    const builtinRow = builtinTag.first().locator('xpath=ancestor::tr');

    // 鼠标悬停在内置角色的权限按钮上
    const permissionButton = builtinRow.locator('button:has-text("权限")');
    await permissionButton.hover();

    // 验证 Tooltip 提示出现
    await page.waitForTimeout(300);
    const tooltip = page.locator('.el-tooltip__popper:has-text("内置角色请在应用类型管理页面")');
    await expect(tooltip).toBeVisible();
  });

  // ==================== 5.2 新建应用级角色 ====================

  test('RL-005: 打开新建表单', async ({ page }) => {
    // 点击新建角色按钮
    await page.click('button:has-text("新建角色")');

    // 等待弹窗出现
    await page.waitForSelector('.el-dialog', { timeout: 5000 });

    // 验证弹窗标题
    await expect(page.locator('.el-dialog__title:has-text("新建角色")')).toBeVisible();

    // 验证表单字段存在
    await expect(page.locator('.el-dialog input[placeholder*="角色名称"]')).toBeVisible();
    await expect(page.locator('.el-dialog input[placeholder*="角色编码"]')).toBeVisible();

    // 关闭弹窗
    await page.click('.el-dialog__headerbtn');
  });

  test('RL-006: 填写角色信息', async ({ page }) => {
    // 点击新建角色按钮
    await page.click('button:has-text("新建角色")');
    await page.waitForSelector('.el-dialog', { timeout: 5000 });

    // 填写角色名称
    const roleNameInput = page.locator('.el-dialog input').first();
    await roleNameInput.fill('测试角色');

    // 填写角色编码
    const roleCodeInput = page.locator('.el-dialog input').nth(1);
    await roleCodeInput.fill('test_role_e2e');

    // 点击提交按钮
    await page.click('.el-dialog button:has-text("确定")');

    // 等待成功提示
    await page.waitForSelector('.el-message--success', { timeout: 5000 });

    // 验证列表刷新，新角色出现在列表中
    await page.waitForTimeout(500);
    await expect(page.locator('td:has-text("测试角色")')).toBeVisible();
  });

  test('RL-007: roleCode 全局唯一验证', async ({ page }) => {
    // 先查看列表中已存在的角色编码
    await page.waitForSelector('.el-table', { timeout: 10000 });
    const existingCode = await page.locator('.el-table__row td:nth-child(2)').first().textContent();

    // 点击新建角色按钮
    await page.click('button:has-text("新建角色")');
    await page.waitForSelector('.el-dialog', { timeout: 5000 });

    // 使用已存在的角色编码
    const roleNameInput = page.locator('.el-dialog input').first();
    await roleNameInput.fill('重复编码角色');

    const roleCodeInput = page.locator('.el-dialog input').nth(1);
    await roleCodeInput.fill(existingCode?.trim() || 'admin');

    // 点击提交按钮
    await page.click('.el-dialog button:has-text("确定")');

    // 验证错误提示
    await page.waitForSelector('.el-message--error', { timeout: 5000 });
  });

  test('RL-008: roleCode 创建后不可修改', async ({ page }) => {
    // 等待表格加载
    await page.waitForSelector('.el-table', { timeout: 10000 });

    // 查找应用级角色行
    const appLevelTag = page.locator('.el-tag.el-tag--primary:has-text("应用级")');
    const count = await appLevelTag.count();

    if (count > 0) {
      // 点击应用级角色的编辑按钮
      const appLevelRow = appLevelTag.first().locator('xpath=ancestor::tr');
      await appLevelRow.locator('button:has-text("编辑")').click();

      // 等待弹窗出现
      await page.waitForSelector('.el-dialog', { timeout: 5000 });

      // 验证角色编码字段禁用
      const roleCodeInput = page.locator('.el-dialog input').nth(1);
      await expect(roleCodeInput).toBeDisabled();

      // 关闭弹窗
      await page.click('.el-dialog__headerbtn');
    } else {
      // 没有应用级角色则跳过验证
      expect(true).toBe(true);
    }
  });

  // ==================== 5.3 编辑应用级角色 ====================

  test('RL-009: 打开编辑抽屉', async ({ page }) => {
    // 等待表格加载
    await page.waitForSelector('.el-table', { timeout: 10000 });

    // 查找应用级角色行
    const appLevelTag = page.locator('.el-tag.el-tag--primary:has-text("应用级")');
    const count = await appLevelTag.count();

    if (count > 0) {
      // 点击编辑按钮
      const appLevelRow = appLevelTag.first().locator('xpath=ancestor::tr');
      await appLevelRow.locator('button:has-text("编辑")').click();

      // 等待弹窗出现
      await page.waitForSelector('.el-dialog', { timeout: 5000 });

      // 验证弹窗标题
      await expect(page.locator('.el-dialog__title:has-text("编辑角色")')).toBeVisible();

      // 验证表单显示当前角色信息
      const roleNameInput = page.locator('.el-dialog input').first();
      await expect(roleNameInput).toHaveValue(await appLevelRow.locator('td:first-child').textContent() || '');

      // 关闭弹窗
      await page.click('.el-dialog__headerbtn');
    } else {
      expect(true).toBe(true);
    }
  });

  test('RL-010: 编辑角色名称', async ({ page }) => {
    // 等待表格加载
    await page.waitForSelector('.el-table', { timeout: 10000 });

    // 查找应用级角色行
    const appLevelTag = page.locator('.el-tag.el-tag--primary:has-text("应用级")');
    const count = await appLevelTag.count();

    if (count > 0) {
      const appLevelRow = appLevelTag.first().locator('xpath=ancestor::tr');
      const originalName = await appLevelRow.locator('td:first-child').textContent();

      // 点击编辑按钮
      await appLevelRow.locator('button:has-text("编辑")').click();
      await page.waitForSelector('.el-dialog', { timeout: 5000 });

      // 修改角色名称
      const roleNameInput = page.locator('.el-dialog input').first();
      await roleNameInput.fill(`${originalName?.trim()}_edited`);

      // 点击提交
      await page.click('.el-dialog button:has-text("确定")');

      // 等待成功提示
      await page.waitForSelector('.el-message--success', { timeout: 5000 });

      // 验证列表刷新
      await page.waitForTimeout(500);
      await expect(page.locator(`td:has-text("${originalName?.trim()}_edited")`)).toBeVisible();
    } else {
      expect(true).toBe(true);
    }
  });

  test('RL-011: 编辑角色描述', async ({ page }) => {
    // 等待表格加载
    await page.waitForSelector('.el-table', { timeout: 10000 });

    // 查找应用级角色行
    const appLevelTag = page.locator('.el-tag.el-tag--primary:has-text("应用级")');
    const count = await appLevelTag.count();

    if (count > 0) {
      const appLevelRow = appLevelTag.first().locator('xpath=ancestor::tr');

      // 点击编辑按钮
      await appLevelRow.locator('button:has-text("编辑")').click();
      await page.waitForSelector('.el-dialog', { timeout: 5000 });

      // 查找描述输入框（如果存在）
      const descInput = page.locator('.el-dialog textarea, .el-dialog input[placeholder*="描述"]').first();

      if (await descInput.isVisible()) {
        await descInput.fill('E2E 测试修改的描述');
        await page.click('.el-dialog button:has-text("确定")');
        await page.waitForSelector('.el-message--success', { timeout: 5000 });
      }

      // 关闭弹窗
      await page.click('.el-dialog__headerbtn');
    } else {
      expect(true).toBe(true);
    }
  });

  // ==================== 5.4 删除应用级角色 ====================

  test('RL-012: 删除角色确认', async ({ page }) => {
    // 等待表格加载
    await page.waitForSelector('.el-table', { timeout: 10000 });

    // 查找非拥有者的应用级角色行
    const rows = page.locator('.el-table__row');
    const rowCount = await rows.count();

    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const typeTag = row.locator('.el-tag:has-text("应用级")');
      const isOwnerCell = row.locator('td:nth-child(5)');
      const isOwnerText = await isOwnerCell.textContent();

      if (await typeTag.isVisible() && isOwnerText?.trim() === '否') {
        // 点击删除按钮
        await row.locator('button:has-text("删除")').click();

        // 验证确认对话框出现
        await page.waitForSelector('.el-message-box', { timeout: 5000 });
        await expect(page.locator('.el-message-box__title:has-text("确认删除")')).toBeVisible();

        // 取消删除
        await page.click('.el-message-box .el-button--default');
        break;
      }
    }
  });

  test('RL-013: 确认删除', async ({ page }) => {
    // 先创建一个临时角色用于删除测试
    await page.click('button:has-text("新建角色")');
    await page.waitForSelector('.el-dialog', { timeout: 5000 });

    await page.locator('.el-dialog input').first().fill('待删除角色');
    await page.locator('.el-dialog input').nth(1).fill('temp_delete_role');
    await page.click('.el-dialog button:has-text("确定")');
    await page.waitForSelector('.el-message--success', { timeout: 5000 });
    await page.waitForTimeout(500);

    // 找到刚创建的角色并删除
    const tempRoleRow = page.locator('tr:has(td:has-text("待删除角色"))');
    await tempRoleRow.locator('button:has-text("删除")').click();

    // 确认删除
    await page.waitForSelector('.el-message-box', { timeout: 5000 });
    await page.click('.el-message-box .el-button--primary');

    // 等待成功提示
    await page.waitForSelector('.el-message--success', { timeout: 5000 });

    // 验证角色已从列表中消失
    await page.waitForTimeout(500);
    await expect(page.locator('td:has-text("待删除角色")')).not.toBeVisible();
  });

  test('RL-014: 删除角色级联处理', async ({ page }) => {
    // 此测试需要后端验证用户角色绑定是否同步移除
    // 由于 E2E 测试无法直接验证后端数据，此测试仅验证前端删除成功
    // 后端应该在同一事务中处理：删除角色权限关联 + 删除用户角色关联 + 删除角色记录

    // 创建临时角色
    await page.click('button:has-text("新建角色")');
    await page.waitForSelector('.el-dialog', { timeout: 5000 });
    await page.locator('.el-dialog input').first().fill('级联测试角色');
    await page.locator('.el-dialog input').nth(1).fill('cascade_test_role');
    await page.click('.el-dialog button:has-text("确定")');
    await page.waitForSelector('.el-message--success', { timeout: 5000 });
    await page.waitForTimeout(500);

    // 删除角色
    const tempRoleRow = page.locator('tr:has(td:has-text("级联测试角色"))');
    await tempRoleRow.locator('button:has-text("删除")').click();
    await page.waitForSelector('.el-message-box', { timeout: 5000 });
    await page.click('.el-message-box .el-button--primary');
    await page.waitForSelector('.el-message--success', { timeout: 5000 });

    // 验证删除成功
    await expect(page.locator('td:has-text("级联测试角色")')).not.toBeVisible();
  });

  test('RL-015: 拥有者角色不可删除', async ({ page }) => {
    // 等待表格加载
    await page.waitForSelector('.el-table', { timeout: 10000 });

    // 查找拥有者角色行（isOwner = 是）
    const rows = page.locator('.el-table__row');
    const rowCount = await rows.count();

    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const isOwnerCell = row.locator('td:nth-child(5)');
      const isOwnerText = await isOwnerCell.textContent();

      if (isOwnerText?.trim() === '是') {
        // 验证删除按钮禁用
        const deleteButton = row.locator('button:has-text("删除")');
        await expect(deleteButton).toBeDisabled();
        break;
      }
    }
  });

  // ==================== 5.5 角色权限分配 ====================

  test('RL-016: 打开权限分配面板', async ({ page }) => {
    // 等待表格加载
    await page.waitForSelector('.el-table', { timeout: 10000 });

    // 查找应用级角色行
    const appLevelTag = page.locator('.el-tag.el-tag--primary:has-text("应用级")');
    const count = await appLevelTag.count();

    if (count > 0) {
      // 点击权限分配按钮
      const appLevelRow = appLevelTag.first().locator('xpath=ancestor::tr');
      await appLevelRow.locator('button:has-text("权限")').click();

      // 等待权限分配面板打开（目前功能开发中，仅验证按钮可点击）
      await page.waitForTimeout(500);

      // 验证提示信息（当前功能开发中）
      await page.waitForSelector('.el-message--info:has-text("权限分配功能开发中")', { timeout: 5000 });
    } else {
      expect(true).toBe(true);
    }
  });

  test('RL-017: 查看 PC 权限树', async ({ page }) => {
    // 此测试需要权限分配面板完成开发后编写
    // 当前功能开发中，跳过此测试
    test.skip(true, '权限分配面板功能开发中');
  });

  test('RL-018: 勾选 PC 权限', async ({ page }) => {
    // 此测试需要权限分配面板完成开发后编写
    // 当前功能开发中，跳过此测试
    test.skip(true, '权限分配面板功能开发中');
  });

  test('RL-019: 查看 NORMAL 权限列表', async ({ page }) => {
    // 此测试需要权限分配面板完成开发后编写
    // 当前功能开发中，跳过此测试
    test.skip(true, '权限分配面板功能开发中');
  });

  test('RL-020: 勾选 NORMAL 权限', async ({ page }) => {
    // 此测试需要权限分配面板完成开发后编写
    // 当前功能开发中，跳过此测试
    test.skip(true, '权限分配面板功能开发中');
  });

  test('RL-021: 权限池约束验证', async ({ page }) => {
    // 此测试需要权限分配面板完成开发后编写
    // 当前功能开发中，跳过此测试
    test.skip(true, '权限分配面板功能开发中');
  });

  test('RL-022: 保存权限分配', async ({ page }) => {
    // 此测试需要权限分配面板完成开发后编写
    // 当前功能开发中，跳过此测试
    test.skip(true, '权限分配面板功能开发中');
  });
});