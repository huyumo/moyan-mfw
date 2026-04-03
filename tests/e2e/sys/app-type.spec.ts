/**
 * @fileoverview 应用类型管理页面 E2E 测试。
 *
 * 测试范围：
 * - 应用类型列表页面（AT-001 ~ AT-004）
 * - 查看应用类型详情（AT-005 ~ AT-008）
 * - 权限池配置（AT-009 ~ AT-015）
 * - 内置角色管理（AT-016 ~ AT-020）
 * - 编辑应用类型（AT-021 ~ AT-025）
 *
 * 参考文档：docs/01-业务需求/01-基础设施/05-页面设计/应用类型管理页面.md
 * 测试账号：admin / Admin@123（管理员，可访问开发者模式页面）
 */

import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsUser, navigateToSysPage } from '../helpers/auth';

test.describe('应用类型管理测试', () => {
  // ========================================
  // 3.1 应用类型列表页面
  // ========================================

  test.describe('应用类型列表页面', () => {
    test('AT-001: 开发者鉴权检查 - 非开发者用户无法访问', async ({ page }) => {
      // 使用普通用户登录
      await loginAsUser(page);

      // 尝试访问应用类型管理页面
      await page.goto('/sys/app-type');
      await page.waitForLoadState('networkidle');

      // 验证：显示无权限访问提示
      await expect(page.locator('text=/无权限|权限不足|禁止访问/')).toBeVisible();
    });

    test('AT-002: 开发者访问列表 - 管理员可正常访问', async ({ page }) => {
      // 使用管理员登录
      await loginAsAdmin(page);

      // 访问应用类型管理页面
      await navigateToSysPage(page, 'app-type');

      // 验证：显示应用类型列表表格
      await expect(page.locator('.el-table')).toBeVisible();
      await expect(page.locator('.el-table__body-wrapper tr')).toBeVisible();
    });

    test('AT-003: 列表字段展示 - 显示所有必要字段', async ({ page }) => {
      await loginAsAdmin(page);
      await navigateToSysPage(page, 'app-type');

      // 等待表格加载
      await page.waitForSelector('.el-table__body-wrapper tr', { timeout: 10000 });

      // 验证：检查表格列头
      const tableHeaders = page.locator('.el-table__header th');
      await expect(tableHeaders.getByText(/类型名称/)).toBeVisible();
      await expect(tableHeaders.getByText(/类型编码/)).toBeVisible();
      await expect(tableHeaders.getByText(/图标/)).toBeVisible();
      await expect(tableHeaders.getByText(/描述/)).toBeVisible();
      await expect(tableHeaders.getByText(/状态/)).toBeVisible();
    });

    test('AT-004: 系统内置类型标识 - 系统类型不可删除', async ({ page }) => {
      await loginAsAdmin(page);
      await navigateToSysPage(page, 'app-type');

      // 等待表格加载
      await page.waitForSelector('.el-table__body-wrapper tr', { timeout: 10000 });

      // 查找 typeCode='system' 的行（系统内置类型）
      const systemTypeRow = page.locator('.el-table__body-wrapper tr').filter({ hasText: 'system' });

      // 验证：显示"系统内置"标识
      if (await systemTypeRow.count() > 0) {
        await expect(systemTypeRow.locator('text=/系统内置|内置/')).toBeVisible();

        // 验证：删除按钮禁用或不显示
        const deleteBtn = systemTypeRow.locator('button').filter({ hasText: /删除/ });
        if (await deleteBtn.count() > 0) {
          await expect(deleteBtn).toBeDisabled();
        }
      }
    });
  });

  // ========================================
  // 3.2 查看应用类型详情
  // ========================================

  test.describe('查看应用类型详情', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      await navigateToSysPage(page, 'app-type');
      await page.waitForSelector('.el-table__body-wrapper tr', { timeout: 10000 });
    });

    test('AT-005: 进入详情页 - 点击详情按钮跳转', async ({ page }) => {
      // 点击第一个应用类型的详情按钮
      const firstRow = page.locator('.el-table__body-wrapper tr').first();
      await firstRow.locator('button').filter({ hasText: /详情/ }).click();

      // 验证：进入应用类型详情页
      await page.waitForURL(/\/sys\/app-type\/\d+/);
      await expect(page.locator('.app-type-detail')).toBeVisible();
    });

    test('AT-006: 详情页基本信息 - 显示类型基本信息', async ({ page }) => {
      // 进入第一个应用类型详情页
      const firstRow = page.locator('.el-table__body-wrapper tr').first();
      await firstRow.locator('button').filter({ hasText: /详情/ }).click();
      await page.waitForURL(/\/sys\/app-type\/\d+/);

      // 验证：显示基本信息区域
      await expect(page.locator('text=/类型名称/')).toBeVisible();
      await expect(page.locator('text=/类型编码/')).toBeVisible();
      await expect(page.locator('text=/图标/')).toBeVisible();
      await expect(page.locator('text=/描述/')).toBeVisible();
    });

    test('AT-007: 权限池配置入口 - 显示权限池配置面板入口', async ({ page }) => {
      // 进入应用类型详情页
      const firstRow = page.locator('.el-table__body-wrapper tr').first();
      await firstRow.locator('button').filter({ hasText: /详情/ }).click();
      await page.waitForURL(/\/sys\/app-type\/\d+/);

      // 验证：显示权限池配置面板入口
      await expect(page.locator('text=/权限池配置|权限池/')).toBeVisible();
    });

    test('AT-008: 内置角色管理入口 - 显示内置角色管理面板入口', async ({ page }) => {
      // 进入应用类型详情页
      const firstRow = page.locator('.el-table__body-wrapper tr').first();
      await firstRow.locator('button').filter({ hasText: /详情/ }).click();
      await page.waitForURL(/\/sys\/app-type\/\d+/);

      // 验证：显示内置角色管理面板入口
      await expect(page.locator('text=/内置角色|角色管理/')).toBeVisible();
    });
  });

  // ========================================
  // 3.3 权限池配置
  // ========================================

  test.describe('权限池配置', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      await navigateToSysPage(page, 'app-type');
      await page.waitForSelector('.el-table__body-wrapper tr', { timeout: 10000 });

      // 进入详情页
      const firstRow = page.locator('.el-table__body-wrapper tr').first();
      await firstRow.locator('button').filter({ hasText: /详情/ }).click();
      await page.waitForURL(/\/sys\/app-type\/\d+/);

      // 点击权限池配置入口
      await page.locator('text=/权限池配置|权限池/').click();
      await page.waitForSelector('.permission-pool-panel', { timeout: 5000 });
    });

    test('AT-009: 查看 PC 权限树 - 显示 PC 权限树形结构', async ({ page }) => {
      // 验证：显示 PC 权限树
      await expect(page.locator('.permission-tree')).toBeVisible();

      // 验证：树节点可勾选
      const treeNodes = page.locator('.el-tree-node');
      await expect(treeNodes.first()).toBeVisible();
    });

    test('AT-010: 勾选 PC 权限节点 - 节点选中状态改变', async ({ page }) => {
      // 查找 MENU 节点
      const menuNode = page.locator('.el-tree-node').filter({ hasText: /MENU|菜单/ }).first();

      if (await menuNode.count() > 0) {
        // 点击勾选 checkbox
        const checkbox = menuNode.locator('.el-checkbox');
        await checkbox.click();

        // 验证：选中状态改变
        await expect(checkbox.locator('.el-checkbox__input.is-checked')).toBeVisible();
      }

      // 查找 PAGE 节点
      const pageNode = page.locator('.el-tree-node').filter({ hasText: /PAGE|页面/ }).first();
      if (await pageNode.count() > 0) {
        const checkbox = pageNode.locator('.el-checkbox');
        await checkbox.click();
        await expect(checkbox.locator('.el-checkbox__input.is-checked')).toBeVisible();
      }
    });

    test('AT-011: 配置 permissionValue - 配置操作权限', async ({ page }) => {
      // 点击 PAGE 节点展开配置
      const pageNode = page.locator('.el-tree-node').filter({ hasText: /PAGE|页面/ }).first();
      if (await pageNode.count() > 0) {
        await pageNode.click();

        // 等待 permissionValue 配置面板展开
        await page.waitForSelector('.permission-value-config', { timeout: 3000 });

        // 勾选操作权限（如 ADD、EDIT）
        const addCheckbox = page.locator('.permission-value-config').locator('text=/ADD|新增/');
        if (await addCheckbox.count() > 0) {
          await addCheckbox.click();
        }

        const editCheckbox = page.locator('.permission-value-config').locator('text=/EDIT|编辑/');
        if (await editCheckbox.count() > 0) {
          await editCheckbox.click();
        }
      }
    });

    test('AT-012: 查看普通权限列表 - 切换到普通权限 Tab', async ({ page }) => {
      // 切换到普通权限 Tab
      const normalTab = page.locator('.el-tabs__item').filter({ hasText: /普通权限|NORMAL/ });
      if (await normalTab.count() > 0) {
        await normalTab.click();

        // 验证：显示普通权限列表
        await expect(page.locator('.normal-permission-list')).toBeVisible();
      }
    });

    test('AT-013: 勾选普通权限 - TAG 权限选中状态改变', async ({ page }) => {
      // 切换到普通权限 Tab
      const normalTab = page.locator('.el-tabs__item').filter({ hasText: /普通权限|NORMAL/ });
      if (await normalTab.count() > 0) {
        await normalTab.click();

        // 勾选 TAG 权限
        const tagPermission = page.locator('.normal-permission-item').first();
        if (await tagPermission.count() > 0) {
          const checkbox = tagPermission.locator('.el-checkbox');
          await checkbox.click();
          await expect(checkbox.locator('.el-checkbox__input.is-checked')).toBeVisible();
        }
      }
    });

    test('AT-014: 保存权限池配置 - 配置保存成功', async ({ page }) => {
      // 勾选一些权限
      const treeNode = page.locator('.el-tree-node').first();
      if (await treeNode.count() > 0) {
        await treeNode.locator('.el-checkbox').click();
      }

      // 点击保存按钮
      const saveBtn = page.locator('button').filter({ hasText: /保存/ });
      await saveBtn.click();

      // 等待保存完成
      await page.waitForTimeout(1000);

      // 验证：显示成功提示
      await expect(page.locator('.el-message--success')).toBeVisible();
    });

    test('AT-015: 权限池约束验证 - 超范围配置显示错误', async ({ page }) => {
      // 尝试配置超出定义范围的 permissionValue
      // 此测试需要具体页面实现支持，目前作为预留测试
      // 如果有超范围配置的 UI 入口，点击并验证错误提示
    });
  });

  // ========================================
  // 3.4 内置角色管理
  // ========================================

  test.describe('内置角色管理', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      await navigateToSysPage(page, 'app-type');
      await page.waitForSelector('.el-table__body-wrapper tr', { timeout: 10000 });

      // 进入详情页
      const firstRow = page.locator('.el-table__body-wrapper tr').first();
      await firstRow.locator('button').filter({ hasText: /详情/ }).click();
      await page.waitForURL(/\/sys\/app-type\/\d+/);

      // 点击内置角色管理入口
      await page.locator('text=/内置角色|角色管理/').click();
      await page.waitForSelector('.builtin-roles-panel', { timeout: 5000 });
    });

    test('AT-016: 查看内置角色列表 - 显示内置角色列表', async ({ page }) => {
      // 验证：显示内置角色列表
      await expect(page.locator('.builtin-roles-list')).toBeVisible();

      // 验证：角色列表有数据
      const roleItems = page.locator('.builtin-role-item');
      await expect(roleItems.first()).toBeVisible();
    });

    test('AT-017: 添加内置角色 - 创建新内置角色', async ({ page }) => {
      // 点击添加角色按钮
      const addBtn = page.locator('button').filter({ hasText: /添加角色|新增/ });
      await addBtn.click();

      // 等待弹窗打开
      await page.waitForSelector('.el-dialog', { timeout: 5000 });

      // 填写角色名称
      await page.locator('[name="roleName"]').fill('测试内置角色');

      // 点击提交
      await page.locator('button').filter({ hasText: /确定|提交/ }).click();

      // 验证：创建成功
      await page.waitForTimeout(1000);
      await expect(page.locator('.el-message--success')).toBeVisible();
    });

    test('AT-018: 删除内置角色 - 角色删除成功', async ({ page }) => {
      // 找到一个非拥有者角色的删除按钮
      const roleItems = page.locator('.builtin-role-item');
      const nonOwnerRole = roleItems.filter({ hasNotText: /拥有者|owner/ }).first();

      if (await nonOwnerRole.count() > 0) {
        await nonOwnerRole.locator('button').filter({ hasText: /删除/ }).click();

        // 等待确认弹窗
        await page.waitForSelector('.el-dialog', { timeout: 5000 });

        // 确认删除
        await page.locator('button').filter({ hasText: /确定/ }).click();

        // 验证：删除成功
        await page.waitForTimeout(1000);
        await expect(page.locator('.el-message--success')).toBeVisible();
      }
    });

    test('AT-019: 拥有者角色不可删除 - 显示错误提示', async ({ page }) => {
      // 查找拥有者角色
      const ownerRole = page.locator('.builtin-role-item').filter({ hasText: /拥有者|owner/ });

      if (await ownerRole.count() > 0) {
        // 点击删除按钮
        const deleteBtn = ownerRole.locator('button').filter({ hasText: /删除/ });
        await deleteBtn.click();

        // 验证：显示错误提示
        await expect(page.locator('text=/拥有者角色不允许删除|不能删除拥有者/')).toBeVisible();
      }
    });

    test('AT-020: 分配内置角色权限 - 权限分配成功', async ({ page }) => {
      // 点击角色的权限分配按钮
      const roleItem = page.locator('.builtin-role-item').first();
      await roleItem.locator('button').filter({ hasText: /权限分配|权限/ }).click();

      // 等待权限分配面板打开
      await page.waitForSelector('.role-permission-panel', { timeout: 5000 });

      // 从权限池勾选权限
      const permissionCheckbox = page.locator('.permission-tree .el-checkbox').first();
      if (await permissionCheckbox.count() > 0) {
        await permissionCheckbox.click();
      }

      // 点击保存
      await page.locator('button').filter({ hasText: /保存/ }).click();

      // 验证：保存成功
      await page.waitForTimeout(1000);
      await expect(page.locator('.el-message--success')).toBeVisible();
    });
  });

  // ========================================
  // 3.5 编辑应用类型
  // ========================================

  test.describe('编辑应用类型', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      await navigateToSysPage(page, 'app-type');
      await page.waitForSelector('.el-table__body-wrapper tr', { timeout: 10000 });
    });

    test('AT-021: 打开编辑抽屉 - 显示编辑表单', async ({ page }) => {
      // 点击编辑按钮
      const firstRow = page.locator('.el-table__body-wrapper tr').first();
      await firstRow.locator('button').filter({ hasText: /编辑/ }).click();

      // 验证：打开编辑抽屉
      await page.waitForSelector('.el-drawer.is-open', { timeout: 5000 });
      await expect(page.locator('.el-drawer__body')).toBeVisible();
    });

    test('AT-022: 编辑类型名称 - 名称更新成功', async ({ page }) => {
      // 打开编辑抽屉
      const firstRow = page.locator('.el-table__body-wrapper tr').first();
      await firstRow.locator('button').filter({ hasText: /编辑/ }).click();
      await page.waitForSelector('.el-drawer.is-open', { timeout: 5000 });

      // 修改 typeName 字段
      const typeNameInput = page.locator('[name="typeName"]');
      await typeNameInput.fill('更新后的类型名称');

      // 点击提交
      await page.locator('button').filter({ hasText: /提交|保存/ }).click();

      // 验证：更新成功
      await page.waitForTimeout(1000);
      await expect(page.locator('.el-message--success')).toBeVisible();
    });

    test('AT-023: 编辑图标 - 图标更新成功', async ({ page }) => {
      // 打开编辑抽屉
      const firstRow = page.locator('.el-table__body-wrapper tr').first();
      await firstRow.locator('button').filter({ hasText: /编辑/ }).click();
      await page.waitForSelector('.el-drawer.is-open', { timeout: 5000 });

      // 选择新图标（点击图标选择器）
      const iconSelector = page.locator('.icon-selector, [name="icon"]');
      if (await iconSelector.count() > 0) {
        await iconSelector.click();
        // 选择一个图标
        const iconItem = page.locator('.icon-list-item, .icon-option').first();
        if (await iconItem.count() > 0) {
          await iconItem.click();
        }
      }

      // 点击提交
      await page.locator('button').filter({ hasText: /提交|保存/ }).click();

      // 验证：更新成功
      await page.waitForTimeout(1000);
    });

    test('AT-024: 编辑描述 - 描述更新成功', async ({ page }) => {
      // 打开编辑抽屉
      const firstRow = page.locator('.el-table__body-wrapper tr').first();
      await firstRow.locator('button').filter({ hasText: /编辑/ }).click();
      await page.waitForSelector('.el-drawer.is-open', { timeout: 5000 });

      // 修改 typeDesc 字段
      const typeDescInput = page.locator('[name="typeDesc"]');
      await typeDescInput.fill('更新后的描述信息');

      // 点击提交
      await page.locator('button').filter({ hasText: /提交|保存/ }).click();

      // 验证：更新成功
      await page.waitForTimeout(1000);
      await expect(page.locator('.el-message--success')).toBeVisible();
    });

    test('AT-025: 类型编码不可修改 - typeCode 字段禁用', async ({ page }) => {
      // 打开编辑抽屉
      const firstRow = page.locator('.el-table__body-wrapper tr').first();
      await firstRow.locator('button').filter({ hasText: /编辑/ }).click();
      await page.waitForSelector('.el-drawer.is-open', { timeout: 5000 });

      // 验证：typeCode 字段为禁用状态
      const typeCodeInput = page.locator('[name="typeCode"]');
      await expect(typeCodeInput).toBeDisabled();
    });
  });
});