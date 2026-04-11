/**
 * 架构设计上下文 Hook（通用版）
 *
 * 目的：为 Tech-Architect 注入架构设计上下文
 * 从项目配置文件中读取技术栈信息，如果没有配置则提供通用模板
 *
 * 配置文件路径:
 * - .claude/harness/config/tech-stack.json (项目特定配置)
 * - .claude/harness/config/tech-stack.example.json (示例配置)
 */

import * as fs from 'fs';
import * as path from 'path';

interface HookResult {
  passed: boolean;
  message: string;
  warnings: string[];
  errors: string[];
  data?: {
    techStack: string[];
    architectureDecisions: string[];
    techDebt: string[];
    performanceRequirements: string[];
    securityRequirements: string[];
    projectStructure: string[];
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
    path.join(projectRoot, '.claude', 'harness', 'config', 'tech-stack.json'),
    path.join(projectRoot, '.claude', 'harness', 'config', 'tech-stack.example.json')
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

function buildTechStack(config: any): string[] {
  if (!config?.techStack) {
    return [
      '⚠️ 未配置技术栈 - 请在 .claude/harness/config/tech-stack.json 中定义',
      'ℹ️ 参考示例：.claude/harness/config/tech-stack.example.json'
    ];
  }

  const lines: string[] = [];
  const ts = config.techStack;

  if (ts.language) {
    lines.push(`✅ ${ts.language.name} ${ts.language.version || ''} - ${ts.language.description || '主要开发语言'}`);
  }

  if (ts.runtime) {
    lines.push(`✅ ${ts.runtime.name} ${ts.runtime.version || ''} - ${ts.runtime.description || '运行时环境'}`);
  }

  if (ts.frameworks?.length) {
    ts.frameworks.forEach((fw: any) => {
      const optional = fw.optional ? '（可选）' : '';
      lines.push(`✅ ${fw.name} ${fw.version || ''} - ${fw.description || '框架'}${optional}`);
    });
  }

  if (ts.databases?.length) {
    ts.databases.forEach((db: any) => {
      const type = db.type ? ` (${db.type})` : '';
      lines.push(`✅ ${db.name} ${db.version || ''} - ${db.description || '数据库'}${type}`);
    });
  }

  if (ts.testing?.length) {
    ts.testing.forEach((test: any) => {
      lines.push(`✅ ${test.name} ${test.version || ''} - ${test.description || '测试工具'}`);
    });
  }

  if (ts.tooling?.length) {
    ts.tooling.forEach((tool: any) => {
      lines.push(`✅ ${tool.name} - ${tool.description || '工具'}`);
    });
  }

  return lines;
}

function buildArchitectureDecisions(config: any): string[] {
  if (!config?.architectureDecisions?.length) {
    return [
      'ℹ️ 未配置架构决策记录',
      '📝 建议记录重要技术决策，例如：',
      '   - API 设计风格（RESTful/GraphQL）',
      '   - 认证方式（JWT/Session）',
      '   - 架构模式（分层/微服务）'
    ];
  }

  return config.architectureDecisions.map((adr: any) => {
    const statusIcon = adr.status === 'accepted' ? '✅' : adr.status === 'deprecated' ? '⚠️' : 'ℹ️';
    return `${statusIcon} ${adr.id}: ${adr.title} - ${adr.description || adr.decision}`;
  });
}

function buildTechDebt(config: any): string[] {
  if (!config?.techDebt?.length) {
    return [
      '✅ 暂无已知技术债务',
      'ℹ️ 发现技术债务时请在配置文件中记录'
    ];
  }

  return config.techDebt.map((td: any) => {
    const priorityIcon = td.priority === 'critical' ? '🔴' : td.priority === 'high' ? '🟠' : td.priority === 'medium' ? '🟡' : '🟢';
    return `${priorityIcon} ${td.id}: ${td.description} [${td.priority || 'medium'}]`;
  });
}

function buildProjectStructure(config: any): string[] {
  if (!config?.projectStructure) {
    return [
      'ℹ️ 未配置项目结构',
      '📁 常见结构：src/, tests/, docs/, scripts/'
    ];
  }

  return Object.entries(config.projectStructure).map(([dir, desc]: [string, any]) => {
    return `📁 ${dir}/ - ${desc}`;
  });
}

export async function run(args: string[]): Promise<HookResult> {
  const result: HookResult = {
    passed: true,
    message: '',
    warnings: [],
    errors: []
  };

  const projectRoot = findProjectRoot();
  const { config, path: configPath } = loadConfig(projectRoot);

  const techStack = buildTechStack(config);
  const architectureDecisions = buildArchitectureDecisions(config);
  const techDebt = buildTechDebt(config);
  const projectStructure = buildProjectStructure(config);

  // 通用性能和安全的最低要求
  const performanceRequirements = [
    '📊 定义性能指标（响应时间、吞吐量）',
    '📊 实现缓存策略',
    '📊 大数据集分页',
    '📊 监控关键性能指标'
  ];

  const securityRequirements = [
    '🔒 敏感数据加密传输（HTTPS）',
    '🔒 密码安全哈希（bcrypt/argon2）',
    '🔒 输入验证（白名单）',
    '🔒 实现认证和授权',
    '🔒 记录安全相关日志',
    '🔒 定期依赖安全审计'
  ];

  if (config) {
    result.message = `🏗️ 架构设计上下文已加载（来自 ${path.relative(projectRoot, configPath!)})`;
  } else {
    result.message = '🏗️ 架构设计上下文（通用模板 - 建议配置技术栈）';
    result.warnings.push(
      '未找到技术栈配置文件，已加载通用模板',
      '建议复制 .claude/harness/config/tech-stack.example.json 为 tech-stack.json 并根据项目修改'
    );
  }

  result.data = {
    techStack,
    architectureDecisions,
    techDebt,
    performanceRequirements,
    securityRequirements,
    projectStructure,
    configLoaded: !!config,
    configPath: configPath ? path.relative(projectRoot, configPath) : null
  };

  // 写入上下文文件
  const outputDir = path.join(projectRoot, '.claude', 'harness', 'output');
  fs.mkdirSync(outputDir, { recursive: true });

  const contextFile = path.join(outputDir, 'architect-context.json');
  fs.writeFileSync(contextFile, JSON.stringify(result.data, null, 2), 'utf-8');

  // 写入 markdown 格式
  const mdFile = path.join(outputDir, 'architect-context.md');
  const mdContent = `# 架构设计上下文

${config ? `> 配置文件：${path.relative(projectRoot, configPath!)}` : '> ⚠️ 未找到配置文件，使用通用模板'}

## 技术栈
${techStack.map(t => `- ${t}`).join('\n')}

## 架构决策记录
${architectureDecisions.map(d => `- ${d}`).join('\n')}

## 技术债务
${techDebt.map(d => `- ${d}`).join('\n')}

## 项目结构
${projectStructure.map(s => `- ${s}`).join('\n')}

## 性能要求
${performanceRequirements.map(r => `- ${r}`).join('\n')}

## 安全要求
${securityRequirements.map(r => `- ${r}`).join('\n')}
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
