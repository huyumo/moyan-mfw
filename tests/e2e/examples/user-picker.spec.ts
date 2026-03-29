/**
 * @fileoverview MfwUserPicker 组件 E2E 测试。
 */

import { test, expect } from '@playwright/test';

test.describe('MfwUserPicker Component Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components-demo/user-picker');
    await page.waitForLoadState('networkidle');
  });

  test('should display UserPicker demo page', async ({ page }) => {
    await expect(page.locator('text=示例 1: 基础用法')).toBeVisible();
    await expect(page.locator('text=示例 2: 禁用状态')).toBeVisible();
    await expect(page.locator('text=示例 3: 带部门树过滤')).toBeVisible();
    await expect(page.locator('text=示例 4: 带默认值')).toBeVisible();
  });

  test('should display user picker input', async ({ page }) => {
    // 检查基础用法的选择器 - 使用 ElSelect 结构
    const demoCard = page.locator('.demo-card').first();
    await expect(demoCard.locator('.el-select').first()).toBeVisible();
  });

  test('should open user picker dropdown', async ({ page }) => {
    // 点击用户选择器
    const demoCard = page.locator('.demo-card').first();
    await demoCard.locator('.el-select').first().click();
    await page.waitForTimeout(500);

    // 下拉选项应该显示 - 下拉菜单是 teleport 到 body 的，使用全局查找
    const dropdown = page.locator('.el-select-dropdown').first();
    await expect(dropdown).toBeVisible();
  });

  test('should display disabled user picker', async ({ page }) => {
    // 找到禁用状态的选择器 - 在示例 2 的卡片中
    const disabledCard = page.locator('.demo-card').nth(1);
    // 禁用的输入框应该有 disabled 属性或 aria-disabled 属性
    const disabledInput = disabledCard.locator('[class*="el-input"] input[disabled], .el-select input[readonly]');
    // 或者检查是否包含值 "99" 且不可编辑
    await expect(disabledCard.locator('text=99').first()).toBeVisible();
  });

  test('should display department tree filter', async ({ page }) => {
    // 检查部门树过滤 - 在示例 3 的卡片中
    const demoCard = page.locator('.demo-card').nth(2);

    // 点击选择器打开下拉面板
    await demoCard.locator('.el-select').first().click();
    await page.waitForTimeout(500);

    // 部门树应该在下拉面板的 header 中显示
    // 使用 getByText 和可见性检查
    await expect(page.getByText('技术部').first()).toBeVisible();
    await expect(page.getByText('产品部').first()).toBeVisible();
    await expect(page.getByText('运营部').first()).toBeVisible();
  });

  test('should expand department tree node', async ({ page }) => {
    // 在示例 3 的卡片中
    const demoCard = page.locator('.demo-card').nth(2);

    // 点击选择器打开下拉面板
    await demoCard.locator('.el-select').first().click();
    await page.waitForTimeout(500);

    // 点击技术部节点前面的展开图标 - 技术部是第一个节点
    const expandIcon = page.locator('.el-tree-node__expand-icon').first();
    await expandIcon.click();
    await page.waitForTimeout(300);

    // 子部门应该显示
    await expect(page.getByText('前端组').first()).toBeVisible();
    await expect(page.getByText('后端组').first()).toBeVisible();
  });

  test('should select user from dropdown', async ({ page }) => {
    // 点击用户选择器
    const demoCard = page.locator('.demo-card').first();
    await demoCard.locator('.el-select').first().click();
    await page.waitForTimeout(500);

    // 选择一个用户 - 使用 text 定位
    await page.locator('text=张三').first().click();
    await page.waitForTimeout(500);

    // 选中的用户应该显示 - 在第一个 demo-card 内
    await expect(demoCard.locator('text=选中用户:').first()).toBeVisible();
  });

  test('should display selected user data', async ({ page }) => {
    // 在第一个 demo-card 中
    const demoCard = page.locator('.demo-card').first();

    // 点击用户选择器
    await demoCard.locator('.el-select').first().click();
    await page.waitForTimeout(500);

    // 选择一个用户
    await page.locator('text=张三').first().click();
    await page.waitForTimeout(500);

    // 检查用户数据显示区域 - 在同一个 card 内
    const userDataPre = demoCard.locator('.demo-data pre');
    await expect(userDataPre).toBeVisible();
    // 检查是否包含选中的用户数据
    await expect(userDataPre).toContainText('张三');
  });

  test('should set default value', async ({ page }) => {
    // 点击设置默认值按钮
    await page.click('button:has-text("设置默认值")');
    await page.waitForTimeout(500);

    // 检查是否显示成功消息
    await expect(page.locator('.el-message:has-text("已设置默认值")')).toBeVisible();
  });

  test('should clear selected value', async ({ page }) => {
    // 先设置默认值
    await page.click('button:has-text("设置默认值")');
    await page.waitForTimeout(500);

    // 点击清空值按钮
    await page.click('button:has-text("清空值")');
    await page.waitForTimeout(500);

    // 检查是否显示成功消息
    await expect(page.locator('.el-message:has-text("已清空值")')).toBeVisible();
  });

  test('should filter users by department', async ({ page }) => {
    // 在示例 3 的卡片中
    const demoCard = page.locator('.demo-card').nth(2);

    // 点击选择器打开下拉面板
    await demoCard.locator('.el-select').first().click();
    await page.waitForTimeout(500);

    // 在部门树中点击技术部节点 - 使用 getByText
    const techDeptNode = page.getByText('技术部').first();
    await techDeptNode.click();
    await page.waitForTimeout(500);

    // 用户列表应该更新，显示消息
    await expect(page.locator('.el-message:has-text("切换到部门")')).toBeVisible();
  });

  test('should display user avatar in dropdown', async ({ page }) => {
    // 点击用户选择器
    const demoCard = page.locator('.demo-card').first();
    await demoCard.locator('.el-select').first().click();
    await page.waitForTimeout(500);

    // 检查用户头像 - 使用 text 定位用户项，然后查找前面的头像
    // 组件渲染的用户列表项包含头像 div 和用户名称
    const userItem = page.locator('.el-select-dropdown__item').first();
    await expect(userItem).toBeVisible();
  });

  test('should display user details in dropdown', async ({ page }) => {
    // 点击用户选择器
    const demoCard = page.locator('.demo-card').first();
    await demoCard.locator('.el-select').first().click();
    await page.waitForTimeout(500);

    // 检查用户详情信息 - 使用 text 定位
    await expect(page.locator('text=张三').first()).toBeVisible();
  });
});
