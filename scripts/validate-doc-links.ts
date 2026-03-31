#!/usr/bin/env node

/**
 * @fileoverview 文档链接检查器
 * @description 检查 Markdown 文档中的内部链接是否有效
 *
 * @example
 * ```bash
 * npm run validate:links
 * npm run validate:links -- --dir docs/03-框架规范
 * npm run validate:links -- --file docs/02-团队/01-团队规范/01-团队章程.md
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
};

/**
 * 解析命令行参数
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    dir: null,
    file: null,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dir' && args[i + 1]) {
      config.dir = args[i + 1];
      i++;
    } else if (args[i] === '--file' && args[i + 1]) {
      config.file = args[i + 1];
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
${colors.cyan}文档链接检查器${colors.reset}
检查 Markdown 文档中的内部链接是否有效

用法:
  npm run validate:links [选项]

选项:
  --dir <目录>    检查指定目录下的所有 Markdown 文件
  --file <文件>   检查指定的 Markdown 文件
  --help, -h      显示帮助信息

示例:
  npm run validate:links
  npm run validate:links -- --dir docs/03-框架规范
  npm run validate:links -- --file docs/02-团队/01-团队规范/01-团队章程.md
`);
}

/**
 * 获取要检查的文件列表
 */
function getFilesToCheck(config) {
  const files = [];

  if (config.file) {
    const filePath = path.resolve(ROOT_DIR, config.file);
    if (fs.existsSync(filePath)) {
      files.push(filePath);
    } else {
      console.error(`${colors.red}[ERROR]${colors.reset} 文件不存在：${config.file}`);
    }
  } else if (config.dir) {
    const dirPath = path.resolve(ROOT_DIR, config.dir);
    if (fs.existsSync(dirPath)) {
      scanDirectory(dirPath, files);
    } else {
      console.error(`${colors.red}[ERROR]${colors.reset} 目录不存在：${config.dir}`);
    }
  } else {
    // 默认检查 docs 和 .claude 目录
    scanDirectory(path.resolve(ROOT_DIR, 'docs'), files);
    scanDirectory(path.resolve(ROOT_DIR, '.claude'), files);
  }

  return files.filter(f => f.endsWith('.md'));
}

/**
 * 递归扫描目录
 */
function scanDirectory(dir, files) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') {
        continue;
      }
      if (entry.isDirectory()) {
        scanDirectory(path.join(dir, entry.name), files);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(path.join(dir, entry.name));
      }
    }
  } catch (err) {
    // 忽略权限错误
  }
}

/**
 * 提取 Markdown 文件中的链接
 */
function extractLinks(content) {
  const links = [];

  // 匹配 [text](path) 格式的链接
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;

  // 先移除所有代码块内容
  const contentWithoutCodeBlocks = content.replace(/```[\s\S]*?```/g, '');

  while ((match = linkRegex.exec(contentWithoutCodeBlocks)) !== null) {
    const lineNum = contentWithoutCodeBlocks.substring(0, match.index).split('\n').length;
    const linkPath = match[2].split(/[#]/)[0].trim(); // 移除锚点，去除首尾空格

    // 跳过外部链接和特殊链接
    if (linkPath.startsWith('http://') || linkPath.startsWith('https://') ||
        linkPath.startsWith('mailto:') || linkPath.startsWith('#') ||
        linkPath === '') {
      continue;
    }

    links.push({
      text: match[1],
      path: linkPath,
      line: lineNum,
    });
  }

  return links;
}

/**
 * 检查链接是否有效
 */
function checkLink(filePath, linkPath) {
  // 解析路径
  const fileDir = path.dirname(filePath);
  const resolvedPath = path.resolve(fileDir, linkPath);

  // 检查文件是否存在
  return fs.existsSync(resolvedPath);
}

/**
 * 检查单个文件
 */
function checkFile(filePath) {
  const errors = [];
  const warnings = [];

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const links = extractLinks(content);

    for (const link of links) {
      if (!checkLink(filePath, link.path)) {
        errors.push({
          ...link,
          message: `链接失效：\`${link.text}\`(${link.path})`,
        });
      }
    }
  } catch (err) {
    warnings.push({
      line: 0,
      message: `读取失败：${err.message}`,
    });
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

  console.log(`${colors.cyan}文档链接检查器${colors.reset}`);
  console.log('检查 Markdown 文档中的内部链接...\n');

  const files = getFilesToCheck(config);

  if (files.length === 0) {
    console.log(`${colors.yellow}[WARNING]${colors.reset} 未找到要检查的 Markdown 文件`);
    process.exit(0);
  }

  console.log(`检查 ${files.length} 个文件...\n`);

  let totalErrors = 0;
  let totalWarnings = 0;
  let filesWithErrors = 0;

  for (const filePath of files) {
    const relativePath = path.relative(ROOT_DIR, filePath);
    const result = checkFile(filePath);

    if (result.errors.length > 0 || result.warnings.length > 0) {
      filesWithErrors++;
      console.log(`${colors.yellow}[${path.basename(filePath)}]${colors.reset}`);

      for (const error of result.errors) {
        console.log(
          `  ${colors.red}[ERROR]${colors.reset} 第${error.line}行 - ${error.message}`
        );
      }

      for (const warning of result.warnings) {
        console.log(
          `  ${colors.yellow}[WARNING]${colors.reset} ${warning.message}`
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
  console.log(`  发现问题：${filesWithErrors} 个文件`);
  console.log(`  ${colors.red}错误：${totalErrors}${colors.reset}`);
  console.log(`  ${colors.yellow}警告：${totalWarnings}${colors.reset}`);

  if (totalErrors === 0 && totalWarnings === 0) {
    console.log(`\n${colors.green}✅ 所有链接检查通过！${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`\n${colors.red}❌ 发现 ${totalErrors} 个错误，请修复后重新检查${colors.reset}`);
    process.exit(1);
  }
}

main();
