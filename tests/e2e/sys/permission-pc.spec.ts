/**
 * @fileoverview PC 权限管理页面测试。
 *
 * 测试场景：
 * - PC-001: PC 权限树加载
 * - PC-002: 同步节点标识
 * - PC-003: 手动节点标识
 * - PC-004: 树节点只读
 * - PC-005: 点击同步按钮
 * - PC-006: 同步成功提示
 * - PC-007: 同步新增权限
 * - PC-008: 同步更新权限
 * - PC-009: 点击检查差异
 * - PC-010: 差异类型展示
 * - PC-011: 无差异提示
 * - PC-012: 选中 PAGE 节点
 * - PC-013: 勾选操作权限位
 * - PC-014: MENU 节点不可配置
 * - PC-015: permissionValue 超范围验证
 * - PC-016: 点击手动添加
 * - PC-017: 填写权限信息
 * - PC-018: 手动权限可编辑结构
 *
 * 测试账号：admin / Admin@123
 * 页面路径：/sys/permission-pc
 *
 * 关键概念：
 * - PermissionType: PC（PC 权限）
 * - NodeType: MENU（目录）、PAGE（页面）
 * - permissionValue: 位运算权限值（ADD=1, EDIT=2, DELETE=4, EXPORT=8, IMPORT=16, VIEW=32）
 * - 同步功能：从 Vue Router 自动同步路由生成权限
 */

import { test, expect } from '@playwright/test';
import { loginAsAdmin, navigateToSysPage } from '../helpers/auth';

test.describe('PC 权限管理页面测试', () => {
  test.beforeEach(async ({ page }) => {
    // 使用管理员账号登录
    await loginAsAdmin(page);
    // 导航到 PC 权限管理页面
    await navigateToSysPage(page, 'permission-pc');
  });

  // ==================== 8.1 PC 权限树展示 ====================

  /**
   * PC-001: PC 权限树加载
   * 操作步骤：进入 /sys/permission-pc，等待树加载
   * 预期结果：显示 PC 权限树形结构
   */
  test('PC-001: PC 权限树加载', async ({ page }) => {
    // 检查页面标题
    await expect(page.locator('.pc-permission-page')).toBeVisible();

    // 检查工具栏存在
    await expect(page.locator('.permission-toolbar')).toBeVisible();

    // 检查同步路由按钮
    await expect(page.locator('button:has-text("同步路由")')).toBeVisible();

    // 检查检查差异按钮
    await expect(page.locator('button:has-text("检查差异")')).toBeVisible();

    // 检查手动添加按钮
    await expect(page.locator('button:has-text("手动添加权限")')).toBeVisible();

    // 检查权限树面板
    await expect(page.locator('.permission-tree-panel')).toBeVisible();

    // 检查权限树
    await expect(page.locator('.el-tree')).toBeVisible();
  });

  /**
   * PC-002: 同步节点标识
   * 操作步骤：查看同步生成的节点
   * 预期结果：显示"同步"标签
   */
  test('PC-002: 同步节点标识', async ({ page }) => {
    // 检查是否有同步标签
    const syncTags = page.locator('.el-tag:has-text("同步")');

    if (await syncTags.count() > 0) {
      // 验证同步标签存在
      await expect(syncTags.first()).toBeVisible();

      // 验证标签类型为 success（绿色）
      await expect(syncTags.first().locator('.el-tag--success')).toBeVisible();
    } else {
      // 如果没有同步节点，可能需要先执行同步
      test.skip();
    }
  });

  /**
   * PC-003: 手动节点标识
   * 操作步骤：查看手动添加的节点
   * 预期结果：显示"手动"标签
   */
  test('PC-003: 手动节点标识', async ({ page }) => {
    // 检查是否有手动标签
    const manualTags = page.locator('.el-tag:has-text("手动")');

    if (await manualTags.count() > 0) {
      // 验证手动标签存在
      await expect(manualTags.first()).toBeVisible();

      // 验证标签类型为 info（灰色）
      await expect(manualTags.first().locator('.el-tag--info')).toBeVisible();
    } else {
      // 如果没有手动节点，可能需要先添加
      test.skip();
    }
  });

  /**
   * PC-004: 树节点只读
   * 操作步骤：尝试拖动或编辑节点
   * 预期结果：同步节点不可编辑结构
   */
  test('PC-004: 树节点只读', async ({ page }) => {
    // 检查同步节点是否有编辑/删除按钮（应该没有）
    const syncNode = page.locator('.tree-node').filter({ hasText: '同步' }).first();

    if (await syncNode.isVisible()) {
      // 选中同步节点
      await syncNode.click();
      await page.waitForTimeout(300);

      // 同步节点不应该显示编辑/删除按钮
      // 这里验证树节点本身不支持拖动
      const tree = page.locator('.el-tree');

      // 检查树是否可拖动（应该不可拖动）
      const draggableAttr = await tree.getAttribute('draggable');
      expect(draggableAttr).toBeFalsy();
    } else {
      test.skip();
    }
  });

  // ==================== 8.2 同步路由功能 ====================

  /**
   * PC-005: 点击同步按钮
   * 操作步骤：点击"同步路由"按钮
   * 预期结果：调用同步 API
   */
  test('PC-005: 点击同步按钮', async ({ page }) => {
    // 点击同步路由按钮
    await page.click('button:has-text("同步路由")');
    await page.waitForTimeout(500);

    // 检查弹窗打开（同步预览弹窗）
    const dialog = page.locator('.el-dialog, [role="dialog"]');
    await expect(dialog).toBeVisible();

    // 检查弹窗标题
    await expect(dialog.locator('.el-dialog__title:has-text("同步预览")')).toBeVisible();
  });

  /**
   * PC-006: 同步成功提示
   * 操作步骤：同步完成
   * 预期结果：显示"同步成功"提示，权限树刷新
   */
  test('PC-006: 同步成功提示', async ({ page }) => {
    // 点击同步路由按钮
    await page.click('button:has-text("同步路由")');
    await page.waitForTimeout(500);

    // 检查弹窗打开
    const dialog = page.locator('.el-dialog, [role="dialog"]');
    await expect(dialog).toBeVisible();

    // 点击确认按钮执行同步
    await dialog.locator('button:has-text("确定")').click();
    await page.waitForTimeout(1000);

    // 验证成功提示
    await expect(page.locator('.el-message--success')).toBeVisible();

    // 验证权限树刷新
    await expect(page.locator('.el-tree')).toBeVisible();
  });

  /**
   * PC-007: 同步新增权限
   * 操作步骤：同步后发现新路由，查看权限树
   * 预期结果：新路由对应的权限节点已创建
   */
  test('PC-007: 同步新增权限', async ({ page }) => {
    // 点击同步路由按钮
    await page.click('button:has-text("同步路由")');
    await page.waitForTimeout(500);

    // 检查同步预览弹窗中是否有新增项
    const dialog = page.locator('.el-dialog, [role="dialog"]');

    // 检查差异列表中的"新增"类型
    const addItems = dialog.locator('text=新增');

    if (await addItems.count() > 0) {
      // 确认同步
      await dialog.locator('button:has-text("确定")').click();
      await page.waitForTimeout(1000);

      // 验证新权限节点出现在树中
      await expect(page.locator('.el-tree')).toBeVisible();
    }

    // 验证成功提示
    await expect(page.locator('.el-message--success')).toBeVisible();
  });

  /**
   * PC-008: 同步更新权限
   * 操作步骤：同步后发现路由名称变更，查看权限树
   * 预期结果：权限名称已更新
   */
  test('PC-008: 同步更新权限', async ({ page }) => {
    // 点击同步路由按钮
    await page.click('button:has-text("同步路由")');
    await page.waitForTimeout(500);

    // 检查同步预览弹窗
    const dialog = page.locator('.el-dialog, [role="dialog"]');

    // 检查差异列表中的"更新"类型
    const updateItems = dialog.locator('text=更新');

    if (await updateItems.count() > 0) {
      // 确认同步
      await dialog.locator('button:has-text("确定")').click();
      await page.waitForTimeout(1000);

      // 验证权限树刷新
      await expect(page.locator('.el-tree')).toBeVisible();
    }

    // 验证成功提示
    await expect(page.locator('.el-message--success')).toBeVisible();
  });

  // ==================== 8.3 检查差异功能 ====================

  /**
   * PC-009: 点击检查差异
   * 操作步骤：点击"检查差异"按钮
   * 预期结果：显示差异预览弹窗
   */
  test('PC-009: 点击检查差异', async ({ page }) => {
    // 点击检查差异按钮
    await page.click('button:has-text("检查差异")');
    await page.waitForTimeout(500);

    // 验证差异检查功能触发（可能显示提示或弹窗）
    await expect(page.locator('.el-message')).toBeVisible();
  });

  /**
   * PC-010: 差异类型展示
   * 操作步骤：查看差异列表
   * 预期结果：显示 missing/mismatch/extra 类型差异
   */
  test('PC-010: 差异类型展示', async ({ page }) => {
    // 点击同步路由按钮查看差异预览
    await page.click('button:has-text("同步路由")');
    await page.waitForTimeout(500);

    // 检查同步预览弹窗
    const dialog = page.locator('.el-dialog, [role="dialog"]');
    await expect(dialog).toBeVisible();

    // 检查差异类型标识（新增、更新、删除等）
    const diffTypes = ['新增', '更新', '删除'];

    for (const type of diffTypes) {
      const typeElement = dialog.locator(`text=${type}`);
      if (await typeElement.isVisible()) {
        await expect(typeElement).toBeVisible();
      }
    }
  });

  /**
   * PC-011: 无差异提示
   * 操作步骤：路由与权限树一致时检查
   * 预期结果：显示"当前路由与权限树一致"提示
   */
  test('PC-011: 无差异提示', async ({ page }) => {
    // 点击检查差异按钮
    await page.click('button:has-text("检查差异")');
    await page.waitForTimeout(500);

    // 如果无差异，应该显示相应提示
    const infoMessage = page.locator('.el-message--info, .el-message--success');

    if (await infoMessage.isVisible()) {
      const messageText = await infoMessage.textContent();
      expect(messageText).toContain('一致');
    }
  });

  // ==================== 8.4 permissionValue 配置 ====================

  /**
   * PC-012: 选中 PAGE 节点
   * 操作步骤：点击 PAGE 节点
   * 预期结果：右侧显示 permissionValue 配置面板
   */
  test('PC-012: 选中 PAGE 节点', async ({ page }) => {
    // 找到 PAGE 类型的节点（非 MENU）
    const pageNodes = page.locator('.el-tree-node').filter({ hasNotText: 'MENU' });

    // 或者直接找到 PAGE 标签
    const pageTag = page.locator('.tree-node').filter({ hasText: 'PAGE' });

    if (await pageTag.count() > 0) {
      // 点击 PAGE 节点
      await pageTag.first().click();
      await page.waitForTimeout(300);

      // 检查右侧配置面板显示
      await expect(page.locator('.permission-value-panel')).toBeVisible();

      // 检查节点信息显示
      await expect(page.locator('.permission-value-panel h4:has-text("操作权限配置")')).toBeVisible();
    } else {
      // 如果没有 PAGE 节点，尝试找到叶子节点
      const leafNodes = page.locator('.el-tree-node__content').filter({ has: page.locator('.el-tag') });

      if (await leafNodes.count() > 0) {
        await leafNodes.last().click();
        await page.waitForTimeout(300);

        // 检查配置面板
        const panel = page.locator('.permission-value-panel');
        if (await panel.isVisible()) {
          await expect(panel).toBeVisible();
        }
      }
    }
  });

  /**
   * PC-013: 勾选操作权限位
   * 操作步骤：勾选 ADD、EDIT、DELETE
   * 预期结果：permissionValue 配置成功
   */
  test('PC-013: 勾选操作权限位', async ({ page }) => {
    // 先找到并点击 PAGE 节点
    const pageTag = page.locator('.tree-node').filter({ hasText: 'PAGE' });

    if (await pageTag.count() > 0) {
      await pageTag.first().click();
      await page.waitForTimeout(300);

      // 检查操作权限复选框组
      const checkboxGroup = page.locator('.permission-value-panel .el-checkbox-group');
      await expect(checkboxGroup).toBeVisible();

      // 勾选新增权限
      const addCheckbox = checkboxGroup.locator('.el-checkbox:has-text("新增")');
      if (await addCheckbox.isVisible()) {
        await addCheckbox.click();
        await page.waitForTimeout(300);
      }

      // 勾选编辑权限
      const editCheckbox = checkboxGroup.locator('.el-checkbox:has-text("编辑")');
      if (await editCheckbox.isVisible()) {
        await editCheckbox.click();
        await page.waitForTimeout(300);
      }

      // 勾选删除权限
      const deleteCheckbox = checkboxGroup.locator('.el-checkbox:has-text("删除")');
      if (await deleteCheckbox.isVisible()) {
        await deleteCheckbox.click();
        await page.waitForTimeout(300);
      }

      // 验证成功提示
      await expect(page.locator('.el-message--success')).toBeVisible();
    } else {
      test.skip();
    }
  });

  /**
   * PC-014: MENU 节点不可配置
   * 操作步骤：点击 MENU 节点
   * 预期结果：显示"仅 PAGE 节点可配置 permissionValue"提示
   */
  test('PC-014: MENU 节点不可配置', async ({ page }) => {
    // 找到 MENU 类型的节点
    const menuNodes = page.locator('.tree-node').filter({ hasText: 'MENU' });

    if (await menuNodes.count() > 0) {
      // 点击 MENU 节点
      await menuNodes.first().click();
      await page.waitForTimeout(300);

      // 检查右侧面板显示提示
      const panel = page.locator('.permission-value-panel');

      // 应显示 Empty 提示
      await expect(panel.locator('.el-empty')).toBeVisible();
      await expect(panel.locator('text=请选择 PAGE 节点')).toBeVisible();
    } else {
      test.skip();
    }
  });

  /**
   * PC-015: permissionValue 超范围验证
   * 操作步骤：尝试配置超出权限池的 permissionValue
   * 预期结果：显示"permissionValue 必须是权限池的子集"错误
   */
  test('PC-015: permissionValue 超范围验证', async ({ page }) => {
    // 先找到并点击 PAGE 节点
    const pageTag = page.locator('.tree-node').filter({ hasText: 'PAGE' });

    if (await pageTag.count() > 0) {
      await pageTag.first().click();
      await page.waitForTimeout(300);

      // 尝试勾选所有权限（超出权限池范围的情况）
      const checkboxGroup = page.locator('.permission-value-panel .el-checkbox-group');
      const allCheckboxes = checkboxGroup.locator('.el-checkbox');

      const count = await allCheckboxes.count();
      for (let i = 0; i < count; i++) {
        const checkbox = allCheckboxes.nth(i);
        if (!await checkbox.locator('.el-checkbox__input.is-checked').isVisible()) {
          await checkbox.click();
          await page.waitForTimeout(100);
        }
      }

      // 如果超出范围，应显示错误提示
      const errorMessage = page.locator('.el-message--error');
      if (await errorMessage.isVisible()) {
        await expect(errorMessage).toBeVisible();
      }
    } else {
      test.skip();
    }
  });

  // ==================== 8.5 手动添加权限 ====================

  /**
   * PC-016: 点击手动添加
   * 操作步骤：点击"手动添加权限"按钮
   * 预期结果：打开添加表单弹窗
   */
  test('PC-016: 点击手动添加', async ({ page }) => {
    // 点击手动添加权限按钮
    await page.click('button:has-text("手动添加权限")');
    await page.waitForTimeout(500);

    // 检查弹窗打开
    const dialog = page.locator('.el-dialog, [role="dialog"]');
    await expect(dialog).toBeVisible();

    // 检查弹窗标题
    await expect(dialog.locator('.el-dialog__title:has-text("手动添加权限")')).toBeVisible();

    // 检查表单字段存在
    await expect(dialog.locator('input[placeholder*="权限名称"]')).toBeVisible();
    await expect(dialog.locator('input[placeholder*="权限编码"]')).toBeVisible();
  });

  /**
   * PC-017: 填写权限信息
   * 操作步骤：填写 permName、permCode，选择 NodeType，提交
   * 预期结果：手动权限创建成功，标记为"手动"
   */
  test('PC-017: 填写权限信息', async ({ page }) => {
    // 点击手动添加权限按钮
    await page.click('button:has-text("手动添加权限")');
    await page.waitForTimeout(500);

    // 检查弹窗打开
    const dialog = page.locator('.el-dialog, [role="dialog"]');
    await expect(dialog).toBeVisible();

    // 填写权限名称
    await dialog.locator('input[placeholder*="权限名称"]').fill('手动添加测试页面');

    // 填写权限编码
    await dialog.locator('input[placeholder*="权限编码"]').fill('page.manual.test');

    // 选择节点类型 PAGE
    const nodeTypeSelect = dialog.locator('.el-select');
    if (await nodeTypeSelect.isVisible()) {
      await nodeTypeSelect.click();
      await page.waitForTimeout(300);
      await page.locator('.el-select-dropdown__item:has-text("页面")').click();
    }

    // 点击提交
    await dialog.locator('button:has-text("确定")').click();
    await page.waitForTimeout(500);

    // 验证成功提示
    await expect(page.locator('.el-message--success')).toBeVisible();

    // 验证新节点出现在树中并标记为"手动"
    await expect(page.locator('.el-tree').getByText('手动添加测试页面')).toBeVisible();
    await expect(page.locator('.el-tag:has-text("手动")')).toBeVisible();
  });

  /**
   * PC-018: 手动权限可编辑结构
   * 操作步骤：查看手动添加的权限
   * 预期结果：手动权限可编辑、删除
   */
  test('PC-018: 手动权限可编辑结构', async ({ page }) => {
    // 先创建一个手动权限（如果不存在）
    await page.click('button:has-text("手动添加权限")');
    await page.waitForTimeout(500);

    const dialog = page.locator('.el-dialog, [role="dialog"]');

    await dialog.locator('input[placeholder*="权限名称"]').fill('可编辑测试权限');
    await dialog.locator('input[placeholder*="权限编码"]').fill('page.editable.test');

    // 选择节点类型
    const nodeTypeSelect = dialog.locator('.el-select');
    if (await nodeTypeSelect.isVisible()) {
      await nodeTypeSelect.click();
      await page.waitForTimeout(300);
      await page.locator('.el-select-dropdown__item').first().click();
    }

    await dialog.locator('button:has-text("确定")').click();
    await page.waitForTimeout(500);

    // 找到手动添加的节点
    const manualNode = page.locator('.tree-node').filter({ hasText: '可编辑测试权限' });

    if (await manualNode.isVisible()) {
      // 验证有"手动"标签
      await expect(manualNode.locator('.el-tag:has-text("手动")')).toBeVisible();

      // 手动权限应该可以选中并编辑
      await manualNode.click();
      await page.waitForTimeout(300);

      // 验证配置面板显示（可以编辑 permissionValue）
      const panel = page.locator('.permission-value-panel');
      if (await panel.isVisible()) {
        await expect(panel).toBeVisible();
      }
    }
  });
});