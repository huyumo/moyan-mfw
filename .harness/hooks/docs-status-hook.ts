/**
 * 文档状态检查 Hook
 *
 * 目的：检测文档是否超过审查周期，提醒文档维护者及时审查
 *
 * 检查项：
 * 1. 扫描 docs/ 目录下所有 .md 文件的 Front Matter
 * 2. 检查 status 字段（active/deprecated/archived）
 * 3. 检查 lastReview 字段和 reviewCycle
 * 4. 识别超过审查周期未更新的文档
 *
 * @returns {Promise<HookResult>}
 */

import * as fs from 'fs';
import * as path from 'path';

interface HookResult {
  passed: boolean;
  message: string;
  warnings: string[];
  errors: string[];
  data?: {
    totalDocs: number;
    activeDocs: number;
    deprecatedDocs: number;
    archivedDocs: number;
    overdueDocs: Array<{
      filePath: string;
      lastReview: string;
      reviewCycle: string;
      daysOverdue: number;
    }>;
  };
}

interface DocFrontMatter {
  status?: 'draft' | 'active' | 'deprecated' | 'archived';
  lastReview?: string;
  reviewCycle?: 'monthly' | 'quarterly' | 'semiannually' | 'yearly' | 'never';
  replacedBy?: string;
}

/**
 * 审查周期对应的天数
 */
const REVIEW_CYCLE_DAYS: Record<string, number> = {
  monthly: 30,
  quarterly: 90,
  semiannually: 180,
  yearly: 365,
  never: Infinity
};

/**
 * 向上查找项目根目录
 */
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

/**
 * 解析 YAML Front Matter
 */
function parseFrontMatter(content: string): DocFrontMatter {
  const result: DocFrontMatter = {};
  const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

  if (!frontMatterMatch) {
    return result;
  }

  const frontMatterContent = frontMatterMatch[1];
  const lines = frontMatterContent.split('\n');

  for (const line of lines) {
    const match = line.match(/^(\w+):\s*(.+)$/);
    if (match) {
      const key = match[1];
      const value = match[2].trim();
      result[key as keyof DocFrontMatter] = value as any;
    }
  }

  return result;
}

/**
 * 计算文档是否超过审查周期
 */
function checkReviewOverdue(lastReview: string, reviewCycle: string): { overdue: boolean; daysOverdue: number } {
  const lastReviewDate = new Date(lastReview);
  const today = new Date();
  const cycleDays = REVIEW_CYCLE_DAYS[reviewCycle] || REVIEW_CYCLE_DAYS.quarterly;

  const daysSinceReview = Math.floor((today.getTime() - lastReviewDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysOverdue = daysSinceReview - cycleDays;

  return {
    overdue: daysOverdue > 0,
    daysOverdue: Math.max(0, daysOverdue)
  };
}

/**
 * 扫描文档并统计状态
 */
function scanDocs(projectRoot: string): HookResult['data'] & { totalDocs: number } {
  const result = {
    totalDocs: 0,
    activeDocs: 0,
    deprecatedDocs: 0,
    archivedDocs: 0,
    overdueDocs: [] as Array<{
      filePath: string;
      lastReview: string;
      reviewCycle: string;
      daysOverdue: number;
    }>
  };

  const docsDir = path.join(projectRoot, 'docs');
  if (!fs.existsSync(docsDir)) {
    return result;
  }

  function scanDir(dir: string) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        // 跳过 archived 目录
        if (file === 'archived') {
          continue;
        }
        scanDir(filePath);
      } else if (file.endsWith('.md')) {
        result.totalDocs++;
        const content = fs.readFileSync(filePath, 'utf-8');
        const frontMatter = parseFrontMatter(content);

        // 统计状态
        if (frontMatter.status === 'active') {
          result.activeDocs++;
        } else if (frontMatter.status === 'deprecated') {
          result.deprecatedDocs++;
        } else if (frontMatter.status === 'archived') {
          result.archivedDocs++;
        }

        // 检查审查周期
        if (frontMatter.status === 'active' && frontMatter.lastReview && frontMatter.reviewCycle) {
          const { overdue, daysOverdue } = checkReviewOverdue(frontMatter.lastReview, frontMatter.reviewCycle);
          if (overdue) {
            result.overdueDocs.push({
              filePath: filePath.replace(projectRoot + '/', ''),
              lastReview: frontMatter.lastReview,
              reviewCycle: frontMatter.reviewCycle,
              daysOverdue
            });
          }
        }
      }
    }
  }

  scanDir(docsDir);
  return result;
}

export async function run(args: string[]): Promise<HookResult> {
  const result: HookResult = {
    passed: true,
    message: '',
    warnings: [],
    errors: [],
    data: {
      totalDocs: 0,
      activeDocs: 0,
      deprecatedDocs: 0,
      archivedDocs: 0,
      overdueDocs: []
    }
  };

  const projectRoot = findProjectRoot();
  const stats = scanDocs(projectRoot);
  result.data = stats;

  // 构建消息
  result.message = `✅ 文档状态检查完成\n` +
    ` - 文档总数：${stats.totalDocs}\n` +
    ` - 活跃文档：${stats.activeDocs}\n` +
    ` - 废弃文档：${stats.deprecatedDocs}\n` +
    ` - 归档文档：${stats.archivedDocs}`;

  // 检查超期文档
  if (stats.overdueDocs.length > 0) {
    result.warnings.push(
      `⚠️ 发现 ${stats.overdueDocs.length} 篇文档超过审查周期：` +
      stats.overdueDocs.map(doc =>
        `\n   - ${doc.filePath}\n     上次审查：${doc.lastReview} | 周期：${doc.reviewCycle} | 超期：${doc.daysOverdue}天`
      ).join('')
    );
  }

  // 检查缺少 Front Matter 的活跃文档
  const missingFrontMatter: string[] = [];
  const docsDir = path.join(projectRoot, 'docs');

  function checkMissingFrontMatter(dir: string) {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        if (file === 'archived') continue;
        checkMissingFrontMatter(filePath);
      } else if (file.endsWith('.md') && file !== 'README.md') {
        const content = fs.readFileSync(filePath, 'utf-8');
        const frontMatter = parseFrontMatter(content);

        // 检查是否有 status 字段
        if (!frontMatter.status && !filePath.includes('04-会议纪要')) {
          missingFrontMatter.push(filePath.replace(projectRoot + '/', ''));
        }
      }
    }
  }

  checkMissingFrontMatter(docsDir);

  if (missingFrontMatter.length > 0 && missingFrontMatter.length <= 10) {
    result.warnings.push(
      `⚠️ 以下文档缺少 status 字段，建议添加 Front Matter：\n` +
      missingFrontMatter.slice(0, 10).map(f => `   - ${f}`).join('\n') +
      (missingFrontMatter.length > 10 ? `\n   ... 还有 ${missingFrontMatter.length - 10} 篇` : '')
    );
  }

  // 输出日志
  const logFile = path.join(projectRoot, '.harness', 'output', 'docs-status.log');
  fs.mkdirSync(path.dirname(logFile), { recursive: true });
  fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${result.message}\n`);
  if (result.warnings.length > 0) {
    fs.appendFileSync(logFile, `警告:\n${result.warnings.join('\n')}\n`);
  }

  return result;
}

// CLI 入口
const isMain = require.main === module;

if (isMain) {
  run(process.argv.slice(2))
    .then(result => {
      // 写入日志文件
      const projectRoot = findProjectRoot();
      const logFile = path.join(projectRoot, '.harness', 'output', 'docs-status.log');
      fs.mkdirSync(path.dirname(logFile), { recursive: true });
      fs.appendFileSync(logFile, `[${new Date().toISOString()}] CLI Output: ${JSON.stringify(result, null, 2)}\n`);

      process.exit(result.passed ? 0 : 1);
    })
    .catch(error => {
      const projectRoot = findProjectRoot();
      const logFile = path.join(projectRoot, '.harness', 'output', 'docs-status.log');
      fs.mkdirSync(path.dirname(logFile), { recursive: true });
      fs.appendFileSync(logFile, `[${new Date().toISOString()}] CLI Error: ${error.message}\n`);

      process.exit(1);
    });
}
