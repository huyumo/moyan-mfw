/**
 * 通用测试模板生成器
 *
 * 目的：根据项目技术栈生成适合的测试模板，避免测试人员用错误的方法编写测试
 *
 * 使用方法：
 *   npx tsx generate-test-template.ts --framework uni-app --output tests/e2e/sample.spec.ts
 *   npx tsx generate-test-template.ts --framework react --output tests/e2e/sample.spec.ts
 *
 * 支持的项目类型：
 * - uni-app / 小程序
 * - Vue 3
 * - React 18
 * - Angular
 * - 原生 H5
 */

import * as fs from 'fs';
import * as path from 'path';

// 命令行参数解析
const args = process.argv.slice(2);
const frameworkArg = args.find(a => a.startsWith('--framework='))?.split('=')[1] || 'h5';
const outputArg = args.find(a => a.startsWith('--output='))?.split('=')[1];

// 框架配置
interface FrameworkConfig {
  name: string;
  description: string;
  eventConfig: EventConfig;
  componentConfig: ComponentConfig;
  routeConfig: RouteConfig;
  selectors: string[];
}

interface EventConfig {
  clickEvent: string;
  clickMethod: string;
  inputEvent: string;
  inputMethod: string;
  notes: string[];
}

interface ComponentConfig {
  formComponents: Array<{ name: string; method: string; notes: string }>;
  customComponents: Array<{ name: string; method: string; notes: string }>;
}

interface RouteConfig {
  mode: 'hash' | 'history' | 'native';
  urlPattern: string;
  waitMethod: string;
}

// 框架配置数据库
const FRAMEWORK_CONFIGS: Record<string, FrameworkConfig> = {
  'uni-app': {
    name: 'uni-app',
    description: 'uni-app 跨平台框架（Vue 3）',
    eventConfig: {
      clickEvent: 'touchstart（移动端）',
      clickMethod: 'elementHandle.dispatchEvent("touchstart") 或 touchscreen.tap()',
      inputEvent: 'input / compositioninput',
      inputMethod: 'type() 而非 fill()（uni-input/uni-textarea 不支持 fill）',
      notes: [
        '移动端优先，使用触摸事件而非鼠标事件',
        '双击需要用两次 touchstart 模拟',
        '表单组件大多是自定义组件，需要使用 type()'
      ]
    },
    componentConfig: {
      formComponents: [
        { name: 'uni-input', method: 'type()', notes: '不支持 fill()' },
        { name: 'uni-textarea', method: 'type()', notes: '不支持 fill()' },
        { name: 'uni-picker', method: 'click() + keyboard', notes: '需要特殊处理' }
      ],
      customComponents: [
        { name: '自定义按钮', method: 'dispatchEvent("touchstart")', notes: '' },
        { name: 'swiper', method: 'evaluate() 调用 API', notes: '滑动需要特殊处理' }
      ]
    },
    routeConfig: {
      mode: 'hash',
      urlPattern: '#/pages/...',
      waitMethod: 'waitForURL(/#\\/pages\\/.../)'
    },
    selectors: [
      '优先使用 data-testid 属性',
      'uni-app 编译后类名可能变化，不要依赖 CSS 类名',
      '列表项使用 data-testid="item-${id}" 模式'
    ]
  },
  'vue': {
    name: 'Vue 3',
    description: 'Vue 3 单页应用',
    eventConfig: {
      clickEvent: 'click',
      clickMethod: 'click()',
      inputEvent: 'input',
      inputMethod: 'fill() 或 type()',
      notes: [
        '桌面端应用使用 click 事件',
        'Vue 组件可能有异步更新，需要 nextTick 等待'
      ]
    },
    componentConfig: {
      formComponents: [
        { name: 'input', method: 'fill()', notes: '' },
        { name: 'textarea', method: 'fill()', notes: '' },
        { name: 'select', method: 'selectOption()', notes: '' }
      ],
      customComponents: [
        { name: 'Element Plus 组件', method: '参考官方文档', notes: '' },
        { name: 'Vuetify 组件', method: '参考官方文档', notes: '' }
      ]
    },
    routeConfig: {
      mode: 'history',
      urlPattern: '/pages/...',
      waitMethod: 'waitForURL(/\\/pages\\/.../)'
    },
    selectors: [
      '使用 data-testid 属性',
      'Vue 组件可能有作用域类名，相对稳定'
    ]
  },
  'react': {
    name: 'React 18',
    description: 'React 18 单页应用',
    eventConfig: {
      clickEvent: 'click',
      clickMethod: 'click()',
      inputEvent: 'change',
      inputMethod: 'fill()',
      notes: [
        'React 使用合成事件',
        '受控组件需要特殊处理'
      ]
    },
    componentConfig: {
      formComponents: [
        { name: 'input', method: 'fill()', notes: '' },
        { name: 'textarea', method: 'fill()', notes: '' },
        { name: 'select', method: 'selectOption()', notes: '' }
      ],
      customComponents: [
        { name: 'Ant Design', method: '参考官方文档', notes: '' },
        { name: 'Material UI', method: '参考官方文档', notes: '' }
      ]
    },
    routeConfig: {
      mode: 'history',
      urlPattern: '/pages/...',
      waitMethod: 'waitForURL(/\\/pages\\/.../)'
    },
    selectors: [
      '使用 data-testid 属性（React 推荐）',
      'role-based 选择器（getByRole）'
    ]
  },
  'h5': {
    name: '原生 H5',
    description: '原生 HTML/CSS/JavaScript',
    eventConfig: {
      clickEvent: 'click',
      clickMethod: 'click()',
      inputEvent: 'input',
      inputMethod: 'fill()',
      notes: [
        '标准 Web API',
        '无框架特殊处理'
      ]
    },
    componentConfig: {
      formComponents: [
        { name: 'input', method: 'fill()', notes: '' },
        { name: 'textarea', method: 'fill()', notes: '' },
        { name: 'select', method: 'selectOption()', notes: '' }
      ],
      customComponents: []
    },
    routeConfig: {
      mode: 'history',
      urlPattern: '/pages/...',
      waitMethod: 'waitForURL()'
    },
    selectors: [
      '标准 CSS 选择器',
      '推荐使用 data-testid'
    ]
  }
};

/**
 * 生成测试模板
 */
function generateTestTemplate(framework: string): string {
  const config = FRAMEWORK_CONFIGS[framework] || FRAMEWORK_CONFIGS['h5'];

  return `/**
 * E2E 测试示例
 * 框架：${config.name}
 * ${config.description}
 *
 * 生成时间：${new Date().toISOString().split('T')[0]}
 */

import { test, expect, Page } from '@playwright/test';

// ========== 配置信息（根据实际项目填写） ==========
const BASE_URL = 'http://localhost:5173'; // 开发服务器端口
const API_BASE = 'http://localhost:3000/api';

// ========== 辅助函数 ==========

/**
 * 模拟登录（如果需要）
 */
async function mockLogin(page: Page, options?: { deviceId?: string; isAdmin?: boolean }) {
  const { deviceId = 'test-device-001', isAdmin = false } = options || {};

  await page.addInitScript((data) => {
    localStorage.setItem('deviceId', data.deviceId);
    localStorage.setItem('userInfo', JSON.stringify({
      deviceId: data.deviceId,
      isAdmin: data.isAdmin,
      lastLogin: new Date().toISOString()
    }));
  }, { deviceId, isAdmin });
}

// ========== 测试用例 ==========

test.describe('测试套件名称', () => {

  test.beforeEach(async ({ page }) => {
    // 每个测试前执行
    await page.goto('/');
  });

  test('测试场景 1：描述你的测试目标', async ({ page }) => {
    // 测试步骤 1
    await expect(page.locator('[data-testid="some-element"]')).toBeVisible();

    // 测试步骤 2
    // ${config.eventConfig.clickMethod}
    await page.locator('[data-testid="button"]').${config.eventConfig.clickEvent === 'touchstart' ? 'dispatchEvent("touchstart")' : 'click()'}();

    // 测试步骤 3
    // ${config.eventConfig.inputMethod}
    await page.locator('[data-testid="input"]').fill('测试内容');

    // 测试步骤 4
    // ${config.routeConfig.waitMethod}
    await page.waitForURL(/.*/);

    // 断言
    await expect(page.locator('[data-testid="result"]')).toContainText('预期结果');
  });

  test('测试场景 2：带登录的测试', async ({ page }) => {
    // 模拟登录
    await mockLogin(page);

    // 测试逻辑
    // ...
  });
});

// ========== 框架特定提示 ==========
/*
对于 ${config.name} 框架，请注意以下几点：

1. 事件模拟：
   ${config.eventConfig.notes.map(n => '- ' + n).join('\\n   ')}

2. 组件测试方法：
${config.componentConfig.formComponents.map(c => `   - ${c.name}: ${c.method}${c.notes ? ' (' + c.notes + ')' : ''}`).join('\\n')}

3. 路由等待：
   - 路由模式：${config.routeConfig.mode}
   - URL 格式：${config.routeConfig.urlPattern}
   - 等待方法：${config.routeConfig.waitMethod}

4. 选择器建议：
   ${config.selectors.map(s => '- ' + s).join('\\n   ')}
*/
`;
}

/**
 * 主函数
 */
function main(): void {
  console.log('\\n📋 测试模板生成器\\n');
  console.log(`框架：${frameworkArg}`);
  console.log(`输出：${outputArg || 'stdout'}\\n`);

  // 列出支持的框架
  if (frameworkArg === 'list' || !FRAMEWORK_CONFIGS[frameworkArg]) {
    console.log('支持的框架：\\n');
    Object.entries(FRAMEWORK_CONFIGS).forEach(([key, config]) => {
      console.log(`  ${key.padEnd(12)} - ${config.description}`);
    });
    console.log('\\n使用示例:');
    console.log('  npx tsx generate-test-template.ts --framework=uni-app --output=tests/e2e/sample.spec.ts');
    console.log('  npx tsx generate-test-template.ts --framework=vue --output=tests/e2e/sample.spec.ts');
    console.log('  npx tsx generate-test-template.ts --framework=react --output=tests/e2e/sample.spec.ts');
    console.log('  npx tsx generate-test-template.ts --framework=h5 --output=tests/e2e/sample.spec.ts');
    return;
  }

  // 生成模板
  const template = generateTestTemplate(frameworkArg);

  // 输出
  if (outputArg) {
    const outputPath = path.resolve(outputArg);
    const outputDir = path.dirname(outputPath);

    // 创建目录
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, template);
    console.log(`✅ 模板已生成：${outputPath}`);
  } else {
    console.log(template);
  }
}

// 执行
main();
