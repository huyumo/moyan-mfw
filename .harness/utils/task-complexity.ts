/**
 * 任务复杂度分析工具
 *
 * 提供统一的复杂任务检测逻辑，供多个 Hook 使用
 */

import { HOOK_CONFIG } from '../config/hook-config';

export interface TaskComplexityResult {
  isComplex: boolean;
  reasons: string[];
  detectedDomains: string[];
  pendingTaskCount: number;
  explicitMarkers: string[];
}

/**
 * 扩展的领域关键词定义（支持中英文）
 */
const DOMAIN_KEYWORDS: { [key: string]: string[] } = {
  backend: [
    // 中文
    '后端', '服务器', '数据库', '接口', 'API',
    // 技术栈
    'TypeScript', 'Node.js', 'Express', 'TypeORM', 'MySQL', 'SQL',
    'controller', 'service', 'repository', 'middleware', 'route',
    // 通用
    'server', 'database', 'endpoint', 'request', 'response',
    'backend', 'api', 'REST', 'GraphQL'
  ],
  frontend: [
    // 中文
    '前端', '页面', '组件', '样式', '界面', 'UI',
    // 技术栈
    'Vue', 'uni-app', 'React', 'Angular', 'Svelte',
    'CSS', 'HTML', 'JavaScript', 'TypeScript',
    'component', 'template', 'style', 'view', 'page',
    // 通用
    'frontend', 'ui', 'interface', 'render'
  ],
  testing: [
    // 中文
    '测试', '审查', 'QA', '质检', '验收',
    // 技术栈
    'E2E', 'Playwright', 'Cypress', 'Vitest', 'Jest',
    '单元测试', '集成测试', '端到端测试',
    'test', 'spec', 'assert', 'expect', 'describe', 'it',
    // 通用
    'testing', 'qa', 'quality', 'coverage', 'mock'
  ],
  documentation: [
    // 中文
    '文档', '说明', '手册', '指南', '教程',
    'API 文档', '部署文档', '用户手册', '技术文档',
    // 通用
    'document', 'doc', 'manual', 'guide', 'readme',
    'api', 'deployment', 'user', 'technical'
  ]
};

/**
 * 显式复杂任务标记
 */
const EXPLICIT_MARKERS = [
  '需要 spawn Agent',
  '需要多 Agent 协作',
  '并行处理',
  '多方对齐',
  '协调会议',
  '复杂任务',
  'E2E 测试',
  '全链路测试',
  '跨模块',
  '跨域协作'
];

/**
 * 任务类型到必需角色的映射
 */
export const TASK_TYPE_REQUIRED_ROLES: { [key: string]: string[] } = {
  'E2E 测试': ['code-reviewer-tester', 'backend-ts-node-dev', 'frontend-dev'],
  'API 开发': ['backend-ts-node-dev'],
  '前端开发': ['frontend-dev'],
  '文档编写': ['docs-architect'],
  '架构设计': ['tech-architect'],
  '代码审查': ['code-reviewer-tester']
};

/**
 * 判断任务是否为复杂任务
 */
export function analyzeTaskComplexity(taskContent: string): TaskComplexityResult {
  const reasons: string[] = [];
  const explicitMarkers: string[] = [];
  const detectedDomains: string[] = [];

  // 1. 检查显式标记
  for (const marker of EXPLICIT_MARKERS) {
    if (taskContent.includes(marker)) {
      explicitMarkers.push(marker);
      reasons.push(`检测到显式标记："${marker}"`);
    }
  }

  // 2. 检查待办任务数量（超过阈值视为复杂）
  const pendingTasks = taskContent.match(/- \[ \]/g);
  const pendingTaskCount = pendingTasks ? pendingTasks.length : 0;
  if (pendingTaskCount >= HOOK_CONFIG.taskComplexity.minPendingTasks) {
    reasons.push(`待办任务数量：${pendingTaskCount} 个（阈值：${HOOK_CONFIG.taskComplexity.minPendingTasks} 个）`);
  }

  // 3. 检查是否涉及多领域
  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    for (const keyword of keywords) {
      // 使用更精确的匹配（避免子串误匹配）
      const regex = new RegExp(`\\b${escapeRegex(keyword)}\\b`, 'i');
      if (regex.test(taskContent) || taskContent.includes(keyword)) {
        if (!detectedDomains.includes(domain)) {
          detectedDomains.push(domain);
        }
        break;
      }
    }
  }

  if (detectedDomains.length >= HOOK_CONFIG.taskComplexity.minDomains) {
    reasons.push(`涉及多领域：${detectedDomains.join('、')}`);
  }

  // 4. 检测任务类型
  const detectedTaskType = detectTaskType(taskContent);
  if (detectedTaskType && explicitMarkers.length === 0 && pendingTaskCount < 5 && detectedDomains.length < 2) {
    // 如果检测到特定任务类型但没有其他标记，也视为复杂任务
    reasons.push(`检测到任务类型：${detectedTaskType}`);
  }

  const isComplex = reasons.length > 0;

  return {
    isComplex,
    reasons,
    detectedDomains,
    pendingTaskCount,
    explicitMarkers
  };
}

/**
 * 检测任务类型
 */
export function detectTaskType(taskContent: string): string | null {
  for (const [taskType, keywords] of Object.entries(TASK_TYPE_REQUIRED_ROLES)) {
    if (taskContent.includes(taskType)) {
      return taskType;
    }
    // 检查相关关键词
    const typeKeywords = getTaskTypeKeywords(taskType);
    for (const keyword of typeKeywords) {
      if (taskContent.includes(keyword)) {
        return taskType;
      }
    }
  }
  return null;
}

/**
 * 获取任务类型的关联关键词
 */
function getTaskTypeKeywords(taskType: string): string[] {
  const keywordMap: { [key: string]: string[] } = {
    'E2E 测试': ['E2E', '端到端', 'Playwright', '浏览器自动化'],
    'API 开发': ['API', '接口', 'endpoint', 'route'],
    '前端开发': ['前端', '页面', '组件', 'UI', 'CSS'],
    '文档编写': ['文档', '说明', 'manual', 'guide'],
    '架构设计': ['架构', '设计', 'architecture', 'pattern'],
    '代码审查': ['审查', 'review', 'refactor', '优化']
  };
  return keywordMap[taskType] || [];
}

/**
 * 检测任务涉及的领域（独立函数，避免循环依赖）
 */
export function detectTaskDomains(taskContent: string): string[] {
  const detectedDomains: string[] = [];

  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${escapeRegex(keyword)}\\b`, 'i');
      if (regex.test(taskContent) || taskContent.includes(keyword)) {
        if (!detectedDomains.includes(domain)) {
          detectedDomains.push(domain);
        }
        break;
      }
    }
  }

  return detectedDomains;
}

/**
 * 获取任务类型所需的 Agent 角色
 */
export function getRequiredRolesForTask(taskContent: string): string[] {
  const requiredRoles: Set<string> = new Set();

  // 检测任务类型
  const taskType = detectTaskType(taskContent);
  if (taskType && TASK_TYPE_REQUIRED_ROLES[taskType]) {
    for (const role of TASK_TYPE_REQUIRED_ROLES[taskType]) {
      requiredRoles.add(role);
    }
  }

  // 如果涉及多个领域，添加对应领域的 Agent
  const detectedDomains = detectTaskDomains(taskContent);
  const domainRoleMap: { [key: string]: string } = {
    backend: 'backend-ts-node-dev',
    frontend: 'frontend-dev',
    testing: 'code-reviewer-tester',
    documentation: 'docs-architect'
  };

  for (const domain of detectedDomains) {
    if (domainRoleMap[domain]) {
      requiredRoles.add(domainRoleMap[domain]);
    }
  }

  // 复杂任务至少需要一个 reviewer
  if (requiredRoles.size >= 2 && !requiredRoles.has('code-reviewer-tester')) {
    requiredRoles.add('code-reviewer-tester');
  }

  return Array.from(requiredRoles);
}

/**
 * 转义正则表达式特殊字符
 */
function escapeRegex(str: string): string {
  return str.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&');
}

/**
 * 导出完整的领域关键词（供其他模块使用）
 */
export function getDomainKeywords(): { [key: string]: string[] } {
  return { ...DOMAIN_KEYWORDS };
}
