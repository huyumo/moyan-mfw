/**
 * @fileoverview MfwPageScene 组件 E2E 测试。
 */

import { test, expect } from '@playwright/test';

test.describe('MfwPageScene Component Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components-demo/page-scene');
    await page.waitForLoadState('networkidle');
  });

  test('should display PageScene demo page', async ({ page }) => {
    await expect(page.locator('text=示例 1: 基础用法 - 搜索面板 + 表格一体化')).toBeVisible();
    await expect(page.locator('text=示例 2: 带行选择的表格')).toBeVisible();
    await expect(page.locator('text=示例 3: 自定义列渲染 - 操作列')).toBeVisible();
    await expect(page.locator('text=示例 4: 带排序的表格')).toBeVisible();
  });

  test('should display search panel with input fields', async ({ page }) => {
    // 检查搜索面板是否存在
    await expect(page.locator('input[placeholder="请输入用户名或邮箱"]')).toBeVisible();
    // 状态选择器 - 使用 combobox 角色
    await expect(page.locator('role=combobox[name="状态"]').first()).toBeVisible();
    // 日期选择器
    await expect(page.locator('role=combobox[name="日期"]').first()).toBeVisible();
  });

  test('should search and display results', async ({ page }) => {
    // 在关键词输入框输入
    await page.fill('input[placeholder="请输入用户名或邮箱"]', '张三');

    // 点击搜索按钮
    await page.click('button:has-text("搜索")');

    // 等待表格数据加载
    await page.waitForTimeout(1000);

    // 检查表格是否显示数据 - 使用:first() 避免多个匹配
    await expect(page.getByText('张三').first()).toBeVisible();
    await expect(page.getByText('zhangsan@example.com').first()).toBeVisible();
  });

  test('should reset search form', async ({ page }) => {
    // 输入搜索条件
    await page.fill('input[placeholder="请输入用户名或邮箱"]', 'test');

    // 点击重置按钮
    await page.click('button:has-text("重置")');

    // 等待重置完成
    await page.waitForTimeout(500);

    // 检查输入框是否被清空
    const inputValue = await page.inputValue('input[placeholder="请输入用户名或邮箱"]');
    expect(inputValue).toBe('');
  });

  test('should refresh table data', async ({ page }) => {
    // 点击刷新按钮
    await page.click('button:has-text("刷新")');

    // 等待刷新完成
    await page.waitForTimeout(1000);

    // 检查表格是否仍然显示数据 - 使用:first() 避免多个匹配
    await expect(page.getByText('张三').first()).toBeVisible();
  });

  test('should handle row selection', async ({ page }) => {
    // 找到示例 2 的复选框
    const checkboxes = page.locator('.el-table__row .el-checkbox');
    const firstCheckbox = checkboxes.first();

    // 点击第一个复选框
    await firstCheckbox.click();
    await page.waitForTimeout(500);

    // 检查是否显示选中状态
    await expect(page.locator('text=已选择 1 行')).toBeVisible();
  });

  test('should clear selection', async ({ page }) => {
    // 先选中一行
    const checkboxes = page.locator('.el-table__row .el-checkbox');
    await checkboxes.first().click();
    await page.waitForTimeout(500);

    // 点击清空选中按钮
    await page.click('button:has-text("清空选中")');
    await page.waitForTimeout(500);

    // 检查选中提示是否消失
    await expect(page.locator('text=已选择')).not.toBeVisible();
  });

  test('should display action buttons in operation column', async ({ page }) => {
    // 检查操作列是否存在 - 使用:first() 避免多个匹配
    await expect(page.getByText('操作').first()).toBeVisible();

    // 检查操作按钮是否存在 - 在示例 3 的卡片中查找
    const demoCard = page.locator('.demo-card').nth(2);
    await expect(demoCard.getByText('查看').first()).toBeVisible();
    await expect(demoCard.getByText('编辑').first()).toBeVisible();
    await expect(demoCard.getByText('删除').first()).toBeVisible();
  });

  test('should handle column sorting', async ({ page }) => {
    // 找到示例 4 的卡片
    const demoCard = page.locator('.demo-card').nth(3);

    // 找到可排序的列头 - 使用更具体的选择器
    const sortHeader = demoCard.locator('th:has-text("姓名")').first();

    // 点击排序按钮
    await sortHeader.click();
    await page.waitForTimeout(1000);

    // 检查排序图标是否存在（Element Plus 使用不同的类名）
    await expect(demoCard.locator('.ascending, .descending, .sort-caret').first()).toBeVisible();
  });

  test('should display status tags with correct colors', async ({ page }) => {
    // 检查状态标签
    const statusTags = page.locator('.el-tag');
    await expect(statusTags.first()).toBeVisible();

    // 检查是否有成功状态（绿色）
    const successTags = page.locator('.el-tag.el-tag--success');
    await expect(successTags.first()).toBeVisible();

    // 检查是否有危险状态（红色）
    const dangerTags = page.locator('.el-tag.el-tag--danger');
    await expect(dangerTags.first()).toBeVisible();
  });

  test('should handle pagination', async ({ page }) => {
    // 检查分页控件是否存在 - 使用更通用的选择器
    const pagination = page.locator('.el-pagination, [class*="pagination"]').first();
    await expect(pagination).toBeVisible();

    // 检查分页按钮
    await expect(page.locator('.btn-next, [class*="next"]').first()).toBeVisible();
    await expect(page.locator('.btn-prev, [class*="prev"]').first()).toBeVisible();
  });
});
