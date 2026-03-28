/**
 * @fileoverview 偏好设置面板组合测试 - 测试所有设置组合并截图保存
 */

import { test, type Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// 测试配置
const SCREENSHOT_DIR = path.join(process.cwd(), 'temp', 'screenshots', 'settings-panel');

// 确保目录存在
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// 主题配置
const themes = [
  { key: 'aurora', label: '极光蓝' },
  { key: 'ocean', label: '海洋绿' },
  { key: 'graphite', label: '石墨灰' },
  { key: 'sunset', label: '落日橙' },
  { key: 'mint', label: '薄荷青' },
];

// 色彩模式
const colorModes = [
  { key: 'light', label: '浅色' },
  { key: 'dark', label: '深色' },
];

// 布局模式
const layoutModes = [
  { key: 'sidebar', label: '侧边栏' },
  { key: 'top', label: '顶部菜单' },
  { key: 'dual', label: '双栏菜单' },
];

// 深色区域开关组合
const darkAreaCombos = [
  { name: 'default', darkSidebar: false, darkSidebarChildren: false, darkHeader: false },
  { name: 'darkSidebar', darkSidebar: true, darkSidebarChildren: false, darkHeader: false },
  { name: 'darkSidebar+Children', darkSidebar: true, darkSidebarChildren: true, darkHeader: false },
  { name: 'darkHeader', darkSidebar: false, darkSidebarChildren: false, darkHeader: true },
  { name: 'darkSidebar+Header', darkSidebar: true, darkSidebarChildren: false, darkHeader: true },
  { name: 'all-dark', darkSidebar: true, darkSidebarChildren: true, darkHeader: true },
];

// 生成时间戳
function timestamp(): string {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '').slice(0, -5);
}

// 生成文件名
function generateFilename(params: Record<string, string>): string {
  const parts = Object.entries(params)
    .map(([key, value]) => `${key}=${value}`)
    .join('_');
  return `${parts}_${timestamp()}.png`;
}

// 截取页面
async function captureScreenshot(page: Page, name: string, params: Record<string, string>) {
  const filename = generateFilename(params);
  const filepath = path.join(SCREENSHOT_DIR, `${name}_${filename}`);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`Screenshot saved: ${filepath}`);
  return filepath;
}

// 登录
async function login(page: Page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  await page.locator('input[type="text"]').fill('admin');
  await page.locator('input[type="password"]').fill('admin');
  await page.locator('button.mfw-login-submit').click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
}

// 打开设置面板
async function openSettingsPanel(page: Page) {
  // 设置图标在第 6 个位置（索引 5）
  await page.locator('.header-actions .action-icon-btn').nth(5).click();
  await page.waitForTimeout(1000);
}

// 保存设置并关闭面板
async function saveAndCloseSettingsPanel(page: Page) {
  // 等待保存按钮变为可点击状态（最多等待 10 秒）
  await page.waitForSelector('button.mfw-admin-settings-save:not(:disabled)', { timeout: 10000 }).catch(() => {});
  // 点击保存按钮（保存后抽屉会自动关闭）
  // 使用 force: true 以防按钮状态检测问题
  await page.click('button.mfw-admin-settings-save', { force: true });
  await page.waitForTimeout(1500);
}

// 切换到 Tab
async function switchToTab(page: Page, tabName: string) {
  await page.click(`.el-tabs__item:has-text("${tabName}")`);
  await page.waitForTimeout(500);
}

test.describe('偏好设置面板组合测试', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test.describe('第一组：色彩模式 × 主题', () => {
    for (const colorMode of colorModes) {
      for (const theme of themes) {
        test(`色彩模式:${colorMode.label} + 主题:${theme.label}`, async ({ page }) => {
          // 打开设置面板
          await openSettingsPanel(page);

          // 切换到外观 tab（默认就是）
          await switchToTab(page, '外观');

          // 设置色彩模式
          await page.click(`button.mfw-admin-scheme-btn--${colorMode.key}`);
          await page.waitForTimeout(500);

          // 设置主题
          await page.click(`button.mfw-admin-theme-card:has-text("${theme.label}")`);
          await page.waitForTimeout(500);

          // 保存设置并关闭面板
          await saveAndCloseSettingsPanel(page);

          await captureScreenshot(page, 'color-theme', {
            color: colorMode.key,
            theme: theme.key,
          });
        });
      }
    }
  });

  test.describe('第二组：深色区域组合', () => {
    for (const combo of darkAreaCombos) {
      test(`深色区域：${combo.name}`, async ({ page }) => {
        // 打开设置面板
        await openSettingsPanel(page);
        await switchToTab(page, '外观');

        // 设置浅色模式
        await page.click('button.mfw-admin-scheme-btn--light');
        await page.waitForTimeout(500);

        // 设置极光蓝主题
        await page.click('button.mfw-admin-theme-card:has-text("极光蓝")');
        await page.waitForTimeout(500);

        // 设置深色区域开关
        if (combo.darkSidebar) {
          await page.click('.mfw-admin-switch-item:has-text("深色侧边栏") .el-switch');
          await page.waitForTimeout(300);
        }

        if (combo.darkSidebarChildren && combo.darkSidebar) {
          await page.click('.mfw-admin-switch-item:has-text("深色侧边栏子栏") .el-switch');
          await page.waitForTimeout(300);
        }

        if (combo.darkHeader) {
          await page.click('.mfw-admin-switch-item:has-text("深色顶栏") .el-switch');
          await page.waitForTimeout(300);
        }

        // 保存设置并关闭面板
        await saveAndCloseSettingsPanel(page);

        await captureScreenshot(page, 'dark-areas', {
          color: 'light',
          theme: 'aurora',
          darkAreas: combo.name,
        });
      });
    }
  });

  test.describe('第三组：布局模式', () => {
    for (const layout of layoutModes) {
      for (const colorMode of colorModes) {
        test(`布局:${layout.label} + 色彩:${colorMode.label}`, async ({ page }) => {
          // 打开设置面板
          await openSettingsPanel(page);

          // 切换到布局 tab
          await switchToTab(page, '布局');

          // 设置布局模式
          await page.click(`button.mfw-admin-layout-mode-card:has-text("${layout.label}")`);
          await page.waitForTimeout(500);

          // 切换到外观 tab 设置色彩
          await switchToTab(page, '外观');

          // 设置色彩模式
          await page.click(`button.mfw-admin-scheme-btn--${colorMode.key}`);
          await page.waitForTimeout(500);

          // 保存设置并关闭面板
          await saveAndCloseSettingsPanel(page);

          await captureScreenshot(page, 'layout-mode', {
            layout: layout.key,
            color: colorMode.key,
          });
        });
      }
    }
  });

  test.describe('第四组：问题场景复现', () => {
    test('深色 + 落日橙 (用户反馈：文字与背景混为一团)', async ({ page }) => {
      await openSettingsPanel(page);
      await switchToTab(page, '外观');

      // 设置深色模式
      await page.click('button.mfw-admin-scheme-btn--dark');
      await page.waitForTimeout(500);

      // 设置落日橙主题
      await page.click('button.mfw-admin-theme-card:has-text("落日橙")');
      await page.waitForTimeout(500);

      await saveAndCloseSettingsPanel(page);

      await captureScreenshot(page, 'issue-repro', {
        color: 'dark',
        theme: 'sunset',
        issue: 'text-bg-blend',
      });
    });

    test('浅色 + 深色侧边栏 (用户反馈：影响其他地方)', async ({ page }) => {
      await openSettingsPanel(page);
      await switchToTab(page, '外观');

      // 设置浅色模式
      await page.click('button.mfw-admin-scheme-btn--light');
      await page.waitForTimeout(500);

      // 设置深色侧边栏
      await page.click('.mfw-admin-switch-item:has-text("深色侧边栏") .el-switch');
      await page.waitForTimeout(500);

      await saveAndCloseSettingsPanel(page);

      await captureScreenshot(page, 'issue-repro', {
        color: 'light',
        theme: 'aurora',
        darkSidebar: 'true',
        issue: 'sidebar-affect-others',
      });
    });
  });
});
