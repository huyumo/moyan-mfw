#!/usr/bin/env node

/**
 * @fileoverview 文档链接修复工具
 * @description 批量修复 Markdown 文档中的失效链接
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
 * 路径映射规则（旧路径 -> 新路径）
 */
const pathMappings: Record<string, string> = {
  // 核心概念
  './核心概念/权限系统.md': './02-核心概念/权限系统.md',
  './核心概念/系统架构.md': './02-核心概念/系统架构.md',
  './核心概念/角色体系.md': './02-核心概念/角色体系.md',
  './核心概念/缓存策略.md': './02-核心概念/缓存策略.md',
  'core/permissions.md': './02-核心概念/权限系统.md',
  'core/roles.md': './02-核心概念/角色体系.md',
  'core/architecture.md': './02-核心概念/系统架构.md',
  './permissions.md': './权限系统.md',
  './roles.md': './角色体系.md',
  './architecture.md': './系统架构.md',

  // 数据库设计
  './数据库/数据库实体设计.md': './03-数据库设计/数据库实体设计.md',
  './数据库/数据库 ER 关系图.md': './03-数据库设计/数据库 ER 关系图.md',
  './数据库/数据库.md': './03-数据库设计/数据库 ER 关系图.md',
  'database/database-entities-design.md': './03-数据库设计/数据库实体设计.md',
  'database/database-er-diagram.md': './03-数据库设计/数据库 ER 关系图.md',
  '../数据库/数据库实体设计.md': '../03-数据库设计/数据库实体设计.md',
  '../数据库/数据库 ER 关系图.md': '../03-数据库设计/数据库 ER 关系图.md',
  '../数据库/数据库': '../03-数据库设计/数据库 ER 关系图.md',
  '../docs/database/database-entities-design.md': '../03-数据库设计/数据库实体设计.md',

  // 业务流程
  './流程/权限分配流程.md': './04-业务流程/权限分配流程.md',
  './流程/权限池配置流程.md': './04-业务流程/权限池配置流程.md',
  './流程/权限计算规则.md': './04-业务流程/权限计算规则.md',
  './流程/用户登录流程.md': './04-业务流程/用户登录流程.md',
  './流程/系统初始化流程.md': './04-业务流程/系统初始化流程.md',
  './流程/开发者模式.md': './04-业务流程/开发者模式.md',
  'flows/permission-assignment.md': './04-业务流程/权限分配流程.md',
  'flows/permission-pool-setup.md': './04-业务流程/权限池配置流程.md',
  'flows/permission-calculation-rules.md': './04-业务流程/权限计算规则.md',
  'flows/user-login-flow.md': './04-业务流程/用户登录流程.md',
  'flows/system-initialization.md': './04-业务流程/系统初始化流程.md',
  'flows/developer-mode.md': './04-业务流程/开发者模式.md',

  // 页面设计
  './页面/应用类型管理页面.md': './05-页面设计/应用类型管理页面.md',
  './页面/应用实例管理页面.md': './05-页面设计/应用实例管理页面.md',
  './页面/成员管理页面.md': './05-页面设计/成员管理页面.md',
  './页面/角色管理页面.md': './05-页面设计/角色管理页面.md',
  './页面/权限管理页面.md': './05-页面设计/权限管理页面.md',
  './页面/PC 权限管理页面.md': './05-页面设计/PC 权限管理页面.md',
  'pages/app-type-management.md': './05-页面设计/应用类型管理页面.md',
  'pages/app-management.md': './05-页面设计/应用实例管理页面.md',
  'pages/role-management.md': './05-页面设计/角色管理页面.md',
  'pages/member-management.md': './05-页面设计/成员管理页面.md',
  'pages/permission-management.md': './05-页面设计/权限管理页面.md',

  // API 接口
  './接口/API': './06-API 接口/API 接口索引.md',
  './接口/审计日志设计.md': './06-API 接口/审计日志设计.md',
  './接口/错误码定义.md': './06-API 接口/错误码定义.md',
  './06-API': './06-API 接口/API 接口索引.md',
  '../06-API': '../06-API 接口/API 接口索引.md',
  './PC': './05-页面设计/PC 权限管理页面.md',
  'api/api-index.md': './API 接口索引.md',
  'api/types.md': './统一类型定义.md',
  'api/error-codes.md': './错误码定义.md',
  'api/auth-api.md': './认证接口.md',
  'api/user-api.md': './用户接口.md',
  'api/app-type-api.md': './应用类型接口.md',
  'api/app-api.md': './应用接口.md',
  'api/role-api.md': './角色接口.md',
  'api/member-api.md': './成员接口.md',
  'api/permission-api.md': './权限接口.md',
  'api/audit-log-design.md': './审计日志设计.md',

  // UI 规范
  './UI 规范/异常状态 UI 规范.md': './07-UI 规范/异常状态 UI 规范.md',
  'ui/ui-error-states.md': './07-UI 规范/异常状态 UI 规范.md',
  './07-UI': './07-UI 规范/异常状态 UI 规范.md',

  // 开发指南
  './开发指南/典型应用场景.md': './08-开发指南/典型应用场景.md',
  './开发指南/错误处理流程.md': './08-开发指南/错误处理流程.md',
  'guides/use-cases.md': './08-开发指南/典型应用场景.md',
  'guides/error-handling.md': './08-开发指南/错误处理流程.md',

  // 追踪文档
  './追踪文档/REVIEW-ISSUES.md': './09-追踪文档/问题追踪.md',
  './追踪文档/CHANGELOG.md': './09-追踪文档/变更日志.md',
  'tracking/REVIEW-ISSUES.md': './09-追踪文档/问题追踪.md',
  'tracking/CHANGELOG.md': './09-追踪文档/变更日志.md',

  // 其他
  'README.md': './README.md',
  'glossary.md': './术语表.md',
  'infrastructure-detailed-design-index.md': './基础设施详细设计索引.md',
  'infrastructure-detailed-design.md': './基础设施详细设计.md',

  // 框架规范
  '../../docs/03-框架规范/统一开发规范.md': '../../../03-框架规范/统一开发规范.md',
  '../../统一开发规范.md': '../../../03-框架规范/统一开发规范.md',
  '../docs/api/permission-api.md': '../06-API 接口/权限接口.md',
  '../docs/api/api-index.md': '../06-API 接口/API 接口索引.md',
  '../docs/core/roles.md': '../02-核心概念/角色体系.md',
  '../docs/core/permissions.md': '../02-核心概念/权限系统.md',
  '../docs/core/architecture.md': '../02-核心概念/系统架构.md',
  '../docs/product-overview.md': '../01-产品概述/产品概述.md',
  '../接口/审计日志设计.md': '../06-API 接口/审计日志设计.md',
  '../接口/错误码定义.md': '../06-API 接口/错误码定义.md',
  '../UI': '../07-UI 规范/异常状态 UI 规范.md',

  // 从子目录引用的同级目录（旧格式 -> 新格式）
  '../页面/角色管理页面.md': '../05-页面设计/角色管理页面.md',
  '../页面/应用类型管理页面.md': '../05-页面设计/应用类型管理页面.md',
  '../页面/应用实例管理页面.md': '../05-页面设计/应用实例管理页面.md',
  '../页面/成员管理页面.md': '../05-页面设计/成员管理页面.md',
  '../页面/权限管理页面.md': '../05-页面设计/权限管理页面.md',
  '../页面/PC 权限管理页面.md': '../05-页面设计/PC 权限管理页面.md',
  '../流程/权限分配流程.md': '../04-业务流程/权限分配流程.md',
  '../流程/权限池配置流程.md': '../04-业务流程/权限池配置流程.md',
  '../流程/权限计算规则.md': '../04-业务流程/权限计算规则.md',
  '../流程/用户登录流程.md': '../04-业务流程/用户登录流程.md',
  '../流程/系统初始化流程.md': '../04-业务流程/系统初始化流程.md',
  '../流程/开发者模式.md': '../04-业务流程/开发者模式.md',
  '../../页面/角色管理页面.md': '../../05-页面设计/角色管理页面.md',
  '../../页面/应用类型管理页面.md': '../../05-页面设计/应用类型管理页面.md',
  '../../页面/应用实例管理页面.md': '../../05-页面设计/应用实例管理页面.md',
  '../../页面/成员管理页面.md': '../../05-页面设计/成员管理页面.md',
  '../../页面/权限管理页面.md': '../../05-页面设计/权限管理页面.md',
  '../../流程/权限分配流程.md': '../../04-业务流程/权限分配流程.md',
  '../../流程/权限池配置流程.md': '../../04-业务流程/权限池配置流程.md',
  '../../流程/权限计算规则.md': '../../04-业务流程/权限计算规则.md',
  '../../流程/用户登录流程.md': '../../04-业务流程/用户登录流程.md',
  '../../流程/系统初始化流程.md': '../../04-业务流程/系统初始化流程.md',
  '../../流程/开发者模式.md': '../../04-业务流程/开发者模式.md',
  '../../数据库/数据库实体设计.md': '../../03-数据库设计/数据库实体设计.md',
  '../../数据库/数据库 ER 关系图.md': '../../03-数据库设计/数据库 ER 关系图.md',
  '../../数据库/数据库': '../../03-数据库设计/数据库 ER 关系图.md',
  '../../06-API': '../../06-API 接口/API 接口索引.md',
  '../../04-业务流程/权限分配流程.md': '../../04-业务流程/权限分配流程.md',
  '../../04-业务流程/权限池配置流程.md': '../../04-业务流程/权限池配置流程.md',
  '../../04-业务流程/权限计算规则.md': '../../04-业务流程/权限计算规则.md',
  '../../04-业务流程/用户登录流程.md': '../../04-业务流程/用户登录流程.md',
  '../../04-业务流程/系统初始化流程.md': '../../04-业务流程/系统初始化流程.md',
  '../../04-业务流程/开发者模式.md': '../../04-业务流程/开发者模式.md',
  '../../05-页面设计/应用类型管理页面.md': '../../05-页面设计/应用类型管理页面.md',
  '../../05-页面设计/应用实例管理页面.md': '../../05-页面设计/应用实例管理页面.md',
  '../../05-页面设计/成员管理页面.md': '../../05-页面设计/成员管理页面.md',
  '../../05-页面设计/角色管理页面.md': '../../05-页面设计/角色管理页面.md',
  '../../05-页面设计/权限管理页面.md': '../../05-页面设计/权限管理页面.md',
  '../../06-API 接口/API 接口索引.md': '../../06-API 接口/API 接口索引.md',
  '../../06-API 接口/审计日志设计.md': '../../06-API 接口/审计日志设计.md',
  '../../06-API 接口/错误码定义.md': '../../06-API 接口/错误码定义.md',
  '../../02-核心概念/权限系统.md': '../../02-核心概念/权限系统.md',
  '../../02-核心概念/系统架构.md': '../../02-核心概念/系统架构.md',
  '../../02-核心概念/角色体系.md': '../../02-核心概念/角色体系.md',
  '../../07-UI 规范/异常状态 UI 规范.md': '../../07-UI 规范/异常状态 UI 规范.md',
  '../../08-开发指南/典型应用场景.md': '../../08-开发指南/典型应用场景.md',
  '../../08-开发指南/错误处理流程.md': '../../08-开发指南/错误处理流程.md',
  '../../09-追踪文档/问题追踪.md': '../../09-追踪文档/问题追踪.md',

  // 从子目录（如 01-产品概述/）引用父目录同级内容的路径
  './02-核心概念/权限系统.md': '../02-核心概念/权限系统.md',
  './02-核心概念/系统架构.md': '../02-核心概念/系统架构.md',
  './02-核心概念/角色体系.md': '../02-核心概念/角色体系.md',
  './03-数据库设计/数据库实体设计.md': '../03-数据库设计/数据库实体设计.md',
  './03-数据库设计/数据库 ER 关系图.md': '../03-数据库设计/数据库 ER 关系图.md',
  './03-数据库设计/数据库': '../03-数据库设计/数据库 ER 关系图.md',
  './04-业务流程/权限分配流程.md': '../04-业务流程/权限分配流程.md',
  './04-业务流程/权限池配置流程.md': '../04-业务流程/权限池配置流程.md',
  './04-业务流程/权限计算规则.md': '../04-业务流程/权限计算规则.md',
  './04-业务流程/用户登录流程.md': '../04-业务流程/用户登录流程.md',
  './04-业务流程/系统初始化流程.md': '../04-业务流程/系统初始化流程.md',
  './04-业务流程/开发者模式.md': '../04-业务流程/开发者模式.md',
  './05-页面设计/应用类型管理页面.md': '../05-页面设计/应用类型管理页面.md',
  './05-页面设计/应用实例管理页面.md': '../05-页面设计/应用实例管理页面.md',
  './05-页面设计/成员管理页面.md': '../05-页面设计/成员管理页面.md',
  './05-页面设计/角色管理页面.md': '../05-页面设计/角色管理页面.md',
  './05-页面设计/权限管理页面.md': '../05-页面设计/权限管理页面.md',
  './06-API 接口/API 接口索引.md': '../06-API 接口/API 接口索引.md',
  './06-API 接口/审计日志设计.md': '../06-API 接口/审计日志设计.md',
  './06-API 接口/错误码定义.md': '../06-API 接口/错误码定义.md',
  './07-UI 规范/异常状态 UI 规范.md': '../07-UI 规范/异常状态 UI 规范.md',
  './08-开发指南/典型应用场景.md': '../08-开发指南/典型应用场景.md',
  './08-开发指南/错误处理流程.md': '../08-开发指南/错误处理流程.md',
  './09-追踪文档/问题追踪.md': '../09-追踪文档/问题追踪.md',
  './09-追踪文档/变更日志.md': '../09-追踪文档/变更日志.md',
  './统一类型定义.md': '../06-API 接口/统一类型定义.md',
  './错误码定义.md': '../06-API 接口/错误码定义.md',
  './认证接口.md': '../06-API 接口/认证接口.md',
  './用户接口.md': '../06-API 接口/用户接口.md',
  './应用类型接口.md': '../06-API 接口/应用类型接口.md',
  './应用接口.md': '../06-API 接口/应用接口.md',
  './角色接口.md': '../06-API 接口/角色接口.md',
  './成员接口.md': '../06-API 接口/成员接口.md',
  './权限接口.md': '../06-API 接口/权限接口.md',
  './审计日志设计.md': '../06-API 接口/审计日志设计.md',
  './典型应用场景.md': '../08-开发指南/典型应用场景.md',
  './错误处理流程.md': '../08-开发指南/错误处理流程.md',
  './REVIEW-ISSUES.md': '../09-追踪文档/问题追踪.md',

  // ../06-API 开头的路径（API 接口目录引用）
  '../06-API/': '../06-API 接口/API 接口索引.md',
  '../06-API/app-type-api.md': '../06-API 接口/应用类型接口.md',
  '../06-API/app-api.md': '../06-API 接口/应用接口.md',
  '../06-API/role-api.md': '../06-API 接口/角色接口.md',
  '../06-API/member-api.md': '../06-API 接口/成员接口.md',
  '../06-API/permission-api.md': '../06-API 接口/权限接口.md',
  '../06-API/user-api.md': '../06-API 接口/用户接口.md',
  '../06-API/auth-api.md': '../06-API 接口/认证接口.md',
  '../06-API/error-codes.md': '../06-API 接口/错误码定义.md',
  '../06-API/types.md': '../06-API 接口/统一类型定义.md',
  '../06-API/审计日志设计.md': '../06-API 接口/审计日志设计.md',
  '../06-API/错误码定义.md': '../06-API 接口/错误码定义.md',
  '../06-API/统一类型定义.md': '../06-API 接口/统一类型定义.md',
  '../06-API/应用类型接口.md': '../06-API 接口/应用类型接口.md',
  '../06-API/应用接口.md': '../06-API 接口/应用接口.md',
  '../06-API/角色接口.md': '../06-API 接口/角色接口.md',
  '../06-API/成员接口.md': '../06-API 接口/成员接口.md',
  '../06-API/权限接口.md': '../06-API 接口/权限接口.md',
  '../06-API/用户接口.md': '../06-API 接口/用户接口.md',
  '../06-API/认证接口.md': '../06-API 接口/认证接口.md',
  '../06-API/用户接口 - 搜索用户': '../06-API 接口/用户接口.md',

  // ../07-UI
  '../07-UI': '../07-UI 规范/异常状态 UI 规范.md',

  // ../核心概念/ 等旧路径
  '../核心概念/权限系统.md': '../02-核心概念/权限系统.md',
  '../核心概念/系统架构.md': '../02-核心概念/系统架构.md',
  '../核心概念/角色体系.md': '../02-核心概念/角色体系.md',
  '../04-业务流程/用户登录流程.md': '../04-业务流程/用户登录流程.md',
  '../04-业务流程/权限分配流程.md': '../04-业务流程/权限分配流程.md',

  // 其他路径
  '../infrastructure-detailed-design-index.md': '../基础设施详细设计索引.md',
};

/**
 * 获取要修复的文件列表
 */
function getFilesToFix(): string[] {
  const files: string[] = [];

  // 扫描多个文档目录
  const docsDirs = [
    'docs/01-业务需求/01-基础设施',
    'docs/02-团队/01-团队规范',
    'docs/03-框架规范/01-前端规范',
    'docs/03-框架规范/02-后端规范',
  ];

  function scanDirectory(dir: string) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules') {
          continue;
        }
        if (entry.isDirectory()) {
          scanDirectory(path.join(dir, entry.name));
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          files.push(path.join(dir, entry.name));
        }
      }
    } catch (err) {
      // 忽略错误
    }
  }

  for (const docsDir of docsDirs) {
    const resolvedDir = path.resolve(ROOT_DIR, docsDir);
    if (fs.existsSync(resolvedDir)) {
      scanDirectory(resolvedDir);
    }
  }

  return files;
}

/**
 * 修复文件中的链接
 */
function fixFile(filePath: string): { fixed: number; skipped: number } {
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;
  let fixedCount = 0;
  let skippedCount = 0;

  // 匹配 [text](path) 格式的链接
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

  content = content.replace(linkRegex, (match, text, linkPath) => {
    // 跳过外部链接和特殊链接
    if (linkPath.startsWith('http://') || linkPath.startsWith('https://') ||
        linkPath.startsWith('mailto:') || linkPath.startsWith('#') ||
        linkPath === '') {
      return match;
    }

    // 检查是否需要修复
    if (pathMappings[linkPath]) {
      const newPath = pathMappings[linkPath];
      console.log(`  ${colors.green}修复${colors.reset}: ${linkPath} -> ${newPath}`);
      fixedCount++;
      return `[${text}](${newPath})`;
    }

    // 检查是否是带锚点的链接
    const pathParts = linkPath.split('#');
    if (pathParts.length > 1 && pathMappings[pathParts[0]]) {
      const newPath = pathMappings[pathParts[0]] + '#' + pathParts.slice(1).join('#');
      console.log(`  ${colors.green}修复${colors.reset}: ${linkPath} -> ${newPath}`);
      fixedCount++;
      return `[${text}](${newPath})`;
    }

    skippedCount++;
    return match;
  });

  // 只有内容发生变化时才写入
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
  }

  return { fixed: fixedCount, skipped: skippedCount };
}

/**
 * 主函数
 */
function main() {
  console.log(`${colors.cyan}文档链接修复工具${colors.reset}`);
  console.log('批量修复 Markdown 文档中的失效链接...\n');

  const files = getFilesToFix();

  if (files.length === 0) {
    console.log(`${colors.yellow}[WARNING]${colors.reset} 未找到要修复的文件`);
    process.exit(0);
  }

  console.log(`处理 ${files.length} 个文件...\n`);

  let totalFixed = 0;
  let totalSkipped = 0;
  let filesWithFixes = 0;

  for (const filePath of files) {
    const relativePath = path.relative(ROOT_DIR, filePath);
    const result = fixFile(filePath);

    if (result.fixed > 0) {
      filesWithFixes++;
      console.log(`${colors.blue}[${path.basename(filePath)}]${colors.reset} ${colors.gray}(${relativePath})${colors.reset}`);
      console.log(`  修复 ${result.fixed} 个链接\n`);
      totalFixed += result.fixed;
    }
    totalSkipped += result.skipped;
  }

  // 汇总报告
  console.log('\n' + '='.repeat(50));
  console.log(`${colors.cyan}[SUMMARY]${colors.reset}`);
  console.log(`  处理文件：${files.length} 个`);
  console.log(`  修复文件：${filesWithFixes} 个`);
  console.log(`  ${colors.green}修复链接：${totalFixed}${colors.reset}`);
  console.log(`  跳过链接：${totalSkipped}（无需修复或未知映射）`);

  if (totalFixed > 0) {
    console.log(`\n${colors.green}✅ 完成！已修复 ${totalFixed} 个链接${colors.reset}`);
  } else {
    console.log(`\n${colors.yellow}⚠️  没有需要修复的链接${colors.reset}`);
  }
}

main();
