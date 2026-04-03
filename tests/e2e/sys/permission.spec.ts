/**
 * @fileoverview 权限管理页面测试（普通权限 NORMAL）。
 *
 * 测试场景：
 * - PM-001: 权限树加载
 * - PM-002: 展开折叠节点
 * - PM-003: 关键词过滤
 * - PM-004: 新建根节点（MENU）
 * - PM-005: 新建子节点（MENU）
 * - PM-006: 新建子节点（TAG）
 * - PM-007: TAG 父节点必须为 MENU
 * - PM-008: permCode 全局唯一验证
 * - PM-009: 编辑节点信息
 * - PM-010: permCode 不可修改
 * - PM-011: 删除叶子节点
 * - PM-012: 删除目录节点级联
 *
 * 测试账号：admin / Admin@123
 * 页面路径：/sys/permission
 *
 * 关键概念：
 * - PermissionType: NORMAL（普通权限）
 * - NodeType: MENU（目录）、TAG（标签）
 * - permissionValue: 位运算权限值
 */

import { test, expect } from '@playwright/test';
import { loginAsAdmin, navigateToSysPage } from '../helpers/auth';

test.describe('权限管理页面测试（NORMAL）', () => {
  test.beforeEach(async ({ page }) => {
    // 使用管理员账号登录
    await loginAsAdmin(page);
    // 导航到权限管理页面
    await navigateToSysPage(page, 'permission');
  });

  // ==================== 7.1 权限树展示 ====================

  /**
   * PM-001: 权限树加载
   * 操作步骤：进入 /sys/permission，等待树加载
   * 预期结果：显示权限树形表格
   */
  test('PM-001: 权限树加载', async ({ page }) => {
    // 检查页面标题
    await expect(page.locator('.permission-page')).toBeVisible();

    // 检查工具栏存在
    await expect(page.locator('.permission-toolbar')).toBeVisible();

    // 检查表格存在
    await expect(page.locator('.el-table')).toBeVisible();

    // 检查表格列头
    await expect(page.locator('.el-table th:has-text("权限名称")')).toBeVisible();
    await expect(page.locator('.el-table th:has-text("权限编码")')).toBeVisible();
    await expect(page.locator('.el-table th:has-text("节点类型")')).toBeVisible();
  });

  /**
   * PM-002: 展开折叠节点
   * 操作步骤：点击 MENU 节点展开/折叠
   * 预期结果：子节点显示/隐藏
   */
  test('PM-002: 展开折叠节点', async ({ page }) => {
    // 找到有子节点的目录节点（MENU 类型）
    const menuNodes = page.locator('.el-table .el-table__row').filter({ hasText: 'MENU' });

    if (await menuNodes.count() > 0) {
      const firstMenuNode = menuNodes.first();

      // 检查是否有展开图标
      const expandIcon = firstMenuNode.locator('.el-table__expand-icon');
      if (await expandIcon.isVisible()) {
        // 点击展开
        await expandIcon.click();
        await page.waitForTimeout(500);

        // 验证子节点显示
        const childRows = page.locator('.el-table .el-table__row--level-1');
        await expect(childRows.first()).toBeVisible();

        // 再次点击折叠
        await expandIcon.click();
        await page.waitForTimeout(500);

        // 验证子节点隐藏
        await expect(childRows.first()).not.toBeVisible();
      }
    }
  });

  /**
   * PM-003: 关键词过滤
   * 操作步骤：输入关键词搜索
   * 预期结果：树节点过滤显示匹配结果
   */
  test('PM-003: 关键词过滤', async ({ page }) => {
    // 获取搜索框
    const searchInput = page.locator('.permission-toolbar input[placeholder*="搜索"]');

    // 输入关键词
    await searchInput.fill('menu');
    await page.waitForTimeout(500);

    // 检查表格行是否包含关键词
    const visibleRows = page.locator('.el-table .el-table__row:visible');
    const count = await visibleRows.count();

    if (count > 0) {
      // 验证每行都包含关键词
      for (let i = 0; i < Math.min(count, 3); i++) {
        const row = visibleRows.nth(i);
        const text = await row.textContent();
        expect(text?.toLowerCase()).toContain('menu');
      }
    }

    // 清空搜索
    await searchInput.clear();
    await page.waitForTimeout(500);

    // 验证恢复显示所有节点
    const allRows = page.locator('.el-table .el-table__row');
    await expect(allRows.first()).toBeVisible();
  });

  // ==================== 7.2 新建权限节点 ====================

  /**
   * PM-004: 新建根节点（MENU）
   * 操作步骤：点击"新建根节点"，选择 NodeType=MENU，填写信息，提交
   * 预期结果：根节点创建成功
   */
  test('PM-004: 新建根节点（MENU）', async ({ page }) => {
    // 点击新建根节点按钮
    await page.click('button:has-text("新建根节点")');
    await page.waitForTimeout(500);

    // 检查弹窗打开
    const dialog = page.locator('.el-dialog, [role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('.el-dialog__title:has-text("新建权限")')).toBeVisible();

    // 填写表单
    await dialog.locator('input[placeholder*="权限名称"]').fill('测试目录');
    await dialog.locator('input[placeholder*="权限编码"]').fill('menu.test.directory');

    // 选择节点类型 MENU
    const nodeTypeSelect = dialog.locator('.el-select:has-text("目录")');
    if (await nodeTypeSelect.isVisible()) {
      await nodeTypeSelect.click();
      await page.waitForTimeout(300);
      await page.locator('.el-select-dropdown__item:has-text("目录")').click();
    }

    // 点击提交
    await dialog.locator('button:has-text("确定")').click();
    await page.waitForTimeout(500);

    // 验证成功提示
    await expect(page.locator('.el-message--success')).toBeVisible();

    // 验证新节点出现在表格中
    await expect(page.locator('.el-table').getByText('测试目录')).toBeVisible();
  });

  /**
   * PM-005: 新建子节点（MENU）
   * 操作步骤：选择父节点，点击"新建子节点"，选择 NodeType=MENU，提交
   * 预期结果：子 MENU 创建成功
   */
  test('PM-005: 新建子节点（MENU）', async ({ page }) => {
    // 先选中一个 MENU 节点作为父节点
    const menuRow = page.locator('.el-table .el-table__row').filter({ hasText: 'MENU' }).first();
    await menuRow.click();
    await page.waitForTimeout(300);

    // 点击新建子节点按钮
    await page.click('button:has-text("新建子节点")');
    await page.waitForTimeout(500);

    // 检查弹窗打开
    const dialog = page.locator('.el-dialog, [role="dialog"]');
    await expect(dialog).toBeVisible();

    // 填写表单
    await dialog.locator('input[placeholder*="权限名称"]').fill('测试子目录');
    await dialog.locator('input[placeholder*="权限编码"]').fill('menu.test.sub');

    // 选择节点类型 MENU
    const nodeTypeSelect = dialog.locator('.el-select');
    if (await nodeTypeSelect.isVisible()) {
      await nodeTypeSelect.click();
      await page.waitForTimeout(300);
      await page.locator('.el-select-dropdown__item:has-text("目录")').click();
    }

    // 点击提交
    await dialog.locator('button:has-text("确定")').click();
    await page.waitForTimeout(500);

    // 验证成功提示
    await expect(page.locator('.el-message--success')).toBeVisible();
  });

  /**
   * PM-006: 新建子节点（TAG）
   * 操作步骤：选择 MENU 父节点，新建子节点 NodeType=TAG，提交
   * 预期结果：TAG 权限创建成功
   */
  test('PM-006: 新建子节点（TAG）', async ({ page }) => {
    // 先选中一个 MENU 节点作为父节点
    const menuRow = page.locator('.el-table .el-table__row').filter({ hasText: 'MENU' }).first();
    await menuRow.click();
    await page.waitForTimeout(300);

    // 点击新建子节点按钮
    await page.click('button:has-text("新建子节点")');
    await page.waitForTimeout(500);

    // 检查弹窗打开
    const dialog = page.locator('.el-dialog, [role="dialog"]');
    await expect(dialog).toBeVisible();

    // 填写表单
    await dialog.locator('input[placeholder*="权限名称"]').fill('测试标签权限');
    await dialog.locator('input[placeholder*="权限编码"]').fill('tag.test.permission');

    // 选择节点类型 TAG
    const nodeTypeSelect = dialog.locator('.el-select');
    if (await nodeTypeSelect.isVisible()) {
      await nodeTypeSelect.click();
      await page.waitForTimeout(300);
      await page.locator('.el-select-dropdown__item:has-text("标签")').click();
    }

    // 点击提交
    await dialog.locator('button:has-text("确定")').click();
    await page.waitForTimeout(500);

    // 验证成功提示
    await expect(page.locator('.el-message--success')).toBeVisible();

    // 验证 TAG 类型显示
    await expect(page.locator('.el-table').getByText('TAG')).toBeVisible();
  });

  /**
   * PM-007: TAG 父节点必须为 MENU
   * 操作步骤：尝试为 TAG 选择 TAG 父节点
   * 预期结果：显示"父节点必须是 MENU 类型"错误
   */
  test('PM-007: TAG 父节点必须为 MENU', async ({ page }) => {
    // 先找到 TAG 节点
    const tagRows = page.locator('.el-table .el-table__row').filter({ hasText: 'TAG' });

    if (await tagRows.count() > 0) {
      // 尝试选中 TAG 节点作为父节点
      await tagRows.first().click();
      await page.waitForTimeout(300);

      // 点击新建子节点按钮
      await page.click('button:has-text("新建子节点")');
      await page.waitForTimeout(500);

      // 应显示警告提示
      await expect(page.locator('.el-message--warning, .el-message--error')).toBeVisible();
    } else {
      // 如果没有 TAG 节点，跳过此测试
      test.skip();
    }
  });

  /**
   * PM-008: permCode 全局唯一验证
   * 操作步骤：输入已存在的 permCode
   * 预期结果：显示"权限编码已存在"错误
   */
  test('PM-008: permCode 全局唯一验证', async ({ page }) => {
    // 先获取一个已存在的权限编码
    const existingCode = await page.locator('.el-table .el-table__row td:nth-child(2)').first().textContent();

    // 点击新建根节点按钮
    await page.click('button:has-text("新建根节点")');
    await page.waitForTimeout(500);

    // 检查弹窗打开
    const dialog = page.locator('.el-dialog, [role="dialog"]');
    await expect(dialog).toBeVisible();

    // 填写已存在的权限编码
    await dialog.locator('input[placeholder*="权限名称"]').fill('重复编码测试');
    await dialog.locator('input[placeholder*="权限编码"]').fill(existingCode || 'menu.system');

    // 点击提交
    await dialog.locator('button:has-text("确定")').click();
    await page.waitForTimeout(500);

    // 验证错误提示
    await expect(page.locator('.el-message--error')).toBeVisible();
  });

  // ==================== 7.3 编辑权限节点 ====================

  /**
   * PM-009: 编辑节点信息
   * 操作步骤：点击节点的"编辑"，修改 permName，提交
   * 预期结果：权限名称更新成功
   */
  test('PM-009: 编辑节点信息', async ({ page }) => {
    // 找到第一行的编辑按钮
    const firstRow = page.locator('.el-table .el-table__row').first();
    await firstRow.locator('button:has-text("编辑")').click();
    await page.waitForTimeout(500);

    // 检查弹窗打开
    const dialog = page.locator('.el-dialog, [role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('.el-dialog__title:has-text("编辑权限")')).toBeVisible();

    // 修改权限名称
    const nameInput = dialog.locator('input').first();
    await nameInput.fill('编辑后的名称');

    // 点击提交
    await dialog.locator('button:has-text("确定")').click();
    await page.waitForTimeout(500);

    // 验证成功提示
    await expect(page.locator('.el-message--success')).toBeVisible();
  });

  /**
   * PM-010: permCode 不可修改
   * 操作步骤：查看 permCode 字段
   * 预期结果：permCode 禁用，创建后不可修改
   */
  test('PM-010: permCode 不可修改', async ({ page }) => {
    // 找到第一行的编辑按钮
    const firstRow = page.locator('.el-table .el-table__row').first();
    await firstRow.locator('button:has-text("编辑")').click();
    await page.waitForTimeout(500);

    // 检查弹窗打开
    const dialog = page.locator('.el-dialog, [role="dialog"]');
    await expect(dialog).toBeVisible();

    // 检查权限编码字段是否禁用
    const codeInput = dialog.locator('input').nth(1);
    await expect(codeInput).toBeDisabled();
  });

  // ==================== 7.4 删除权限节点 ====================

  /**
   * PM-011: 删除叶子节点
   * 操作步骤：点击 TAG 节点的"删除"，确认删除
   * 预期结果：TAG 权限删除成功
   */
  test('PM-011: 删除叶子节点', async ({ page }) => {
    // 找到 TAG 节点
    const tagRows = page.locator('.el-table .el-table__row').filter({ hasText: 'TAG' });

    if (await tagRows.count() > 0) {
      const tagRow = tagRows.first();
      const permName = await tagRow.locator('td:first-child').textContent();

      // 点击删除按钮
      await tagRow.locator('button:has-text("删除")').click();
      await page.waitForTimeout(500);

      // 检查确认对话框
      const confirmDialog = page.locator('.el-message-box');
      await expect(confirmDialog).toBeVisible();
      await expect(confirmDialog.locator(`text=${permName}`)).toBeVisible();

      // 确认删除
      await confirmDialog.locator('button:has-text("确定")').click();
      await page.waitForTimeout(500);

      // 验证成功提示
      await expect(page.locator('.el-message--success')).toBeVisible();

      // 验证节点已删除
      await expect(page.locator('.el-table').getByText(permName || '')).not.toBeVisible();
    } else {
      test.skip();
    }
  });

  /**
   * PM-012: 删除目录节点级联
   * 操作步骤：删除 MENU 节点，确认删除
   * 预期结果：MENU 及所有子节点删除成功
   */
  test('PM-012: 删除目录节点级联', async ({ page }) => {
    // 找到 MENU 节点（目录）
    const menuRows = page.locator('.el-table .el-table__row').filter({ hasText: 'MENU' });

    if (await menuRows.count() > 0) {
      const menuRow = menuRows.first();
      const permName = await menuRow.locator('td:first-child').textContent();

      // 点击删除按钮
      await menuRow.locator('button:has-text("删除")').click();
      await page.waitForTimeout(500);

      // 检查确认对话框显示级联删除提示
      const confirmDialog = page.locator('.el-message-box');
      await expect(confirmDialog).toBeVisible();
      await expect(confirmDialog.locator('text=子节点')).toBeVisible();

      // 确认删除
      await confirmDialog.locator('button:has-text("确定")').click();
      await page.waitForTimeout(500);

      // 验证成功提示
      await expect(page.locator('.el-message--success')).toBeVisible();

      // 验证节点已删除
      await expect(page.locator('.el-table').getByText(permName || '')).not.toBeVisible();
    } else {
      test.skip();
    }
  });
});