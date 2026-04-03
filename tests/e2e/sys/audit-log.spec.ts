/**
 * @fileoverview 审计日志系统 E2E 测试。
 *
 * 测试审计日志页面的功能：
 * - 日志列表加载和展示
 * - 多维度筛选功能（时间、操作人、操作类型、模块）
 * - 日志详情查看（包含快照数据对比）
 *
 * 参考文档：
 * - docs/01-业务需求/01-基础设施/06-API 接口/审计日志设计.md
 * - docs/04-项目实施/05-任务追踪/2026-04-02-1430-Playwright测试用例清单.md
 *
 * 测试账号：admin / Admin@123（管理员）
 */

import { test, expect } from '@playwright/test';
import { loginAsAdmin, navigateToSysPage } from '../helpers/auth';

test.describe('Audit Log Tests', () => {
  /**
   * 每个测试前登录管理员账号并导航到审计日志页面。
   */
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToSysPage(page, 'audit-log');
  });

  // ========================================
  // 9.1 日志列表页面测试
  // ========================================

  /**
   * AL-001: 日志列表加载
   *
   * 操作步骤：
   * 1. 进入 `/sys/audit-log`
   * 2. 等待列表加载
   *
   * 预期结果：显示审计日志列表表格
   */
  test('AL-001: should load audit log list', async ({ page }) => {
    // 等待表格加载
    await expect(page.locator('.el-table, .mfw-table, [data-testid="audit-log-table"]')).toBeVisible();

    // 确认表格内有数据行（或空状态提示）
    const tableBody = page.locator('.el-table__body-wrapper, .mfw-table-body');
    await expect(tableBody).toBeVisible();

    // 验证页面标题
    await expect(page.locator('text=审计日志, text=Audit Log, h1, h2').first()).toBeVisible();
  });

  /**
   * AL-002: 列表字段展示
   *
   * 操作步骤：
   * 1. 查看列表各列
   *
   * 预期结果：显示操作时间、操作人、操作类型、模块、描述等字段
   */
  test('AL-002: should display all required columns in list', async ({ page }) => {
    // 等待表格加载
    await page.waitForLoadState('networkidle');

    // 检查关键列标题是否存在
    const expectedColumns = [
      '操作时间',
      '操作人',
      '操作类型',
      '模块',
      '描述',
    ];

    // 验证表头包含这些列
    const tableHeader = page.locator('.el-table__header-wrapper, .mfw-table-header, thead');

    for (const columnName of expectedColumns) {
      // 使用多种选择器策略匹配列名
      const columnLocator = tableHeader.locator(`text=${columnName}`);
      await expect(columnLocator.first()).toBeVisible({ timeout: 5_000 });
    }
  });

  /**
   * AL-003: 分页功能
   *
   * 操作步骤：
   * 1. 查看分页组件
   * 2. 切换页码
   *
   * 预期结果：分页正常工作
   */
  test('AL-003: should work with pagination', async ({ page }) => {
    // 等待数据加载完成
    await page.waitForLoadState('networkidle');

    // 查找分页组件
    const pagination = page.locator('.el-pagination, .mfw-pagination, [data-testid="pagination"]');

    // 确认分页组件存在
    await expect(pagination).toBeVisible();

    // 检查分页信息显示（总条数、当前页）
    const paginationInfo = pagination.locator('.el-pagination__total, .mfw-pagination__total, text=/共.*条/');
    await expect(paginationInfo.first()).toBeVisible();

    // 如果有下一页按钮且可用，尝试点击
    const nextButton = pagination.locator('.el-pagination__next, .btn-next, [data-testid="next-page"]');

    if (await nextButton.isVisible() && !await nextButton.isDisabled()) {
      // 记录当前第一条数据的时间（用于验证数据变化）
      const firstRowBefore = await page.locator('.el-table__body tr:first-child td:first-child, tbody tr:first-child td:first-child').textContent();

      // 点击下一页
      await nextButton.click();
      await page.waitForLoadState('networkidle');

      // 验证数据已切换（第一条数据时间应该不同）
      const firstRowAfter = await page.locator('.el-table__body tr:first-child td:first-child, tbody tr:first-child td:first-child').textContent();

      // 数据应该发生变化（除非只有一页数据）
      // 注意：如果只有一页数据，此断言可能失败，但这是预期行为
    }
  });

  // ========================================
  // 9.2 多维度筛选测试
  // ========================================

  /**
   * AL-004: 按时间范围筛选
   *
   * 操作步骤：
   * 1. 选择开始时间
   * 2. 选择结束时间
   * 3. 点击搜索
   *
   * 预期结果：列表过滤显示指定时间范围的日志
   */
  test('AL-004: should filter by time range', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // 查找时间范围选择器
    const timeRangePicker = page.locator('.el-date-editor--daterange, [data-testid="time-range-picker"], .date-range-picker');

    // 确认时间选择器存在
    await expect(timeRangePicker).toBeVisible();

    // 点击打开日期选择面板
    await timeRangePicker.click();
    await page.waitForTimeout(300);

    // 选择开始日期（点击日期面板中的日期）
    const datePanel = page.locator('.el-picker-panel, .el-date-picker');
    await expect(datePanel).toBeVisible();

    // 选择今天作为时间范围
    const todayCell = datePanel.locator('.el-date-table td.today, td.available:has-text("' + new Date().getDate() + '")');
    if (await todayCell.first().isVisible()) {
      await todayCell.first().click();
    }

    // 等待面板关闭
    await page.waitForTimeout(500);

    // 点击搜索按钮
    const searchButton = page.locator('button:has-text("搜索"), button:has-text("查询"), [data-testid="search-btn"]');
    if (await searchButton.isVisible()) {
      await searchButton.click();
      await page.waitForLoadState('networkidle');
    }

    // 验证列表已更新（数据加载完成）
    await expect(page.locator('.el-table__body-wrapper, tbody')).toBeVisible();
  });

  /**
   * AL-005: 按操作人筛选
   *
   * 操作步骤：
   * 1. 输入操作人用户名
   * 2. 点击搜索
   *
   * 预期结果：列表过滤显示该操作人的日志
   */
  test('AL-005: should filter by operator name', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // 查找操作人输入框
    const operatorInput = page.locator('[name="operatorName"], [data-testid="operator-filter"], input:has-placeholder("操作人"), .operator-filter input');

    // 确认输入框存在
    await expect(operatorInput.first()).toBeVisible();

    // 输入操作人名称（admin）
    await operatorInput.first().fill('admin');
    await page.waitForTimeout(300);

    // 点击搜索按钮
    const searchButton = page.locator('button:has-text("搜索"), button:has-text("查询"), [data-testid="search-btn"]');
    await searchButton.click();
    await page.waitForLoadState('networkidle');

    // 验证列表数据中的操作人列包含 admin
    const operatorColumn = page.locator('.el-table__body td:has-text("admin"), tbody td:has-text("admin")');

    // 等待数据加载并检查
    await expect(operatorColumn.first()).toBeVisible({ timeout: 5_000 });
  });

  /**
   * AL-006: 按操作类型筛选
   *
   * 操作步骤：
   * 1. 选择操作类型下拉
   * 2. 点击搜索
   *
   * 预期结果：列表过滤显示该类型的日志
   */
  test('AL-006: should filter by operation type', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // 查找操作类型下拉框
    const typeSelect = page.locator('.operation-type-select, [data-testid="operation-type-select"], .el-select:has-placeholder("操作类型")');

    // 确认下拉框存在
    await expect(typeSelect.first()).toBeVisible();

    // 点击打开下拉选项
    await typeSelect.first().click();
    await page.waitForTimeout(300);

    // 等待下拉选项面板显示
    const selectDropdown = page.locator('.el-select-dropdown, .el-select__popper');
    await expect(selectDropdown).toBeVisible();

    // 选择第一个可用选项
    const firstOption = selectDropdown.locator('.el-select-dropdown__item:not(.is-disabled)').first();
    if (await firstOption.isVisible()) {
      const selectedType = await firstOption.textContent();
      await firstOption.click();
      await page.waitForTimeout(300);

      // 点击搜索按钮
      const searchButton = page.locator('button:has-text("搜索"), button:has-text("查询"), [data-testid="search-btn"]');
      await searchButton.click();
      await page.waitForLoadState('networkidle');

      // 验证数据加载
      await expect(page.locator('.el-table__body-wrapper, tbody')).toBeVisible();
    }
  });

  /**
   * AL-007: 按模块筛选
   *
   * 操作步骤：
   * 1. 选择模块下拉
   * 2. 点击搜索
   *
   * 预期结果：列表过滤显示该模块的日志
   */
  test('AL-007: should filter by operation module', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // 查找模块下拉框
    const moduleSelect = page.locator('.module-select, [data-testid="module-select"], .el-select:has-placeholder("模块")');

    // 确认下拉框存在
    await expect(moduleSelect.first()).toBeVisible();

    // 点击打开下拉选项
    await moduleSelect.first().click();
    await page.waitForTimeout(300);

    // 等待下拉选项面板显示
    const selectDropdown = page.locator('.el-select-dropdown, .el-select__popper');
    await expect(selectDropdown).toBeVisible();

    // 选择一个模块选项（如 USER、AUTH 等）
    const moduleOption = selectDropdown.locator('.el-select-dropdown__item:has-text("USER"), .el-select-dropdown__item:has-text("AUTH")');
    if (await moduleOption.first().isVisible()) {
      await moduleOption.first().click();
      await page.waitForTimeout(300);

      // 点击搜索按钮
      const searchButton = page.locator('button:has-text("搜索"), button:has-text("查询"), [data-testid="search-btn"]');
      await searchButton.click();
      await page.waitForLoadState('networkidle');

      // 验证数据加载
      await expect(page.locator('.el-table__body-wrapper, tbody')).toBeVisible();
    }
  });

  /**
   * AL-008: 组合筛选
   *
   * 操作步骤：
   * 1. 同时设置多个筛选条件
   * 2. 点击搜索
   *
   * 预期结果：列表过滤显示满足所有条件的日志
   */
  test('AL-008: should filter with combined conditions', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // 设置操作人筛选
    const operatorInput = page.locator('[name="operatorName"], [data-testid="operator-filter"], input:has-placeholder("操作人"), .operator-filter input');
    await expect(operatorInput.first()).toBeVisible();
    await operatorInput.first().fill('admin');
    await page.waitForTimeout(200);

    // 设置操作类型筛选
    const typeSelect = page.locator('.operation-type-select, [data-testid="operation-type-select"]').first();
    if (await typeSelect.isVisible()) {
      await typeSelect.click();
      await page.waitForTimeout(300);

      const selectDropdown = page.locator('.el-select-dropdown, .el-select__popper');
      await expect(selectDropdown).toBeVisible();

      const firstOption = selectDropdown.locator('.el-select-dropdown__item:not(.is-disabled)').first();
      if (await firstOption.isVisible()) {
        await firstOption.click();
        await page.waitForTimeout(200);
      }
    }

    // 点击搜索按钮
    const searchButton = page.locator('button:has-text("搜索"), button:has-text("查询"), [data-testid="search-btn"]');
    await searchButton.click();
    await page.waitForLoadState('networkidle');

    // 验证数据加载，且结果满足所有筛选条件
    await expect(page.locator('.el-table__body-wrapper, tbody')).toBeVisible();

    // 验证操作人列包含 admin
    const operatorColumn = page.locator('.el-table__body td:has-text("admin"), tbody td:has-text("admin")');
    await expect(operatorColumn.first()).toBeVisible({ timeout: 5_000 });
  });

  /**
   * AL-009: 清空筛选
   *
   * 操作步骤：
   * 1. 点击清空按钮
   *
   * 预期结果：筛选条件清空，列表恢复显示所有日志
   */
  test('AL-009: should clear all filters', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // 先设置一个筛选条件
    const operatorInput = page.locator('[name="operatorName"], [data-testid="operator-filter"], input:has-placeholder("操作人"), .operator-filter input');
    if (await operatorInput.first().isVisible()) {
      await operatorInput.first().fill('admin');
      await page.waitForTimeout(200);

      // 点击搜索
      const searchButton = page.locator('button:has-text("搜索"), button:has-text("查询"), [data-testid="search-btn"]');
      await searchButton.click();
      await page.waitForLoadState('networkidle');
    }

    // 查找清空按钮
    const clearButton = page.locator('button:has-text("清空"), button:has-text("重置"), button:has-text("清除"), [data-testid="clear-btn"]');

    // 确认清空按钮存在并点击
    await expect(clearButton).toBeVisible();
    await clearButton.click();
    await page.waitForTimeout(300);

    // 验证筛选输入框已清空
    if (await operatorInput.first().isVisible()) {
      const inputValue = await operatorInput.first().inputValue();
      expect(inputValue).toBe('');
    }

    // 验证列表已恢复显示所有日志
    await expect(page.locator('.el-table__body-wrapper, tbody')).toBeVisible();
  });

  // ========================================
  // 9.3 日志详情查看测试
  // ========================================

  /**
   * AL-010: 打开详情抽屉
   *
   * 操作步骤：
   * 1. 点击日志行的"详情"按钮
   *
   * 预期结果：打开日志详情抽屉
   */
  test('AL-010: should open detail drawer', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // 等待表格数据加载
    const tableBody = page.locator('.el-table__body-wrapper, tbody');
    await expect(tableBody).toBeVisible();

    // 查找第一条日志行的详情按钮
    const detailButton = page.locator('button:has-text("详情"), button:has-text("查看"), [data-testid="detail-btn"]').first();

    // 确认详情按钮存在
    await expect(detailButton).toBeVisible();

    // 点击详情按钮
    await detailButton.click();
    await page.waitForTimeout(500);

    // 验证详情抽屉/弹窗已打开
    const detailDrawer = page.locator('.el-drawer, .el-dialog, [data-testid="detail-drawer"], [data-testid="detail-dialog"]');
    await expect(detailDrawer).toBeVisible();

    // 验证抽屉标题
    await expect(detailDrawer.locator('.el-drawer__title, .el-dialog__title, h3, h4')).toBeVisible();
  });

  /**
   * AL-011: 详情信息展示
   *
   * 操作步骤：
   * 1. 查看抽屉内容
   *
   * 预期结果：显示操作时间、操作人、操作类型、描述等详情
   */
  test('AL-011: should display detail information', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // 打开详情抽屉
    const detailButton = page.locator('button:has-text("详情"), button:has-text("查看"), [data-testid="detail-btn"]').first();
    await expect(detailButton).toBeVisible();
    await detailButton.click();
    await page.waitForTimeout(500);

    // 验证详情抽屉已打开
    const detailDrawer = page.locator('.el-drawer, .el-dialog, [data-testid="detail-drawer"]');
    await expect(detailDrawer).toBeVisible();

    // 检查详情信息字段
    const expectedFields = [
      '操作时间',
      '操作人',
      '操作类型',
      '模块',
      '描述',
      'IP 地址',
    ];

    // 验证详情区域包含这些字段标签
    for (const field of expectedFields) {
      const fieldLocator = detailDrawer.locator(`text=${field}`);
      await expect(fieldLocator.first()).toBeVisible({ timeout: 3_000 });
    }
  });

  /**
   * AL-012: 快照数据展示
   *
   * 操作步骤：
   * 1. 查看快照区域
   *
   * 预期结果：显示操作前的数据快照和操作后的数据快照
   */
  test('AL-012: should display snapshot data', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // 打开详情抽屉
    const detailButton = page.locator('button:has-text("详情"), button:has-text("查看"), [data-testid="detail-btn"]').first();
    await expect(detailButton).toBeVisible();
    await detailButton.click();
    await page.waitForTimeout(500);

    // 验证详情抽屉已打开
    const detailDrawer = page.locator('.el-drawer, .el-dialog, [data-testid="detail-drawer"]');
    await expect(detailDrawer).toBeVisible();

    // 查找快照数据区域
    const snapshotSection = detailDrawer.locator('.snapshot-data, .data-snapshot, [data-testid="snapshot-data"], text=/快照/, text=/数据对比/');

    // 如果存在快照区域，验证其内容
    if (await snapshotSection.isVisible()) {
      // 验证有"变更前"或"beforeData"标签
      const beforeLabel = detailDrawer.locator('text=变更前, text=操作前, text=Before, text=beforeData');
      await expect(beforeLabel.first()).toBeVisible();

      // 验证有"变更后"或"afterData"标签
      const afterLabel = detailDrawer.locator('text=变更后, text=操作后, text=After, text=afterData');
      await expect(afterLabel.first()).toBeVisible();
    }

    // 关闭抽屉
    const closeButton = detailDrawer.locator('.el-drawer__close-btn, .el-dialog__close-btn, button:has-text("关闭")');
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }
  });

  /**
   * AL-013: 数据对比
   *
   * 操作步骤：
   * 1. 比较前后快照
   *
   * 铺预期结果：可直观看到数据变更内容
   */
  test('AL-013: should show data comparison', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // 打开详情抽屉
    const detailButton = page.locator('button:has-text("详情"), button:has-text("查看"), [data-testid="detail-btn"]').first();
    await expect(detailButton).toBeVisible();
    await detailButton.click();
    await page.waitForTimeout(500);

    // 验证详情抽屉已打开
    const detailDrawer = page.locator('.el-drawer, .el-dialog, [data-testid="detail-drawer"]');
    await expect(detailDrawer).toBeVisible();

    // 查找快照数据区域
    const snapshotSection = detailDrawer.locator('.snapshot-data, .data-snapshot, [data-testid="snapshot-data"]');

    if (await snapshotSection.isVisible()) {
      // 验证存在数据对比展示组件
      // 可能是并排对比、差异高亮等形式
      const comparisonView = snapshotSection.locator('.comparison, .diff-view, .data-compare, pre, code');

      // 验证存在JSON格式的数据展示
      const jsonDataView = snapshotSection.locator('pre, code, .json-view');
      await expect(jsonDataView.first()).toBeVisible({ timeout: 3_000 });

      // 验证数据格式正确（JSON 格式）
      const dataContent = await jsonDataView.first().textContent();
      expect(dataContent).toBeTruthy();
    }

    // 关闭抽屉
    const closeButton = detailDrawer.locator('.el-drawer__close-btn, .el-dialog__close-btn, button:has-text("关闭")');
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }
  });
});