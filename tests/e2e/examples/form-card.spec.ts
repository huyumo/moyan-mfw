/**
 * @fileoverview MfwFormCard 组件 E2E 测试。
 */

import { test, expect } from '@playwright/test';

test.describe('MfwFormCard Component Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components-demo/form-card');
    await page.waitForLoadState('networkidle');
  });

  test('should display FormCard demo page', async ({ page }) => {
    await expect(page.locator('text=示例 1: 基础表单')).toBeVisible();
    await expect(page.locator('text=示例 2: 分组表单 (Collapse)')).toBeVisible();
    await expect(page.locator('text=示例 3: 分组表单 (Tabs)')).toBeVisible();
    await expect(page.locator('text=示例 4: 动态显示/禁用')).toBeVisible();
    await expect(page.locator('text=示例 5: 表单验证')).toBeVisible();
  });

  test('should display form fields in basic form', async ({ page }) => {
    // 检查基础表单字段 - 使用 textbox role
    await expect(page.getByRole('textbox', { name: '* 用户名' }).first()).toBeVisible();
    await expect(page.getByRole('textbox', { name: '邮箱' }).first()).toBeVisible();
    await expect(page.getByText('性别').first()).toBeVisible();
    await expect(page.getByText('爱好').first()).toBeVisible();
    await expect(page.getByText('生日').first()).toBeVisible();
  });

  test('should input text in form fields', async ({ page }) => {
    // 在第一个 demo-card 中找到用户名和邮箱输入框
    const demoCard = page.locator('.demo-card').first();

    // 输入用户名
    await demoCard.getByRole('textbox', { name: '* 用户名' }).first().fill('测试用户');
    await page.waitForTimeout(300);

    // 输入邮箱
    await demoCard.getByRole('textbox', { name: '邮箱' }).first().fill('test@example.com');
    await page.waitForTimeout(300);

    // 检查表单数据预览是否正确更新
    const formDataText = await demoCard.locator('.demo-data pre').textContent();
    expect(formDataText).toContain('测试用户');
    expect(formDataText).toContain('test@example.com');
  });

  test('should select radio option', async ({ page }) => {
    // 选择性别 - 在第一个 demo-card 中
    const demoCard = page.locator('.demo-card').first();

    // 点击包含 radio 的父元素（避开 inner span）
    await demoCard.getByText('男').first().click();
    await page.waitForTimeout(300);

    // 检查选择状态 - 检查表单数据
    const formDataText = await demoCard.locator('.demo-data pre').textContent();
    expect(formDataText).toContain('"gender": 1');
  });

  test('should select checkbox options', async ({ page }) => {
    // 选择爱好 - 在第一个 demo-card 中
    const demoCard = page.locator('.demo-card').first();

    // 滚动到爱好区域
    await demoCard.getByText('爱好').first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    // 点击旅行 checkbox（确保至少有一个可以被选中）
    await demoCard.locator('.el-checkbox-group .el-checkbox').nth(3).click();
    await page.waitForTimeout(300);

    // 检查表单数据
    const formDataText = await demoCard.locator('.demo-data pre').textContent();
    expect(formDataText).toContain('travel');
  });

  test('should display collapse groups', async ({ page }) => {
    // 检查 Collapse 分组 - 在示例 2 的卡片中
    const collapseCard = page.locator('.demo-card').nth(1);
    await expect(collapseCard.getByText('基本信息').first()).toBeVisible();
    await expect(collapseCard.getByText('联系信息').first()).toBeVisible();
  });

  test('should expand and collapse panels', async ({ page }) => {
    // 点击折叠面板标题进行切换
    await page.click('text=基本信息');
    await page.waitForTimeout(500);

    // 再次点击展开
    await page.click('text=基本信息');
    await page.waitForTimeout(500);

    // 检查面板内容是否显示
    await expect(page.locator('text=公司名称')).toBeVisible();
  });

  test('should display tabs groups', async ({ page }) => {
    // 检查 Tabs 分组 - 在示例 3 的卡片中
    const tabsCard = page.locator('.demo-card').nth(2);
    await expect(tabsCard.getByText('基本信息').first()).toBeVisible();
    await expect(tabsCard.getByText('详细信息').first()).toBeVisible();
  });

  test('should switch tabs', async ({ page }) => {
    // 点击详细信息标签
    await page.click('.el-tabs__item:has-text("详细信息")');
    await page.waitForTimeout(500);

    // 检查标签页内容是否切换
    await expect(page.locator('text=产品描述')).toBeVisible();
  });

  test('should handle dynamic show/hide', async ({ page }) => {
    // 在示例 4 的卡片中
    const dynamicCard = page.locator('.demo-card').nth(3);

    // 初始状态应该显示"姓名"字段（个人用户）
    await expect(dynamicCard.getByRole('textbox', { name: '姓名' }).first()).toBeVisible();

    // 选择企业用户 - 点击文本标签
    await dynamicCard.getByText('企业').first().click();
    await page.waitForTimeout(500);

    // 应该显示"公司名称"字段
    await expect(dynamicCard.getByRole('textbox', { name: '公司名称' }).first()).toBeVisible();

    // "姓名"字段应该隐藏
    await expect(dynamicCard.getByRole('textbox', { name: '姓名' }).first()).not.toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    // 点击提交验证按钮
    await page.click('button:has-text("提交验证")');
    await page.waitForTimeout(1000);

    // 应该显示验证错误提示
    await expect(page.locator('text=请输入用户名')).toBeVisible();
    await expect(page.locator('text=请输入密码')).toBeVisible();
  });

  test('should reset form', async ({ page }) => {
    // 先输入一些值 - 在示例 5 的卡片中
    const validateCard = page.locator('.demo-card').nth(4);
    await validateCard.getByRole('textbox', { name: '* 用户名' }).first().fill('test user');

    // 点击重置表单按钮
    await validateCard.getByRole('button', { name: '重置表单' }).click();
    await page.waitForTimeout(500);

    // 确认对话框应该出现
    await expect(page.getByText('确定要重置表单吗')).toBeVisible();

    // 确认重置
    await page.getByRole('button', { name: '确认重置' }).click();
    await page.waitForTimeout(500);

    // 检查输入框是否被清空
    const inputValue = await validateCard.getByRole('textbox', { name: '* 用户名' }).first().inputValue();
    expect(inputValue).toBe('');
  });

  test('should display form data preview', async ({ page }) => {
    // 在第一个 demo-card 中输入数据
    const demoCard = page.locator('.demo-card').first();

    await demoCard.getByRole('textbox', { name: '* 用户名' }).first().fill('张三');
    await demoCard.getByRole('textbox', { name: '邮箱' }).first().fill('zhangsan@example.com');

    // 等待数据更新
    await page.waitForTimeout(300);

    // 检查表单数据预览区域
    const formDataPre = demoCard.locator('.demo-data pre');
    await expect(formDataPre).toBeVisible();
  });
});
