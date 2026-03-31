#!/usr/bin/env node

/**
 * @fileoverview 类型定义检查器
 * @description 检查 Vue/TSX 组件的类型定义是否完整（Props/Emits/Expose）
 *
 * @example
 * ```bash
 * npm run validate:types
 * npm run validate:types -- --component MfwFormCard
 * npm run validate:types -- --dir packages/base-frontend/src/components
 * ```
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// ANSI 颜色代码
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

/**
 * 解析命令行参数
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    dir: null,
    file: null,
    component: null,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dir' && args[i + 1]) {
      config.dir = args[i + 1];
      i++;
    } else if (args[i] === '--file' && args[i + 1]) {
      config.file = args[i + 1];
      i++;
    } else if (args[i] === '--component' && args[i + 1]) {
      config.component = args[i + 1];
      i++;
    } else if (args[i] === '--help' || args[i] === '-h') {
      config.help = true;
    }
  }

  return config;
}

/**
 * 显示帮助信息
 */
function showHelp() {
  console.log(`
${colors.cyan}类型定义检查器${colors.reset}
检查 Vue/TSX 组件的类型定义是否完整（Props/Emits/Expose）

用法:
  npm run validate:types [选项]

选项:
  --dir <目录>           检查指定目录下的所有组件
  --file <文件>         检查指定的组件文件
  --component <名称>    检查指定名称的组件
  --help, -h            显示帮助信息

示例:
  npm run validate:types
  npm run validate:types -- --dir packages/base-frontend/src/components
  npm run validate:types -- --component MfwFormCard
`);
}

/**
 * 获取要检查的文件列表
 */
function getFilesToCheck(config: { dir: string | null; file: string | null; component: string | null }): string[] {
  const files: string[] = [];

  if (config.file) {
    const filePath = path.resolve(ROOT_DIR, config.file);
    if (fs.existsSync(filePath)) {
      files.push(filePath);
    } else {
      console.error(`${colors.red}[ERROR]${colors.reset} 文件不存在：${config.file}`);
    }
  } else if (config.component) {
    // 查找指定名称的组件
    const componentDirs = findComponentDirs(config.component);
    componentDirs.forEach(dir => scanComponentDirectory(dir, files));
  } else if (config.dir) {
    const dirPath = path.resolve(ROOT_DIR, config.dir);
    if (fs.existsSync(dirPath)) {
      scanDirectory(dirPath, files);
    } else {
      console.error(`${colors.red}[ERROR]${colors.reset} 目录不存在：${config.dir}`);
    }
  } else {
    // 默认检查前端组件目录
    const componentDirs = [
      'packages/base-frontend/src/components',
      'packages/base-frontend/src/business-components',
      'packages/moyan-mfw-frontend/src/components',
      'src/components',
    ];

    for (const compDir of componentDirs) {
      const resolvedDir = path.resolve(ROOT_DIR, compDir);
      if (fs.existsSync(resolvedDir)) {
        scanDirectory(resolvedDir, files);
      }
    }
  }

  // 过滤出 Vue 和 TSX 组件文件
  return files.filter(f => {
    const basename = path.basename(f);
    return (
      f.endsWith('.vue') ||
      f.endsWith('.tsx') ||
      f.endsWith('.ts')
    );
  });
}

/**
 * 查找指定名称的组件目录
 */
function findComponentDirs(componentName: string): string[] {
  const results: string[] = [];
  const searchName = componentName.toLowerCase();

  // 可能的组件目录
  const possibleDirs = [
    'packages/base-frontend/src/components',
    'packages/base-frontend/src/business-components',
    'packages/moyan-mfw-frontend/src/components',
    'src/components',
  ];

  for (const baseDir of possibleDirs) {
    const resolvedDir = path.resolve(ROOT_DIR, baseDir);
    if (fs.existsSync(resolvedDir)) {
      // 查找匹配的组件目录（如 mfw-form-card）
      const dirs = fs.readdirSync(resolvedDir, { withFileTypes: true });
      for (const dir of dirs) {
        if (dir.isDirectory() && dir.name.toLowerCase().includes(searchName)) {
          results.push(path.join(resolvedDir, dir.name));
        }
      }
    }
  }

  return results;
}

/**
 * 递归扫描目录
 */
function scanDirectory(dir: string, files: string[]) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') {
        continue;
      }
      if (entry.isDirectory()) {
        scanDirectory(path.join(dir, entry.name), files);
      } else if (entry.isFile() && (entry.name.endsWith('.vue') || entry.name.endsWith('.tsx'))) {
        files.push(path.join(dir, entry.name));
      }
    }
  } catch (err) {
    // 忽略权限错误
  }
}

/**
 * 扫描组件目录（查找 Index.vue 或同名文件）
 */
function scanComponentDirectory(componentDir: string, files: string[]) {
  try {
    const entries = fs.readdirSync(componentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && (entry.name === 'Index.vue' || entry.name === 'index.tsx' || entry.name.endsWith('.tsx'))) {
        files.push(path.join(componentDir, entry.name));
      }
    }
  } catch (err) {
    // 忽略错误
  }
}

/**
 * 检查 Vue 组件的类型定义
 */
function checkVueComponent(content: string, filePath: string) {
  const errors: Array<{ line: number; message: string }> = [];
  const warnings: Array<{ line: number; message: string }> = [];

  // 检查 script setup lang="ts"
  const hasScriptSetupTs = /<script\s+setup\s+lang=["']ts["']\s*>/.test(content);
  const hasScriptTs = /<script\s+lang=["']ts["']\s*>/.test(content) || /<script\s+setup\s*>/.test(content);

  if (!hasScriptSetupTs && !hasScriptTs) {
    errors.push({
      line: getScriptLineNumber(content),
      message: '组件未使用 TypeScript（缺少 <script setup lang="ts">）',
    });
  }

  // 检查是否有 defineProps 类型定义
  const hasDefineProps = /defineProps\s*<\s*\{[\s\S]*?\}\s*>/.test(content) ||
                         /defineProps\s*\(\s*\{/.test(content) ||
                         /interface\s+\w+Props/.test(content);

  if (!hasDefineProps) {
    // 检查是否有 props 选项
    const hasPropsOption = /props\s*:\s*\{/.test(content);
    if (hasPropsOption) {
      warnings.push({
        line: getScriptLineNumber(content),
        message: 'Props 使用运行时定义，建议使用 defineProps<Type>() 获得更好类型推断',
      });
    }
  }

  // 检查是否有 defineEmits 类型定义
  const hasDefineEmits = /defineEmits\s*<\s*\{[\s\S]*?\}\s*>/.test(content) ||
                         /defineEmits\s*\(\s*\{/.test(content) ||
                         /interface\s+\w+Emits/.test(content);

  if (!hasDefineEmits && /@/m.test(content) && /emit/.test(content)) {
    warnings.push({
      line: getScriptLineNumber(content),
      message: '组件有 emit 调用但未定义 emits 类型',
    });
  }

  // 检查是否有 any 类型
  const anyMatches = [...content.matchAll(/\bany\b/g)];
  for (const match of anyMatches) {
    // 排除注释中的 any
    const beforeMatch = content.substring(0, match.index);
    const lastCommentStart = Math.max(
      beforeMatch.lastIndexOf('//'),
      beforeMatch.lastIndexOf('/*')
    );
    const lastCommentEnd = beforeMatch.lastIndexOf('*/');

    if (lastCommentStart > lastCommentEnd) {
      continue; // 在注释中，跳过
    }

    const lineNum = content.substring(0, match.index).split('\n').length;
    warnings.push({
      line: lineNum,
      message: '使用了 any 类型，建议使用更具体的类型',
    });
  }

  // 检查是否有 JSDoc 注释（对复杂组件）
  const hasJSDoc = /\/\*\*[\s\S]*?\*\//.test(content);
  const componentSize = content.split('\n').length;

  if (componentSize > 100 && !hasJSDoc) {
    warnings.push({
      line: 1,
      message: '大型组件（>100 行）建议添加 JSDoc 注释说明用途',
    });
  }

  return { errors, warnings };
}

/**
 * 检查 TSX 组件的类型定义
 */
function checkTSXComponent(content: string, filePath: string) {
  const errors: Array<{ line: number; message: string }> = [];
  const warnings: Array<{ line: number; message: string }> = [];

  // 检查是否使用 defineComponent
  const hasDefineComponent = /defineComponent\s*\(/.test(content);

  if (!hasDefineComponent) {
    warnings.push({
      line: 1,
      message: 'TSX 组件建议使用 defineComponent() 包装以获得完整类型推断',
    });
  }

  // 检查是否有从 types.ts 导入 Props 类型
  const hasPropsImport = /import\s+type\s+\{[^}]*\w+Props[^}]*\}\s+from\s+['"]\.\/types['"]/.test(content) ||
                         /import\s+\{[^}]*\w+Props[^}]*\}\s+from\s+['"]\.\/types['"]/.test(content);

  // 检查 Props 类型定义（可以在文件内或从 types.ts 导入）
  const hasPropsInterface = /interface\s+\w+Props\s+extends\s+(?:ComponentProps|DefineComponent)/.test(content) ||
                            /interface\s+\w+Props/.test(content) ||
                            /type\s+\w+Props\s*=/.test(content);

  // 检查是否有文件内定义的类似 Props 的接口（如 PopupItem、OpenPopupOptions 等）
  const hasInlinePropsLike = /export\s+(?:interface|type)\s+\w+(?:Props|Options|Config)[\s\S]*?\{/.test(content);

  if (!hasPropsInterface && !hasPropsImport && !hasInlinePropsLike) {
    errors.push({
      line: 1,
      message: '缺少 Props 类型定义接口',
    });
  }

  // 检查是否有从 types.ts 导入 Emits 类型
  const hasEmitsImport = /import\s+type\s+\{[^}]*\w+Emits[^}]*\}\s+from\s+['"]\.\/types['"]/.test(content) ||
                         /import\s+\{[^}]*\w+Emits[^}]*\}\s+from\s+['"]\.\/types['"]/.test(content);

  // 检查 Emits 类型定义（可以在文件内或从 types.ts 导入）
  const hasEmitsInterface = /interface\s+\w+Emits/.test(content) ||
                            /type\s+\w+Emits/.test(content) ||
                            /emits\s*:\s*\{/.test(content);

  // 检查是否有文件内定义的类似 Emits 的接口
  const hasInlineEmitsLike = /export\s+(?:interface|type)\s+\w+(?:Emits|Listeners|Events)[\s\S]*?\{/.test(content);

  if (!hasEmitsInterface && !hasEmitsImport && !hasInlineEmitsLike && /emit|on[A-Z]/.test(content)) {
    warnings.push({
      line: 1,
      message: '组件有事件发射但未定义 Emits 类型',
    });
  }

  // 检查 Expose 类型定义
  const hasExpose = /expose\s*\(/.test(content) || /defineExpose/.test(content);
  const hasExposeType = /interface\s+\w+Expose/.test(content) ||
                        /type\s+\w+Expose/.test(content);

  if (hasExpose && !hasExposeType) {
    warnings.push({
      line: 1,
      message: '组件使用了 expose 但未定义 Expose 类型',
    });
  }

  // 检查是否有 any 类型
  const anyMatches = [...content.matchAll(/\bany\b/g)];
  for (const match of anyMatches) {
    const beforeMatch = content.substring(0, match.index);
    const lastCommentStart = Math.max(
      beforeMatch.lastIndexOf('//'),
      beforeMatch.lastIndexOf('/*')
    );
    const lastCommentEnd = beforeMatch.lastIndexOf('*/');

    if (lastCommentStart > lastCommentEnd) {
      continue;
    }

    const lineNum = content.substring(0, match.index).split('\n').length;
    warnings.push({
      line: lineNum,
      message: '使用了 any 类型，建议使用更具体的类型',
    });
  }

  return { errors, warnings };
}

/**
 * 获取 script 标签所在行号
 */
function getScriptLineNumber(content: string): number {
  const match = content.match(/<script/);
  if (match) {
    return content.substring(0, match.index).split('\n').length;
  }
  return 1;
}

/**
 * 检查单个文件
 */
function checkFile(filePath: string) {
  const errors: Array<{ line: number; message: string }> = [];
  const warnings: Array<{ line: number; message: string }> = [];

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const basename = path.basename(filePath);

    let result: { errors: typeof errors; warnings: typeof warnings };

    if (basename.endsWith('.vue')) {
      result = checkVueComponent(content, filePath);
    } else if (basename.endsWith('.tsx')) {
      result = checkTSXComponent(content, filePath);
    } else if (basename.endsWith('.ts')) {
      // 检查类型定义文件
      result = checkTypeFile(content, filePath);
    } else {
      return { errors: [], warnings: [] };
    }

    errors.push(...result.errors);
    warnings.push(...result.warnings);
  } catch (err) {
    warnings.push({
      line: 0,
      message: `读取失败：${err.message}`,
    });
  }

  return { errors, warnings };
}

/**
 * 检查类型定义文件（types.ts）
 */
function checkTypeFile(content: string, filePath: string) {
  const errors: Array<{ line: number; message: string }> = [];
  const warnings: Array<{ line: number; message: string }> = [];

  // 检查导出的接口是否有注释
  const exportInterfaceMatches = [...content.matchAll(/export\s+interface\s+(\w+)/g)];
  for (const match of exportInterfaceMatches) {
    const beforeMatch = content.substring(0, match.index);
    const lastLine = beforeMatch.split('\n').pop() || '';

    // 检查是否有 JSDoc 注释
    const jsdocRegex = /\/\*\*[\s\S]*?\*\//g;
    let hasJSDoc = false;
    let jsdocMatch;

    while ((jsdocMatch = jsdocRegex.exec(beforeMatch)) !== null) {
      const afterJSDoc = beforeMatch.substring(jsdocMatch.index + jsdocMatch[0].length);
      const lines = afterJSDoc.split('\n').filter(l => l.trim() !== '');
      if (lines.length > 0 && lines[lines.length - 1].trim() === '') {
        // JSDoc 后有空白行，可能是接口定义
        const nextLines = content.substring(match.index).split('\n').slice(0, 3);
        if (nextLines.some(l => l.includes(match[1]))) {
          hasJSDoc = true;
          break;
        }
      }
    }

    // 简化检查：只要接口前有注释就行
    const linesBefore = beforeMatch.split('\n');
    if (linesBefore.length > 0) {
      const prevLine = linesBefore[linesBefore.length - 1].trim();
      if (prevLine.endsWith('*/') || prevLine.startsWith('//')) {
        hasJSDoc = true;
      }
    }

    if (!hasJSDoc) {
      const lineNum = beforeMatch.split('\n').length;
      warnings.push({
        line: lineNum,
        message: `导出的接口 ${match[1]} 缺少 JSDoc 注释`,
      });
    }
  }

  return { errors, warnings };
}

/**
 * 主函数
 */
function main() {
  const config = parseArgs();

  if (config.help) {
    showHelp();
    process.exit(0);
  }

  console.log(`${colors.cyan}类型定义检查器${colors.reset}`);
  console.log('检查 Vue/TSX 组件的类型定义完整性...\n');

  const files = getFilesToCheck(config);

  if (files.length === 0) {
    console.log(`${colors.yellow}[WARNING]${colors.reset} 未找到要检查的组件文件`);
    console.log(`提示：确保组件位于以下目录之一：`);
    console.log(`  - packages/base-frontend/src/components`);
    console.log(`  - packages/moyan-mfw-frontend/src/components`);
    console.log(`  - src/components`);
    process.exit(0);
  }

  console.log(`检查 ${files.length} 个组件文件...\n`);

  let totalErrors = 0;
  let totalWarnings = 0;
  let filesWithIssues = 0;

  for (const filePath of files) {
    const relativePath = path.relative(ROOT_DIR, filePath);
    const result = checkFile(filePath);

    if (result.errors.length > 0 || result.warnings.length > 0) {
      filesWithIssues++;
      console.log(`${colors.blue}[${path.basename(filePath)}]${colors.reset} ${colors.gray}(${relativePath})${colors.reset}`);

      for (const error of result.errors) {
        console.log(
          `  ${colors.red}[ERROR]${colors.reset} 第${error.line}行 - ${error.message}`
        );
      }

      for (const warning of result.warnings) {
        console.log(
          `  ${colors.yellow}[WARNING]${colors.reset} 第${warning.line}行 - ${warning.message}`
        );
      }

      totalErrors += result.errors.length;
      totalWarnings += result.warnings.length;
    }
  }

  // 汇总报告
  console.log('\n' + '='.repeat(50));
  console.log(`${colors.cyan}[SUMMARY]${colors.reset}`);
  console.log(`  检查文件：${files.length} 个`);
  console.log(`  发现问题：${filesWithIssues} 个文件`);
  console.log(`  ${colors.red}错误：${totalErrors}${colors.reset}`);
  console.log(`  ${colors.yellow}警告：${totalWarnings}${colors.reset}`);

  if (totalErrors === 0 && totalWarnings === 0) {
    console.log(`\n${colors.green}✅ 所有类型定义检查通过！${colors.reset}`);
    process.exit(0);
  } else if (totalErrors === 0) {
    console.log(`\n${colors.yellow}⚠️  有 ${totalWarnings} 个警告，建议优化${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`\n${colors.red}❌ 发现 ${totalErrors} 个错误，请修复后重新检查${colors.reset}`);
    process.exit(1);
  }
}

main();
