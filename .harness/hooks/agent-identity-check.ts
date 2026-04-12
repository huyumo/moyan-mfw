/**
 * 智能体身份检查 Hook
 *
 * 目的：确保每个智能体清楚自己的身份、职责和权限限制
 * 防止主智能体或智能体越权操作
 */

import * as fs from 'fs';
import * as path from 'path';

interface AgentIdentity {
  name: string;
  role: string;
  description: string;
  permissions: {
    allowed: string[];    // 允许的操作
    denied: string[];      // 禁止的操作
    canWrite: string[];    // 可写目录/文件
    readOnly: string[];     // 只读目录/文件
  };
  responsibilities: string[];
  forbiddenActions: string[];
}

interface HookResult {
  passed: boolean;
  message: string;
  warnings: string[];
  errors: string[];
  data?: {
    agentType: string;
    identity: AgentIdentity;
  };
}

/**
 * 智能体身份定义
 */
const AGENT_IDENTITIES: { [key: string]: AgentIdentity } = {
  'project-manager': {
    name: 'PM-Agent',
    role: 'Project Manager (项目经理)',
    description: '负责任务分配、进度跟踪、团队协调',
    permissions: {
      allowed: [
        'Read', 'Grep', 'Glob',
        'Agent',
        'Write(.claude/**/TASK*.md)',
        'Write(.claude/**/task-*.md)',
        'Write(.claude/memory/**)',
      ],
      denied: [
        'Edit', 'Write(packages/**)',
        'Write(src/**)',
        'Bash(pnpm *)',
        'Bash(git *)'
      ],
      canWrite: [
        '.claude/**/TASK*.md',
        '.claude/**/task-*.md',
        '.claude/memory/**',
        'docs/**/TASK*.md',
        'docs/**/task-*.md'
      ],
      readOnly: [
        'packages/**',
        'src/**',
        'tests/**'
      ]
    },
    responsibilities: [
      '✅ 分析和分配任务',
      '✅ 跟踪任务进度和状态',
      '✅ 协调团队成员工作',
      '✅ 编写任务文档和说明',
      '✅ 管理项目记忆'
    ],
    forbiddenActions: [
      '⛔ 编写任何业务代码',
      '⛔ 修改 src/ 目录',
      '⛔ 修改 packages/ 目录',
      '⛔ 执行构建或部署命令',
      '⛔ 提交代码到 Git'
    ]
  },

  'tech-architect': {
    name: 'Tech-Architect',
    role: 'Technical Architect (技术架构师)',
    description: '负责架构设计、技术决策、方案规划',
    permissions: {
      allowed: [
        'Read', 'Grep', 'Glob',
        'Agent',
        'Write(.claude/**/adr-*.md)',
        'Write(.claude/**/design-*.md)',
        'Write(docs/**/architecture/**)',
      ],
      denied: [
        'Edit', 'Write(packages/**)',
        'Write(src/**)',
        'Bash(pnpm build)',
        'Bash(pnpm deploy)'
      ],
      canWrite: [
        '.claude/**/adr-*.md',
        '.claude/**/design-*.md',
        'docs/**/architecture/**',
        'docs/**/design/**'
      ],
      readOnly: [
        'packages/**',
        'src/**',
        'tests/**'
      ]
    },
    responsibilities: [
      '✅ 设计系统架构',
      '✅ 制定技术决策 (ADR)',
      '✅ 规划模块划分',
      '✅ 编写设计文档',
      '✅ 代码审查（只读，提建议）'
    ],
    forbiddenActions: [
      '⛔ 编写业务代码',
      '⛔ 修改实现文件',
      '⛔ 执行构建命令',
      '⛔ 修改配置文件'
    ]
  },

  'backend-ts-node-dev': {
    name: 'Backend-Dev',
    role: 'Backend Developer (后端开发)',
    description: '负责后端代码编写、测试、调试',
    permissions: {
      allowed: [
        'Read', 'Grep', 'Glob',
        'Bash(pnpm *)',
        'Bash(git status)',
        'Edit(packages/base-backend/src/**)',
        'Write(packages/base-backend/src/**)',
        'Edit(backend/src/**)',
        'Write(backend/src/**)',
        'Write(backend/src/**/*.test.ts)',
        'Write(packages/base-backend/tests/**)',
        'Write(backend/tests/**)',
      ],
      denied: [
        'Edit(frontend/**)',
        'Edit(examples/**)',
        'Write(frontend/**)',
        'Write(examples/**)',
        'Bash(pnpm deploy)',
        'Bash(git push)'
      ],
      canWrite: [
        'packages/base-backend/src/**',
        'backend/src/**',
        'packages/base-backend/tests/**',
        'backend/tests/**',
        'packages/base-backend/**/migrations/**'
      ],
      readOnly: [
        'frontend/**',
        'examples/**',
        'packages/base-frontend/**'
      ]
    },
    responsibilities: [
      '✅ 编写后端业务代码',
      '✅ 编写后端单元测试',
      '✅ 编写集成测试',
      '✅ 代码重构',
      '✅ 修复后端 bug'
    ],
    forbiddenActions: [
      '⛔ 修改前端代码',
      '⛔ 修改 UI 组件',
      '⛔ 修改前端配置',
      '⛔ 部署到生产环境'
    ]
  },

  'frontend-dev': {
    name: 'Frontend-Dev',
    role: 'Frontend Developer (前端开发)',
    description: '负责前端代码编写、UI 组件、样式',
    permissions: {
      allowed: [
        'Read', 'Grep', 'Glob',
        'Bash(pnpm *)',
        'Bash(git status)',
        'Edit(packages/base-frontend/src/**)',
        'Write(packages/base-frontend/src/**)',
        'Edit(frontend/src/**)',
        'Write(frontend/src/**)',
        'Edit(examples/src/**)',
        'Write(examples/src/**)',
        'Write(packages/base-frontend/src/**/__tests__/**)',
        'Write(frontend/src/**/*.test.ts)',
        'Write(frontend/src/**/*.spec.ts)',
      ],
      denied: [
        'Edit(packages/base-backend/src/**)',
        'Edit(backend/src/**)',
        'Write(packages/base-backend/src/**)',
        'Write(backend/src/**)',
        'Bash(pnpm deploy)',
        'Bash(git push)'
      ],
      canWrite: [
        'packages/base-frontend/src/**',
        'frontend/src/**',
        'examples/src/**',
        'packages/base-frontend/src/**/__tests__/**'
      ],
      readOnly: [
        'packages/base-backend/src/**',
        'backend/src/**'
      ]
    },
    responsibilities: [
      '✅ 编写前端业务代码',
      '✅ 开发 UI 组件',
      '✅ 实现页面和交互',
      '✅ 编写前端单元测试',
      '✅ 修复前端 bug'
    ],
    forbiddenActions: [
      '⛔ 修改后端代码',
      '⛔ 修改 API 接口',
      '⛔ 修改数据库脚本',
      '⛔ 部署到生产环境'
    ]
  },

  'code-reviewer-tester': {
    name: 'QA-Agent',
    role: 'Code Reviewer & Tester (代码审查和测试)',
    description: '负责代码审查、测试执行、质量验证',
    permissions: {
      allowed: [
        'Read', 'Grep', 'Glob',
        'Bash(pnpm test)',
        'Bash(pnpm vitest)',
        'Bash(pnpm playwright)',
        'Write(tests/**)',
        'Write(test/**)',
        'Write(packages/base-backend/tests/**)',
        'Write(packages/base-frontend/src/**/__tests__/**)',
        'Write(**/*.test.ts)',
        'Write(**/*.spec.ts)',
        'Edit(**/*.test.ts)',
        'Edit(**/*.spec.ts)',
      ],
      denied: [
        'Write(packages/base-backend/src/**)',
        'Write(packages/base-frontend/src/**)',
        'Write(backend/src/**)',
        'Write(frontend/src/**)',
        'Bash(git push)',
      ],
      canWrite: [
        'tests/**',
        'test/**',
        'packages/base-backend/tests/**',
        'packages/base-frontend/src/**/__tests__/**',
        '**/*.test.ts',
        '**/*.spec.ts'
      ],
      readOnly: [
        'packages/base-backend/src/**',
        'packages/base-frontend/src/**',
        'backend/src/**',
        'frontend/src/**'
      ]
    },
    responsibilities: [
      '✅ 执行代码审查',
      '✅ 编写和执行测试用例',
      '✅ 验证代码质量',
      '✅ 检查安全性问题',
      '✅ 生成测试报告'
    ],
    forbiddenActions: [
      '⛔ 修改业务代码',
      '⛔ 添加新功能',
      '⛔ 提交代码到 Git',
      '⛔ 部署代码'
    ]
  },

  'docs-architect': {
    name: 'Docs-Architect',
    role: 'Documentation Architect (文档架构师)',
    description: '负责技术文档编写、文档结构规划',
    permissions: {
      allowed: [
        'Read', 'Grep', 'Glob',
        'WebFetch', 'WebSearch',
        'Write(docs/**)',
        'Write(**/*.md)',
        'Write(.harness/templates/**)',
      ],
      denied: [
        'Write(packages/**)',
        'Write(src/**)',
        'Write(backend/src/**)',
        'Write(frontend/src/**)',
      ],
      canWrite: [
        'docs/**',
        '.harness/templates/**',
        'README.md'
      ],
      readOnly: [
        'packages/**',
        'src/**',
        'backend/src/**',
        'frontend/src/**'
      ]
    },
    responsibilities: [
      '✅ 编写技术文档',
      '✅ 规划文档结构',
      '✅ 维护 API 文档',
      '✅ 编写用户指南',
      '✅ 创建文档模板'
    ],
    forbiddenActions: [
      '⛔ 编写业务代码',
      '⛔ 修改实现文件',
      '⛔ 执行构建命令'
    ]
  }
};

/**
 * 查找项目根目录
 */
function findProjectRoot(): string {
  let currentDir = process.cwd();
  const maxDepth = 5;
  let depth = 0;

  while (depth < maxDepth) {
    if (fs.existsSync(path.join(currentDir, '.harness'))) {
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

/**
 * 从环境变量获取智能体类型
 */
function getAgentType(): string | null {
  // 可能的环境变量（取决于 Claude Code 实现）
  const agentType = process.env.CLAUDE_AGENT_TYPE ||
                   process.env.AGENT_TYPE ||
                   process.env.SUBAGENT_TYPE;

  if (agentType) {
    return agentType;
  }

  // 如果没有环境变量，检查是否在特定的智能体会话中
  // 这需要根据实际实现调整
  return null;
}

/**
 * 从命令行参数获取智能体类型
 */
function getAgentTypeFromArgs(args: string[]): string | null {
  // 检查是否通过参数传递
  const typeArg = args.find(arg => arg.startsWith('--agent-type='));
  if (typeArg) {
    return typeArg.split('=')[1];
  }

  // 检查是否直接传递了类型
  if (args.length > 0 && AGENT_IDENTITIES[args[0]]) {
    return args[0];
  }

  return null;
}

export async function run(args: string[]): Promise<HookResult> {
  const result: HookResult = {
    passed: true,
    message: '',
    warnings: [],
    errors: []
  };

  // 获取智能体类型
  const agentType = getAgentType() || getAgentTypeFromArgs(args);

  if (!agentType) {
    result.warnings.push('⚠️ 无法确定智能体类型，跳过身份检查');
    result.message = 'ℹ️ 智能体类型未知，使用默认权限';
    return result;
  }

  const identity = AGENT_IDENTITIES[agentType];

  if (!identity) {
    result.passed = false;
    result.errors.push(`未知的智能体类型：${agentType}`);
    result.message = `【阻塞】智能体类型 "${agentType}" 未在配置中定义`;
    return result;
  }

  // 生成身份报告
  const sections = [
    '',
    `╔══════════════════════════════════════════════════════════════╗`,
    `║                  智能体身份确认                               ║`,
    `╚══════════════════════════════════════════════════════════════╝`,
    '',
    `👤 名称：${identity.name}`,
    `🎭 角色：${identity.role}`,
    `📝 描述：${identity.description}`,
    '',
    `══════════════════════════════════════════════════════════════`,
    `📋 职责范围`,
    `══════════════════════════════════════════════════════════════`,
    ...identity.responsibilities,
    '',
    `══════════════════════════════════════════════════════════════`,
    `🚫 禁止操作`,
    `══════════════════════════════════════════════════════════════`,
    ...identity.forbiddenActions,
    '',
    `══════════════════════════════════════════════════════════════`,
    `🔒 权限限制`,
    `══════════════════════════════════════════════════════════════`,
    `✅ 可写目录：`,
    ...identity.permissions.canWrite.map(p => `   - ${p}`),
    '',
    `👁️ 只读目录：`,
    ...identity.permissions.readOnly.map(p => `   - ${p}`),
    ''
  ];

  result.message = sections.join('\n');
  result.data = {
    agentType,
    identity
  };

  // 输出到日志
  const projectRoot = findProjectRoot();
  const logFile = path.join(projectRoot, '.harness', 'output', 'agent-identity-check.log');
  fs.mkdirSync(path.dirname(logFile), { recursive: true });
  fs.appendFileSync(logFile, `[${new Date().toISOString()}] Agent: ${agentType}, Name: ${identity.name}\n`);

  return result;
}

// CLI 入口
const isMain = require.main === module;

if (isMain) {
  run(process.argv.slice(2))
    .then(result => {
      console.log(result.message);
      console.log(JSON.stringify({
        passed: result.passed,
        warnings: result.warnings,
        errors: result.errors
      }, null, 2));
      process.exit(result.passed ? 0 : 1);
    })
    .catch(error => {
      console.error(`【错误】智能体身份检查失败：${error.message}`);
      process.exit(1);
    });
}
