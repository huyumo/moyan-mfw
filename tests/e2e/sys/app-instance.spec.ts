/**
 * @fileoverview 应用实例管理页面 E2E 测试。
 *
 * 测试范围：
 * - 应用实例列表页面（AI-001 ~ AI-004）
 * - 新建应用实例（AI-005 ~ AI-011）
 * - 编辑应用实例（AI-012 ~ AI-016）
 * - 删除应用实例（AI-017 ~ AI-020）
 * - 查看应用详情（AI-021 ~ AI-024）
 *
 * 参考文档：docs/01-业务需求/01-基础设施/05-页面设计/应用实例管理页面.md
 * 测试账号：admin / Admin@123（管理员）
 */

import { test, expect } from '@playwright/test';
import { loginAsAdmin, navigateToSysPage } from '../helpers/auth';

test.describe('应用实例管理测试', () => {
  // ========================================
  // 4.1 应用实例列表页面
  // ========================================

  test.describe('应用实例列表页面', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      await navigateToSysPage(page, 'app');
    });

    test('AI-001: 应用实例列表加载 - 显示应用实例列表', async ({ page }) => {
      // 等待表格加载
      await page.waitForSelector('.el-table__body-wrapper tr', { timeout: 10000 });

      // 验证：显示应用实例列表表格
      await expect(page.locator('.el-table')).toBeVisible();
      await expect(page.locator('.el-table__body-wrapper tr')).toBeVisible();
    });

    test('AI-002: 列表字段展示 - 显示所有必要字段', async ({ page }) => {
      // 等待表格加载
      await page.waitForSelector('.el-table__body-wrapper tr', { timeout: 10000 });

      // 验证：检查表格列头
      const tableHeaders = page.locator('.el-table__header th');
      await expect(tableHeaders.getByText(/应用名称/)).toBeVisible();
      await expect(tableHeaders.getByText(/应用编码/)).toBeVisible();
      await expect(tableHeaders.getByText(/应用类型/)).toBeVisible();
      await expect(tableHeaders.getByText(/拥有者/)).toBeVisible();
      await expect(tableHeaders.getByText(/状态/)).toBeVisible();
    });

    test('AI-003: 按类型筛选 - 列表按类型过滤', async ({ page }) => {
      // 等待表格加载
      await page.waitForSelector('.el-table__body-wrapper tr', { timeout: 10000 });

      // 找到应用类型筛选器
      const typeFilter = page.locator('.el-select').filter({ hasText: /应用类型|类型/ });
      if (await typeFilter.count() > 0) {
        await typeFilter.click();

        // 选择某个类型
        await page.waitForSelector('.el-select-dropdown', { timeout: 3000 });
        const typeOption = page.locator('.el-select-dropdown__item').first();
        await typeOption.click();

        // 等待列表刷新
        await page.waitForTimeout(500);

        // 验证：列表过滤显示该类型的应用实例
        await expect(page.locator('.el-table__body-wrapper tr')).toBeVisible();
      }
    });

    test('AI-004: 清空筛选 - 列表恢复显示所有', async ({ page }) => {
      // 等待表格加载
      await page.waitForSelector('.el-table__body-wrapper tr', { timeout: 10000 });

      // 点击清空筛选按钮
      const clearBtn = page.locator('button').filter({ hasText: /清空|重置/ });
      if (await clearBtn.count() > 0) {
        await clearBtn.click();

        // 等待列表刷新
        await page.waitForTimeout(500);

        // 验证：列表恢复显示所有应用实例
        await expect(page.locator('.el-table__body-wrapper tr')).toBeVisible();
      }
    });
  });

  // ========================================
  // 4.2 新建应用实例
  // ========================================

  test.describe('新建应用实例', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      await navigateToSysPage(page, 'app');
      await page.waitForSelector('.el-table__body-wrapper tr', { timeout: 10000 });
    });

    test('AI-005: 打开新建表单 - 显示新建应用抽屉', async ({ page }) => {
      // 点击新建应用按钮
      await page.locator('button').filter({ hasText: /新建应用|新增/ }).click();

      // 验证：打开新建应用抽屉/弹窗
      await page.waitForSelector('.el-drawer.is-open, .el-dialog.is-open', { timeout: 5000 });
      await expect(page.locator('.el-drawer__body, .el-dialog__body')).toBeVisible();
    });

    test('AI-006: 选择应用类型 - 类型选中成功', async ({ page }) => {
      // 打开新建表单
      await page.locator('button').filter({ hasText: /新建应用|新增/ }).click();
      await page.waitForSelector('.el-drawer.is-open, .el-dialog.is-open', { timeout: 5000 });

      // 在应用类型下拉框中选择类型
      const typeSelect = page.locator('[name="appTypeId"], .app-type-select');
      if (await typeSelect.count() > 0) {
        await typeSelect.click();
        await page.waitForSelector('.el-select-dropdown', { timeout: 3000 });
        const typeOption = page.locator('.el-select-dropdown__item').first();
        await typeOption.click();

        // 验证：类型选中成功
        await expect(typeSelect.locator('.el-select__tags-text, .el-input__inner')).not.toBeEmpty();
      }
    });

    test('AI-007: 输入拥有者手机号 - 搜索用户成功', async ({ page }) => {
      // 打开新建表单
      await page.locator('button').filter({ hasText: /新建应用|新增/ }).click();
      await page.waitForSelector('.el-drawer.is-open, .el-dialog.is-open', { timeout: 5000 });

      // 在拥有者输入框输入手机号
      const ownerInput = page.locator('[name="ownerPhone"], .owner-search-input');
      if (await ownerInput.count() > 0) {
        await ownerInput.fill('13800138000');

        // 点击搜索
        const searchBtn = page.locator('button').filter({ hasText: /搜索|查询/ });
        if (await searchBtn.count() > 0) {
          await searchBtn.click();

          // 验证：显示用户信息
          await page.waitForTimeout(500);
          await expect(page.locator('.owner-info, .user-info')).toBeVisible();
        }
      }
    });

    test('AI-008: 拥有者用户不存在 - 显示用户不存在提示', async ({ page }) => {
      // 打开新建表单
      await page.locator('button').filter({ hasText: /新建应用|新增/ }).click();
      await page.waitForSelector('.el-drawer.is-open, .el-dialog.is-open', { timeout: 5000 });

      // 输入不存在用户手机号
      const ownerInput = page.locator('[name="ownerPhone"], .owner-search-input');
      if (await ownerInput.count() > 0) {
        await ownerInput.fill('99999999999');

        // 点击搜索
        const searchBtn = page.locator('button').filter({ hasText: /搜索|查询/ });
        if (await searchBtn.count() > 0) {
          await searchBtn.click();

          // 验证：显示用户不存在提示
          await page.waitForTimeout(500);
          await expect(page.locator('text=/用户不存在|找不到用户/')).toBeVisible();
        }
      }
    });

    test('AI-009: 填写应用信息 - 应用创建成功', async ({ page }) => {
      // 打开新建表单
      await page.locator('button').filter({ hasText: /新建应用|新增/ }).click();
      await page.waitForSelector('.el-drawer.is-open, .el-dialog.is-open', { timeout: 5000 });

      // 填写应用名称
      await page.locator('[name="appName"]').fill('测试应用实例');

      // 填写应用编码（唯一）
      const timestamp = Date.now();
      await page.locator('[name="appCode"]').fill(`test-app-${timestamp}`);

      // 选择应用类型
      const typeSelect = page.locator('[name="appTypeId"], .app-type-select');
      if (await typeSelect.count() > 0) {
        await typeSelect.click();
        await page.waitForSelector('.el-select-dropdown', { timeout: 3000 });
        await page.locator('.el-select-dropdown__item').first().click();
      }

      // 输入拥有者手机号并搜索
      const ownerInput = page.locator('[name="ownerPhone"], .owner-search-input');
      if (await ownerInput.count() > 0) {
        await ownerInput.fill('13800138000');
        const searchBtn = page.locator('button').filter({ hasText: /搜索|查询/ });
        if (await searchBtn.count() > 0) {
          await searchBtn.click();
          await page.waitForTimeout(500);
        }
      }

      // 提交
      await page.locator('button').filter({ hasText: /提交|保存|确定/ }).click();

      // 验证：创建成功，列表刷新
      await page.waitForTimeout(1000);
      await expect(page.locator('.el-message--success')).toBeVisible();
    });

    test('AI-010: appCode 全局唯一验证 - 显示编码已存在错误', async ({ page }) => {
      // 打开新建表单
      await page.locator('button').filter({ hasText: /新建应用|新增/ }).click();
      await page.waitForSelector('.el-drawer.is-open, .el-dialog.is-open', { timeout: 5000 });

      // 输入已存在的 appCode（如 system-instance）
      await page.locator('[name="appCode"]').fill('system-instance');

      // 填写其他必填项
      await page.locator('[name="appName"]').fill('重复编码测试');

      // 提交
      await page.locator('button').filter({ hasText: /提交|保存|确定/ }).click();

      // 验证：显示"应用编码已存在"错误
      await page.waitForTimeout(500);
      await expect(page.locator('text=/应用编码已存在|编码重复/')).toBeVisible();
    });

    test('AI-011: 必须绑定拥有者 - 显示必须选择拥有者错误', async ({ page }) => {
      // 打开新建表单
      await page.locator('button').filter({ hasText: /新建应用|新增/ }).click();
      await page.waitForSelector('.el-drawer.is-open, .el-dialog.is-open', { timeout: 5000 });

      // 填写应用名称和编码，不选择拥有者
      await page.locator('[name="appName"]').fill('无拥有者测试');
      const timestamp = Date.now();
      await page.locator('[name="appCode"]').fill(`no-owner-${timestamp}`);

      // 直接提交
      await page.locator('button').filter({ hasText: /提交|保存|确定/ }).click();

      // 验证：显示"必须选择拥有者"错误
      await page.waitForTimeout(500);
      await expect(page.locator('text=/必须选择拥有者|请选择拥有者/')).toBeVisible();
    });
  });

  // ========================================
  // 4.3 编辑应用实例
  // ========================================

  test.describe('编辑应用实例', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      await navigateToSysPage(page, 'app');
      await page.waitForSelector('.el-table__body-wrapper tr', { timeout: 10000 });
    });

    test('AI-012: 打开编辑抽屉 - 显示编辑表单', async ({ page }) => {
      // 点击编辑按钮
      const firstRow = page.locator('.el-table__body-wrapper tr').first();
      await firstRow.locator('button').filter({ hasText: /编辑/ }).click();

      // 验证：打开编辑抽屉，显示当前信息
      await page.waitForSelector('.el-drawer.is-open', { timeout: 5000 });
      await expect(page.locator('.el-drawer__body')).toBeVisible();
    });

    test('AI-013: 编辑应用名称 - 名称更新成功', async ({ page }) => {
      // 打开编辑抽屉
      const firstRow = page.locator('.el-table__body-wrapper tr').first();
      await firstRow.locator('button').filter({ hasText: /编辑/ }).click();
      await page.waitForSelector('.el-drawer.is-open', { timeout: 5000 });

      // 修改 appName
      await page.locator('[name="appName"]').fill('更新后的应用名称');

      // 点击提交
      await page.locator('button').filter({ hasText: /提交|保存/ }).click();

      // 验证：更新成功
      await page.waitForTimeout(1000);
      await expect(page.locator('.el-message--success')).toBeVisible();
    });

    test('AI-014: 变更拥有者 - 拥有者变更成功', async ({ page }) => {
      // 打开编辑抽屉
      const firstRow = page.locator('.el-table__body-wrapper tr').first();
      await firstRow.locator('button').filter({ hasText: /编辑/ }).click();
      await page.waitForSelector('.el-drawer.is-open', { timeout: 5000 });

      // 搜索新拥有者用户
      const ownerInput = page.locator('[name="ownerPhone"], .owner-search-input');
      if (await ownerInput.count() > 0) {
        // 输入新拥有者手机号
        await ownerInput.fill('13900139000');

        // 点击搜索
        const searchBtn = page.locator('button').filter({ hasText: /搜索|查询/ });
        if (await searchBtn.count() > 0) {
          await searchBtn.click();
          await page.waitForTimeout(500);
        }
      }

      // 点击提交
      await page.locator('button').filter({ hasText: /提交|保存/ }).click();

      // 验证：变更成功
      await page.waitForTimeout(1000);
      await expect(page.locator('.el-message--success')).toBeVisible();
    });

    test('AI-015: appCode 不可修改 - appCode 字段禁用', async ({ page }) => {
      // 打开编辑抽屉
      const firstRow = page.locator('.el-table__body-wrapper tr').first();
      await firstRow.locator('button').filter({ hasText: /编辑/ }).click();
      await page.waitForSelector('.el-drawer.is-open', { timeout: 5000 });

      // 验证：appCode 字段禁用
      const appCodeInput = page.locator('[name="appCode"]');
      await expect(appCodeInput).toBeDisabled();
    });

    test('AI-016: 变更拥有者事务验证 - 权限正确更新', async ({ page }) => {
      // 此测试需要验证拥有者变更后的权限状态
      // 打开编辑抽屉
      const firstRow = page.locator('.el-table__body-wrapper tr').first();
      await firstRow.locator('button').filter({ hasText: /编辑/ }).click();
      await page.waitForSelector('.el-drawer.is-open', { timeout: 5000 });

      // 变更拥有者并提交
      // ...

      // 验证：需要后端返回数据确认原拥有者权限已移除，新拥有者权限已绑定
      // 此测试作为预留，需要结合具体业务逻辑实现
    });
  });

  // ========================================
  // 4.4 删除应用实例
  // ========================================

  test.describe('删除应用实例', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      await navigateToSysPage(page, 'app');
      await page.waitForSelector('.el-table__body-wrapper tr', { timeout: 10000 });
    });

    test('AI-017: 删除应用确认 - 显示删除确认对话框', async ({ page }) => {
      // 找一个非内置应用实例的删除按钮
      const rows = page.locator('.el-table__body-wrapper tr');
      const nonSystemRow = rows.filter({ hasNotText: /system-instance|系统实例/ }).first();

      if (await nonSystemRow.count() > 0) {
        await nonSystemRow.locator('button').filter({ hasText: /删除/ }).click();

        // 验证：显示删除确认对话框
        await page.waitForSelector('.el-dialog', { timeout: 5000 });
        await expect(page.locator('text=/确认删除|确定要删除/')).toBeVisible();
      }
    });

    test('AI-018: 确认删除 - 应用删除成功', async ({ page }) => {
      // 找一个非内置应用实例
      const rows = page.locator('.el-table__body-wrapper tr');
      const nonSystemRow = rows.filter({ hasNotText: /system-instance|系统实例/ }).first();

      if (await nonSystemRow.count() > 0) {
        await nonSystemRow.locator('button').filter({ hasText: /删除/ }).click();
        await page.waitForSelector('.el-dialog', { timeout: 5000 });

        // 点击确定
        await page.locator('button').filter({ hasText: /确定/ }).click();

        // 验证：删除成功，列表刷新
        await page.waitForTimeout(1000);
        await expect(page.locator('.el-message--success')).toBeVisible();
      }
    });

    test('AI-019: 取消删除 - 应用未被删除', async ({ page }) => {
      // 找一个非内置应用实例
      const rows = page.locator('.el-table__body-wrapper tr');
      const nonSystemRow = rows.filter({ hasNotText: /system-instance|系统实例/ }).first();

      if (await nonSystemRow.count() > 0) {
        // 记录删除前的应用数量
        const countBefore = await rows.count();

        await nonSystemRow.locator('button').filter({ hasText: /删除/ }).click();
        await page.waitForSelector('.el-dialog', { timeout: 5000 });

        // 点击取消
        await page.locator('button').filter({ hasText: /取消/ }).click();

        // 验证：对话框关闭，应用未被删除
        await page.waitForSelector('.el-dialog', { state: 'hidden' });
        const countAfter = await rows.count();
        expect(countAfter).toBe(countBefore);
      }
    });

    test('AI-020: 内置应用实例不可删除 - 显示错误提示', async ({ page }) => {
      // 查找系统内置应用实例（appCode='system-instance'）
      const systemInstance = page.locator('.el-table__body-wrapper tr').filter({ hasText: 'system-instance' });

      if (await systemInstance.count() > 0) {
        // 点击删除按钮
        await systemInstance.locator('button').filter({ hasText: /删除/ }).click();

        // 验证：显示"系统内置应用实例不可删除"提示
        await page.waitForTimeout(500);
        await expect(page.locator('text=/系统内置应用实例不可删除|内置应用不能删除/')).toBeVisible();
      }
    });
  });

  // ========================================
  // 4.5 查看应用详情
  // ========================================

  test.describe('查看应用详情', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      await navigateToSysPage(page, 'app');
      await page.waitForSelector('.el-table__body-wrapper tr', { timeout: 10000 });
    });

    test('AI-021: 进入详情页 - 显示应用详情页', async ({ page }) => {
      // 点击详情按钮
      const firstRow = page.locator('.el-table__body-wrapper tr').first();
      await firstRow.locator('button').filter({ hasText: /详情/ }).click();

      // 验证：进入应用详情页
      await page.waitForURL(/\/sys\/app-instance\/\d+/);
      await expect(page.locator('.app-detail')).toBeVisible();
    });

    test('AI-022: 基本信息展示 - 显示应用基本信息', async ({ page }) => {
      // 进入详情页
      const firstRow = page.locator('.el-table__body-wrapper tr').first();
      await firstRow.locator('button').filter({ hasText: /详情/ }).click();
      await page.waitForURL(/\/sys\/app-instance\/\d+/);

      // 验证：显示基本信息
      await expect(page.locator('text=/应用名称/')).toBeVisible();
      await expect(page.locator('text=/应用编码/')).toBeVisible();
      await expect(page.locator('text=/应用类型/')).toBeVisible();
      await expect(page.locator('text=/描述/')).toBeVisible();
    });

    test('AI-023: 拥有者信息展示 - 显示拥有者信息', async ({ page }) => {
      // 进入详情页
      const firstRow = page.locator('.el-table__body-wrapper tr').first();
      await firstRow.locator('button').filter({ hasText: /详情/ }).click();
      await page.waitForURL(/\/sys\/app-instance\/\d+/);

      // 验证：显示拥有者信息
      await expect(page.locator('text=/拥有者/')).toBeVisible();
      await expect(page.locator('.owner-info')).toBeVisible();
    });

    test('AI-024: 成员管理入口 - 跳转到成员管理页面', async ({ page }) => {
      // 进入详情页
      const firstRow = page.locator('.el-table__body-wrapper tr').first();
      await firstRow.locator('button').filter({ hasText: /详情/ }).click();
      await page.waitForURL(/\/sys\/app-instance\/\d+/);

      // 点击成员管理链接
      const memberLink = page.locator('text=/成员管理|查看成员/').first();
      await memberLink.click();

      // 验证：跳转到成员管理页面
      await page.waitForURL(/\/sys\/member/);
      await expect(page.locator('.member-list, .el-table')).toBeVisible();
    });
  });
});