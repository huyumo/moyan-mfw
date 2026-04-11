/**
 * 后端开发安全规范 Hook（通用版）
 *
 * 目的：为 Backend-TS-Node-Dev 注入安全编码规范
 * 从项目配置文件中读取规范，如果没有配置则提供通用安全原则
 *
 * 配置文件路径:
 * - .claude/harness/config/backend.json (项目特定配置)
 * - .claude/harness/config/backend.example.json (示例配置)
 */

import * as fs from 'fs';
import * as path from 'path';

interface HookResult {
  passed: boolean;
  message: string;
  warnings: string[];
  errors: string[];
  data?: {
    securityGuidelines: string[];
    apiStandards: string[];
    databaseStandards: string[];
    loggingRequirements: string[];
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
    path.join(projectRoot, '.claude', 'harness', 'config', 'backend.json'),
    path.join(projectRoot, '.claude', 'harness', 'config', 'backend.example.json')
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
 * 通用安全原则 - 不依赖特定技术栈
 */
const UNIVERSAL_SECURITY_PRINCIPLES = [
  '🔒 验证所有用户输入（类型、长度、格式、范围）',
  '🔒 使用参数化查询或 ORM，禁止拼接查询字符串',
  '🔒 密码必须安全哈希（使用 bcrypt/argon2/scrypt）',
  '🔒 敏感数据使用 HTTPS 传输',
  '🔒 实现适当的认证和授权机制',
  '🔒 记录安全相关事件（登录、权限变更、敏感操作）',
  '🔒 禁止记录敏感信息（密码、token、完整卡号）',
  '🔒 实现速率限制防止暴力攻击',
  '🔒 使用安全的随机数生成器',
  '🔒 定期更新依赖并修复安全漏洞'
];

/**
 * 通用 API 设计原则 - 不依赖特定技术栈
 */
const UNIVERSAL_API_PRINCIPLES = [
  '📡 遵循一致的命名约定（RESTful/RPC/GraphQL）',
  '📡 使用标准状态码/响应码',
  '📡 统一错误响应格式',
  '📡 实现分页（大数据集）',
  '📡 API 版本控制',
  '📡 请求/响应日志记录',
  '📡 实现适当的超时和重试机制'
];

/**
 * 通用数据库原则 - 不依赖特定技术栈
 */
const UNIVERSAL_DATABASE_PRINCIPLES = [
  '💾 使用事务处理多表/多文档操作',
  '💾 实现连接池/资源池管理',
  '💾 为查询字段添加适当的索引',
  '💾 使用迁移脚本管理数据结构变更',
  '💾 敏感字段加密存储',
  '💾 实现软删除或数据归档机制',
  '💾 定期备份数据'
];

/**
 * 通用日志原则 - 不依赖特定技术栈
 */
const UNIVERSAL_LOGGING_PRINCIPLES = [
  '📝 记录所有认证相关操作（登录、登出、密码重置）',
  '📝 记录所有数据修改操作（创建、更新、删除）',
  '📝 记录异常和错误堆栈信息',
  '📝 禁止记录敏感信息（密码、token、完整卡号、CVV）',
  '📝 使用结构化日志（JSON 格式优先）',
  '📝 实现日志级别（error/warn/info/debug）',
  '📝 日志轮转和归档策略'
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
  const securityGuidelines = config?.security?.guidelines || UNIVERSAL_SECURITY_PRINCIPLES;
  const apiStandards = config?.api?.standards || UNIVERSAL_API_PRINCIPLES;
  const databaseStandards = config?.database?.standards || UNIVERSAL_DATABASE_PRINCIPLES;
  const loggingRequirements = config?.logging?.requirements || UNIVERSAL_LOGGING_PRINCIPLES;

  if (config) {
    result.message = `🔒 后端安全规范已加载（来自 ${path.relative(projectRoot, configPath!)})`;
  } else {
    result.message = '🔒 后端安全规范（通用原则 - 建议配置项目特定规范）';
    result.warnings.push(
      '未找到后端配置文件，已加载通用安全原则',
      '建议创建 .claude/harness/config/backend.json 定义项目特定规范'
    );
  }

  result.data = {
    securityGuidelines,
    apiStandards,
    databaseStandards,
    loggingRequirements,
    configLoaded: !!config,
    configPath: configPath ? path.relative(projectRoot, configPath) : null
  };

  // 写入规范文件
  const outputDir = path.join(projectRoot, '.harness', 'output');
  fs.mkdirSync(outputDir, { recursive: true });

  const guidelinesFile = path.join(outputDir, 'backend-guidelines.json');
  fs.writeFileSync(guidelinesFile, JSON.stringify(result.data, null, 2), 'utf-8');

  // 写入 markdown 格式
  const mdFile = path.join(outputDir, 'backend-guidelines.md');
  const mdContent = `# 后端开发规范

${config ? `> 配置文件：${path.relative(projectRoot, configPath!)}` : '> ℹ️ 未找到配置文件，使用通用安全原则'}

## 安全规范
${securityGuidelines.map((g: string) => `- ${g}`).join('\n')}

## API 设计规范
${apiStandards.map((s: string) => `- ${s}`).join('\n')}

## 数据库规范
${databaseStandards.map((s: string) => `- ${s}`).join('\n')}

## 日志要求
${loggingRequirements.map((r: string) => `- ${r}`).join('\n')}
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
