/**
 * 前端开发指南 Hook（通用版）
 *
 * 目的：为 Frontend-Dev 注入前端开发指南
 * 从项目配置文件中读取规范，如果没有配置则提供通用原则
 *
 * 配置文件路径:
 * - .claude/harness/config/frontend.json (项目特定配置)
 * - .claude/harness/config/frontend.example.json (示例配置)
 */

import * as fs from 'fs';
import * as path from 'path';

interface HookResult {
  passed: boolean;
  message: string;
  warnings: string[];
  errors: string[];
  data?: {
    accessibilityStandards: string[];
    responsiveDesignGuidelines: string[];
    componentNamingConventions: string[];
    cssStyleGuidelines: string[];
    performanceOptimizations: string[];
    configLoaded: boolean;
    configPath: string | null;
  };
}

function findProjectRoot(): string {
  let currentDir = process.cwd();
  const maxDepth = 5;
  let depth = 0;

  while (depth < maxDepth) {
    if (fs.existsSync(path.join(currentDir, 'TASK.md'))) {
      return currentDir;
    }
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break;
    }
    currentDir = parentDir;
    depth++;
  }

  return process.cwd();
}

function loadConfig(projectRoot: string): { config: any | null; path: string | null } {
  const configPaths = [
    path.join(projectRoot, '.claude', 'harness', 'config', 'frontend.json'),
    path.join(projectRoot, '.claude', 'harness', 'config', 'frontend.example.json')
  ];

  for (const configPath of configPaths) {
    if (fs.existsSync(configPath)) {
      try {
        const content = fs.readFileSync(configPath, 'utf-8');
        return { config: JSON.parse(content), path: configPath };
      } catch (e) {
        continue;
      }
    }
  }

  return { config: null, path: null };
}

/**
 * 通用可访问性原则 - WCAG 2.1 AA 核心要求
 */
const UNIVERSAL_ACCESSIBILITY = [
  '♿ 所有图片必须有 alt 属性（装饰性图片用空 alt）',
  '♿ 表单控件必须有关联的 label',
  '♿ 颜色对比度至少 4.5:1 (文本), 3:1 (大文本)',
  '♿ 支持键盘导航（Tab 顺序合理，有焦点指示）',
  '♿ 使用语义化 HTML 标签 (header, nav, main, footer)',
  '♿ ARIA 属性仅在原生语义不足时使用',
  '♿ 动态内容变化需通知辅助技术',
  '♿ 提供跳过重复内容的链接'
];

/**
 * 通用响应式设计原则
 */
const UNIVERSAL_RESPONSIVE = [
  '📱 移动优先 (Mobile First) 设计策略',
  '📱 使用相对单位 (rem, em, %, vw/vh)',
  '📱 定义断点系统并一致使用',
  '📱 图片使用 max-width: 100%',
  '📱 避免固定宽度/高度容器',
  '📱 使用弹性布局 (Flexbox/Grid)',
  '📱 在真实设备上测试'
];

/**
 * 通用组件命名原则
 */
const UNIVERSAL_NAMING = [
  '📛 组件文件名：PascalCase (UserProfile.tsx)',
  '📛 组件/类名：PascalCase (function UserProfile)',
  '📛 函数/变量：camelCase (formatUserName)',
  '📛 常量：UPPER_SNAKE_CASE (MAX_ITEMS)',
  '📛 CSS 类名：kebab-case (user-profile__avatar)',
  '📛 测试文件：*.test.ext 或 *.spec.ext',
  '📛 类型定义：*.types.ts 或内置于组件'
];

/**
 * 通用 CSS/样式原则
 */
const UNIVERSAL_CSS = [
  '🎨 使用一致的样式方案（CSS Modules/Styled Components/Tailwind）',
  '🎨 避免 !important（除非绝对必要）',
  '🎨 限制嵌套深度不超过 3 层',
  '🎨 使用 CSS 变量管理主题色/间距',
  '🎨 遵循一致的命名约定（BEM/其他）',
  '🎨 定义设计 tokens（颜色/字体/间距）'
];

/**
 * 通用性能优化原则
 */
const UNIVERSAL_PERFORMANCE = [
  '⚡ 实现代码分割和懒加载',
  '⚡ 图片优化（合适格式、尺寸、懒加载）',
  '⚡ 避免不必要的渲染',
  '⚡ 虚拟滚动长列表',
  '⚡ 防抖/节流高频事件',
  '⚡ 预加载关键资源',
  '⚡ 减少 bundle 大小'
];

export async function run(args: string[]): Promise<HookResult> {
  const result: HookResult = {
    passed: true,
    message: '',
    warnings: [],
    errors: []
  };

  const projectRoot = findProjectRoot();
  const { config, path: configPath } = loadConfig(projectRoot);

  // 从配置加载或使用通用原则
  const accessibilityStandards = config?.accessibility?.requirements || UNIVERSAL_ACCESSIBILITY;
  const responsiveDesignGuidelines = config?.responsive?.guidelines || UNIVERSAL_RESPONSIVE;
  const componentNamingConventions = config?.naming?.conventions || UNIVERSAL_NAMING;
  const cssStyleGuidelines = config?.styling?.guidelines || UNIVERSAL_CSS;
  const performanceOptimizations = config?.performance?.optimizations || UNIVERSAL_PERFORMANCE;

  if (config) {
    result.message = `🎨 前端开发指南已加载（来自 ${path.relative(projectRoot, configPath!)})`;
  } else {
    result.message = '🎨 前端开发指南（通用原则 - 建议配置项目特定规范）';
    result.warnings.push(
      '未找到前端配置文件，已加载通用原则',
      '建议创建 .claude/harness/config/frontend.json 定义项目特定规范'
    );
  }

  result.data = {
    accessibilityStandards,
    responsiveDesignGuidelines,
    componentNamingConventions,
    cssStyleGuidelines,
    performanceOptimizations,
    configLoaded: !!config,
    configPath: configPath ? path.relative(projectRoot, configPath) : null
  };

  // 写入指南文件
  const outputDir = path.join(projectRoot, '.harness', 'output');
  fs.mkdirSync(outputDir, { recursive: true });

  const guidelinesFile = path.join(outputDir, 'frontend-guidelines.json');
  fs.writeFileSync(guidelinesFile, JSON.stringify(result.data, null, 2), 'utf-8');

  // 写入 markdown 格式
  const mdFile = path.join(outputDir, 'frontend-guidelines.md');
  const mdContent = `# 前端开发指南

${config ? `> 配置文件：${path.relative(projectRoot, configPath!)}` : '> ℹ️ 未找到配置文件，使用通用原则'}

## 可访问性标准
${accessibilityStandards.map((s: string) => `- ${s}`).join('\n')}

## 响应式设计规范
${responsiveDesignGuidelines.map((g: string) => `- ${g}`).join('\n')}

## 组件命名约定
${componentNamingConventions.map((c: string) => `- ${c}`).join('\n')}

## CSS/样式规范
${cssStyleGuidelines.map((g: string) => `- ${g}`).join('\n')}

## 性能优化
${performanceOptimizations.map((p: string) => `- ${p}`).join('\n')}
`;
  fs.writeFileSync(mdFile, mdContent, 'utf-8');

  return result;
}

const isMain = require.main === module;

if (isMain) {
  run(process.argv.slice(2))
    .then(result => {
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.passed ? 0 : 1);
    })
    .catch(error => {
      console.error(JSON.stringify({
        passed: false,
        message: `钩子执行失败：${error.message}`,
        errors: [error.message],
        warnings: []
      }, null, 2));
      process.exit(1);
    });
}
