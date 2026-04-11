/**
 * 代码审查清单 Hook（通用版）
 *
 * 目的：为 Code-Reviewer-Tester 注入审查清单
 * 从项目配置文件中读取规范，如果没有配置则提供通用审查原则
 *
 * 配置文件路径:
 * - .harness/config/review.json (项目特定配置)
 * - .harness/config/review.example.json (示例配置)
 */

import * as fs from 'fs';
import * as path from 'path';

interface HookResult {
  passed: boolean;
  message: string;
  warnings: string[];
  errors: string[];
  data?: {
    securityChecklist: string[];
    performanceChecklist: string[];
    maintainabilityChecklist: string[];
    testingChecklist: string[];
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
    path.join(projectRoot, '.claude', 'harness', 'config', 'review.json'),
    path.join(projectRoot, '.claude', 'harness', 'config', 'review.example.json')
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
 * 通用安全性审查清单 - 不依赖特定技术栈
 */
const UNIVERSAL_SECURITY: string[] = [
  '🔒 [阻断] 无硬编码凭证（密码、API Key、Token）',
  '🔒 [阻断] 无 eval()、exec() 等危险函数调用',
  '🔒 [阻断] 所有用户输入已验证（类型、长度、格式、范围）',
  '🔒 [阻断] 所有输出已编码（防止 XSS/注入）',
  '🔒 [阻断] 使用参数化查询或 ORM（防止注入攻击）',
  '🔒 [阻断] 敏感数据加密存储',
  '🔒 无原型污染风险（__proto__、prototype）',
  '🔒 文件上传有类型/大小限制',
  '🔒 认证/授权逻辑完整',
  '🔒 实现速率限制防止暴力攻击',
  '🔒 错误信息不泄露敏感信息'
];

/**
 * 通用性能审查清单
 */
const UNIVERSAL_PERFORMANCE: string[] = [
  '⚡ 无 N+1 查询问题',
  '⚡ 查询字段有适当索引',
  '⚡ 缓存策略合理（缓存命中率）',
  '⚡ 资源及时释放（连接、文件句柄）',
  '⚡ 大数据集已分页/分批处理',
  '⚡ 避免同步阻塞操作',
  '⚡ 异步操作有错误处理',
  '⚡ 循环内无重复计算/查询',
  '⚡ 图片/资源已优化'
];

/**
 * 通用可维护性审查清单
 */
const UNIVERSAL_MAINTAINABILITY: string[] = [
  '📖 函数职责单一（SRP）',
  '📖 函数长度合理（建议 < 50 行）',
  '📖 变量/函数命名清晰达意',
  '📖 无魔术数字（使用命名常量）',
  '📖 错误处理完整',
  '📖 日志记录适当（级别、内容）',
  '📖 注释解释"为什么"而非"是什么"',
  '📖 无死代码/注释代码',
  '📖 类型定义完整',
  '📖 公共 API 有文档注释',
  '📖 遵循 DRY 原则（无重复代码）'
];

/**
 * 通用测试审查清单
 */
const UNIVERSAL_TESTING: string[] = [
  '✅ 单元测试覆盖率达标（建议 ≥ 80%）',
  '✅ 关键路径 100% 覆盖',
  '✅ 边界条件测试（最小值、最大值、空值）',
  '✅ 错误场景测试（异常、超时、失败）',
  '✅ 集成测试覆盖主要流程',
  '✅ 测试用例独立可运行',
  '✅ 测试命名清晰描述场景',
  '✅ Mock 外部依赖（API、数据库、文件系统）'
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

  // 从配置加载或使用通用清单
  const securityChecklist = config?.security?.checklist || UNIVERSAL_SECURITY;
  const performanceChecklist = config?.performance?.checklist || UNIVERSAL_PERFORMANCE;
  const maintainabilityChecklist = config?.maintainability?.checklist || UNIVERSAL_MAINTAINABILITY;
  const testingChecklist = config?.testing?.checklist || UNIVERSAL_TESTING;

  if (config) {
    result.message = `📝 代码审查清单已加载（来自 ${path.relative(projectRoot, configPath!)})`;
  } else {
    result.message = '📝 代码审查清单（通用原则 - 建议配置项目特定规范）';
    result.warnings.push(
      '未找到审查配置文件，已加载通用审查清单',
      '建议创建 .harness/config/review.json 定义项目特定规范'
    );
  }

  result.data = {
    securityChecklist,
    performanceChecklist,
    maintainabilityChecklist,
    testingChecklist,
    configLoaded: !!config,
    configPath: configPath ? path.relative(projectRoot, configPath) : null
  };

  // 写入清单文件
  const outputDir = path.join(projectRoot, '.harness', 'output');
  fs.mkdirSync(outputDir, { recursive: true });

  const checklistFile = path.join(outputDir, 'review-checklist.json');
  fs.writeFileSync(checklistFile, JSON.stringify(result.data, null, 2), 'utf-8');

  // 写入 markdown 格式
  const mdFile = path.join(outputDir, 'review-checklist.md');
  const mdContent = `# 代码审查清单

${config ? `> 配置文件：${path.relative(projectRoot, configPath!)}` : '> ℹ️ 未找到配置文件，使用通用审查清单'}

## 安全性检查
${securityChecklist.map((item: string) => `- ${item}`).join('\n')}

## 性能检查
${performanceChecklist.map((item: string) => `- ${item}`).join('\n')}

## 可维护性检查
${maintainabilityChecklist.map((item: string) => `- ${item}`).join('\n')}

## 测试检查
${testingChecklist.map((item: string) => `- ${item}`).join('\n')}

---

## 审查结论

- [ ] **批准** - 代码符合所有标准，可以合并
- [ ] **有条件批准** - 需要小修改，不需要重新审查
- [ ] **需要修改** - 存在阻断问题，修复后需要重新审查

### 审查意见

\`\`\`
在此记录具体审查意见...
\`\`\`
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
